"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { LifecycleBar, WorkSession, type WorkLifecycle } from "@/components/work-session";
import { Download, ImagePlus, Pause, Play, RefreshCw, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MediaStage, type StageHandle } from "@/components/media-stage";
import {
  ClipsPanel,
  DrawPanel,
  MotionPanel,
  MusicPanel,
  StickerPanel,
  TextPanel,
  TransitionsPanel,
  fmt,
} from "@/components/editor-panels";
import { DirectorTools } from "@/components/director-tools";
import { FramePanel, LifePanel, MakeupPanel } from "@/components/photo-tools";
import { Nudge, Range } from "@/components/editor-panels";
import { useLang } from "@/components/lang-context";
import {
  MAX_PHOTOS as HAND_MAX_PHOTOS,
  MAX_TIMELINE as HAND_MAX_TIMELINE,
  buildTimeline,
  clipLen,
  elementSize,
  type Aspect,
  type Asset,
  type Clip,
  type Project,
  type TextItem,
  type TextRole,
  type TransitionId,
} from "@/lib/compositor";
import { STICKERS, type StickerItem } from "@/lib/stickers";
import { ArtPanel } from "@/components/art-panel";
import { DEFAULT_ART, type ArtState } from "@/lib/art";
import { buildStack, moveLayer, nextZ } from "@/lib/layers";
import { LayerBar } from "@/components/layer-bar";
import { EditLockPanel, useEditLock } from "@/components/edit-lock";
import { FormatPanel } from "@/components/format-panel";
import { SaveDialog, type PendingSave } from "@/components/save-dialog";
import type { EditFunc } from "@/lib/funcs";
import { MOTION_TEMPLATES } from "@/lib/templates";
import { renderTrack, type Track } from "@/lib/music";
import { COST, FREE_TESTING } from "@/lib/pricing";
import { fontSpec, FONTS, FILTERS, TRANSITIONS } from "@/lib/compositor";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { SfxPanel } from "@/components/sfx-panel";
import { renderSfxTrack, type SfxItem } from "@/lib/sfx";
import { useWallet } from "@/components/wallet-context";
import type { EditMode } from "@/components/app-shell";

type Tab = "format" | "art" | "clips" | "frame" | "makeup" | "life" | "wear" | "scene" | "trans" | "text" | "stickers" | "music" | "sfx" | "special";

const uid = () => Math.random().toString(36).slice(2, 10);

interface ShowAction {
  type: string;
  index: number | null;
  value: string | null;
  text: string | null;
  kind: string | null;
  seconds: number | null;
  x: number | null;
  y: number | null;
  size: number | null;
  color: string | null;
  font: string | null;
  start: number | null;
  end: number | null;
  rot: number | null;
  sx: number | null;
  sy: number | null;
  opacity: number | null;
  direction: number | null;
}

const SHOW_EXAMPLES = (L: (zh: string, en: string) => string) => [
  L("請幫我整體編排", "Arrange the whole piece for me"),
  L("加一個標題「全家福」在上方", "Add a title “Family” at the top"),
  L("轉場改成淡入淡出，濾鏡用復古", "Use fade transitions and a vintage filter"),
  L("每張停留 4 秒，右下角加愛心", "4 seconds per photo, heart at bottom right"),
];

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image"));
    img.src = url;
  });
}

function loadVideo(url: string) {
  return new Promise<HTMLVideoElement>((res, rej) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.playsInline = true;
    v.onloadeddata = () => res(v);
    v.onerror = () => rej(new Error("video"));
    v.src = url;
  });
}

function makeThumb(el: HTMLImageElement | HTMLVideoElement) {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext("2d");
  const { w, h } = elementSize(el);
  if (!ctx || !w || !h) return "";
  const r = Math.max(96 / w, 96 / h);
  ctx.drawImage(el, (w - 96 / r) / 2, (h - 96 / r) / 2, 96 / r, 96 / r, 0, 0, 96, 96);
  return c.toDataURL("image/jpeg", 0.6);
}

export function EditorView(props: { func: EditFunc; mode: EditMode; onOpenPay: () => void }) {
  if (props.func !== "single") return <EditorViewInner {...props} lifecycle={null} />;
  return <WorkSession>{(lifecycle) => <EditorViewInner {...props} lifecycle={lifecycle} />}</WorkSession>;
}

function EditorViewInner({
  func,
  mode,
  onOpenPay,
  lifecycle,
}: {
  func: EditFunc;
  mode: EditMode;
  onOpenPay: () => void;
  lifecycle: WorkLifecycle | null;
}) {
  const { L, t } = useLang();
  const wallet = useWallet();
  const kind = func === "video" ? "video" : "photo";
  const MAX_PHOTOS = mode === "ai" ? 80 : HAND_MAX_PHOTOS;
  const MAX_TIMELINE = mode === "ai" ? 1800 : HAND_MAX_TIMELINE;
  const photoLimit = func === "single" ? 1 : MAX_PHOTOS;
  const photoLimitMsg =
    func === "single" ? L("單張動態化只能放 1 張相片。", "Single-photo mode takes 1 photo.") : L(`相片最多 ${MAX_PHOTOS} 張。`, `Up to ${MAX_PHOTOS} photos.`);
  const limitMin = MAX_TIMELINE / 60;
  const cost = COST[kind];
  const loadedFonts = useRef(new Set<string>());
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [needTopUp, setNeedTopUp] = useState(false);
  const stageRef = useRef<StageHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const assets = useRef(new Map<string, Asset>());
  const music = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [clips, setClips] = useState<Clip[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [art, setArt] = useState<ArtState>(DEFAULT_ART);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [fadeInOut, setFadeInOut] = useState(true);
  const [templateId, setTemplateId] = useState(MOTION_TEMPLATES[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const lock = useEditLock<Tab>("clips");
  const { tab, phase } = lock;
  const editing = phase === "editing";
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pending, setPending] = useState<PendingSave | null>(null);
  const [outFmt, setOutFmt] = useState<"orig" | "gif">("orig");
  const suggested = lifecycle?.suggest ?? null;
  useEffect(() => {
    if (suggested) setOutFmt(suggested.fmt);
  }, [suggested]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [color, setColor] = useState("#2f7fd1");
  const [size, setSize] = useState(8);
  const sfx = useRef<HTMLAudioElement | null>(null);
  const [sfxItems, setSfxItems] = useState<SfxItem[]>([]);
  const [sfxVolume, setSfxVolume] = useState(0.8);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const url = await renderSfxTrack(sfxItems);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      const old = sfx.current;
      old?.pause();
      if (old?.src) URL.revokeObjectURL(old.src);
      if (url) {
        const a = new Audio(url);
        a.preload = "auto";
        a.volume = sfxVolume;
        sfx.current = a;
      } else {
        sfx.current = null;
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sfxItems]);

  useEffect(() => {
    if (sfx.current) sfx.current.volume = sfxVolume;
  }, [sfxVolume]);

  const project: Project = useMemo(
    () => ({
      clips,
      texts,
      aspect,
      mode,
      template: mode === "ai" ? (MOTION_TEMPLATES.find((m) => m.id === templateId) ?? MOTION_TEMPLATES[0]) : null,
      fadeInOut,
      stickers,
      art: func === "single" ? art : undefined,
    }),
    [clips, texts, aspect, mode, templateId, fadeInOut, stickers, art, func],
  );
  const total = useMemo(() => buildTimeline(clips).total, [clips]);

  useEffect(() => {
    const store = assets.current;
    return () => {
      store.forEach((a) => {
        if (a.el instanceof HTMLVideoElement) a.el.pause();
        URL.revokeObjectURL(a.url);
      });
      music.current?.pause();
    };
  }, []);

  useEffect(() => {
    texts.forEach((item) => {
      const key = `${item.font}|${item.text}`;
      if (loadedFonts.current.has(key)) return;
      loadedFonts.current.add(key);
      const spec = fontSpec(item.font);
      document.fonts
        .load(`${spec.weight} 40px "${spec.family}"`, item.text || "A")
        .then(() => setTexts((prev) => [...prev]))
        .catch(() => {});
    });
  }, [texts]);

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setLoading(true);
    setMessage(null);
    const added: Clip[] = [];
    let used = total;
    let count = clips.length;
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      try {
        if (kind === "photo") {
          if (count >= photoLimit) {
            setMessage(photoLimitMsg);
            URL.revokeObjectURL(url);
            break;
          }
          const img = await loadImage(url);
          const assetId = uid();
          assets.current.set(assetId, { el: img, url, depth: null, order: null, depthKey: "" });
          added.push({
            id: uid(), assetId, type: "photo", thumb: makeThumb(img), duration: 3, srcDuration: 0,
            trimStart: 0, trimEnd: 0, speed: 1, volume: 1,
            transition: count + added.length > 0 ? "fade" : "none", filter: "none",
          });
          count++;
          used += 3;
        } else {
          const room = MAX_TIMELINE - used;
          if (room < 1) {
            setMessage(L(`總長度最多 ${limitMin} 分鐘。`, `Total length is limited to ${limitMin} minutes.`));
            URL.revokeObjectURL(url);
            break;
          }
          const v = await loadVideo(url);
          const dur = isFinite(v.duration) ? v.duration : 0;
          const end = Math.min(dur, room);
          if (dur > room) setMessage(L(`已自動裁切至 ${limitMin} 分鐘上限。`, `Trimmed to fit the ${limitMin}-minute limit.`));
          const assetId = uid();
          assets.current.set(assetId, { el: v, url, depth: null, order: null, depthKey: "" });
          added.push({
            id: uid(), assetId, type: "video", thumb: makeThumb(v), duration: end, srcDuration: dur,
            trimStart: 0, trimEnd: end, speed: 1, volume: 1,
            transition: count > 0 ? "fade" : "none", filter: "none",
          });
          count++;
          used += end;
        }
      } catch {
        URL.revokeObjectURL(url);
        setMessage(t("loadFail"));
      }
    }
    if (added.length) {
      setClips((prev) => [...prev, ...added]);
      setSelectedId(added[added.length - 1].id);
    }
    setLoading(false);
  };

  const updateClip = (id: string, patch: Partial<Clip>) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const removeClip = (id: string) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const moveClip = (id: string, dir: -1 | 1) =>
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      if (next[0].transition !== "none") next[0] = { ...next[0], transition: "none" };
      return next.map((c, k) => (k > 0 && c.transition === "none" ? { ...c, transition: "fade" } : c));
    });

  const duplicateClip = async (id: string) => {
    const src = clips.find((c) => c.id === id);
    const asset = src && assets.current.get(src.assetId);
    if (!src || !asset) return;
    if (kind === "photo" && clips.length >= photoLimit) return setMessage(photoLimitMsg);
    if (total + clipLen(src) > MAX_TIMELINE) return setMessage(L(`總長度最多 ${limitMin} 分鐘。`, `Total length is limited to ${limitMin} minutes.`));
    try {
      const el = src.type === "video" ? await loadVideo(asset.url) : asset.el;
      const assetId = uid();
      assets.current.set(assetId, { el, url: asset.url, depth: null, order: null, depthKey: "" });
      const copy = { ...src, id: uid(), assetId };
      setClips((prev) => {
        const i = prev.findIndex((c) => c.id === id);
        return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
      });
      setSelectedId(copy.id);
    } catch {
      setMessage(t("loadFail"));
    }
  };

  const splitClip = async (id: string) => {
    const src = clips.find((c) => c.id === id);
    const asset = src && assets.current.get(src.assetId);
    if (!src || !asset || src.type !== "video") return;
    const start = buildTimeline(clips).starts[clips.indexOf(src)];
    const local = src.trimStart + (time - start) * src.speed;
    if (local - src.trimStart < 0.5 || src.trimEnd - local < 0.5) {
      return setMessage(L("請先把播放位置移到片段中間。", "Move the playhead inside the clip first."));
    }
    try {
      const el = await loadVideo(asset.url);
      const assetId = uid();
      assets.current.set(assetId, { el, url: asset.url, depth: null, order: null, depthKey: "" });
      const second: Clip = { ...src, id: uid(), assetId, trimStart: local, transition: "none" };
      setClips((prev) => {
        const i = prev.findIndex((c) => c.id === id);
        const next = [...prev];
        next[i] = { ...src, trimEnd: local };
        next.splice(i + 1, 0, second);
        return next;
      });
      setSelectedId(second.id);
    } catch {
      setMessage(t("loadFail"));
    }
  };

  const setTransition = (id: string, tr: TransitionId) => updateClip(id, { transition: tr });
  const setAllTransitions = (tr: TransitionId) =>
    setClips((prev) => prev.map((c, i) => ({ ...c, transition: i === 0 ? "none" : tr })));

  const normalizeOrder = (list: Clip[]) =>
    list.map((c, i) => (i === 0 ? { ...c, transition: "none" as TransitionId } : c.transition === "none" ? { ...c, transition: "fade" as TransitionId } : c));

  const reverseClips = () => setClips((prev) => normalizeOrder([...prev].reverse()));
  const shuffleClips = () =>
    setClips((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return normalizeOrder(next);
    });
  const setAllDuration = (sec: number) => {
    setClips((prev) => prev.map((c) => (c.type === "photo" ? { ...c, duration: sec } : c)));
  };
  const setAllSpeed = (speed: number) => {
    const projected = clips.reduce((s, c) => s + (c.trimEnd - c.trimStart) / speed, 0);
    if (projected > MAX_TIMELINE) return setMessage(L(`套用後會超過 ${limitMin} 分鐘上限。`, `That would exceed the ${limitMin}-minute limit.`));
    setClips((prev) => prev.map((c) => (c.type === "video" ? { ...c, speed } : c)));
  };
  const fitToMusic = () => {
    const len = music.current?.duration;
    if (!len || !isFinite(len) || !clips.length) return setMessage(L("請先選一首音樂。", "Pick a music track first."));
    const each = Math.min(10, Math.max(1, Math.round((len / clips.length) * 10) / 10));
    setAllDuration(each);
  };
  const clearAll = () => {
    setClips([]);
    setSelectedId(null);
    setTime(0);
  };

  const addText = (role: TextRole = "body") => {
    const base = { id: uid(), x: 0.5, color: "#ffffff", font: "Noto Sans TC", z: nextZ([], stickers, texts) };
    const item: TextItem =
      role === "opening"
        ? { ...base, text: L("我的故事", "My story"), start: 0, end: 3, y: 0.5, size: 12, role }
        : role === "closing"
          ? { ...base, text: L("謝謝觀看", "Thanks for watching"), start: Math.max(0, total - 3), end: Math.max(3, total), y: 0.5, size: 12, role }
          : { ...base, text: L("美好回憶", "Beautiful memories"), start: Math.floor(time), end: Math.floor(time) + 3, y: 0.8, size: 9, role };
    setTexts((prev) => [...prev, item]);
    setSelectedText(item.id);
  };

  const addSticker = (stickerKind: string) => {
    const item: StickerItem = {
      id: uid(), kind: stickerKind, x: 0.5, y: 0.4, size: 24, z: nextZ([], stickers, texts),
      start: Math.floor(time), end: Math.max(Math.floor(time) + 4, Math.ceil(total)),
    };
    setStickers((prev) => [...prev, item]);
    setSelectedSticker(item.id);
  };

  const useAudioUrl = (url: string, name: string) => {
    music.current?.pause();
    const a = new Audio(url);
    a.loop = true;
    a.preload = "auto";
    a.volume = musicVolume;
    music.current = a;
    setMusicName(name);
  };

  const pickMusic = (file: File) => {
    setActiveTrack(null);
    useAudioUrl(URL.createObjectURL(file), file.name);
  };

  const pickTrack = async (track: Track) => {
    setLoadingTrack(track.id);
    try {
      const url = await renderTrack(track);
      useAudioUrl(url, `${L(track.zh, track.en)}`);
      setActiveTrack(track.id);
    } catch {
      setMessage(L("音樂載入失敗，請再試一次。", "Could not load the music. Please try again."));
    } finally {
      setLoadingTrack(null);
    }
  };

  const removeMusic = () => {
    const a = music.current;
    if (a) {
      a.pause();
      URL.revokeObjectURL(a.src);
      a.removeAttribute("src");
    }
    music.current = null;
    setActiveTrack(null);
    setMusicName(null);
  };

  const handleDownload = async () => {
    if (!stageRef.current || exporting || !clips.length) return;
    if (!FREE_TESTING && !wallet.canAfford(cost)) {
      setMessage(L(`點數不足，本次需要 ${cost} 點。`, `Not enough points. This creation needs ${cost}.`));
      setNeedTopUp(true);
      return;
    }
    setNeedTopUp(false);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setExporting(true);
    setProgress(0);
    setMessage(null);
    try {
      const { blob, ext } =
        func === "single" && outFmt === "gif"
          ? { blob: await stageRef.current.exportGif(setProgress, ctrl.signal), ext: "gif" }
          : await stageRef.current.exportMedia(setProgress, ctrl.signal);
      const paid = FREE_TESTING ? true : await wallet.spend(cost);
      if (!paid) {
        setMessage(L(`點數不足，本次需要 ${cost} 點。`, `Not enough points. This creation needs ${cost}.`));
        setNeedTopUp(true);
        return;
      }
      setPending({
        blob,
        filename: `jsc343-${Date.now()}.${ext}`,
        onSaved: () => lifecycle?.markDownloaded(ext === "gif" ? "gif" : "orig"),
      });
    } catch {
      if (!ctrl.signal.aborted) setMessage(t("exportFail"));
    } finally {
      setExporting(false);
    }
  };

  const { lang } = useLang();
  const aiGuided = mode === "ai";
  const [aiStage, setAiStage] = useState<"pick" | "format" | "done">("pick");
  const [aiClipIds, setAiClipIds] = useState<string[]>([]);
  const toggleAiClip = (id: string) => setAiClipIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const boxedClips = clips.filter((c) => aiClipIds.includes(c.id));
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiBrief, setAiBrief] = useState("");
  const aiSeed = useRef(0);

  const runAi = async () => {
    if (!clips.length || aiBusy) return;
    setAiBusy(true);
    setMessage(null);
    aiSeed.current += 1;
    const thumbs = clips.map((c) => c.thumb).filter(Boolean);
    const step = Math.max(1, Math.ceil(thumbs.length / 8));
    const sample = thumbs.filter((_, i) => i % step === 0).slice(0, 8);
    type Plan = {
      title: string; closing: string; motion: string; transition: TransitionId; filter: Clip["filter"];
      secondsPerPhoto: number; textColor: string; note: string;
    };
    let plan: Plan | null = null;
    try {
      const res = await fetch("/api/ai-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ func, aspect, brief: aiBrief, images: sample, count: clips.length, lang, seed: aiSeed.current > 1 ? aiSeed.current : 0 }),
      });
      if (res.ok) plan = (await res.json()) as Plan;
    } catch {
      plan = null;
    }
    const fallback = !plan;
    const p: Plan = plan ?? {
      title: L("我的故事", "My story"), closing: L("謝謝觀看", "Thanks for watching"),
      motion: MOTION_TEMPLATES[aiSeed.current % MOTION_TEMPLATES.length].id, transition: "fade", filter: "none",
      secondsPerPhoto: 3, textColor: "#ffffff", note: "",
    };
    const sec = kind === "photo" ? p.secondsPerPhoto : 0;
    const nextClips = clips.map((c, i) => ({
      ...c,
      transition: (i === 0 ? "none" : p.transition) as TransitionId,
      filter: p.filter,
      duration: c.type === "photo" ? sec : c.duration,
    }));
    const newTotal = nextClips.reduce((s, c) => s + clipLen(c), 0);
    const base = { x: 0.5, color: p.textColor, font: "Noto Sans TC", z: 1 };
    setClips(nextClips);
    setTemplateId(MOTION_TEMPLATES.find((m) => m.id === p.motion)?.id ?? MOTION_TEMPLATES[0].id);
    setFadeInOut(true);
    setTexts([
      { ...base, id: uid(), text: p.title, start: 0, end: Math.min(3, newTotal), y: 0.5, size: 12, role: "opening" },
      { ...base, id: uid(), text: p.closing, start: Math.max(0, newTotal - 3), end: Math.max(3, newTotal), y: 0.5, size: 12, role: "closing" },
    ]);
    setAiNote(fallback ? L("AI 暫時連不上，已先用預設方案製作，可再按「AI 重新製作」。", "The AI could not be reached, so a default plan was used. Tap Remake with AI to try again.") : p.note);
    setAiStage("done");
    setAiBusy(false);
  };

  const [manual, setManual] = useState(false);
  const showManual = !aiGuided || manual;

  const showState = () => ({
    aspect,
    motion: templateId,
    totalSeconds: Math.round(total),
    clips: clips.map((c, i) => ({ n: i + 1, type: c.type, seconds: Math.round(clipLen(c) * 10) / 10, transition: c.transition, filter: c.filter })),
    texts: texts.map((t, i) => ({ n: i + 1, text: t.text, x: t.x, y: t.y, size: t.size, color: t.color, start: t.start, end: t.end, sx: t.sx ?? 1, sy: t.sy ?? 1, opacity: t.alpha ?? 1 })),
    stickers: stickers.map((s, i) => ({ n: i + 1, kind: s.kind, x: s.x, y: s.y, size: s.size, start: s.start, end: s.end, sx: s.sx ?? 1, sy: s.sy ?? 1, opacity: s.alpha ?? 1 })),
  });

  const applyShow = (list: ShowAction[]) => {
    const num = (v: number | null, lo: number, hi: number) => (v === null ? null : Math.min(hi, Math.max(lo, v)));
    for (const a of list) {
      const at = a.index === null ? -1 : a.index - 1;
      switch (a.type) {
        case "auto_plan":
          void runAi();
          break;
        case "set_aspect":
          if (a.value && ["9:16", "3:4", "4:5", "1:1", "4:3", "16:9"].includes(a.value)) setAspect(a.value as Aspect);
          break;
        case "set_motion": {
          const m = MOTION_TEMPLATES.find((x) => x.id === a.value);
          if (m) setTemplateId(m.id);
          break;
        }
        case "set_transition": {
          const tr = TRANSITIONS.find((x) => x.id === a.value);
          if (tr) setClips((prev) => prev.map((c, i) => ({ ...c, transition: i === 0 ? "none" : tr.id === "none" ? "fade" : tr.id })));
          break;
        }
        case "set_filter": {
          const f = FILTERS.find((x) => x.id === a.value);
          if (f) setClips((prev) => prev.map((c) => ({ ...c, filter: f.id })));
          break;
        }
        case "set_duration": {
          const sec = num(a.seconds, 1, 10);
          if (sec !== null) setAllDuration(sec);
          break;
        }
        case "add_text": {
          const start = num(a.start, 0, 3600) ?? Math.floor(time);
          const item: TextItem = {
            id: uid(),
            text: (a.text ?? "").slice(0, 120) || L("美好回憶", "Beautiful memories"),
            x: num(a.x, 0, 1) ?? 0.5,
            y: num(a.y, 0, 1) ?? 0.8,
            size: num(a.size, 3, 30) ?? 9,
            color: a.color ?? "#ffffff",
            font: FONTS.some((f) => f.family === a.font) ? (a.font as string) : "Noto Sans TC",
            start,
            end: num(a.end, start + 1, 7200) ?? start + 4,
            role: "body",
            z: nextZ([], stickers, texts),
          };
          setTexts((prev) => [...prev, item]);
          break;
        }
        case "update_text":
          setTexts((prev) =>
            prev.map((t, i) =>
              i !== (at < 0 ? prev.length - 1 : at)
                ? t
                : {
                    ...t,
                    text: a.text !== null ? a.text.slice(0, 120) : t.text,
                    x: num(a.x, 0, 1) ?? t.x,
                    y: num(a.y, 0, 1) ?? t.y,
                    size: num(a.size, 3, 30) ?? t.size,
                    color: a.color ?? t.color,
                    font: FONTS.some((f) => f.family === a.font) ? (a.font as string) : t.font,
                    start: num(a.start, 0, 3600) ?? t.start,
  end: num(a.end, 1, 7200) ?? t.end,
  rot: num(a.rot, -180, 180) ?? t.rot,
  sx: num(a.sx, 0.2, 4) ?? t.sx,
  sy: num(a.sy, 0.2, 4) ?? t.sy,
  alpha: num(a.opacity, 0.05, 1) ?? t.alpha,
                  },
            ),
          );
          break;
        case "remove_text":
          setTexts((prev) => prev.filter((_, i) => i !== (at < 0 ? prev.length - 1 : at)));
          break;
        case "add_sticker": {
          if (!a.kind || !STICKERS.some((s) => s.id === a.kind)) break;
          const start = num(a.start, 0, 3600) ?? Math.floor(time);
          const item: StickerItem = {
            id: uid(),
            kind: a.kind,
            x: num(a.x, 0, 1) ?? 0.5,
            y: num(a.y, 0, 1) ?? 0.4,
            size: num(a.size, 8, 60) ?? 24,
            start,
            end: num(a.end, start + 1, 7200) ?? Math.max(start + 4, Math.ceil(total)),
            z: nextZ([], stickers, texts),
          };
          setStickers((prev) => [...prev, item]);
          break;
        }
        case "update_sticker":
          setStickers((prev) =>
            prev.map((s, i) =>
              i !== (at < 0 ? prev.length - 1 : at)
                ? s
                : {
                    ...s,
                    kind: a.kind && STICKERS.some((d) => d.id === a.kind) ? a.kind : s.kind,
                    x: num(a.x, 0, 1) ?? s.x,
                    y: num(a.y, 0, 1) ?? s.y,
                    size: num(a.size, 8, 60) ?? s.size,
                    start: num(a.start, 0, 3600) ?? s.start,
  end: num(a.end, 1, 7200) ?? s.end,
  rot: num(a.rot, -180, 180) ?? s.rot,
  sx: num(a.sx, 0.2, 4) ?? s.sx,
  sy: num(a.sy, 0.2, 4) ?? s.sy,
  alpha: num(a.opacity, 0.05, 1) ?? s.alpha,
                  },
            ),
          );
          break;
        case "remove_sticker":
          setStickers((prev) => prev.filter((_, i) => i !== (at < 0 ? prev.length - 1 : at)));
          break;
        case "reverse_clips":
          reverseClips();
          break;
        case "shuffle_clips":
          shuffleClips();
          break;
        case "remove_clip": {
          const target = clips[at];
          if (target) removeClip(target.id);
          else if (at < 0) boxedClips.forEach((c) => removeClip(c.id));
          break;
        }
        case "move_clip": {
          const target = clips[at];
          if (target) moveClip(target.id, a.direction !== null && a.direction < 0 ? -1 : 1);
          break;
        }
      }
    }
  };

  const tabs: [Tab, string][] = [
    ["format", L("格式", "Format")],
    ["clips", kind === "photo" ? L("相片", "Photos") : L("素材", "Clips")],
    ["frame", L("剪輯", "Crop")],
    ...(kind === "photo" ? ([["makeup", func === "single" ? L("彩妝調色", "Makeup") : L("色彩", "Color")]] as [Tab, string][]) : []),
    ...(func === "single"
      ? ([["life", L("動態", "Motion")], ["wear", L("AI 變裝", "Outfit")], ["scene", L("AI 景觀", "Scenery")]] as [Tab, string][])
      : ([["trans", L("轉場", "Transitions")]] as [Tab, string][])),
    ["text", L("文字", "Text")],
    ...(func === "single" ? ([["art", L("藝術套件", "Art kit")]] as [Tab, string][]) : []),
    ["stickers", L("插圖", "Artwork")],
    ["music", L("音樂", "Music")],
    ["sfx", L("配音", "Sound FX")],
    ["special", mode === "hand" ? L("手繪", "Draw") : L("AI 3D 動態", "AI 3D")],
  ];

  const overLimit = kind === "video" && total > MAX_TIMELINE;

  const textTarget = tab === "text" ? texts.find((x) => x.id === selectedText) : undefined;
  const stickerTarget = ["stickers", "life", "wear", "scene"].includes(tab) ? stickers.find((x) => x.id === selectedSticker) : undefined;
  const nudgeItem = textTarget ?? stickerTarget;
  const updateNudged = (patch: { x?: number; y?: number; rot?: number }) => {
    if (textTarget) setTexts((prev) => prev.map((x) => (x.id === textTarget.id ? { ...x, ...patch } : x)));
    else if (stickerTarget) setStickers((prev) => prev.map((x) => (x.id === stickerTarget.id ? { ...x, ...patch } : x)));
  };

  const stack = buildStack([], stickers, texts);
  const activeId = nudgeItem?.id ?? null;
  const activeIndex = activeId ? stack.findIndex((e) => e.id === activeId) : -1;
  const shiftLayer = (dir: "up" | "down") => {
    if (!activeId || !editing) return;
    const map = moveLayer(stack, activeId, dir);
    if (!map) return;
    setStickers((prev) => prev.map((s) => ({ ...s, z: map.get(s.id) ?? s.z })));
    setTexts((prev) => prev.map((s) => ({ ...s, z: map.get(s.id) ?? s.z })));
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept={kind === "photo" ? "image/*" : "video/*"}
        multiple={func !== "single"}
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="sticky top-14 z-10 -mx-4 flex flex-col gap-2 bg-background/95 px-4 py-2 backdrop-blur [&_canvas]:mx-auto [&_canvas]:max-h-[40dvh] [&_canvas]:w-auto [&_canvas]:max-w-full">
      <div className="relative">
        <MediaStage
          ref={stageRef}
          project={project}
          assets={assets}
          music={music}
          sfx={sfx}
          musicVolume={musicVolume}
          drawing={mode === "hand" && tab === "special" && editing}
          color={color}
          size={size}
          onTime={setTime}
          onPlayingChange={setPlaying}
        />
        {!clips.length && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-secondary text-primary"
          >
            {loading ? <Spinner className="size-8" /> : <ImagePlus className="size-10" aria-hidden="true" />}
            <span className="px-6 text-center text-base font-medium">
              {func === "single"
                ? L("點擊上傳 1 張相片", "Tap to upload 1 photo")
                : kind === "photo"
                  ? L(`點擊上傳 1～${MAX_PHOTOS} 張相片`, `Tap to upload 1-${MAX_PHOTOS} photos`)
                  : L(`點擊上傳短視頻（總長最多 ${limitMin} 分鐘）`, `Tap to upload videos (up to ${limitMin} min total)`)}
            </span>
          </button>
        )}
      </div>

      {showManual && <LayerBar
        canFix={phase === "confirmed"}
        canConfirm={editing}
        onFix={lock.reopen}
        onConfirm={lock.confirm}
        hasTarget={activeId !== null && editing}
        canUp={activeIndex >= 0 && activeIndex < stack.length - 1}
        canDown={activeIndex > 0}
        onUp={() => shiftLayer("up")}
        onDown={() => shiftLayer("down")}
      />}
      {showManual && nudgeItem && (
        <div inert={!editing} className={editing ? "" : "opacity-30 grayscale"}>
          <Nudge
            key={nudgeItem.id}
            x={nudgeItem.x}
            y={nudgeItem.y}
            rot={nudgeItem.rot ?? 0}
            onMove={(x, y) => updateNudged({ x, y })}
            onRotate={(rot) => updateNudged({ rot })}
          />
        </div>
      )}
      </div>

      {clips.length > 0 && (
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" className="size-11 shrink-0" aria-label={playing ? t("pause") : t("preview")} onClick={() => stageRef.current?.toggle()}>
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, total)}
            step={0.05}
            value={Math.min(time, total)}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTime(v);
              stageRef.current?.seek(v);
            }}
            aria-label={L("時間軸", "Timeline")}
            className="w-full accent-primary"
          />
          <span className="w-24 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
            {fmt(time)} / {fmt(total)}
          </span>
        </div>
      )}

      {kind === "video" && clips.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, (total / MAX_TIMELINE) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {L(`總長 ${fmt(total)}，最長可編輯 ${limitMin} 分鐘`, `Length ${fmt(total)} - up to ${limitMin} minutes`)}
          </p>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {needTopUp && (
        <Button variant="secondary" onClick={onOpenPay}>
          {L("前往 Pi 支付儲值", "Go to Pi Pay to top up")}
        </Button>
      )}

      {aiGuided && (
        <div className={aiStage === "done" ? "flex flex-col gap-3" : "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"}>
          {aiStage === "pick" && (
            <>
              <h3 className="text-sm font-semibold">{L("第 1 步：選定素材", "Step 1: Choose your material")}</h3>
              {clips.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {clips.map((c) => (
                    <div key={c.id} className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumb || "/placeholder.svg"} alt="" className="size-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        aria-label={L("移除", "Remove")}
                        onClick={() => removeClip(c.id)}
                        className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {(func !== "single" || clips.length === 0) && (
                  <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()} disabled={loading}>
                    {loading ? <Spinner /> : <ImagePlus className="size-4" aria-hidden="true" />}
                    {clips.length ? L("加入更多", "Add more") : L("上傳素材", "Upload")}
                  </Button>
                )}
                <Button className="flex-1" disabled={!clips.length} onClick={() => setAiStage("format")}>
                  {L("下一步：選螢幕格式", "Next: screen format")}
                </Button>
              </div>
            </>
          )}
          {aiStage === "format" && (
            <>
              <h3 className="text-sm font-semibold">{L("第 2 步：選定螢幕格式", "Step 2: Choose a screen format")}</h3>
              <FormatPanel options={["9:16", "3:4", "4:5", "1:1", "4:3", "16:9"] as Aspect[]} value={aspect} onChange={setAspect} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAiStage("pick")}>
                  {L("上一步", "Back")}
                </Button>
                <Button className="flex-1" onClick={() => setAiStage("done")}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  {L("開始與 AI 對話編輯", "Start editing with the AI")}
                </Button>
              </div>
            </>
          )}
          {aiStage === "done" && (
            <>
              {aiBusy && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner /> {L("AI 正在整體編排…", "The AI is arranging everything…")}
                </p>
              )}
              {aiNote && !manual && <p className="text-sm text-muted-foreground">{aiNote}</p>}
              {!manual && clips.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-1" role="listbox" aria-label={L("點選要編輯的素材", "Tap a clip to edit")}>
                  {clips.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={aiClipIds.includes(c.id)}
                      onClick={() => toggleAiClip(c.id)}
                      className={`relative shrink-0 rounded-lg ${aiClipIds.includes(c.id) ? "outline outline-2 outline-offset-2 outline-primary" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumb || "/placeholder.svg"} alt={L(`素材 ${i + 1}`, `Clip ${i + 1}`)} className="size-14 rounded-lg object-cover" />
                      <span className="absolute bottom-0 left-0 rounded-tr-md rounded-bl-lg bg-foreground px-1 text-xs text-background">{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
              <AiChatPanel<ShowAction>
                selected={
                  boxedClips.length
                    ? {
                        label: boxedClips.map((c) => L(`素材 ${clips.indexOf(c) + 1}`, `Clip ${clips.indexOf(c) + 1}`)).join("、"),
                        payload:
                          boxedClips.length === 1
                            ? { element: "clip", index: clips.indexOf(boxedClips[0]) + 1 }
                            : { multiple: boxedClips.map((c) => ({ element: "clip", index: clips.indexOf(c) + 1 })) },
                      }
                    : null
                }
                onClearSelected={() => setAiClipIds([])}
                onDeleteSelected={() => {
                  boxedClips.forEach((c) => removeClip(c.id));
                  setAiClipIds([]);
                }}
                endpoint="/api/ai-show"
                extraBody={{ func }}
                examples={SHOW_EXAMPLES(L)}
                getState={showState}
                onActions={applyShow}
                manualOpen={manual}
                onManual={() => startTransition(() => setManual((v) => !v))}
              />
              {!manual && (
                <Button variant="outline" onClick={() => setAiStage("pick")} disabled={aiBusy || exporting}>
                  {L("換素材或格式", "Change material or format")}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {showManual && <div role="tablist" className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={phase !== "idle" && tab === id}
            disabled={!lock.canOpen(id)}
            onClick={() => lock.open(id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium disabled:opacity-35 ${
              phase !== "idle" && tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>}

{showManual && <EditLockPanel phase={phase}>
      {tab === "clips" && (func === "photos" || func === "video") && clips.length > 1 && (
        <DirectorTools
          kind={kind}
          count={clips.length}
          limit={kind === "photo" ? MAX_PHOTOS : 99}
          canFitMusic={!!musicName}
          onDuration={setAllDuration}
          onSpeed={setAllSpeed}
          onMuteAll={() => setClips((prev) => prev.map((c) => ({ ...c, volume: 0 })))}
          onFilter={(f) => setClips((prev) => prev.map((c) => ({ ...c, filter: f })))}
          onReverse={reverseClips}
          onShuffle={shuffleClips}
          onFitMusic={fitToMusic}
          onClear={clearAll}
        />
      )}
      {tab === "clips" && (
        <ClipsPanel
          kind={kind}
          clips={clips}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => fileRef.current?.click()}
          onUpdate={updateClip}
          onRemove={removeClip}
          onMove={moveClip}
          onDuplicate={duplicateClip}
          onSplit={splitClip}
        />
      )}
      {tab === "format" && (
        <FormatPanel options={["9:16", "3:4", "4:5", "1:1", "4:3", "16:9"] as Aspect[]} value={aspect} onChange={setAspect} />
      )}

      {tab === "frame" && <FramePanel clip={clips.find((c) => c.id === selectedId)} onUpdate={(p) => selectedId && updateClip(selectedId, p)} />}
      {tab === "makeup" && (
        <MakeupPanel
          clip={clips.find((c) => c.id === selectedId)}
          face={func === "single"}
          onUpdate={(p) => selectedId && updateClip(selectedId, p)}
          onApplyAll={func === "single" ? undefined : (m) => setClips((prev) => prev.map((c) => ({ ...c, makeup: m })))}
        />
      )}
      {tab === "life" && <LifePanel clip={clips.find((c) => c.id === selectedId)} onUpdate={(p) => selectedId && updateClip(selectedId, p)} />}
      {tab === "life" && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{L("環境動態", "Atmosphere effects")}</h3>
          <p className="text-xs text-muted-foreground">
            {L("雲飄、飛霧、山嵐、蒸氣、噴火、小火、營火、輕煙、下雨、飄雪，點一下加入畫面，可調整位置與大小。", "Drifting clouds, fog, mountain mist, steam, fire breath, small flame, bonfire, smoke, rain and snow. Tap to add, then adjust.")}
          </p>
          <StickerPanel
            stickers={stickers}
            selectedId={selectedSticker}
            total={total}
            cat="atmo"
            noNudge
            onAdd={addSticker}
            onSelect={setSelectedSticker}
            onUpdate={(id, patch) => setStickers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
            onRemove={(id) => {
              setStickers((prev) => prev.filter((x) => x.id !== id));
              setSelectedSticker(null);
            }}
          />
        </div>
      )}
      {(tab === "wear" || tab === "scene") && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {tab === "wear"
              ? L("選擇帽子、眼鏡、飾品、鞋襪等插圖放到人物身上，可調整位置與大小。", "Place hats, glasses, jewelry, shoes and socks on the person, then adjust position and size.")
              : L("選擇樹木、櫻花、椰子樹、仙人掌、竹林、花草、蘑菇、山景，以及飄落的葉子、花瓣、蝴蝶、螢火蟲放進背景，可調整位置與大小。", "Add trees, cherry blossoms, palms, cacti, bamboo, flowers, mushrooms, mountains, plus falling leaves, petals, butterflies and fireflies, then adjust them.")}
          </p>
          <StickerPanel
            stickers={stickers}
            selectedId={selectedSticker}
            total={total}
            cat={tab === "wear" ? "wear" : "scene"}
            noNudge
            onAdd={addSticker}
            onSelect={setSelectedSticker}
            onUpdate={(id, patch) => setStickers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
            onRemove={(id) => {
              setStickers((prev) => prev.filter((x) => x.id !== id));
              setSelectedSticker(null);
            }}
          />
        </div>
      )}
      {tab === "trans" && clips.length > 1 && (
        <Range
          label={L("銜接時長", "Blend time")}
          value={clips[1]?.fadeLen ?? 0.8}
          min={0.3}
          max={2.5}
          step={0.1}
          suffix="s"
          onChange={(v) => setClips((prev) => prev.map((c) => ({ ...c, fadeLen: v })))}
        />
      )}
      {tab === "trans" && (
        <TransitionsPanel
          clips={clips}
          selectedId={selectedId}
          aspect={aspect}
          fadeInOut={fadeInOut}
          onSet={setTransition}
          onSetAll={setAllTransitions}
          onAspect={setAspect}
          onFade={setFadeInOut}
        />
      )}
      {tab === "text" && (
        <TextPanel
          texts={texts}
          selectedId={selectedText}
          total={total}
          onSelect={setSelectedText}
          onAdd={addText}
          still={false}
          noNudge
          onUpdate={(id, patch) => setTexts((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
          onRemove={(id) => {
            setTexts((prev) => prev.filter((x) => x.id !== id));
            setSelectedText(null);
          }}
        />
      )}
      {tab === "art" && func === "single" && <ArtPanel art={art} onChange={setArt} />}
      {tab === "stickers" && (
        <StickerPanel
          stickers={stickers}
          selectedId={selectedSticker}
          total={total}
          noNudge
          onAdd={addSticker}
          onSelect={setSelectedSticker}
          onUpdate={(id, patch) => setStickers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
          onRemove={(id) => {
            setStickers((prev) => prev.filter((x) => x.id !== id));
            setSelectedSticker(null);
          }}
        />
      )}
      {tab === "music" && (
        <MusicPanel
          name={musicName}
          volume={musicVolume}
          activeId={activeTrack}
          loadingId={loadingTrack}
          onPickTrack={pickTrack}
          onPick={pickMusic}
          onVolume={setMusicVolume}
          onRemove={removeMusic}
        />
      )}
      {tab === "sfx" && (
        <SfxPanel
          time={time}
          total={total}
          items={sfxItems}
          volume={sfxVolume}
          onAdd={(kind, name) => {
            const id = crypto.randomUUID();
            setSfxItems((prev) => [...prev, { id, kind, name, at: Math.max(0, time) }]);
            return id;
          }}
          onRemove={(id) => setSfxItems((prev) => prev.filter((x) => x.id !== id))}
          onUpdate={(id, patch) => setSfxItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
          onSpread={() =>
            setSfxItems((prev) => {
              const slice = total / prev.length;
              return prev.map((x, i) => ({ ...x, at: i * slice, span: Math.max(0, slice * 0.9) }));
            })
          }
          onClear={() => setSfxItems([])}
          onVolume={setSfxVolume}
        />
      )}
      {tab === "special" &&
        (mode === "hand" ? (
          <DrawPanel
            color={color}
            size={size}
            onColor={setColor}
            onSize={setSize}
            onUndo={() => stageRef.current?.undo()}
            onClear={() => stageRef.current?.clear()}
          />
        ) : (
          <MotionPanel templateId={templateId} onPick={(m) => setTemplateId(m.id)} />
        ))}
</EditLockPanel>}

      {clips.length > 0 && (!aiGuided || aiStage === "done") && (
        <div className="flex flex-col gap-2">
          {exporting && (
            <div className="flex flex-col gap-1" role="status">
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {L("正在即時錄製輸出，請保持畫面開啟…", "Recording in real time. Keep this screen open...")} {Math.round(progress * 100)}%
              </p>
            </div>
          )}
          <SaveDialog pending={pending} onClose={() => setPending(null)} />
      {lifecycle && <LifecycleBar lifecycle={lifecycle} disabled={exporting} />}
          {func === "single" && (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={L("輸出方式", "Output")}>
              <Button type="button" variant={outFmt === "orig" ? "default" : "outline"} className="h-auto flex-col gap-0.5 py-2" onClick={() => setOutFmt("orig")} aria-pressed={outFmt === "orig"} disabled={exporting}>
                <span>{L("保持原創", "Keep original")}</span>
                <span className="text-xs font-normal opacity-80">{L("直接下載", "Download directly")}</span>
              </Button>
              <Button type="button" variant={outFmt === "gif" ? "default" : "outline"} className="h-auto flex-col gap-0.5 py-2" onClick={() => setOutFmt("gif")} aria-pressed={outFmt === "gif"} disabled={exporting}>
                <span>{L("製成 GIF", "Make a GIF")}</span>
                <span className="text-xs font-normal opacity-80">{L("自動重複播放", "Loops automatically")}</span>
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button className="h-12 flex-1" onClick={handleDownload} disabled={exporting || overLimit}>
              {exporting ? <Spinner /> : <Download className="size-4" aria-hidden="true" />}
              {exporting ? t("exporting") : `${t("download")} · ${FREE_TESTING ? L("測試期免費", "Free during testing") : L(`扣 ${cost} 點`, `${cost} pts`)}`}
            </Button>
            {exporting && (
              <Button variant="outline" className="h-12" onClick={() => abortRef.current?.abort()}>
                <X className="size-4" />
                {L("取消", "Cancel")}
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">{t("ephemeral")}</p>
    </div>
  );
}
