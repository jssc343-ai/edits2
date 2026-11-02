import type { StickerDef } from "@/lib/stickers";

type C = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

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

function sparkle(c: C, x: number, y: number, r: number, color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

function wing(c: C, side: number, r: number, flap: number, color: string) {
  c.save();
  c.scale(side * flap, 1);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(r * 0.4, -r * 0.25, r * 0.45, r * 0.3, -0.5, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(r * 0.32, r * 0.2, r * 0.32, r * 0.22, 0.6, 0, TAU);
  c.fill();
  c.restore();
}

const PALETTE = ["#ff6b6b", "#ffd93d", "#51cf66", "#4dabf7", "#b197fc", "#ff8fb8"];

export const EXTRA_STICKERS: StickerDef[] = [
  {
    id: "moon",
    zh: "月亮",
    en: "Moon",
    animated: false,
    draw: (c, r) => {
      c.save();
      c.beginPath();
      c.rect(-r * 2, -r * 2, r * 4, r * 4);
      c.arc(r * 0.35, -r * 0.1, r * 0.7, 0, TAU);
      c.clip("evenodd");
      c.fillStyle = "#f7e7a3";
      c.beginPath();
      c.arc(0, 0, r * 0.8, 0, TAU);
      c.fill();
      c.restore();
    },
  },
  {
    id: "rainbow",
    zh: "彩虹",
    en: "Rainbow",
    animated: false,
    draw: (c, r) => {
      const cols = ["#ff5d5d", "#ff9f43", "#ffd93d", "#51cf66", "#4dabf7", "#845ef7"];
      c.lineWidth = r * 0.1;
      cols.forEach((col, i) => {
        c.strokeStyle = col;
        c.beginPath();
        c.arc(0, r * 0.4, r * (0.85 - i * 0.1), Math.PI, TAU);
        c.stroke();
      });
    },
  },
  {
    id: "butterfly",
    zh: "蝴蝶",
    en: "Butterfly",
    animated: false,
    draw: (c, r) => {
      wing(c, 1, r, 1, "#f58fa6");
      wing(c, -1, r, 1, "#f9a8ba");
      c.fillStyle = "#5b3a4a";
      c.beginPath();
      c.ellipse(0, 0, r * 0.07, r * 0.4, 0, 0, TAU);
      c.fill();
    },
  },
  {
    id: "balloon",
    zh: "氣球",
    en: "Balloon",
    animated: false,
    draw: (c, r) => {
      c.strokeStyle = "#8a8f98";
      c.lineWidth = r * 0.03;
      c.beginPath();
      c.moveTo(0, r * 0.45);
      c.quadraticCurveTo(r * 0.15, r * 0.7, 0, r * 0.95);
      c.stroke();
      c.fillStyle = "#ff5d6c";
      c.beginPath();
      c.ellipse(0, -r * 0.2, r * 0.5, r * 0.65, 0, 0, TAU);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.4)";
      c.beginPath();
      c.ellipse(-r * 0.18, -r * 0.4, r * 0.1, r * 0.2, 0.4, 0, TAU);
      c.fill();
    },
  },
  {
    id: "gift",
    zh: "禮物",
    en: "Gift",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#4dabf7";
      c.fillRect(-r * 0.6, -r * 0.2, r * 1.2, r * 0.8);
      c.fillStyle = "#339af0";
      c.fillRect(-r * 0.68, -r * 0.4, r * 1.36, r * 0.25);
      c.fillStyle = "#ffd93d";
      c.fillRect(-r * 0.08, -r * 0.4, r * 0.16, r * 1);
      c.beginPath();
      c.ellipse(-r * 0.2, -r * 0.5, r * 0.2, r * 0.12, -0.5, 0, TAU);
      c.ellipse(r * 0.2, -r * 0.5, r * 0.2, r * 0.12, 0.5, 0, TAU);
      c.fill();
    },
  },
  {
    id: "bow",
    zh: "蝴蝶結",
    en: "Bow",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#ff6b9a";
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
      c.fillStyle = "#e0457a";
      c.beginPath();
      c.arc(0, 0, r * 0.18, 0, TAU);
      c.fill();
    },
  },
  {
    id: "diamond",
    zh: "鑽石",
    en: "Diamond",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#7fd8ff";
      c.beginPath();
      c.moveTo(-r * 0.7, -r * 0.2);
      c.lineTo(-r * 0.4, -r * 0.6);
      c.lineTo(r * 0.4, -r * 0.6);
      c.lineTo(r * 0.7, -r * 0.2);
      c.lineTo(0, r * 0.75);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.8)";
      c.lineWidth = r * 0.04;
      c.beginPath();
      c.moveTo(-r * 0.7, -r * 0.2);
      c.lineTo(r * 0.7, -r * 0.2);
      c.moveTo(-r * 0.4, -r * 0.6);
      c.lineTo(-r * 0.2, -r * 0.2);
      c.lineTo(0, r * 0.75);
      c.moveTo(r * 0.4, -r * 0.6);
      c.lineTo(r * 0.2, -r * 0.2);
      c.lineTo(0, r * 0.75);
      c.stroke();
    },
  },
  {
    id: "note",
    zh: "音符",
    en: "Music note",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#5c4bd6";
      c.strokeStyle = "#5c4bd6";
      c.lineWidth = r * 0.08;
      c.beginPath();
      c.ellipse(-r * 0.3, r * 0.5, r * 0.25, r * 0.18, -0.4, 0, TAU);
      c.ellipse(r * 0.4, r * 0.35, r * 0.25, r * 0.18, -0.4, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(-r * 0.1, r * 0.45);
      c.lineTo(-r * 0.1, -r * 0.6);
      c.lineTo(r * 0.6, -r * 0.75);
      c.lineTo(r * 0.6, r * 0.3);
      c.stroke();
    },
  },
  {
    id: "camera",
    zh: "相機",
    en: "Camera",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#3b3f4a";
      c.fillRect(-r * 0.75, -r * 0.4, r * 1.5, r * 1);
      c.fillRect(-r * 0.3, -r * 0.6, r * 0.5, r * 0.22);
      c.fillStyle = "#cfd6e4";
      c.beginPath();
      c.arc(0, r * 0.1, r * 0.35, 0, TAU);
      c.fill();
      c.fillStyle = "#4dabf7";
      c.beginPath();
      c.arc(0, r * 0.1, r * 0.22, 0, TAU);
      c.fill();
    },
  },
  {
    id: "leaf",
    zh: "綠葉",
    en: "Leaf",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#51b96a";
      c.beginPath();
      c.moveTo(-r * 0.7, r * 0.6);
      c.quadraticCurveTo(-r * 0.7, -r * 0.7, r * 0.7, -r * 0.7);
      c.quadraticCurveTo(r * 0.7, r * 0.6, -r * 0.7, r * 0.6);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.6)";
      c.lineWidth = r * 0.05;
      c.beginPath();
      c.moveTo(-r * 0.6, r * 0.5);
      c.lineTo(r * 0.4, -r * 0.4);
      c.stroke();
    },
  },
  {
    id: "cake",
    zh: "蛋糕",
    en: "Cake",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#f4c78a";
      c.fillRect(-r * 0.7, r * 0.1, r * 1.4, r * 0.55);
      c.fillStyle = "#ffe3ee";
      c.fillRect(-r * 0.7, -r * 0.1, r * 1.4, r * 0.25);
      c.fillStyle = "#ff6b9a";
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.arc(r * 0.3 * i, r * 0.15, r * 0.08, 0, TAU);
        c.fill();
      }
      c.fillStyle = "#4dabf7";
      c.fillRect(-r * 0.04, -r * 0.45, r * 0.08, r * 0.35);
      c.fillStyle = "#ffb020";
      c.beginPath();
      c.ellipse(0, -r * 0.52, r * 0.07, r * 0.12, 0, 0, TAU);
      c.fill();
    },
  },
  {
    id: "bolt",
    zh: "閃電",
    en: "Lightning",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#ffd93d";
      c.strokeStyle = "#e0a100";
      c.lineWidth = r * 0.05;
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(r * 0.15, -r * 0.85);
      c.lineTo(-r * 0.5, r * 0.1);
      c.lineTo(-r * 0.05, r * 0.1);
      c.lineTo(-r * 0.2, r * 0.85);
      c.lineTo(r * 0.5, -r * 0.2);
      c.lineTo(r * 0.05, -r * 0.2);
      c.closePath();
      c.fill();
      c.stroke();
    },
  },
  {
    id: "paw",
    zh: "腳印",
    en: "Paw print",
    animated: false,
    draw: (c, r) => {
      c.fillStyle = "#8a5a3c";
      c.beginPath();
      c.ellipse(0, r * 0.3, r * 0.45, r * 0.35, 0, 0, TAU);
      c.fill();
      [[-0.55, -0.1], [-0.2, -0.45], [0.2, -0.45], [0.55, -0.1]].forEach(([x, y]) => {
        c.beginPath();
        c.ellipse(r * x, r * y, r * 0.16, r * 0.22, x * 0.5, 0, TAU);
        c.fill();
      });
    },
  },
  {
    id: "sparkle-star",
    zh: "閃亮星",
    en: "Sparkle",
    animated: false,
    draw: (c, r) => {
      glow(c, 0, 0, r, "255,240,170", 0.6);
      sparkle(c, 0, 0, r * 0.9, "#fff6c4");
    },
  },
  {
    id: "snowflake",
    zh: "雪花",
    en: "Snowflake",
    animated: false,
    draw: (c, r) => {
      c.strokeStyle = "#cfe6ff";
      c.lineWidth = r * 0.07;
      c.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -r * 0.85);
        c.moveTo(0, -r * 0.5);
        c.lineTo(-r * 0.2, -r * 0.7);
        c.moveTo(0, -r * 0.5);
        c.lineTo(r * 0.2, -r * 0.7);
        c.stroke();
        c.restore();
      }
    },
  },
  {
    id: "fireworks",
    zh: "煙火",
    en: "Fireworks",
    animated: true,
    draw: (c, r, t) => {
      for (let b = 0; b < 3; b++) {
        const p = (t * 0.45 + b / 3) % 1;
        const cx = (b - 1) * r * 0.6;
        const cy = -r * 0.2 + Math.sin(b * 2.3) * r * 0.25;
        const col = PALETTE[(b * 2) % PALETTE.length];
        c.fillStyle = col;
        c.globalAlpha *= 1;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU;
          const d = p * r * 0.55;
          c.save();
          c.globalAlpha = Math.max(0, 1 - p) * 0.95;
          c.beginPath();
          c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d + p * p * r * 0.15, r * 0.035 * (1 - p * 0.5), 0, TAU);
          c.fill();
          c.restore();
        }
      }
    },
  },
  {
    id: "confetti",
    zh: "彩帶紙花",
    en: "Confetti",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 34; i++) {
        const p = (t * 0.3 + i * 0.113) % 1;
        const x = (((i * 53) % 100) / 100 - 0.5) * r * 2 + Math.sin(t * 2 + i) * r * 0.06;
        const y = -r + p * 2 * r;
        c.save();
        c.translate(x, y);
        c.rotate(t * 3 + i);
        c.fillStyle = PALETTE[i % PALETTE.length];
        c.fillRect(-r * 0.03, -r * 0.015, r * 0.06, r * 0.03);
        c.restore();
      }
    },
  },
  {
    id: "bubbles",
    zh: "泡泡",
    en: "Bubbles",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 12; i++) {
        const p = (t * 0.2 + i / 12) % 1;
        const x = (((i * 37) % 100) / 100 - 0.5) * r * 1.6 + Math.sin(t * 1.5 + i) * r * 0.08;
        const y = r - p * 2 * r;
        const rad = r * (0.07 + ((i * 5) % 4) * 0.03);
        c.strokeStyle = "rgba(200,235,255,0.9)";
        c.fillStyle = "rgba(200,235,255,0.2)";
        c.lineWidth = Math.max(1, r * 0.012);
        c.beginPath();
        c.arc(x, y, rad, 0, TAU);
        c.fill();
        c.stroke();
        c.fillStyle = "rgba(255,255,255,0.7)";
        c.beginPath();
        c.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.2, 0, TAU);
        c.fill();
      }
    },
  },
  {
    id: "heart-rain",
    zh: "愛心飄落",
    en: "Falling hearts",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 12; i++) {
        const p = (t * 0.2 + i / 12) % 1;
        const x = (((i * 41) % 100) / 100 - 0.5) * r * 1.8 + Math.sin(t * 1.6 + i) * r * 0.08;
        const y = -r + p * 2 * r;
        const s = r * (0.08 + ((i * 3) % 3) * 0.03);
        c.save();
        c.translate(x, y);
        c.rotate(Math.sin(t * 2 + i) * 0.4);
        c.fillStyle = i % 2 ? "#ff6b8a" : "#ff9db5";
        c.beginPath();
        c.moveTo(0, s * 0.85);
        c.bezierCurveTo(-s * 1.25, s * 0.1, -s * 0.9, -s * 0.95, 0, -s * 0.35);
        c.bezierCurveTo(s * 0.9, -s * 0.95, s * 1.25, s * 0.1, 0, s * 0.85);
        c.fill();
        c.restore();
      }
    },
  },
  {
    id: "twinkle",
    zh: "星光閃爍",
    en: "Twinkling stars",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 10; i++) {
        const x = (((i * 47) % 100) / 100 - 0.5) * r * 1.8;
        const y = (((i * 29) % 100) / 100 - 0.5) * r * 1.8;
        const k = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
        glow(c, x, y, r * 0.18 * k, "255,240,170", 0.5 * k);
        sparkle(c, x, y, r * 0.12 * k, "#fff6c4");
      }
    },
  },
  {
    id: "shooting-star",
    zh: "流星",
    en: "Shooting star",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 2; i++) {
        const p = (t * 0.5 + i * 0.5) % 1;
        const x = -r + p * r * 2;
        const y = -r * 0.8 + p * r * 1.2 + i * r * 0.3;
        const tail = c.createLinearGradient(x, y, x - r * 0.5, y - r * 0.3);
        tail.addColorStop(0, "rgba(255,246,196,0.95)");
        tail.addColorStop(1, "rgba(255,246,196,0)");
        c.strokeStyle = tail;
        c.lineWidth = r * 0.04;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - r * 0.5, y - r * 0.3);
        c.stroke();
        glow(c, x, y, r * 0.12, "255,246,196", 0.9);
      }
    },
  },
  {
    id: "butterfly-fly",
    zh: "蝴蝶飛舞",
    en: "Fluttering butterfly",
    animated: true,
    draw: (c, r, t) => {
      c.translate(Math.sin(t * 1.2) * r * 0.35, Math.sin(t * 2.1) * r * 0.2);
      const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * 9));
      wing(c, 1, r, flap, "#f58fa6");
      wing(c, -1, r, flap, "#f9a8ba");
      c.fillStyle = "#5b3a4a";
      c.beginPath();
      c.ellipse(0, 0, r * 0.07, r * 0.4, 0, 0, TAU);
      c.fill();
    },
  },
  {
    id: "balloon-float",
    zh: "氣球升空",
    en: "Floating balloons",
    animated: true,
    draw: (c, r, t) => {
      const cols = ["#ff5d6c", "#ffd93d", "#4dabf7", "#51cf66"];
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.12 + i / 4) % 1;
        const x = (i - 1.5) * r * 0.45 + Math.sin(t * 1.3 + i) * r * 0.06;
        const y = r * 0.9 - p * r * 2.1;
        c.strokeStyle = "rgba(120,125,135,0.8)";
        c.lineWidth = r * 0.015;
        c.beginPath();
        c.moveTo(x, y + r * 0.2);
        c.quadraticCurveTo(x + r * 0.05, y + r * 0.35, x, y + r * 0.5);
        c.stroke();
        c.fillStyle = cols[i];
        c.beginPath();
        c.ellipse(x, y, r * 0.17, r * 0.22, 0, 0, TAU);
        c.fill();
      }
    },
  },
  {
    id: "spin-sparkle",
    zh: "旋轉光芒",
    en: "Spinning light",
    animated: true,
    draw: (c, r, t) => {
      glow(c, 0, 0, r, "255,230,150", 0.35);
      c.save();
      c.rotate(t * 1.2);
      sparkle(c, 0, 0, r * 0.9, "#fff1a8");
      c.rotate(Math.PI / 4);
      sparkle(c, 0, 0, r * 0.6, "#ffffff");
      c.restore();
    },
  },
  {
    id: "lantern",
    zh: "天燈",
    en: "Sky lanterns",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 5; i++) {
        const p = (t * 0.09 + i / 5) % 1;
        const x = (((i * 61) % 100) / 100 - 0.5) * r * 1.6 + Math.sin(t + i) * r * 0.05;
        const y = r - p * r * 2.1;
        glow(c, x, y, r * 0.3, "255,170,60", 0.35 * (1 - p * 0.6));
        c.fillStyle = "#ff9f43";
        c.fillRect(x - r * 0.07, y - r * 0.09, r * 0.14, r * 0.18);
        c.fillStyle = "#ffe08a";
        c.fillRect(x - r * 0.05, y - r * 0.05, r * 0.1, r * 0.1);
      }
    },
  },
  {
    id: "pulse-ring",
    zh: "擴散光圈",
    en: "Pulse rings",
    animated: true,
    draw: (c, r, t) => {
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.5 + i / 3) % 1;
        c.strokeStyle = `rgba(120,200,255,${1 - p})`;
        c.lineWidth = r * 0.04;
        c.beginPath();
        c.arc(0, 0, r * 0.1 + p * r * 0.85, 0, TAU);
        c.stroke();
      }
    },
  },
  {
    id: "meteor-shower",
    zh: "流星雨",
    en: "Meteor shower",
    animated: true,
    draw: (c, r, t) => {
      c.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.6 + i * 0.17) % 1;
        const x = -r * 0.2 + (((i * 53) % 100) / 100) * r * 1.4 - p * r * 0.9;
        const y = -r + p * r * 1.9;
        c.strokeStyle = `rgba(255,255,255,${1 - p * 0.5})`;
        c.lineWidth = r * 0.025;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + r * 0.22, y - r * 0.28);
        c.stroke();
      }
    },
  },
];
