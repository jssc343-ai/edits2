export type EditFunc = "card" | "collage" | "single" | "photos" | "video" | "cutout" | "sticker";
export type EditModeId = "hand" | "ai";

interface FuncDef {
  id: EditFunc;
  zh: string;
  en: string;
  descZh: string;
  descEn: string;
}

export const FUNCS_HAND: FuncDef[] = [
  { id: "card", zh: "編輯宣傳卡片", en: "Promo card", descZh: "製作海報、邀請卡與宣傳圖，可加文字與插圖", descEn: "Make posters and invitations with text and artwork" },
  { id: "collage", zh: "編輯照片拼貼", en: "Photo collage", descZh: "把 1 到 6 張相片拼成一張，多種版型", descEn: "Combine 1 to 6 photos with several layouts" },
  { id: "single", zh: "單張照片動畫編輯", en: "Animate one photo", descZh: "一張相片變成有立體感的動態影片", descEn: "Turn one photo into a lifelike motion clip" },
  { id: "photos", zh: "50 張照片幻燈片編輯", en: "Photo slideshow (50)", descZh: "最多 50 張相片，文字、秒數、濾鏡、配樂", descEn: "Up to 50 photos with text, timing, filters, music" },
  { id: "video", zh: "10 分鐘短影片幻燈片編輯", en: "Short video (10 min)", descZh: "剪輯最長 10 分鐘影片，分割、調速、濾鏡與音樂", descEn: "Edit up to 10 minutes: split, speed, filters, music" },
  { id: "cutout", zh: "照片除背（無背景、透明）", en: "Remove background", descZh: "手動點選背景顏色，輸出透明 PNG", descEn: "Tap the background colour and export a transparent PNG" },
  { id: "sticker", zh: "貼圖製作（Emoji……）", en: "Sticker maker", descZh: "用 Emoji 與文字自己做貼圖，輸出透明 PNG", descEn: "Build stickers from emoji and text, export transparent PNG" },
];

export const FUNCS_AI: FuncDef[] = [
  { id: "card", zh: "編輯宣傳卡片", en: "Promo card", descZh: "選素材、選格式，版面、文案與裝飾全由 AI 完成", descEn: "Pick materials and format; AI creates layout, copy and decoration" },
  { id: "collage", zh: "編輯照片拼貼", en: "Photo collage", descZh: "選素材、選格式，版型、順序與文字全由 AI 完成", descEn: "Pick materials and format; AI does layout, order and text" },
  { id: "single", zh: "單張照片動畫編輯", en: "Animate one photo", descZh: "AI 3D 動態，一張相片變成影片", descEn: "AI 3D motion turns one photo into a clip" },
  { id: "photos", zh: "80 張照片幻燈片編輯", en: "Photo slideshow (80)", descZh: "最多 80 張相片，AI 3D 動態與轉場", descEn: "Up to 80 photos with AI 3D motion and transitions" },
  { id: "video", zh: "30 分鐘短影片幻燈片編輯", en: "Short video (30 min)", descZh: "剪輯最長 30 分鐘影片，AI 協助整理", descEn: "Edit up to 30 minutes with AI assistance" },
  { id: "cutout", zh: "照片除背（無背景、透明）", en: "Remove background", descZh: "AI 自動辨識人物與物件，一鍵去背", descEn: "AI detects the subject and removes the background in one tap" },
  { id: "sticker", zh: "貼圖製作（Emoji……）", en: "Sticker maker", descZh: "AI 把相片變成貼圖，或用文字生成 Emoji 貼圖", descEn: "AI turns photos into stickers or builds emoji stickers" },
];

export const FUNCS = FUNCS_HAND;
