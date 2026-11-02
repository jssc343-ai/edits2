"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-context";
import { useApp } from "@/lib/app-state";
import { aiRemoveBackground, downloadCanvas, loadImage } from "@/lib/cutout";
import type { EditMode } from "@/components/app-shell";

const SIZE = 512;

const EMOJIS = [
  "😀", "😂", "🥰", "😎", "🤩", "😭", "😡", "🥳", "😴", "🤔",
  "👍", "👏", "🙏", "💪", "❤️", "🔥", "✨", "🌟", "🎉", "🎂",
  "🌸", "🌈", "☀️", "🌙", "⭐", "🍀", "🐶", "🐱", "🐼", "🦄",
  "🍕", "🍔", "🍜", "🍰", "☕", "🎵", "🎮", "⚽", "✈️", "🚗",
];

type Item =
  | { id: number; type: "emoji" | "text"; value: string; x: number; y: number; size: number; rot: number; color: string }
  | { id: number; type: "image"; img: HTMLImageElement; x: number; y: number; size: number; rot: number };

export function StickerEditor({ mode }: { mode: EditMode }) {
  const { L } = useLang();
  const { trackExport } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
        if (showSelection && it.id === selected) {
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#2563eb";
          const half = it.size / 2;
          ctx.strokeRect(-half, -half, it.size, it.size);
        }
        ctx.restore();
      }
    },
    [items, selected],
  );

  useEffect(() => {
    draw(true);
  }, [draw]);

  const add = (partial: Omit<Item, "id" | "x" | "y" | "rot"> & { size: number }) => {
    const id = nextId.current++;
    const item = { ...partial, id, x: SIZE / 2, y: SIZE / 2, rot: 0 } as Item;
    setItems((prev) => [...prev, item]);
    setSelected(id);
  };

  const update = (patch: { size?: number; rot?: number; x?: number; y?: number }) => {
    setItems((prev) => prev.map((it) => (it.id === selected ? ({ ...it, ...patch } as Item) : it)));
  };

  const current = items.find((i) => i.id === selected) ?? null;

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
    if (!hit) {
      setSelected(null);
      return;
    }
    setSelected(hit.id);
    drag.current = { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = pointerPos(e);
    setItems((prev) => prev.map((it) => (it.id === d.id ? ({ ...it, x: p.x + d.dx, y: p.y + d.dy } as Item) : it)));
  };

  const onUp = () => {
    drag.current = null;
  };

  const remove = () => {
    setItems((prev) => prev.filter((i) => i.id !== selected));
    setSelected(null);
  };

  const addPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(mode === "ai" ? L("AI 去背中，請稍候…", "AI is removing the background…") : "");
    try {
      let blob: Blob = file;
      if (mode === "ai") blob = await aiRemoveBackground(file);
      const url = URL.createObjectURL(blob);
      const img = await loadImage(url);
      add({ type: "image", img, size: 360 });
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

      <Button variant="outline" className="h-11" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
        {mode === "ai" ? L("上傳相片（AI 自動去背）", "Upload photo (AI cutout)") : L("加入相片", "Add a photo")}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void addPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}

      {current && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
          <label className="text-sm font-medium" htmlFor="st-size">
            {L("大小", "Size")}
          </label>
          <Slider id="st-size" min={40} max={480} step={2} value={[current.size]} onValueChange={(v) => update({ size: v[0] })} />
          <label className="text-sm font-medium" htmlFor="st-rot">
            {L("旋轉", "Rotate")}
          </label>
          <Slider id="st-rot" min={-180} max={180} step={1} value={[current.rot]} onValueChange={(v) => update({ rot: v[0] })} />
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
