import { generateText, Output } from "ai";
import { z } from "zod";
import { getLang } from "@/lib/i18n";

export const maxDuration = 45;

const schema = z.object({
  title: z.string().describe("Headline, at most 24 characters"),
  subtitle: z.string().describe("Supporting line, at most 48 characters, may be empty"),
  gradient: z.number().int().min(0).max(9).describe("Index of the background palette that best matches the photos"),
  textColor: z.enum(["light", "dark"]).describe("Use light text on dark or busy areas, dark text on bright areas"),
  style: z.enum(["grid", "feature", "side", "polaroid"]).describe("Collage arrangement. For cards this is ignored"),
  titlePosition: z.enum(["top", "center", "bottom"]),
  gap: z.number().int().min(0).max(24).describe("Spacing between photos in pixels"),
  order: z.array(z.number().int()).describe("Zero-based photo order, best photo first. Include every index once"),
  emojis: z.array(z.string()).max(3).describe("0-3 emoji that decorate the design and fit the theme"),
  note: z.string().describe("One short sentence telling the player what you designed and why"),
});

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    variant?: "card" | "collage";
    aspect?: string;
    brief?: string;
    images?: string[];
    lang?: string;
    seed?: number;
  } | null;

  if (!body || !Array.isArray(body.images) || body.images.length === 0) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const lang = getLang(body.lang ?? "en");
  const images = body.images
    .filter((src) => typeof src === "string" && src.startsWith("data:image/") && src.length < 900_000)
    .slice(0, 6);
  if (images.length === 0) return Response.json({ error: "invalid" }, { status: 400 });

  const variant = body.variant === "card" ? "card" : "collage";
  const system = `You are the art director inside "Jsc343 AI Edits 2". The player only chose the photos and the screen format; you create everything else.
You are designing ${variant === "card" ? "a promotional card (the first photo becomes the full-bleed background)" : "a photo collage"} in ${body.aspect ?? "3:4"} format with ${images.length} photo(s), shown in the same order as the images you receive.
Palette indexes: 0 blue to navy, 1 orange to yellow, 2 navy to blue, 3 yellow to cream, 4 white to pale blue, 5 pink to peach, 6 green to mint, 7 violet to lavender, 8 charcoal, 9 teal to gold.
Write "title", "subtitle" and "note" in ${lang.english}. Look at the photos, find the theme and mood, and choose a fitting headline, palette, arrangement and decoration. Keep text short. ${body.brief ? `The player's optional wish: ${String(body.brief).slice(0, 200)}` : ""}
${body.seed ? `This is variation number ${Number(body.seed) || 1}; make the design noticeably different from earlier ones.` : ""}`;

  try {
    const { output } = await generateText({
      model: "openai/gpt-5-mini",
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Design it now." },
            ...images.map((image) => ({ type: "image" as const, image })),
          ],
        },
      ],
      output: Output.object({ schema }),
    });
    return Response.json(output);
  } catch (error) {
    console.error("[ai-compose] generation failed", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
