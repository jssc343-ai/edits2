export async function aiRemoveBackground(input: Blob): Promise<Blob> {
  const mod = await import("@imgly/background-removal");
  return mod.removeBackground(input, { output: { format: "image/png" } });
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
