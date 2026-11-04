"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/lang-context";
import { PosterEditor } from "@/components/views/poster-editor";

type Variant = "card" | "collage";

interface Material {
  id: string;
  url: string;
  img: HTMLImageElement;
}

interface Format {
  id: string;
  zh: string;
  en: string;
  w: number;
  h: number;
}

const FORMATS: Format[] = [
  { id: "3:4", zh: "直式海報", en: "Portrait poster", w: 600, h: 800 },
  { id: "4:5", zh: "社群貼文", en: "Social post", w: 640, h: 800 },
  { id: "1:1", zh: "正方形", en: "Square", w: 720, h: 720 },
  { id: "9:16", zh: "限時動態 / 手機全螢幕", en: "Story / phone screen", w: 450, h: 800 },
  { id: "2:3", zh: "相片 4×6 直式", en: "Photo print portrait", w: 540, h: 810 },
  { id: "4:3", zh: "橫式相片", en: "Landscape photo", w: 800, h: 600 },
  { id: "3:2", zh: "相片 6×4 橫式", en: "Photo print landscape", w: 810, h: 540 },
  { id: "16:9", zh: "寬螢幕 / 電視", en: "Widescreen / TV", w: 800, h: 450 },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("image"));
    img.src = url;
  });
}

type Step = "materials" | "format" | "edit";

export function AiCompose({ variant, stillOnly }: { variant: Variant; stillOnly?: boolean }) {
  const { L } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("materials");
  const [photos, setPhotos] = useState<Material[]>([]);
  const [formatId, setFormatId] = useState<string>("3:4");
  const photosRef = useRef<Material[]>([]);
  photosRef.current = photos;

  const max = variant === "card" ? 2 : 9;
  const min = variant === "card" ? 1 : 2;

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = max - photos.length;
    const added: Material[] = [];
    for (const f of Array.from(files).filter((x) => x.type.startsWith("image/")).slice(0, room)) {
      const url = URL.createObjectURL(f);
      try {
        added.push({ id: uid(), url, img: await loadImage(url) });
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    setPhotos((prev) => [...prev, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [],
  );

  const steps: [Step, string][] = [
    ["materials", L("選主圖素材", "Main photos")],
    ["format", L("選螢幕格式", "Screen format")],
    ["edit", L("AI 對話編輯", "Edit with AI")],
  ];
  const stepIndex = steps.findIndex(([id]) => id === step);

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex items-center gap-2" aria-label={L("步驟", "Steps")}>
        {steps.map(([id, label], i) => (
          <li
            key={id}
            aria-current={i === stepIndex ? "step" : undefined}
            className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-sm font-medium ${
              i === stepIndex ? "bg-primary text-primary-foreground" : i < stepIndex ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i < stepIndex ? <Check className="size-4" aria-hidden="true" /> : <span>{i + 1}</span>}
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ol>

      {step === "materials" && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{L("第一步：選定主圖素材", "Step 1: choose your main photos")}</h2>
            <p className="text-sm text-muted-foreground text-pretty">
              {variant === "card"
                ? L("選 1 到 2 張相片當卡片主圖。文字、表格、插圖、符號等，下一步之後再和 AI 一步一步完成。", "Pick 1 or 2 photos for the card. Text, tables, artwork and symbols come next, step by step with the AI.")
                : L("選 2 到 9 張相片。版型、文字、插圖、符號等，下一步之後再和 AI 一步一步完成。", "Pick 2 to 9 photos. Layout, text, artwork and symbols come next, step by step with the AI.")}
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} aria-label={L("加入相片", "Add photos")} />
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={L(`素材 ${i + 1}`, `Material ${i + 1}`)} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={L("移除", "Remove")}
                  className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
            {photos.length < max && (
              <li>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground hover:bg-secondary"
                >
                  <ImagePlus className="size-6" aria-hidden="true" />
                  {L("加入相片", "Add photos")}
                </button>
              </li>
            )}
          </ul>
          <p className="text-sm text-muted-foreground">
            {photos.length} / {max}
          </p>
          <Button size="lg" disabled={photos.length < min} onClick={() => setStep("format")}>
            {L("下一步：選螢幕格式", "Next: screen format")}
          </Button>
        </section>
      )}

      {step === "format" && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-balance">{L("第二步：選定螢幕格式", "Step 2: choose the screen format")}</h2>
            <p className="text-sm text-muted-foreground text-pretty">
              {L("格式選好後，就進入編輯頁。你可以用 AI 對話一步一步完成，也能隨時手工調整。", "Next you enter the editor. Build it step by step with the AI, and adjust by hand any time.")}
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => {
              const active = f.id === formatId;
              const scale = 44 / Math.max(f.w, f.h);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFormatId(f.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors ${
                      active ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center">
                      <span
                        className={`rounded-sm border-2 ${active ? "border-primary bg-primary/20" : "border-muted-foreground/60"}`}
                        style={{ width: f.w * scale, height: f.h * scale }}
                      />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base font-semibold">{f.id}</span>
                      <span className="text-sm text-muted-foreground">{L(f.zh, f.en)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setStep("materials")}>
              {L("上一步", "Back")}
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setStep("edit")}>
              {L("進入編輯頁", "Open the editor")}
            </Button>
          </div>
        </section>
      )}

      {step === "edit" && (
        <PosterEditor
          variant={variant}
          aiChat
          stillOnly={stillOnly}
          initial={{ photos: photos.map((p) => ({ url: p.url, img: p.img })), aspect: formatId }}
        />
      )}
    </div>
  );
}
