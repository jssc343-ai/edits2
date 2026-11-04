"use client";

import { useRef, useState } from "react";
import { ArrowRight, Download, Eraser, ImagePlus, Loader2, Share2, Trash2, Undo2, Wand2 } from "lucide-react";
import { FormatPanel } from "@/components/format-panel";
import { aspectSize, type Aspect } from "@/lib/compositor";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-context";
import { useApp } from "@/lib/app-state";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { EditorView } from "@/components/views/editor-view";
import { canvasToBlob, downloadCanvas, loadImage } from "@/lib/cutout";
import { detectForeground, dilate, inpaint } from "@/lib/inpaint";
import { num, type PhotoAction } from "@/lib/photo-ai";
import type { EditMode } from "@/components/app-shell";

const MAX_SIDE = 1600;

export function RestoreEditor({ mode, onOpenPay }: { mode: EditMode; onOpenPay: () => void }) {
  const { L } = useLang();
  const { trackExport } = useApp();
  const workRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const history = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [brush, setBrush] = useState(6);
  const [auto, setAuto] = useState(true);
  const [marked, setMarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [fit, setFit] = useState(false);
  const [stage, setStage] = useState<"upload" | "format" | "repair" | "edit">("upload");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [stillOnly, setStillOnly] = useState(false);
  const [outputChosen, setOutputChosen] = useState(false);
  const showManual = mode === "hand" || manualOpen;
  const smart = mode === "ai" ? true : auto;

  const loadFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      imgRef.current = await loadImage(url);
      setSize(null);
      setMessage("");
      setStage("format");
    } catch {
      setMessage(L("相片讀取失敗。", "Could not read that photo."));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const applyFormat = () => {
    const work = workRef.current;
    const mark = markRef.current;
    const img = imgRef.current;
    const wctx = work?.getContext("2d");
    if (!work || !mark || !img || !wctx) return;
    const base = aspectSize(aspect);
    const scale = MAX_SIDE / Math.max(base.w, base.h);
    const w = Math.round(base.w * scale);
    const h = Math.round(base.h * scale);
    work.width = mark.width = w;
    work.height = mark.height = h;
    const draw = (mode: "cover" | "contain") => {
      const r = (mode === "cover" ? Math.max : Math.min)(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * r;
      const dh = img.naturalHeight * r;
      wctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    wctx.fillStyle = "#000";
    wctx.fillRect(0, 0, w, h);
    if (fit) {
      wctx.filter = "blur(24px)";
      draw("cover");
      wctx.filter = "none";
      draw("contain");
    } else {
      draw("cover");
    }
    mark.getContext("2d")?.clearRect(0, 0, w, h);
    const original = document.createElement("canvas");
    original.width = w;
    original.height = h;
    original.getContext("2d")?.drawImage(work, 0, 0);
    originalRef.current = original;
    history.current = [];
    setMarked(false);
    setSize({ w, h });
    setMessage(
      L(
        "用手指在要擦去的文字或圖案上塗抹，再按「確認清除」。",
        "Paint over the text or artwork to erase, then tap Confirm erase.",
      ),
    );
    setStage("repair");
  };

  const share = async () => {
    const work = workRef.current;
    if (!work || !size) return;
    const blob = await canvasToBlob(work);
    const file = new File([blob], "repaired.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "JSC343" });
        trackExport();
      } catch {
        // User dismissed the share sheet.
      }
      return;
    }
    await download();
    setMessage(L("此裝置不支援直接分享，已改為下載存檔，可從相簿分享。", "Direct sharing is not supported here, so the image was downloaded. Share it from your gallery."));
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const paint = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const mark = markRef.current;
    const ctx = mark?.getContext("2d");
    if (!mark || !ctx) return;
    ctx.strokeStyle = "rgba(239,68,68,0.6)";
    ctx.fillStyle = "rgba(239,68,68,0.6)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = (mark.width * brush) / 100;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    setMarked(true);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!size || busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    last.current = p;
    paint(p, p);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    const p = point(e);
    paint(last.current, p);
    last.current = p;
  };
  const endStroke = () => {
    last.current = null;
  };

  const clearMarks = () => {
    const mark = markRef.current;
    mark?.getContext("2d")?.clearRect(0, 0, mark.width, mark.height);
    setMarked(false);
  };

  const clearArea = async () => {
    const work = workRef.current;
    const mark = markRef.current;
    const wctx = work?.getContext("2d");
    const mctx = mark?.getContext("2d");
    if (!work || !mark || !wctx || !mctx || busy) return;
    const w = work.width;
    const h = work.height;
    const alpha = mctx.getImageData(0, 0, w, h).data;
    const rough = new Uint8Array(w * h);
    let any = false;
    for (let i = 0; i < rough.length; i++) {
      if (alpha[i * 4 + 3] > 8) {
        rough[i] = 1;
        any = true;
      }
    }
    if (!any) {
      setMessage(L("請先塗抹要清除的區域。", "Paint the area you want to clear first."));
      return;
    }
    setBusy(true);
    setMessage(L("系統判定範圍並清除中…", "Working out the area and clearing it…"));
    await new Promise((r) => setTimeout(r, 30));
    try {
      const img = wctx.getImageData(0, 0, w, h);
      history.current.push(wctx.getImageData(0, 0, w, h));
      if (history.current.length > 10) history.current.shift();
      const grow = Math.max(4, Math.round((w * brush) / 200));
      const target = smart ? detectForeground(img, rough, grow) : dilate(rough, w, h, 2);
      inpaint(img, target);
      wctx.putImageData(img, 0, 0);
      clearMarks();
      setMessage(
        L(
          "已清除！可以繼續擦其他地方，或選擇繼續編輯、下載存檔、直接分享。",
          "Cleared! Erase more spots, or continue editing, download, or share.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    const work = workRef.current;
    const prev = history.current.pop();
    if (work && prev) work.getContext("2d")?.putImageData(prev, 0, 0);
  };

  const resetAll = () => {
    const work = workRef.current;
    const original = originalRef.current;
    if (!work || !original) return;
    history.current = [];
    work.getContext("2d")?.drawImage(original, 0, 0);
    clearMarks();
  };

  const download = async () => {
    const work = workRef.current;
    if (!work || !size) return;
    await downloadCanvas(work, `jsc343-repair-${Date.now()}.png`);
    trackExport();
  };

  const proceed = async () => {
    const work = workRef.current;
    if (!work || !size) {
      setMessage(L("請先上傳相片。", "Please upload a photo first."));
      return;
    }
    const blob = await canvasToBlob(work);
    setEditFile(new File([blob], "repaired.png", { type: "image/png" }));
    setOutputChosen(false);
    setStage("edit");
  };

  const applyAi = (actions: PhotoAction[]) => {
    const work = workRef.current;
    const mark = markRef.current;
    const mctx = mark?.getContext("2d");
    for (const a of actions) {
      if (a.type === "download") {
        void download();
        continue;
      }
      if (a.type === "finish") {
        void proceed();
        continue;
      }
      if (!size || !work || !mark || !mctx) {
        setMessage(L("請先上傳相片。", "Please upload a photo first."));
        return;
      }
      if (a.type === "undo") undo();
      else if (a.type === "reset") resetAll();
      else if (a.type === "set_brush") setBrush(Math.max(1, Math.min(40, Math.round(num(a.amount, 6)))));
      else if (a.type === "erase_rect") {
        const x = Math.max(0, Math.min(1, num(a.x, 0)));
        const y = Math.max(0, Math.min(1, num(a.y, 0)));
        const w = Math.max(0, Math.min(1 - x, num(a.w, 1)));
        const h = Math.max(0, Math.min(1 - y, num(a.h, 1)));
        mctx.fillStyle = "rgba(239,68,68,0.6)";
        mctx.fillRect(x * mark.width, y * mark.height, w * mark.width, h * mark.height);
        setMarked(true);
        void clearArea();
      }
    }
  };

  const getAiState = () => ({
    photoLoaded: !!size,
    width: size?.w ?? 0,
    height: size?.h ?? 0,
    brush,
    hasMarkedArea: marked,
  });

  return (
    <>
      {stage === "upload" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {L(
              "步驟一：加入要延用的舊圖片或照片。之後選畫面格式、擦去不要的文字或圖案，就能繼續編輯。",
              "Step 1: add the old image or photo to reuse. Then pick a screen format, erase unwanted text or artwork, and keep editing.",
            )}
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-muted-foreground"
          >
            <ImagePlus className="size-10" aria-hidden="true" />
            <span className="text-sm">{L("點擊加入圖片、照片", "Tap to add an image or photo")}</span>
          </button>
          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      )}

      {stage === "format" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{L("步驟二：選擇屏幕格式（共八種）。", "Step 2: choose a screen format (eight to pick from).")}</p>
          <FormatPanel
            options={["9:16", "3:4", "4:5", "1:1", "4:3", "16:9", "2:3", "3:2"] as Aspect[]}
            value={aspect}
            onChange={setAspect}
          />
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={L("圖片放入方式", "How the image fits")}>
            <Button variant={fit ? "outline" : "default"} className="h-11" onClick={() => setFit(false)} aria-pressed={!fit}>
              {L("填滿畫面", "Fill frame")}
            </Button>
            <Button variant={fit ? "default" : "outline"} className="h-11" onClick={() => setFit(true)} aria-pressed={fit}>
              {L("完整顯示", "Show whole image")}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden="true" />
              {L("換一張圖", "Change image")}
            </Button>
            <Button className="h-12" onClick={applyFormat}>
              {L("確認格式", "Confirm format")}
              <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <div className={stage === "repair" ? "flex flex-col gap-4" : "hidden"}>
        <p className="text-sm text-muted-foreground">
          {L(
            "步驟三：塗抹要擦去的文字或圖案，系統會自動判定範圍，按「確認清除」。可重複擦去多處。",
            "Step 3: paint over the text or artwork to erase. The system works out the area; tap Confirm erase. You can erase several spots.",
          )}
        </p>

        <div className="flex items-center justify-center rounded-2xl border border-border bg-muted/40 p-2">
          <div
            className={`relative ${size ? "" : "hidden"}`}
            style={size ? { aspectRatio: `${size.w} / ${size.h}`, width: `min(100%, calc(58dvh * ${size.w / size.h}))` } : undefined}
          >
            <canvas ref={workRef} className="absolute inset-0 size-full" role="img" aria-label={L("修復中的圖片", "Image being repaired")} />
            <canvas
              ref={markRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              className="absolute inset-0 size-full touch-none"
              aria-label={L("塗抹要清除的區域", "Paint the area to clear")}
            />
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

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

        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button className="h-12" onClick={clearArea} disabled={!size || busy || !marked}>
            <Eraser aria-hidden="true" />
            {L("確認清除", "Confirm erase")}
          </Button>
          <Button className="h-12" variant="outline" onClick={() => setStage("format")} disabled={busy}>
            {L("更換格式", "Change format")}
          </Button>
        </div>

        {mode === "ai" && (
          <AiChatPanel
            endpoint="/api/ai-photo"
            extraBody={{ kind: "restore" }}
            getState={getAiState}
            onActions={applyAi}
            manualOpen={manualOpen}
            onManual={() => setManualOpen((v) => !v)}
            examples={[
              L("把最上面的文字清掉", "Clear the text at the top"),
              L("清掉下半部的字", "Clear the writing in the lower half"),
              L("復原到最開始", "Go back to the original"),
              L("好了，繼續編輯", "Done, continue editing"),
            ]}
          />
        )}

        {showManual && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
            <p className="text-sm font-medium">{L("手動修復工具", "Manual repair tools")}</p>
            <label className="flex flex-col gap-2 text-sm">
              {L(`筆刷大小：${brush}`, `Brush size: ${brush}`)}
              <Slider min={1} max={40} step={1} value={[brush]} onValueChange={(v) => setBrush(v[0])} aria-label={L("筆刷大小", "Brush size")} />
            </label>
            {mode === "hand" && (
              <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-sm">
                <span className="flex items-center gap-2">
                  <Wand2 className="size-4" aria-hidden="true" />
                  {L("系統自動判定清除範圍", "Auto-judge the clearing area")}
                </span>
                <input type="checkbox" className="size-5" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              </label>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-11" onClick={undo} disabled={!size || busy}>
                <Undo2 aria-hidden="true" />
                {L("復原", "Undo")}
              </Button>
              <Button variant="outline" className="h-11" onClick={clearMarks} disabled={!marked || busy}>
                <Trash2 aria-hidden="true" />
                {L("取消標記", "Unmark")}
              </Button>
              <Button variant="outline" className="h-11" onClick={resetAll} disabled={!size || busy}>
                {L("重置", "Reset")}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{L("完成後可以：", "When you are done:")}</p>
          <Button className="h-12" onClick={proceed} disabled={!size || busy}>
            {L("繼續編輯", "Continue editing")}
            <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" onClick={download} disabled={!size || busy}>
              <Download aria-hidden="true" />
              {L("下載存檔", "Download")}
            </Button>
            <Button variant="outline" className="h-12" onClick={share} disabled={!size || busy}>
              <Share2 aria-hidden="true" />
              {L("直接分享", "Share")}
            </Button>
          </div>
        </div>
      </div>

      {stage === "edit" && editFile && (
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="h-11 self-start" onClick={() => setStage("repair")}>
            {L("回到修復圖片", "Back to repair")}
          </Button>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">
              {outputChosen ? L("編輯類型（可隨時切換）", "Edit type (switch any time)") : L("請先選擇要編輯照片或短片", "First choose photo or video editing")}
            </h3>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={L("輸出類型", "Output type")}>
              <Button
                variant={outputChosen && stillOnly ? "default" : "outline"}
                className="h-12"
                onClick={() => {
                  setStillOnly(true);
                  setOutputChosen(true);
                }}
                aria-pressed={outputChosen && stillOnly}
              >
                {L("照片編輯", "Photo editing")}
              </Button>
              <Button
                variant={outputChosen && !stillOnly ? "default" : "outline"}
                className="h-12"
                onClick={() => {
                  setStillOnly(false);
                  setOutputChosen(true);
                }}
                aria-pressed={outputChosen && !stillOnly}
              >
                {L("短片編輯", "Video editing")}
              </Button>
            </div>
          </div>
          {outputChosen && (
            <EditorView key={editFile.lastModified + editFile.size} func="single" mode={mode} initialFile={editFile} initialAspect={aspect} stillOnly={stillOnly} onOpenPay={onOpenPay} />
          )}
        </div>
      )}
    </>
  );
}
