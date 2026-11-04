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

  const textOnly: ModelMessage[] = recent.map((m) => ({
    role: m.role,
    content: String(m.content).slice(0, 1200),
  }));
  const started = Date.now();
  const timeLeft = (cap: number) => Math.max(2000, Math.min(cap, 27000 - (Date.now() - started)));

  const attempts: { model: string; withImages: boolean }[] = [
    { model: "google/gemini-2.5-flash", withImages: true },
    { model: "openai/gpt-4o-mini", withImages: false },
  ];
  for (const attempt of attempts) {
    try {
      const { output } = await generateText({
        model: attempt.model,
        maxOutputTokens: 1200,
        abortSignal: AbortSignal.timeout(timeLeft(10000)),
        system,
        messages: attempt.withImages ? messages : textOnly,
        output: Output.object({ schema }),
      });
      if (output?.reply) return Response.json(output);
    } catch (error) {
      console.error("[chat] structured call failed", attempt.model, error);
    }
  }

  try {
    const { text } = await generateText({
      model: "google/gemini-2.5-flash-lite",
      maxOutputTokens: 900,
      abortSignal: AbortSignal.timeout(timeLeft(8000)),
      system: `${system}\nReturn ONLY one JSON object with keys reply, suggestions, style, tempo, mood, title, subtitle, order. No markdown.`,
      messages: textOnly,
    });
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const parsed = schema.safeParse(JSON.parse(text.slice(start, end + 1)));
      if (parsed.success && parsed.data.reply) return Response.json(parsed.data);
    }
  } catch (error) {
    console.error("[chat] json fallback failed", error);
  }

  return Response.json(localFallback(body.messages, body.plan, body.lang ?? "en"));
}

type PlanShape = { style?: string; tempo?: string; mood?: string; title?: string; subtitle?: string; order?: number[] };

function localFallback(
  msgs: { role: string; content: string }[],
  plan: unknown,
  langCode: string,
) {
  const zh = langCode.startsWith("zh");
  const last = [...msgs].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";
  const current = (plan ?? {}) as PlanShape;
  let tempo = (TEMPOS as readonly string[]).includes(current.tempo ?? "") ? current.tempo! : "medium";
  let style = (STYLES as readonly string[]).includes(current.style ?? "") ? current.style! : "kenburns";
  let mood = (MOODS as readonly string[]).includes(current.mood ?? "") ? current.mood! : "warm";
  const has = (...words: string[]) => words.some((w) => last.includes(w));

  if (has("快", "faster", "fast")) tempo = "fast";
  else if (has("慢", "slower", "slow")) tempo = "slow";
  if (has("立方", "cube")) style = "cube";
  else if (has("翻", "flip")) style = "flip";
  else if (has("輪播", "旋轉", "carousel")) style = "carousel";
  else if (has("視差", "parallax")) style = "parallax";
  else if (has("拍立得", "stack", "polaroid")) style = "stack";
  else if (has("海報", "poster")) style = "poster";
  else if (has("縮放", "ken burns", "zoom")) style = "kenburns";
  if (has("溫暖", "暖", "warm")) mood = "warm";
  else if (has("冷", "cool")) mood = "cool";
  else if (has("鮮豔", "vivid", "colorful")) mood = "vivid";
  else if (has("黑白", "mono")) mood = "mono";

  return {
    reply: zh
      ? "好的，我已依照你的想法調整。想要什麼主題或標題？"
      : "Got it, I applied your idea. What theme or title would you like?",
    suggestions: zh ? ["加標題", "節奏快一點", "換個風格"] : ["Add a title", "Make it faster", "Try another style"],
    style,
    tempo,
    mood,
    title: current.title ?? "",
    subtitle: current.subtitle ?? "",
    order: [] as number[],
  };
}
