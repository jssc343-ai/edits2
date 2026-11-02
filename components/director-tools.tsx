"use client";

import { Music2, Shuffle, ArrowDownUp, Trash2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/lang-context";
import { FILTERS, type FilterId } from "@/lib/compositor";

interface Props {
  kind: "photo" | "video";
  count: number;
  limit: number;
  canFitMusic: boolean;
  onDuration: (seconds: number) => void;
  onSpeed: (speed: number) => void;
  onMuteAll: () => void;
  onFilter: (f: FilterId) => void;
  onReverse: () => void;
  onShuffle: () => void;
  onFitMusic: () => void;
  onClear: () => void;
}

const DURATIONS = [1.5, 2, 3, 4, 5, 8];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function DirectorTools(p: Props) {
  const { L } = useLang();
  return (
    <section aria-label={L("批次工具", "Batch tools")} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{L("導演批次工具", "Director batch tools")}</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {p.count} / {p.limit} {p.kind === "photo" ? L("張", "photos") : L("段", "clips")}
        </span>
      </div>

      {p.kind === "photo" ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">{L("全部相片每張停留", "Seconds per photo (all)")}</p>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <Button key={d} size="sm" variant="secondary" className="h-9 min-w-12" onClick={() => p.onDuration(d)}>
                {d}s
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">{L("全部片段播放速度", "Playback speed (all)")}</p>
          <div className="flex flex-wrap gap-1.5">
            {SPEEDS.map((s) => (
              <Button key={s} size="sm" variant="secondary" className="h-9 min-w-12" onClick={() => p.onSpeed(s)}>
                {s}x
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">{L("全部套用濾鏡", "Filter (all)")}</p>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button key={f.id} size="sm" variant="outline" className="h-9" onClick={() => p.onFilter(f.id)}>
              {L(f.zh, f.en)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="h-10" onClick={p.onReverse}>
          <ArrowDownUp className="size-4" aria-hidden="true" />
          {L("順序反轉", "Reverse")}
        </Button>
        <Button size="sm" variant="outline" className="h-10" onClick={p.onShuffle}>
          <Shuffle className="size-4" aria-hidden="true" />
          {L("隨機排序", "Shuffle")}
        </Button>
        {p.kind === "photo" ? (
          <Button size="sm" variant="outline" className="h-10" onClick={p.onFitMusic} disabled={!p.canFitMusic}>
            <Music2 className="size-4" aria-hidden="true" />
            {L("配合音樂長度", "Fit to music")}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-10" onClick={p.onMuteAll}>
            <VolumeX className="size-4" aria-hidden="true" />
            {L("全部靜音", "Mute all")}
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-10 text-destructive" onClick={p.onClear}>
          <Trash2 className="size-4" aria-hidden="true" />
          {L("全部清除", "Clear all")}
        </Button>
      </div>
    </section>
  );
}
