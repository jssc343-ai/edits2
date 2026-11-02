"use client";

import { useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-context";
import { useApp } from "@/lib/app-state";
import { aiRemoveBackground, canvasToBlob, downloadCanvas, floodClear, loadImage } from "@/lib/cutout";
import type { EditMode } from "@/components/app-shell";

const MAX_SIDE = 1600;

export function CutoutEditor({ mode }: { mode: EditMode }) {
  const { L } = useLang();
  const { trackExport } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const history = useRef<ImageData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tolerance, setTolerance] = useState(40);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setMessage("");
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      history.current = [];
      setLoaded(true);
    } catch {
      setMessage(L("相片讀取失敗。", "Could not read that photo."));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 8) history.current.shift();
  };

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "hand" || !loaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    snapshot();
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    floodClear(data, x, y, tolerance);
    ctx.putImageData(data, 0, 0);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const prev = history.current.pop();
    if (canvas && prev) canvas.getContext("2d")?.putImageData(prev, 0, 0);
  };

  const runAi = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded) return;
    setBusy(true);
    setMessage(L("AI 處理中，第一次需要下載模型，請稍候…", "AI is working. The first run downloads a model, please wait…"));
    try {
      snapshot();
      const result = await aiRemoveBackground(await canvasToBlob(canvas));
      const url = URL.createObjectURL(result);
      const img = await loadImage(url);
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setMessage(L("完成！可以下載透明 PNG。", "Done! You can download the transparent PNG."));
    } catch {
      history.current.pop();
      setMessage(L("AI 去背失敗，請再試一次。", "AI background removal failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded) return;
    await downloadCanvas(canvas, `jsc343-cutout-${Date.now()}.png`);
    trackExport();
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {mode === "ai"
          ? L("上傳相片後按「AI 一鍵去背」，AI 會自動辨識主體。", "Upload a photo and tap AI remove background. The subject is detected automatically.")
          : L("上傳相片後，點一下要去除的背景顏色；可用滑桿調整敏感度。", "Upload a photo, then tap the background colour to erase. Use the slider to adjust sensitivity.")}
      </p>

      <div
        className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-border"
        style={{
          backgroundImage:
            "repeating-conic-gradient(var(--muted) 0% 25%, var(--background) 0% 50%)",
          backgroundSize: "20px 20px",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onTap}
          className={`max-h-[60dvh] w-full touch-manipulation object-contain ${loaded ? "" : "hidden"}`}
          role="img"
          aria-label={L("去背預覽", "Background removal preview")}
        />
        {!loaded && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 p-10 text-muted-foreground"
          >
            <ImagePlus className="size-10" aria-hidden="true" />
            <span className="text-sm">{L("點擊上傳相片", "Tap to upload a photo")}</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {mode === "hand" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="tol">
            {L("敏感度", "Sensitivity")}: {tolerance}
          </label>
          <Slider id="tol" min={5} max={120} step={1} value={[tolerance]} onValueChange={(v) => setTolerance(v[0])} />
        </div>
      )}

      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11" onClick={() => fileRef.current?.click()}>
          <ImagePlus aria-hidden="true" />
          {L("換一張相片", "Change photo")}
        </Button>
        {mode === "ai" ? (
          <Button className="h-11" onClick={runAi} disabled={!loaded || busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {L("AI 一鍵去背", "AI remove background")}
          </Button>
        ) : (
          <Button variant="outline" className="h-11" onClick={undo} disabled={!loaded}>
            <Undo2 aria-hidden="true" />
            {L("復原", "Undo")}
          </Button>
        )}
      </div>
      <Button className="h-12" onClick={download} disabled={!loaded || busy}>
        <Download aria-hidden="true" />
        {L("下載透明 PNG", "Download transparent PNG")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{L("成果不會保存，請下載。", "Nothing is saved. Please download.")}</p>
    </div>
  );
}
