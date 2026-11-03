export interface ShapeItem {
  id: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  stroke: number;
  color: string;
  fill: string | null;
  rows: number;
  cols: number;
  z?: number;
  alpha?: number;
}

export interface ShapeDef {
  id: string;
  group: "geo" | "line";
  zh: string;
  en: string;
  closed: boolean;
}

export const SHAPES: ShapeDef[] = [
  { id: "rect", group: "geo", zh: "方形", en: "Rectangle", closed: true },
  { id: "round", group: "geo", zh: "圓角方", en: "Rounded", closed: true },
  { id: "circle", group: "geo", zh: "圓形", en: "Ellipse", closed: true },
  { id: "triangle", group: "geo", zh: "三角形", en: "Triangle", closed: true },
  { id: "diamond", group: "geo", zh: "菱形", en: "Diamond", closed: true },
  { id: "pentagon", group: "geo", zh: "五邊形", en: "Pentagon", closed: true },
  { id: "hexagon", group: "geo", zh: "六邊形", en: "Hexagon", closed: true },
  { id: "star", group: "geo", zh: "五角星", en: "Star", closed: true },
  { id: "table", group: "geo", zh: "表格", en: "Table", closed: true },
  { id: "line", group: "line", zh: "直線", en: "Line", closed: false },
  { id: "dashed", group: "line", zh: "虛線", en: "Dashed", closed: false },
  { id: "dotted", group: "line", zh: "點線", en: "Dotted", closed: false },
  { id: "arrow", group: "line", zh: "箭頭", en: "Arrow", closed: false },
  { id: "arrow2", group: "line", zh: "雙向箭頭", en: "Double arrow", closed: false },
  { id: "curve", group: "line", zh: "曲線", en: "Curve", closed: false },
  { id: "curveArrow", group: "line", zh: "曲線箭頭", en: "Curved arrow", closed: false },
  { id: "wave", group: "line", zh: "波浪線", en: "Wave", closed: false },
  { id: "zigzag", group: "line", zh: "折線", en: "Zigzag", closed: false },
  { id: "arc", group: "line", zh: "弧線", en: "Arc", closed: false },
];

export const SHAPE_MAP: Record<string, ShapeDef> = Object.fromEntries(SHAPES.map((s) => [s.id, s]));

function poly(c: CanvasRenderingContext2D, n: number, rx: number, ry: number, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.closePath();
}

function arrowHead(c: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-size, -size * 0.55);
  c.moveTo(0, 0);
  c.lineTo(-size, size * 0.55);
  c.stroke();
  c.restore();
}

export function drawShape(c: CanvasRenderingContext2D, it: ShapeItem, W: number) {
  const pw = (it.w / 100) * W;
  const ph = (it.h / 100) * W;
  const hw = pw / 2;
  const hh = ph / 2;
  const lw = Math.max(1, (it.stroke / 100) * W * 0.5);
  c.save();
  c.globalAlpha = Math.min(1, Math.max(0, it.alpha ?? 1));
  c.translate(it.x * c.canvas.width, it.y * c.canvas.height);
  c.rotate((it.rot * Math.PI) / 180);
  c.lineWidth = lw;
  c.strokeStyle = it.color;
  c.fillStyle = it.fill ?? "transparent";
  c.lineCap = "round";
  c.lineJoin = "round";
  const finish = () => {
    if (it.fill) c.fill();
    c.stroke();
  };
  switch (it.kind) {
    case "rect":
      c.beginPath();
      c.rect(-hw, -hh, pw, ph);
      finish();
      break;
    case "round":
      c.beginPath();
      c.roundRect(-hw, -hh, pw, ph, Math.min(pw, ph) * 0.22);
      finish();
      break;
    case "circle":
      c.beginPath();
      c.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      finish();
      break;
    case "triangle":
      c.beginPath();
      c.moveTo(0, -hh);
      c.lineTo(hw, hh);
      c.lineTo(-hw, hh);
      c.closePath();
      finish();
      break;
    case "diamond":
      poly(c, 4, hw, hh);
      finish();
      break;
    case "pentagon":
      poly(c, 5, hw, hh);
      finish();
      break;
    case "hexagon":
      poly(c, 6, hw, hh, 0);
      finish();
      break;
    case "star": {
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const k = i % 2 ? 0.42 : 1;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = Math.cos(a) * hw * k;
        const y = Math.sin(a) * hh * k;
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.closePath();
      finish();
      break;
    }
    case "table": {
      c.beginPath();
      c.rect(-hw, -hh, pw, ph);
      finish();
      c.beginPath();
      for (let r = 1; r < it.rows; r++) {
        const y = -hh + (ph * r) / it.rows;
        c.moveTo(-hw, y);
        c.lineTo(hw, y);
      }
      for (let k = 1; k < it.cols; k++) {
        const x = -hw + (pw * k) / it.cols;
        c.moveTo(x, -hh);
        c.lineTo(x, hh);
      }
      c.stroke();
      break;
    }
    case "line":
    case "dashed":
    case "dotted":
      if (it.kind === "dashed") c.setLineDash([lw * 3, lw * 2.2]);
      if (it.kind === "dotted") c.setLineDash([0.1, lw * 2.2]);
      c.beginPath();
      c.moveTo(-hw, 0);
      c.lineTo(hw, 0);
      c.stroke();
      break;
    case "arrow":
    case "arrow2": {
      const head = Math.max(lw * 3.2, 10);
      c.beginPath();
      c.moveTo(-hw, 0);
      c.lineTo(hw, 0);
      c.stroke();
      arrowHead(c, hw, 0, 0, head);
      if (it.kind === "arrow2") arrowHead(c, -hw, 0, Math.PI, head);
      break;
    }
    case "curve":
    case "curveArrow": {
      c.beginPath();
      c.moveTo(-hw, hh * 0.4);
      c.bezierCurveTo(-hw * 0.3, -hh * 1.4, hw * 0.3, hh * 1.4, hw, -hh * 0.4);
      c.stroke();
      if (it.kind === "curveArrow") {
        const angle = Math.atan2(-hh * 0.4 - hh * 1.4 * 0.6, hw * 0.7 + 0.01);
        arrowHead(c, hw, -hh * 0.4, angle, Math.max(lw * 3.2, 10));
      }
      break;
    }
    case "wave": {
      c.beginPath();
      const n = 48;
      for (let i = 0; i <= n; i++) {
        const x = -hw + (pw * i) / n;
        const y = Math.sin((i / n) * Math.PI * 4) * hh * 0.5;
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
      break;
    }
    case "zigzag": {
      c.beginPath();
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const x = -hw + (pw * i) / n;
        const y = i % 2 ? hh * 0.5 : -hh * 0.5;
        if (i) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
      break;
    }
    case "arc":
      c.beginPath();
      c.ellipse(0, hh * 0.5, hw, hh, 0, Math.PI, Math.PI * 2);
      c.stroke();
      break;
    default:
      break;
  }
  c.restore();
}

export function drawShapes(ctx: CanvasRenderingContext2D, items: ShapeItem[]) {
  const W = ctx.canvas.width;
  for (const it of items) drawShape(ctx, it, W);
}
