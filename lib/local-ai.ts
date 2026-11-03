import type { AiAction } from "@/components/ai-chat-panel";
import { STICKERS } from "@/lib/stickers";

const BLANK: AiAction = {
  type: "",
  index: null, text: null, kind: null, x: null, y: null, size: null, w: null, h: null, rot: null,
  color: null, fill: null, stroke: null, rows: null, cols: null, font: null, gradient: null,
  aspect: null, style: null, gap: null, zoom: null, bright: null, contrast: null, sat: null, warm: null,
};

const act = (type: string, patch: Partial<AiAction> = {}): AiAction => ({ ...BLANK, ...patch, type });

const COLORS: { words: string[]; gradient: number; zh: string; en: string }[] = [
  { words: ["粉", "pink", "peach"], gradient: 5, zh: "粉紅色", en: "pink" },
  { words: ["橘", "橙", "orange"], gradient: 1, zh: "橘色", en: "orange" },
  { words: ["黃", "yellow", "cream"], gradient: 3, zh: "黃色", en: "yellow" },
  { words: ["綠", "green", "mint"], gradient: 6, zh: "綠色", en: "green" },
  { words: ["紫", "紫羅蘭", "violet", "purple", "lavender"], gradient: 7, zh: "紫色", en: "purple" },
  { words: ["黑", "灰", "black", "gray", "grey", "charcoal"], gradient: 8, zh: "深灰色", en: "charcoal" },
  { words: ["深藍", "海軍", "navy"], gradient: 2, zh: "深藍色", en: "navy" },
  { words: ["青", "金", "teal", "gold"], gradient: 9, zh: "青金色", en: "teal and gold" },
  { words: ["白", "white"], gradient: 4, zh: "白色", en: "white" },
  { words: ["藍", "blue"], gradient: 0, zh: "藍色", en: "blue" },
];

const ASPECTS = ["3:4", "4:5", "1:1", "4:3", "9:16", "16:9", "2:3", "3:2"];

const quoted = (m: string): string | null => {
  const hit = m.match(/[「『“"']([^」』”"']{1,120})[」』”"']/);
  return hit ? hit[1].trim() : null;
};

const place = (m: string): { x: number | null; y: number | null } => {
  const l = m.toLowerCase();
  let x: number | null = null;
  let y: number | null = null;
  if (/上方|上面|頂|top/.test(l)) y = 0.14;
  if (/下方|下面|底|bottom/.test(l)) y = 0.86;
  if (/左|left/.test(l)) x = 0.16;
  if (/右|right/.test(l)) x = 0.84;
  if (/正中|中間|中央|center|middle/.test(l)) {
    if (x === null) x = 0.5;
    if (y === null) y = 0.5;
  }
  return { x, y };
};

export interface LocalEdit {
  reply: string;
  actions: AiAction[];
}

export function localEdit(message: string, zh: boolean): LocalEdit | null {
  const m = message.trim();
  const l = m.toLowerCase();
  const actions: AiAction[] = [];
  const done: string[] = [];
  const say = (cn: string, en: string) => done.push(zh ? cn : en);
  const pos = place(m);

  if (/背景|background|backdrop/.test(l)) {
    const c = COLORS.find((k) => k.words.some((w) => l.includes(w)));
    if (c) {
      actions.push(act("set_background", { gradient: c.gradient }));
      say(`背景已換成${c.zh}。`, `Background changed to ${c.en}.`);
    }
  }

  const ratio = ASPECTS.find((a) => l.includes(a)) ?? (/正方/.test(l) ? "1:1" : /寬螢幕|橫式|landscape|wide/.test(l) ? "16:9" : /手機|全螢幕|vertical|story/.test(l) ? "9:16" : null);
  if (ratio && /格式|螢幕|比例|aspect|format|ratio|改成|換成|change|switch|set/.test(l)) {
    actions.push(act("set_aspect", { aspect: ratio }));
    say(`格式已改為 ${ratio}。`, `Format set to ${ratio}.`);
  }

  if (/網格|grid/.test(l) && /版型|排列|layout|拼貼/.test(l)) {
    actions.push(act("set_layout", { style: "grid" }));
    say("版型已改為網格。", "Layout set to grid.");
  } else if (/主圖|大圖|feature/.test(l) && /版型|排列|layout/.test(l)) {
    actions.push(act("set_layout", { style: "feature" }));
    say("版型已改為上方大圖。", "Layout set to big top photo.");
  } else if (/左大|side/.test(l) && /版型|排列|layout/.test(l)) {
    actions.push(act("set_layout", { style: "side" }));
    say("版型已改為左側大圖。", "Layout set to big left photo.");
  }

  const removing = /刪除|移除|刪掉|拿掉|remove|delete/.test(l);
  const adding = /加|新增|放|add|insert|put|place/.test(l);

  if (/表格|table/.test(l) && !removing) {
    const rows = m.match(/(\d+)\s*(?:列|rows?)/i);
    const cols = m.match(/(\d+)\s*(?:欄|cols?|columns?)/i);
    actions.push(act("add_shape", { kind: "table", rows: rows ? +rows[1] : 3, cols: cols ? +cols[1] : 3, w: 70, h: 30, x: pos.x ?? 0.5, y: pos.y ?? 0.7 }));
    say("已加入表格。", "Table added.");
  }

  const sticker = [...STICKERS].sort((a, b) => b.zh.length - a.zh.length).find((s) => m.includes(s.zh) || l.includes(s.en.toLowerCase()));
  if (sticker && removing) {
    actions.push(act("remove_sticker"));
    say("已刪除最後一個貼圖。", "Removed the last sticker.");
  } else if (sticker && (adding || /貼圖|sticker/.test(l))) {
    actions.push(act("add_sticker", { kind: sticker.id, x: pos.x ?? 0.5, y: pos.y ?? 0.5 }));
    say(`已加入${sticker.zh}貼圖。`, `Added a ${sticker.en} sticker.`);
  } else if (removing && /貼圖|sticker/.test(l)) {
    actions.push(act("remove_sticker"));
    say("已刪除最後一個貼圖。", "Removed the last sticker.");
  }

  if (removing && /文字|標題|text|title/.test(l) && !/貼圖|sticker/.test(l)) {
    actions.push(act("remove_text"));
    say("已刪除最後一段文字。", "Removed the last text.");
  } else {
    const q = quoted(m);
    if (q && /標題|副標|文字|寫|title|text|caption|say/.test(l)) {
      if (/標題|title/.test(l) && /改成|換成|變成|改為|change|set|rename/.test(l)) {
        actions.push(act("update_text", { index: 1, text: q, ...(pos.x !== null || pos.y !== null ? { x: pos.x, y: pos.y } : {}) }));
        say(`標題已改為「${q}」。`, `Title changed to “${q}”.`);
      } else if (adding || /寫|write|say/.test(l)) {
        actions.push(act("add_text", { text: q, x: pos.x ?? 0.5, y: pos.y ?? 0.5, size: /大|big|large/.test(l) ? 14 : 9 }));
        say(`已加入文字「${q}」。`, `Added the text “${q}”.`);
      }
    }
  }

  if (!actions.length) return null;
  return { reply: done.join(zh ? "" : " "), actions };
}
