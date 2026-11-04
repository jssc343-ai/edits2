import { z } from "zod";
import { getLang } from "@/lib/i18n";
import { runStructured, selectedNote } from "@/lib/server/ai-run";

export const maxDuration = 60;

const CUTOUT_ACTIONS = [
  "ai_remove",
  "tap_remove",
  "erase_rect",
  "restore_rect",
  "sharpen",
  "soften",
  "keep_subject",
  "undo",
  "reset",
  "move",
  "rotate",
  "set_rotation",
  "center",
  "zero",
  "trim",
  "set_tolerance",
  "set_brush",
  "finish",
  "download",
  "stretch",
  "set_opacity",
  "reset_tune",
] as const;

const STICKER_ACTIONS = [
  "add_emoji",
  "add_text",
  "select",
  "set_position",
  "nudge",
  "set_size",
  "rotate",
  "set_rotation",
  "set_color",
  "set_text",
  "delete",
  "clear",
  "download",
  "stretch",
  "set_opacity",
  "reset_tune",
] as const;

const action = z.object({
  type: z.enum([...CUTOUT_ACTIONS, ...STICKER_ACTIONS]),
  index: z.number().int().nullable().describe("1-based sticker item number"),
  text: z.string().nullable().describe("Emoji character or text"),
  color: z.string().nullable().describe("Hex colour such as #ef4444"),
  x: z.number().nullable(),
  y: z.number().nullable(),
  w: z.number().nullable(),
  h: z.number().nullable(),
  amount: z.number().nullable(),
  flag: z.boolean().nullable(),
});

const schema = z.object({
  reply: z.string(),
  actions: z.array(action).max(12),
});

interface Body {
  message?: string;
  kind?: string;
  lang?: string;
  history?: { role: "user" | "assistant"; text: string }[];
  state?: unknown;
  selected?: unknown;
}

const TUNE_RULES = `- stretch: change the width and height of the picture or text. x = factor applied to the current width (1.25 = wider, 0.8 = narrower, 1 = unchanged), y = factor applied to the current height (1.25 = taller, 0.8 = flatter). Use null for a side that should not change. "a little wider" = x 1.2, "much wider" = x 1.5, "squash it" = y 0.6. If the player gives a number, use it. Current sx and sy are in the state.
- set_opacity: amount = visibility percent 0 to 100 (100 = solid, 50 = half transparent, 0 = invisible). "a bit lighter" = current minus 20.
- reset_tune: back to normal width, height and full opacity.`;

const CUTOUT_RULES = `The player is removing the background from a photo (making it transparent) and talks to you. Carry out exactly what is asked, step by step.
Actions:
- ai_remove: run the AI background removal on the whole photo. Use it for "remove the background", "cut out the person", "make it transparent" and similar. It is allowed more than once.
- tap_remove: erase the connected background colour at a point. x,y = point as fractions 0 to 1 of the photo (0,0 top-left). amount = sensitivity 5 to 160 (optional, default is the current tolerance).
- erase_rect: make a rectangle transparent. x,y = top-left, w,h = size, all fractions 0 to 1 of the photo. Example: "erase the left half" = x 0, y 0, w 0.5, h 1. "clear the top edge" = x 0, y 0, w 1, h 0.15.
- restore_rect: bring the original pixels back in a rectangle (same fields as erase_rect).
- sharpen / soften: make the cut edge crisper or smoother. keep_subject: delete small leftover specks and keep only the main subject.
- undo: undo the last change. reset: back to the original photo.
- move: move the result. x,y = change in percent of the movement range, -100 to 100 (positive right/down). Example "move a little left" = x -10. "move a lot" = 30.
- rotate: turn the result by amount degrees added (positive clockwise). set_rotation: exact angle in amount.
- center: put it back to the middle. zero: reset position and angle.
- trim: flag true/false, trim extra transparent edges on export.
- set_tolerance: amount 5 to 160. set_brush: amount 1 to 40.
- finish: the player is happy and wants to use the cutout (add it as a sticker). download: download the transparent PNG.
${TUNE_RULES}`;

const RESTORE_RULES = `The player is repairing an old greeting image: removing its old text or artwork so new text can be added afterwards. They talk to you. Carry out exactly what is asked.
Actions:
- erase_rect: clear the old text or artwork inside a rectangle; the system detects the exact letters and fills the background. x,y = top-left, w,h = size, all fractions 0 to 1 of the image (0,0 top-left). Example: "clear the text at the top" = x 0, y 0, w 1, h 0.25. "clear the bottom line" = x 0, y 0.8, w 1, h 0.2. "clear the middle" = x 0.1, y 0.3, w 0.8, h 0.4. Use several actions for several areas.
- undo: undo the last clearing. reset: back to the original image.
- set_brush: amount 1 to 40.
- finish: the player is happy and wants to continue editing (add new text and materials). download: download the repaired image.
If the image is not uploaded yet, tell the player to upload it with the upload button.`;

const STICKER_RULES = `The player is making a sticker (a 512 by 512 transparent image) and talks to you. Items are numbered from 1 in the order listed in the current state; "this one"/"it" means the selected item (selected = true), otherwise the last item. Carry out exactly what is asked, step by step.
Actions:
- add_emoji: text = one emoji (choose it yourself from the meaning: "a heart" = the heart emoji). Optional x,y position 0 to 1 and amount = size 40 to 480.
- add_text: text = the words, optional color hex, x,y position, amount = size.
- select: index of the item.
- set_position: x,y absolute 0 to 1 (0,0 top-left, 0.5,0.5 centre) for index (or the selected one).
- nudge: move by x,y fractions, e.g. -0.1 = a little left, 0.1 = a little down.
- set_size: amount 40 to 480. rotate: amount degrees added. set_rotation: exact degrees -180 to 180.
- set_color: color hex for a text item. set_text: change the words.
- delete: delete the item (index or selected). clear: delete everything. download: download the transparent PNG.
${TUNE_RULES}
Adding a photo requires the player to upload it with the upload button; tell them so if asked.`;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!body || !message) return Response.json({ error: "invalid" }, { status: 400 });

  const lang = getLang(body.lang ?? "en");
  const sticker = body.kind === "sticker";

  const system = `You are the expert assistant inside "Jsc343 AI Edits 2". ${sticker ? STICKER_RULES : body.kind === "restore" ? RESTORE_RULES : CUTOUT_RULES}
The player may speak or type in any of 30+ languages (often through voice recognition, so expect typos and filler words). Understand the intent whatever the language, resolve vague words from the earlier chat and the current state, and return one action per thing asked.
If the request is unclear, ask one short question and return no actions. If something is impossible (for example the photo is not uploaded yet), say so briefly.
Reply in ${lang.english}, one or two short sentences describing what you did.
Set every unused field to null.
${selectedNote(body.selected)}
Current state (JSON): ${JSON.stringify(body.state ?? {}).slice(0, 3000)}`;

  const history = (Array.isArray(body.history) ? body.history : []).slice(-8).map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: String(m.text ?? "").slice(0, 500),
  }));

  const output = await runStructured({
    system,
    messages: [...history, { role: "user", content: message }],
    schema,
    actionKeys: Object.keys(action.shape),
  });
  if (output) return Response.json(output);
  return Response.json({ error: "failed" }, { status: 502 });
}
