const AI_TIMEOUT_MS = 90_000;

export async function aiRemoveBackground(input: Blob): Promise<Blob> {
  const run = async () => {
    const mod = await import("@imgly/background-removal");
    return mod.removeBackground(input, { model: "isnet_fp16", output: { format: "image/png", quality: 1 } });
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("ai timeout")), AI_TIMEOUT_MS);
  });
  try {
    return await Promise.race([run(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Built-in fallback: learns the background colours from the photo border and clears everything connected to them. */
export function localAutoCutout(data: ImageData): void {
  const { width: w, height: h, data: px } = data;
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    const key = ((px[i] >> 5) << 6) | ((px[i + 1] >> 5) << 3) | (px[i + 2] >> 5);
    const b = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    b.r += px[i];
    b.g += px[i + 1];
    b.b += px[i + 2];
    b.n++;
    buckets.set(key, b);
    total++;
  };
  const stepX = Math.max(1, Math.floor(w / 120));
  const stepY = Math.max(1, Math.floor(h / 120));
  for (let x = 0; x < w; x += stepX) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y += stepY) {
    sample(0, y);
    sample(w - 1, y);
  }
  const bg = [...buckets.values()]
    .filter((b) => b.n / total > 0.08)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((b) => [b.r / b.n, b.g / b.n, b.b / b.n]);
  if (!bg.length) return;

  const limit = 46 * 46 * 3;
  const isBg = (p: number) => {
    const i = p * 4;
    for (const c of bg) {
      const dr = px[i] - c[0];
      const dg = px[i + 1] - c[1];
      const db = px[i + 2] - c[2];
      if (dr * dr + dg * dg + db * db <= limit) return true;
    }
    return false;
  };
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (p: number) => {
    if (!seen[p] && isBg(p)) {
      seen[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (stack.length) {
    const p = stack.pop() as number;
    px[p * 4 + 3] = 0;
    const x = p % w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (p >= w) push(p - w);
    if (p < w * (h - 1)) push(p + w);
  }
}

export interface Arrange {
  dx: number;
  dy: number;
  rot: number;
  sx?: number;
  sy?: number;
  alpha?: number;
}

/** Places the cutout on a transparent frame large enough to rotate without clipping. */
export function arrangeCanvas(src: HTMLCanvasElement, t: Arrange, trim: boolean): HTMLCanvasElement {
  const d = Math.ceil(Math.hypot(src.width, src.height));
  const out = document.createElement("canvas");
  out.width = d;
  out.height = d;
  const ctx = out.getContext("2d");
  if (!ctx) return out;
  ctx.translate(d / 2 + (t.dx / 100) * src.width, d / 2 + (t.dy / 100) * src.height);
  ctx.rotate((t.rot * Math.PI) / 180);
  ctx.scale(t.sx ?? 1, t.sy ?? 1);
  ctx.globalAlpha = t.alpha ?? 1;
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  ctx.globalAlpha = 1;
  if (!trim) return out;
  const data = ctx.getImageData(0, 0, d, d);
  let minX = d;
  let minY = d;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < d; y++) {
    for (let x = 0; x < d; x++) {
      if (data.data[(y * d + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return out;
  const cropped = document.createElement("canvas");
  cropped.width = maxX - minX + 1;
  cropped.height = maxY - minY + 1;
  cropped.getContext("2d")?.drawImage(out, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
}

export function strokeBrush(
  ctx: CanvasRenderingContext2D,
  original: CanvasImageSource,
  from: { x: number; y: number },
  to: { x: number; y: number },
  radius: number,
  action: "erase" | "restore",
): void {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(dist / Math.max(1, radius / 3)));
  for (let i = 0; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (action === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
    } else {
      ctx.clip();
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(original, 0, 0);
    }
    ctx.restore();
  }
}

export function sharpenAlpha(data: ImageData): void {
  const px = data.data;
  for (let i = 3; i < px.length; i += 4) {
    const a = px[i];
    if (a < 48) px[i] = 0;
    else if (a > 208) px[i] = 255;
    else px[i] = Math.round(((a - 48) / 160) * 255);
  }
}

export function softenAlpha(data: ImageData): void {
  const { width: w, height: h, data: px } = data;
  const src = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) src[i] = px[i * 4 + 3];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += src[(y + dy) * w + x + dx];
      px[(y * w + x) * 4 + 3] = Math.round(sum / 9);
    }
  }
}

export function keepLargestSubject(data: ImageData): void {
  const { width: w, height: h, data: px } = data;
  const label = new Int32Array(w * h);
  const sizes: number[] = [0];
  let next = 1;
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] || px[start * 4 + 3] < 16) continue;
    let count = 0;
    stack.push(start);
    label[start] = next;
    while (stack.length) {
      const p = stack.pop() as number;
      count++;
      const x = p % w;
      const y = (p - x) / w;
      const neighbours = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const n of neighbours) {
        if (n >= 0 && !label[n] && px[n * 4 + 3] >= 16) {
          label[n] = next;
          stack.push(n);
        }
      }
    }
    sizes[next] = count;
    next++;
  }
  let best = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > (sizes[best] ?? 0)) best = i;
  for (let p = 0; p < w * h; p++) if (label[p] !== best) px[p * 4 + 3] = 0;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      resolve();
    }, "image/png");
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export function floodClear(data: ImageData, startX: number, startY: number, tolerance: number): void {
  const { width: w, height: h, data: px } = data;
  const si = (startY * w + startX) * 4;
  const r0 = px[si];
  const g0 = px[si + 1];
  const b0 = px[si + 2];
  const limit = tolerance * tolerance * 3;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [startX, startY];
  while (stack.length) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    const dr = px[i] - r0;
    const dg = px[i + 1] - g0;
    const db = px[i + 2] - b0;
    if (dr * dr + dg * dg + db * db > limit) continue;
    px[i + 3] = 0;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
}
