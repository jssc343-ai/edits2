import { drawText, fontSpec, type TextItem } from "@/lib/compositor";
import { drawShape, type ShapeItem } from "@/lib/shapes";
import { drawStickers, type StickerItem } from "@/lib/stickers";

export type LayerKind = "shape" | "sticker" | "text";

export interface LayerEntry {
  kind: LayerKind;
  id: string;
  z: number;
  item: ShapeItem | StickerItem | TextItem;
}

export interface Bounds {
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
}

export function buildStack(shapes: ShapeItem[], stickers: StickerItem[], texts: TextItem[], extra: { text?: boolean } = {}): LayerEntry[] {
  const all: LayerEntry[] = [
    ...shapes.map((item, i) => ({ kind: "shape" as const, id: item.id, z: item.z ?? i, item })),
    ...stickers.map((item, i) => ({ kind: "sticker" as const, id: item.id, z: item.z ?? 1000 + i, item })),
    ...(extra.text === false ? [] : texts.map((item, i) => ({ kind: "text" as const, id: item.id, z: item.z ?? 2000 + i, item }))),
  ];
  return all.sort((a, b) => a.z - b.z);
}

export function nextZ(shapes: ShapeItem[], stickers: StickerItem[], texts: TextItem[]): number {
  const stack = buildStack(shapes, stickers, texts);
  return stack.length ? stack[stack.length - 1].z + 1 : 0;
}

export function drawLayers(ctx: CanvasRenderingContext2D, stack: LayerEntry[], t: number, textT: number) {
  const W = ctx.canvas.width;
  for (const e of stack) {
    if (e.kind === "shape") drawShape(ctx, e.item as ShapeItem, W);
    else if (e.kind === "sticker") drawStickers(ctx, [e.item as StickerItem], t);
    else drawText(ctx, [e.item as TextItem], textT);
  }
}

export function moveLayer(stack: LayerEntry[], id: string, dir: "up" | "down"): Map<string, number> | null {
  const i = stack.findIndex((e) => e.id === id);
  const j = dir === "up" ? i + 1 : i - 1;
  if (i < 0 || j < 0 || j >= stack.length) return null;
  const ids = stack.map((e) => e.id);
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return new Map(ids.map((key, k) => [key, k]));
}

let measureCtx: CanvasRenderingContext2D | null = null;

export function boundsOf(e: LayerEntry, W: number, H: number): Bounds {
  if (e.kind === "sticker") {
    const s = e.item as StickerItem;
    const side = Math.max(24, (s.size / 100) * W);
    return { cx: s.x * W, cy: s.y * H, w: side, h: side, rot: s.rot ?? 0 };
  }
  if (e.kind === "shape") {
    const s = e.item as ShapeItem;
    return { cx: s.x * W, cy: s.y * H, w: Math.max(24, (s.w / 100) * W), h: Math.max(24, (s.h / 100) * W), rot: s.rot };
  }
  const t = e.item as TextItem;
  const px = (t.size / 100) * W;
  const lines = t.text.split("\n");
  if (!measureCtx && typeof document !== "undefined") measureCtx = document.createElement("canvas").getContext("2d");
  let mw = px;
  if (measureCtx) {
    const spec = fontSpec(t.font);
    measureCtx.font = `${spec.weight} ${px}px "${spec.family}", "Noto Sans TC", system-ui, sans-serif`;
    mw = Math.max(...lines.map((line) => Math.min(W * 0.94, measureCtx!.measureText(line).width)));
  }
  return { cx: t.x * W, cy: t.y * H, w: mw + px * 0.4, h: lines.length * px * 1.25 + px * 0.1, rot: t.rot ?? 0 };
}

export function hitTest(stack: LayerEntry[], W: number, H: number, px: number, py: number): LayerEntry | null {
  for (let i = stack.length - 1; i >= 0; i--) {
    const e = stack[i];
    if (e.kind === "text" && !(e.item as TextItem).text.trim()) continue;
    const b = boundsOf(e, W, H);
    const a = (-b.rot * Math.PI) / 180;
    const dx = px - b.cx;
    const dy = py - b.cy;
    const rx = dx * Math.cos(a) - dy * Math.sin(a);
    const ry = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(rx) <= Math.max(b.w, 32) / 2 && Math.abs(ry) <= Math.max(b.h, 32) / 2) return e;
  }
  return null;
}
