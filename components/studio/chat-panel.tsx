"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Mic, MicOff, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage, ChatMode } from "@/lib/edit-types";
import { fileToReference } from "@/lib/media";
import type { VoiceState } from "@/lib/use-voice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  mode: ChatMode;
  messages: ChatMessage[];
  suggestions: string[];
  loading: boolean;
  voiceState: VoiceState;
  interim: string;
  onSend: (text: string, images?: string[]) => void;
  onToggleMic: () => void;
  labels: {
    attachImage: string;
    removeImage: string;
    imageOnlyText: string;
    tooMany: string;
    error: string;
    placeholder: string;
    send: string;
    listening: string;
    replying: string;
    thinking: string;
    idle: string;
    tapToTalk: string;
    tapToStop: string;
  };
}

export function ChatPanel({
  mode,
  messages,
  suggestions,
  loading,
  voiceState,
  interim,
  onSend,
  onToggleMic,
  labels,
}: Props) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  const seenCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > seenCount.current || loading) {
      endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    seenCount.current = messages.length;
  }, [messages, loading]);

  function submit() {
    const text = draft.trim();
    if ((!text && pending.length === 0) || loading) return;
    const images = pending;
    setDraft("");
    setPending([]);
    onSend(text || labels.imageOnlyText, images);
  }

  async function onPick(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (attachRef.current) attachRef.current.value = "";
    try {
      const room = mode === "text" ? 3 - pending.length : 3;
      if (picked.length > room) toast.error(labels.tooMany);
      const urls = await Promise.all(picked.slice(0, Math.max(room, 0)).map((f) => fileToReference(f)));
      if (mode === "text") setPending((prev) => [...prev, ...urls]);
      else if (urls.length > 0) onSend(labels.imageOnlyText, urls);
    } catch {
      toast.error(labels.error);
    }
  }

  const status = loading
    ? labels.thinking
    : voiceState === "listening"
      ? labels.listening
      : voiceState === "speaking"
        ? labels.replying
        : labels.idle;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      <input
        ref={attachRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={labels.attachImage}
        onChange={(e) => void onPick(e.target.files)}
      />
      <div ref={scrollRef} className="min-h-[240px] p-3" aria-live="polite">
        <ul className="flex flex-col gap-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex max-w-[88%] flex-col gap-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-secondary text-secondary-foreground"
              }`}
            >
              {m.images?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {m.images.map((src, i) => (
                    <img key={i} src={src} alt="" className="size-20 rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
              {m.text}
            </li>
          ))}
          {interim ? (
            <li className="max-w-[88%] self-end rounded-2xl border border-dashed border-primary px-3.5 py-2.5 text-sm text-muted-foreground">
              {interim}
            </li>
          ) : null}
          {loading ? (
            <li className="flex items-center gap-2 self-start text-sm text-muted-foreground">
              <Spinner /> {labels.thinking}
            </li>
          ) : null}
        </ul>
        <div ref={endRef} />
      </div>

      {suggestions.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-3 pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => onSend(s)}
              className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm text-primary disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {mode === "text" && pending.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-border px-3 pt-3">
          {pending.map((src, i) => (
            <div key={i} className="relative shrink-0">
              <img src={src} alt="" className="size-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                aria-label={labels.removeImage}
                className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {mode === "text" ? (
        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-11 shrink-0"
            disabled={loading}
            onClick={() => attachRef.current?.click()}
            aria-label={labels.attachImage}
          >
            <ImagePlus className="size-5" aria-hidden="true" />
          </Button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
            }}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" className="size-11" disabled={loading || (!draft.trim() && pending.length === 0)} aria-label={labels.send}>
            <SendHorizontal className="size-5" aria-hidden="true" />
          </Button>
        </form>
      ) : (
        <div className="relative flex flex-col items-center gap-2 border-t border-border p-4">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-3 top-3 size-11"
            disabled={loading}
            onClick={() => attachRef.current?.click()}
            aria-label={labels.attachImage}
          >
            <ImagePlus className="size-5" aria-hidden="true" />
          </Button>
          <button
            type="button"
            onClick={onToggleMic}
            disabled={loading}
            aria-label={voiceState === "listening" ? labels.tapToStop : labels.tapToTalk}
            className={`relative flex size-20 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
              voiceState === "listening"
                ? "bg-destructive text-destructive-foreground"
                : voiceState === "speaking"
                  ? "bg-accent text-accent-foreground"
                  : "bg-primary text-primary-foreground"
            }`}
          >
            {voiceState === "listening" ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40" aria-hidden="true" />
            ) : null}
            {voiceState === "speaking" ? (
              <span className="absolute -inset-1 animate-pulse rounded-full border-2 border-accent" aria-hidden="true" />
            ) : null}
            {voiceState === "listening" ? (
              <MicOff className="relative size-8" aria-hidden="true" />
            ) : (
              <Mic className="relative size-8" aria-hidden="true" />
            )}
          </button>
          <p className="text-sm font-medium" role="status">
            {status}
          </p>
          <p className="text-xs text-muted-foreground">
            {voiceState === "listening" ? labels.tapToStop : labels.tapToTalk}
          </p>
        </div>
      )}
    </div>
  );
}
