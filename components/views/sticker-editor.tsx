"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Download, ImagePlus, Loader2, RotateCcw, RotateCw, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-context";
import { useApp } from "@/lib/app-state";
import { downloadCanvas, loadImage } from "@/lib/cutout";
import { CutoutEditor, HoldButton } from "@/components/views/cutout-editor";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { TuneControls } from "@/components/editor-panels";
import { num, type PhotoAction } from "@/lib/photo-ai";
import type { EditMode } from "@/components/app-shell";

const SIZE = 512;

const EMOJIS = [
  "😀", "😂", "🥰", "😎", "🤩", "😭", "😡", "🥳", "😴", "🤔",
  "👍", "👏", "🙏", "💪", "❤️", "🔥", "✨", "🌟", "🎉", "🎂",
  "🌸", "🌈", "☀️", "🌙", "⭐", "🍀", "🐶", "🐱", "🐼", "🦄",
  "🍕", "🍔", "🍜", "🍰", "☕", "🎵", "🎮", "⚽", "✈️", "🚗",
];

type Tune = { sx?: number; sy?: number; alpha?: number };
type Item =
  | ({ id: number; type: "emoji" | "text"; value: string; x: number; y: number; size: number; rot: number; color: string } & Tune)
  | ({ id: number; type: "image"; img: HTMLImageElement; x: number; y: number; size: number; rot: number } & Tune);

export function StickerEditor({ mode }: { mode: EditMode }) {
  const { L } = useLang();
  const { trackExport } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [aiSels, setAiSels] = useState<number[]>([]);
  const moved = useRef(false);
  const wasSelected = useRef(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<File | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const showManual = mode === "hand" || manualOpen;

  const draw = useCallback(
    (showSelection: boolean) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);
      for (const it of items) {
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate((it.rot * Math.PI) / 180);
        ctx.save();
        ctx.scale(it.sx ?? 1, it.sy ?? 1);
        ctx.globalAlpha = it.alpha ?? 1;
        if (it.type === "image") {
          const ratio = it.img.naturalWidth / it.img.naturalHeight;
          const w = ratio >= 1 ? it.size : it.size * ratio;
          const h = ratio >= 1 ? it.size / ratio : it.size;
          ctx.drawImage(it.img, -w / 2, -h / 2, w, h);
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${it.size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
          if (it.type === "text") {
            ctx.lineWidth = Math.max(4, it.size / 8);
            ctx.strokeStyle = "#ffffff";
            ctx.lineJoin = "round";
            ctx.strokeText(it.value, 0, 0);
            ctx.fillStyle = it.color;
          }
          ctx.fillText(it.value, 0, 0);
        }
        ctx.restore();
        if (showSelection && (showManual ? it.id === selected : aiSels.includes(it.id))) {
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#2563eb";
          const half = it.size / 2;
          ctx.strokeRect(-half, -half, it.size, it.size);
        }
        ctx.restore();
      }
    },
    [items, selected, aiSels, showManual],
  );

  useEffect(() => {
    draw(true);
  }, [draw, pending]);

  const add = (partial: Omit<Item, "id" | "x" | "y" | "rot"> & { size: number }) => {
    const id = nextId.current++;
    const item = { ...partial, id, x: SIZE / 2, y: SIZE / 2, rot: 0 } as Item;
    setItems((prev) => [...prev, item]);
    setSelected(id);
  };

  const update = (patch: { size?: number; rot?: number; x?: number; y?: number } & Tune) => {
    setItems((prev) => prev.map((it) => (it.id === selected ? ({ ...it, ...patch } as Item) : it)));
  };

  const current = items.find((i) => i.id === selected) ?? null;
  const boxedItems = items.filter((i) => aiSels.includes(i.id));

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const nudge = (dx: number, dy: number) => (boost: number) =>
    setItems((prev) =>
      prev.map((it) => (it.id === selected ? ({ ...it, x: clamp(it.x + dx * boost, 0, SIZE), y: clamp(it.y + dy * boost, 0, SIZE) } as Item) : it)),
    );
  const spin = (deg: number) => (boost: number) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== selected) return it;
        let r = (it.rot + deg * boost) % 360;
        if (r > 180) r -= 360;
        if (r < -180) r += 360;
        return { ...it, rot: r } as Item;
      }),
    );

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerPos(e);
    const hit = [...items].reverse().find((it) => Math.abs(p.x - it.x) <= it.size / 2 && Math.abs(p.y - it.y) <= it.size / 2);
    if (!showManual) {
      if (hit) setAiSels((prev) => (prev.includes(hit.id) ? prev.filter((id) => id !== hit.id) : [...prev, hit.id]));
      return;
    }
    if (!hit) {
      setSelected(null);
      return;
    }
    wasSelected.current = hit.id === selected;
    moved.current = false;
    setSelected(hit.id);
    drag.current = { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = pointerPos(e);
    moved.current = true;
    setItems((prev) => prev.map((it) => (it.id === d.id ? ({ ...it, x: p.x + d.dx, y: p.y + d.dy } as Item) : it)));
  };

  const onUp = () => {
    if (drag.current && !moved.current && wasSelected.current) setSelected(null);
    drag.current = null;
  };

  const remove = () => {
    setItems((prev) => prev.filter((i) => i.id !== selected));
    setSelected(null);
  };

  const addCutout = async (cutout: HTMLCanvasElement) => {
    setBusy(true);
    try {
      const img = await loadImage(cutout.toDataURL("image/png"));
      add({ type: "image", img, size: 360 });
      setPending(null);
      setMessage("");
    } catch {
      setMessage(L("相片處理失敗，請再試一次。", "Could not process that photo. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(false);
    await downloadCanvas(canvas, `jsc343-sticker-${Date.now()}.png`);
    draw(true);
    trackExport();
  };

  const getAiState = () => ({
    items: items.map((it, i) => ({
      index: i + 1,
      type: it.type,
      value: it.type === "image" ? "photo" : it.value,
      x: Math.round((it.x / SIZE) * 100) / 100,
      y: Math.round((it.y / SIZE) * 100) / 100,
      size: Math.round(it.size),
      rotation: Math.round(it.rot),
      sx: Math.round((it.sx ?? 1) * 100) / 100,
      sy: Math.round((it.sy ?? 1) * 100) / 100,
      opacityPercent: Math.round((it.alpha ?? 1) * 100),
      selected: it.id === selected,
    })),
  });

  const applyAi = (actions: PhotoAction[]) => {
    let list = items;
    let sel = selected;
    let boxed = aiSels;
    const targets = (a: PhotoAction): number[] => {
      if (a.index && list[a.index - 1]) return [list[a.index - 1].id];
      const live = boxed.filter((id) => list.some((it) => it.id === id));
      if (live.length) return live;
      const one = sel ?? list[list.length - 1]?.id ?? null;
      return one === null ? [] : [one];
    };
    const target = (a: PhotoAction) => targets(a)[0] ?? null;
    const patch = (a: PhotoAction, fn: (it: Item) => Partial<Item>) => {
      const ids = targets(a);
      list = list.map((it) => (ids.includes(it.id) ? ({ ...it, ...fn(it) } as Item) : it));
    };
    const place = (a: PhotoAction) => ({
      x: clamp(num(a.x, 0.5), 0, 1) * SIZE,
      y: clamp(num(a.y, 0.5), 0, 1) * SIZE,
    });
    for (const a of actions) {
      switch (a.type) {
        case "add_emoji":
        case "add_text": {
          const value = (a.text ?? "").trim().slice(0, 24);
          if (!value) break;
          const id = nextId.current++;
          const isText = a.type === "add_text";
          list = [
            ...list,
            {
              id,
              type: isText ? "text" : "emoji",
              value,
              ...place(a),
              size: clamp(num(a.amount, isText ? 96 : 200), 40, 480),
              rot: 0,
              color: a.color ?? "#111827",
            } as Item,
          ];
          sel = id;
          break;
        }
        case "select": {
          const id = target(a);
          if (id !== null) sel = id;
          break;
        }
        case "set_position":
          patch(a, () => place(a));
          break;
        case "nudge":
          patch(a, (it) => ({
            x: clamp(it.x + num(a.x, 0) * SIZE, 0, SIZE),
            y: clamp(it.y + num(a.y, 0) * SIZE, 0, SIZE),
          }));
          break;
        case "set_size":
          patch(a, () => ({ size: clamp(num(a.amount, 200), 40, 480) }));
          break;
        case "rotate":
          patch(a, (it) => ({ rot: clamp(it.rot + num(a.amount, 0), -180, 180) }));
          break;
        case "set_rotation":
          patch(a, () => ({ rot: clamp(num(a.amount, 0), -180, 180) }));
          break;
        case "stretch":
          patch(a, (it) => ({
            sx: clamp((it.sx ?? 1) * num(a.x, 1), 0.2, 3),
            sy: clamp((it.sy ?? 1) * num(a.y, 1), 0.2, 3),
          }));
          break;
        case "set_opacity":
          patch(a, () => ({ alpha: clamp(num(a.amount, 100) / 100, 0, 1) }));
          break;
        case "reset_tune":
          patch(a, () => ({ sx: 1, sy: 1, alpha: 1 }));
          break;
        case "set_color":
          patch(a, (it) => (it.type === "text" && a.color ? { color: a.color } : {}));
          break;
        case "set_text":
          patch(a, (it) => (it.type !== "image" && a.text ? { value: a.text.slice(0, 24) } : {}));
          break;
        case "delete": {
          const ids = targets(a);
          list = list.filter((it) => !ids.includes(it.id));
          if (sel !== null && ids.includes(sel)) sel = null;
          boxed = boxed.filter((id) => !ids.includes(id));
          break;
        }
        case "clear":
          list = [];
          sel = null;
          boxed = [];
          break;
        case "download":
          if (list.length) void download();
          break;
        default:
          break;
      }
    }
    setItems(list);
    setSelected(sel);
    setAiSels(boxed);
  };

  const deleteBoxed = () => {
    setItems((prev) => prev.filter((it) => !aiSels.includes(it.id)));
    setAiSels([]);
    setSelected(null);
  };

  if (pending) {
    return (
      <CutoutEditor
        key={`${pending.name}-${pending.lastModified}`}
        mode={mode}
        initialFile={pending}
        autoAi
        onUse={(c) => void addCutout(c)}
        onCancel={() => setPending(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {mode === "ai"
          ? L("選 Emoji、輸入文字，或上傳相片由 AI 自動去背變成貼圖。拖曳可移動。", "Pick emoji, add text, or upload a photo and AI removes the background. Drag to move.")
          : L("選 Emoji 或輸入文字做成貼圖。拖曳可移動，輸出為透明 PNG。", "Pick emoji or add text. Drag to move; export as a transparent PNG.")}
      </p>

      <div
        className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border"
        style={{
          backgroundImage: "repeating-conic-gradient(var(--muted) 0% 25%, var(--background) 0% 50%)",
          backgroundSize: "20px 20px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="aspect-square w-full touch-none"
          role="img"
          aria-label={L("貼圖預覽", "Sticker preview")}
        />
      </div>

      {mode === "ai" && (
        <AiChatPanel<PhotoAction>
          endpoint="/api/ai-photo"
          extraBody={{ kind: "sticker" }}
          selected={
            boxedItems.length
              ? {
                  label: boxedItems.map((it) => L(`貼圖 ${items.indexOf(it) + 1}`, `Sticker ${items.indexOf(it) + 1}`)).join("、"),
                  payload:
                    boxedItems.length === 1
                      ? { element: boxedItems[0].type, index: items.indexOf(boxedItems[0]) + 1, value: boxedItems[0].type === "image" ? "photo" : boxedItems[0].value }
                      : {
                          multiple: boxedItems.map((it) => ({ element: it.type, index: items.indexOf(it) + 1, value: it.type === "image" ? "photo" : it.value })),
                        },
                }
              : null
          }
          onClearSelected={() => setAiSels([])}
          onDeleteSelected={deleteBoxed}
          getState={getAiState}
          onActions={applyAi}
          manualOpen={manualOpen}
          onManual={() => setManualOpen((v) => !v)}
          examples={[
            L("加一個愛心貼圖在中間", "Add a heart in the middle"),
            L("加文字「謝謝」，紅色", "Add the text Thank you in red"),
            L("把它放大一點並轉 15 度", "Make it bigger and rotate 15 degrees"),
            L("刪掉第一個", "Delete the first one"),
          ]}
        />
      )}

      {showManual && (
        <>
      <div className="grid grid-cols-8 gap-1" role="group" aria-label="Emoji">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => add({ type: "emoji", value: e, size: 200, color: "#000000" })}
            className="flex aspect-square items-center justify-center rounded-lg text-2xl transition-colors hover:bg-secondary"
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = text.trim();
          if (!v) return;
          add({ type: "text", value: v, size: 96, color: "#111827" });
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={L("輸入文字或 Emoji", "Type text or emoji")} maxLength={24} className="h-11" />
        <Button type="submit" variant="outline" className="h-11">
          <Type aria-hidden="true" />
          {L("加入", "Add")}
        </Button>
      </form>
        </>
      )}

      <Button variant="outline" className="h-11" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
        {mode === "ai" ? L("上傳相片（AI 去背＋手動修補）", "Upload photo (AI cutout + touch-up)") : L("加入相片（去背）", "Add a photo (cutout)")}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPending(f);
          e.target.value = "";
        }}
      />

      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}

      {current && showManual && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
          <label className="text-sm font-medium" htmlFor="st-size">
            {L("大小", "Size")}
          </label>
          <Slider id="st-size" min={40} max={480} step={2} value={[current.size]} onValueChange={(v) => update({ size: v[0] })} />
          <label className="text-sm font-medium" htmlFor="st-rot">
            {L("旋轉", "Rotate")}
          </label>
          <Slider id="st-rot" min={-180} max={180} step={1} value={[current.rot]} onValueChange={(v) => update({ rot: v[0] })} />
          <TuneControls sx={current.sx} sy={current.sy} alpha={current.alpha} onChange={update} />
          <p className="text-sm font-medium">{L("位置與角度", "Position and angle")}</p>
          <div className="flex items-center justify-around gap-2">
            <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-1">
              <span />
              <HoldButton label={L("上移", "Move up")} onStep={nudge(0, -1)}>
                <ArrowUp aria-hidden="true" />
              </HoldButton>
              <span />
              <HoldButton label={L("左移", "Move left")} onStep={nudge(-1, 0)}>
                <ArrowLeft aria-hidden="true" />
              </HoldButton>
              <span />
              <HoldButton label={L("右移", "Move right")} onStep={nudge(1, 0)}>
                <ArrowRight aria-hidden="true" />
              </HoldButton>
              <span />
              <HoldButton label={L("下移", "Move down")} onStep={nudge(0, 1)}>
                <ArrowDown aria-hidden="true" />
              </HoldButton>
              <span />
            </div>
            <div className="flex gap-2">
              <HoldButton label={L("向左旋轉", "Rotate left")} onStep={spin(-1)}>
                <RotateCcw aria-hidden="true" />
              </HoldButton>
              <HoldButton label={L("向右旋轉", "Rotate right")} onStep={spin(1)}>
                <RotateCw aria-hidden="true" />
              </HoldButton>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{L("點一下微調，長按持續移動或旋轉。", "Tap for a fine step, press and hold to keep going.")}</p>
          <Button variant="outline" onClick={remove}>
            <Trash2 aria-hidden="true" />
            {L("刪除這個", "Delete")}
          </Button>
        </div>
      )}

      <Button className="h-12" onClick={download} disabled={items.length === 0}>
        <Download aria-hidden="true" />
        {L("下載透明 PNG 貼圖", "Download transparent PNG")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{L("成果不會保存，請下載。", "Nothing is saved. Please download.")}</p>
    </div>
  );
}
