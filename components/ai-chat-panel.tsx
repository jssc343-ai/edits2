"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Hand, Loader2, Mic, MicOff, Send, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/components/lang-context";
import { localEdit } from "@/lib/local-ai";
import { useVoice } from "@/lib/use-voice";

export interface AiAction {
  type: string;
  index: number | null;
  text: string | null;
  kind: string | null;
  x: number | null;
  y: number | null;
  size: number | null;
  w: number | null;
  h: number | null;
  rot: number | null;
  sx: number | null;
  sy: number | null;
  opacity: number | null;
  color: string | null;
  fill: string | null;
  stroke: number | null;
  rows: number | null;
  cols: number | null;
  font: string | null;
  gradient: number | null;
  aspect: string | null;
  style: "grid" | "feature" | "side" | null;
  gap: number | null;
  zoom: number | null;
  bright: number | null;
  contrast: number | null;
  sat: number | null;
  warm: number | null;
}

interface Msg {
  role: "user" | "assistant";
  text: string;
}

interface Props<A> {
  getState: () => unknown;
  onActions: (actions: A[]) => void;
  /** Card or collage; selects the poster brain and the instant local commands. */
  variant?: "card" | "collage";
  endpoint?: string;
  extraBody?: Record<string, unknown>;
  examples?: string[];
  onManual?: () => void;
  manualOpen?: boolean;
  /** The element the player tapped on the canvas; "this"/"it" in chat refers to it. */
  selected?: { label: string; payload: unknown } | null;
  onClearSelected?: () => void;
  /** Deletes every boxed element at once (one-tap alternative to asking the AI). */
  onDeleteSelected?: () => void;
}

export function AiChatPanel<A = AiAction>({
  variant,
  endpoint = "/api/ai-edit",
  extraBody,
  examples: customExamples,
  getState,
  onActions,
  onManual,
  manualOpen,
  selected,
  onClearSelected,
  onDeleteSelected,
}: Props<A>) {
  const { L, lang } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendRef = useRef<(text: string) => void>(() => {});
  const [talk, setTalk] = useState(false);
  const talkRef = useRef(false);
  talkRef.current = talk;

  const speak = (text: string) => {
    if (!talkRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  };

  const reply = (text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", text }]);
    speak(text);
  };

  useEffect(() => {
    if (!talk && typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [talk]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const voice = useVoice({
    lang,
    onFinal: (text) => sendRef.current(text),
    onUnsupported: () => setVoiceError(true),
  });

  const examples =
    customExamples ??
    [
      L("把標題改成「生日快樂」放在上方", "Put the title “Happy Birthday” at the top"),
      L("加一個愛心貼圖在右下角", "Add a heart sticker at the bottom right"),
      L("背景換成粉紅色", "Change the background to pink"),
      L("加一個 3 列 2 欄的表格", "Add a table with 3 rows and 2 columns"),
    ];

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || busy) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    if (variant && !selected) {
      const instant = localEdit(message, lang === "zh-TW" || lang === "zh-CN");
      if (instant) {
        onActions(instant.actions as unknown as A[]);
        reply(instant.reply);
        inputRef.current?.focus({ preventScroll: true });
        return;
      }
    }
    setBusy(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 50000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, variant, lang, history, state: getState(), selected: selected?.payload ?? null, ...extraBody }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { reply: string; actions: A[] };
      if (data.actions?.length) onActions(data.actions);
      reply(data.reply || L("好了。", "Done."));
    } catch {
      reply(L("AI 暫時沒有回應，請再說一次。", "The AI did not respond. Please try again."));
    } finally {
      clearTimeout(timer);
      setBusy(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    sendRef.current = (text: string) => void send(text);
  });

  const listening = voice.state === "listening";

  return (
    <>
      <section
        hidden={manualOpen}
        aria-label={L("AI 對話助理", "AI chat assistant")}
        className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          {L("AI 助理：說一步，做一步", "AI assistant: say a step, it does a step")}
        </h3>
        <div className="flex gap-1 rounded-full border border-border bg-secondary p-1" role="group" aria-label={L("對話方式", "Chat mode")}>
          <button
            type="button"
            onClick={() => { setTalk(false); voice.stopListening(); }}
            aria-pressed={!talk}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${!talk ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          >
            {L("文字對文字（無語音）", "Text to text (silent)")}
          </button>
          <button
            type="button"
            onClick={() => setTalk(true)}
            aria-pressed={talk}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${talk ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          >
            {L("語音對語音（含文字）", "Voice to voice (with text)")}
          </button>
        </div>
        <div ref={logRef} className="flex max-h-60 min-h-24 flex-col gap-2 overflow-y-auto overscroll-contain" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => send(ex)}
                  disabled={busy}
                  className="rounded-full border border-border bg-secondary px-3 py-1.5 text-start text-xs text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <p
              key={i}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-secondary text-foreground"
              }`}
            >
              {m.text}
            </p>
          ))}
          {listening && voice.interim && (
            <p className="max-w-[90%] self-end rounded-2xl border border-dashed border-primary px-3 py-2 text-sm text-muted-foreground">
              {voice.interim}
            </p>
          )}
          {busy && (
            <p className="flex items-center gap-2 self-start text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {L("AI 處理中…", "AI is working…")}
            </p>
          )}
        </div>
        {selected ? (
          <div className="flex items-center gap-2 rounded-xl border border-primary bg-primary/10 px-3 py-2 text-sm" role="status">
            <Crosshair className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">
              {L("已選取：", "Selected: ")}
              <strong>{selected.label}</strong>
              {L(" — 直接說要怎麼改", " — just say what to change")}
            </span>
            {onDeleteSelected && (
              <button type="button" onClick={onDeleteSelected} aria-label={L("刪除選取的元件", "Delete selected")} className="rounded-full p-1 text-destructive">
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
            {onClearSelected && (
              <button type="button" onClick={onClearSelected} aria-label={L("取消選取", "Clear selection")} className="rounded-full p-1">
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {L("小技巧：點一下預覽中的素材會出現方框，可連點多個；再點一次方框消失。接著說「把它們…」或按垃圾桶刪除。", "Tip: tap items in the preview to box them (several allowed); tap again to unbox. Then say “make them…” or tap the bin to delete.")}
          </p>
        )}
        {voiceError && (
          <p className="text-xs text-destructive" role="alert">
            {L("此瀏覽器無法使用語音，或尚未允許麥克風。請改用打字。", "Voice is unavailable or the microphone is blocked. Please type instead.")}
          </p>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          {talk && (
          <Button
            type="button"
            size="icon"
            variant={listening ? "default" : "outline"}
            disabled={busy}
            onClick={() => {
              setVoiceError(false);
              if (listening) voice.stopListening();
              else voice.startListening();
            }}
            aria-pressed={listening}
            aria-label={listening ? L("停止聆聽", "Stop listening") : L("語音說話", "Speak")}
          >
            {listening ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
          </Button>
          )}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder={L("說話或打字，告訴 AI 下一步", "Speak or type the next step")}
            aria-label={L("對 AI 說話", "Message the AI")}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) e.stopPropagation();
            }}
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label={L("送出", "Send")}>
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </section>
      {onManual && (
        <Button type="button" variant={manualOpen ? "default" : "outline"} onClick={onManual} className="h-11 w-full">
          <Hand className="size-4" aria-hidden="true" />
          {manualOpen
            ? L("完成手工補足，回到 AI 對話（手工工具會隱藏）", "Done with manual edits, back to AI chat (manual tools hide)")
            : L("需要手工補足（AI 對話會隱藏）", "Switch to manual touch-ups (AI chat hides)")}
        </Button>
      )}
    </>
  );
}
