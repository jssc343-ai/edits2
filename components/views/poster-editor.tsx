"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/lang-context";
import { Chip, Nudge, Range, StickerPanel, SymbolPicker, TextPanel } from "@/components/editor-panels";
import { DEFAULT_MAKEUP, drawText, FONTS, fontSpec, makeupCss, type Makeup, type TextItem } from "@/lib/compositor";
import { drawShapes, SHAPES, type ShapeItem } from "@/lib/shapes";
import { drawStickers, STICKER_MAP, type StickerItem } from "@/lib/stickers";
import { AiChatPanel, type AiAction } from "@/components/ai-chat-panel";
import { ArtPanel } from "@/components/art-panel";
import { buildGif } from "@/lib/gif";
import { LifecycleBar, WorkSession, type WorkLifecycle } from "@/components/work-session";
import { DEFAULT_ART, drawArt, type ArtState } from "@/lib/art";
import { LayerBar } from "@/components/layer-bar";
import { FormatPanel } from "@/components/format-panel";
import { SaveDialog, type PendingSave } from "@/components/save-dialog";
import { EditLockPanel, useEditLock } from "@/components/edit-lock";
import { boundsOf, buildStack, drawLayers, hitTest, moveLayer, nextZ, type Bounds } from "@/lib/layers";

type Variant = "card" | "collage";
type LayoutStyle = "grid" | "feature" | "side";
type Rect = [number, number, number, number];
type PosterAspect = "3:4" | "4:5" | "1:1" | "4:3" | "9:16" | "16:9" | "2:3" | "3:2";

export interface PosterInitial {
  photos: { url: string; img: HTMLImageElement }[];
  aspect: string;
}

const isHex = (c: string | null): c is string => !!c && /^#[0-9a-f]{3,8}$/i.test(c);
const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Photo {
  id: string;
  img: HTMLImageElement;
  url: string;
  zoom: number;
  ox: number;
  oy: number;
  rot?: number;
  makeup: Makeup;
}

const SIZES: Record<PosterAspect, { w: number; h: number }> = {
  "3:4": { w: 600, h: 800 },
  "4:5": { w: 640, h: 800 },
  "1:1": { w: 720, h: 720 },
  "4:3": { w: 800, h: 600 },
  "9:16": { w: 450, h: 800 },
  "16:9": { w: 800, h: 450 },
  "2:3": { w: 540, h: 810 },
  "3:2": { w: 810, h: 540 },
};

const GRADIENTS: [string, string][] = [
  ["#2f7fd1", "#12203a"],
  ["#f0703c", "#f5c542"],
  ["#12203a", "#2f7fd1"],
  ["#f5c542", "#fff7e0"],
  ["#ffffff", "#dfe9f5"],
  ["#e2557a", "#f7b7a3"],
  ["#2e9e6b", "#c8f0d4"],
  ["#6a4fc4", "#d6c9f7"],
  ["#1c1c22", "#4a4a58"],
  ["#14b8c4", "#fce38a"],
];

const PALETTE = ["#ffffff", "#111111", "#e5484d", "#f0703c", "#f5c542", "#2e9e6b", "#2f7fd1", "#6a4fc4", "#e2557a", "#14b8c4"];

const MAX_COLLAGE = 6;
const MAX_CARD = 2;
const uid = () => Math.random().toString(36).slice(2, 10);

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image"));
    img.src = url;
  });
}

function layoutRects(n: number, style: LayoutStyle, w: number, h: number, pad: number): Rect[] {
  const x = pad;
  const y = pad;
  const W = w - pad * 2;
  const H = h - pad * 2;
  const split = (c: number, bx: number, by: number, bw: number, bh: number, horizontal: boolean): Rect[] =>
    Array.from({ length: c }, (_, i) => {
      if (horizontal) {
        const cw = (bw - pad * (c - 1)) / c;
        return [bx + i * (cw + pad), by, cw, bh] as Rect;
      }
      const ch = (bh - pad * (c - 1)) / c;
      return [bx, by + i * (ch + pad), bw, ch] as Rect;
    });
  if (n <= 1) return [[x, y, W, H]];
  if (style === "feature") {
    const top = H * 0.6 - pad / 2;
    return [[x, y, W, top], ...split(n - 1, x, y + top + pad, W, H - top - pad, true)];
  }
  if (style === "side") {
    const left = W * 0.58 - pad / 2;
    return [[x, y, left, H], ...split(n - 1, x + left + pad, y, W - left - pad, H, false)];
  }
  const perRow = n <= 2 ? 1 : n <= 4 ? 2 : 3;
  const counts: number[] = [];
  for (let left = n; left > 0; left -= perRow) counts.push(Math.min(perRow, left));
  const rowH = (H - pad * (counts.length - 1)) / counts.length;
  return counts.flatMap((c, r) => split(c, x, y + r * (rowH + pad), W, rowH, true));
}

function drawPhoto(ctx: CanvasRenderingContext2D, p: Photo, x: number, y: number, w: number, h: number, radius: number) {
  const iw = p.img.naturalWidth;
  const ih = p.img.naturalHeight;
  if (!iw || !ih) return;
  const r = Math.max(w / iw, h / ih) * p.zoom;
  const dw = iw * r;
  const dh = ih * r;
  ctx.save();
  ctx.beginPath();
  if (radius) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  const css = makeupCss(p.makeup);
  ctx.filter = css || "none";
  if (p.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.drawImage(p.img, x + w / 2 - dw / 2 + (p.ox * w) / 2, y + h / 2 - dh / 2 + (p.oy * h) / 2, dw, dh);
  ctx.restore();
}

interface Live {
  variant: Variant;
  aspect: PosterAspect;
  gradient: number;
  photos: Photo[];
  style: LayoutStyle;
  gap: number;
  texts: TextItem[];
  stickers: StickerItem[];
  shapes: ShapeItem[];
  art: ArtState;
  hint: string;
}

function drawPoster(canvas: HTMLCanvasElement, s: Live, t: number) {
  const { w, h } = SIZES[s.aspect];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  const [c1, c2] = GRADIENTS[s.gradient];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (s.variant === "card") {
    if (s.photos.length === 1) drawPhoto(ctx, s.photos[0], 0, 0, w, h, 0);
    else if (s.photos.length >= 2) {
      const half = h / 2;
      drawPhoto(ctx, s.photos[0], 0, 0, w, half - 2, 0);
      drawPhoto(ctx, s.photos[1], 0, half + 2, w, half - 2, 0);
    }
    if (s.photos.length) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, w, h);
    }
  } else if (s.photos.length) {
    const rects = layoutRects(s.photos.length, s.style, w, h, s.gap);
    s.photos.forEach((p, i) => {
      const r = rects[i];
      if (r) drawPhoto(ctx, p, r[0], r[1], r[2], r[3], s.gap > 0 ? 12 : 0);
    });
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `600 ${w * 0.05}px "Noto Sans TC", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.hint, w / 2, h / 2);
  }
  ctx.filter = "none";
  drawArt(ctx, w, h, s.art);
  drawLayers(ctx, buildStack(s.shapes, s.stickers, s.texts), t, 1000);
}

function photoRect(variant: Variant, n: number, index: number, style: LayoutStyle, gap: number, w: number, h: number): Rect | null {
  if (index < 0 || index >= n) return null;
  if (variant === "card") {
    if (n === 1) return [0, 0, w, h];
    const half = h / 2;
    return index === 0 ? [0, 0, w, half - 2] : [0, half + 2, w, half - 2];
  }
  return layoutRects(n, style, w, h, gap)[index] ?? null;
}

type PosterTab = "format" | "bg" | "photos" | "layout" | "art" | "shapes" | "text" | "symbols" | "stickers";


function ColorSwatches({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            style={{ backgroundColor: c }}
            className={`size-8 rounded-full border border-border ${value === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          />
        ))}
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0"
        />
      </div>
    </div>
  );
}

export function PosterEditor({ variant, initial, aiChat, stillOnly }: { variant: Variant; initial?: PosterInitial; aiChat?: boolean; stillOnly?: boolean }) {
  return (
    <WorkSession>
      {(lifecycle) => <PosterEditorInner variant={variant} lifecycle={lifecycle} initial={initial} aiChat={aiChat} stillOnly={stillOnly} />}
    </WorkSession>
  );
}

function PosterEditorInner({
  variant,
  lifecycle,
  initial,
  aiChat,
  stillOnly = false,
}: {
  variant: Variant;
  lifecycle: WorkLifecycle;
  initial?: PosterInitial;
  aiChat?: boolean;
  stillOnly?: boolean;
}) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const maxPhotos = variant === "card" ? MAX_CARD : aiChat ? 9 : MAX_COLLAGE;
  const lock = useEditLock<PosterTab>(variant === "card" ? "bg" : "photos");
  const { tab, phase } = lock;
  const editing = phase === "editing";
  const [aspect, setAspect] = useState<PosterAspect>(() => (initial && initial.aspect in SIZES ? (initial.aspect as PosterAspect) : "3:4"));
  const [gradient, setGradient] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>(() =>
    (initial?.photos ?? []).slice(0, maxPhotos).map((p) => ({ id: uid(), img: p.img, url: p.url, zoom: 1, ox: 0, oy: 0, makeup: { ...DEFAULT_MAKEUP } })),
  );
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [style, setStyle] = useState<LayoutStyle>("grid");
  const [gap, setGap] = useState(10);
  const [message, setMessage] = useState<string | null>(null);
  const [fmt, setFmt] = useState<"orig" | "gif">("orig");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingSave | null>(null);
  const suggested = lifecycle.suggest;
  useEffect(() => {
    if (suggested) setFmt(suggested.fmt);
  }, [suggested]);
  const [texts, setTexts] = useState<TextItem[]>(() =>
    variant === "card"
      ? [
          { id: uid(), text: L("活動標題", "Event title"), start: 0, end: 1e9, x: 0.5, y: 0.35, size: 12, color: "#ffffff", font: "Noto Sans TC" },
          { id: uid(), text: L("在這裡寫下日期與地點", "Date and place here"), start: 0, end: 1e9, x: 0.5, y: 0.5, size: 6, color: "#ffffff", font: "Noto Serif TC" },
        ]
      : [],
  );
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  const [art, setArt] = useState<ArtState>(DEFAULT_ART);
  const [manual, setManual] = useState(false);
  const locked = !!aiChat && !manual;
  const [aiSels, setAiSels] = useState<{ kind: "text" | "sticker" | "shape" | "photo"; id: string }[]>([]);

  const live = useRef<Live>({ variant, aspect, gradient, photos, style, gap, texts, stickers, shapes, art, hint: "" });
  live.current = {
    variant, aspect, gradient, photos, style, gap, texts, stickers, shapes, art,
    hint: L("請先上傳相片", "Upload photos first"),
  };

  const forceDraw = useRef(true);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    let last = 0;
    let lastDrawn: Live | null = null;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - last < 33) return;
      const s = live.current;
      const animated = !!s.art.comboType || s.art.borders.length > 0;
      if (!animated && !forceDraw.current && s === lastDrawn) return;
      last = now;
      lastDrawn = s;
      forceDraw.current = false;
      if (canvasRef.current) drawPoster(canvasRef.current, s, (performance.now() - t0) / 1000);
    };
    raf = requestAnimationFrame(loop);
    const state = live;
    return () => {
      cancelAnimationFrame(raf);
      state.current.photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  useEffect(() => {
    texts.forEach((item) => {
      const spec = fontSpec(item.font);
      document.fonts
        .load(`${spec.weight} 40px "${spec.family}"`, item.text || "A")
        .then(() => {
          forceDraw.current = true;
        })
        .catch(() => {});
    });
  }, [texts]);

  const aiState = () => {
    const s = live.current;
    return {
      aspect: s.aspect,
      background: s.gradient,
      layout: s.style,
      gap: s.gap,
      photoCount: s.photos.length,
      texts: s.texts.map((t, i) => ({ n: i + 1, text: t.text, x: +t.x.toFixed(2), y: +t.y.toFixed(2), size: t.size, color: t.color, font: t.font, sx: t.sx ?? 1, sy: t.sy ?? 1, opacity: t.alpha ?? 1 })),
      stickers: s.stickers.map((t, i) => ({ n: i + 1, kind: t.kind, x: +t.x.toFixed(2), y: +t.y.toFixed(2), size: t.size, sx: t.sx ?? 1, sy: t.sy ?? 1, opacity: t.alpha ?? 1 })),
      shapes: s.shapes.map((t, i) => ({ n: i + 1, kind: t.kind, x: +t.x.toFixed(2), y: +t.y.toFixed(2), w: t.w, h: t.h, color: t.color, opacity: t.alpha ?? 1 })),
    };
  };

  const applyActions = (list: AiAction[]) => {
    const cur = live.current;
    let nTexts = [...cur.texts];
    let nStickers = [...cur.stickers];
    let nShapes = [...cur.shapes];
    let nPhotos = [...cur.photos];
    const gone = new Set<string>();
    const z = () => nextZ(nShapes, nStickers, nTexts);
    const at = (i: number | null, len: number) => (i && i >= 1 && i <= len ? i - 1 : len - 1);
    for (const a of list) {
      switch (a.type) {
        case "set_background":
          if (a.gradient !== null) setGradient(clampN(Math.round(a.gradient), 0, GRADIENTS.length - 1));
          break;
        case "set_aspect":
          if (a.aspect && a.aspect in SIZES) setAspect(a.aspect as PosterAspect);
          break;
        case "set_layout":
          if (a.style) setStyle(a.style);
          if (a.gap !== null) setGap(clampN(a.gap, 0, 40));
          break;
        case "add_text":
          nTexts = [
            ...nTexts,
            {
              id: uid(), text: (a.text ?? "").slice(0, 120), start: 0, end: 1e9,
              x: clampN(a.x ?? 0.5, 0, 1), y: clampN(a.y ?? 0.5, 0, 1), size: clampN(a.size ?? 9, 3, 30),
              color: isHex(a.color) ? a.color : "#ffffff",
              font: FONTS.some((f) => f.family === a.font) ? (a.font as string) : "Noto Sans TC",
              rot: a.rot ?? 0, z: z(),
            },
          ];
          break;
        case "update_text": {
          const i = at(a.index, nTexts.length);
          const t = nTexts[i];
          if (!t) break;
          nTexts[i] = {
            ...t,
            text: a.text !== null ? a.text.slice(0, 120) : t.text,
            x: a.x !== null ? clampN(a.x, 0, 1) : t.x,
            y: a.y !== null ? clampN(a.y, 0, 1) : t.y,
            size: a.size !== null ? clampN(a.size, 3, 30) : t.size,
            color: isHex(a.color) ? a.color : t.color,
            font: FONTS.some((f) => f.family === a.font) ? (a.font as string) : t.font,
            rot: a.rot !== null ? a.rot : t.rot,
            sx: a.sx !== null ? clampN(a.sx, 0.2, 4) : t.sx,
            sy: a.sy !== null ? clampN(a.sy, 0.2, 4) : t.sy,
            alpha: a.opacity !== null ? clampN(a.opacity, 0.05, 1) : t.alpha,
          };
          break;
        }
        case "remove_text":
          if (nTexts.length) gone.add(nTexts[at(a.index, nTexts.length)].id);
          break;
        case "remove_photo":
          if (nPhotos.length) gone.add(nPhotos[at(a.index, nPhotos.length)].id);
          break;
        case "add_sticker":
          if (a.kind && STICKER_MAP[a.kind])
            nStickers = [
              ...nStickers,
              { id: uid(), kind: a.kind, x: clampN(a.x ?? 0.5, 0, 1), y: clampN(a.y ?? 0.5, 0, 1), size: clampN(a.size ?? 24, 8, 60), start: 0, end: 1e9, rot: a.rot ?? 0, z: z() },
            ];
          break;
        case "update_sticker": {
          const i = at(a.index, nStickers.length);
          const t = nStickers[i];
          if (!t) break;
          nStickers[i] = {
            ...t,
            kind: a.kind && STICKER_MAP[a.kind] ? a.kind : t.kind,
            x: a.x !== null ? clampN(a.x, 0, 1) : t.x,
            y: a.y !== null ? clampN(a.y, 0, 1) : t.y,
            size: a.size !== null ? clampN(a.size, 8, 60) : t.size,
            rot: a.rot !== null ? a.rot : t.rot,
            sx: a.sx !== null ? clampN(a.sx, 0.2, 4) : t.sx,
            sy: a.sy !== null ? clampN(a.sy, 0.2, 4) : t.sy,
            alpha: a.opacity !== null ? clampN(a.opacity, 0.05, 1) : t.alpha,
          };
          break;
        }
        case "remove_sticker":
          if (nStickers.length) gone.add(nStickers[at(a.index, nStickers.length)].id);
          break;
        case "add_shape": {
          const def = SHAPES.find((s) => s.id === a.kind);
          if (!def) break;
          nShapes = [
            ...nShapes,
            {
              id: uid(), kind: def.id, x: clampN(a.x ?? 0.5, 0, 1), y: clampN(a.y ?? 0.5, 0, 1),
              w: clampN(a.w ?? 40, 5, 100), h: clampN(a.h ?? (def.group === "line" ? 14 : 30), 3, 100), rot: a.rot ?? 0,
              stroke: clampN(a.stroke ?? 2, 0.5, 10), color: isHex(a.color) ? a.color : "#ffffff",
              fill: def.closed && isHex(a.fill) ? a.fill : null,
              rows: clampN(Math.round(a.rows ?? 3), 1, 10), cols: clampN(Math.round(a.cols ?? 3), 1, 10), z: z(),
            },
          ];
          break;
        }
        case "update_shape": {
          const i = at(a.index, nShapes.length);
          const t = nShapes[i];
          if (!t) break;
          nShapes[i] = {
            ...t,
            x: a.x !== null ? clampN(a.x, 0, 1) : t.x,
            y: a.y !== null ? clampN(a.y, 0, 1) : t.y,
            w: a.w !== null ? clampN(a.w, 5, 100) : t.w,
            h: a.h !== null ? clampN(a.h, 3, 100) : t.h,
            rot: a.rot !== null ? a.rot : t.rot,
            stroke: a.stroke !== null ? clampN(a.stroke, 0.5, 10) : t.stroke,
            color: isHex(a.color) ? a.color : t.color,
            fill: a.fill === "none" ? null : isHex(a.fill) ? a.fill : t.fill,
            rows: a.rows !== null ? clampN(Math.round(a.rows), 1, 10) : t.rows,
            cols: a.cols !== null ? clampN(Math.round(a.cols), 1, 10) : t.cols,
            alpha: a.opacity !== null ? clampN(a.opacity, 0.05, 1) : t.alpha,
          };
          break;
        }
        case "remove_shape":
          if (nShapes.length) gone.add(nShapes[at(a.index, nShapes.length)].id);
          break;
        case "adjust_photo": {
          const i = a.index && a.index >= 1 && a.index <= nPhotos.length ? a.index - 1 : 0;
          const p = nPhotos[i];
          if (!p) break;
          nPhotos[i] = {
            ...p,
            zoom: a.zoom !== null ? clampN(a.zoom, 0.5, 3) : p.zoom,
            makeup: {
              ...p.makeup,
              bright: a.bright !== null ? clampN(a.bright, 0.6, 1.5) : p.makeup.bright,
              contrast: a.contrast !== null ? clampN(a.contrast, 0.6, 1.6) : p.makeup.contrast,
              sat: a.sat !== null ? clampN(a.sat, 0, 2) : p.makeup.sat,
              warm: a.warm !== null ? clampN(a.warm, -1, 1) : p.makeup.warm,
            },
          };
          break;
        }
      }
    }
    if (gone.size) {
      nPhotos.filter((p) => gone.has(p.id)).forEach((p) => URL.revokeObjectURL(p.url));
      nTexts = nTexts.filter((x) => !gone.has(x.id));
      nStickers = nStickers.filter((x) => !gone.has(x.id));
      nShapes = nShapes.filter((x) => !gone.has(x.id));
      nPhotos = nPhotos.filter((x) => !gone.has(x.id));
      setAiSels([]);
    }
    setTexts(nTexts);
    setStickers(nStickers);
    setShapes(nShapes);
    setPhotos(nPhotos);
  };

  const onFiles = async (files: FileList | null) => {
    setMessage(null);
    if (!files) return;
    const room = maxPhotos - photos.length;
    if (files.length > room) setMessage(L(`最多 ${maxPhotos} 張。`, `Up to ${maxPhotos} photos.`));
    const added: Photo[] = [];
    for (const f of Array.from(files).slice(0, Math.max(0, room))) {
      const url = URL.createObjectURL(f);
      try {
        added.push({ id: uid(), img: await loadImage(url), url, zoom: 1, ox: 0, oy: 0, makeup: { ...DEFAULT_MAKEUP } });
      } catch {
        URL.revokeObjectURL(url);
        setMessage(L("相片載入失敗。", "Could not load the photo."));
      }
    }
    if (added.length) {
      setPhotos((prev) => [...prev, ...added]);
      setSelectedPhoto(added[0].id);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });
    setSelectedPhoto(null);
  };

  const updatePhoto = (id: string, patch: Partial<Photo>) => setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addText = () => {
    const item: TextItem = {
      id: uid(), text: L("美好回憶", "Beautiful memories"), start: 0, end: 1e9,
      x: 0.5, y: 0.8, size: 9, color: "#ffffff", font: "Noto Sans TC", z: nextZ(shapes, stickers, texts),
    };
    setTexts((prev) => [...prev, item]);
    setSelectedText(item.id);
  };

  const addSticker = (kind: string) => {
    const item: StickerItem = { id: uid(), kind, x: 0.5, y: 0.5, size: 24, start: 0, end: 1e9, z: nextZ(shapes, stickers, texts) };
    setStickers((prev) => [...prev, item]);
    setSelectedSticker(item.id);
  };

  const addShape = (kind: string) => {
    const def = SHAPES.find((s) => s.id === kind);
    const item: ShapeItem = {
      id: uid(), kind, x: 0.5, y: 0.5, w: 40, h: def?.group === "line" ? 14 : 30, rot: 0,
      stroke: 2, color: "#ffffff", fill: null, rows: 3, cols: 3, z: nextZ(shapes, stickers, texts),
    };
    setShapes((prev) => [...prev, item]);
    setSelectedShape(item.id);
  };

  const updateShape = (id: string, patch: Partial<ShapeItem>) => setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const askSave = (blob: Blob, ext: string, fmtKind: "orig" | "gif") =>
    setPending({ blob, filename: `jsc343-${variant}-${Date.now()}.${ext}`, onSaved: () => lifecycle.markDownloaded(fmtKind) });

  const downloadGif = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const scratch = document.createElement("canvas");
      const fps = 10;
      const blob = await buildGif({
        count: fps * 3,
        fps,
        maxWidth: 480,
        draw: (i) => {
          drawPoster(scratch, live.current, i / fps);
          return scratch;
        },
      });
      askSave(blob, "gif", "gif");
    } catch {
      setMessage(L("GIF 製作失敗，請再試一次。", "Could not make the GIF. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (fmt === "gif" && !stillOnly) {
      void downloadGif();
      return;
    }
    canvasRef.current?.toBlob((blob) => {
      if (blob) askSave(blob, "png", "orig");
    }, "image/png");
  };

  const tabs: [PosterTab, string][] =
    variant === "card"
      ? [["format", L("格式", "Format")], ["bg", L("背景", "Background")], ["photos", L("相片", "Photos")], ["art", L("藝術套件", "Art kit")], ["shapes", L("圖形線條", "Shapes")], ["text", L("文字", "Text")], ["symbols", L("符號", "Symbols")], ["stickers", L("插圖", "Artwork")]]
      : [["format", L("格式", "Format")], ["photos", L("相片", "Photos")], ["layout", L("版型", "Layout")], ["art", L("藝術套件", "Art kit")], ["shapes", L("圖形線條", "Shapes")], ["text", L("文字", "Text")], ["symbols", L("符號", "Symbols")], ["stickers", L("插圖", "Artwork")]];

  const pickSymbol = (s: string) => {
    const cur = texts.find((x) => x.id === selectedText);
    if (cur) {
      setTexts((prev) => prev.map((x) => (x.id === cur.id ? { ...x, text: (x.text + s).slice(0, 120) } : x)));
      return;
    }
    const item: TextItem = { id: uid(), text: s, start: 0, end: 1e9, x: 0.5, y: 0.6, size: 12, color: "#ffffff", font: "Noto Sans TC", z: nextZ(shapes, stickers, texts) };
    setTexts((prev) => [...prev, item]);
    setSelectedText(item.id);
  };

  const backgroundPicker = (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{L("背景顏色", "Background color")}</h3>
      <div className="flex flex-wrap gap-2">
        {GRADIENTS.map(([a, b], i) => (
          <button
            key={a + b}
            type="button"
            aria-label={`${L("背景", "Background")} ${i + 1}`}
            aria-pressed={gradient === i}
            onClick={() => setGradient(i)}
            style={{ backgroundImage: `linear-gradient(135deg, ${a}, ${b})` }}
            className={`size-12 rounded-xl border border-border ${gradient === i ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
          />
        ))}
      </div>
    </div>
  );

  const styleLabels: [LayoutStyle, string][] = [
    ["grid", L("平均格", "Grid")],
    ["feature", L("上方主圖", "Top feature")],
    ["side", L("側邊主圖", "Side feature")],
  ];

  const photo = photos.find((p) => p.id === selectedPhoto) ?? photos[0];
  const shape = shapes.find((s) => s.id === selectedShape);
  const shapeDef = shape ? SHAPES.find((s) => s.id === shape.kind) : undefined;
  const setMk = (p: Partial<Makeup>) => photo && updatePhoto(photo.id, { makeup: { ...photo.makeup, ...p } });

  const selText = texts.find((x) => x.id === selectedText);
  const selSticker = stickers.find((x) => x.id === selectedSticker);
  const nudgeTarget: { key: string; x: number; y: number; rot: number; move: (x: number, y: number) => void; rotate: (r: number) => void } | null =
    tab === "photos" && photo
      ? {
          key: photo.id,
          x: (photo.ox + 1) / 2,
          y: (photo.oy + 1) / 2,
          rot: photo.rot ?? 0,
          move: (x, y) => updatePhoto(photo.id, { ox: Math.max(-1, Math.min(1, x * 2 - 1)), oy: Math.max(-1, Math.min(1, y * 2 - 1)) }),
          rotate: (r) => updatePhoto(photo.id, { rot: r }),
        }
      : tab === "shapes" && shape
        ? { key: shape.id, x: shape.x, y: shape.y, rot: shape.rot, move: (x, y) => updateShape(shape.id, { x, y }), rotate: (r) => updateShape(shape.id, { rot: r }) }
        : (tab === "text" || tab === "symbols") && selText
          ? {
              key: selText.id,
              x: selText.x,
              y: selText.y,
              rot: selText.rot ?? 0,
              move: (x, y) => setTexts((prev) => prev.map((t) => (t.id === selText.id ? { ...t, x, y } : t))),
              rotate: (r) => setTexts((prev) => prev.map((t) => (t.id === selText.id ? { ...t, rot: r } : t))),
            }
          : tab === "stickers" && selSticker
            ? {
                key: selSticker.id,
                x: selSticker.x,
                y: selSticker.y,
                rot: selSticker.rot ?? 0,
                move: (x, y) => setStickers((prev) => prev.map((t) => (t.id === selSticker.id ? { ...t, x, y } : t))),
                rotate: (r) => setStickers((prev) => prev.map((t) => (t.id === selSticker.id ? { ...t, rot: r } : t))),
              }
            : null;

  const stack = buildStack(shapes, stickers, texts);
  const activeId =
    (tab === "shapes" && shape?.id) || ((tab === "text" || tab === "symbols") && selText?.id) || (tab === "stickers" && selSticker?.id) || null;
  const activeIndex = activeId ? stack.findIndex((e) => e.id === activeId) : -1;
  const size = SIZES[aspect];

  const shiftLayer = (dir: "up" | "down") => {
    if (!activeId || !editing) return;
    const map = moveLayer(stack, activeId, dir);
    if (!map) return;
    setShapes((prev) => prev.map((s) => ({ ...s, z: map.get(s.id) ?? s.z })));
    setStickers((prev) => prev.map((s) => ({ ...s, z: map.get(s.id) ?? s.z })));
    setTexts((prev) => prev.map((s) => ({ ...s, z: map.get(s.id) ?? s.z })));
  };

  const pickOnCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * c.width;
    const py = ((e.clientY - r.top) / r.height) * c.height;
    const hit = hitTest(stack, c.width, c.height, px, py);
    const tryOpen = (target: PosterTab) => {
      if (lock.open(target)) return true;
      setMessage(L("目前的編輯項目尚未確認，其他項目已鎖住。請先按綠色「確認」。", "Finish the current item and tap the green Confirm first."));
      return false;
    };
    if (hit) {
      if (hit.kind === "text") {
        if (tryOpen(editing && tab === "symbols" ? "symbols" : "text")) setSelectedText(hit.id);
      } else if (hit.kind === "sticker") {
        if (tryOpen("stickers")) setSelectedSticker(hit.id);
      } else if (tryOpen("shapes")) {
        setSelectedShape(hit.id);
      }
      return;
    }
    for (let i = photos.length - 1; i >= 0; i--) {
      const pr = photoRect(variant, photos.length, i, style, gap, c.width, c.height);
      if (pr && px >= pr[0] && px <= pr[0] + pr[2] && py >= pr[1] && py <= pr[1] + pr[3]) {
        if (tryOpen("photos")) setSelectedPhoto(photos[i].id);
        return;
      }
    }
  };

  let frame: Bounds | null = null;
  if (activeId) {
    const entry = stack.find((e) => e.id === activeId);
    if (entry) frame = boundsOf(entry, size.w, size.h);
  } else if (tab === "photos" && photo) {
    const pr = photoRect(variant, photos.length, photos.indexOf(photo), style, gap, size.w, size.h);
    if (pr) frame = { cx: pr[0] + pr[2] / 2, cy: pr[1] + pr[3] / 2, w: pr[2], h: pr[3], rot: 0 };
  }

  const aiPick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * c.width;
    const py = ((e.clientY - r.top) / r.height) * c.height;
    const hit = hitTest(stack, c.width, c.height, px, py);
    const toggle = (kind: "text" | "sticker" | "shape" | "photo", id: string) =>
      setAiSels((prev) => (prev.some((s) => s.id === id) ? prev.filter((s) => s.id !== id) : [...prev, { kind, id }]));
    if (hit) {
      toggle(hit.kind === "text" ? "text" : hit.kind === "sticker" ? "sticker" : "shape", hit.id);
      return;
    }
    for (let i = photos.length - 1; i >= 0; i--) {
      const pr = photoRect(variant, photos.length, i, style, gap, c.width, c.height);
      if (pr && px >= pr[0] && px <= pr[0] + pr[2] && py >= pr[1] && py <= pr[1] + pr[3]) {
        toggle("photo", photos[i].id);
        return;
      }
    }
  };

  const deleteIds = (ids: Set<string>) => {
    if (!ids.size) return;
    photos.filter((p) => ids.has(p.id)).forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos((prev) => prev.filter((p) => !ids.has(p.id)));
    setTexts((prev) => prev.filter((x) => !ids.has(x.id)));
    setStickers((prev) => prev.filter((x) => !ids.has(x.id)));
    setShapes((prev) => prev.filter((x) => !ids.has(x.id)));
    setAiSels([]);
    setSelectedPhoto(null);
    setSelectedText(null);
    setSelectedSticker(null);
    setSelectedShape(null);
  };

  const aiItems: { label: string; payload: unknown; frame: Bounds }[] = [];
  for (const sel of aiSels) {
    if (sel.kind === "photo") {
      const i = photos.findIndex((p) => p.id === sel.id);
      const pr = i >= 0 ? photoRect(variant, photos.length, i, style, gap, size.w, size.h) : null;
      if (pr) aiItems.push({ label: L(`相片 ${i + 1}`, `Photo ${i + 1}`), payload: { element: "photo", index: i + 1 }, frame: { cx: pr[0] + pr[2] / 2, cy: pr[1] + pr[3] / 2, w: pr[2], h: pr[3], rot: 0 } });
      continue;
    }
    const entry = stack.find((x) => x.id === sel.id);
    if (!entry) continue;
    const fr = boundsOf(entry, size.w, size.h);
    if (sel.kind === "text") {
      const i = texts.findIndex((x) => x.id === sel.id);
      if (i >= 0) aiItems.push({ label: L(`文字 ${i + 1}「${texts[i].text.slice(0, 12)}」`, `Text ${i + 1} “${texts[i].text.slice(0, 12)}”`), payload: { element: "text", index: i + 1, text: texts[i].text }, frame: fr });
    } else if (sel.kind === "sticker") {
      const i = stickers.findIndex((x) => x.id === sel.id);
      if (i >= 0) aiItems.push({ label: L(`貼圖 ${i + 1}`, `Sticker ${i + 1}`), payload: { element: "sticker", index: i + 1, kind: stickers[i].kind }, frame: fr });
    } else {
      const i = shapes.findIndex((x) => x.id === sel.id);
      if (i >= 0) aiItems.push({ label: L(`圖形 ${i + 1}`, `Shape ${i + 1}`), payload: { element: "shape", index: i + 1, kind: shapes[i].kind }, frame: fr });
    }
  }
  const aiSelected: { label: string; payload: unknown } | null = aiItems.length
    ? aiItems.length === 1
      ? aiItems[0]
      : { label: aiItems.map((x) => x.label).join("、"), payload: { multiple: aiItems.map((x) => x.payload) } }
    : null;
  const frames: Bounds[] = locked ? aiItems.map((x) => x.frame) : frame ? [frame] : [];

  const manualDeleteId =
    activeId ?? (tab === "photos" && selectedPhoto && photos.some((p) => p.id === selectedPhoto) ? selectedPhoto : null);

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="sticky top-14 z-10 -mx-4 flex flex-col gap-2 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="relative mx-auto w-fit max-w-full">
          <canvas
            ref={canvasRef}
            onPointerDown={locked ? aiPick : pickOnCanvas}
            className="block max-h-[34dvh] w-auto max-w-full cursor-pointer rounded-2xl bg-secondary"
            role="img"
            aria-label={variant === "card" ? L("文宣卡片預覽，點按物件可選取", "Promo card preview, tap an object to select") : L("相片組合預覽，點按物件可選取", "Collage preview, tap an object to select")}
          />
          {frames.map((fr, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute rounded-sm border-2 border-dashed border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"
              style={{
                left: `${((fr.cx - fr.w / 2) / size.w) * 100}%`,
                top: `${((fr.cy - fr.h / 2) / size.h) * 100}%`,
                width: `${(fr.w / size.w) * 100}%`,
                height: `${(fr.h / size.h) * 100}%`,
                transform: `rotate(${fr.rot}deg)`,
              }}
            />
          ))}
        </div>
        {!locked && (
          <LayerBar
            canFix={phase === "confirmed"}
            canConfirm={editing}
            onFix={lock.reopen}
            onConfirm={lock.confirm}
            hasTarget={activeId !== null && editing}
            canUp={activeIndex >= 0 && activeIndex < stack.length - 1}
            canDown={activeIndex > 0}
            onUp={() => shiftLayer("up")}
            onDown={() => shiftLayer("down")}
          />
        )}
        {!locked && manualDeleteId && editing && (
          <Button type="button" variant="outline" size="sm" className="h-10 self-center text-destructive" onClick={() => deleteIds(new Set([manualDeleteId]))}>
            <Trash2 className="size-4" aria-hidden="true" />
            {L("刪除選取的元件", "Delete selected item")}
          </Button>
        )}
        {!locked && nudgeTarget && (
          <div inert={!editing} className={editing ? "" : "opacity-30 grayscale"}>
            <Nudge key={nudgeTarget.key} x={nudgeTarget.x} y={nudgeTarget.y} rot={nudgeTarget.rot} onMove={nudgeTarget.move} onRotate={nudgeTarget.rotate} />
          </div>
        )}
      </div>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      {aiChat && (
        <AiChatPanel variant={variant} selected={aiSelected} onClearSelected={() => setAiSels([])} onDeleteSelected={() => deleteIds(new Set(aiSels.map((s) => s.id)))} getState={aiState} onActions={applyActions} manualOpen={manual} onManual={() => startTransition(() => setManual((v) => !v))} />
      )}

      {!locked && (
      <div role="tablist" className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={phase !== "idle" && tab === id}
            disabled={!lock.canOpen(id)}
            onClick={() => lock.open(id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium disabled:opacity-35 ${
              phase !== "idle" && tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {!locked && (
      <EditLockPanel phase={phase}>
      {tab === "format" && <FormatPanel options={Object.keys(SIZES) as PosterAspect[]} value={aspect} onChange={setAspect} />}

      {tab === "bg" && backgroundPicker}

      {tab === "photos" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {L(`已放 ${photos.length} / ${maxPhotos} 張相片`, `${photos.length} / ${maxPhotos} photos added`)}
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div
                key={p.id}
                className={`relative size-20 overflow-hidden rounded-xl border ${photo?.id === p.id ? "border-primary ring-2 ring-primary" : "border-border"}`}
              >
                <button type="button" className="size-full" aria-label={L(`選擇相片 ${i + 1}`, `Select photo ${i + 1}`)} onClick={() => setSelectedPhoto(p.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={L(`相片 ${i + 1}`, `Photo ${i + 1}`)} className="size-full object-cover" />
                </button>
                <button
                  type="button"
                  aria-label={L("移除相片", "Remove photo")}
                  onClick={() => removePhoto(p.id)}
                  className="absolute end-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < maxPhotos && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary text-xs text-primary"
              >
                <ImagePlus className="size-5" />
                {L("加入相片", "Add")}
              </button>
            )}
          </div>

          {photo && (
            <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
              <h3 className="text-sm font-semibold">{L("這張相片的大小與位置", "Size and position of this photo")}</h3>
              <Range label={L("大小", "Size")} value={photo.zoom} min={0.5} max={3} step={0.05} suffix="x" onChange={(v) => updatePhoto(photo.id, { zoom: v })} />
              <h3 className="pt-1 text-sm font-semibold">{L("色彩調整", "Color adjust")}</h3>
              <Range label={L("亮度", "Brightness")} value={photo.makeup.bright} min={0.6} max={1.5} step={0.05} onChange={(v) => setMk({ bright: v })} />
              <Range label={L("對比", "Contrast")} value={photo.makeup.contrast} min={0.6} max={1.6} step={0.05} onChange={(v) => setMk({ contrast: v })} />
              <Range label={L("飽和", "Saturation")} value={photo.makeup.sat} min={0} max={2} step={0.05} onChange={(v) => setMk({ sat: v })} />
              <Range label={L("冷暖", "Warmth")} value={photo.makeup.warm} min={-1} max={1} step={0.1} onChange={(v) => setMk({ warm: v })} />
              <Button
                variant="outline"
                className="self-start"
                onClick={() => updatePhoto(photo.id, { zoom: 1, ox: 0, oy: 0, makeup: { ...DEFAULT_MAKEUP } })}
              >
                {L("還原這張", "Reset this photo")}
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "layout" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{L("版型", "Layout")}</h3>
            <div className="flex flex-wrap gap-2">
              {styleLabels.map(([id, label]) => (
                <Chip key={id} active={style === id} onClick={() => setStyle(id)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>
          <Range label={L("間距", "Spacing")} value={gap} min={0} max={40} step={2} onChange={setGap} />
          {backgroundPicker}
        </div>
      )}

      {tab === "art" && <ArtPanel art={art} onChange={setArt} />}

      {tab === "shapes" && (
        <div className="flex flex-col gap-3">
          {(["geo", "line"] as const).map((group) => (
            <div key={group} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{group === "geo" ? L("表格與幾何圖形", "Tables and shapes") : L("線條、箭頭與曲線", "Lines, arrows and curves")}</h3>
              <div className="flex flex-wrap gap-2">
                {SHAPES.filter((s) => s.group === group).map((s) => (
                  <Button key={s.id} variant="outline" size="sm" className="rounded-full" onClick={() => addShape(s.id)}>
                    <Plus className="size-3.5" />
                    {zh ? s.zh : s.en}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {shapes.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={L("已加入的圖形", "Added shapes")}>
              {shapes.map((s, i) => {
                const d = SHAPES.find((x) => x.id === s.kind);
                return (
                  <Chip key={s.id} active={shape?.id === s.id} onClick={() => setSelectedShape(s.id)}>
                    {i + 1}. {zh ? d?.zh : d?.en}
                  </Chip>
                );
              })}
            </div>
          )}

          {shape && shapeDef && (
            <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
              <Range label={L("線條粗細", "Line weight")} value={shape.stroke} min={0.5} max={10} step={0.5} onChange={(v) => updateShape(shape.id, { stroke: v })} />
              <Range label={L("寬度", "Width")} value={shape.w} min={5} max={100} step={1} onChange={(v) => updateShape(shape.id, { w: v })} />
              {shapeDef.id !== "line" && shapeDef.id !== "dashed" && shapeDef.id !== "dotted" && shapeDef.id !== "arrow" && shapeDef.id !== "arrow2" && (
                <Range label={L("高度", "Height")} value={shape.h} min={3} max={100} step={1} onChange={(v) => updateShape(shape.id, { h: v })} />
              )}
              <Range label={L("旋轉", "Rotate")} value={shape.rot} min={-180} max={180} step={5} suffix="°" onChange={(v) => updateShape(shape.id, { rot: v })} />
              <Range label={L("透明度", "Opacity")} value={Math.round((shape.alpha ?? 1) * 100)} min={5} max={100} step={5} suffix="%" onChange={(v) => updateShape(shape.id, { alpha: v / 100 })} />
              {shape.kind === "table" && (
                <>
                  <Range label={L("列數", "Rows")} value={shape.rows} min={1} max={10} step={1} onChange={(v) => updateShape(shape.id, { rows: v })} />
                  <Range label={L("欄數", "Columns")} value={shape.cols} min={1} max={10} step={1} onChange={(v) => updateShape(shape.id, { cols: v })} />
                </>
              )}
              <ColorSwatches label={L("線條顏色", "Line color")} value={shape.color} onChange={(c) => updateShape(shape.id, { color: c })} />
              {shapeDef.closed && (
                <div className="flex flex-col gap-2">
                  <ColorSwatches label={L("填滿顏色", "Fill color")} value={shape.fill ?? "#ffffff"} onChange={(c) => updateShape(shape.id, { fill: c })} />
                  <Button variant="outline" className="self-start" onClick={() => updateShape(shape.id, { fill: null })}>
                    {L("不填滿", "No fill")}
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="self-start"
                onClick={() => {
                  setShapes((prev) => prev.filter((s) => s.id !== shape.id));
                  setSelectedShape(null);
                }}
              >
                <Trash2 className="size-4" />
                {L("刪除", "Delete")}
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "text" && (
        <TextPanel
          texts={texts}
          selectedId={selectedText}
          total={1}
          still
          noNudge
          noSymbols
          onSelect={setSelectedText}
          onAdd={addText}
          onUpdate={(id, patch) => setTexts((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
          onRemove={(id) => {
            setTexts((prev) => prev.filter((x) => x.id !== id));
            setSelectedText(null);
          }}
        />
      )}

      {tab === "symbols" && <SymbolPicker onPick={pickSymbol} />}

      {tab === "stickers" && (
        <StickerPanel
          stickers={stickers}
          selectedId={selectedSticker}
          total={1}
          still
          noNudge
          onAdd={addSticker}
          onSelect={setSelectedSticker}
          onUpdate={(id, patch) => setStickers((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
          onRemove={(id) => {
            setStickers((prev) => prev.filter((x) => x.id !== id));
            setSelectedSticker(null);
          }}
        />
      )}

</EditLockPanel>
      )}

      <SaveDialog pending={pending} onClose={() => setPending(null)} />
      <LifecycleBar lifecycle={lifecycle} disabled={busy} />

      {!stillOnly && (
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={L("輸出方式", "Output")}>
        <Button type="button" variant={fmt === "orig" ? "default" : "outline"} className="h-auto flex-col gap-0.5 py-2" onClick={() => setFmt("orig")} aria-pressed={fmt === "orig"}>
          <span>{L("保持原創", "Keep original")}</span>
          <span className="text-xs font-normal opacity-80">{L("直接下載圖片", "Download as image")}</span>
        </Button>
        <Button type="button" variant={fmt === "gif" ? "default" : "outline"} className="h-auto flex-col gap-0.5 py-2" onClick={() => setFmt("gif")} aria-pressed={fmt === "gif"}>
          <span>{L("製成 GIF", "Make a GIF")}</span>
          <span className="text-xs font-normal opacity-80">{L("自動重複播放", "Loops automatically")}</span>
        </Button>
      </div>
      )}
      <Button className="h-12" onClick={download} disabled={busy || (variant === "collage" && photos.length === 0)}>
        <Download className="size-4" aria-hidden="true" />
        {busy
          ? L("正在製作 GIF…", "Making GIF...")
          : fmt === "gif" && !stillOnly
            ? L("下載 GIF · 測試期免費", "Download GIF - free during testing")
            : L("下載圖片 · 測試期免費", "Download image - free during testing")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {fmt === "gif" && !stillOnly
          ? L("GIF 約 3 秒，會自動循環播放，檔案較小、色彩較簡化。成果不會保存。", "The GIF is about 3 seconds and loops forever. Colors are simplified. Nothing is saved.")
          : L("動態插圖會以下載當下的畫面輸出。成果不會保存。", "Animated artwork is captured as it looks at download. Nothing is saved.")}
      </p>
    </div>
  );
}
