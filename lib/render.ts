import type { EditKind, EditPlan, MediaItem, Stroke } from "@/lib/edit-types";

export interface Segment {
  mediaIndex: number;
  start: number;
  dur: number;
}

export interface Timeline {
  order: MediaItem[];
  segs: Segment[];
  total: number;
}

const ITEM_SECONDS = { slow: 3, medium: 2, fast: 1.2 } as const;
const CLIP_SECONDS = { slow: 6, medium: 4, fast: 2 } as const;

function orderMedia(media: MediaItem[], order: number[]): MediaItem[] {
  const seen = new Set<number>();
  const result: MediaItem[] = [];
  for (const idx of order) {
    if (Number.isInteger(idx) && idx >= 0 && idx < media.length && !seen.has(idx)) {
      seen.add(idx);
      result.push(media[idx]);
    }
  }
  media.forEach((m, i) => {
    if (!seen.has(i)) result.push(m);
  });
  return result;
}

export function buildTimeline(kind: EditKind, plan: EditPlan, media: MediaItem[]): Timeline {
  const order = orderMedia(media, plan.order);
  const segs: Segment[] = [];

  if (kind === "poster") {
    if (order.length) segs.push({ mediaIndex: 0, start: 0, dur: 3 });
  } else if (kind === "single") {
    if (order.length) segs.push({ mediaIndex: 0, start: 0, dur: 6 });
  } else if (kind === "video") {
    const clip = CLIP_SECONDS[plan.tempo];
    order.forEach((m, i) => {
      const d = m.duration || clip;
      const count = Math.max(1, Math.min(40, Math.floor(d / 30)));
      for (let k = 0; k < count; k++) {
        const room = Math.max(0, d - clip);
        const start = count === 1 ? 0 : (room * k) / (count - 1);
        segs.push({ mediaIndex: i, start, dur: Math.min(clip, d) });
      }
    });
  } else {
    const per = ITEM_SECONDS[plan.tempo];
    order.forEach((_, i) => segs.push({ mediaIndex: i, start: 0, dur: per }));
  }

  const total = segs.reduce((sum, s) => sum + s.dur, 0);
  return { order, segs, total };
}

export function locate(tl: Timeline, t: number): { index: number; p: number } {
  if (!tl.segs.length) return { index: 0, p: 0 };
  let acc = 0;
  for (let i = 0; i < tl.segs.length; i++) {
    const s = tl.segs[i];
    if (t < acc + s.dur || i === tl.segs.length - 1) {
      return { index: i, p: Math.min(1, Math.max(0, (t - acc) / s.dur)) };
    }
    acc += s.dur;
  }
  return { index: 0, p: 0 };
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => x * x * (3 - 2 * x);

function dims(el: HTMLImageElement | HTMLVideoElement) {
  return el instanceof HTMLVideoElement
    ? { w: el.videoWidth, h: el.videoHeight }
    : { w: el.naturalWidth, h: el.naturalHeight };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  el: HTMLImageElement | HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1,
  px = 0,
  py = 0,
) {
  const d = dims(el);
  if (!d.w || !d.h) return;
  const scale = Math.max(w / d.w, h / d.h) * zoom;
  const dw = d.w * scale;
  const dh = d.h * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(el, x + (w - dw) / 2 + px * (dw - w) * 0.5, y + (h - dh) / 2 + py * (dh - h) * 0.5, dw, dh);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface FrameInput {
  kind: EditKind;
  plan: EditPlan;
  tl: Timeline;
  t: number;
  strokes: Stroke[];
  emptyText: string;
  route: "ai" | "manual";
  guides: boolean;
}

let backdropCanvas: HTMLCanvasElement | null = null;

function drawBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, el: HTMLImageElement | HTMLVideoElement) {
  if (typeof document === "undefined") return;
  backdropCanvas ??= Object.assign(document.createElement("canvas"), { width: 36, height: 48 });
  const small = backdropCanvas.getContext("2d");
  if (!small) return;
  drawCover(small, el, 0, 0, 36, 48, 1.2);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = 0.6;
  ctx.drawImage(backdropCanvas, 0, 0, W, H);
  ctx.restore();
  ctx.fillStyle = "rgba(8,14,22,0.35)";
  ctx.fillRect(0, 0, W, H);
}

function drawLighting(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  const x = ((t * 0.12) % 1.6 - 0.3) * W;
  const sweep = ctx.createLinearGradient(x - W * 0.2, 0, x + W * 0.2, H * 0.4);
  sweep.addColorStop(0, "rgba(255,255,255,0)");
  sweep.addColorStop(0.5, "rgba(255,255,255,0.09)");
  sweep.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, W, H);
}

function drawGuides(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    ctx.moveTo((W * i) / 3, 0);
    ctx.lineTo((W * i) / 3, H);
    ctx.moveTo(0, (H * i) / 3);
    ctx.lineTo(W, (H * i) / 3);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFloatCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cur: MediaItem,
  next: MediaItem | undefined,
  q: number,
  p: number,
  t: number,
) {
  const a = Math.sin(t * 0.9);
  const b = Math.cos(t * 0.7);
  const w = W * 0.78;
  const h = H * 0.66;
  const s = Math.max(0.02, Math.abs(Math.cos(q * Math.PI)));
  const item = q >= 0.5 && next ? next : cur;

  ctx.save();
  ctx.translate(W / 2, H * 0.9);
  ctx.scale(1, 0.16);
  const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
  floor.addColorStop(0, "rgba(0,0,0,0.5)");
  floor.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(W / 2, H * 0.47 + b * H * 0.008);
  ctx.transform(s, a * 0.05 * s, 0, 1, 0, 0);
  const depth = W * 0.022 * (1 + a * 0.5);
  roundRect(ctx, -w / 2 + depth, -h / 2 + depth * 0.6, w, h, W * 0.035);
  ctx.fillStyle = "#0c1520";
  ctx.fill();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, -w / 2, -h / 2, w, h, W * 0.035);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.clip();
  drawCover(ctx, item.el, -w / 2, -h / 2, w, h, 1.06 + 0.06 * p, a * 0.25, b * 0.1);
  const gloss = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  gloss.addColorStop(0, `rgba(255,255,255,${0.16 + 0.1 * a})`);
  gloss.addColorStop(0.45, "rgba(255,255,255,0)");
  gloss.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = gloss;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function itemAt(tl: Timeline, segIndex: number): MediaItem | undefined {
  const seg = tl.segs[((segIndex % tl.segs.length) + tl.segs.length) % tl.segs.length];
  return seg ? tl.order[seg.mediaIndex] : undefined;
}

export function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, f: FrameInput) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#101c2a");
  bg.addColorStop(1, "#1b2b3f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const { tl, plan } = f;
  if (!tl.segs.length) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `600 ${W * 0.045}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(f.emptyText, W / 2, H / 2);
    drawStrokes(ctx, W, H, f.strokes);
    return;
  }

  const { index, p } = locate(tl, f.t);
  const cur = itemAt(tl, index);
  const next = tl.segs.length > 1 ? itemAt(tl, index + 1) : undefined;
  const q = tl.segs.length > 1 ? ease(clamp((p - 0.7) / 0.3)) : 0;

  if (plan.mood === "mono") ctx.filter = "grayscale(1)";

  const ai = f.route === "ai";
  const floating = ai && f.kind !== "video" && plan.style === "kenburns";
  if (ai && cur && (floating || ["flip", "carousel", "stack"].includes(plan.style))) {
    drawBackdrop(ctx, W, H, cur.el);
  }

  if (cur && !ai) {
    drawCover(ctx, cur.el, 0, 0, W, H, 1);
  } else if (cur && floating) {
    drawFloatCard(ctx, W, H, cur, next, q, p, f.t);
  } else if (cur) {
    switch (plan.style) {
      case "flip":
        drawFlip(ctx, W, H, cur, next, q);
        break;
      case "cube":
        drawCube(ctx, W, H, cur, next, q);
        break;
      case "carousel":
        drawCarousel(ctx, W, H, tl, index, q);
        break;
      case "parallax":
        drawParallax(ctx, W, H, cur, f.t);
        break;
      case "stack":
        drawStack(ctx, W, H, tl, index, p);
        break;
      case "poster":
        drawCover(ctx, cur.el, 0, 0, W, H, 1 + 0.05 * p, Math.sin(f.t) * 0.2, 0);
        break;
      default:
        drawCover(ctx, cur.el, 0, 0, W, H, 1 + 0.14 * p, (p - 0.5) * 0.5, (0.5 - p) * 0.2);
        if (next && q > 0) {
          ctx.globalAlpha = q;
          drawCover(ctx, next.el, 0, 0, W, H, 1);
          ctx.globalAlpha = 1;
        }
    }
  }
  ctx.filter = "none";
  if (ai) drawLighting(ctx, W, H, f.t);

  const tint =
    plan.mood === "warm"
      ? "rgba(255,150,60,0.12)"
      : plan.mood === "cool"
        ? "rgba(60,140,255,0.15)"
        : plan.mood === "vivid"
          ? "rgba(255,60,160,0.09)"
          : "";
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);
  }

  drawText(ctx, W, H, plan, f.kind === "poster");
  if (f.guides) drawGuides(ctx, W, H);
  drawStrokes(ctx, W, H, f.strokes);
}

function drawFlip(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cur: MediaItem,
  next: MediaItem | undefined,
  q: number,
) {
  const showNext = q >= 0.5 && next;
  const item = showNext ? next : cur;
  const s = Math.max(0.02, Math.abs(Math.cos(q * Math.PI)));
  const w = W * 0.86 * s;
  const h = H * 0.7;
  const x = (W - w) / 2;
  const y = (H - h) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  drawCover(ctx, item.el, x, y, w, h, 1.04);
  ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - s)})`;
  ctx.fillRect(x, y, w, h);
}

function drawCube(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  cur: MediaItem,
  next: MediaItem | undefined,
  q: number,
) {
  const hinge = W * (1 - q);
  const squeezeOut = 1 - 0.1 * q;
  const squeezeIn = 0.9 + 0.1 * q;
  const hOut = H * squeezeOut;
  drawCover(ctx, cur.el, 0, (H - hOut) / 2, Math.max(1, hinge), hOut);
  ctx.fillStyle = `rgba(0,0,0,${0.45 * q})`;
  ctx.fillRect(0, (H - hOut) / 2, hinge, hOut);
  if (next && q > 0) {
    const hIn = H * squeezeIn;
    drawCover(ctx, next.el, hinge, (H - hIn) / 2, Math.max(1, W - hinge), hIn);
    ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - q)})`;
    ctx.fillRect(hinge, (H - hIn) / 2, W - hinge, hIn);
  }
}

function drawCarousel(ctx: CanvasRenderingContext2D, W: number, H: number, tl: Timeline, index: number, q: number) {
  const offsets = [-2, 2, -1, 1, 0];
  for (const k of offsets) {
    const pos = k - q;
    const item = itemAt(tl, index + k);
    if (!item) continue;
    const scale = Math.max(0.35, 1 - 0.24 * Math.abs(pos));
    const w = W * 0.6 * scale;
    const h = H * 0.58 * scale;
    const cx = W / 2 + pos * W * 0.52;
    const cy = H / 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0.25, 1 - 0.3 * Math.abs(pos));
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 30;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, W * 0.03);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.clip();
    drawCover(ctx, item.el, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }
}

function drawParallax(ctx: CanvasRenderingContext2D, W: number, H: number, cur: MediaItem, t: number) {
  const a = Math.sin(t * 1.2);
  drawCover(ctx, cur.el, 0, 0, W, H, 1.35, -a * 0.3, 0);
  ctx.fillStyle = "rgba(10,18,28,0.55)";
  ctx.fillRect(0, 0, W, H);

  const w = W * 0.74;
  const h = H * 0.6;
  const bob = Math.sin(t * 1.6) * H * 0.012;
  ctx.save();
  ctx.translate(W / 2, H / 2 + bob);
  ctx.transform(Math.cos(a * 0.35), 0, a * 0.18, 1 - Math.abs(a) * 0.03, 0, 0);
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowOffsetY = 24;
  ctx.shadowBlur = 40;
  roundRect(ctx, -w / 2, -h / 2, w, h, W * 0.03);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.clip();
  drawCover(ctx, cur.el, -w / 2, -h / 2, w, h, 1.08, a * 0.4, 0);
  const gloss = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  gloss.addColorStop(0, `rgba(255,255,255,${0.12 + 0.1 * a})`);
  gloss.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawStack(ctx: CanvasRenderingContext2D, W: number, H: number, tl: Timeline, index: number, p: number) {
  const first = Math.max(0, index - 3);
  for (let i = first; i <= index; i++) {
    const item = itemAt(tl, i);
    if (!item) continue;
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const rand = seed - Math.floor(seed);
    const rot = (rand - 0.5) * 0.28;
    const drop = i === index ? 1 - ease(clamp(p / 0.3)) : 0;
    const w = W * 0.7;
    const h = H * 0.56;
    const pad = W * 0.03;
    ctx.save();
    ctx.translate(W / 2 + (rand - 0.5) * W * 0.08, H / 2 - drop * H * 0.5);
    ctx.rotate(rot + drop * 0.25);
    const s = 1 + drop * 0.3;
    ctx.scale(s, s);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 3);
    ctx.shadowColor = "transparent";
    drawCover(ctx, item.el, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const tok of tokens) {
    const test = line + tok;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = tok.trimStart();
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 4);
}

function drawText(ctx: CanvasRenderingContext2D, W: number, H: number, plan: EditPlan, big: boolean) {
  if (!plan.title && !plan.subtitle) return;
  const grad = ctx.createLinearGradient(0, H * (big ? 0.45 : 0.68), 0, H);
  grad.addColorStop(0, "rgba(8,14,22,0)");
  grad.addColorStop(1, "rgba(8,14,22,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * (big ? 0.45 : 0.68), W, H * (big ? 0.55 : 0.32));

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  const titleSize = W * (big ? 0.085 : 0.06);
  ctx.font = `800 ${titleSize}px system-ui, sans-serif`;
  const lines = wrap(ctx, plan.title, W * 0.84);
  let y = H - W * 0.1 - (plan.subtitle ? W * 0.07 : 0) - (lines.length - 1) * titleSize * 1.15;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += titleSize * 1.15;
  }
  if (plan.subtitle) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = `500 ${W * 0.036}px system-ui, sans-serif`;
    const sub = wrap(ctx, plan.subtitle, W * 0.84)[0] ?? "";
    ctx.fillText(sub, W / 2, y - titleSize * 0.2 + W * 0.02);
  }
}

export function drawStrokes(ctx: CanvasRenderingContext2D, W: number, H: number, strokes: Stroke[]) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.points.length === 0) continue;
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width * W;
    if (s.points.length === 1) {
      ctx.beginPath();
      ctx.arc(s.points[0][0] * W, s.points[0][1] * H, (s.width * W) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(s.points[0][0] * W, s.points[0][1] * H);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0] * W, s.points[i][1] * H);
    ctx.stroke();
  }
  ctx.restore();
}
