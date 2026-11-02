import type { MediaItem } from "@/lib/edit-types";

const MAX_EDGE = 1280;

function readImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/** Downscale large photos once so previews, thumbnails and scrolling stay smooth. */
async function loadImage(file: File, id: string): Promise<MediaItem> {
  const originalUrl = URL.createObjectURL(file);
  try {
    const img = await readImage(originalUrl);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= MAX_EDGE) {
      return { id, kind: "image", url: originalUrl, name: file.name, el: img, duration: 0 };
    }
    const scale = MAX_EDGE / longest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, 0.88);
    if (!blob) return { id, kind: "image", url: originalUrl, name: file.name, el: img, duration: 0 };
    const smallUrl = URL.createObjectURL(blob);
    URL.revokeObjectURL(originalUrl);
    const small = await readImage(smallUrl);
    return { id, kind: "image", url: smallUrl, name: file.name, el: small, duration: 0 };
  } catch (error) {
    URL.revokeObjectURL(originalUrl);
    throw error;
  }
}

export function loadMedia(file: File): Promise<MediaItem> {
  const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;

  if (file.type.startsWith("video/")) {
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const el = document.createElement("video");
      el.muted = true;
      el.playsInline = true;
      el.preload = "auto";
      el.onloadedmetadata = () =>
        resolve({ id, kind: "video", url, name: file.name, el, duration: el.duration || 0 });
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("video load failed"));
      };
      el.src = url;
    });
  }

  return loadImage(file, id);
}

/** Small JPEG data URL so a picture can be sent to the AI as a reference. */
export async function fileToReference(file: File, maxEdge = 768): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await readImage(url);
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function releaseMedia(item: MediaItem) {
  if (item.el instanceof HTMLVideoElement) item.el.pause();
  URL.revokeObjectURL(item.url);
}
