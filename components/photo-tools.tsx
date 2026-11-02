"use client";

import { Button } from "@/components/ui/button";
import { useLang } from "@/components/lang-context";
import { Chip, Nudge, Range } from "@/components/editor-panels";
import {
  DEFAULT_ANCHORS,
  DEFAULT_LIFE,
  DEFAULT_MAKEUP,
  type Anchors,
  type Clip,
  type Life,
  type Makeup,
} from "@/lib/compositor";

type Patch = (patch: Partial<Clip>) => void;

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">{text}</p>;
}

export function FramePanel({ clip, onUpdate }: { clip?: Clip; onUpdate: Patch }) {
  const { L } = useLang();
  if (!clip) return <Empty text={L("請先選擇一張相片或片段。", "Select a photo or clip first.")} />;
  const crop = clip.crop ?? { zoom: 1, ox: 0, oy: 0 };
  const set = (p: Partial<typeof crop>) => onUpdate({ crop: { ...crop, ...p } });
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
      <h3 className="text-sm font-semibold">{L("相片剪輯：大小與位置", "Crop: size and position")}</h3>
      <Range label={L("放大", "Zoom")} value={crop.zoom} min={1} max={3} step={0.05} onChange={(v) => set({ zoom: v })} suffix="x" />
      <Range label={L("左右", "Left/Right")} value={crop.ox} min={-1} max={1} step={0.05} onChange={(v) => set({ ox: v })} />
      <Range label={L("上下", "Up/Down")} value={crop.oy} min={-1} max={1} step={0.05} onChange={(v) => set({ oy: v })} />
      <Button variant="outline" className="self-start" onClick={() => onUpdate({ crop: undefined })}>
        {L("還原", "Reset")}
      </Button>
    </div>
  );
}

export function MakeupPanel({
  clip,
  onUpdate,
  onApplyAll,
  face = true,
}: {
  clip?: Clip;
  onUpdate: Patch;
  onApplyAll?: (m: Makeup) => void;
  face?: boolean;
}) {
  const { L } = useLang();
  if (!clip) return <Empty text={L("請先選擇一張相片。", "Select a photo first.")} />;
  const m = clip.makeup ?? DEFAULT_MAKEUP;
  const a = clip.anchors ?? DEFAULT_ANCHORS;
  const setM = (p: Partial<Makeup>) => onUpdate({ makeup: { ...m, ...p } });
  const setA = (p: Partial<Anchors>) => onUpdate({ anchors: { ...a, ...p } });
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
      <h3 className="text-sm font-semibold">{L("色彩調整", "Color adjust")}</h3>
      <Range label={L("亮度", "Brightness")} value={m.bright} min={0.6} max={1.5} step={0.05} onChange={(v) => setM({ bright: v })} />
      <Range label={L("對比", "Contrast")} value={m.contrast} min={0.6} max={1.6} step={0.05} onChange={(v) => setM({ contrast: v })} />
      <Range label={L("飽和", "Saturation")} value={m.sat} min={0} max={2} step={0.05} onChange={(v) => setM({ sat: v })} />
      <Range label={L("冷暖", "Warmth")} value={m.warm} min={-1} max={1} step={0.1} onChange={(v) => setM({ warm: v })} />
      {face && (
        <>
          <h3 className="pt-1 text-sm font-semibold">{L("相片彩妝", "Photo makeup")}</h3>
          <Range label={L("美肌", "Smooth")} value={m.smooth} min={0} max={1} step={0.1} onChange={(v) => setM({ smooth: v })} />
          <Range label={L("腮紅", "Blush")} value={m.blush} min={0} max={1} step={0.1} onChange={(v) => setM({ blush: v })} />
          <Range label={L("唇彩", "Lips")} value={m.lip} min={0} max={1} step={0.1} onChange={(v) => setM({ lip: v })} />
          <p className="text-xs text-muted-foreground">
            {L("請把下方的臉部與嘴巴位置對準相片中的人物。", "Place the face and mouth markers on the person in the photo.")}
          </p>
          <Nudge x={a.fx} y={a.fy} onMove={(x, y) => setA({ fx: x, fy: y })} />
          <Range label={L("臉大小", "Face size")} value={a.fs} min={0.08} max={0.4} step={0.01} onChange={(v) => setA({ fs: v })} />
          <Nudge x={a.mx} y={a.my} onMove={(x, y) => setA({ mx: x, my: y })} />
        </>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onUpdate({ makeup: undefined })}>
          {L("還原", "Reset")}
        </Button>
        {onApplyAll && (
          <Button variant="secondary" onClick={() => onApplyAll(m)}>
            {L("套用到全部相片", "Apply to all photos")}
          </Button>
        )}
      </div>
    </div>
  );
}

const PRESETS: [string, string, Partial<Life>][] = [
  ["說話", "Talking", { mouth: 0.7, legs: 0, arms: 0, cloth: 0, speed: 1 }],
  ["唱歌", "Singing", { mouth: 1, legs: 0, arms: 0.2, cloth: 0, speed: 0.7 }],
  ["走路", "Walking", { mouth: 0, legs: 0.8, arms: 0.6, cloth: 0, speed: 1 }],
  ["舞動", "Dancing", { mouth: 0, legs: 1, arms: 1, cloth: 0.3, speed: 1.7 }],
  ["風吹衣動", "Wind in clothes", { mouth: 0, legs: 0, arms: 0, cloth: 0.9, speed: 1 }],
];

export function LifePanel({ clip, onUpdate }: { clip?: Clip; onUpdate: Patch }) {
  const { L, lang } = useLang();
  const zh = lang === "zh-TW" || lang === "zh-CN";
  if (!clip) return <Empty text={L("請先選擇一張相片。", "Select a photo first.")} />;
  const life = clip.life ?? DEFAULT_LIFE;
  const a = clip.anchors ?? DEFAULT_ANCHORS;
  const setL = (p: Partial<Life>) => onUpdate({ life: { ...life, ...p } });
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-secondary p-3">
      <h3 className="text-sm font-semibold">{L("相片 AI 動態", "Photo AI motion")}</h3>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([zhL, enL, p]) => (
          <Chip key={enL} onClick={() => setL(p)} active={false}>
            {zh ? zhL : enL}
          </Chip>
        ))}
        <Chip onClick={() => onUpdate({ life: undefined })} active={false}>
          {L("關閉動態", "Off")}
        </Chip>
      </div>
      <Range label={L("嘴巴", "Mouth")} value={life.mouth} min={0} max={1} step={0.1} onChange={(v) => setL({ mouth: v })} />
      <Range label={L("手部", "Arms")} value={life.arms} min={0} max={1} step={0.1} onChange={(v) => setL({ arms: v })} />
      <Range label={L("腳部", "Legs")} value={life.legs} min={0} max={1} step={0.1} onChange={(v) => setL({ legs: v })} />
      <Range label={L("衣服", "Clothes")} value={life.cloth} min={0} max={1} step={0.1} onChange={(v) => setL({ cloth: v })} />
      <Range label={L("速度", "Speed")} value={life.speed} min={0.4} max={2.5} step={0.1} onChange={(v) => setL({ speed: v })} suffix="x" />
      <Range label={L("腿起點", "Legs start")} value={life.legY} min={0.4} max={0.9} step={0.02} onChange={(v) => setL({ legY: v })} />
      <Range label={L("衣擺起點", "Hem start")} value={life.clothY} min={0.2} max={0.9} step={0.02} onChange={(v) => setL({ clothY: v })} />
      <p className="text-xs text-muted-foreground">
        {L("嘴巴動作需要對準位置：", "Line up the mouth marker with the photo:")}
      </p>
      <Nudge x={a.mx} y={a.my} onMove={(x, y) => onUpdate({ anchors: { ...a, mx: x, my: y } })} />
      <Range
        label={L("嘴巴大小", "Mouth size")}
        value={a.fs}
        min={0.08}
        max={0.4}
        step={0.01}
        onChange={(v) => onUpdate({ anchors: { ...a, fs: v } })}
      />
      <p className="text-xs text-muted-foreground">
        {L(
          "這是依畫面變形製作的動態效果，不是真人動作重建，效果會因相片而異。",
          "These motions are built by warping the image, not by reconstructing the person, so results vary by photo.",
        )}
      </p>
    </div>
  );
}
