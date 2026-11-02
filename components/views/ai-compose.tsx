"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Download, ImagePlus, Loader2, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/components/lang-context";

type Variant = "card" | "collage";
type Rect = [number, number, number, number];

interface Material {
  id: string;
  url: string;
  img: HTMLImageElement;
}

interface Design {
  title: string;
  subtitle: string;
  gradient: number;
  textColor: "light" | "dark";
  style: "grid" | "feature" | "side" | "polaroid";
  titlePosition: "top" | "center" | "bottom";
  gap: number;
  order: number[];
  emojis: string[];
  note: string;
}

interface Format {
  id: string;
  zh: string;
  en: string;
  w: number;
  h: number;
}

const FORMATS: Format[] = [
  { id: "3:4", zh: "直式海報", en: "Portrait poster", w: 600, h: 800 },
  { id: "4:5", zh: "社群貼文", en: "Social post", w: 640, h: 800 },
  { id: "1:1", zh: "正方形", en: "Square", w: 720, h: 720 },
  { id: "9:16", zh: "限時動態 / 手機全螢幕", en: "Story / phone screen", w: 450, h: 800 },
  { id: "2:3", zh: "相片 4×6 直式", en: "Photo print portrait", w: 540, h: 810 },
  { id: "4:3", zh: "橫式相片", en: "Landscape photo", w: 800, h: 600 },
  { id: "3:2", zh: "相片 6×4 橫式", en: "Photo print landscape", w: 810, h: 540 },
  { id: "16:9", zh: "寬螢幕 / 電視", en: "Widescreen / TV", w: 800, h: 450 },
];

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

const uid = () => Math.random().toString(36).slice(2, 10);

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image"));
    img.src = url;
  });
}

function thumbnail(img: HTMLImageElement, max = 512) {
  const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * r));
  c.height = Math.max(1, Math.round(img.naturalHeight * r));
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius = 0) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const r = Math.max(w / iw, h / ih);
  const dw = iw * r;
  const dh = ih * r;
  ctx.save();
  ctx.beginPath();
  if (radius) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function layoutRects(n: number, style: Design["style"], x: number, y: number, W: number, H: number, pad: number): Rect[] {
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

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const tk of tokens) {
    const next = line + tk;
    if (ctx.measureText(next).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = tk.trim() ? tk : "";
    } else line = next;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  d: Design,
  w: number,
  top: number,
  height: number,
  align: "top" | "center" | "bottom",
  color: string,
  shadow: boolean,
) {
  const titleSize = Math.round(w * 0.085);
  const subSize = Math.round(w * 0.04);
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 12;
  }
  ctx.font = `700 ${titleSize}px "Noto Sans TC", system-ui, sans-serif`;
  const tLines = d.title ? wrapLines(ctx, d.title, w * 0.84).slice(0, 3) : [];
  ctx.font = `500 ${subSize}px "Noto Sans TC", system-ui, sans-serif`;
  const sLines = d.subtitle ? wrapLines(ctx, d.subtitle, w * 0.8).slice(0, 2) : [];
  const total = tLines.length * titleSize * 1.2 + (sLines.length ? subSize * 0.6 : 0) + sLines.length * subSize * 1.4;
  let y = align === "top" ? top : align === "center" ? top + (height - total) / 2 : top + height - total;
  ctx.font = `700 ${titleSize}px "Noto Sans TC", system-ui, sans-serif`;
  for (const l of tLines) {
    ctx.fillText(l, w / 2, y);
    y += titleSize * 1.2;
  }
  y += sLines.length ? subSize * 0.6 : 0;
  ctx.font = `500 ${subSize}px "Noto Sans TC", system-ui, sans-serif`;
  for (const l of sLines) {
    ctx.fillText(l, w / 2, y);
    y += subSize * 1.4;
  }
  ctx.restore();
}

function render(canvas: HTMLCanvasElement, variant: Variant, format: Format, photos: Material[], d: Design) {
  const { w, h } = format;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const [c1, c2] = GRADIENTS[d.gradient] ?? GRADIENTS[0];
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const seen = new Set<number>();
  const order = d.order.filter((i) => i >= 0 && i < photos.length && !seen.has(i) && !!seen.add(i));
  photos.forEach((_, i) => {
    if (!seen.has(i)) order.push(i);
  });
  const ordered = order.map((i) => photos[i]);
  const light = d.textColor === "light";
  const textColor = light ? "#ffffff" : "#111111";
  const pad = Math.max(0, d.gap);

  if (variant === "card") {
    cover(ctx, ordered[0].img, 0, 0, w, h);
    ctx.fillStyle = light ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)";
    ctx.fillRect(0, 0, w, h);
    const extras = ordered.slice(1, 4);
    if (extras.length) {
      const size = w * 0.2;
      const total = extras.length * size + (extras.length - 1) * 12;
      const ey = d.titlePosition === "bottom" ? h * 0.05 : h - size - h * 0.05;
      extras.forEach((p, i) => {
        const ex = (w - total) / 2 + i * (size + 12);
        cover(ctx, p.img, ex, ey, size, size, 14);
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(ex, ey, size, size, 14);
        ctx.stroke();
      });
    }
    const margin = h * 0.08;
    drawTextBlock(ctx, d, w, margin, h - margin * 2, d.titlePosition, textColor, true);
  } else {
    const band = d.title || d.subtitle ? h * 0.2 : 0;
    const m = Math.max(pad, w * 0.025);
    const atTop = d.titlePosition === "top";
    const areaY = (atTop ? band : 0) + m;
    const areaH = h - band - m * 2;
    if (d.style === "polaroid") {
      const n = ordered.length;
      const cols = n <= 2 ? 1 : 2;
      const rows = Math.ceil(n / cols);
      const cw = (w - m * 2) / cols;
      const ch = areaH / rows;
      ordered.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const fw = Math.min(cw * 0.86, ch * 0.86 * 0.85);
        const fh = fw / 0.85;
        const cx = m + col * cw + cw / 2;
        const cy = areaY + row * ch + ch / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((((i * 37) % 11) - 5) * 0.012);
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
        ctx.shadowColor = "transparent";
        cover(ctx, p.img, -fw / 2 + fw * 0.05, -fh / 2 + fw * 0.05, fw * 0.9, fh - fw * 0.05 - fw * 0.2);
        ctx.restore();
      });
    } else {
      const rects = layoutRects(ordered.length, d.style, m, areaY, w - m * 2, areaH, pad);
      ordered.forEach((p, i) => {
        const r = rects[i];
        if (r) cover(ctx, p.img, r[0], r[1], r[2], r[3], pad > 0 ? 12 : 0);
      });
    }
    if (band) {
      const by = atTop ? m * 0.5 : h - band;
      drawTextBlock(ctx, d, w, by, band - m * 0.5, "center", textColor, false);
    }
  }

  const spots: [number, number][] = [
    [0.1, 0.08],
    [0.9, 0.5],
    [0.14, 0.93],
  ];
  d.emojis.slice(0, 3).forEach((e, i) => {
    ctx.font = `${Math.round(w * 0.1)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(e, w * spots[i][0], h * spots[i][1]);
  });
}

type Step = "materials" | "format" | "result";

export function AiCompose({ variant }: { variant: Variant }) {
  const { L, lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>("materials");
  const [photos, setPhotos] = useState<Material[]>([]);
  const [formatId, setFormatId] = useState<string>("3:4");
  const [brief, setBrief] = useState("");
  const [design, setDesign] = useState<Design | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seed = useRef(0);

  const max = variant === "card" ? 4 : 9;
  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = max - photos.length;
    const added: Material[] = [];
    for (const f of Array.from(files).filter((x) => x.type.startsWith("image/")).slice(0, room)) {
      const url = URL.createObjectURL(f);
      try {
        added.push({ id: uid(), url, img: await loadImage(url) });
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    setPhotos((prev) => [...prev, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    seed.current += 1;
    try {
      const res = await fetch("/api/ai-compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant,
          aspect: format.id,
          brief,
          lang,
          seed: seed.current > 1 ? seed.current : 0,
          images: photos.slice(0, 6).map((p) => thumbnail(p.img)),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setDesign((await res.json()) as Design);
      setStep("result");
    } catch {
      setError(L("AI 暫時無法完成設計，請稍後再試。", "The AI could not finish the design. Please try again."));
    } finally {
      setBusy(false);
    }
  }, [variant, format.id, brief, lang, photos, L]);

  useEffect(() => {
    if (step !== "result" || !design || !canvasRef.current || photos.length === 0) return;
    render(canvasRef.current, variant, format, photos, design);
  }, [step, design, variant, format, photos]);

  useEffect(
    () => () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-${variant}-${format.id.replace(":", "x")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const steps: [Step, string][] = [
    ["materials", L("選素材", "Materials")],
    ["format", L("選螢幕格式", "Screen format")],
    ["result", L("AI 成品", "AI result")],
  ];
  const stepIndex = steps.findIndex(([id]) => id === step);

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex items-center gap-2" aria-label={L("步驟", "Steps")}>
        {steps.map(([id, label], i) => (
          <li
            key={id}
            aria-current={i === stepIndex ? "step" : undefined}
            className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium ${
              i === stepIndex ? "bg-primary text-primary-foreground" : i < stepIndex ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i < stepIndex ? <Check className="size-4" aria-hidden="true" /> : <span>{i + 1}</span>}
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ol>

      {step === "materials" && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{L("第一步：選定素材", "Step 1: choose your materials")}</h2>
            <p className="text-sm text-muted-foreground text-pretty">
              {variant === "card"
                ? L("選 1 到 4 張相片，第一張會成為卡片主圖。其餘由 AI 設計。", "Pick 1 to 4 photos. The first becomes the main image. AI designs the rest.")
                : L("選 2 到 9 張相片，版型、順序與文字全由 AI 決定。", "Pick 2 to 9 photos. AI decides layout, order and text.")}
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} aria-label={L("加入相片", "Add photos")} />
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={L(`素材 ${i + 1}`, `Material ${i + 1}`)} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={L("移除", "Remove")}
                  className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
            {photos.length < max && (
              <li>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground hover:bg-secondary"
                >
                  <ImagePlus className="size-6" aria-hidden="true" />
                  {L("加入相片", "Add photos")}
                </button>
              </li>
            )}
          </ul>
          <p className="text-sm text-muted-foreground">
            {photos.length} / {max}
          </p>
          <Button size="lg" disabled={photos.length < (variant === "card" ? 1 : 2)} onClick={() => setStep("format")}>
            {L("下一步：選螢幕格式", "Next: screen format")}
          </Button>
        </section>
      )}

      {step === "format" && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{L("第二步：選定螢幕格式", "Step 2: choose the screen format")}</h2>
            <p className="text-sm text-muted-foreground text-pretty">{L("選好之後，其餘全部交給 AI。", "After this, AI handles everything else.")}</p>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => {
              const active = f.id === formatId;
              const box = 44;
              const scale = box / Math.max(f.w, f.h);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFormatId(f.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors ${
                      active ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center">
                      <span
                        className={`rounded-sm border-2 ${active ? "border-primary bg-primary/20" : "border-muted-foreground/60"}`}
                        style={{ width: f.w * scale, height: f.h * scale }}
                      />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base font-semibold">{f.id}</span>
                      <span className="text-sm text-muted-foreground">{L(f.zh, f.en)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {L("想說的一句話（可不填）", "A wish for the AI (optional)")}
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder={L("例如：生日快樂、旅行回憶", "e.g. birthday party, travel memories")}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setStep("materials")} disabled={busy}>
              {L("上一步", "Back")}
            </Button>
            <Button size="lg" className="flex-1" onClick={generate} disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}
              {busy ? L("AI 設計中…", "AI is designing…") : L("交給 AI 設計", "Let AI design it")}
            </Button>
          </div>
        </section>
      )}

      {step === "result" && design && (
        <section className="flex flex-col gap-4">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={L("AI 設計成品預覽", "AI design preview")}
            className="mx-auto h-auto max-h-[70dvh] w-auto max-w-full rounded-xl border border-border bg-muted"
          />
          {design.note && <p className="text-center text-sm text-muted-foreground text-pretty">{design.note}</p>}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={generate} disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-5" aria-hidden="true" />}
              {L("AI 重新設計", "Redesign")}
            </Button>
            <Button size="lg" onClick={download} disabled={busy}>
              <Download className="size-5" aria-hidden="true" />
              {L("下載 PNG", "Download PNG")}
            </Button>
            <Button variant="ghost" size="lg" className="col-span-2" onClick={() => setStep("format")} disabled={busy}>
              {L("換螢幕格式", "Change screen format")}
            </Button>
            <Button variant="ghost" size="lg" className="col-span-2" onClick={() => { setPhotos([]); setDesign(null); setStep("materials"); }} disabled={busy}>
              <Trash2 className="size-5" aria-hidden="true" />
              {L("重新選素材", "Start over")}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">{L("成果不保存，請下載輸出。", "Results are not saved. Please download.")}</p>
        </section>
      )}
    </div>
  );
}
