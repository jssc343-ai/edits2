export type FrameFamily = "pattern" | "wood" | "bronze" | "glass";
export type BorderPlace = "opposite" | "corner" | "single";
export type BorderShape = "flower" | "pattern" | "bar";
export type ComboType = "card" | "bookmark" | "greeting" | "creative" | "art";
export type ComboStyle = "kids" | "girl" | "youth" | "vibrant" | "memory" | "trendy";

export interface ArtBorder {
  id: string;
  place: BorderPlace;
  shape: BorderShape;
  color: string;
}

export interface ArtState {
  frame: string | null;
  frameWidth: number;
  frameColor: string;
  borders: ArtBorder[];
  comboType: ComboType | null;
  comboStyle: ComboStyle;
}

export const DEFAULT_ART: ArtState = {
  frame: null,
  frameWidth: 7,
  frameColor: "#ffffff",
  borders: [],
  comboType: null,
  comboStyle: "girl",
};

interface FrameDef {
  id: string;
  fam: FrameFamily;
  zh: string;
  en: string;
  c: string[];
}

export const FRAMES: FrameDef[] = [
  { id: "pat-vine", fam: "pattern", zh: "花紋・藤蔓", en: "Pattern: vine", c: [] },
  { id: "pat-dots", fam: "pattern", zh: "花紋・圓點", en: "Pattern: dots", c: [] },
  { id: "pat-lace", fam: "pattern", zh: "花紋・蕾絲", en: "Pattern: lace", c: [] },
  { id: "pat-wave", fam: "pattern", zh: "花紋・波紋", en: "Pattern: wave", c: [] },
  { id: "wood-oak", fam: "wood", zh: "木框・橡木", en: "Wood: oak", c: ["#b98a52", "#8a5f32"] },
  { id: "wood-walnut", fam: "wood", zh: "木框・胡桃", en: "Wood: walnut", c: ["#6b4429", "#3d2414"] },
  { id: "wood-birch", fam: "wood", zh: "木框・白樺", en: "Wood: birch", c: ["#ecdcbf", "#c9b38a"] },
  { id: "wood-bamboo", fam: "wood", zh: "木框・竹紋", en: "Wood: bamboo", c: ["#c8c26a", "#8d8a3a"] },
  { id: "bronze-classic", fam: "bronze", zh: "銅框・古銅", en: "Bronze: classic", c: ["#d9a066", "#8c5a2b"] },
  { id: "bronze-gold", fam: "bronze", zh: "銅框・金色", en: "Bronze: gold", c: ["#ffe08a", "#b8860b"] },
  { id: "bronze-silver", fam: "bronze", zh: "銅框・銀色", en: "Bronze: silver", c: ["#f1f4f8", "#8f99a6"] },
  { id: "bronze-double", fam: "bronze", zh: "銅框・雙層", en: "Bronze: double", c: ["#e0b070", "#7a4c22"] },
  { id: "bronze-ornate", fam: "bronze", zh: "銅框・角飾", en: "Bronze: ornate", c: ["#f0c987", "#8c5a2b"] },
  { id: "glass-blue", fam: "glass", zh: "琉璃框・湛藍", en: "Glass: blue", c: ["#7fd0ff", "#2f5fd1"] },
  { id: "glass-rose", fam: "glass", zh: "琉璃框・玫瑰", en: "Glass: rose", c: ["#ffb3d1", "#d1457f"] },
  { id: "glass-amber", fam: "glass", zh: "琉璃框・琥珀", en: "Glass: amber", c: ["#ffe08a", "#e0701f"] },
  { id: "glass-green", fam: "glass", zh: "琉璃框・翡翠", en: "Glass: jade", c: ["#a8f0c8", "#1f9a6a"] },
  { id: "glass-rainbow", fam: "glass", zh: "琉璃框・七彩", en: "Glass: rainbow", c: [] },
  { id: "pat-star", fam: "pattern", zh: "花紋・星星", en: "Pattern: stars", c: [] },
  { id: "pat-heart", fam: "pattern", zh: "花紋・愛心", en: "Pattern: hearts", c: [] },
  { id: "pat-diamond", fam: "pattern", zh: "花紋・菱格", en: "Pattern: diamonds", c: [] },
  { id: "pat-leaf", fam: "pattern", zh: "花紋・葉片", en: "Pattern: leaves", c: [] },
  { id: "pat-zigzag", fam: "pattern", zh: "花紋・鋸齒", en: "Pattern: zigzag", c: [] },
  { id: "pat-scallop", fam: "pattern", zh: "花紋・貝殼邊", en: "Pattern: scallop", c: [] },
  { id: "wood-cherry", fam: "wood", zh: "木框・櫻桃木", en: "Wood: cherry", c: ["#b5543a", "#7a2f1f"] },
  { id: "wood-ebony", fam: "wood", zh: "木框・烏木", en: "Wood: ebony", c: ["#3a3532", "#15110f"] },
  { id: "wood-pine", fam: "wood", zh: "木框・松木", en: "Wood: pine", c: ["#e3c27d", "#b8924a"] },
  { id: "wood-maple", fam: "wood", zh: "木框・楓木", en: "Wood: maple", c: ["#d8a46a", "#a8693a"] },
  { id: "wood-driftwood", fam: "wood", zh: "木框・漂流木", en: "Wood: driftwood", c: ["#cfc5b4", "#8f8573"] },
  { id: "bronze-rose", fam: "bronze", zh: "銅框・玫瑰金", en: "Bronze: rose gold", c: ["#f6c9b8", "#b76e55"] },
  { id: "bronze-copper", fam: "bronze", zh: "銅框・紅銅", en: "Bronze: copper", c: ["#e08a5a", "#8a3f1d"] },
  { id: "bronze-platinum", fam: "bronze", zh: "銅框・鉑金", en: "Bronze: platinum", c: ["#ffffff", "#aab4c2"] },
  { id: "bronze-antique", fam: "bronze", zh: "銅框・仿古", en: "Bronze: antique", c: ["#b59a6a", "#5e4a2a"] },
  { id: "bronze-black", fam: "bronze", zh: "銅框・黑金", en: "Bronze: black gold", c: ["#6b5a2e", "#14120c"] },
  { id: "glass-violet", fam: "glass", zh: "琉璃框・紫晶", en: "Glass: amethyst", c: ["#d6b8ff", "#7a45d6"] },
  { id: "glass-ice", fam: "glass", zh: "琉璃框・冰晶", en: "Glass: ice", c: ["#eaf8ff", "#8fc7e8"] },
  { id: "glass-sunset", fam: "glass", zh: "琉璃框・晚霞", en: "Glass: sunset", c: ["#ffb36b", "#e0457a"] },
  { id: "glass-mint", fam: "glass", zh: "琉璃框・薄荷", en: "Glass: mint", c: ["#d2fff0", "#42b8a0"] },
  { id: "glass-ocean", fam: "glass", zh: "琉璃框・海洋", en: "Glass: ocean", c: ["#6fe3e3", "#1c55a8"] },
];

export const BORDER_PLACES: { id: BorderPlace; zh: string; en: string }[] = [
  { id: "opposite", zh: "對邊", en: "Opposite sides" },
  { id: "corner", zh: "對角", en: "Opposite corners" },
  { id: "single", zh: "單邊", en: "Single side" },
];

export const BORDER_SHAPES: { id: BorderShape; zh: string; en: string }[] = [
  { id: "flower", zh: "花絮", en: "Blossoms" },
  { id: "pattern", zh: "紋路", en: "Pattern" },
  { id: "bar", zh: "色條", en: "Color bar" },
];

export const COMBO_TYPES: { id: ComboType; zh: string; en: string }[] = [
  { id: "card", zh: "卡片", en: "Card" },
  { id: "bookmark", zh: "書籤", en: "Bookmark" },
  { id: "greeting", zh: "賀卡", en: "Greeting card" },
  { id: "creative", zh: "創意", en: "Creative" },
  { id: "art", zh: "美術", en: "Gallery" },
];

export const COMBO_STYLES: { id: ComboStyle; zh: string; en: string }[] = [
  { id: "kids", zh: "兒童", en: "Kids" },
  { id: "girl", zh: "少女", en: "Girly" },
  { id: "youth", zh: "青春", en: "Youth" },
  { id: "vibrant", zh: "活力", en: "Vibrant" },
  { id: "memory", zh: "回憶", en: "Nostalgia" },
  { id: "trendy", zh: "流行", en: "Trendy" },
];

const PAL: Record<ComboStyle, { a: string; b: string; c: string }> = {
  kids: { a: "#ff6b6b", b: "#ffd93d", c: "#4dabf7" },
  girl: { a: "#ff8fb8", b: "#ffd1e3", c: "#fff5f9" },
  youth: { a: "#20c4b0", b: "#ffe066", c: "#ffffff" },
  vibrant: { a: "#ff7a1a", b: "#ff3d54", c: "#fff3d6" },
  memory: { a: "#a07850", b: "#e6d3b0", c: "#f7efe0" },
  trendy: { a: "#16171d", b: "#b6ff3b", c: "#f4f4f6" },
};

type Ctx = CanvasRenderingContext2D;

function bandPath(ctx: Ctx, w: number, h: number, bw: number) {
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.rect(bw, bw, w - bw * 2, h - bw * 2);
}

function alongPerimeter(w: number, h: number, bw: number, step: number, fn: (x: number, y: number, i: number) => void) {
  let i = 0;
  for (let x = step / 2; x < w; x += step) {
    fn(x, bw / 2, i++);
    fn(x, h - bw / 2, i++);
  }
  for (let y = step / 2 + step; y < h - step / 2; y += step) {
    fn(bw / 2, y, i++);
    fn(w - bw / 2, y, i++);
  }
}

function flower(ctx: Ctx, x: number, y: number, r: number, petal: string, core: string) {
  ctx.fillStyle = petal;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrame(ctx: Ctx, w: number, h: number, id: string, widthPct: number, color: string) {
  const def = FRAMES.find((f) => f.id === id);
  if (!def) return;
  const m = Math.min(w, h);
  const bw = (m * widthPct) / 100;
  ctx.save();
  if (def.fam === "pattern") {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.92;
    bandPath(ctx, w, h, bw);
    ctx.fill("evenodd");
    ctx.globalAlpha = 1;
    ctx.save();
    bandPath(ctx, w, h, bw);
    ctx.clip("evenodd");
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = Math.max(1, bw * 0.08);
    const step = bw * 1.1;
    alongPerimeter(w, h, bw, step, (x, y, i) => {
      if (id === "pat-vine") {
        ctx.beginPath();
        ctx.arc(x, y, bw * 0.28, i % 2 ? 0 : Math.PI, i % 2 ? Math.PI * 1.5 : Math.PI * 2.5);
        ctx.stroke();
      } else if (id === "pat-dots") {
        ctx.beginPath();
        ctx.arc(x, y, bw * 0.18, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === "pat-lace") {
        ctx.beginPath();
        ctx.arc(x, y, bw * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, bw * 0.08, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === "pat-star") {
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const rr = k % 2 ? bw * 0.12 : bw * 0.3;
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
      } else if (id === "pat-heart") {
        const s = bw * 0.25;
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.85);
        ctx.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.35);
        ctx.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.85);
        ctx.fill();
      } else if (id === "pat-diamond") {
        ctx.beginPath();
        ctx.moveTo(x, y - bw * 0.28);
        ctx.lineTo(x + bw * 0.2, y);
        ctx.lineTo(x, y + bw * 0.28);
        ctx.lineTo(x - bw * 0.2, y);
        ctx.closePath();
        ctx.fill();
      } else if (id === "pat-leaf") {
        ctx.beginPath();
        ctx.ellipse(x, y, bw * 0.28, bw * 0.12, i % 2 ? 0.6 : -0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (id === "pat-zigzag") {
        ctx.beginPath();
        ctx.moveTo(x - bw * 0.35, y + bw * 0.15);
        ctx.lineTo(x - bw * 0.12, y - bw * 0.15);
        ctx.lineTo(x + bw * 0.12, y + bw * 0.15);
        ctx.lineTo(x + bw * 0.35, y - bw * 0.15);
        ctx.stroke();
      } else if (id === "pat-scallop") {
        ctx.beginPath();
        ctx.arc(x, y, bw * 0.3, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x - bw * 0.4, y);
        ctx.quadraticCurveTo(x - bw * 0.2, y - bw * 0.3, x, y);
        ctx.quadraticCurveTo(x + bw * 0.2, y + bw * 0.3, x + bw * 0.4, y);
        ctx.stroke();
      }
    });
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
  } else if (def.fam === "wood") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, def.c[0]);
    g.addColorStop(1, def.c[1]);
    ctx.fillStyle = g;
    bandPath(ctx, w, h, bw);
    ctx.fill("evenodd");
    ctx.save();
    bandPath(ctx, w, h, bw);
    ctx.clip("evenodd");
    ctx.strokeStyle = "rgba(0,0,0,0.16)";
    ctx.lineWidth = 1;
    for (let k = 1; k < 9; k++) {
      const o = (bw * k) / 9;
      ctx.strokeRect(o, o, w - o * 2, h - o * 2);
    }
    if (id === "wood-bamboo") {
      ctx.strokeStyle = "rgba(60,50,10,0.5)";
      ctx.lineWidth = bw * 0.1;
      for (let x = bw * 2; x < w; x += bw * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, bw);
        ctx.moveTo(x, h - bw);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = bw * 2; y < h; y += bw * 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(bw, y);
        ctx.moveTo(w - bw, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
  } else if (def.fam === "bronze") {
    const draw = (inset: number, th: number) => {
      const g = ctx.createLinearGradient(inset, inset, w - inset, h - inset);
      g.addColorStop(0, def.c[0]);
      g.addColorStop(0.5, def.c[1]);
      g.addColorStop(1, def.c[0]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.rect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.rect(inset + th, inset + th, w - (inset + th) * 2, h - (inset + th) * 2);
      ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(inset + 1, inset + 1, w - inset * 2 - 2, h - inset * 2 - 2);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.strokeRect(inset + th, inset + th, w - (inset + th) * 2, h - (inset + th) * 2);
    };
    if (id === "bronze-double") {
      draw(0, bw * 0.4);
      draw(bw * 0.6, bw * 0.4);
    } else draw(0, bw);
    if (id === "bronze-ornate") {
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(([cx, cy]) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, bw * 1.5);
        g.addColorStop(0, def.c[0]);
        g.addColorStop(1, def.c[1]);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, bw * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    if (def.c.length) {
      g.addColorStop(0, def.c[0]);
      g.addColorStop(1, def.c[1]);
    } else {
      ["#ff6b6b", "#ffd93d", "#51cf66", "#4dabf7", "#b197fc"].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    }
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = g;
    bandPath(ctx, w, h, bw);
    ctx.fill("evenodd");
    ctx.globalAlpha = 1;
    ctx.save();
    bandPath(ctx, w, h, bw);
    ctx.clip("evenodd");
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    alongPerimeter(w, h, bw, bw * 1.6, (x, y) => {
      ctx.beginPath();
      ctx.arc(x - bw * 0.1, y - bw * 0.1, bw * 0.12, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(bw * 0.25, bw * 0.25, w - bw * 0.5, h - bw * 0.5);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
  }
  ctx.restore();
}

function drawBand(ctx: Ctx, len: number, th: number, shape: BorderShape, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, len, th);
  ctx.clip();
  if (shape === "bar") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, len, th * 0.7);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(0, th * 0.78, len, th * 0.12);
  } else if (shape === "pattern") {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, len, th);
    ctx.globalAlpha = 1;
    const step = th * 0.9;
    for (let x = 0; x < len + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, th * 0.5);
      ctx.lineTo(x + step / 2, th * 0.1);
      ctx.lineTo(x + step, th * 0.5);
      ctx.lineTo(x + step / 2, th * 0.9);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, th * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, th * 0.5);
    ctx.lineTo(len, th * 0.5);
    ctx.stroke();
    const step = th * 1.15;
    let i = 0;
    for (let x = step / 2; x < len; x += step, i++) {
      flower(ctx, x, th * 0.5, th * (i % 2 ? 0.28 : 0.4), color, "#fff4b0");
    }
  }
  ctx.restore();
}

function drawBorder(ctx: Ctx, w: number, h: number, b: ArtBorder) {
  const th = Math.min(w, h) * 0.075;
  const edge = (e: "top" | "bottom" | "left" | "right", len?: number) => {
    ctx.save();
    if (e === "top") {
      drawBand(ctx, len ?? w, th, b.shape, b.color);
    } else if (e === "bottom") {
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      drawBand(ctx, len ?? w, th, b.shape, b.color);
    } else if (e === "left") {
      ctx.translate(0, h);
      ctx.rotate(-Math.PI / 2);
      drawBand(ctx, len ?? h, th, b.shape, b.color);
    } else {
      ctx.translate(w, 0);
      ctx.rotate(Math.PI / 2);
      drawBand(ctx, len ?? h, th, b.shape, b.color);
    }
    ctx.restore();
  };
  if (b.place === "single") edge("top");
  else if (b.place === "opposite") {
    edge("top");
    edge("bottom");
  } else {
    const L = Math.min(w, h) * 0.45;
    edge("top", L);
    edge("left", L);
    ctx.save();
    ctx.translate(w, h);
    ctx.rotate(Math.PI);
    drawBand(ctx, L, th, b.shape, b.color);
    ctx.restore();
    ctx.save();
    ctx.translate(w, h - L);
    ctx.rotate(Math.PI / 2);
    drawBand(ctx, L, th, b.shape, b.color);
    ctx.restore();
  }
}

function motif(ctx: Ctx, style: ComboStyle, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  if (style === "kids") {
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? s * 0.4 : s;
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      ctx[k ? "lineTo" : "moveTo"](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  } else if (style === "girl") {
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.5, y - s * 1.1, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s * 1.4, y - s * 0.2, x, y + s * 0.9);
    ctx.fill();
  } else if (style === "youth") {
    ctx.lineWidth = s * 0.3;
    ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  } else if (style === "vibrant") {
    ctx.moveTo(x + s * 0.2, y - s);
    ctx.lineTo(x - s * 0.6, y + s * 0.1);
    ctx.lineTo(x, y + s * 0.1);
    ctx.lineTo(x - s * 0.2, y + s);
    ctx.lineTo(x + s * 0.6, y - s * 0.1);
    ctx.lineTo(x, y - s * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (style === "memory") {
    ctx.rect(x - s * 0.5, y - s * 0.5, s, s);
    ctx.fill();
  } else {
    ctx.lineWidth = s * 0.28;
    ctx.moveTo(x - s * 0.8, y);
    ctx.lineTo(x + s * 0.8, y);
    ctx.moveTo(x, y - s * 0.8);
    ctx.lineTo(x, y + s * 0.8);
    ctx.stroke();
  }
}

function drawCombo(ctx: Ctx, w: number, h: number, type: ComboType, style: ComboStyle) {
  const p = PAL[style];
  const m = Math.min(w, h);
  ctx.save();
  if (type === "card") {
    const bw = m * 0.045;
    ctx.fillStyle = p.a;
    bandPath(ctx, w, h, bw);
    ctx.fill("evenodd");
    ctx.strokeStyle = p.b;
    ctx.lineWidth = 3;
    ctx.strokeRect(bw + 6, bw + 6, w - bw * 2 - 12, h - bw * 2 - 12);
    [[bw * 1.8, bw * 1.8], [w - bw * 1.8, bw * 1.8], [bw * 1.8, h - bw * 1.8], [w - bw * 1.8, h - bw * 1.8]].forEach(([x, y]) =>
      motif(ctx, style, x, y, m * 0.04, p.b),
    );
  } else if (type === "bookmark") {
    const sw = m * 0.14;
    ctx.fillStyle = p.a;
    ctx.fillRect(0, 0, sw, h);
    ctx.fillStyle = p.b;
    ctx.fillRect(sw * 0.82, 0, sw * 0.12, h);
    for (let y = sw * 1.5; y < h - sw * 0.5; y += sw * 1.1) motif(ctx, style, sw * 0.42, y, sw * 0.2, p.c);
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(sw * 0.42, sw * 0.5, sw * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.b;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sw * 0.42, sw * 0.5);
    ctx.quadraticCurveTo(sw * 0.8, sw * 1.2, sw * 0.5, sw * 1.5);
    ctx.stroke();
  } else if (type === "greeting") {
    const th = h * 0.085;
    ctx.fillStyle = p.a;
    ctx.fillRect(0, 0, w, th);
    const r = m * 0.03;
    for (let x = r; x < w + r; x += r * 2) {
      ctx.beginPath();
      ctx.arc(x, th, r, 0, Math.PI);
      ctx.fill();
    }
    for (let x = m * 0.05; x < w; x += m * 0.1) motif(ctx, style, x, th * 0.5, th * 0.25, p.c);
    const bh = h * 0.06;
    ctx.fillStyle = p.b;
    ctx.fillRect(0, h - bh, w, bh);
    for (let x = m * 0.05; x < w; x += m * 0.1) motif(ctx, style, x, h - bh / 2, bh * 0.28, p.a);
  } else if (type === "creative") {
    const tape = (x: number, y: number, ang: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = p.b;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-m * 0.1, -m * 0.025, m * 0.2, m * 0.05);
      ctx.restore();
    };
    tape(m * 0.06, m * 0.06, -Math.PI / 4);
    tape(w - m * 0.06, m * 0.06, Math.PI / 4);
    tape(m * 0.06, h - m * 0.06, Math.PI / 4);
    tape(w - m * 0.06, h - m * 0.06, -Math.PI / 4);
    const sh = h * 0.1;
    ctx.fillStyle = p.c;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(0, h - sh, w, sh);
    ctx.globalAlpha = 1;
    for (let k = 0; k < 7; k++) motif(ctx, style, w * (0.14 + k * 0.12), h - sh / 2, sh * 0.2, k % 2 ? p.b : p.a);
  } else {
    const bw = m * 0.07;
    ctx.fillStyle = p.c;
    bandPath(ctx, w, h, bw);
    ctx.fill("evenodd");
    ctx.strokeStyle = p.a;
    ctx.lineWidth = 3;
    ctx.strokeRect(bw * 0.6, bw * 0.6, w - bw * 1.2, h - bw * 1.2);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
    ctx.fillStyle = p.a;
    ctx.fillRect(w / 2 - w * 0.12, h - bw * 0.85, w * 0.24, bw * 0.55);
    motif(ctx, style, w / 2, h - bw * 0.57, bw * 0.16, p.c);
  }
  ctx.restore();
}

export function drawArt(ctx: Ctx, w: number, h: number, art?: ArtState) {
  if (!art) return;
  if (!art.frame && !art.borders.length && !art.comboType) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  if (art.comboType) drawCombo(ctx, w, h, art.comboType, art.comboStyle);
  art.borders.forEach((b) => drawBorder(ctx, w, h, b));
  if (art.frame) drawFrame(ctx, w, h, art.frame, art.frameWidth, art.frameColor);
  ctx.restore();
}
