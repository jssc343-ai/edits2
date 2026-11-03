import { MOTION_PERIOD, type MotionTemplate, type ParticleKind } from "@/lib/templates";
import { drawStickers, type StickerItem } from "@/lib/stickers";
import { drawArt, type ArtState } from "@/lib/art";

export type TransitionId = "none" | "fade" | "slide" | "slideUp" | "zoom" | "wipe" | "flip" | "blur" | "spin" | "iris";

export const FONTS: { family: string; weight: number; zh: string; en: string }[] = [
  { family: "Noto Sans TC", weight: 700, zh: "黑體", en: "Sans" },
  { family: "Noto Serif TC", weight: 700, zh: "明體", en: "Serif" },
  { family: "ZCOOL KuaiLe", weight: 400, zh: "快樂體", en: "Playful" },
  { family: "ZCOOL XiaoWei", weight: 400, zh: "小薇體", en: "Elegant" },
  { family: "Ma Shan Zheng", weight: 400, zh: "馬善政楷書", en: "Brush" },
  { family: "Long Cang", weight: 400, zh: "龍藏手寫", en: "Handwriting" },
  { family: "Zhi Mang Xing", weight: 400, zh: "志莽行書", en: "Running" },
  { family: "Liu Jian Mao Cao", weight: 400, zh: "流江毛草", en: "Cursive" },
  { family: "Pacifico", weight: 400, zh: "Pacifico", en: "Pacifico" },
  { family: "Dancing Script", weight: 700, zh: "Dancing", en: "Dancing" },
  { family: "Lobster", weight: 400, zh: "Lobster", en: "Lobster" },
  { family: "Playfair Display", weight: 700, zh: "Playfair", en: "Playfair" },
  { family: "Bebas Neue", weight: 400, zh: "Bebas", en: "Bebas" },
  { family: "Permanent Marker", weight: 400, zh: "Marker", en: "Marker" },
  { family: "ZCOOL QingKe HuangYou", weight: 400, zh: "黃油體", en: "Chunky" },
  { family: "Kaisei Tokumin", weight: 400, zh: "典雅明朝", en: "Classic mincho" },
  { family: "Yusei Magic", weight: 400, zh: "魔法麥克筆", en: "Magic marker" },
  { family: "Dela Gothic One", weight: 400, zh: "粗黑體", en: "Heavy gothic" },
  { family: "Hachi Maru Pop", weight: 400, zh: "圓點流行", en: "Round pop" },
  { family: "Reggae One", weight: 400, zh: "雷鬼體", en: "Reggae" },
  { family: "Mochiy Pop One", weight: 400, zh: "麻糬體", en: "Mochi pop" },
  { family: "DotGothic16", weight: 400, zh: "點陣體", en: "Dot matrix" },
  { family: "Cherry Bomb One", weight: 400, zh: "櫻桃彈", en: "Cherry bomb" },
  { family: "Caveat", weight: 400, zh: "Caveat 手寫", en: "Caveat" },
  { family: "Satisfy", weight: 400, zh: "Satisfy 草寫", en: "Satisfy" },
  { family: "Great Vibes", weight: 400, zh: "優雅花體", en: "Great Vibes" },
  { family: "Sacramento", weight: 400, zh: "細線花體", en: "Sacramento" },
  { family: "Abril Fatface", weight: 400, zh: "粗襯線", en: "Abril Fatface" },
  { family: "Bangers", weight: 400, zh: "漫畫體", en: "Bangers" },
  { family: "Fredoka", weight: 400, zh: "圓潤體", en: "Fredoka" },
  { family: "Righteous", weight: 400, zh: "復古幾何", en: "Righteous" },
  { family: "Orbitron", weight: 400, zh: "科幻體", en: "Orbitron" },
  { family: "Press Start 2P", weight: 400, zh: "像素遊戲", en: "Pixel game" },
  { family: "Cinzel", weight: 400, zh: "羅馬碑文", en: "Cinzel" },
  { family: "Special Elite", weight: 400, zh: "打字機", en: "Typewriter" },
  { family: "Shadows Into Light", weight: 400, zh: "輕盈手寫", en: "Light hand" },
  { family: "Indie Flower", weight: 400, zh: "獨立小花", en: "Indie flower" },
  { family: "Amatic SC", weight: 400, zh: "細長手繪", en: "Amatic" },
  { family: "Monoton", weight: 400, zh: "霓虹線條", en: "Monoton" },
  { family: "Rubik Mono One", weight: 400, zh: "方塊粗體", en: "Rubik mono" },
  { family: "Oswald", weight: 400, zh: "窄體標題", en: "Oswald" },
  { family: "Anton", weight: 400, zh: "海報粗窄", en: "Anton" },
  { family: "Archivo Black", weight: 400, zh: "重磅黑", en: "Archivo black" },
  { family: "Comfortaa", weight: 400, zh: "柔圓體", en: "Comfortaa" },
  { family: "Courgette", weight: 400, zh: "可愛草寫", en: "Courgette" },
  { family: "Kaushan Script", weight: 400, zh: "筆刷草寫", en: "Kaushan" },
  { family: "Gloria Hallelujah", weight: 400, zh: "童趣手寫", en: "Gloria" },
  { family: "Creepster", weight: 400, zh: "驚悚體", en: "Creepster" },
  { family: "Fascinate", weight: 400, zh: "裝飾藝術", en: "Fascinate" },
];

export const fontSpec = (family: string) => FONTS.find((f) => f.family === family) ?? FONTS[0];
export type FilterId = "none" | "warm" | "cool" | "mono" | "vivid" | "vintage";
export type Aspect = "9:16" | "1:1" | "16:9" | "3:4" | "4:3" | "4:5";

export const TRANSITIONS: { id: TransitionId; zh: string; en: string }[] = [
  { id: "none", zh: "無", en: "None" },
  { id: "fade", zh: "淡入淡出", en: "Fade" },
  { id: "slide", zh: "側滑", en: "Slide" },
  { id: "slideUp", zh: "上推", en: "Push up" },
  { id: "zoom", zh: "縮放", en: "Zoom" },
  { id: "wipe", zh: "擦除", en: "Wipe" },
  { id: "flip", zh: "翻頁", en: "Flip" },
  { id: "blur", zh: "模糊", en: "Blur" },
  { id: "spin", zh: "旋轉", en: "Spin" },
  { id: "iris", zh: "圓形展開", en: "Iris" },
];

export const FILTERS: { id: FilterId; css: string; zh: string; en: string }[] = [
  { id: "none", css: "", zh: "原色", en: "Original" },
  { id: "warm", css: "sepia(0.25) saturate(1.3) hue-rotate(-10deg)", zh: "暖陽", en: "Warm" },
  { id: "cool", css: "saturate(1.1) hue-rotate(15deg) brightness(1.03)", zh: "冷調", en: "Cool" },
  { id: "mono", css: "grayscale(1) contrast(1.1)", zh: "黑白", en: "Mono" },
  { id: "vivid", css: "saturate(1.7) contrast(1.08)", zh: "鮮豔", en: "Vivid" },
  { id: "vintage", css: "sepia(0.55) contrast(0.95) brightness(1.05)", zh: "懷舊", en: "Vintage" },
];

export const TRANSITION_SECONDS = 0.8;
export const MAX_TIMELINE = 600;
export const MAX_PHOTOS = 50;
export const EDGE_FADE = 0.6;

export interface Stroke {
  color: string;
  size: number;
  points: [number, number][];
}

export interface Crop {
  zoom: number;
  ox: number;
  oy: number;
}

export interface Makeup {
  bright: number;
  contrast: number;
  sat: number;
  warm: number;
  smooth: number;
  blush: number;
  lip: number;
}

export interface Anchors {
  fx: number;
  fy: number;
  fs: number;
  mx: number;
  my: number;
}

export interface Life {
  mouth: number;
  legs: number;
  arms: number;
  cloth: number;
  speed: number;
  legY: number;
  clothY: number;
}

export const DEFAULT_ANCHORS: Anchors = { fx: 0.5, fy: 0.35, fs: 0.2, mx: 0.5, my: 0.45 };
export const DEFAULT_MAKEUP: Makeup = { bright: 1, contrast: 1, sat: 1, warm: 0, smooth: 0, blush: 0, lip: 0 };
export const DEFAULT_LIFE: Life = { mouth: 0, legs: 0, arms: 0, cloth: 0, speed: 1, legY: 0.62, clothY: 0.5 };

export function makeupCss(m?: Makeup) {
  if (!m) return "";
  return `brightness(${m.bright}) contrast(${m.contrast}) saturate(${m.sat}) hue-rotate(${(-m.warm * 20).toFixed(0)}deg)`;
}

export interface Clip {
  id: string;
  assetId: string;
  type: "photo" | "video";
  thumb: string;
  duration: number;
  srcDuration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
  transition: TransitionId;
  filter: FilterId;
  fadeLen?: number;
  crop?: Crop;
  makeup?: Makeup;
  anchors?: Anchors;
  life?: Life;
}

export interface TextItem {
  id: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  size: number;
  color: string;
  font: string;
  role?: TextRole;
  style?: TextStyle;
  edge?: string;
  z?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  alpha?: number;
}

export type TextStyle = "flat" | "extrude" | "outline" | "plate";

export type TextRole = "body" | "opening" | "closing";

export interface Project {
  clips: Clip[];
  texts: TextItem[];
  aspect: Aspect;
  mode: "hand" | "ai";
  template: MotionTemplate | null;
  fadeInOut: boolean;
  stickers: StickerItem[];
  art?: ArtState;
}

export interface Asset {
  el: HTMLImageElement | HTMLVideoElement;
  url: string;
  depth: Float32Array | null;
  order: Uint16Array | null;
  depthKey: string;
}

export const GX = 12;
export const GY = 16;

export function aspectSize(a: Aspect): { w: number; h: number } {
  if (a === "1:1") return { w: 720, h: 720 };
  if (a === "16:9") return { w: 720, h: 404 };
  if (a === "3:4") return { w: 540, h: 720 };
  if (a === "4:3") return { w: 720, h: 540 };
  if (a === "4:5") return { w: 576, h: 720 };
  return { w: 404, h: 720 };
}

export function clipLen(c: Clip): number {
  return c.type === "video" ? Math.max(0.1, (c.trimEnd - c.trimStart) / c.speed) : c.duration;
}

export function buildTimeline(clips: Clip[]) {
  const starts: number[] = [];
  const overlaps: number[] = [];
  let end = 0;
  clips.forEach((c, i) => {
    const prev = clips[i - 1];
    const ov = i > 0 && c.transition !== "none" ? Math.min(c.fadeLen ?? TRANSITION_SECONDS, clipLen(c) / 2, clipLen(prev) / 2) : 0;
    const s = i === 0 ? 0 : Math.max(0, end - ov);
    starts.push(s);
    overlaps.push(ov);
    end = s + clipLen(c);
  });
  return { starts, overlaps, total: end };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (p: number) => p * p * (3 - 2 * p);

function cover(sw: number, sh: number, dw: number, dh: number) {
  const r = Math.max(dw / sw, dh / sh);
  const cw = dw / r;
  const ch = dh / r;
  return { sx: (sw - cw) / 2, sy: (sh - ch) / 2, sw: cw, sh: ch };
}

export function elementSize(el: HTMLImageElement | HTMLVideoElement) {
  return el instanceof HTMLVideoElement
    ? { w: el.videoWidth, h: el.videoHeight }
    : { w: el.naturalWidth, h: el.naturalHeight };
}

let depthCanvas: HTMLCanvasElement | null = null;

function ensureDepth(asset: Asset, rect: ReturnType<typeof cover>, key: string) {
  if (asset.depth && asset.depthKey === key) return;
  if (!depthCanvas) depthCanvas = document.createElement("canvas");
  const c = depthCanvas;
  c.width = GX * 2;
  c.height = GY * 2;
  const x = c.getContext("2d", { willReadFrequently: true });
  const n = GX * GY;
  const depth = new Float32Array(n);
  let data: Uint8ClampedArray | null = null;
  if (x) {
    x.drawImage(asset.el, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, c.width, c.height);
    try {
      data = x.getImageData(0, 0, c.width, c.height).data;
    } catch {
      data = null;
    }
  }
  const lum = new Float32Array(n);
  let min = 1;
  let max = 0;
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      let sum = 0;
      if (data) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const p = ((gy * 2 + dy) * c.width + gx * 2 + dx) * 4;
            sum += (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
          }
        }
        sum /= 4;
      } else sum = 0.5;
      lum[gy * GX + gx] = sum;
      min = Math.min(min, sum);
      max = Math.max(max, sum);
    }
  }
  const span = Math.max(0.05, max - min);
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      const i = gy * GX + gx;
      const nx = (gx - (GX - 1) / 2) / (GX / 2);
      const ny = (gy - (GY - 1) / 2) / (GY / 2);
      const center = 1 - Math.min(1, Math.hypot(nx, ny) / 1.2);
      depth[i] = 0.45 * ((lum[i] - min) / span) + 0.35 * center + 0.2 * (gy / (GY - 1));
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const copy = depth.slice();
    for (let gy = 0; gy < GY; gy++) {
      for (let gx = 0; gx < GX; gx++) {
        let s = 0;
        let cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const yy = gy + dy;
            const xx = gx + dx;
            if (xx >= 0 && xx < GX && yy >= 0 && yy < GY) {
              s += copy[yy * GX + xx];
              cnt++;
            }
          }
        }
        depth[gy * GX + gx] = s / cnt;
      }
    }
  }
  const order = Uint16Array.from({ length: n }, (_, i) => i).sort((a, b) => depth[a] - depth[b]);
  asset.depth = depth;
  asset.order = order;
  asset.depthKey = key;
}

function drawMesh(
  ctx: CanvasRenderingContext2D,
  asset: Asset,
  rect: ReturnType<typeof cover>,
  W: number,
  H: number,
  tpl: MotionTemplate,
  t: number,
) {
  const cam = tpl.camera(t);
  const depth = asset.depth!;
  const order = asset.order!;
  const cw = W / GX;
  const ch = H / GY;
  const sw = rect.sw / GX;
  const sh = rect.sh / GY;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(cam.rot);
  ctx.translate(-W / 2, -H / 2);
  for (let k = 0; k < order.length; k++) {
    const idx = order[k];
    const gx = idx % GX;
    const gy = (idx / GX) | 0;
    const d = depth[idx];
    const shiftX = cam.cx * (d - 0.45) * W * 0.07 * tpl.depth;
    const shiftY = cam.cy * (d - 0.45) * H * 0.05 * tpl.depth;
    const s = 1.12 * (1 + cam.zoom * (0.04 + d * 0.14));
    const x0 = (gx * cw - W / 2) * s + W / 2 + shiftX;
    const y0 = (gy * ch - H / 2) * s + H / 2 + shiftY;
    ctx.drawImage(asset.el, rect.sx + gx * sw, rect.sy + gy * sh, sw, sh, x0 - 0.8, y0 - 0.8, cw * s + 1.6, ch * s + 1.6);
  }
  ctx.restore();
}

const rnd = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function drawParticles(ctx: CanvasRenderingContext2D, kind: ParticleKind, W: number, H: number, t: number) {
  if (!kind) return;
  const count = kind === "sparkle" ? 22 : 46;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const r1 = rnd(i, 1);
    const r2 = rnd(i, 2);
    const r3 = rnd(i, 3);
    if (kind === "sparkle") {
      const a = Math.pow(Math.max(0, Math.sin(t * 2 + i * 3)), 4);
      if (a < 0.02) continue;
      const x = r1 * W;
      const y = r2 * H;
      const s = (4 + r3 * 10) * (W / 405);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#fffbe6";
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.quadraticCurveTo(x, y, x + s, y);
      ctx.quadraticCurveTo(x, y, x, y + s);
      ctx.quadraticCurveTo(x, y, x - s, y);
      ctx.quadraticCurveTo(x, y, x, y - s);
      ctx.fill();
      continue;
    }
    const speed = 0.02 + r3 * 0.05;
    let x: number;
    let y: number;
    if (kind === "snow") {
      y = (((r2 + t * (speed + 0.03)) % 1) + 1) % 1;
      x = (r1 + Math.sin(t * 0.8 + i) * 0.03 + 1) % 1;
    } else {
      y = (((r2 - t * speed) % 1) + 1) % 1;
      x = (r1 + Math.sin(t * 0.4 + i) * 0.04 + 1) % 1;
    }
    const radius = (1 + r3 * 3.2) * (W / 405);
    ctx.globalAlpha = (kind === "snow" ? 0.85 : 0.2 + 0.5 * Math.pow(Math.sin(t * 1.4 + i), 2)) * (0.5 + r3 * 0.5);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x * W, y * H, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSweep(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const prog = (t / MOTION_PERIOD) % 1;
  const x = prog * W * 2.4 - W * 0.7;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.35);
  ctx.translate(-W / 2, -H / 2);
  const g = ctx.createLinearGradient(x - W * 0.25, 0, x + W * 0.25, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,244,220,0.3)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-W, -H, W * 3, H * 3);
  ctx.restore();
}

function drawGlitch(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const pulse = Math.pow(Math.max(0, Math.sin((t / MOTION_PERIOD) * Math.PI * 2 * 3)), 3);
  if (pulse < 0.08) return;
  ctx.save();
  const snap = Math.floor(t * 12);
  for (let i = 0; i < 4; i++) {
    const y = rnd(snap, i) * H;
    const h = 6 + rnd(snap, i + 9) * H * 0.08;
    const off = (rnd(snap, i + 5) - 0.5) * W * 0.12 * pulse;
    ctx.drawImage(ctx.canvas, 0, y, W, h, off, y, W, h);
  }
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(0,255,255,${0.1 * pulse})`;
  ctx.fillRect(3, 0, W, H);
  ctx.fillStyle = `rgba(255,0,120,${0.08 * pulse})`;
  ctx.fillRect(-3, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function coverCrop(sw: number, sh: number, dw: number, dh: number, crop?: Crop) {
  const base = cover(sw, sh, dw, dh);
  const z = Math.max(1, crop?.zoom ?? 1);
  const cw = base.sw / z;
  const ch = base.sh / z;
  const mx = (base.sw - cw) / 2;
  const my = (base.sh - ch) / 2;
  return { sx: base.sx + mx + (crop?.ox ?? 0) * mx, sy: base.sy + my + (crop?.oy ?? 0) * my, sw: cw, sh: ch };
}

let snapCanvas: HTMLCanvasElement | null = null;

function snapshot(ctx: CanvasRenderingContext2D, W: number, H: number) {
  if (!snapCanvas) snapCanvas = document.createElement("canvas");
  if (snapCanvas.width !== W) snapCanvas.width = W;
  if (snapCanvas.height !== H) snapCanvas.height = H;
  const s = snapCanvas.getContext("2d");
  if (s) {
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.clearRect(0, 0, W, H);
    s.drawImage(ctx.canvas, 0, 0);
  }
  return snapCanvas;
}

function applyMakeup(ctx: CanvasRenderingContext2D, W: number, H: number, clip: Clip) {
  const m = clip.makeup;
  if (!m || (!m.smooth && !m.blush && !m.lip)) return;
  const a = clip.anchors ?? DEFAULT_ANCHORS;
  const fr = a.fs * W;
  if (m.smooth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(a.fx * W, a.fy * H, fr * 0.85, fr * 1.1, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = Math.min(1, m.smooth * 0.7);
    ctx.filter = `blur(${((1 + m.smooth * 3) * W) / 405}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }
  if (m.blush > 0) {
    for (const s of [-1, 1]) {
      const cx = a.fx * W + s * fr * 0.5;
      const cy = a.fy * H + fr * 0.3;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, fr * 0.4);
      g.addColorStop(0, `rgba(255,90,110,${0.5 * m.blush})`);
      g.addColorStop(1, "rgba(255,90,110,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - fr, cy - fr, fr * 2, fr * 2);
    }
  }
  if (m.lip > 0) {
    ctx.save();
    ctx.filter = `blur(${W / 300}px)`;
    ctx.fillStyle = `rgba(200,35,70,${0.6 * m.lip})`;
    ctx.beginPath();
    ctx.ellipse(a.mx * W, a.my * H, fr * 0.32, fr * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function applyLife(ctx: CanvasRenderingContext2D, W: number, H: number, clip: Clip, t: number) {
  const l = clip.life;
  if (!l || !(l.mouth || l.legs || l.arms || l.cloth)) return;
  const a = clip.anchors ?? DEFAULT_ANCHORS;
  const sp = l.speed;
  const STEP = 3;
  if (l.cloth > 0) {
    const src = snapshot(ctx, W, H);
    const y0 = l.clothY * H;
    for (let y = y0; y < H; y += STEP) {
      const ramp = (y - y0) / Math.max(1, H - y0);
      const dx = Math.sin(y * 0.045 - t * 3.4 * sp) * l.cloth * W * 0.035 * ramp;
      ctx.drawImage(src, 0, y, W, STEP, dx, y, W, STEP);
    }
  }
  if (l.legs > 0) {
    const src = snapshot(ctx, W, H);
    const y0 = l.legY * H;
    for (let y = y0; y < H; y += STEP) {
      const ramp = (y - y0) / Math.max(1, H - y0);
      const d = Math.sin(t * 4.2 * sp) * l.legs * W * 0.05 * ramp;
      ctx.drawImage(src, 0, y, W / 2, STEP, d, y, W / 2, STEP);
      ctx.drawImage(src, W / 2, y, W / 2, STEP, W / 2 - d, y, W / 2, STEP);
    }
  }
  if (l.arms > 0) {
    const src = snapshot(ctx, W, H);
    const y0 = H * 0.3;
    const y1 = H * 0.72;
    const bw = W * 0.28;
    const swing = Math.sin(t * 4.2 * sp) * l.arms * H * 0.035;
    for (let x = 0; x < bw; x += STEP) {
      ctx.drawImage(src, x, y0, STEP, y1 - y0, x, y0 + swing * (1 - x / bw), STEP, y1 - y0);
    }
    for (let x = W - bw; x < W; x += STEP) {
      ctx.drawImage(src, x, y0, STEP, y1 - y0, x, y0 - swing * ((x - (W - bw)) / bw), STEP, y1 - y0);
    }
  }
  if (l.mouth > 0) {
    const src = snapshot(ctx, W, H);
    const o = Math.max(0, Math.sin(t * 8 * sp)) * (0.65 + 0.35 * Math.sin(t * 2.3 * sp + 1)) * l.mouth;
    const r = a.fs * W * 0.55;
    const mx = a.mx * W;
    const my = a.my * H;
    const d = o * r * 0.28;
    if (d > 0.4) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx - r, my, r * 2, r * 1.2);
      ctx.clip();
      ctx.beginPath();
      ctx.ellipse(mx, my + r * 0.35, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(src, 0, d);
      ctx.restore();
      ctx.fillStyle = "rgba(50,8,18,0.9)";
      ctx.beginPath();
      ctx.ellipse(mx, my + d * 0.45, r * 0.42, d * 0.5 + 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function paintClip(
  layer: HTMLCanvasElement,
  asset: Asset | undefined,
  project: Project,
  localT: number,
  strokes: Stroke[] | undefined,
  clip?: Clip,
) {
  const ctx = layer.getContext("2d");
  if (!ctx) return;
  const W = layer.width;
  const H = layer.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!asset) return;
  const el = asset.el;
  if (el instanceof HTMLVideoElement && el.readyState < 2) return;
  const { w, h } = elementSize(el);
  if (!w || !h) return;
  const rect = coverCrop(w, h, W, H, clip?.crop);
  const tpl = project.mode === "ai" ? project.template : null;
  const retouch = () => {
    if (!clip) return;
    applyMakeup(ctx, W, H, clip);
    applyLife(ctx, W, H, clip, localT);
  };
  if (tpl) {
    ensureDepth(asset, rect, `${W}x${H}:${rect.sx.toFixed(0)},${rect.sy.toFixed(0)},${rect.sw.toFixed(0)}`);
    drawMesh(ctx, asset, rect, W, H, tpl, localT);
    retouch();
    if (tpl.glitch) drawGlitch(ctx, W, H, localT);
    drawParticles(ctx, tpl.particles, W, H, localT);
    if (tpl.sweep) drawSweep(ctx, W, H, localT);
    drawVignette(ctx, W, H);
  } else {
    ctx.drawImage(el, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, W, H);
    retouch();
  }
  if (strokes?.length) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.moveTo(s.points[0][0], s.points[0][1]);
      if (s.points.length === 1) ctx.lineTo(s.points[0][0] + 0.01, s.points[0][1]);
      for (const [x, y] of s.points.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}

interface BlitOpts {
  alpha?: number;
  dx?: number;
  dy?: number;
  sx?: number;
  sy?: number;
  blur?: number;
  rot?: number;
}

function blit(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, clip: Clip, o: BlitOpts = {}) {
  const W = layer.width;
  const H = layer.height;
  const css = FILTERS.find((f) => f.id === clip.filter)?.css ?? "";
  const filter = [css, makeupCss(clip.makeup), o.blur ? `blur(${o.blur.toFixed(1)}px)` : ""].filter(Boolean).join(" ");
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.filter = filter || "none";
  ctx.translate(W / 2 + (o.dx ?? 0), H / 2 + (o.dy ?? 0));
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(o.sx ?? 1, o.sy ?? 1);
  ctx.drawImage(layer, -W / 2, -H / 2);
  ctx.restore();
}

export function drawText(ctx: CanvasRenderingContext2D, items: TextItem[], t: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  for (const it of items) {
    if (t < it.start || t > it.end || !it.text.trim()) continue;
    const a = clamp((t - it.start) / 0.4, 0, 1) * clamp((it.end - t) / 0.3, 0, 1);
    const rise = (1 - ease(clamp((t - it.start) / 0.4, 0, 1))) * H * 0.03;
    const px = (it.size / 100) * W;
    ctx.save();
    ctx.globalAlpha = a * clamp(it.alpha ?? 1, 0, 1);
    if (it.rot || it.sx !== undefined || it.sy !== undefined) {
      ctx.translate(it.x * W, it.y * H + rise);
      if (it.rot) ctx.rotate((it.rot * Math.PI) / 180);
      ctx.scale(clamp(it.sx ?? 1, 0.2, 4), clamp(it.sy ?? 1, 0.2, 4));
      ctx.translate(-it.x * W, -(it.y * H + rise));
    }
    const spec = fontSpec(it.font);
    ctx.font = `${spec.weight} ${px}px "${spec.family}", "Noto Sans TC", "PingFang TC", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    const style = it.style ?? "legacy";
    const edge = it.edge ?? "#000000";
    const maxW = W * 0.94;
    const cx = it.x * W;
    const lines = it.text.split("\n");
    const yOf = (i: number) => it.y * H + rise + (i - (lines.length - 1) / 2) * px * 1.25;
    if (style === "plate") {
      let mw = 0;
      for (const line of lines) mw = Math.max(mw, Math.min(maxW, ctx.measureText(line).width));
      const bw = mw + px * 0.9;
      const bh = lines.length * px * 1.25 + px * 0.2;
      ctx.fillStyle = edge;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, it.y * H + rise - bh / 2, bw, bh, px * 0.3);
      ctx.fill();
    }
    lines.forEach((line, i) => {
      const y = yOf(i);
      if (style === "extrude") {
        ctx.fillStyle = edge;
        for (let k = 8; k >= 1; k--) ctx.fillText(line, cx + k * px * 0.025, y + k * px * 0.03, maxW);
      } else if (style === "outline") {
        ctx.lineWidth = px * 0.14;
        ctx.strokeStyle = edge;
        ctx.strokeText(line, cx, y, maxW);
      } else if (style === "legacy") {
        ctx.lineWidth = px * 0.14;
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.strokeText(line, cx, y, maxW);
      }
      ctx.fillStyle = it.color;
      ctx.fillText(line, cx, y, maxW);
    });
    ctx.restore();
  }
}

export function renderAt(
  main: HTMLCanvasElement,
  layers: [HTMLCanvasElement, HTMLCanvasElement],
  project: Project,
  assets: Map<string, Asset>,
  strokes: Map<string, Stroke[]>,
  t: number,
) {
  const ctx = main.getContext("2d");
  if (!ctx) return;
  const W = main.width;
  const H = main.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const { clips } = project;
  if (!clips.length) return;
  const tl = buildTimeline(clips);
  const tt = Math.max(0, Math.min(t, tl.total - 0.001));
  const active: number[] = [];
  clips.forEach((c, i) => {
    if (tt >= tl.starts[i] && tt < tl.starts[i] + clipLen(c)) active.push(i);
  });
  if (!active.length) active.push(clips.length - 1);
  const ai = active[active.length - 2] ?? active[0];
  const bi = active.length > 1 ? active[active.length - 1] : -1;

  const paint = (i: number, k: 0 | 1) =>
    paintClip(layers[k], assets.get(clips[i].assetId), project, tt - tl.starts[i], strokes.get(clips[i].id), clips[i]);

  paint(ai, 0);
  if (bi < 0) {
    blit(ctx, layers[0], clips[ai]);
  } else {
    paint(bi, 1);
    const a = clips[ai];
    const b = clips[bi];
    const p = ease(clamp((tt - tl.starts[bi]) / Math.max(0.01, tl.overlaps[bi]), 0, 1));
    switch (b.transition) {
      case "slide":
        blit(ctx, layers[0], a, { dx: -p * W * 0.3 });
        blit(ctx, layers[1], b, { dx: (1 - p) * W });
        break;
      case "slideUp":
        blit(ctx, layers[0], a, { dy: -p * H * 0.3 });
        blit(ctx, layers[1], b, { dy: (1 - p) * H });
        break;
      case "zoom":
        blit(ctx, layers[0], a, { sx: 1 + p * 0.2, sy: 1 + p * 0.2, alpha: 1 - p });
        blit(ctx, layers[1], b, { sx: 0.7 + 0.3 * p, sy: 0.7 + 0.3 * p, alpha: p });
        break;
      case "wipe":
        blit(ctx, layers[0], a);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W * p, H);
        ctx.clip();
        blit(ctx, layers[1], b);
        ctx.restore();
        break;
      case "flip":
        if (p < 0.5) blit(ctx, layers[0], a, { sx: Math.max(0.01, 1 - p * 2) });
        else blit(ctx, layers[1], b, { sx: Math.max(0.01, p * 2 - 1) });
        break;
      case "blur":
        blit(ctx, layers[0], a, { blur: p * 14 });
        blit(ctx, layers[1], b, { blur: (1 - p) * 14, alpha: p });
        break;
      case "spin":
        blit(ctx, layers[0], a, { rot: p * 0.6, sx: 1 + p * 0.4, sy: 1 + p * 0.4, alpha: 1 - p });
        blit(ctx, layers[1], b, { rot: -(1 - p) * 0.6, sx: 0.6 + 0.4 * p, sy: 0.6 + 0.4 * p, alpha: p });
        break;
      case "iris":
        blit(ctx, layers[0], a);
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, p * Math.hypot(W, H) * 0.5, 0, Math.PI * 2);
        ctx.clip();
        blit(ctx, layers[1], b);
        ctx.restore();
        break;
      default:
        blit(ctx, layers[0], a);
        blit(ctx, layers[1], b, { alpha: p });
    }
  }

  drawArt(ctx, W, H, project.art);
  const layered = [
    ...project.stickers.map((item, i) => ({ z: item.z ?? 1000 + i, draw: () => drawStickers(ctx, [item], tt) })),
    ...project.texts.map((item, i) => ({ z: item.z ?? 2000 + i, draw: () => drawText(ctx, [item], tt) })),
  ].sort((a, b) => a.z - b.z);
  for (const layer of layered) layer.draw();

  if (project.fadeInOut) {
    const a = Math.max(1 - tt / EDGE_FADE, 1 - (tl.total - tt) / EDGE_FADE, 0);
    if (a > 0) {
      ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

export function activeClipIndex(clips: Clip[], t: number): number {
  const tl = buildTimeline(clips);
  let idx = 0;
  tl.starts.forEach((s, i) => {
    if (s <= t) idx = i;
  });
  return idx;
}

let graph: {
  ctx: AudioContext;
  dest: MediaStreamAudioDestinationNode;
  routed: WeakSet<HTMLMediaElement>;
} | null = null;

export async function routeAudio(elements: HTMLMediaElement[]): Promise<MediaStreamTrack[]> {
  try {
    if (!graph) {
      const ctx = new AudioContext();
      graph = { ctx, dest: ctx.createMediaStreamDestination(), routed: new WeakSet() };
    }
    await graph.ctx.resume();
    for (const el of elements) {
      if (graph.routed.has(el)) continue;
      const src = graph.ctx.createMediaElementSource(el);
      src.connect(graph.ctx.destination);
      src.connect(graph.dest);
      graph.routed.add(el);
    }
    return graph.dest.stream.getAudioTracks();
  } catch {
    return [];
  }
}
