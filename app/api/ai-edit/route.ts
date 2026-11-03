import { z } from "zod";
import { runStructured, selectedNote } from "@/lib/server/ai-run";
import { getLang } from "@/lib/i18n";
import { STICKERS } from "@/lib/stickers";
import { SHAPES } from "@/lib/shapes";
import { FONTS } from "@/lib/compositor";

export const maxDuration = 45;

const ACTIONS = [
  "set_background",
  "set_aspect",
  "set_layout",
  "add_text",
  "update_text",
  "remove_text",
  "add_sticker",
  "update_sticker",
  "remove_sticker",
  "add_shape",
  "update_shape",
  "remove_shape",
  "adjust_photo",
  "remove_photo",
] as const;

const action = z.object({
  type: z.enum(ACTIONS),
  index: z.number().int().nullable().describe("1-based index of the existing item (or photo) to change or remove"),
  text: z.string().nullable(),
  kind: z.string().nullable().describe("Sticker id or shape id"),
  x: z.number().nullable().describe("Horizontal position 0 (left) to 1 (right)"),
  y: z.number().nullable().describe("Vertical position 0 (top) to 1 (bottom)"),
  size: z.number().nullable().describe("Text size 3-30, sticker size 8-60"),
  w: z.number().nullable().describe("Shape width 5-100"),
  h: z.number().nullable().describe("Shape height 3-100"),
  rot: z.number().nullable().describe("Rotation in degrees -180 to 180"),
  sx: z.number().nullable().describe("Horizontal stretch multiplier of a text or sticker, 0.2 (squashed narrow) to 4 (stretched wide); 1 is normal"),
  sy: z.number().nullable().describe("Vertical stretch multiplier of a text or sticker, 0.2 (squashed flat) to 4 (stretched tall); 1 is normal"),
  opacity: z.number().nullable().describe("Opacity of a text, sticker or shape, 0.05 (almost invisible) to 1 (solid)"),
  color: z.string().nullable().describe("Hex color such as #ffffff"),
  fill: z.string().nullable().describe("Shape fill hex color, or 'none'"),
  stroke: z.number().nullable().describe("Shape line weight 0.5-10"),
  rows: z.number().int().nullable(),
  cols: z.number().int().nullable(),
  font: z.string().nullable(),
  gradient: z.number().int().nullable().describe("Background palette 0-9"),
  aspect: z.string().nullable(),
  style: z.enum(["grid", "feature", "side"]).nullable(),
  gap: z.number().nullable().describe("Photo spacing 0-40"),
  zoom: z.number().nullable().describe("Photo zoom 0.5-3"),
  bright: z.number().nullable().describe("0.6-1.5"),
  contrast: z.number().nullable().describe("0.6-1.6"),
  sat: z.number().nullable().describe("0-2"),
  warm: z.number().nullable().describe("-1 to 1"),
});

const schema = z.object({
  reply: z.string().describe("Short friendly reply that says what you did, or asks one clarifying question"),
  actions: z.array(action).max(12),
});

interface Body {
  message?: string;
  variant?: "card" | "collage";
  lang?: string;
  history?: { role: "user" | "assistant"; text: string }[];
  state?: unknown;
  selected?: unknown;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!body || !message) return Response.json({ error: "invalid" }, { status: 400 });

  const lang = getLang(body.lang ?? "en");
  const stickers = [...STICKERS.filter((s) => !s.cat)]
    .sort((a, b) => Number(!!b.real3d) - Number(!!a.real3d))
    .map((s) => `${s.id} (${s.en}/${s.zh}${s.animated ? ", animated" : ""}${s.real3d ? ", 3D" : ""})`)
    .join(", ");
  const shapes = SHAPES.map((s) => `${s.id} (${s.en}/${s.zh})`).join(", ");
  const fonts = FONTS.map((f) => f.family).join(", ");

  const system = `You are the hands-on editing assistant inside "Jsc343 AI Edits 2". The player is editing ${body.variant === "card" ? "a promotional card" : "a photo collage"} and talks to you in chat. Do exactly what the player asks, one step at a time, by returning editor actions. Never do more than was asked, and never redesign the whole piece unless asked.
The player may speak or type in any of 30+ languages (often through voice recognition, so expect small typos and filler words). Understand the intent whatever the language and resolve vague words ("it", "that one", "bigger") using the earlier chat and the current state. When the player asks for several things at once, return one action per thing.
Reply in ${lang.english}, in one or two short sentences. If the request is unclear, ask one question and return no actions.
Canvas positions are fractions: x 0 to 1 left to right, y 0 to 1 top to bottom; center is 0.5, 0.5. Items are numbered from 1 in the order listed in the current state.
Background palettes: 0 blue to navy, 1 orange to yellow, 2 navy to blue, 3 yellow to cream, 4 white to pale blue, 5 pink to peach, 6 green to mint, 7 violet to lavender, 8 charcoal, 9 teal to gold.
Aspects: 3:4, 4:5, 1:1, 4:3, 9:16, 16:9, 2:3, 3:2. Collage layouts: grid, feature (big top photo), side (big left photo).
Sticker ids: ${stickers}. Always prefer the lifelike 3D stickers (ids starting with "3d-") unless the player asks for a flat one; use an animated one when the player wants motion.
Shape ids (tables, geometry, lines, arrows, curves): ${shapes}.
Fonts: ${fonts}.
Use add_text for titles, captions, labels and symbols (symbols are just text characters such as ★ ♥ ✓). Text needs a readable color against the background. Set every unused field to null.
Stretching and transparency: for a text or sticker use sx (width) and sy (height) multipliers; "wider/fatter" raises sx, "narrower" lowers it, "taller" raises sy, "flatter/squash" lowers sy, "back to normal" sets both to 1. Read the current sx/sy from the state and change them relatively (about 25 percent per request) unless the player gives a number. For a shape, change w and h instead. "Half transparent" is opacity 0.5, "a bit see-through" about 0.7, "very faint" 0.25, "solid/opaque" 1; opacity works on text, stickers and shapes through the matching update action.
Deleting: remove_text, remove_sticker, remove_shape and remove_photo each delete ONE item by its 1-based index (numbers are those of the current state, before any of your actions run; to delete several, return one action per item). Never delete anything the player did not ask to delete.
${selectedNote(body.selected)}
Current state (JSON): ${JSON.stringify(body.state ?? {}).slice(0, 4000)}`;

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
