import { generateText, Output, type ModelMessage } from "ai";
import { z } from "zod";
import { MOODS, STYLES, TEMPOS } from "@/lib/edit-types";
import { getLang } from "@/lib/i18n";

export const maxDuration = 30;

const schema = z.object({
  reply: z.string().describe("Short friendly reply that moves the conversation forward, ending with one question or suggestion"),
  suggestions: z.array(z.string()).max(4).describe("2-4 short tappable replies the player may send next, in the player's language"),
  style: z.enum(STYLES),
  tempo: z.enum(TEMPOS),
  mood: z.enum(MOODS),
  title: z.string().describe("Headline text shown on the result, empty if none"),
  subtitle: z.string().describe("Secondary text shown on the result, empty if none"),
  order: z.array(z.number().int()).describe("Zero-based media order. Empty array keeps the current order"),
});

const STYLE_HELP = `Available styles (templates only, no new generation):
- kenburns: slow zoom and pan with cross-fades
- flip: 3D card flips between items
- cube: rotating 3D cube transitions
- carousel: 3D carousel with the focused item in front
- parallax: floating 3D depth tilt (best for a single photo)
- stack: tossed stack of polaroid cards
- poster: static poster card with title text (best for text cards)
Tempo: slow | medium | fast. Mood: warm | cool | vivid | mono.`;

const KIND_HELP: Record<string, string> = {
  poster: "a promotional text-and-photo poster card",
  collage: "a dynamic collage of 2-6 photos",
  single: "a 3D motion animation of a single photo",
  tour: "a rhythmic guided tour of up to 60 photos",
  video: "a guided tour compilation of short video clips (source up to 20 minutes)",
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    messages?: { role: "user" | "assistant"; content: string; images?: string[] }[];
    lang?: string;
    kind?: string;
    route?: string;
    mediaCount?: number;
    plan?: unknown;
  } | null;

  if (!body?.messages?.length) return Response.json({ error: "invalid" }, { status: 400 });

  const lang = getLang(body.lang ?? "en");
  const recent = body.messages.slice(-16);
  const lastUserIndex = recent.map((m) => m.role).lastIndexOf("user");
  const messages: ModelMessage[] = recent.map((m, i) => {
    const text = String(m.content).slice(0, 1200);
    if (m.role === "assistant") return { role: "assistant", content: text };
    const images =
      i === lastUserIndex
        ? (m.images ?? [])
            .filter((src) => typeof src === "string" && src.startsWith("data:image/") && src.length < 1_500_000)
            .slice(0, 3)
        : [];
    if (images.length === 0) return { role: "user", content: text };
    return {
      role: "user",
      content: [{ type: "text", text }, ...images.map((image) => ({ type: "image" as const, image }))],
    };
  });

  const system = `You are the conversational editor inside "Jsc343 AI Edits 2", a mobile 3D photo and short-video editing app.
You are helping the player make ${KIND_HELP[body.kind ?? "poster"] ?? "an edit"}.
Edit route: ${body.route === "manual" ? "hand drawing (the player sketches on the preview; you assist with suggestions and adjustments)" : "AI 3D animation (you choose and apply the effects)"}.
The player has added ${Number(body.mediaCount) || 0} media item(s).
Current plan: ${JSON.stringify(body.plan ?? {})}

${STYLE_HELP}

Rules:
- ALWAYS write "reply", "suggestions", "title" and "subtitle" in ${lang.english}.
- Ask about theme, photos and feeling proactively, one question at a time. Keep replies under 60 words, plain text, no markdown (they may be read aloud).
- Whenever the player describes a preference, update style/tempo/mood/title/subtitle accordingly. Otherwise return the current plan values unchanged.
- The player may attach reference pictures. Describe briefly what you see and use it (colors, mood, subject) to choose style, mood, title and subtitle.
- Only use the listed templates; never promise generating brand new footage.
- If the player has not added media yet, remind them gently to add it.
- Remind the player once in a while that results are not saved and must be downloaded.`;

  try {
    const { output } = await generateText({
      model: "openai/gpt-5-mini",
      system,
      messages,
      output: Output.object({ schema }),
    });
    return Response.json(output);
  } catch (error) {
    console.error("[chat] generation failed", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
