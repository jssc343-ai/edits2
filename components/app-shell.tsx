"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangContext } from "@/components/lang-context";
import { LanguagePicker } from "@/components/language-picker";
import { SelectView } from "@/components/views/select-view";
import { EditorView } from "@/components/views/editor-view";
import { PosterEditor } from "@/components/views/poster-editor";
import { AiCompose } from "@/components/views/ai-compose";
import { PayView } from "@/components/views/pay-view";
import { CutoutEditor } from "@/components/views/cutout-editor";
import { StickerEditor } from "@/components/views/sticker-editor";
import { WalletProvider } from "@/components/wallet-context";
import { FUNCS_AI, FUNCS_HAND, type EditFunc } from "@/lib/funcs";
import { translate, type LangCode } from "@/lib/i18n-editor";
import { useApp } from "@/lib/app-state";

export type EditKind = "photo" | "video";
export type EditMode = "hand" | "ai";
type View = "select" | "editor" | "pay";

export function AppShell() {
  return (
    <WalletProvider>
      <AppShellInner />
    </WalletProvider>
  );
}

function AppShellInner() {
  const { lang, setLang } = useApp();
  const [view, setView] = useState<View>("select");
  const [func, setFunc] = useState<EditFunc | null>(null);
  const [mode, setMode] = useState<EditMode | null>(null);

  const ctx = useMemo(() => {
    const zh = lang === "zh-TW" || lang === "zh-CN";
    return {
      lang: lang as LangCode,
      setLang: (code: LangCode) => setLang(code),
      t: (key: string) => translate(lang as LangCode, key),
      L: (zhText: string, enText: string) => (zh ? zhText : enText),
    };
  }, [lang, setLang]);

  const { t } = ctx;
  const funcTitle = (mode === "ai" ? FUNCS_AI : FUNCS_HAND).find((x) => x.id === func);

  const pick = (m: EditMode, f: EditFunc) => {
    setMode(m);
    setFunc(f);
    setView("editor");
  };

  const title =
    view === "pay"
      ? ctx.L("Pi 支付", "Pi Pay")
      : view === "editor" && funcTitle
        ? ctx.L(funcTitle.zh, funcTitle.en)
        : t("chooseType");

  return (
    <LangContext.Provider value={ctx}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
          {view === "select" ? (
            <Button asChild variant="ghost" size="icon" className="size-10">
              <Link href="/" aria-label={t("back")}>
                <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              onClick={() => setView(view === "pay" ? "select" : "select")}
              aria-label={t("back")}
            >
              <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
            </Button>
          )}
          <h1 className="flex-1 truncate text-center text-base font-semibold">{title}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            onClick={() => setView("pay")}
            aria-label={ctx.L("Pi 支付", "Pi Pay")}
          >
            <Coins className="size-5" aria-hidden="true" />
          </Button>
          <LanguagePicker />
        </header>

        <main className="flex-1 px-4 py-5">
          {view === "pay" && <PayView />}
          {view === "select" && <SelectView onPick={pick} />}
          {view === "editor" && (func === "card" || func === "collage") && mode === "ai" && <AiCompose key={`${func}-ai`} variant={func} />}
          {view === "editor" && (func === "card" || func === "collage") && mode === "hand" && <PosterEditor key={`${func}-hand`} variant={func} />}
          {view === "editor" && func === "cutout" && mode && <CutoutEditor key={`cutout-${mode}`} mode={mode} />}
          {view === "editor" && func === "sticker" && mode && <StickerEditor key={`sticker-${mode}`} mode={mode} />}
          {view === "editor" && (func === "single" || func === "photos" || func === "video") && mode && (
            <EditorView key={`${func}-${mode}`} func={func} mode={mode} onOpenPay={() => setView("pay")} />
          )}
        </main>
      </div>
    </LangContext.Provider>
  );
}
