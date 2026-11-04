"use client";

import {
  Clapperboard,
  Eraser,
  Images,
  LayoutGrid,
  LayoutTemplate,
  PenLine,
  Smile,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useLang } from "@/components/lang-context";
import { FUNCS_AI, FUNCS_HAND, type EditFunc } from "@/lib/funcs";
import type { EditMode } from "@/components/app-shell";

interface Props {
  onPick: (mode: EditMode, f: EditFunc) => void;
}

const ICONS: Record<EditFunc, React.ReactNode> = {
  card: <LayoutTemplate className="size-5" aria-hidden="true" />,
  collage: <LayoutGrid className="size-5" aria-hidden="true" />,
  single: <Sparkles className="size-5" aria-hidden="true" />,
  photos: <Images className="size-5" aria-hidden="true" />,
  video: <Clapperboard className="size-5" aria-hidden="true" />,
  cutout: <Eraser className="size-5" aria-hidden="true" />,
  sticker: <Smile className="size-5" aria-hidden="true" />,
  restore: <Wrench className="size-5" aria-hidden="true" />,
};

function Group({
  title,
  desc,
  icon,
  list,
  onPick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  list: typeof FUNCS_HAND;
  onPick: (f: EditFunc) => void;
}) {
  const { L } = useLang();
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-3 px-1 pt-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {icon}
        </span>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {list.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onPick(f.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-start transition-colors hover:bg-secondary"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                {ICONS[f.id]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-base font-medium">
                  {i + 1}. {L(f.zh, f.en)}
                </span>
                <span className="text-sm text-muted-foreground">{L(f.descZh, f.descEn)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SelectView({ onPick }: Props) {
  const { L } = useLang();
  return (
    <div className="flex flex-col gap-6">
      <Group
        title={L("一、自助手工編輯", "1. Self-service manual editing")}
        desc={L("自己動手，適合小容量作品", "Hands-on tools for smaller projects")}
        icon={<PenLine className="size-5" aria-hidden="true" />}
        list={FUNCS_HAND}
        onPick={(f) => onPick("hand", f)}
      />
      <Group
        title={L("二、AI 助理編輯", "2. AI assistant editing")}
        desc={L("AI 協助，容量更大、功能升級", "AI-powered with bigger capacity")}
        icon={<Sparkles className="size-5" aria-hidden="true" />}
        list={FUNCS_AI}
        onPick={(f) => onPick("ai", f)}
      />
    </div>
  );
}
