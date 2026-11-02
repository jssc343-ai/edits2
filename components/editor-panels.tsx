"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Music2,
  Plus,
  Redo2,
  Scissors,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/components/lang-context";
import { Spinner } from "@/components/ui/spinner";
import { BUILT_IN_TRACKS, type Track } from "@/lib/music";
import {
  FILTERS,
  FONTS,
  TRANSITIONS,
  clipLen,
  type Aspect,
  type Clip,
  type FilterId,
  type TextItem,
  type TextRole,
  type TextStyle,
  type TransitionId,
} from "@/lib/compositor";
import { MOTION_TEMPLATES, type MotionTemplate } from "@/lib/templates";
import { STICKERS, STICKER_MAP, type StickerItem } from "@/lib/stickers";

export const fmt = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <span className="w-12 shrink-0 text-end tabular-nums">
        {Number.isInteger(value) ? value : value.toFixed(1)}
        {suffix}
      </span>
    </label>
  );
}

interface ClipsProps {
  kind: "photo" | "video";
  clips: Clip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Clip>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onSplit: (id: string) => void;
}

export function ClipsPanel(p: ClipsProps) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const sel = p.clips.find((c) => c.id === p.selectedId);

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {p.clips.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => p.onSelect(c.id)}
            aria-label={`${L("片段", "Clip")} ${i + 1}`}
            aria-pressed={c.id === p.selectedId}
            style={{ width: Math.min(160, Math.max(64, clipLen(c) * 8)) }}
            className={`relative h-16 shrink-0 overflow-hidden rounded-lg border-2 ${
              c.id === p.selectedId ? "border-primary" : "border-border"
            }`}
          >
            <img src={c.thumb || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-0 end-0 rounded-tl bg-foreground/70 px-1 text-xs text-background">
              {fmt(clipLen(c))}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={p.onAdd}
          aria-label={p.kind === "photo" ? L("新增相片", "Add photos") : L("新增影片", "Add videos")}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-primary/50 text-primary"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {sel && (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-3">
          {sel.type === "photo" ? (
            <Range
              label={L("顯示秒數", "Duration")}
              value={sel.duration}
              min={1}
              max={15}
              step={0.5}
              suffix="s"
              onChange={(v) => p.onUpdate(sel.id, { duration: v })}
            />
          ) : (
            <>
              <Range
                label={L("起點", "Start")}
                value={sel.trimStart}
                min={0}
                max={Math.max(0.5, sel.srcDuration)}
                step={0.1}
                suffix="s"
                onChange={(v) => p.onUpdate(sel.id, { trimStart: Math.min(v, sel.trimEnd - 0.5) })}
              />
              <Range
                label={L("終點", "End")}
                value={sel.trimEnd}
                min={0}
                max={Math.max(0.5, sel.srcDuration)}
                step={0.1}
                suffix="s"
                onChange={(v) => p.onUpdate(sel.id, { trimEnd: Math.max(v, sel.trimStart + 0.5) })}
              />
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="shrink-0 text-sm text-muted-foreground">{L("速度", "Speed")}</span>
                {[0.5, 1, 1.5, 2].map((s) => (
                  <Chip key={s} active={sel.speed === s} onClick={() => p.onUpdate(sel.id, { speed: s })}>
                    {s}x
                  </Chip>
                ))}
              </div>
              <Range
                label={L("音量", "Volume")}
                value={sel.volume}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => p.onUpdate(sel.id, { volume: v })}
              />
            </>
          )}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
            {FILTERS.map((f) => (
              <Chip key={f.id} active={sel.filter === f.id} onClick={() => p.onUpdate(sel.id, { filter: f.id as FilterId })}>
                {zh ? f.zh : f.en}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            <Button variant="outline" size="icon" aria-label={L("前移", "Move earlier")} onClick={() => p.onMove(sel.id, -1)}>
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <Button variant="outline" size="icon" aria-label={L("後移", "Move later")} onClick={() => p.onMove(sel.id, 1)}>
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
            <Button variant="outline" size="icon" aria-label={L("複製", "Duplicate")} onClick={() => p.onDuplicate(sel.id)}>
              <Copy className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={L("在播放位置分割", "Split at playhead")}
              disabled={sel.type !== "video"}
              onClick={() => p.onSplit(sel.id)}
            >
              <Scissors className="size-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label={L("刪除", "Delete")} onClick={() => p.onRemove(sel.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransProps {
  clips: Clip[];
  selectedId: string | null;
  aspect: Aspect;
  fadeInOut: boolean;
  onSet: (id: string, t: TransitionId) => void;
  onSetAll: (t: TransitionId) => void;
  onAspect: (a: Aspect) => void;
  onFade: (v: boolean) => void;
}

export function TransitionsPanel(p: TransProps) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const idx = p.clips.findIndex((c) => c.id === p.selectedId);
  const sel = idx > 0 ? p.clips[idx] : null;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {sel
          ? L(`設定第 ${idx + 1} 段進場的轉場效果`, `Transition into clip ${idx + 1}`)
          : L("請在「素材」選擇第 2 段以後的片段來設定轉場。", "Select clip 2 or later in Clips to set its transition.")}
      </p>
      <div className="flex flex-wrap gap-2">
        {TRANSITIONS.filter((t) => t.id !== "none").map((t) => (
          <Chip key={t.id} active={sel?.transition === t.id} onClick={() => sel && p.onSet(sel.id, t.id)}>
            {zh ? t.zh : t.en}
          </Chip>
        ))}
      </div>
      <Button
        className="w-full"
        disabled={p.clips.length < 2}
        onClick={() => p.onSetAll(sel?.transition && sel.transition !== "none" ? sel.transition : "fade")}
      >
        {L("套用所有轉場", "Apply transition to all")}
      </Button>
      {p.clips.length < 2 && (
        <p className="text-xs text-muted-foreground">{L("至少需要 2 段素材才能設定轉場。", "Add at least 2 clips to use transitions.")}</p>
      )}
      <label className="flex items-center justify-between rounded-xl bg-secondary p-3 text-sm">
        <span>{L("開頭淡入、結尾淡出", "Fade in at start, out at end")}</span>
        <Switch checked={p.fadeInOut} onCheckedChange={p.onFade} />
      </label>
    </div>
  );
}

const TEXT_COLORS = ["#ffffff", "#000000", "#f5c542", "#f0703c", "#e8506a", "#f58fa6", "#4caf6a", "#2f7fd1", "#6fd0e8", "#12203a"];

const TEXT_STYLES: [TextStyle, string, string][] = [
  ["flat", "平面", "Flat"],
  ["extrude", "立體", "3D"],
  ["outline", "加邊", "Outline"],
  ["plate", "加底", "Plate"],
];

const SYMBOLS = [
  "，", "。", "、", "！", "？", "：", "；", "「", "」", "…", "—", "～",
  ",", ".", "!", "?", ":", ";", "'", "\"", "(", ")", "-", "&", "@", "#", "%", "+",
  "★", "☆", "♥", "♡", "♪", "♫", "✦", "✿", "❀", "☀", "☁", "☂", "✔", "✘", "→", "←", "↑", "↓", "©", "®", "™", "§", "※", "◆", "●", "■", "▲", "∞",
];

export function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            style={{ backgroundColor: c }}
            className={`size-8 rounded-full border border-border ${
              value === c ? "ring-2 ring-primary ring-offset-2 ring-offset-secondary" : ""
            }`}
          />
        ))}
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0"
        />
      </div>
    </div>
  );
}

interface TextProps {
  texts: TextItem[];
  selectedId: string | null;
  total: number;
  still?: boolean;
  noNudge?: boolean;
  noSymbols?: boolean;
  onSelect: (id: string) => void;
  onAdd: (role: TextRole) => void;
  onUpdate: (id: string, patch: Partial<TextItem>) => void;
  onRemove: (id: string) => void;
}

export function TextPanel(p: TextProps) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const sel = p.texts.find((t) => t.id === p.selectedId);
  const max = Math.max(1, Math.ceil(p.total));
  const [sub, setSub] = useState<"text" | "symbols">("text");
  const showSymbols = !p.noSymbols && sub === "symbols";
  return (
    <div className="flex flex-col gap-3">
      {!p.noSymbols && (
        <div className="flex gap-2" role="group" aria-label={L("文字選項", "Text options")}>
          <Chip active={sub === "text"} onClick={() => setSub("text")}>
            {L("文字", "Text")}
          </Chip>
          <Chip active={sub === "symbols"} onClick={() => setSub("symbols")}>
            {L("符號", "Symbols")}
          </Chip>
        </div>
      )}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {p.texts.map((t) => (
          <Chip key={t.id} active={t.id === p.selectedId} onClick={() => p.onSelect(t.id)}>
            {t.text.split("\n")[0].slice(0, 8) || L("文字", "Text")}
          </Chip>
        ))}
        <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => p.onAdd("body")}>
          <Type className="size-4" />
          {L("新增文字", "Add text")}
        </Button>
        {!p.still && (
          <>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => p.onAdd("opening")}>
              <Plus className="size-4" />
              {L("片頭文字", "Opening title")}
            </Button>
            <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => p.onAdd("closing")}>
              <Plus className="size-4" />
              {L("片尾文字", "Closing title")}
            </Button>
          </>
        )}
      </div>
      {showSymbols && (
        <SymbolPicker
          disabled={!sel}
          onPick={(s) => sel && p.onUpdate(sel.id, { text: (sel.text + s).slice(0, 120) })}
        />
      )}
      {sel && !showSymbols && (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-3">
          <Textarea
            value={sel.text}
            rows={2}
            maxLength={120}
            aria-label={L("文字內容", "Text")}
            onChange={(e) => p.onUpdate(sel.id, { text: e.target.value })}
          />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label={L("字體", "Font")}>
            {FONTS.map((f) => (
              <Chip key={f.family} active={sel.font === f.family} onClick={() => p.onUpdate(sel.id, { font: f.family })}>
                <span style={{ fontFamily: `"${f.family}", sans-serif`, fontWeight: f.weight }}>
                  {zh ? f.zh : f.en}
                </span>
              </Chip>
            ))}
          </div>
          {!p.still && sel.role && sel.role !== "body" ? (
            <p className="text-sm text-muted-foreground">
              {sel.role === "opening"
                ? L("片頭文字：自動顯示在影片最開始。", "Opening title: shown automatically at the very start.")
                : L("片尾文字：自動顯示在影片最後。", "Closing title: shown automatically at the very end.")}
            </p>
          ) : (
            !p.still && (
              <>
                <Range label={L("開始", "Start")} value={sel.start} min={0} max={max} step={0.5} suffix="s"
                  onChange={(v) => p.onUpdate(sel.id, { start: v, end: Math.max(sel.end, v + 0.5) })} />
                <Range label={L("結束", "End")} value={sel.end} min={0} max={max} step={0.5} suffix="s"
                  onChange={(v) => p.onUpdate(sel.id, { end: Math.max(v, sel.start + 0.5) })} />
              </>
            )
          )}
          {!p.noNudge && <Nudge x={sel.x} y={sel.y} rot={sel.rot ?? 0} onMove={(x, y) => p.onUpdate(sel.id, { x, y })} onRotate={(r) => p.onUpdate(sel.id, { rot: r })} />}
          <Range label={L("大小", "Size")} value={sel.size} min={3} max={32} step={1}
            onChange={(v) => p.onUpdate(sel.id, { size: v })} />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">{L("字體效果", "Text effect")}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={L("字體效果", "Text effect")}>
              {TEXT_STYLES.map(([id, zhLabel, enLabel]) => (
                <Chip key={id} active={(sel.style ?? "outline") === id} onClick={() => p.onUpdate(sel.id, { style: id })}>
                  {zh ? zhLabel : enLabel}
                </Chip>
              ))}
            </div>
          </div>
          <ColorRow
            label={L("字體本色", "Text color")}
            value={sel.color}
            onChange={(c) => p.onUpdate(sel.id, { color: c })}
          />
          {(sel.style ?? "outline") !== "flat" && (
            <ColorRow
              label={
                sel.style === "plate"
                  ? L("底色", "Plate color")
                  : sel.style === "extrude"
                    ? L("立體側面色", "Extrude color")
                    : L("邊框色", "Edge color")
              }
              value={sel.edge ?? "#000000"}
              onChange={(c) => p.onUpdate(sel.id, { edge: c })}
            />
          )}
          <Button variant="outline" className="self-end" onClick={() => p.onRemove(sel.id)}>
            <Trash2 className="size-4" />
            {L("刪除文字", "Delete text")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function SymbolPicker({ disabled, onPick }: { disabled?: boolean; onPick: (s: string) => void }) {
  const { L } = useLang();
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-secondary p-3">
      <span className="text-sm text-muted-foreground">
        {disabled
          ? L("請先在「文字」選項新增或選擇一段文字，再點符號加入。", "Add or pick a text first, then tap a symbol to insert it.")
          : L("點一下符號，加到目前選擇的文字後面。", "Tap a symbol to add it to the selected text.")}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {SYMBOLS.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={s}
            disabled={disabled}
            onClick={() => onPick(s)}
            className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-base hover:bg-secondary disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

interface MusicProps {
  name: string | null;
  volume: number;
  activeId: string | null;
  loadingId: string | null;
  onPickTrack: (track: Track) => void;
  onPick: (file: File) => void;
  onVolume: (v: number) => void;
  onRemove: () => void;
}

export function MusicPanel(p: MusicProps) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3">
      <input
        ref={ref}
        type="file"
        accept="audio/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) p.onPick(f);
          e.target.value = "";
        }}
      />
      {p.name ? (
        <div className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-sm">
          <Music2 className="size-5 shrink-0 text-primary" />
          <span className="flex-1 truncate">{p.name}</span>
          <Button variant="ghost" size="icon" aria-label={L("移除音樂", "Remove music")} onClick={p.onRemove}>
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <p className="text-sm font-medium">{L("內建音樂（30 首）", "Built-in music (30 songs)")}</p>
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto" role="group" aria-label={L("內建音樂", "Built-in music")}>
        {BUILT_IN_TRACKS.map((tr) => {
          const active = p.activeId === tr.id;
          return (
            <button
              key={tr.id}
              type="button"
              aria-pressed={active}
              disabled={!!p.loadingId}
              onClick={() => p.onPickTrack(tr)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-start text-sm transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {p.loadingId === tr.id ? <Spinner className="size-4 shrink-0" /> : <Music2 className="size-4 shrink-0" aria-hidden="true" />}
              <span className="flex-1 truncate">{zh ? tr.zh : tr.en}</span>
              <span className="text-xs opacity-70 tabular-nums">{tr.bpm}</span>
            </button>
          );
        })}
      </div>
      <Button variant="outline" className="h-12" onClick={() => ref.current?.click()}>
        <Music2 className="size-5" />
        {p.name ? L("更換音樂", "Change music") : L("選擇音樂檔案", "Choose a music file")}
      </Button>
      <Range label={L("音樂音量", "Volume")} value={p.volume} min={0} max={1} step={0.1} onChange={p.onVolume} />
      <p className="text-xs text-muted-foreground">
        {L("音樂會循環播放並混入輸出的影片中。", "Music loops and is mixed into the exported video.")}
      </p>
    </div>
  );
}

const COLORS = ["#12203a", "#2f7fd1", "#f0703c", "#f5c542", "#ffffff"];

export function DrawPanel(p: {
  color: string;
  size: number;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  onUndo: () => void;
  onClear: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2" role="radiogroup" aria-label={t("color")}>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={p.color === c}
            aria-label={c}
            onClick={() => p.onColor(c)}
            style={{ backgroundColor: c }}
            className={`size-9 rounded-full border border-border ${p.color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          />
        ))}
      </div>
      <Range label={t("size")} value={p.size} min={2} max={32} step={1} onChange={p.onSize} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={p.onUndo}>
          <Undo2 className="size-4" />
          {t("undo")}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={p.onClear}>
          <Trash2 className="size-4" />
          {t("clear")}
        </Button>
      </div>
    </div>
  );
}

const clampPos = (v: number) => Math.min(0.95, Math.max(0.05, v));

const TAP_MOVE = 0.006;
const HOLD_MOVE = 0.012;
const TAP_ROT = 2;
const HOLD_ROT = 5;
const HOLD_DELAY = 300;
const HOLD_TICK = 50;

function HoldButton({
  label,
  onTap,
  onHold,
  children,
}: {
  label: string;
  onTap: () => void;
  onHold: () => void;
  children: React.ReactNode;
}) {
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const held = useRef(false);
  const stop = () => {
    if (delay.current) clearTimeout(delay.current);
    if (tick.current) clearInterval(tick.current);
    delay.current = null;
    tick.current = null;
  };
  useEffect(() => stop, []);
  const handlers = useRef({ onTap, onHold });
  handlers.current = { onTap, onHold };
  const start = () => {
    stop();
    held.current = false;
    delay.current = setTimeout(() => {
      held.current = true;
      handlers.current.onHold();
      tick.current = setInterval(() => handlers.current.onHold(), HOLD_TICK);
    }, HOLD_DELAY);
  };
  const end = (commit: boolean) => {
    const wasHeld = held.current;
    const running = delay.current !== null || tick.current !== null;
    stop();
    if (commit && running && !wasHeld) handlers.current.onTap();
  };
  return (
    <Button
      variant="outline"
      size="icon"
      className="size-11 touch-none select-none"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          handlers.current.onTap();
        }
      }}
    >
      {children}
    </Button>
  );
}

export function Nudge({
  x,
  y,
  rot = 0,
  onMove,
  onRotate,
}: {
  x: number;
  y: number;
  rot?: number;
  onMove: (x: number, y: number) => void;
  onRotate?: (rot: number) => void;
}) {
  const { L } = useLang();
  const cur = useRef({ x, y, rot });
  cur.current = { x, y, rot };
  const move = (dx: number, dy: number) => {
    const nx = clampPos(cur.current.x + dx);
    const ny = clampPos(cur.current.y + dy);
    cur.current = { ...cur.current, x: nx, y: ny };
    onMove(nx, ny);
  };
  const spin = (d: number) => {
    let r = cur.current.rot + d;
    if (r > 180) r -= 360;
    if (r < -180) r += 360;
    cur.current = { ...cur.current, rot: r };
    onRotate?.(r);
  };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-1.5" role="group" aria-label={L("位置與旋轉調整", "Position and rotation")}>
        <HoldButton label={L("向左轉", "Rotate left")} onTap={() => spin(-TAP_ROT)} onHold={() => spin(-HOLD_ROT)}>
          <Undo2 className="size-5" />
        </HoldButton>
        <HoldButton label={L("左移", "Left")} onTap={() => move(-TAP_MOVE, 0)} onHold={() => move(-HOLD_MOVE, 0)}>
          <ChevronLeft className="size-5" />
        </HoldButton>
        <HoldButton label={L("下移", "Down")} onTap={() => move(0, TAP_MOVE)} onHold={() => move(0, HOLD_MOVE)}>
          <ChevronDown className="size-5" />
        </HoldButton>
        <HoldButton label={L("上移", "Up")} onTap={() => move(0, -TAP_MOVE)} onHold={() => move(0, -HOLD_MOVE)}>
          <ChevronUp className="size-5" />
        </HoldButton>
        <HoldButton label={L("右移", "Right")} onTap={() => move(TAP_MOVE, 0)} onHold={() => move(HOLD_MOVE, 0)}>
          <ChevronRight className="size-5" />
        </HoldButton>
        <HoldButton label={L("向右轉", "Rotate right")} onTap={() => spin(TAP_ROT)} onHold={() => spin(HOLD_ROT)}>
          <Redo2 className="size-5" />
        </HoldButton>
      </div>
      <p className="text-xs text-muted-foreground">{L("點按微調，長按連續移動", "Tap to fine-tune, hold to keep moving")}</p>
    </div>
  );
}

function StickerThumb({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    const def = STICKER_MAP[id];
    if (!c || !ctx || !def) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    def.draw(ctx, c.width * 0.38, 0.6);
    ctx.restore();
  }, [id]);
  return <canvas ref={ref} width={96} height={96} className="size-12" aria-hidden="true" />;
}

interface StickerProps {
  stickers: StickerItem[];
  selectedId: string | null;
  total: number;
  still?: boolean;
  cat?: "wear" | "scene" | "atmo";
  noNudge?: boolean;
  onAdd: (kind: string) => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<StickerItem>) => void;
  onRemove: (id: string) => void;
}

export function StickerPanel(p: StickerProps) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const sel = p.stickers.find((s) => s.id === p.selectedId);
  const max = Math.max(1, Math.ceil(p.total));
  const pool = STICKERS.filter((s) => (p.cat ? s.cat === p.cat : !s.cat));
  const groups = [
    { label: L("靜態插圖", "Still artwork"), items: pool.filter((s) => !s.animated) },
    { label: L("動態插圖", "Animated artwork"), items: pool.filter((s) => s.animated) },
  ].filter((g) => g.items.length);
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{g.label}</h3>
          <div className="grid grid-cols-4 gap-2">
            {g.items.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => p.onAdd(s.id)}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 text-xs hover:bg-secondary"
              >
                <StickerThumb id={s.id} />
                <span className="w-full truncate text-center">{zh ? s.zh : s.en}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {p.stickers.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {p.stickers.map((s) => (
            <Chip key={s.id} active={s.id === p.selectedId} onClick={() => p.onSelect(s.id)}>
              {zh ? STICKER_MAP[s.kind]?.zh : STICKER_MAP[s.kind]?.en}
            </Chip>
          ))}
        </div>
      )}
      {sel && (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-3">
          {!p.noNudge && <Nudge x={sel.x} y={sel.y} rot={sel.rot ?? 0} onMove={(x, y) => p.onUpdate(sel.id, { x, y })} onRotate={(r) => p.onUpdate(sel.id, { rot: r })} />}
          <Range label={L("大小", "Size")} value={sel.size} min={6} max={70} step={1}
            onChange={(v) => p.onUpdate(sel.id, { size: v })} />
          {!p.still && (
            <>
              <Range label={L("開始", "Start")} value={sel.start} min={0} max={max} step={0.5} suffix="s"
                onChange={(v) => p.onUpdate(sel.id, { start: v, end: Math.max(sel.end, v + 0.5) })} />
              <Range label={L("結束", "End")} value={Math.min(sel.end, max)} min={0} max={max} step={0.5} suffix="s"
                onChange={(v) => p.onUpdate(sel.id, { end: Math.max(v, sel.start + 0.5) })} />
            </>
          )}
          <Button variant="outline" className="self-end" onClick={() => p.onRemove(sel.id)}>
            <Trash2 className="size-4" />
            {L("刪除", "Delete")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MotionPanel({ templateId, onPick }: { templateId: string; onPick: (t: MotionTemplate) => void }) {
  const { lang, L } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const cur = MOTION_TEMPLATES.find((m) => m.id === templateId) ?? MOTION_TEMPLATES[0];
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {MOTION_TEMPLATES.map((m) => (
          <Chip key={m.id} active={m.id === templateId} onClick={() => onPick(m)}>
            {zh ? m.zh : m.en}
          </Chip>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{zh ? cur.descZh : cur.descEn}</p>
      <p className="text-xs text-muted-foreground">
        {L("系統依畫面明暗與構圖推算景深，讓近景與遠景產生擬真視差。", "Depth is estimated from light and composition so near and far layers move with real parallax.")}
      </p>
    </div>
  );
}
