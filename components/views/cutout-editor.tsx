"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Download,
  Eraser,
  ImagePlus,
  Loader2,
  MousePointerClick,
  Paintbrush,
  RotateCcw,
  RotateCw,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-context";
import { TuneControls } from "@/components/editor-panels";
import { useApp } from "@/lib/app-state";
import {
  aiRemoveBackground,
  arrangeCanvas,
  localAutoCutout,
  type Arrange,
  canvasToBlob,
  downloadCanvas,
  floodClear,
  keepLargestSubject,
  loadImage,
  sharpenAlpha,
  softenAlpha,
  strokeBrush,
} from "@/lib/cutout";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { num, type PhotoAction } from "@/lib/photo-ai";
import type { EditMode } from "@/components/app-shell";

const MAX_SIDE = 1600;

type Tool = "tap" | "erase" | "restore";

/** Tap = one small step, press and hold = keeps going (faster after a moment). */
export function HoldButton({ onStep, label, children }: { onStep: (boost: number) => void; label: string; children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    if (delay.current) clearTimeout(delay.current);
    timer.current = null;
    delay.current = null;
  };
  useEffect(() => stop, []);
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    stop();
    onStep(1);
    const began = Date.now();
    delay.current = setTimeout(() => {
      timer.current = setInterval(() => onStep(Date.now() - began > 1500 ? 4 : 2), 50);
    }, 350);
  };
  return (
    <Button
      type="button"
      variant="outline"
      className="size-12 touch-none select-none"
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onStep(1);
      }}
    >
      {children}
    </Button>
  );
}

interface Props {
  mode: EditMode;
  initialFile?: File;
  autoAi?: boolean;
  onUse?: (canvas: HTMLCanvasElement) => void;
  onCancel?: () => void;
}

export function CutoutEditor({ mode, initialFile, autoAi, onUse, onCancel }: Props) {
  const { L } = useLang();
  const { trackExport } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const history = useRef<ImageData[]>([]);
  const stroke = useRef<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tool, setTool] = useState<Tool>(mode === "hand" ? "tap" : "erase");
  const [tolerance, setTolerance] = useState(40);
  const [brush, setBrush] = useState(8);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [arrange, setArrange] = useState<Arrange>({ dx: 0, dy: 0, rot: 0 });
  const [trim, setTrim] = useState(false);
  const [tick, setTick] = useState(0);
  const [manualOpen, setManualOpen] = useState(false);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const showManual = mode === "hand" || manualOpen;

  useEffect(() => {
    const src = canvasRef.current;
    const out = previewRef.current;
    if (!loaded || !src || !out) return;
    const composed = arrangeCanvas(src, arrange, false);
    out.width = composed.width;
    out.height = composed.height;
    out.getContext("2d")?.drawImage(composed, 0, 0);
  }, [loaded, tick, arrange, showManual]);

  const moveBy = (dx: number, dy: number) => (boost: number) =>
    setArrange((a) => ({
      ...a,
      dx: Math.max(-100, Math.min(100, a.dx + dx * boost)),
      dy: Math.max(-100, Math.min(100, a.dy + dy * boost)),
    }));
  const rotateBy = (deg: number) => (boost: number) =>
    setArrange((a) => {
      const next = (a.rot + deg * boost) % 360;
      return { ...a, rot: Math.round(next * 10) / 10 };
    });

  const finalCanvas = () => {
    const canvas = canvasRef.current;
    return canvas ? arrangeCanvas(canvas, arrange, trim) : null;
  };

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 10) history.current.shift();
  }, []);

  const runAi = useCallback(async () => {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    if (!canvas || !original) return;
    setBusy(true);
    setMessage(L("AI 處理中，第一次需要下載模型（約 1 分鐘內），請稍候…", "AI is working. The first run downloads a model (up to about a minute), please wait…"));
    snapshot();
    const ctx = canvas.getContext("2d");
    try {
      const result = await aiRemoveBackground(await canvasToBlob(original));
      const url = URL.createObjectURL(result);
      const img = await loadImage(url);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      if (ctx) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        sharpenAlpha(data);
        softenAlpha(data);
        ctx.putImageData(data, 0, 0);
      }
      setMessage(L("AI 完成！如有殘留，可用下方「擦除」「還原」筆刷手動修補。", "AI is done! Use the erase and restore brushes below to touch up."));
    } catch {
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(original, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        localAutoCutout(data);
        keepLargestSubject(data);
        softenAlpha(data);
        ctx.putImageData(data, 0, 0);
      }
      setMessage(
        L(
          "AI 模型暫時無法載入，已改用內建智慧去背。可用筆刷補強，或再按一次 AI 去背重試。",
          "The AI model could not load, so built-in smart removal was used. Touch up with the brushes, or press AI remove again to retry.",
        ),
      );
    } finally {
      setBusy(false);
      bump();
    }
  }, [L, snapshot, bump]);

  const loadFile = useCallback(
    async (file: File) => {
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
        const original = document.createElement("canvas");
        original.width = canvas.width;
        original.height = canvas.height;
        original.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        originalRef.current = original;
        history.current = [];
        setArrange({ dx: 0, dy: 0, rot: 0 });
        setLoaded(true);
        bump();
        if (autoAi && mode === "ai") void runAi();
      } catch {
        setMessage(L("相片讀取失敗。", "Could not read that photo."));
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [L, autoAi, mode, runAi, bump],
  );

  const startedRef = useRef(false);
  useEffect(() => {
    if (initialFile && !startedRef.current) {
      startedRef.current = true;
      void loadFile(initialFile);
    }
  }, [initialFile, loadFile]);

  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const radiusPx = (canvas: HTMLCanvasElement) => (canvas.width * brush) / 200;

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loaded || busy) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = toCanvasPoint(e);
    snapshot();
    if (tool === "tap") {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      floodClear(data, Math.floor(p.x), Math.floor(p.y), tolerance);
      ctx.putImageData(data, 0, 0);
      bump();
      return;
    }
    const original = originalRef.current;
    if (!original) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = p;
    strokeBrush(ctx, original, p, p, radiusPx(canvas), tool);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCursor({ x: e.clientX, y: e.clientY });
    const last = stroke.current;
    const original = originalRef.current;
    const ctx = canvas.getContext("2d");
    if (!last || !original || !ctx || tool === "tap") return;
    const p = toCanvasPoint(e);
    strokeBrush(ctx, original, last, p, radiusPx(canvas), tool);
    stroke.current = p;
  };

  const endStroke = () => {
    if (stroke.current) bump();
    stroke.current = null;
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const prev = history.current.pop();
    if (canvas && prev) canvas.getContext("2d")?.putImageData(prev, 0, 0);
    bump();
  };

  const processAlpha = (fn: (d: ImageData) => void) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !loaded) return;
    snapshot();
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    fn(data);
    ctx.putImageData(data, 0, 0);
    bump();
  };

  const resetAll = () => {
    const canvas = canvasRef.current;
    const original = originalRef.current;
    if (!canvas || !original) return;
    snapshot();
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.drawImage(original, 0, 0);
    setArrange({ dx: 0, dy: 0, rot: 0 });
    bump();
  };

  const download = async () => {
    const out = finalCanvas();
    if (!out || !loaded) return;
    await downloadCanvas(out, `jsc343-cutout-${Date.now()}.png`);
    trackExport();
  };

  const getAiState = () => ({
    photoLoaded: loaded,
    width: canvasRef.current?.width ?? 0,
    height: canvasRef.current?.height ?? 0,
    tolerance,
    brush,
    position: { x: Math.round(arrange.dx), y: Math.round(arrange.dy) },
    angle: arrange.rot,
    sx: arrange.sx ?? 1,
    sy: arrange.sy ?? 1,
    opacityPercent: Math.round((arrange.alpha ?? 1) * 100),
    trimOnExport: trim,
    usingAsSticker: !!onUse,
  });

  const applyAi = (actions: PhotoAction[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const original = originalRef.current;
    for (const a of actions) {
      if (a.type === "download") {
        void download();
        continue;
      }
      if (!loaded || !canvas || !ctx || !original) {
        setMessage(L("請先上傳相片。", "Please upload a photo first."));
        return;
      }
      const rect = () => {
        const x = Math.max(0, Math.min(1, num(a.x, 0)));
        const y = Math.max(0, Math.min(1, num(a.y, 0)));
        const w = Math.max(0, Math.min(1 - x, num(a.w, 1)));
        const h = Math.max(0, Math.min(1 - y, num(a.h, 1)));
        return { x: x * canvas.width, y: y * canvas.height, w: w * canvas.width, h: h * canvas.height };
      };
      switch (a.type) {
        case "ai_remove":
          void runAi();
          break;
        case "tap_remove": {
          snapshot();
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(num(a.x, 0.02) * canvas.width)));
          const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(num(a.y, 0.02) * canvas.height)));
          floodClear(data, px, py, Math.max(5, Math.min(160, num(a.amount, tolerance))));
          ctx.putImageData(data, 0, 0);
          bump();
          break;
        }
        case "erase_rect": {
          snapshot();
          const r = rect();
          ctx.clearRect(r.x, r.y, r.w, r.h);
          bump();
          break;
        }
        case "restore_rect": {
          snapshot();
          const r = rect();
          ctx.clearRect(r.x, r.y, r.w, r.h);
          ctx.drawImage(original, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
          bump();
          break;
        }
        case "sharpen":
          processAlpha(sharpenAlpha);
          break;
        case "soften":
          processAlpha(softenAlpha);
          break;
        case "keep_subject":
          processAlpha(keepLargestSubject);
          break;
        case "undo":
          undo();
          break;
        case "reset":
          resetAll();
          break;
        case "move":
          moveBy(num(a.x, 0), num(a.y, 0))(1);
          break;
        case "rotate":
          rotateBy(num(a.amount, 0))(1);
          break;
        case "set_rotation":
          setArrange((cur) => ({ ...cur, rot: Math.max(-360, Math.min(360, num(a.amount, 0))) }));
          break;
        case "center":
          setArrange((cur) => ({ dx: 0, dy: 0, rot: cur.rot }));
          break;
        case "zero":
          setArrange({ dx: 0, dy: 0, rot: 0 });
          break;
        case "trim":
          setTrim(a.flag !== false);
          break;
        case "stretch":
          setArrange((cur) => ({
            ...cur,
            sx: Math.max(0.2, Math.min(3, (cur.sx ?? 1) * num(a.x, 1))),
            sy: Math.max(0.2, Math.min(3, (cur.sy ?? 1) * num(a.y, 1))),
          }));
          break;
        case "set_opacity":
          setArrange((cur) => ({ ...cur, alpha: Math.max(0, Math.min(1, num(a.amount, 100) / 100)) }));
          break;
        case "reset_tune":
          setArrange((cur) => ({ ...cur, sx: 1, sy: 1, alpha: 1 }));
          break;
        case "set_tolerance":
          setTolerance(Math.max(5, Math.min(160, Math.round(num(a.amount, 40)))));
          break;
        case "set_brush":
          setBrush(Math.max(1, Math.min(40, Math.round(num(a.amount, 8)))));
          break;
        case "finish":
          if (onUse) onUse(arrangeCanvas(canvas, arrange, true));
          else void download();
          break;
        default:
          break;
      }
    }
  };

  const brushPreview = (() => {
    const canvas = canvasRef.current;
    if (!canvas || !cursor || tool === "tap" || !loaded) return null;
    const rect = canvas.getBoundingClientRect();
    const d = ((canvas.width * brush) / 100) * (rect.width / canvas.width);
    return { left: cursor.x - d / 2, top: cursor.y - d / 2, size: d };
  })();

  const tools: { id: Tool; label: string; icon: typeof Eraser }[] = [
    { id: "tap", label: L("點按去背", "Tap erase"), icon: MousePointerClick },
    { id: "erase", label: L("擦除筆刷", "Erase brush"), icon: Eraser },
    { id: "restore", label: L("還原筆刷", "Restore brush"), icon: Paintbrush },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {mode === "ai"
          ? L(
              "AI 會自動辨識主體；之後可用「擦除」「還原」筆刷來回拖曳手動補強。",
              "AI detects the subject automatically. Then drag the erase and restore brushes back and forth to touch up.",
            )
          : L(
              "點按背景顏色去背，或用筆刷來回拖曳擦除與還原；可調整點按與筆刷大小。",
              "Tap a background colour to erase it, or drag the brushes back and forth. Tap and brush sizes are adjustable.",
            )}
      </p>

      <div
        className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-border"
        style={{
          backgroundImage: "repeating-conic-gradient(var(--muted) 0% 25%, var(--background) 0% 50%)",
          backgroundSize: "20px 20px",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={() => {
            endStroke();
            setCursor(null);
          }}
          className={`max-h-[60dvh] w-full object-contain ${tool === "tap" ? "touch-manipulation" : "touch-none"} ${loaded ? "" : "hidden"}`}
          role="img"
          aria-label={L("去背預覽", "Background removal preview")}
        />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        )}
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
      {brushPreview && (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-50 rounded-full border-2 border-primary bg-primary/10"
          style={{ left: brushPreview.left, top: brushPreview.top, width: brushPreview.size, height: brushPreview.size }}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void loadFile(f);
          e.target.value = "";
        }}
      />

      {mode === "ai" && (
        <>
          {!manualOpen && (
            <Button className="h-11" onClick={runAi} disabled={!loaded || busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              {L("AI 一鍵去背（高精度）", "AI remove background (high accuracy)")}
            </Button>
          )}
          <AiChatPanel<PhotoAction>
            endpoint="/api/ai-photo"
            extraBody={{ kind: "cutout" }}
            getState={getAiState}
            onActions={applyAi}
            manualOpen={manualOpen}
            onManual={() => setManualOpen((v) => !v)}
            examples={[
              L("幫我把背景去掉", "Remove the background"),
              L("把左邊一半擦掉", "Erase the left half"),
              L("邊緣柔和一點", "Soften the edges"),
              L("往左移一點，轉正 5 度", "Move a little left and rotate 5 degrees"),
            ]}
          />
        </>
      )}

      {showManual && (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
        <p className="text-sm font-medium">{L("手動修補工具", "Manual touch-up tools")}</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={L("工具", "Tool")}>
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={tool === id}
              onClick={() => setTool(id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-xs transition-colors ${
                tool === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {tool === "tap" ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm" htmlFor="tol">
              {L("點按範圍（敏感度）", "Tap range (sensitivity)")}: {tolerance}
            </label>
            <Slider id="tol" min={5} max={160} step={1} value={[tolerance]} onValueChange={(v) => setTolerance(v[0])} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-sm" htmlFor="brush">
              {L("筆刷大小", "Brush size")}: {brush}
            </label>
            <Slider id="brush" min={1} max={40} step={1} value={[brush]} onValueChange={(v) => setBrush(v[0])} />
            <p className="text-xs text-muted-foreground">
              {tool === "erase"
                ? L("按住在相片上來回拖曳，擦掉不要的部分。", "Press and drag back and forth to erase unwanted areas.")
                : L("按住在相片上來回拖曳，把擦掉的部分還原。", "Press and drag back and forth to bring erased areas back.")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => processAlpha(sharpenAlpha)} disabled={!loaded || busy}>
            {L("加強邊緣", "Sharpen edge")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => processAlpha(softenAlpha)} disabled={!loaded || busy}>
            {L("柔化邊緣", "Soften edge")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => processAlpha(keepLargestSubject)} disabled={!loaded || busy}>
            {L("只留主體", "Keep subject")}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={undo} disabled={!loaded || busy}>
            <Undo2 aria-hidden="true" />
            {L("復原", "Undo")}
          </Button>
          <Button variant="outline" onClick={resetAll} disabled={!loaded || busy}>
            {L("回到原圖", "Reset")}
          </Button>
        </div>
      </div>
      )}

      {loaded && showManual && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
          <p className="text-sm font-medium">{L("位置與角度（成品預覽）", "Position and angle (result preview)")}</p>
          <div
            className="flex items-center justify-center overflow-hidden rounded-xl border border-border p-2"
            style={{
              backgroundImage: "repeating-conic-gradient(var(--muted) 0% 25%, var(--background) 0% 50%)",
              backgroundSize: "16px 16px",
            }}
          >
            <canvas ref={previewRef} className="max-h-56 w-auto max-w-full" role="img" aria-label={L("成品預覽", "Result preview")} />
          </div>
          <div className="flex items-center justify-around gap-2">
            <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-1">
              <span />
              <HoldButton label={L("上移", "Move up")} onStep={moveBy(0, -1)}>
                <ArrowUp aria-hidden="true" />
              </HoldButton>
              <span />
              <HoldButton label={L("左移", "Move left")} onStep={moveBy(-1, 0)}>
                <ArrowLeft aria-hidden="true" />
              </HoldButton>
              <Button
                type="button"
                variant="ghost"
                className="size-12 text-xs"
                onClick={() => setArrange({ ...arrange, dx: 0, dy: 0 })}
                aria-label={L("置中", "Center")}
              >
                {L("置中", "Center")}
              </Button>
              <HoldButton label={L("右移", "Move right")} onStep={moveBy(1, 0)}>
                <ArrowRight aria-hidden="true" />
              </HoldButton>
              <span />
              <HoldButton label={L("下移", "Move down")} onStep={moveBy(0, 1)}>
                <ArrowDown aria-hidden="true" />
              </HoldButton>
              <span />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <HoldButton label={L("向左旋轉", "Rotate left")} onStep={rotateBy(-1)}>
                  <RotateCcw aria-hidden="true" />
                </HoldButton>
                <HoldButton label={L("向右旋轉", "Rotate right")} onStep={rotateBy(1)}>
                  <RotateCw aria-hidden="true" />
                </HoldButton>
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {L("角度", "Angle")} {arrange.rot}° · {L("位置", "Pos")} {Math.round(arrange.dx)}, {Math.round(arrange.dy)}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setArrange({ dx: 0, dy: 0, rot: 0 })}>
                {L("位置角度歸零", "Reset position and angle")}
              </Button>
            </div>
          </div>
          <TuneControls
            sx={arrange.sx}
            sy={arrange.sy}
            alpha={arrange.alpha}
            onChange={(patch) => setArrange((cur) => ({ ...cur, ...patch }))}
          />
          <p className="text-xs text-muted-foreground">
            {L("點一下微調，長按持續移動或旋轉。", "Tap for a fine step, press and hold to keep going.")}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
            {L("輸出時裁掉多餘透明邊", "Trim extra transparent edges on export")}
          </label>
        </div>
      )}

      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}

      <Button variant="outline" className="h-11" onClick={() => fileRef.current?.click()} disabled={busy}>
        <ImagePlus aria-hidden="true" />
        {L("換一張相片", "Change photo")}
      </Button>

      {onUse ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12" onClick={onCancel}>
            <X aria-hidden="true" />
            {L("取消", "Cancel")}
          </Button>
          <Button
            className="h-12"
            disabled={!loaded || busy}
            onClick={() => {
              const out = arrangeCanvas(canvasRef.current as HTMLCanvasElement, arrange, true);
              onUse(out);
            }}
          >
            <Check aria-hidden="true" />
            {L("加入貼圖", "Add to sticker")}
          </Button>
        </div>
      ) : (
        <>
          <Button className="h-12" onClick={download} disabled={!loaded || busy}>
            <Download aria-hidden="true" />
            {L("下載透明 PNG", "Download transparent PNG")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{L("成果不會保存，請下載。", "Nothing is saved. Please download.")}</p>
        </>
      )}
    </div>
  );
}
