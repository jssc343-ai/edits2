"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/lang-context";
import { Chip, Range } from "@/components/editor-panels";
import {
  BORDER_PLACES,
  BORDER_SHAPES,
  COMBO_STYLES,
  COMBO_TYPES,
  DEFAULT_ART,
  FRAMES,
  type ArtState,
  type BorderPlace,
  type BorderShape,
} from "@/lib/art";

type Section = "frame" | "border" | "combo";

const FAMILIES: { id: string; zh: string; en: string }[] = [
  { id: "pattern", zh: "花紋", en: "Pattern" },
  { id: "wood", zh: "木框", en: "Wood" },
  { id: "bronze", zh: "銅框", en: "Bronze" },
  { id: "glass", zh: "琉璃框", en: "Glass" },
];

export function ArtPanel({ art, onChange }: { art: ArtState; onChange: (next: ArtState) => void }) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  const [section, setSection] = useState<Section>("frame");
  const [family, setFamily] = useState("pattern");
  const [place, setPlace] = useState<BorderPlace>("opposite");
  const [shape, setShape] = useState<BorderShape>("flower");
  const [color, setColor] = useState("#ff8fb8");
  const set = (patch: Partial<ArtState>) => onChange({ ...art, ...patch });
  const isPattern = art.frame?.startsWith("pat-");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label={L("藝術套件", "Art kit")}>
        <Chip active={section === "frame"} onClick={() => setSection("frame")}>{L("藝術相框", "Frames")}</Chip>
        <Chip active={section === "border"} onClick={() => setSection("border")}>{L("花紋邊條", "Border strips")}</Chip>
        <Chip active={section === "combo"} onClick={() => setSection("combo")}>{L("造型組合", "Style sets")}</Chip>
      </div>

      {section === "frame" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {FAMILIES.map((f) => (
              <Chip key={f.id} active={family === f.id} onClick={() => setFamily(f.id)}>
                {zh ? f.zh : f.en}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={!art.frame} onClick={() => set({ frame: null })}>{L("不使用", "None")}</Chip>
            {FRAMES.filter((f) => f.fam === family).map((f) => (
              <Chip key={f.id} active={art.frame === f.id} onClick={() => set({ frame: f.id })}>
                {zh ? f.zh.split("・")[1] : f.en.split(": ")[1]}
              </Chip>
            ))}
          </div>
          {art.frame && (
            <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
              <Range label={L("相框粗細", "Frame thickness")} value={art.frameWidth} min={3} max={16} step={1} onChange={(v) => set({ frameWidth: v })} />
              {isPattern && (
                <label className="flex items-center justify-between gap-3 text-sm">
                  {L("花紋顏色", "Pattern color")}
                  <input type="color" value={art.frameColor} onChange={(e) => set({ frameColor: e.target.value })} className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0" />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {section === "border" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
            <h3 className="text-sm font-semibold">{L("設置在", "Placement")}</h3>
            <div className="flex flex-wrap gap-2">
              {BORDER_PLACES.map((p) => (
                <Chip key={p.id} active={place === p.id} onClick={() => setPlace(p.id)}>{zh ? p.zh : p.en}</Chip>
              ))}
            </div>
            <h3 className="text-sm font-semibold">{L("造型", "Style")}</h3>
            <div className="flex flex-wrap gap-2">
              {BORDER_SHAPES.map((s) => (
                <Chip key={s.id} active={shape === s.id} onClick={() => setShape(s.id)}>{zh ? s.zh : s.en}</Chip>
              ))}
            </div>
            <label className="flex items-center justify-between gap-3 text-sm">
              {L("顏色", "Color")}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0" />
            </label>
            <Button
              className="self-start"
              onClick={() => set({ borders: [...art.borders, { id: Math.random().toString(36).slice(2, 9), place, shape, color }] })}
            >
              <Plus className="size-4" />
              {L("加入邊條", "Add strip")}
            </Button>
          </div>
          {art.borders.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={L("已加入的邊條", "Added strips")}>
              {art.borders.map((b, i) => (
                <Button key={b.id} variant="outline" size="sm" className="rounded-full" onClick={() => set({ borders: art.borders.filter((x) => x.id !== b.id) })}>
                  <span className="size-3 rounded-full border border-border" style={{ backgroundColor: b.color }} />
                  {i + 1}. {zh ? BORDER_PLACES.find((p) => p.id === b.place)?.zh : BORDER_PLACES.find((p) => p.id === b.place)?.en}
                  {" / "}
                  {zh ? BORDER_SHAPES.find((s) => s.id === b.shape)?.zh : BORDER_SHAPES.find((s) => s.id === b.shape)?.en}
                  <Trash2 className="size-3.5" aria-label={L("刪除", "Delete")} />
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {section === "combo" && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{L("造型", "Type")}</h3>
          <div className="flex flex-wrap gap-2">
            <Chip active={!art.comboType} onClick={() => set({ comboType: null })}>{L("不使用", "None")}</Chip>
            {COMBO_TYPES.map((c) => (
              <Chip key={c.id} active={art.comboType === c.id} onClick={() => set({ comboType: c.id })}>{zh ? c.zh : c.en}</Chip>
            ))}
          </div>
          <h3 className="text-sm font-semibold">{L("風格", "Mood")}</h3>
          <div className="flex flex-wrap gap-2">
            {COMBO_STYLES.map((c) => (
              <Chip key={c.id} active={art.comboStyle === c.id} onClick={() => set({ comboStyle: c.id })}>{zh ? c.zh : c.en}</Chip>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" className="self-start" onClick={() => onChange({ ...DEFAULT_ART })}>
        {L("清除藝術套件", "Clear art kit")}
      </Button>
    </div>
  );
}
