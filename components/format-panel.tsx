"use client";

import { useLang } from "@/components/lang-context";

const HINTS: Record<string, [string, string]> = {
  "3:4": ["直式相片、卡片", "Portrait photo, card"],
  "4:5": ["社群貼文", "Social post"],
  "1:1": ["正方形頭像、貼文", "Square post, avatar"],
  "2:3": ["海報、明信片", "Poster, postcard"],
  "4:3": ["橫式相片", "Landscape photo"],
  "3:2": ["橫式海報、相機照片", "Landscape poster, camera photo"],
  "9:16": ["限時動態、短影片", "Stories, short video"],
  "16:9": ["橫式影片、螢幕", "Widescreen video"],
};

export function FormatPanel<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  const { L } = useLang();
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{L("畫面格式（框架大小比例）", "Frame format (aspect ratio)")}</h3>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={L("畫面格式", "Frame format")}>
        {options.map((a) => {
          const [w, h] = a.split(":").map(Number);
          const box = 36;
          const bw = w >= h ? box : (box * w) / h;
          const bh = h >= w ? box : (box * h) / w;
          const hint = HINTS[a];
          return (
            <button
              key={a}
              type="button"
              aria-pressed={value === a}
              onClick={() => onChange(a)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center ${
                value === a ? "border-primary bg-primary/10 text-primary ring-2 ring-primary" : "border-border bg-secondary text-foreground"
              }`}
            >
              <span className="flex size-10 items-center justify-center">
                <span className="rounded-sm border-2 border-current" style={{ width: bw, height: bh }} />
              </span>
              <span className="text-sm font-semibold">{a}</span>
              {hint && <span className="text-xs text-muted-foreground">{L(hint[0], hint[1])}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{L("改變比例後，預覽與下載的成品都會使用新的大小。", "The preview and your download both use the new size.")}</p>
    </div>
  );
}
