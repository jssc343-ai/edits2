const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function quantize(data: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = (BAYER[((y & 3) << 2) | (x & 3)] / 16 - 0.5) * 36;
      const r = Math.min(255, Math.max(0, data[i * 4] + d));
      const g = Math.min(255, Math.max(0, data[i * 4 + 1] + d));
      const b = Math.min(255, Math.max(0, data[i * 4 + 2] + d));
      out[i++] = Math.round((r / 255) * 5) * 42 + Math.round((g / 255) * 6) * 6 + Math.round((b / 255) * 5);
    }
  }
  return out;
}

function lzw(indices: Uint8Array): number[] {
  const clear = 256;
  const eoi = 257;
  const out: number[] = [];
  let cur = 0;
  let bits = 0;
  let codeSize = 9;
  let next = 258;
  const dict = new Map<number, number>();
  const emit = (c: number) => {
    cur |= c << bits;
    bits += codeSize;
    while (bits >= 8) {
      out.push(cur & 255);
      cur >>>= 8;
      bits -= 8;
    }
  };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = prefix * 256 + k;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      codeSize = 9;
      next = 258;
      dict.clear();
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

export function encodeGif(frames: Uint8Array[], w: number, h: number, delayCs: number): Blob {
  const bytes: number[] = [];
  const word = (n: number) => bytes.push(n & 255, (n >> 8) & 255);
  "GIF89a".split("").forEach((c) => bytes.push(c.charCodeAt(0)));
  word(w);
  word(h);
  bytes.push(0xf7, 0, 0);
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 7; g++) {
      for (let b = 0; b < 6; b++) bytes.push(Math.round((r * 255) / 5), Math.round((g * 255) / 6), Math.round((b * 255) / 5));
    }
  }
  for (let i = 252; i < 256; i++) bytes.push(0, 0, 0);
  bytes.push(0x21, 0xff, 0x0b);
  "NETSCAPE2.0".split("").forEach((c) => bytes.push(c.charCodeAt(0)));
  bytes.push(3, 1, 0, 0, 0);
  for (const frame of frames) {
    bytes.push(0x21, 0xf9, 4, 0, delayCs & 255, (delayCs >> 8) & 255, 0, 0);
    bytes.push(0x2c);
    word(0);
    word(0);
    word(w);
    word(h);
    bytes.push(0, 8);
    const data = lzw(frame);
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      bytes.push(chunk.length, ...chunk);
    }
    bytes.push(0);
  }
  bytes.push(0x3b);
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

interface BuildOptions {
  count: number;
  fps: number;
  maxWidth: number;
  draw: (index: number) => HTMLCanvasElement;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

export async function buildGif({ count, fps, maxWidth, draw, onProgress, signal }: BuildOptions): Promise<Blob> {
  const scratch = document.createElement("canvas");
  const frames: Uint8Array[] = [];
  let w = 0;
  let h = 0;
  for (let i = 0; i < count; i++) {
    if (signal?.aborted) throw new Error("aborted");
    const src = draw(i);
    if (!w) {
      const scale = Math.min(1, maxWidth / src.width);
      w = Math.max(2, Math.round(src.width * scale));
      h = Math.max(2, Math.round(src.height * scale));
      scratch.width = w;
      scratch.height = h;
    }
    const ctx = scratch.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(src, 0, 0, w, h);
    frames.push(quantize(ctx.getImageData(0, 0, w, h).data, w, h));
    onProgress?.((i + 1) / count);
    await new Promise((r) => setTimeout(r, 0));
  }
  return encodeGif(frames, w, h, Math.round(100 / fps));
}
