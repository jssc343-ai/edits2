"use client";

import { Download, LayoutGrid, MessagesSquare, UserRound } from "lucide-react";
import { useApp } from "@/lib/app-state";
import type { TKey } from "@/lib/i18n";

const STEPS: { icon: typeof UserRound; title: TKey; body: TKey }[] = [
  { icon: UserRound, title: "guide1T", body: "guide1B" },
  { icon: MessagesSquare, title: "guide2T", body: "guide2B" },
  { icon: LayoutGrid, title: "guide3T", body: "guide3B" },
  { icon: Download, title: "guide4T", body: "guide4B" },
];

export function GuideSection() {
  const { t } = useApp();
  return (
    <section aria-labelledby="guide-title">
      <h2 id="guide-title" className="mb-3 text-lg font-semibold">
        {t("guideTitle")}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <s.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-medium">
                {i + 1}. {t(s.title)}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(s.body)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
