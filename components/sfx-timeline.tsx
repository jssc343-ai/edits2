"use client";

import { useRef } from "react";
import { sfxById, sfxLength, type SfxItem } from "@/lib/sfx";

const TICKS = [1, 2, 5, 10, 15, 30, 60, 120];
const snap = (v: number) => Math.round(v * 10) / 10;

interface Drag {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startAt: number;
  startSpan: number;
  natural: number;
}

export function SfxTimeline({
  items,
  total,
  time,
  openId,
  onSelect,
  onUpdate,
}: {
  items: SfxItem[];
  total: number;
  time: number;
  openId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<SfxItem>) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const T = Math.max(total, 1);
  const tickStep = TICKS.find((t) => T / t <= 8) ?? 120;
  const ticks = Array.from({ length: Math.floor(T / tickStep) + 1 }, (_, i) => i * tickStep);
  const sorted = [...items].sort((a, b) => a.at - b.at);

  const secondsPerPx = () => T / Math.max(1, trackRef.current?.getBoundingClientRect().width ?? 1);

  const begin = (e: React.PointerEvent, it: SfxItem, mode: Drag["mode"]) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = sfxById(it.kind);
    drag.current = {
      id: it.id,
      mode,
      startX: e.clientX,
      startAt: it.at,
      startSpan: it.span ?? 0,
      natural: s ? sfxLength(s) : 1,
    };
    onSelect(it.id);
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dt = (e.clientX - d.startX) * secondsPerPx();
    if (d.mode === "move") {
      const at = Math.min(Math.max(0, d.startAt + dt), Math.max(0, T - 0.1));
      onUpdate(d.id, { at: snap(at) });
    } else {
      const end = d.startAt + Math.max(d.natural, d.startSpan) + dt;
      const maxEnd = Math.max(T, d.startAt + d.natural);
      const span = Math.min(end, maxEnd) - d.startAt;
      onUpdate(d.id, { span: span <= d.natural + 0.15 ? 0 : snap(span) });
    }
  };

  const end = (e: React.PointerEvent) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2">
      <div className="relative h-5 text-[11px] text-muted-foreground">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute top-0 -translate-x-1/2 tabular-nums first:translate-x-0"
            style={{ left: `${(t / T) * 100}%` }}
          >
            {t}s
          </span>
        ))}
      </div>
      <div ref={trackRef} className="relative flex flex-col gap-1">
        {ticks.map((t) => (
          <span
            key={t}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-border"
            style={{ left: `${(t / T) * 100}%` }}
          />
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-foreground"
          style={{ left: `${Math.min(100, (time / T) * 100)}%` }}
        />
        {sorted.map((it, i) => {
          const s = sfxById(it.kind);
          const natural = s ? sfxLength(s) : 1;
          const len = Math.max(natural, it.span ?? 0);
          const left = Math.min(it.at, T) / T;
          const width = Math.min(len / T, 1 - left);
          const active = it.id === openId;
          const color = `var(--chart-${(i % 5) + 1}, var(--primary))`;
          return (
            <div key={it.id} className="relative h-10">
              <div
                role="button"
                tabIndex={0}
                aria-label={it.name}
                onPointerDown={(e) => begin(e, it, "move")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(it.id);
                  if (e.key === "ArrowLeft") onUpdate(it.id, { at: snap(Math.max(0, it.at - 0.1)) });
                  if (e.key === "ArrowRight") onUpdate(it.id, { at: snap(Math.min(T, it.at + 0.1)) });
                }}
                className={`absolute inset-y-0 flex min-w-6 cursor-grab touch-none items-center overflow-hidden rounded-md border-2 pl-2 pr-6 text-xs font-medium text-white active:cursor-grabbing ${
                  active ? "border-foreground" : "border-transparent"
                }`}
                style={{ left: `${left * 100}%`, width: `${Math.max(width, 0.02) * 100}%`, backgroundColor: color }}
              >
                <span className="truncate drop-shadow">{it.name}</span>
                <div
                  role="separator"
                  aria-label="resize"
                  onPointerDown={(e) => begin(e, it, "resize")}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  className="absolute inset-y-0 right-0 flex w-6 cursor-ew-resize touch-none items-center justify-center bg-black/25"
                >
                  <span className="h-4 w-0.5 rounded bg-white/90" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
