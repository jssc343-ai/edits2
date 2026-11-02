"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Megaphone, MessageSquare, Mic, Settings, Type } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { LanguagePicker } from "@/components/language-picker";
import { AccountCard } from "@/components/account-card";
import { GuideSection } from "@/components/guide-section";
import { StorePanel } from "@/components/store-panel";
import { Button } from "@/components/ui/button";

const HIDDEN_TAPS = 7;

export function HomeScreen() {
  const { t, mode, setMode } = useApp();
  const router = useRouter();
  const taps = useRef({ count: 0, last: 0 });

  function onBrandTap() {
    const now = Date.now();
    taps.current.count = now - taps.current.last < 800 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= HIDDEN_TAPS) {
      taps.current.count = 0;
      router.push("/admin");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-4">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBrandTap}
          className="flex items-center gap-2 rounded-lg py-1 text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clapperboard className="size-5" aria-hidden="true" />
          </span>
          <span className="font-semibold">{t("appName")}</span>
        </button>
        <div className="flex items-center gap-1">
          <LanguagePicker />
          <Button asChild variant="ghost" size="icon" className="size-10">
            <Link href="/settings" aria-label={t("settings")}>
              <Settings className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-5 pt-2">
        <div className="scene-3d flex justify-center py-4" aria-hidden="true">
          <div className="float-3d relative h-40 w-64">
            <div className="absolute inset-0 -rotate-6 rounded-2xl bg-accent/80 shadow-xl" />
            <div className="absolute inset-0 translate-x-3 translate-y-2 rotate-3 rounded-2xl bg-primary/80 shadow-xl" />
            <div className="absolute inset-0 flex items-end rounded-2xl border border-border bg-card p-4 shadow-2xl">
              <div className="h-2 w-2/3 rounded-full bg-muted-foreground/40" />
            </div>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-balance text-3xl font-bold leading-tight sm:text-4xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            {t("heroSub")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label={t("modeText")}>
          {(
            [
              { id: "text", icon: Type, title: "modeText", desc: "modeTextDesc" },
              { id: "voice", icon: Mic, title: "modeVoice", desc: "modeVoiceDesc" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
                mode === m.id ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <m.icon className="size-6 text-primary" aria-hidden="true" />
              <span className="font-medium">{t(m.title)}</span>
              <span className="text-sm text-muted-foreground">{t(m.desc)}</span>
            </button>
          ))}
        </div>
        <Button asChild size="lg" className="h-12 text-base">
          <Link href="/studio">{t("openStudio")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 text-base">
          <Link href="/pro">{t("proEditor")}</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">{t("notSaved")}</p>
      </section>

      <AccountCard />
      <GuideSection />
      <StorePanel />

      <nav aria-label={t("announcements")} className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-12 gap-2">
          <Link href="/announcements">
            <Megaphone className="size-4" aria-hidden="true" />
            {t("announcements")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 gap-2">
          <Link href="/feedback">
            <MessageSquare className="size-4" aria-hidden="true" />
            {t("feedbackTitle")}
          </Link>
        </Button>
      </nav>
    </div>
  );
}
