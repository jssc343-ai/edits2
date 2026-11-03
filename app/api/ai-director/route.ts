import { generateText, Output } from "ai";
import { z } from "zod";
import { getLang } from "@/lib/i18n";

export const maxDuration = 45;

const schema = z.object({
  title: z.string().describe("Opening title, at most 20 characters"),
  closing: z.string().describe("Closing line, at most 20 characters"),
  motion: z
    .enum(["orbit", "dolly", "float", "pendulum", "pan", "snow", "sparkle", "heartbeat", "glitch"])
    .describe("3D motion style that best fits the mood of the material"),
  transition: z.enum(["fade", "slide", "slideUp", "zoom", "wipe", "flip", "blur", "spin", "iris"]),
  filter: z.enum(["none", "warm", "cool", "mono", "vivid", "vintage"]),
  secondsPerPhoto: z.number().min(2).max(6).describe("How long each photo stays on screen"),
  textColor: z.enum(["#ffffff", "#ffe27a", "#1f2937"]),
  note: z.string().describe("One short sentence telling the player what you decided and why"),
});

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    func?: string;
    aspect?: string;
    brief?: string;
    images?: string[];
    count?: number;
    lang?: string;
    seed?: number;
  } | null;

  if (!body || !Array.isArray(body.images) || body.images.length === 0) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const lang = getLang(body.lang ?? "en");
  const images = body.images
    .filter((src) => typeof src === "string" && src.startsWith("data:image/") && src.length < 200_000)
    .slice(0, 8);
  if (images.length === 0) return Response.json({ error: "invalid" }, { status: 400 });

  const kind = body.func === "video" ? "short video" : body.func === "single" ? "single-photo 3D animation" : "photo slideshow";
  const system = `You are the film director inside "Jsc343 AI Edits 2". The player only chose the material and the screen format; you decide everything else.
Project: ${kind}, ${body.aspect ?? "9:16"} format, ${Number(body.count) || images.length} item(s). You see a sample of the material.
Find the theme and mood, then choose a fitting 3D motion style, transition, colour filter, pacing, opening title and closing line.
Write "title", "closing" and "note" in ${lang.english}. Keep text short. ${body.brief ? `The player's optional wish: ${String(body.brief).slice(0, 200)}` : ""}
${body.seed ? `This is variation number ${Number(body.seed) || 1}; make the choices noticeably different from earlier ones.` : ""}`;

  try {
    const { output } = await generateText({
      model: "openai/gpt-5-mini",
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Direct it now." },
            ...images.map((image) => ({ type: "image" as const, image })),
          ],
        },
      ],
      output: Output.object({ schema }),
    });
    return Response.json(output);
  } catch (error) {
    console.error("[ai-director] generation failed", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
