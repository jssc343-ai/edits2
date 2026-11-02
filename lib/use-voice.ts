"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLang } from "@/lib/i18n";

export type VoiceState = "idle" | "listening" | "speaking";

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Options {
  lang: string;
  onFinal: (text: string) => void;
  onUnsupported: () => void;
}

export function useVoice({ lang, onFinal, onUnsupported }: Options) {
  const [state, setState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const onUnsupportedRef = useRef(onUnsupported);

  useEffect(() => {
    onFinalRef.current = onFinal;
    onUnsupportedRef.current = onUnsupported;
  }, [onFinal, onUnsupported]);

  const stopListening = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    setInterim("");
    setState((s) => (s === "listening" ? "idle" : s));
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      onUnsupportedRef.current();
      return;
    }
    window.speechSynthesis?.cancel();
    recRef.current?.abort();

    const rec = new Ctor();
    rec.lang = getLang(lang).speech;
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += text;
        else interimText += text;
      }
      setInterim(interimText || finalText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") onUnsupportedRef.current();
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      recRef.current = null;
      setInterim("");
      setState("idle");
      const text = finalText.trim();
      if (text) onFinalRef.current(text);
    };

    recRef.current = rec;
    try {
      rec.start();
      setState("listening");
    } catch {
      recRef.current = null;
      setState("idle");
    }
  }, [lang]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) {
        onEnd?.();
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = getLang(lang).speech;
      utter.onend = () => {
        setState("idle");
        onEnd?.();
      };
      utter.onerror = () => {
        setState("idle");
      };
      setState("speaking");
      synth.speak(utter);
    },
    [lang],
  );

  const cancel = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    window.speechSynthesis?.cancel();
    setInterim("");
    setState("idle");
  }, []);

  useEffect(() => () => {
    recRef.current?.abort();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  return { state, interim, startListening, stopListening, speak, cancel };
}
