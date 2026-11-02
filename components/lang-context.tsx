"use client";

import { createContext, useContext } from "react";
import type { LangCode } from "@/lib/i18n-editor";

interface LangContextValue {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: string) => string;
  /** Pick between Traditional Chinese and English copy for screens without full translations. */
  L: (zh: string, en: string) => string;
}

export const LangContext = createContext<LangContextValue | null>(null);

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangContext");
  return ctx;
}
