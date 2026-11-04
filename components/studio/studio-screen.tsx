"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eraser,
  ImagePlus,
  LayoutGrid,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Play,
  Settings,
  Type,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp, postJson } from "@/lib/app-state";
import {
  KINDS,
  MAX_VIDEO_SECONDS,
  defaultPlan,
  type ChatMessage,
  type EditKind,
  type EditPlan,
  type EditRoute,
  type MediaItem,
  type Stroke,
} from "@/lib/edit-types";
import { loadMedia, releaseMedia } from "@/lib/media";
import { useVoice } from "@/lib/use-voice";
import { LanguagePicker } from "@/components/language-picker";
import { ChatPanel } from "@/components/studio/chat-panel";
import { KindPicker } from "@/components/studio/kind-picker";
import { MediaSheet } from "@/components/studio/media-sheet";
import { PreviewCanvas, type PreviewHandle } from "@/components/studio/preview-canvas";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BRUSHES = ["#ffffff", "#ff5a4d", "#ffd23f", "#3ddc97", "#3fa9ff"];

interface ChatReply extends EditPlan {
  reply: string;
  suggestions: string[];
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function StudioScreen() {
  const { t, lang, mode, setMode, trackExport } = useApp();
  const router = useRouter();

  const [kind, setKind] = useState<EditKind | null>(null);
  const [route, setRoute] = useState<EditRoute>("ai");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [plan, setPlan] = useState<EditPlan>(defaultPlan("poster"));
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [brush, setBrush] = useState(BRUSHES[0]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<"home" | "picker" | "settings" | null>(null);
  const [exportPct, setExportPct] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [focusPreview, setFocusPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; filename: string; url: string; isVideo: boolean } | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause the live preview while the lower area scrolls so touch scrolling stays smooth.
  function onLowerScroll() {
    setScrolling((s) => (s ? s : true));
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 160);
  }

  const previewRef = useRef<PreviewHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoListen = useRef(false);
  const stateRef = useRef({ messages, plan, media, kind, route, lang });

  useEffect(() => {
    stateRef.current = { messages, plan, media, kind, route, lang };
  }, [messages, plan, media, kind, route, lang]);

  const config = useMemo(() => KINDS.find((k) => k.id === kind), [kind]);
  const dirty = media.length > 0 && !downloaded;

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const sendRef = useRef<(text: string, images?: string[]) => Promise<void>>(async () => {});

  const voice = useVoice({
    lang,
    onFinal: (text) => void sendRef.current(text),
    onUnsupported: () => {
      autoListen.current = false;
      setMode("text");
      toast.error(t("voiceUnsupported"));
    },
  });

  const send = useCallback(
    async (text: string, images?: string[]) => {
      const s = stateRef.current;
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text, images };
      const history = [...s.messages, userMsg];
      setMessages(history);
      setSuggestions([]);
      setLoading(true);
      try {
        const data = await postJson<ChatReply>("/api/chat", {
          messages: history.map((m) => ({ role: m.role, content: m.text, images: m.images })),
          lang: s.lang,
          kind: s.kind,
          route: s.route,
          mediaCount: s.media.length,
          plan: s.plan,
        });
        setPlan({
          style: data.style,
          tempo: data.tempo,
          mood: data.mood,
          title: data.title,
          subtitle: data.subtitle,
          order: data.order?.length ? data.order : s.plan.order,
        });
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: data.reply }]);
        setSuggestions(data.suggestions ?? []);
        if (mode === "voice") {
          voice.speak(data.reply, () => {
            if (autoListen.current) voice.startListening();
          });
        }
      } catch {
        const retryText = t("chatError");
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: retryText }]);
        setSuggestions([text]);
        if (mode === "voice") {
          voice.speak(retryText, () => {
            if (autoListen.current) voice.startListening();
          });
        }
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, t, voice.speak, voice.startListening],
  );

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  function pickKind(k: EditKind) {
    const cfg = KINDS.find((c) => c.id === k);
    if (!cfg) return;
    setKind(k);
    setPlan(defaultPlan(k));
    setStrokes([]);
    setDownloaded(false);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: t(cfg.greeting) + (route === "manual" ? t("greet_manual") : ""),
      },
    ]);
    setSuggestions([t("sug_start1"), t("sug_start2"), t("sug_start3")]);
  }

  function resetEditing() {
    voice.cancel();
    autoListen.current = false;
    media.forEach(releaseMedia);
    setMedia([]);
    setKind(null);
    setMessages([]);
    setSuggestions([]);
    setStrokes([]);
  }

  function requestLeave(target: "home" | "picker" | "settings") {
    if (dirty) setLeaveTarget(target);
    else confirmLeave(target);
  }

  function confirmLeave(target: "home" | "picker" | "settings") {
    resetEditing();
    setLeaveTarget(null);
    if (target === "home") router.push("/");
    if (target === "settings") router.push("/settings");
  }

  async function onFiles(files: FileList | null) {
    if (!files || !config) return;
    const incoming = Array.from(files);
    const next = [...media];
    setImporting(true);
    setPlaying(false);
    for (const file of incoming) {
      if (config.id === "video") {
        const totalSeconds = next.reduce((sum, m) => sum + m.duration, 0);
        try {
          const item = await loadMedia(file);
          if (totalSeconds + item.duration > MAX_VIDEO_SECONDS) {
            releaseMedia(item);
            toast.error(t("videoLimit"));
            break;
          }
          next.push(item);
        } catch {
          toast.error(t("chatError"));
        }
      } else {
        if (next.length >= config.max) {
          toast.error(t("limitReached"));
          break;
        }
        try {
          next.push(await loadMedia(file));
        } catch {
          toast.error(t("chatError"));
        }
      }
    }
    setMedia(next);
    setPlan((p) => ({ ...p, order: [] }));
    setDownloaded(false);
    setImporting(false);
    setPlaying(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  function moveMedia(index: number, delta: number) {
    setMedia((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setPlan((p) => ({ ...p, order: [] }));
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      releaseMedia(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setPlan((p) => ({ ...p, order: [] }));
  }

  function toggleMic() {
    if (voice.state === "listening") {
      autoListen.current = false;
      voice.stopListening();
    } else if (voice.state === "speaking") {
      autoListen.current = false;
      voice.cancel();
    } else {
      autoListen.current = true;
      voice.startListening();
    }
  }

  function changeMode(next: "text" | "voice") {
    if (next === "text") {
      autoListen.current = false;
      voice.cancel();
    }
    setMode(next);
  }

  function askDownload() {
    if (!config) return;
    if (media.length === 0) {
      toast.error(t("needMedia"));
      return;
    }
    if (media.length < config.min) {
      toast.error(t("needMore", { n: config.min }));
      return;
    }
    setDownloadOpen(true);
  }

  function closeReady() {
    setReady((r) => {
      if (r) URL.revokeObjectURL(r.url);
      return null;
    });
  }

  function saveReady() {
    if (!ready) return;
    saveBlob(ready.blob, ready.filename);
    setDownloaded(true);
    trackExport();
    toast.success(t("savedOk"));
  }

  async function shareReady() {
    if (!ready) return;
    const file = new File([ready.blob], ready.filename, { type: ready.blob.type });
    try {
      await navigator.share({ files: [file] });
      setDownloaded(true);
      trackExport();
    } catch {
      // user dismissed the share sheet
    }
  }

  const canShareFiles = (() => {
    if (!ready || typeof navigator === "undefined" || !navigator.canShare) return false;
    try {
      return navigator.canShare({ files: [new File([ready.blob], ready.filename, { type: ready.blob.type })] });
    } catch {
      return false;
    }
  })();

  async function runDownload() {
    setDownloadOpen(false);
    if (!kind) return;
    try {
      let blob: Blob | null | undefined;
      let filename: string;
      if (kind === "poster") {
        blob = await previewRef.current?.snapshot();
        filename = "jsc343-edit.png";
      } else {
        setExportPct(0);
        const result = await previewRef.current?.record(setExportPct);
        blob = result?.blob;
        filename = `jsc343-edit.${result?.ext ?? "webm"}`;
      }
      if (!blob) throw new Error("no output");
      setReady({ blob, filename, url: URL.createObjectURL(blob), isVideo: kind !== "poster" });
    } catch {
      toast.error(t("exportFail"));
    } finally {
      setExportPct(null);
    }
  }

  const header = (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => requestLeave(kind ? "picker" : "home")}
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
        <h1 className="truncate text-sm font-semibold leading-tight">{config ? t(config.label) : t("studio")}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex rounded-xl bg-secondary p-1" role="group" aria-label={t("chat")}>
          {(
            [
              { id: "text", icon: Type, label: "modeText" },
              { id: "voice", icon: Mic, label: "modeVoice" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => changeMode(m.id)}
              aria-pressed={mode === m.id}
              aria-label={t(m.label)}
              className={`flex size-9 items-center justify-center rounded-lg ${
                mode === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <m.icon className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        <LanguagePicker />
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => requestLeave("settings")}
          aria-label={t("settings")}
        >
          <Settings className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );

  if (!kind || !config) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
        {header}
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">{t("notSaved")}</p>
          <KindPicker route={route} onRoute={setRoute} onPick={pickKind} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col">
      {header}
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <section aria-label={t("preview")} className={`flex flex-col ${focusPreview ? "min-h-0 flex-1" : "shrink-0"}`}>
          <div
            className={`scene-3d relative flex items-center justify-center rounded-2xl bg-secondary p-1 ${
              focusPreview ? "min-h-0 flex-1" : "h-[46dvh]"
            }`}
          >
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 z-10 size-10 bg-card/90 shadow-sm"
              onClick={() => setFocusPreview((v) => !v)}
              aria-label={focusPreview ? t("shrink") : t("enlarge")}
              aria-pressed={focusPreview}
            >
              {focusPreview ? <Minimize2 className="size-5" aria-hidden="true" /> : <Maximize2 className="size-5" aria-hidden="true" />}
            </Button>
            <PreviewCanvas
              ref={previewRef}
              kind={kind}
              plan={plan}
              media={media}
              strokes={strokes}
              playing={playing && !scrolling}
              drawing={route === "manual"}
              route={route}
              brushColor={brush}
              emptyText={t("addMedia")}
              onStrokesChange={setStrokes}
              label={t("preview")}
            />
          </div>
        </section>

        <div
          onScroll={onLowerScroll}
          className={`flex flex-col gap-3 [&>*]:shrink-0 ${
            focusPreview
              ? "shrink-0"
              : "min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain pb-24 [-webkit-overflow-scrolling:touch]"
          }`}
        >
          {exportPct !== null ? (
            <div className="flex flex-col gap-1 px-1">
              <Progress value={exportPct} />
              <p className="text-xs text-muted-foreground" role="status">
                {t("exporting", { p: exportPct })}
              </p>
            </div>
          ) : importing ? (
            <p className="px-1 text-center text-xs text-muted-foreground" role="status">
              {t("processing")}
            </p>
          ) : (
            <p className="px-1 text-center text-xs text-accent">{t("notSaved")}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={config.accept}
              multiple
              className="sr-only"
              onChange={(e) => void onFiles(e.target.files)}
              aria-label={config.id === "video" ? t("addVideo") : t("addMedia")}
            />
            <Button variant="secondary" className="h-11" onClick={() => fileRef.current?.click()} disabled={exportPct !== null}>
              <ImagePlus className="size-5" aria-hidden="true" />
              {config.id === "video" ? t("addVideo") : t("addMedia")}
            </Button>
            <Button variant="secondary" className="h-11" onClick={() => setMediaOpen(true)} disabled={media.length === 0}>
              <LayoutGrid className="size-5" aria-hidden="true" />
              {t("mediaCount", { n: media.length })}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-11"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t("pause") : t("play")}
            >
              {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
            </Button>
            <Button className="h-11" onClick={askDownload} disabled={exportPct !== null}>
              <Download className="size-5" aria-hidden="true" />
              {t("download")}
            </Button>
          </div>

          {route === "manual" ? (
            <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label={t("brush")}>
              {BRUSHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBrush(c)}
                  aria-label={`${t("brush")} ${c}`}
                  aria-pressed={brush === c}
                  className={`size-9 rounded-full border-2 ${brush === c ? "border-primary" : "border-border"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <Button variant="outline" size="icon" className="size-11" onClick={() => setStrokes((s) => s.slice(0, -1))} aria-label={t("undo")}>
                <Undo2 className="size-5" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-11" onClick={() => setStrokes([])} aria-label={t("clear")}>
                <Eraser className="size-5" aria-hidden="true" />
              </Button>
            </div>
          ) : null}

        <section
          aria-label={t("chat")}
          className={`flex-col ${focusPreview ? "hidden" : "flex"}`}
        >
          <ChatPanel
            mode={mode}
            messages={messages}
            suggestions={
              messages.length > 1 && suggestions.length === 0 && !loading
                ? [t("sug_faster"), t("sug_slower"), t("sug_style"), t("sug_title")]
                : suggestions
            }
            loading={loading}
            voiceState={voice.state}
            interim={voice.interim}
            onSend={(text, images) => void send(text, images)}
            onToggleMic={toggleMic}
            labels={{
              attachImage: t("attachImage"),
              removeImage: t("removeImage"),
              imageOnlyText: t("imageOnlyText"),
              tooMany: t("imageTooMany"),
              error: t("chatError"),
              placeholder: t("typeMessage"),
              send: t("send"),
              listening: t("listening"),
              replying: t("aiReplying"),
              thinking: t("thinking"),
              idle: t("voiceIdle"),
              tapToTalk: t("tapToTalk"),
              tapToStop: t("tapToStop"),
            }}
          />
        </section>
        </div>
      </div>

      <MediaSheet open={mediaOpen} onOpenChange={setMediaOpen} media={media} onMove={moveMedia} onRemove={removeMedia} />

      <AlertDialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("download")}</AlertDialogTitle>
            <AlertDialogDescription>{t("notSaved")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("stay")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runDownload()}>
              {kind === "poster" ? t("downloadPng") : t("downloadVideo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={ready !== null} onOpenChange={(o) => !o && closeReady()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("readyTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("readyBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          {ready ? (
            ready.isVideo ? (
              <video src={ready.url} controls playsInline className="max-h-[40dvh] w-full rounded-xl bg-secondary object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ready.url} alt="" className="max-h-[40dvh] w-full rounded-xl bg-secondary object-contain" />
            )
          ) : null}
          <p className="text-xs text-accent">{t("notSaved")}</p>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("closeLabel")}</AlertDialogCancel>
            {canShareFiles ? (
              <Button variant="secondary" onClick={() => void shareReady()}>
                {t("shareSave")}
              </Button>
            ) : null}
            <Button onClick={saveReady}>
              <Download className="size-5" aria-hidden="true" />
              {t("saveToDownloads")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveTarget !== null} onOpenChange={(o) => !o && setLeaveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaveBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("stay")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => leaveTarget && confirmLeave(leaveTarget)}>{t("leave")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
