"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Type } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { LanguagePicker } from "@/components/language-picker";
import { AccountCard } from "@/components/account-card";
import { Button } from "@/components/ui/button";

const HIDDEN_TAPS = 7;

export function SettingsScreen() {
  const { t, mode, setMode } = useApp();
  const router = useRouter();
  const taps = useRef({ count: 0, last: 0 });

  function onVersionTap() {
    const now = Date.now();
    taps.current.count = now - taps.current.last < 800 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= HIDDEN_TAPS) {
      taps.current.count = 0;
      router.push("/admin");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="h-11 gap-2 px-2">
          <Link href="/">
            <ArrowLeft className="size-5" aria-hidden="true" />
            {t("back")}
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{t("settings")}</h1>
        <LanguagePicker />
      </header>

      <section aria-labelledby="mode-title" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="mode-title" className="text-lg font-semibold">
          {t("settingsChat")}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3" role="group" aria-label={t("settingsChat")}>
          {(
            [
              { id: "text", icon: Type, title: "modeText" },
              { id: "voice", icon: Mic, title: "modeVoice" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`flex h-14 items-center justify-center gap-2 rounded-xl border font-medium transition-colors ${
                mode === m.id ? "border-primary bg-primary/10" : "border-border bg-secondary"
              }`}
            >
              <m.icon className="size-5 text-primary" aria-hidden="true" />
              {t(m.title)}
            </button>
          ))}
        </div>
      </section>

      <AccountCard />


      <footer className="mt-auto flex justify-center pt-6">
        <button
          type="button"
          onClick={onVersionTap}
          className="min-h-11 rounded-lg px-4 text-sm text-muted-foreground"
        >
          {t("appName")} · {t("version")}
        </button>
      </footer>
    </div>
  );
}
