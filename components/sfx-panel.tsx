"use client";

import { useState } from "react";
import { Plus, Shuffle, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/components/lang-context";
import { Range } from "@/components/editor-panels";
import { SfxTimeline } from "@/components/sfx-timeline";
import {
  SFX_CATEGORIES,
  SFX_LIST,
  previewSfx,
  sfxById,
  sfxLength,
  sfxOccurrences,
  type SfxCategory,
  type SfxItem,
} from "@/lib/sfx";

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

export function SfxPanel({
  time,
  total,
  items,
  volume,
  onAdd,
  onRemove,
  onUpdate,
  onSpread,
  onClear,
  onVolume,
}: {
  time: number;
  total: number;
  items: SfxItem[];
  volume: number;
  onAdd: (kind: string, name: string) => string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<SfxItem>) => void;
  onSpread: () => void;
  onClear: () => void;
  onVolume: (v: number) => void;
}) {
  const { L } = useLang();
  const [cat, setCat] = useState<SfxCategory>("animal");
  const [picked, setPicked] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const list = SFX_LIST.filter((s) => s.cat === cat);
  const pickedSfx = SFX_LIST.find((s) => s.id === picked);
  const sorted = [...items].sort((a, b) => a.at - b.at);
  const open = items.find((i) => i.id === openId);
  const openSfx = open ? sfxById(open.kind) : undefined;
  const natural = openSfx ? sfxLength(openSfx) : 1;
  const maxStart = Math.max(0.5, total);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {L(
          `共 ${SFX_LIST.length} 種配音。點一下試聽，再加到目前播放位置；加入後可設定開始時間、重複多久、間隔與音量。`,
          `${SFX_LIST.length} sound effects. Tap to preview, add at the current position, then set start, repeat window, gap and volume.`,
        )}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SFX_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`min-h-9 shrink-0 rounded-full border px-3 text-sm ${
              cat === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {L(c.zh, c.en)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setPicked(s.id);
              previewSfx(s.id);
            }}
            className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-sm ${
              picked === s.id ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            <Volume2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{L(s.zh, s.en)}</span>
          </button>
        ))}
      </div>
      <Button
        disabled={!pickedSfx}
        onClick={() => {
          if (!pickedSfx) return;
          setOpenId(onAdd(pickedSfx.id, L(pickedSfx.zh, pickedSfx.en)));
        }}
        className="min-h-11"
      >
        <Plus className="size-4" />
        {pickedSfx
          ? L(`加入「${pickedSfx.zh}」到 ${fmt(time)}`, `Add "${pickedSfx.en}" at ${fmt(time)}`)
          : L("先選一種配音", "Pick an effect first")}
      </Button>

      {items.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <Range label={L("配音總音量", "Effects volume")} value={volume} min={0} max={1} step={0.05} onChange={onVolume} />

          <SfxTimeline items={items} total={total} time={time} openId={openId} onSelect={setOpenId} onUpdate={onUpdate} />
          <p className="text-xs text-muted-foreground">
            {L(
              "時間軸：左右拖動長條改變開始時間；拖右端把手拉長或縮短重複範圍（縮到最短就只播一次）。黑線是目前播放位置。",
              "Timeline: drag a bar to change its start; drag the right handle to lengthen or shorten the repeat range (shortest = play once). The black line is the playhead.",
            )}
          </p>

          <ul className="flex flex-col gap-2">
            {sorted.map((it) => {
              const s = sfxById(it.kind);
              const count = s ? sfxOccurrences(it, sfxLength(s)).length : 1;
              const active = it.id === openId;
              return (
                <li key={it.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(active ? null : it.id)}
                    aria-expanded={active}
                    className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 text-left text-sm ${
                      active ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{it.name}</span>
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {fmt(it.at)}
                      {count > 1 ? ` · ×${count}` : ""}
                    </span>
                  </button>
                  <Button size="icon" variant="ghost" className="size-11" aria-label={L("刪除", "Delete")} onClick={() => onRemove(it.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>

          {open && openSfx && (
            <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">{L(`調整「${open.name}」`, `Adjust "${open.name}"`)}</p>
              <Range
                label={L(`開始時間 ${fmt(open.at)}`, `Start ${fmt(open.at)}`)}
                value={Math.min(open.at, maxStart)}
                min={0}
                max={maxStart}
                step={0.1}
                onChange={(v) => onUpdate(open.id, { at: v })}
              />
              <Range
                label={
                  (open.span ?? 0) > 0
                    ? L(`重複時間 ${(open.span ?? 0).toFixed(1)} 秒`, `Repeat window ${(open.span ?? 0).toFixed(1)}s`)
                    : L("重複時間：只播一次", "Repeat window: play once")
                }
                value={open.span ?? 0}
                min={0}
                max={Math.max(5, Math.ceil(total))}
                step={0.5}
                onChange={(v) => onUpdate(open.id, { span: v })}
              />
              <Range
                label={L(`每次之間停 ${(open.pause ?? 0).toFixed(1)} 秒`, `Gap between repeats ${(open.pause ?? 0).toFixed(1)}s`)}
                value={open.pause ?? 0}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) => onUpdate(open.id, { pause: v })}
              />
              <Range
                label={L("這個配音的音量", "This effect's volume")}
                value={open.vol ?? 1}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(v) => onUpdate(open.id, { vol: v })}
              />
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
                <span>{L("自然隨機（時間與音量略有變化）", "Natural random (vary timing and volume)")}</span>
                <Switch checked={!!open.random} onCheckedChange={(v) => onUpdate(open.id, { random: v })} />
              </label>
              <p className="text-xs text-muted-foreground">
                {L(
                  `單次約 ${natural.toFixed(1)} 秒，目前共出現 ${sfxOccurrences(open, natural).length} 次。`,
                  `One play is about ${natural.toFixed(1)}s; it will sound ${sfxOccurrences(open, natural).length} time(s).`,
                )}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="min-h-11" onClick={() => onUpdate(open.id, { at: Math.max(0, time) })}>
                  {L("移到目前播放位置", "Move to playhead")}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => onUpdate(open.id, { span: Math.max(0, total - open.at) })}
                >
                  {L("重複到影片結束", "Repeat to the end")}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="min-h-11" onClick={onSpread} disabled={items.length < 2 || total <= 0}>
              <Shuffle className="size-4" />
              {L("自動錯開時間", "Auto-spread in time")}
            </Button>
            <Button variant="outline" className="min-h-11" onClick={onClear}>
              {L("全部清除", "Clear all")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {L(
              "多種配音時，「自動錯開時間」會把它們平均分配在整段影片，每一種各佔一段，彼此不重疊。",
              "With several effects, auto-spread gives each its own slice of the video so they do not overlap.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
