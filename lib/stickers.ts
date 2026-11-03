import { EXTRA_STICKERS } from "@/lib/stickers-extra";
import { REAL3D_STICKERS } from "@/lib/stickers-3d";

export interface StickerItem {
  id: string;
  kind: string;
  x: number;
  y: number;
  size: number;
  start: number;
  end: number;
  rot?: number;
  z?: number;
  sx?: number;
  sy?: number;
  alpha?: number;
}

export interface StickerDef {
  id: string;
  zh: string;
  en: string;
  animated: boolean;
  cat?: "wear" | "scene" | "atmo";
  real3d?: boolean;
  draw: (c: CanvasRenderingContext2D, r: number, t: number) => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function soft(c: CanvasRenderingContext2D, x: number, y: number, rad: number, rgb: string, a: number) {
  if (rad <= 0 || a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, rad, 0, Math.PI * 2);
  c.fill();
}

function flame(c: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, t: number, seed: number) {
  const hh = h * (1 + Math.sin(t * 13 + seed) * 0.12);
  const sway = Math.sin(t * 7 + seed * 2) * w * 0.25;
  const layers: [number, string][] = [
    [1, "#e5484d"],
    [0.78, "#f0703c"],
    [0.55, "#f5c542"],
    [0.3, "#fff4c2"],
  ];
  for (const [s, color] of layers) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x - w * s, y - hh * 0.3 * s, x - w * 0.4 * s + sway, y - hh * 0.7 * s, x + sway, y - hh * s);
    c.bezierCurveTo(x + w * 0.4 * s + sway, y - hh * 0.7 * s, x + w * s, y - hh * 0.3 * s, x, y);
    c.fill();
  }
}

function starPath(c: CanvasRenderingContext2D, r: number, inner: number, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? inner : r;
    const a = rot + (i * Math.PI) / 5;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.closePath();
}

function heart(c: CanvasRenderingContext2D, r: number) {
  c.beginPath();
  c.moveTo(0, r * 0.85);
  c.bezierCurveTo(-r * 1.25, r * 0.1, -r * 0.9, -r * 0.95, 0, -r * 0.35);
  c.bezierCurveTo(r * 0.9, -r * 0.95, r * 1.25, r * 0.1, 0, r * 0.85);
  c.closePath();
  c.fillStyle = "#e8506a";
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.35)";
  c.beginPath();
  c.ellipse(-r * 0.45, -r * 0.3, r * 0.18, r * 0.28, -0.6, 0, Math.PI * 2);
  c.fill();
}

function flower(c: CanvasRenderingContext2D, r: number, rot: number) {
  c.save();
  c.rotate(rot);
  for (let i = 0; i < 6; i++) {
    c.save();
    c.rotate((i * Math.PI) / 3);
    c.fillStyle = i % 2 ? "#f58fa6" : "#f9a8ba";
    c.beginPath();
    c.ellipse(0, -r * 0.55, r * 0.3, r * 0.45, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.fillStyle = "#f5c542";
  c.beginPath();
  c.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function star(c: CanvasRenderingContext2D, r: number) {
  starPath(c, r, r * 0.45);
  c.fillStyle = "#f5c542";
  c.fill();
  c.lineJoin = "round";
  c.lineWidth = r * 0.08;
  c.strokeStyle = "#f0a21c";
  c.stroke();
}

export const STICKERS: StickerDef[] = [
  { id: "heart", zh: "愛心", en: "Heart", animated: false, draw: (c, r) => heart(c, r) },
  { id: "star", zh: "星星", en: "Star", animated: false, draw: (c, r) => star(c, r) },
  { id: "flower", zh: "小花", en: "Flower", animated: false, draw: (c, r) => flower(c, r, 0) },
  {
    id: "sun",
    zh: "太陽",
    en: "Sun",
    animated: false,
    draw: (c, r) => {
      c.strokeStyle = "#f0a21c";
      c.lineWidth = r * 0.1;
      c.lineCap = "round";
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
        c.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
        c.stroke();
      }
      c.fillStyle = "#f5c542";
      c.beginPath();
      c.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: "cloud",
    zh: "雲朵",
    en: "Cloud",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#ffffff";
      c.strokeStyle = "#bcd3ea";
      c.lineWidth = r * 0.06;
      c.beginPath();
      c.arc(-r * 0.45, r * 0.1, r * 0.4, Math.PI * 0.5, Math.PI * 1.5);
      c.arc(-r * 0.1, -r * 0.2, r * 0.5, Math.PI, Math.PI * 2);
      c.arc(r * 0.45, r * 0.05, r * 0.42, Math.PI * 1.5, Math.PI * 0.5);
      c.closePath();
      c.fill();
      c.stroke();
    },
  },
  {
    id: "crown",
    zh: "皇冠",
    en: "Crown",
    animated: false,
    draw: (c, r) => {
      c.beginPath();
      c.moveTo(-r * 0.8, r * 0.5);
      c.lineTo(-r * 0.8, -r * 0.3);
      c.lineTo(-r * 0.4, r * 0.1);
      c.lineTo(0, -r * 0.5);
      c.lineTo(r * 0.4, r * 0.1);
      c.lineTo(r * 0.8, -r * 0.3);
      c.lineTo(r * 0.8, r * 0.5);
      c.closePath();
      c.fillStyle = "#f5c542";
      c.fill();
      c.lineJoin = "round";
      c.lineWidth = r * 0.07;
      c.strokeStyle = "#c8901a";
      c.stroke();
      c.fillStyle = "#e8506a";
      [-0.8, 0, 0.8].forEach((x) => {
        c.beginPath();
        c.arc(r * x, x === 0 ? -r * 0.5 : -r * 0.3, r * 0.09, 0, Math.PI * 2);
        c.fill();
      });
    },
  },
  {
    id: "note",
    zh: "音符",
    en: "Music note",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#2f7fd1";
      c.strokeStyle = "#2f7fd1";
      c.beginPath();
      c.ellipse(-r * 0.3, r * 0.55, r * 0.36, r * 0.26, -0.4, 0, Math.PI * 2);
      c.fill();
      c.lineWidth = r * 0.12;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(r * 0.02, r * 0.45);
      c.lineTo(r * 0.02, -r * 0.75);
      c.quadraticCurveTo(r * 0.2, -r * 0.4, r * 0.62, -r * 0.35);
      c.stroke();
    },
  },
  {
    id: "leaf",
    zh: "葉子",
    en: "Leaf",
    animated: false,
    draw: (c, r) => {
      c.beginPath();
      c.moveTo(0, r * 0.9);
      c.bezierCurveTo(-r * 0.9, r * 0.3, -r * 0.7, -r * 0.7, 0, -r * 0.9);
      c.bezierCurveTo(r * 0.7, -r * 0.7, r * 0.9, r * 0.3, 0, r * 0.9);
      c.fillStyle = "#4caf6a";
      c.fill();
      c.strokeStyle = "#2f8a4c";
      c.lineWidth = r * 0.06;
      c.beginPath();
      c.moveTo(0, r * 0.9);
      c.lineTo(0, -r * 0.6);
      c.stroke();
    },
  },
  {
    id: "heartbeat",
    zh: "跳動愛心",
    en: "Heartbeat",
    animated: true,
    draw: (c, r, t) => {
      const beat = Math.pow(Math.max(0, Math.sin(t * 5)), 6);
      heart(c, r * (0.9 + 0.2 * beat));
    },
  },
  {
    id: "twinkle",
    zh: "閃爍星光",
    en: "Twinkle",
    animated: true,
    draw: (c, r, t) => {
      c.save();
      c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4);
      c.rotate(Math.sin(t * 1.5) * 0.3);
      star(c, r * (0.85 + 0.15 * Math.sin(t * 4)));
      c.restore();
      c.fillStyle = "#fff6cc";
      for (let i = 0; i < 3; i++) {
        const a = Math.pow(Math.max(0, Math.sin(t * 3 + i * 2.1)), 3);
        c.globalAlpha = a;
        c.beginPath();
        c.arc(Math.cos(i * 2.1) * r * 0.95, Math.sin(i * 2.1) * r * 0.95, r * 0.08, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    },
  },
  {
    id: "spinflower",
    zh: "旋轉花朵",
    en: "Spinning flower",
    animated: true,
    draw: (c, r, t) => flower(c, r * (0.92 + 0.08 * Math.sin(t * 2)), t * 1.2),
  },
  {
    id: "balloon",
    zh: "飄浮氣球",
    en: "Balloon",
    animated: true,
    draw: (c, r, t) => {
      const bob = Math.sin(t * 2) * r * 0.08;
      c.strokeStyle = "#8a96a8";
      c.lineWidth = r * 0.03;
      c.beginPath();
      c.moveTo(0, r * 0.55 + bob);
      c.quadraticCurveTo(Math.sin(t * 3) * r * 0.2, r * 0.8, 0, r * 1.0);
      c.stroke();
      c.fillStyle = "#e8506a";
      c.beginPath();
      c.ellipse(0, -r * 0.2 + bob, r * 0.55, r * 0.7, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(0, r * 0.5 + bob);
      c.lineTo(-r * 0.1, r * 0.62 + bob);
      c.lineTo(r * 0.1, r * 0.62 + bob);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.4)";
      c.beginPath();
      c.ellipse(-r * 0.2, -r * 0.45 + bob, r * 0.12, r * 0.2, -0.5, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: "bubbles",
    zh: "上升泡泡",
    en: "Bubbles",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.25 + i / 6) % 1;
        const y = r * 0.9 - p * r * 1.8;
        const x = Math.sin(t * 2 + i * 2) * r * 0.25 + (i - 2.5) * r * 0.28;
        const rad = r * (0.12 + 0.1 * (((i * 37) % 5) / 5));
        c.globalAlpha = Math.sin(p * Math.PI);
        c.fillStyle = "rgba(160,215,245,0.3)";
        c.strokeStyle = "#5fb3e6";
        c.lineWidth = r * 0.04;
        c.beginPath();
        c.arc(x, y, rad, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.globalAlpha = 1;
    },
  },
  {
    id: "confetti",
    zh: "彩帶紛飛",
    en: "Confetti",
    animated: true,
    draw: (c, r, t) => {
      const colors = ["#e8506a", "#f5c542", "#2f7fd1", "#4caf6a", "#f0703c"];
      for (let i = 0; i < 16; i++) {
        const p = (t * 0.35 + i * 0.37) % 1;
        const x = (((i * 53) % 100) / 100 - 0.5) * r * 1.8 + Math.sin(t * 3 + i) * r * 0.06;
        const y = -r + p * 2 * r;
        c.save();
        c.translate(x, y);
        c.rotate(t * 3 + i);
        c.globalAlpha = Math.sin(p * Math.PI);
        c.fillStyle = colors[i % colors.length];
        c.fillRect(-r * 0.06, -r * 0.1, r * 0.12, r * 0.2);
        c.restore();
      }
      c.globalAlpha = 1;
    },
  },
  {
    id: "sunhat",
    zh: "遮陽帽",
    en: "Sun hat",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.fillStyle = "#e9c46a";
      c.strokeStyle = "#b8862a";
      c.lineWidth = r * 0.05;
      c.beginPath();
      c.ellipse(0, r * 0.25, r * 1.0, r * 0.3, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(-r * 0.5, r * 0.2);
      c.quadraticCurveTo(-r * 0.5, -r * 0.7, 0, -r * 0.7);
      c.quadraticCurveTo(r * 0.5, -r * 0.7, r * 0.5, r * 0.2);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#e8506a";
      c.fillRect(-r * 0.5, -r * 0.05, r, r * 0.16);
    },
  },
  {
    id: "beanie",
    zh: "毛帽",
    en: "Beanie",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.fillStyle = "#2f7fd1";
      c.beginPath();
      c.arc(0, r * 0.1, r * 0.75, Math.PI, Math.PI * 2);
      c.closePath();
      c.fill();
      c.fillStyle = "#1f5fa6";
      c.fillRect(-r * 0.8, r * 0.05, r * 1.6, r * 0.28);
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(0, -r * 0.7, r * 0.16, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: "glasses",
    zh: "眼鏡",
    en: "Glasses",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.strokeStyle = "#2b2b33";
      c.lineWidth = r * 0.09;
      c.fillStyle = "rgba(190,225,255,0.25)";
      for (const s of [-1, 1]) {
        c.beginPath();
        c.arc(s * r * 0.5, 0, r * 0.38, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.beginPath();
      c.moveTo(-r * 0.12, -r * 0.05);
      c.quadraticCurveTo(0, -r * 0.2, r * 0.12, -r * 0.05);
      c.stroke();
    },
  },
  {
    id: "sunglasses",
    zh: "墨鏡",
    en: "Sunglasses",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.fillStyle = "#15161c";
      for (const s of [-1, 1]) {
        c.beginPath();
        c.roundRect(s * r * 0.5 - r * 0.4, -r * 0.28, r * 0.8, r * 0.5, r * 0.18);
        c.fill();
      }
      c.fillRect(-r * 0.12, -r * 0.18, r * 0.24, r * 0.07);
      c.fillStyle = "rgba(255,255,255,0.3)";
      c.fillRect(-r * 0.8, -r * 0.2, r * 0.22, r * 0.07);
    },
  },
  {
    id: "necklace",
    zh: "項鍊",
    en: "Necklace",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.strokeStyle = "#d9b44a";
      c.lineWidth = r * 0.05;
      c.beginPath();
      c.arc(0, -r * 0.3, r * 0.8, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
      c.fillStyle = "#e8506a";
      c.beginPath();
      c.arc(0, r * 0.48, r * 0.14, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#d9b44a";
      c.stroke();
    },
  },
  {
    id: "earrings",
    zh: "耳環",
    en: "Earrings",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      for (const s of [-1, 1]) {
        c.strokeStyle = "#d9b44a";
        c.lineWidth = r * 0.05;
        c.beginPath();
        c.moveTo(s * r * 0.7, -r * 0.4);
        c.lineTo(s * r * 0.7, 0);
        c.stroke();
        c.fillStyle = "#6fd0e8";
        c.beginPath();
        c.moveTo(s * r * 0.7, r * 0.55);
        c.lineTo(s * r * 0.55, r * 0.15);
        c.lineTo(s * r * 0.85, r * 0.15);
        c.closePath();
        c.fill();
      }
    },
  },
  {
    id: "bowtie",
    zh: "領結",
    en: "Bow tie",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.fillStyle = "#e8506a";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-r * 0.8, -r * 0.4);
      c.lineTo(-r * 0.8, r * 0.4);
      c.closePath();
      c.moveTo(0, 0);
      c.lineTo(r * 0.8, -r * 0.4);
      c.lineTo(r * 0.8, r * 0.4);
      c.closePath();
      c.fill();
      c.fillStyle = "#b8344d";
      c.beginPath();
      c.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: "scarf",
    zh: "圍巾",
    en: "Scarf",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.fillStyle = "#f0703c";
      c.beginPath();
      c.roundRect(-r * 0.9, -r * 0.25, r * 1.8, r * 0.4, r * 0.18);
      c.fill();
      c.fillRect(r * 0.2, r * 0.05, r * 0.32, r * 0.8);
      c.fillStyle = "#f5c542";
      for (let i = 0; i < 3; i++) c.fillRect(r * 0.2, r * 0.2 + i * r * 0.2, r * 0.32, r * 0.07);
    },
  },
  {
    id: "shoes",
    zh: "鞋子",
    en: "Shoes",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * r * 0.45, 0);
        c.scale(s, 1);
        c.fillStyle = "#e8506a";
        c.beginPath();
        c.moveTo(-r * 0.25, -r * 0.4);
        c.lineTo(r * 0.1, -r * 0.4);
        c.quadraticCurveTo(r * 0.15, 0, r * 0.5, r * 0.1);
        c.lineTo(r * 0.5, r * 0.35);
        c.lineTo(-r * 0.25, r * 0.35);
        c.closePath();
        c.fill();
        c.fillStyle = "#ffffff";
        c.fillRect(-r * 0.25, r * 0.28, r * 0.75, r * 0.12);
        c.restore();
      }
    },
  },
  {
    id: "socks",
    zh: "襪子",
    en: "Socks",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * r * 0.4, 0);
        c.fillStyle = "#ffffff";
        c.strokeStyle = "#bcd3ea";
        c.lineWidth = r * 0.04;
        c.beginPath();
        c.moveTo(-r * 0.2, -r * 0.7);
        c.lineTo(r * 0.2, -r * 0.7);
        c.lineTo(r * 0.2, r * 0.1);
        c.quadraticCurveTo(r * 0.55, r * 0.15, r * 0.5, r * 0.5);
        c.lineTo(-r * 0.2, r * 0.5);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#2f7fd1";
        c.fillRect(-r * 0.2, -r * 0.7, r * 0.4, r * 0.14);
        c.restore();
      }
    },
  },
  {
    id: "ribbon",
    zh: "蝴蝶結",
    en: "Hair bow",
    animated: false,
    cat: "wear",
    draw: (c, r) => {
      c.fillStyle = "#f58fa6";
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(s * r * 0.5, -r * 0.8, s * r * 0.9, -r * 0.2);
        c.quadraticCurveTo(s * r * 0.9, r * 0.5, 0, 0);
        c.fill();
      }
      c.fillStyle = "#e8506a";
      c.beginPath();
      c.arc(0, 0, r * 0.17, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: "tree",
    zh: "大樹",
    en: "Tree",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.fillStyle = "#8a5a3c";
      c.fillRect(-r * 0.1, r * 0.1, r * 0.2, r * 0.85);
      c.fillStyle = "#3f9d5a";
      for (const [x, y, k] of [[-0.35, -0.1, 0.45], [0.35, -0.1, 0.45], [0, -0.45, 0.5], [0, 0, 0.5]] as number[][]) {
        c.beginPath();
        c.arc(x * r, y * r, k * r, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  {
    id: "pine",
    zh: "松樹",
    en: "Pine tree",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.fillStyle = "#8a5a3c";
      c.fillRect(-r * 0.09, r * 0.6, r * 0.18, r * 0.35);
      c.fillStyle = "#2f8a4c";
      for (let i = 0; i < 3; i++) {
        const y = -r * 0.85 + i * r * 0.5;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(r * (0.4 + i * 0.18), y + r * 0.7);
        c.lineTo(-r * (0.4 + i * 0.18), y + r * 0.7);
        c.closePath();
        c.fill();
      }
    },
  },
  {
    id: "grass",
    zh: "草叢",
    en: "Grass",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.strokeStyle = "#4caf6a";
      c.lineWidth = r * 0.07;
      c.lineCap = "round";
      for (let i = -4; i <= 4; i++) {
        c.beginPath();
        c.moveTo(i * r * 0.18, r * 0.6);
        c.quadraticCurveTo(i * r * 0.2, 0, i * r * 0.28, -r * (0.3 + ((i * i) % 3) * 0.12));
        c.stroke();
      }
    },
  },
  {
    id: "mountain",
    zh: "遠山",
    en: "Mountains",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.fillStyle = "#7a9fc2";
      c.beginPath();
      c.moveTo(-r, r * 0.6);
      c.lineTo(-r * 0.3, -r * 0.5);
      c.lineTo(r * 0.2, r * 0.6);
      c.closePath();
      c.fill();
      c.fillStyle = "#5d86ac";
      c.beginPath();
      c.moveTo(-r * 0.2, r * 0.6);
      c.lineTo(r * 0.4, -r * 0.2);
      c.lineTo(r, r * 0.6);
      c.closePath();
      c.fill();
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.moveTo(-r * 0.3, -r * 0.5);
      c.lineTo(-r * 0.45, -r * 0.2);
      c.lineTo(-r * 0.15, -r * 0.2);
      c.closePath();
      c.fill();
    },
  },
  {
    id: "flowerbed",
    zh: "花叢",
    en: "Flower bed",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.strokeStyle = "#3f9d5a";
      c.lineWidth = r * 0.05;
      const cols = ["#f58fa6", "#f5c542", "#ffffff", "#e8506a"];
      for (let i = -2; i <= 2; i++) {
        const x = i * r * 0.38;
        const h = r * (0.1 + (((i + 2) * 37) % 5) * 0.12);
        c.beginPath();
        c.moveTo(x, r * 0.7);
        c.lineTo(x, -h);
        c.stroke();
        c.fillStyle = cols[(i + 2) % cols.length];
        c.beginPath();
        c.arc(x, -h, r * 0.17, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#f5c542";
        c.beginPath();
        c.arc(x, -h, r * 0.06, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  {
    id: "rainbow",
    zh: "彩虹",
    en: "Rainbow",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      const cols = ["#e8506a", "#f0703c", "#f5c542", "#4caf6a", "#2f7fd1"];
      c.lineWidth = r * 0.1;
      cols.forEach((col, i) => {
        c.strokeStyle = col;
        c.beginPath();
        c.arc(0, r * 0.5, r * (0.95 - i * 0.12), Math.PI, Math.PI * 2);
        c.stroke();
      });
    },
  },
  {
    id: "fallingleaves",
    zh: "落葉飄飄",
    en: "Falling leaves",
    animated: true,
    cat: "scene",
    draw: (c, r, t) => {
      const cols = ["#f0703c", "#f5c542", "#c8581c", "#8bb04a"];
      for (let i = 0; i < 9; i++) {
        const p = (t * 0.2 + i * 0.113) % 1;
        const x = (((i * 47) % 100) / 100 - 0.5) * r * 1.8 + Math.sin(t * 2 + i) * r * 0.15;
        const y = -r + p * 2 * r;
        c.save();
        c.translate(x, y);
        c.rotate(Math.sin(t * 2 + i) * 1.2 + i);
        c.globalAlpha = Math.sin(p * Math.PI);
        c.fillStyle = cols[i % cols.length];
        c.beginPath();
        c.ellipse(0, 0, r * 0.1, r * 0.17, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      c.globalAlpha = 1;
    },
  },
  {
    id: "butterflies",
    zh: "蝴蝶飛舞",
    en: "Butterflies",
    animated: true,
    cat: "scene",
    draw: (c, r, t) => {
      for (let i = 0; i < 3; i++) {
        const x = Math.sin(t * 0.9 + i * 2.1) * r * 0.7;
        const y = Math.cos(t * 1.3 + i * 1.7) * r * 0.5;
        const flap = Math.abs(Math.sin(t * 10 + i));
        c.save();
        c.translate(x, y);
        c.fillStyle = ["#f5c542", "#f58fa6", "#6fd0e8"][i];
        for (const s of [-1, 1]) {
          c.beginPath();
          c.ellipse(s * r * 0.12 * flap, 0, r * 0.14 * (0.3 + flap), r * 0.12, s * 0.5, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#2b2b33";
        c.fillRect(-r * 0.015, -r * 0.1, r * 0.03, r * 0.2);
        c.restore();
      }
    },
  },
  {
    id: "birds",
    zh: "飛鳥",
    en: "Birds",
    animated: true,
    cat: "scene",
    draw: (c, r, t) => {
      c.strokeStyle = "#2b2b33";
      c.lineWidth = r * 0.04;
      c.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const x = (((t * 0.15 + i * 0.3) % 1) - 0.5) * r * 2.2;
        const y = -r * 0.3 + i * r * 0.28 + Math.sin(t * 2 + i) * r * 0.05;
        const w = Math.sin(t * 9 + i) * r * 0.1;
        c.beginPath();
        c.moveTo(x - r * 0.2, y - w);
        c.quadraticCurveTo(x - r * 0.08, y - r * 0.1, x, y);
        c.quadraticCurveTo(x + r * 0.08, y - r * 0.1, x + r * 0.2, y - w);
        c.stroke();
      }
    },
  },
  {
    id: "swayflowers",
    zh: "隨風花草",
    en: "Swaying flowers",
    animated: true,
    cat: "scene",
    draw: (c, r, t) => {
      const cols = ["#f58fa6", "#f5c542", "#ffffff"];
      for (let i = -2; i <= 2; i++) {
        const sway = Math.sin(t * 2.2 + i) * r * 0.12;
        const h = r * (0.5 + (((i + 2) * 31) % 4) * 0.12);
        c.strokeStyle = "#3f9d5a";
        c.lineWidth = r * 0.05;
        c.beginPath();
        c.moveTo(i * r * 0.36, r * 0.7);
        c.quadraticCurveTo(i * r * 0.36, r * 0.7 - h * 0.5, i * r * 0.36 + sway, r * 0.7 - h);
        c.stroke();
        c.fillStyle = cols[(i + 2) % cols.length];
        c.beginPath();
        c.arc(i * r * 0.36 + sway, r * 0.7 - h, r * 0.15, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  {
    id: "sakura",
    zh: "櫻花樹",
    en: "Cherry tree",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.fillStyle = "#7a4a2e";
      c.fillRect(-r * 0.08, 0, r * 0.16, r * 0.8);
      c.fillStyle = "#f7b7c6";
      for (const [x, y, k] of [[-0.35, -0.1, 0.4], [0.35, -0.1, 0.4], [0, -0.45, 0.46], [-0.15, 0.05, 0.38], [0.2, 0.05, 0.36]]) {
        c.beginPath();
        c.arc(x * r, y * r, k * r, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  {
    id: "palm",
    zh: "椰子樹",
    en: "Palm tree",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.strokeStyle = "#8a5a36";
      c.lineWidth = r * 0.14;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-r * 0.1, r * 0.8);
      c.quadraticCurveTo(r * 0.15, r * 0.1, 0, -r * 0.35);
      c.stroke();
      c.strokeStyle = "#2e9e6b";
      c.lineWidth = r * 0.09;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.55;
        c.beginPath();
        c.moveTo(0, -r * 0.35);
        c.quadraticCurveTo(Math.cos(a) * r * 0.5, -r * 0.35 + Math.sin(a) * r * 0.5 - r * 0.1, Math.cos(a) * r * 0.75, -r * 0.35 + Math.sin(a) * r * 0.5 + r * 0.25);
        c.stroke();
      }
    },
  },
  {
    id: "cactus",
    zh: "仙人掌",
    en: "Cactus",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.fillStyle = "#3f9d5a";
      c.beginPath();
      c.roundRect(-r * 0.14, -r * 0.6, r * 0.28, r * 1.4, r * 0.14);
      c.roundRect(-r * 0.5, -r * 0.2, r * 0.24, r * 0.5, r * 0.12);
      c.roundRect(r * 0.26, -r * 0.35, r * 0.24, r * 0.5, r * 0.12);
      c.fill();
      c.fillRect(-r * 0.5, r * 0.15, r * 0.4, r * 0.15);
      c.fillRect(r * 0.1, r * 0.0, r * 0.4, r * 0.15);
    },
  },
  {
    id: "sunflower",
    zh: "向日葵",
    en: "Sunflower",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.strokeStyle = "#3f9d5a";
      c.lineWidth = r * 0.07;
      c.beginPath();
      c.moveTo(0, r * 0.8);
      c.lineTo(0, r * 0.1);
      c.stroke();
      c.fillStyle = "#f5c542";
      for (let i = 0; i < 14; i++) {
        c.save();
        c.rotate((i * Math.PI * 2) / 14);
        c.beginPath();
        c.ellipse(0, -r * 0.4, r * 0.09, r * 0.22, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      c.fillStyle = "#7a4a2e";
      c.beginPath();
      c.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: "tulips",
    zh: "鬱金香",
    en: "Tulips",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      const cols = ["#e5484d", "#f5c542", "#e2557a"];
      for (let i = -1; i <= 1; i++) {
        c.strokeStyle = "#3f9d5a";
        c.lineWidth = r * 0.06;
        c.beginPath();
        c.moveTo(i * r * 0.4, r * 0.8);
        c.lineTo(i * r * 0.4, r * 0.05 + Math.abs(i) * r * 0.15);
        c.stroke();
        c.fillStyle = cols[i + 1];
        c.beginPath();
        const y = -r * 0.05 + Math.abs(i) * r * 0.15;
        c.moveTo(i * r * 0.4 - r * 0.18, y - r * 0.2);
        c.quadraticCurveTo(i * r * 0.4 - r * 0.2, y + r * 0.2, i * r * 0.4, y + r * 0.22);
        c.quadraticCurveTo(i * r * 0.4 + r * 0.2, y + r * 0.2, i * r * 0.4 + r * 0.18, y - r * 0.2);
        c.lineTo(i * r * 0.4 + r * 0.08, y - r * 0.05);
        c.lineTo(i * r * 0.4, y - r * 0.22);
        c.lineTo(i * r * 0.4 - r * 0.08, y - r * 0.05);
        c.closePath();
        c.fill();
      }
    },
  },
  {
    id: "mushrooms",
    zh: "蘑菇",
    en: "Mushrooms",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      for (const [x, y, k] of [[-0.3, 0.2, 0.8], [0.3, 0.4, 0.55]]) {
        c.fillStyle = "#f6eede";
        c.fillRect(x * r - r * 0.1 * k, y * r, r * 0.2 * k, r * 0.4 * k);
        c.fillStyle = "#e5484d";
        c.beginPath();
        c.ellipse(x * r, y * r, r * 0.4 * k, r * 0.3 * k, 0, Math.PI, 0);
        c.fill();
        c.fillStyle = "#ffffff";
        for (const dx of [-0.18, 0, 0.18]) {
          c.beginPath();
          c.arc((x + dx) * r, y * r - r * 0.12 * k, r * 0.05 * k, 0, Math.PI * 2);
          c.fill();
        }
      }
    },
  },
  {
    id: "bush",
    zh: "灌木叢",
    en: "Bush",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      const cols = ["#2e8b57", "#3f9d5a", "#5cb676"];
      [[-0.4, 0.3, 0.38], [0.4, 0.3, 0.38], [0, 0.1, 0.5], [-0.15, 0.4, 0.36], [0.2, 0.42, 0.34]].forEach(([x, y, k], i) => {
        c.fillStyle = cols[i % 3];
        c.beginPath();
        c.arc(x * r, y * r, k * r, 0, Math.PI * 2);
        c.fill();
      });
    },
  },
  {
    id: "bamboo",
    zh: "竹林",
    en: "Bamboo",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      [-0.4, 0, 0.4].forEach((x, i) => {
        c.fillStyle = i === 1 ? "#5cb676" : "#3f9d5a";
        c.fillRect(x * r - r * 0.07, -r * 0.9, r * 0.14, r * 1.8);
        c.fillStyle = "#2a7a44";
        for (let k = -3; k <= 3; k++) c.fillRect(x * r - r * 0.09, k * r * 0.25 + i * r * 0.06, r * 0.18, r * 0.03);
      });
    },
  },
  {
    id: "lotus",
    zh: "荷花",
    en: "Lotus",
    animated: false,
    cat: "scene",
    draw: (c, r) => {
      c.fillStyle = "#2e8b57";
      c.beginPath();
      c.ellipse(0, r * 0.35, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#f7b7c6";
      for (let i = -2; i <= 2; i++) {
        c.save();
        c.translate(0, r * 0.3);
        c.rotate(i * 0.4);
        c.beginPath();
        c.ellipse(0, -r * 0.3, r * 0.14, r * 0.34, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    },
  },
  {
    id: "sakurapetals",
    zh: "櫻花飄落",
    en: "Falling petals",
    animated: true,
    cat: "scene",
    draw: (c, r, t) => {
      c.fillStyle = "#f7b7c6";
      for (let i = 0; i < 14; i++) {
        const p = (t * 0.16 + i * 0.071) % 1;
        const x = (((i * 37) % 100) / 100 - 0.5) * r * 1.9 + Math.sin(t * 1.6 + i) * r * 0.2;
        c.save();
        c.translate(x, -r + p * 2 * r);
        c.rotate(t * 1.5 + i);
        c.globalAlpha = Math.sin(p * Math.PI);
        c.beginPath();
        c.ellipse(0, 0, r * 0.05, r * 0.09, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      c.globalAlpha = 1;
    },
  },
  {
    id: "fireflies",
    zh: "螢火蟲",
    en: "Fireflies",
    animated: true,
    cat: "scene",
    draw: (c, r, t) => {
      for (let i = 0; i < 12; i++) {
        const x = Math.sin(t * 0.5 + i * 1.7) * r * 0.85;
        const y = Math.cos(t * 0.7 + i * 2.3) * r * 0.7;
        soft(c, x, y, r * 0.09, "255,240,120", 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)));
      }
    },
  },
  {
    id: "driftcloud",
    zh: "雲飄",
    en: "Drifting clouds",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.04 * (1 + i * 0.3) + i * 0.37) % 1;
        const x = (p - 0.5) * r * 2.8;
        const y = (-0.55 + i * 0.45) * r;
        const a = Math.sin(p * Math.PI) * 0.9;
        for (const [dx, dy, k] of [[-0.3, 0.05, 0.3], [0, -0.08, 0.38], [0.3, 0.04, 0.3], [0.1, 0.1, 0.3]]) {
          soft(c, x + dx * r, y + dy * r, k * r, "255,255,255", a);
        }
      }
    },
  },
  {
    id: "fog",
    zh: "飛霧",
    en: "Drifting fog",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      for (let i = 0; i < 7; i++) {
        const p = (t * 0.05 + i / 7) % 1;
        const x = (p - 0.5) * r * 2.6;
        const y = (((i * 53) % 100) / 100 - 0.5) * r * 1.4;
        soft(c, x, y, r * 0.55, "235,240,245", 0.38 * Math.sin(p * Math.PI));
      }
    },
  },
  {
    id: "mountainmist",
    zh: "山嵐",
    en: "Mountain mist",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.03 + i / 6) % 1;
        const x = (p - 0.5) * r * 2.4;
        const y = r * 0.15 + Math.sin(t * 0.5 + i) * r * 0.08 + (i % 2) * r * 0.25;
        c.save();
        c.translate(x, y);
        c.scale(2.6, 0.7);
        soft(c, 0, 0, r * 0.35, "225,238,238", 0.5 * Math.sin(p * Math.PI));
        c.restore();
      }
    },
  },
  {
    id: "steam",
    zh: "蒸氣",
    en: "Steam",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      for (let i = 0; i < 9; i++) {
        const p = (t * 0.3 + i / 9) % 1;
        const x = Math.sin(t * 2 + i * 1.3) * r * 0.18 * p;
        const y = r * 0.7 - p * r * 1.5;
        soft(c, x, y, r * (0.1 + 0.28 * p), "245,245,245", 0.45 * (1 - p));
      }
    },
  },
  {
    id: "firebreath",
    zh: "噴火",
    en: "Fire breath",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      c.globalCompositeOperation = "lighter";
      for (let i = 0; i < 28; i++) {
        const p = (t * 0.9 + i / 28) % 1;
        const x = -r * 0.85 + p * r * 1.8;
        const y = Math.sin(i * 7.1) * r * 0.28 * p - p * p * r * 0.1;
        const col = p < 0.35 ? "255,230,120" : p < 0.7 ? "255,140,50" : "220,60,40";
        soft(c, x, y, r * (0.07 + 0.2 * p), col, 0.75 * (1 - p));
      }
      c.globalCompositeOperation = "source-over";
    },
  },
  {
    id: "smallflame",
    zh: "小火焰",
    en: "Small flame",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      soft(c, 0, r * 0.35, r * 0.7, "255,170,60", 0.25);
      flame(c, 0, r * 0.75, r * 1.2, r * 0.35, t, 0);
    },
  },
  {
    id: "bonfire",
    zh: "營火",
    en: "Bonfire",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      soft(c, 0, r * 0.2, r * 1.0, "255,150,50", 0.25);
      c.fillStyle = "#6b4026";
      c.save();
      c.translate(0, r * 0.75);
      for (const a of [-0.35, 0.35]) {
        c.save();
        c.rotate(a);
        c.fillRect(-r * 0.6, -r * 0.05, r * 1.2, r * 0.12);
        c.restore();
      }
      c.restore();
      flame(c, -r * 0.3, r * 0.75, r * 0.9, r * 0.3, t, 1);
      flame(c, r * 0.3, r * 0.75, r * 0.8, r * 0.28, t, 3);
      flame(c, 0, r * 0.75, r * 1.4, r * 0.4, t, 2);
    },
  },
  {
    id: "smoke",
    zh: "輕煙",
    en: "Smoke",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      for (let i = 0; i < 9; i++) {
        const p = (t * 0.22 + i / 9) % 1;
        const x = Math.sin(t * 1.4 + i) * r * 0.25 * p;
        soft(c, x, r * 0.7 - p * r * 1.5, r * (0.1 + 0.3 * p), "90,90,100", 0.4 * (1 - p));
      }
    },
  },
  {
    id: "rain",
    zh: "下雨",
    en: "Rain",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      c.strokeStyle = "rgba(190,215,255,0.8)";
      c.lineWidth = Math.max(1, r * 0.012);
      for (let i = 0; i < 40; i++) {
        const p = (t * 1.4 + i * 0.137) % 1;
        const x = (((i * 61) % 100) / 100 - 0.5) * r * 2;
        const y = -r + p * 2 * r;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - r * 0.03, y + r * 0.12);
        c.stroke();
      }
    },
  },
  {
    id: "snowfall",
    zh: "飄雪",
    en: "Snowfall",
    animated: true,
    cat: "atmo",
    draw: (c, r, t) => {
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 30; i++) {
        const p = (t * 0.18 + i * 0.097) % 1;
        const x = (((i * 43) % 100) / 100 - 0.5) * r * 2 + Math.sin(t + i) * r * 0.08;
        c.beginPath();
        c.arc(x, -r + p * 2 * r, r * (0.015 + ((i * 7) % 4) * 0.01), 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  ...EXTRA_STICKERS,
  ...REAL3D_STICKERS,
];

export const STICKER_MAP: Record<string, StickerDef> = Object.fromEntries(STICKERS.map((s) => [s.id, s]));

export function drawStickers(ctx: CanvasRenderingContext2D, items: StickerItem[], t: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  for (const it of items) {
    const def = STICKER_MAP[it.kind];
    if (!def || t < it.start || t > it.end) continue;
    const a = clamp((t - it.start) / 0.3, 0, 1) * clamp((it.end - t) / 0.3, 0, 1);
    ctx.save();
    ctx.filter = "none";
    ctx.globalAlpha = a * clamp(it.alpha ?? 1, 0, 1);
    ctx.translate(it.x * W, it.y * H);
    if (it.rot) ctx.rotate((it.rot * Math.PI) / 180);
    if (it.sx !== undefined || it.sy !== undefined) ctx.scale(clamp(it.sx ?? 1, 0.2, 4), clamp(it.sy ?? 1, 0.2, 4));
    def.draw(ctx, ((it.size / 100) * W) / 2, t - it.start);
    ctx.restore();
  }
}
