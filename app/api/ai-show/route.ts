import { z } from "zod";
import { getLang } from "@/lib/i18n";
import { STICKERS } from "@/lib/stickers";
import { FONTS, FILTERS, TRANSITIONS } from "@/lib/compositor";
import { MOTION_TEMPLATES } from "@/lib/templates";
import { runStructured, selectedNote } from "@/lib/server/ai-run";

export const maxDuration = 60;

const ACTIONS = [
  "auto_plan",
  "set_aspect",
  "set_motion",
  "set_transition",
  "set_filter",
  "set_duration",
  "add_text",
  "update_text",
  "remove_text",
  "add_sticker",
  "update_sticker",
  "remove_sticker",
  "reverse_clips",
  "shuffle_clips",
  "remove_clip",
  "move_clip",
] as const;

const action = z.object({
  type: z.enum(ACTIONS),
  index: z.number().int().nullable().describe("1-based index of the text, sticker or clip"),
  value: z.string().nullable().describe("aspect, motion id, transition id or filter id"),
  text: z.string().nullable(),
  kind: z.string().nullable().describe("Sticker id"),
  seconds: z.number().nullable().describe("Seconds per photo 1-10"),
  x: z.number().nullable().describe("0 left to 1 right"),
  y: z.number().nullable().describe("0 top to 1 bottom"),
  size: z.number().nullable().describe("Text size 3-30, sticker size 8-60"),
  color: z.string().nullable().describe("Hex color"),
  font: z.string().nullable(),
  start: z.number().nullable().describe("Start second"),
  end: z.number().nullable().describe("End second"),
  rot: z.number().nullable(),
  sx: z.number().nullable().describe("Horizontal stretch multiplier of a text or sticker, 0.2 to 4; 1 is normal"),
  sy: z.number().nullable().describe("Vertical stretch multiplier of a text or sticker, 0.2 to 4; 1 is normal"),
  opacity: z.number().nullable().describe("Opacity of a text or sticker, 0.05 to 1"),
  direction: z.number().int().nullable().describe("-1 earlier, 1 later"),
});

const schema = z.object({
  reply: z.string(),
  actions: z.array(action).max(12),
});

interface Body {
  message?: string;
  func?: string;
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
  const single = body.func === "single";
  const stickers = [...STICKERS.filter((s) => single || !s.cat)]
    .sort((a, b) => Number(!!b.real3d) - Number(!!a.real3d))
    .map((s) => `${s.id} (${s.en}/${s.zh}${s.animated ? ", animated" : ""}${s.real3d ? ", 3D" : ""})`)
    .join(", ");

  const system = `You are the expert editing director inside "Jsc343 AI Edits 2". The player is making ${
    single ? "a single-photo animation" : body.func === "video" ? "a short-video compilation" : "a photo slideshow"
  } and talks to you. You carry out exactly what is asked, step by step, by returning editor actions. Do not do extra work. If the player asks you to arrange or direct the whole piece ("make it for me", "auto edit"), return one auto_plan action; it designs the opening title, closing text, motion, transitions, filter and pacing by itself.
The player may speak or type in any of 30+ languages (often via voice recognition, so expect typos and filler words). Understand the intent whatever the language and resolve vague words using the earlier chat and the current state. When several things are asked at once, return one action per thing.
Reply in ${lang.english}, one or two short sentences. If unclear, ask one question and return no actions.
Positions are fractions 0 to 1. Items are numbered from 1 in the order listed in the current state. Times are in seconds on the timeline.
set_aspect value: 9:16, 3:4, 4:5, 1:1, 4:3, 16:9.
set_motion value (3D motion style): ${MOTION_TEMPLATES.map((m) => `${m.id} (${m.en}/${m.zh})`).join(", ")}.
set_transition value (applies to every cut): ${TRANSITIONS.map((t) => `${t.id} (${t.en}/${t.zh})`).join(", ")}.
set_filter value (applies to every clip): ${FILTERS.map((f) => `${f.id} (${f.en}/${f.zh})`).join(", ")}.
set_duration seconds: how long each photo stays.
add_text: text, x, y, size, color, font, start, end (all optional except text). Symbols and emoji are just text.
add_sticker: kind, x, y, size, start, end.
Stretching and transparency of a text or sticker (update_text / update_sticker): sx is width and sy is height multiplier; "wider" raises sx, "narrower" lowers it, "taller" raises sy, "flatter" lowers sy, "normal" sets both to 1. Read current sx/sy from the state and change relatively (about 25 percent) unless a number is given. opacity: "half transparent" is 0.5, "faint" 0.25, "solid" 1.
remove_clip / move_clip use index (direction -1 or 1 for move_clip).
Stickers: ${stickers}. Always prefer the lifelike 3D stickers (ids starting with "3d-") unless the player asks for a flat one; use an animated one when the player wants motion.
Fonts: ${FONTS.map((f) => f.family).join(", ")}.
Set every unused field to null.
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
