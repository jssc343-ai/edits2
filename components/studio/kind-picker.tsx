"use client";

import { Brush, Film, Image as ImageIcon, Images, LayoutPanelTop, Layers, Sparkles, Video } from "lucide-react";
import { KINDS, type EditKind, type EditRoute } from "@/lib/edit-types";
import { useApp } from "@/lib/app-state";

const ICONS: Record<EditKind, typeof Film> = {
  poster: LayoutPanelTop,
  collage: Layers,
  single: ImageIcon,
  tour: Images,
  video: Video,
};

interface Props {
  route: EditRoute;
  onRoute: (r: EditRoute) => void;
  onPick: (k: EditKind) => void;
}

export function KindPicker({ route, onRoute, onPick }: Props) {
  const { t } = useApp();
  const groups = [
    { id: "photo" as const, title: t("photoEdit") },
    { id: "video" as const, title: t("videoEdit") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3" role="group" aria-label={t("routeAI")}>
        {(
          [
            { id: "ai", icon: Sparkles, label: "routeAI" },
            { id: "manual", icon: Brush, label: "routeManual" },
          ] as const
        ).map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={route === r.id}
            onClick={() => onRoute(r.id)}
            className={`flex h-14 items-center justify-center gap-2 rounded-2xl border font-medium transition-colors ${
              route === r.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
            }`}
          >
            <r.icon className="size-5" aria-hidden="true" />
            {t(r.label)}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.id} aria-label={g.title}>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{g.title}</h2>
          <ul className="flex flex-col gap-2">
            {KINDS.filter((k) => k.group === g.id).map((k) => {
              const Icon = ICONS[k.id];
              return (
                <li key={k.id}>
                  <button
                    type="button"
                    onClick={() => onPick(k.id)}
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{t(k.label)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
