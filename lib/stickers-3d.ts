import type { StickerDef } from "@/lib/stickers";

type C = CanvasRenderingContext2D;
type Tone = [string, string, string];
type Pt = [number, number];

const TAU = Math.PI * 2;

const RED: Tone = ["#ffa3a3", "#e5303f", "#8f1020"];
const PINK: Tone = ["#ffc9db", "#ff5c8a", "#a8264f"];
const BLUE: Tone = ["#b4e1ff", "#2f8fe6", "#124a94"];
const GREEN: Tone = ["#c1f5b4", "#3fb85a", "#1b6b34"];
const GOLD: Tone = ["#fff3b0", "#f2b81f", "#9a6a05"];
const WHITE: Tone = ["#ffffff", "#e4ecf6", "#9fb0c6"];
const ORANGE: Tone = ["#ffd7a8", "#ff8a2a", "#a84a05"];
const PURPLE: Tone = ["#e2d2ff", "#8a5be0", "#47248f"];
const TEAL: Tone = ["#b0f2ec", "#22b8aa", "#0d6a62"];
const BROWN: Tone = ["#e0b48a", "#a8693a", "#5c3416"];
const YELLOW: Tone = ["#fff9bd", "#ffd93d", "#b08a00"];
const GRAY: Tone = ["#f0f2f6", "#aab2c0", "#5b6372"];

const CANDY = [RED, PINK, BLUE, GREEN, GOLD, ORANGE, PURPLE, TEAL];

function lg(c: C, x0: number, y0: number, x1: number, y1: number, t: Tone) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, t[0]);
  g.addColorStop(0.5, t[1]);
  g.addColorStop(1, t[2]);
  return g;
}

function gloss(c: C, x: number, y: number, rx: number, ry: number, rot = -0.6, a = 0.6) {
  c.fillStyle = `rgba(255,255,255,${a})`;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.fill();
}

function floor(c: C, x: number, y: number, rx: number, k = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(0,0,0,${0.3 * k})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.save();
  c.translate(0, y);
  c.scale(1, 0.22);
  c.translate(0, -y);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, rx, 0, TAU);
  c.fill();
  c.restore();
}

function orb(c: C, x: number, y: number, rad: number, t: Tone) {
  const g = c.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.08, x, y, rad);
  g.addColorStop(0, t[0]);
  g.addColorStop(0.55, t[1]);
  g.addColorStop(1, t[2]);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, rad, 0, TAU);
  c.fill();
  gloss(c, x - rad * 0.32, y - rad * 0.42, rad * 0.3, rad * 0.17);
}

function glow(c: C, x: number, y: number, rad: number, rgb: string, a: number) {
  if (rad <= 0 || a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, rad, 0, TAU);
  c.fill();
}

function poly(c: C, pts: Pt[], fill: string | CanvasGradient) {
  c.fillStyle = fill;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}

function cyl(c: C, x: number, y: number, rx: number, ry: number, h: number, t: Tone, top?: Tone) {
  const g = c.createLinearGradient(x - rx, 0, x + rx, 0);
  g.addColorStop(0, t[2]);
  g.addColorStop(0.3, t[0]);
  g.addColorStop(0.6, t[1]);
  g.addColorStop(1, t[2]);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - rx, y);
  c.lineTo(x - rx, y + h);
  c.ellipse(x, y + h, rx, ry, 0, Math.PI, 0, true);
  c.lineTo(x + rx, y);
  c.closePath();
  c.fill();
  const tt = top ?? t;
  c.fillStyle = lg(c, x - rx, y - ry, x + rx, y + ry, [tt[0], tt[0], tt[1]]);
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fill();
}

function heartPath(c: C, r: number) {
  c.beginPath();
  c.moveTo(0, r * 0.85);
  c.bezierCurveTo(-r * 1.25, r * 0.1, -r * 0.9, -r * 0.95, 0, -r * 0.35);
  c.bezierCurveTo(r * 0.9, -r * 0.95, r * 1.25, r * 0.1, 0, r * 0.85);
  c.closePath();
}

function heart3d(c: C, r: number, t: Tone = RED) {
  heartPath(c, r);
  c.fillStyle = lg(c, -r, -r, r, r, t);
  c.fill();
  c.lineJoin = "round";
  c.lineWidth = r * 0.04;
  c.strokeStyle = t[2];
  c.stroke();
  gloss(c, -r * 0.45, -r * 0.35, r * 0.2, r * 0.3, -0.6);
}

function star3d(c: C, r: number, t: Tone = GOLD) {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  poly(c, pts, lg(c, -r, -r, r, r, t));
  for (let i = 0; i < 5; i++) {
    const tip = pts[i * 2];
    const left = pts[(i * 2 + 9) % 10];
    const right = pts[(i * 2 + 1) % 10];
    poly(c, [[0, 0], tip, left], "rgba(255,255,255,0.22)");
    poly(c, [[0, 0], tip, right], "rgba(0,0,0,0.18)");
  }
  c.lineJoin = "round";
  c.lineWidth = r * 0.03;
  c.strokeStyle = t[2];
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.stroke();
}

function gem3d(c: C, r: number, tones: [string, string, string, string, string, string] = ["#e6f7ff", "#9fdcff", "#5bb8f0", "#3a93d6", "#7fd0f8", "#2a73b8"]) {
  const A: Pt = [-r * 0.7, -r * 0.2];
  const B: Pt = [-r * 0.4, -r * 0.6];
  const Cc: Pt = [r * 0.4, -r * 0.6];
  const D: Pt = [r * 0.7, -r * 0.2];
  const E: Pt = [0, r * 0.78];
  const F: Pt = [-r * 0.22, -r * 0.2];
  const G: Pt = [r * 0.22, -r * 0.2];
  poly(c, [B, Cc, G, F], tones[0]);
  poly(c, [A, B, F], tones[1]);
  poly(c, [Cc, D, G], tones[4]);
  poly(c, [A, F, E], tones[2]);
  poly(c, [F, G, E], tones[3]);
  poly(c, [G, D, E], tones[5]);
  c.strokeStyle = "rgba(255,255,255,0.7)";
  c.lineWidth = r * 0.03;
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(...A);
  c.lineTo(...B);
  c.lineTo(...Cc);
  c.lineTo(...D);
  c.lineTo(...E);
  c.closePath();
  c.moveTo(...A);
  c.lineTo(...D);
  c.moveTo(...F);
  c.lineTo(...E);
  c.moveTo(...G);
  c.lineTo(...E);
  c.stroke();
}

function balloon3d(c: C, x: number, y: number, r: number, t: Tone) {
  c.strokeStyle = "rgba(110,115,128,0.8)";
  c.lineWidth = Math.max(1, r * 0.04);
  c.beginPath();
  c.moveTo(x, y + r * 1.05);
  c.quadraticCurveTo(x + r * 0.25, y + r * 1.5, x, y + r * 2);
  c.stroke();
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, t[0]);
  g.addColorStop(0.55, t[1]);
  g.addColorStop(1, t[2]);
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, y, r * 0.8, r, 0, 0, TAU);
  c.fill();
  c.fillStyle = t[2];
  c.beginPath();
  c.moveTo(x, y + r * 0.98);
  c.lineTo(x - r * 0.14, y + r * 1.18);
  c.lineTo(x + r * 0.14, y + r * 1.18);
  c.closePath();
  c.fill();
  gloss(c, x - r * 0.3, y - r * 0.4, r * 0.14, r * 0.3, 0.4);
}

function bell3d(c: C, r: number) {
  c.beginPath();
  c.moveTo(-r * 0.7, r * 0.45);
  c.bezierCurveTo(-r * 0.65, r * 0.2, -r * 0.5, -r * 0.1, -r * 0.45, -r * 0.35);
  c.bezierCurveTo(-r * 0.4, -r * 0.75, r * 0.4, -r * 0.75, r * 0.45, -r * 0.35);
  c.bezierCurveTo(r * 0.5, -r * 0.1, r * 0.65, r * 0.2, r * 0.7, r * 0.45);
  c.closePath();
  const g = c.createLinearGradient(-r * 0.7, 0, r * 0.7, 0);
  g.addColorStop(0, GOLD[2]);
  g.addColorStop(0.3, GOLD[0]);
  g.addColorStop(0.6, GOLD[1]);
  g.addColorStop(1, GOLD[2]);
  c.fillStyle = g;
  c.fill();
  orb(c, 0, r * 0.62, r * 0.17, GOLD);
  orb(c, 0, -r * 0.78, r * 0.1, GOLD);
}

function dice3d(c: C, r: number) {
  const s = r * 0.62;
  const front: Pt[] = [[-s, -s * 0.5], [s * 0.55, -s * 0.5], [s * 0.55, s * 1.1], [-s, s * 1.1]];
  poly(c, front, lg(c, -s, -s, s, s, WHITE));
  poly(c, [[s * 0.55, -s * 0.5], [s * 1.05, -s * 1.0], [s * 1.05, s * 0.6], [s * 0.55, s * 1.1]], "#b9c6d8");
  poly(c, [[-s, -s * 0.5], [-s * 0.5, -s * 1.0], [s * 1.05, -s * 1.0], [s * 0.55, -s * 0.5]], "#ffffff");
  c.fillStyle = "#2a2f3a";
  const pip = (x: number, y: number, k = 0.11) => {
    c.beginPath();
    c.arc(x, y, s * k, 0, TAU);
    c.fill();
  };
  const cx = -s * 0.225;
  const cy = s * 0.3;
  [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]].forEach(([a, b]) => pip(cx + a * s * 0.4, cy + b * s * 0.4));
  pip(s * 0.8, s * 0.05, 0.08);
  pip(s * 0.8, s * 0.55, 0.08);
  pip(s * 0.3, -s * 0.75, 0.08);
  pip(s * 0.6, -s * 0.75, 0.08);
}

function giftBox(c: C, r: number, lift = 0) {
  const f: Pt[] = [[-r * 0.55, -r * 0.1], [r * 0.35, -r * 0.1], [r * 0.35, r * 0.65], [-r * 0.55, r * 0.65]];
  poly(c, f, lg(c, -r * 0.55, 0, r * 0.35, r * 0.65, BLUE));
  poly(c, [[r * 0.35, -r * 0.1], [r * 0.65, -r * 0.3], [r * 0.65, r * 0.45], [r * 0.35, r * 0.65]], BLUE[2]);
  c.fillStyle = lg(c, -r * 0.2, 0, r * 0, r * 0.6, GOLD);
  c.fillRect(-r * 0.19, -r * 0.1, r * 0.18, r * 0.75);
  c.save();
  c.translate(0, -lift);
  poly(c, [[-r * 0.6, -r * 0.1], [-r * 0.3, -r * 0.3], [r * 0.7, -r * 0.3], [r * 0.4, -r * 0.1]], BLUE[0]);
  poly(c, [[-r * 0.19, -r * 0.1], [r * 0.01, -r * 0.1], [r * 0.31, -r * 0.3], [r * 0.11, -r * 0.3]], GOLD[1]);
  c.fillStyle = lg(c, -r * 0.3, -r * 0.6, r * 0.2, -r * 0.3, GOLD);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(r * 0.06 + s * r * 0.18, -r * 0.43, r * 0.2, r * 0.11, s * -0.5, 0, TAU);
    c.fill();
  }
  orb(c, r * 0.06, -r * 0.3, r * 0.08, GOLD);
  c.restore();
}

function cloud3d(c: C, r: number) {
  const puffs: [number, number, number][] = [[-0.5, 0.1, 0.35], [-0.2, -0.15, 0.45], [0.25, -0.05, 0.42], [0.55, 0.15, 0.3], [0, 0.2, 0.4]];
  for (const [x, y, k] of puffs) orb(c, x * r, y * r, k * r, ["#ffffff", "#e8f0fa", "#a9bdd6"]);
}

function bulb3d(c: C, r: number, on: number) {
  glow(c, 0, -r * 0.2, r * 1.1, "255,230,120", 0.55 * on);
  orb(c, 0, -r * 0.25, r * 0.55, on > 0.5 ? YELLOW : ["#f5f7fa", "#d5dae2", "#8c94a3"]);
  cyl(c, 0, r * 0.3, r * 0.26, r * 0.07, r * 0.28, GRAY);
  cyl(c, 0, r * 0.62, r * 0.18, r * 0.05, r * 0.1, GRAY);
}

function rocket3d(c: C, r: number, flame: number) {
  poly(c, [[-r * 0.5, r * 0.25], [-r * 0.2, -r * 0.1], [-r * 0.2, r * 0.5]], RED[2]);
  poly(c, [[r * 0.5, r * 0.25], [r * 0.2, -r * 0.1], [r * 0.2, r * 0.5]], RED[2]);
  c.fillStyle = "#ffb13a";
  c.beginPath();
  c.moveTo(-r * 0.14, r * 0.55);
  c.quadraticCurveTo(0, r * (0.9 + flame), r * 0.14, r * 0.55);
  c.fill();
  c.fillStyle = "#fff3b0";
  c.beginPath();
  c.moveTo(-r * 0.07, r * 0.55);
  c.quadraticCurveTo(0, r * (0.75 + flame * 0.6), r * 0.07, r * 0.55);
  c.fill();
  c.beginPath();
  c.moveTo(0, -r * 0.85);
  c.bezierCurveTo(r * 0.5, -r * 0.4, r * 0.35, r * 0.3, r * 0.25, r * 0.55);
  c.lineTo(-r * 0.25, r * 0.55);
  c.bezierCurveTo(-r * 0.35, r * 0.3, -r * 0.5, -r * 0.4, 0, -r * 0.85);
  c.closePath();
  const g = c.createLinearGradient(-r * 0.4, 0, r * 0.4, 0);
  g.addColorStop(0, "#9aa6b8");
  g.addColorStop(0.35, "#ffffff");
  g.addColorStop(1, "#8793a6");
  c.fillStyle = g;
  c.fill();
  c.beginPath();
  c.moveTo(0, -r * 0.85);
  c.bezierCurveTo(r * 0.2, -r * 0.7, r * 0.3, -r * 0.5, r * 0.32, -r * 0.35);
  c.lineTo(-r * 0.32, -r * 0.35);
  c.bezierCurveTo(-r * 0.3, -r * 0.5, -r * 0.2, -r * 0.7, 0, -r * 0.85);
  c.fillStyle = lg(c, -r * 0.3, -r * 0.8, r * 0.3, -r * 0.3, RED);
  c.fill();
  orb(c, 0, -r * 0.05, r * 0.16, BLUE);
}

const d = (id: string, zh: string, en: string, animated: boolean, draw: StickerDef["draw"]): StickerDef => ({
  id,
  zh,
  en,
  animated,
  real3d: true,
  draw,
});

export const REAL3D_STICKERS: StickerDef[] = [
  d("3d-heart", "立體愛心", "3D heart", false, (c, r) => {
    floor(c, 0, r * 0.95, r * 0.8);
    heart3d(c, r * 0.95);
  }),
  d("3d-heart-pink", "立體粉愛心", "3D pink heart", false, (c, r) => {
    floor(c, 0, r * 0.95, r * 0.8);
    heart3d(c, r * 0.95, PINK);
  }),
  d("3d-star", "立體星星", "3D star", false, (c, r) => {
    floor(c, 0, r * 0.95, r * 0.8);
    star3d(c, r * 0.95);
  }),
  d("3d-gem", "立體鑽石", "3D diamond", false, (c, r) => {
    floor(c, 0, r * 0.88, r * 0.75);
    gem3d(c, r * 0.95);
  }),
  d("3d-ruby", "立體紅寶石", "3D ruby", false, (c, r) => {
    floor(c, 0, r * 0.88, r * 0.75);
    gem3d(c, r * 0.95, ["#ffe0e4", "#ff9aa8", "#e5485f", "#b82040", "#ff7b8f", "#8a1230"]);
  }),
  d("3d-emerald", "立體翡翠", "3D emerald", false, (c, r) => {
    floor(c, 0, r * 0.88, r * 0.75);
    gem3d(c, r * 0.95, ["#e2ffe9", "#9ef0b4", "#3fc46a", "#23964a", "#6fe08f", "#136b31"]);
  }),
  d("3d-beachball", "立體海灘球", "3D beach ball", false, (c, r) => {
    floor(c, 0, r * 0.95, r * 0.75);
    const cols = ["#ff4d5e", "#ffffff", "#ffd93d", "#ffffff", "#2f8fe6", "#ffffff"];
    c.save();
    c.beginPath();
    c.arc(0, 0, r * 0.82, 0, TAU);
    c.clip();
    cols.forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, r, (i * TAU) / 6, ((i + 1) * TAU) / 6);
      c.fill();
    });
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r * 0.85);
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(0.6, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.4)");
    c.fillStyle = g;
    c.fillRect(-r, -r, r * 2, r * 2);
    c.restore();
    gloss(c, -r * 0.3, -r * 0.4, r * 0.2, r * 0.12);
  }),
  d("3d-gift", "立體禮物盒", "3D gift box", false, (c, r) => {
    floor(c, 0, r * 0.7, r * 0.9);
    giftBox(c, r);
  }),
  d("3d-balloon-red", "立體紅氣球", "3D red balloon", false, (c, r) => balloon3d(c, 0, -r * 0.25, r * 0.6, RED)),
  d("3d-balloon-blue", "立體藍氣球", "3D blue balloon", false, (c, r) => balloon3d(c, 0, -r * 0.25, r * 0.6, BLUE)),
  d("3d-balloon-trio", "立體氣球串", "3D balloon bunch", false, (c, r) => {
    balloon3d(c, -r * 0.45, -r * 0.1, r * 0.4, PINK);
    balloon3d(c, r * 0.45, -r * 0.1, r * 0.4, GOLD);
    balloon3d(c, 0, -r * 0.4, r * 0.45, BLUE);
  }),
  d("3d-cake", "立體蛋糕", "3D cake", false, (c, r) => {
    floor(c, 0, r * 0.75, r * 0.95);
    cyl(c, 0, r * 0.25, r * 0.78, r * 0.2, r * 0.45, BROWN, ["#fff3e0", "#ffe3c4", "#e0b48a"]);
    cyl(c, 0, -r * 0.15, r * 0.52, r * 0.15, r * 0.4, PINK, ["#ffffff", "#ffe3ee", "#ffb0c8"]);
    for (const x of [-0.18, 0, 0.18]) {
      cyl(c, r * x, -r * 0.4, r * 0.035, r * 0.015, r * 0.2, BLUE);
      c.fillStyle = "#ffb020";
      c.beginPath();
      c.ellipse(r * x, -r * 0.5, r * 0.035, r * 0.07, 0, 0, TAU);
      c.fill();
    }
    orb(c, 0, -r * 0.4, r * 0.1, RED);
  }),
  d("3d-crown", "立體皇冠", "3D crown", false, (c, r) => {
    floor(c, 0, r * 0.65, r * 0.9);
    c.beginPath();
    c.moveTo(-r * 0.8, r * 0.5);
    c.lineTo(-r * 0.85, -r * 0.4);
    c.lineTo(-r * 0.4, r * 0.05);
    c.lineTo(0, -r * 0.65);
    c.lineTo(r * 0.4, r * 0.05);
    c.lineTo(r * 0.85, -r * 0.4);
    c.lineTo(r * 0.8, r * 0.5);
    c.closePath();
    c.fillStyle = lg(c, -r, -r, r, r, GOLD);
    c.fill();
    c.fillStyle = "rgba(0,0,0,0.2)";
    c.fillRect(-r * 0.8, r * 0.3, r * 1.6, r * 0.2);
    orb(c, 0, -r * 0.65, r * 0.1, RED);
    orb(c, -r * 0.85, -r * 0.4, r * 0.1, BLUE);
    orb(c, r * 0.85, -r * 0.4, r * 0.1, GREEN);
    orb(c, 0, r * 0.2, r * 0.12, PINK);
  }),
  d("3d-moon", "立體月亮", "3D moon", false, (c, r) => {
    c.save();
    c.beginPath();
    c.rect(-r * 2, -r * 2, r * 4, r * 4);
    c.arc(r * 0.38, -r * 0.1, r * 0.72, 0, TAU);
    c.clip("evenodd");
    const g = c.createRadialGradient(-r * 0.4, -r * 0.3, r * 0.1, 0, 0, r * 0.9);
    g.addColorStop(0, "#fffbe0");
    g.addColorStop(0.6, "#f2d97a");
    g.addColorStop(1, "#b08a2a");
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, r * 0.85, 0, TAU);
    c.fill();
    c.restore();
  }),
  d("3d-sun", "立體太陽", "3D sun", false, (c, r) => {
    glow(c, 0, 0, r, "255,200,80", 0.5);
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12;
      poly(
        c,
        [
          [Math.cos(a - 0.12) * r * 0.55, Math.sin(a - 0.12) * r * 0.55],
          [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95],
          [Math.cos(a + 0.12) * r * 0.55, Math.sin(a + 0.12) * r * 0.55],
        ],
        i % 2 ? "#ff9f1c" : "#ffbf3d",
      );
    }
    orb(c, 0, 0, r * 0.5, YELLOW);
  }),
  d("3d-cloud", "立體雲朵", "3D cloud", false, (c, r) => cloud3d(c, r)),
  d("3d-apple", "立體蘋果", "3D apple", false, (c, r) => {
    floor(c, 0, r * 0.85, r * 0.7);
    orb(c, -r * 0.22, r * 0.05, r * 0.55, RED);
    orb(c, r * 0.22, r * 0.05, r * 0.55, RED);
    cyl(c, 0, -r * 0.62, r * 0.04, r * 0.015, r * 0.22, BROWN);
    c.beginPath();
    c.ellipse(r * 0.25, -r * 0.6, r * 0.25, r * 0.1, -0.5, 0, TAU);
    c.fillStyle = lg(c, 0, -r * 0.7, r * 0.5, -r * 0.5, GREEN);
    c.fill();
  }),
  d("3d-cherry", "立體櫻桃", "3D cherries", false, (c, r) => {
    c.strokeStyle = "#3b7d3f";
    c.lineWidth = r * 0.06;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-r * 0.4, r * 0.2);
    c.quadraticCurveTo(-r * 0.2, -r * 0.5, r * 0.15, -r * 0.8);
    c.moveTo(r * 0.4, r * 0.3);
    c.quadraticCurveTo(r * 0.3, -r * 0.4, r * 0.15, -r * 0.8);
    c.stroke();
    orb(c, -r * 0.4, r * 0.35, r * 0.38, RED);
    orb(c, r * 0.4, r * 0.45, r * 0.38, RED);
  }),
  d("3d-donut", "立體甜甜圈", "3D donut", false, (c, r) => {
    floor(c, 0, r * 0.7, r * 0.9);
    c.save();
    c.translate(0, r * 0.1);
    c.scale(1, 0.8);
    c.fillStyle = lg(c, -r, -r, r, r, ["#f2c48a", "#d9953f", "#8a5a1c"]);
    c.beginPath();
    c.arc(0, 0, r * 0.82, 0, TAU);
    c.fill();
    c.fillStyle = lg(c, -r, -r, r, r, PINK);
    c.beginPath();
    c.arc(0, -r * 0.06, r * 0.74, 0, TAU);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.3)";
    c.beginPath();
    c.ellipse(-r * 0.3, -r * 0.4, r * 0.3, r * 0.12, -0.4, 0, TAU);
    c.fill();
    c.fillStyle = "#6b3a1e";
    c.beginPath();
    c.arc(0, -r * 0.04, r * 0.26, 0, TAU);
    c.fill();
    c.fillStyle = "#3d1e0c";
    c.beginPath();
    c.arc(0, 0, r * 0.22, 0, TAU);
    c.fill();
    ["#ffffff", "#ffd93d", "#51cf66", "#4dabf7"].forEach((col, i) => {
      c.save();
      c.rotate(i * 1.6 + 0.4);
      c.fillStyle = col;
      c.fillRect(r * 0.42, -r * 0.03, r * 0.14, r * 0.05);
      c.restore();
    });
    c.restore();
  }),
  d("3d-icecream", "立體冰淇淋", "3D ice cream", false, (c, r) => {
    floor(c, 0, r * 0.95, r * 0.5);
    poly(c, [[-r * 0.42, -r * 0.05], [r * 0.42, -r * 0.05], [0, r * 0.95]], lg(c, -r * 0.4, 0, r * 0.4, r, ["#f7d9a0", "#e0a850", "#a56d1f"]));
    c.strokeStyle = "rgba(120,70,20,0.35)";
    c.lineWidth = r * 0.03;
    c.beginPath();
    c.moveTo(-r * 0.25, r * 0.15);
    c.lineTo(r * 0.25, r * 0.5);
    c.moveTo(r * 0.25, r * 0.15);
    c.lineTo(-r * 0.25, r * 0.5);
    c.stroke();
    orb(c, 0, -r * 0.1, r * 0.46, PINK);
    orb(c, 0, -r * 0.55, r * 0.38, ["#fff4d8", "#f2d9a6", "#b8924a"]);
    orb(c, r * 0.02, -r * 0.9, r * 0.09, RED);
  }),
  d("3d-mushroom", "立體蘑菇", "3D mushroom", false, (c, r) => {
    floor(c, 0, r * 0.85, r * 0.6);
    cyl(c, 0, 0, r * 0.28, r * 0.08, r * 0.8, ["#fff6e8", "#f0dcc0", "#b89a70"]);
    c.beginPath();
    c.ellipse(0, -r * 0.1, r * 0.85, r * 0.65, 0, Math.PI, 0);
    c.closePath();
    const g = c.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, -r * 0.1, r * 0.9);
    g.addColorStop(0, RED[0]);
    g.addColorStop(0.5, RED[1]);
    g.addColorStop(1, RED[2]);
    c.fillStyle = g;
    c.fill();
    for (const [x, y, k] of [[-0.4, -0.4, 0.12], [0.1, -0.55, 0.15], [0.45, -0.3, 0.1], [-0.05, -0.2, 0.08]]) {
      orb(c, r * x, r * y, r * k, WHITE);
    }
  }),
  d("3d-dice", "立體骰子", "3D dice", false, (c, r) => {
    floor(c, 0, r * 0.7, r * 0.8);
    dice3d(c, r);
  }),
  d("3d-trophy", "立體獎盃", "3D trophy", false, (c, r) => {
    floor(c, 0, r * 0.9, r * 0.6);
    cyl(c, 0, r * 0.78, r * 0.5, r * 0.1, r * 0.12, BROWN);
    cyl(c, 0, r * 0.3, r * 0.1, r * 0.03, r * 0.5, GOLD);
    c.strokeStyle = GOLD[1];
    c.lineWidth = r * 0.08;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(s * r * 0.55, -r * 0.35, r * 0.25, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : (Math.PI * 3) / 2, s < 0);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-r * 0.55, -r * 0.7);
    c.lineTo(r * 0.55, -r * 0.7);
    c.bezierCurveTo(r * 0.55, -r * 0.1, r * 0.25, r * 0.3, 0, r * 0.32);
    c.bezierCurveTo(-r * 0.25, r * 0.3, -r * 0.55, -r * 0.1, -r * 0.55, -r * 0.7);
    c.closePath();
    const g = c.createLinearGradient(-r * 0.55, 0, r * 0.55, 0);
    g.addColorStop(0, GOLD[2]);
    g.addColorStop(0.3, GOLD[0]);
    g.addColorStop(0.65, GOLD[1]);
    g.addColorStop(1, GOLD[2]);
    c.fillStyle = g;
    c.fill();
    c.save();
    c.translate(0, -r * 0.25);
    star3d(c, r * 0.22, ["#ffffff", "#fff3b0", "#f2b81f"]);
    c.restore();
  }),
  d("3d-rocket", "立體火箭", "3D rocket", false, (c, r) => rocket3d(c, r, 0.1)),
  d("3d-bulb", "立體燈泡", "3D light bulb", false, (c, r) => bulb3d(c, r, 1)),
  d("3d-planet", "立體星球", "3D planet", false, (c, r) => {
    c.save();
    c.rotate(-0.4);
    c.strokeStyle = "rgba(180,130,60,0.9)";
    c.lineWidth = r * 0.12;
    c.beginPath();
    c.ellipse(0, 0, r * 0.95, r * 0.28, 0, Math.PI, TAU);
    c.stroke();
    orb(c, 0, 0, r * 0.55, ORANGE);
    c.beginPath();
    c.ellipse(0, 0, r * 0.95, r * 0.28, 0, 0, Math.PI);
    c.stroke();
    c.restore();
  }),
  d("3d-coin", "立體金幣", "3D coin", false, (c, r) => {
    floor(c, 0, r * 0.8, r * 0.7);
    cyl(c, 0, 0, r * 0.7, r * 0.7, r * 0.12, GOLD);
    c.strokeStyle = GOLD[2];
    c.lineWidth = r * 0.04;
    c.beginPath();
    c.ellipse(0, 0, r * 0.55, r * 0.55, 0, 0, TAU);
    c.stroke();
    star3d(c, r * 0.32, ["#fff7c8", "#f7cc45", "#b8860b"]);
  }),
  d("3d-bell", "立體金鈴", "3D bell", false, (c, r) => bell3d(c, r)),
  d("3d-flower", "立體花朵", "3D flower", false, (c, r) => {
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      orb(c, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.32, i % 2 ? PINK : ["#ffe0ea", "#ff8fb0", "#c8446e"]);
    }
    orb(c, 0, 0, r * 0.28, YELLOW);
  }),
  d("3d-tree", "立體小樹", "3D tree", false, (c, r) => {
    floor(c, 0, r * 0.9, r * 0.6);
    cyl(c, 0, r * 0.1, r * 0.12, r * 0.04, r * 0.8, BROWN);
    orb(c, 0, -r * 0.1, r * 0.55, GREEN);
    orb(c, -r * 0.35, -r * 0.3, r * 0.38, GREEN);
    orb(c, r * 0.35, -r * 0.3, r * 0.38, GREEN);
    orb(c, 0, -r * 0.55, r * 0.35, GREEN);
  }),
  d("3d-snowman", "立體雪人", "3D snowman", false, (c, r) => {
    floor(c, 0, r * 0.9, r * 0.6);
    orb(c, 0, r * 0.45, r * 0.45, WHITE);
    orb(c, 0, -r * 0.15, r * 0.34, WHITE);
    cyl(c, 0, -r * 0.5, r * 0.22, r * 0.06, r * 0.1, GRAY);
    cyl(c, 0, -r * 0.78, r * 0.14, r * 0.04, r * 0.3, ["#6a727f", "#3a404c", "#1c2028"]);
    c.fillStyle = "#222";
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(s * r * 0.1, -r * 0.22, r * 0.035, 0, TAU);
      c.fill();
    }
    poly(c, [[0, -r * 0.15], [r * 0.25, -r * 0.1], [0, -r * 0.06]], "#ff8a2a");
    orb(c, 0, r * 0.3, r * 0.05, GRAY);
    orb(c, 0, r * 0.5, r * 0.05, GRAY);
  }),
  d("3d-lollipop", "立體棒棒糖", "3D lollipop", false, (c, r) => {
    cyl(c, 0, -r * 0.1, r * 0.05, r * 0.02, r * 0.95, WHITE);
    c.save();
    c.translate(0, -r * 0.35);
    c.beginPath();
    c.arc(0, 0, r * 0.52, 0, TAU);
    c.clip();
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? "#ffffff" : "#ff4d7a";
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, r, (i * TAU) / 8, ((i + 1) * TAU) / 8);
      c.fill();
    }
    const g = c.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.05, 0, 0, r * 0.55);
    g.addColorStop(0, "rgba(255,255,255,0.4)");
    g.addColorStop(0.6, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.3)");
    c.fillStyle = g;
    c.fillRect(-r, -r, r * 2, r * 2);
    c.restore();
  }),
  d("3d-pearls", "立體珍珠串", "3D pearls", false, (c, r) => {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.12 + (i * 0.76) / 8);
      orb(c, Math.cos(a) * r * 0.78, -r * 0.1 + Math.sin(a) * r * 0.7, r * 0.13, ["#ffffff", "#f5ecf0", "#c4b3bd"]);
    }
    orb(c, 0, r * 0.75, r * 0.16, PINK);
  }),

  d("3d-heart-beat", "立體跳動愛心", "3D beating heart", true, (c, r, t) => {
    const beat = Math.pow(Math.max(0, Math.sin(t * 5)), 6);
    glow(c, 0, 0, r * (1 + beat * 0.3), "255,90,110", 0.35 * beat + 0.1);
    heart3d(c, r * 0.85 * (1 + 0.18 * beat));
  }),
  d("3d-coin-spin", "立體旋轉金幣", "3D spinning coin", true, (c, r, t) => {
    const k = Math.cos(t * 3.2);
    const w = Math.max(0.08, Math.abs(k));
    c.save();
    c.scale(w, 1);
    cyl(c, 0, -r * 0.05, r * 0.7, r * 0.7, 0.0001, GOLD);
    c.strokeStyle = GOLD[2];
    c.lineWidth = r * 0.05;
    c.beginPath();
    c.arc(0, -r * 0.05, r * 0.55, 0, TAU);
    c.stroke();
    c.translate(0, -r * 0.05);
    star3d(c, r * 0.32, ["#fff7c8", "#f7cc45", "#b8860b"]);
    c.restore();
    c.fillStyle = `rgba(255,255,255,${0.6 * (1 - w)})`;
    c.fillRect(-r * 0.03, -r * 0.75, r * 0.06, r * 1.4);
  }),
  d("3d-ball-bounce", "立體彈跳球", "3D bouncing ball", true, (c, r, t) => {
    const p = Math.abs(Math.sin(t * 3.2));
    const y = r * 0.55 - p * r * 1.1;
    floor(c, 0, r * 0.95, r * (0.55 - p * 0.25), 1 - p * 0.5);
    const sq = p < 0.12 ? 1 - p * 1.2 : 1;
    c.save();
    c.translate(0, y);
    c.scale(1 / sq, sq);
    orb(c, 0, 0, r * 0.4, RED);
    c.restore();
  }),
  d("3d-star-spin", "立體旋轉星", "3D spinning star", true, (c, r, t) => {
    glow(c, 0, 0, r, "255,230,140", 0.3);
    c.save();
    c.scale(Math.max(0.2, Math.abs(Math.cos(t * 2.4))), 1);
    star3d(c, r * 0.9);
    c.restore();
  }),
  d("3d-planet-orbit", "立體星球環繞", "3D orbiting planet", true, (c, r, t) => {
    orb(c, 0, 0, r * 0.5, ORANGE);
    const a = t * 1.8;
    const x = Math.cos(a) * r * 0.85;
    const y = Math.sin(a) * r * 0.28;
    const front = Math.sin(a) > 0;
    c.strokeStyle = "rgba(255,255,255,0.25)";
    c.lineWidth = r * 0.015;
    c.beginPath();
    c.ellipse(0, 0, r * 0.85, r * 0.28, 0, 0, TAU);
    c.stroke();
    if (front) orb(c, x, y, r * 0.16, BLUE);
    else {
      c.save();
      c.globalCompositeOperation = "destination-over";
      orb(c, x, y, r * 0.12, BLUE);
      c.restore();
    }
  }),
  d("3d-balloons-float", "立體氣球升空", "3D floating balloons", true, (c, r, t) => {
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.14 + i / 4) % 1;
      balloon3d(c, (i - 1.5) * r * 0.5 + Math.sin(t * 1.4 + i) * r * 0.06, r * 0.9 - p * r * 2.3, r * 0.22, CANDY[(i * 2) % CANDY.length]);
    }
  }),
  d("3d-bulb-glow", "立體閃亮燈泡", "3D glowing bulb", true, (c, r, t) => bulb3d(c, r, 0.55 + 0.45 * Math.sin(t * 4))),
  d("3d-rocket-fly", "立體火箭升空", "3D rocket launch", true, (c, r, t) => {
    c.save();
    c.translate(Math.sin(t * 2) * r * 0.05, Math.sin(t * 3) * r * 0.06);
    c.rotate(Math.sin(t * 2) * 0.06);
    rocket3d(c, r * 0.9, 0.2 + 0.2 * Math.sin(t * 20));
    c.restore();
  }),
  d("3d-bubbles", "立體泡泡", "3D soap bubbles", true, (c, r, t) => {
    for (let i = 0; i < 9; i++) {
      const p = (t * 0.18 + i / 9) % 1;
      const x = (((i * 37) % 100) / 100 - 0.5) * r * 1.7 + Math.sin(t * 1.6 + i) * r * 0.08;
      const y = r - p * 2 * r;
      const rad = r * (0.1 + ((i * 5) % 4) * 0.04);
      const g = c.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad);
      g.addColorStop(0, "rgba(255,255,255,0.7)");
      g.addColorStop(0.7, "rgba(170,220,255,0.18)");
      g.addColorStop(1, i % 2 ? "rgba(255,150,220,0.55)" : "rgba(130,230,255,0.6)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, rad, 0, TAU);
      c.fill();
      gloss(c, x - rad * 0.4, y - rad * 0.4, rad * 0.22, rad * 0.12, -0.7, 0.9);
    }
  }),
  d("3d-hearts-rise", "立體愛心飄升", "3D rising hearts", true, (c, r, t) => {
    for (let i = 0; i < 7; i++) {
      const p = (t * 0.16 + i / 7) % 1;
      c.save();
      c.translate((((i * 43) % 100) / 100 - 0.5) * r * 1.6 + Math.sin(t * 1.8 + i) * r * 0.1, r - p * 2.1 * r);
      c.rotate(Math.sin(t * 2 + i) * 0.35);
      c.globalAlpha *= Math.min(1, Math.sin(p * Math.PI) * 1.6);
      heart3d(c, r * (0.14 + ((i * 3) % 3) * 0.05), i % 2 ? PINK : RED);
      c.restore();
    }
  }),
  d("3d-candy-rain", "立體糖果雨", "3D candy rain", true, (c, r, t) => {
    for (let i = 0; i < 12; i++) {
      const p = (t * 0.28 + i * 0.083) % 1;
      const x = (((i * 53) % 100) / 100 - 0.5) * r * 1.8;
      c.save();
      c.globalAlpha *= Math.min(1, Math.sin(p * Math.PI) * 2);
      orb(c, x, -r + p * 2 * r, r * (0.09 + ((i * 7) % 3) * 0.03), CANDY[i % CANDY.length]);
      c.restore();
    }
  }),
  d("3d-snowfall", "立體雪球飄落", "3D snowfall", true, (c, r, t) => {
    for (let i = 0; i < 16; i++) {
      const p = (t * 0.17 + i * 0.0625) % 1;
      const x = (((i * 61) % 100) / 100 - 0.5) * r * 1.9 + Math.sin(t * 1.3 + i) * r * 0.08;
      c.save();
      c.globalAlpha *= Math.min(1, Math.sin(p * Math.PI) * 2);
      orb(c, x, -r + p * 2 * r, r * (0.04 + ((i * 5) % 4) * 0.02), WHITE);
      c.restore();
    }
  }),
  d("3d-gem-shine", "立體鑽石閃耀", "3D shining diamond", true, (c, r, t) => {
    c.save();
    c.translate(0, Math.sin(t * 2.2) * r * 0.06);
    gem3d(c, r * 0.9);
    c.restore();
    for (let i = 0; i < 3; i++) {
      const k = Math.max(0, Math.sin(t * 3 + i * 2.1));
      const x = [-0.55, 0.5, 0.05][i] * r;
      const y = [-0.5, -0.35, -0.8][i] * r;
      c.fillStyle = `rgba(255,255,255,${k})`;
      c.beginPath();
      c.moveTo(x, y - r * 0.2 * k);
      c.quadraticCurveTo(x, y, x + r * 0.2 * k, y);
      c.quadraticCurveTo(x, y, x, y + r * 0.2 * k);
      c.quadraticCurveTo(x, y, x - r * 0.2 * k, y);
      c.quadraticCurveTo(x, y, x, y - r * 0.2 * k);
      c.fill();
    }
  }),
  d("3d-fireflies", "立體螢火蟲", "3D fireflies", true, (c, r, t) => {
    for (let i = 0; i < 8; i++) {
      const x = Math.sin(t * 0.7 + i * 1.9) * r * 0.8;
      const y = Math.cos(t * 0.9 + i * 2.7) * r * 0.7;
      const k = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2.5 + i * 1.3));
      glow(c, x, y, r * 0.22 * k + r * 0.05, "210,255,120", 0.85 * k);
      orb(c, x, y, r * 0.04, ["#ffffff", "#e6ff9a", "#8bc240"]);
    }
  }),
  d("3d-dice-roll", "立體滾動骰子", "3D rolling dice", true, (c, r, t) => {
    const p = Math.abs(Math.sin(t * 2.4));
    floor(c, 0, r * 0.8, r * (0.7 - p * 0.2), 1 - p * 0.5);
    c.save();
    c.translate(0, -p * r * 0.5);
    c.rotate(Math.sin(t * 2.4) * 0.5);
    dice3d(c, r * 0.9);
    c.restore();
  }),
  d("3d-bell-swing", "立體搖擺金鈴", "3D swinging bell", true, (c, r, t) => {
    c.save();
    c.translate(0, -r * 0.8);
    c.rotate(Math.sin(t * 5) * 0.35 * Math.exp(-((t % 2.4) * 0.5)) + Math.sin(t * 5) * 0.12);
    c.translate(0, r * 0.8);
    bell3d(c, r * 0.9);
    c.restore();
  }),
  d("3d-gift-pop", "立體禮物開啟", "3D opening gift", true, (c, r, t) => {
    const open = Math.max(0, Math.sin(t * 2.4));
    floor(c, 0, r * 0.7, r * 0.9);
    giftBox(c, r * 0.9, open * r * 0.35);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.35;
      const d2 = open * r * (0.5 + (i % 3) * 0.15);
      c.save();
      c.globalAlpha *= open;
      orb(c, Math.cos(a) * d2, -r * 0.4 + Math.sin(a) * d2, r * 0.06, CANDY[i % CANDY.length]);
      c.restore();
    }
  }),
  d("3d-orbs-pulse", "立體光球脈動", "3D pulsing orbs", true, (c, r, t) => {
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5 + t * 0.8;
      const k = 0.8 + 0.25 * Math.sin(t * 3 + i);
      glow(c, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.3 * k, "255,255,255", 0.25);
      orb(c, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.17 * k, CANDY[i]);
    }
    orb(c, 0, 0, r * 0.22 * (0.9 + 0.15 * Math.sin(t * 4)), GOLD);
  }),
];
