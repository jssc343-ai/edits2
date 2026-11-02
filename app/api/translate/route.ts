import { generateText } from "ai";
import { EN_DICT, LANGUAGES, getLang } from "@/lib/i18n";

export const maxDuration = 60;

const cache = new Map<string, Record<string, string>>();

function parseJson(text: string): Record<string, string> {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const raw = JSON.parse(cleaned) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { lang?: string };
  const code = typeof body.lang === "string" ? body.lang : "";
  if (!LANGUAGES.some((l) => l.code === code)) return Response.json({}, { status: 400 });
  if (code === "en" || code === "zh-TW") return Response.json({});

  const hit = cache.get(code);
  if (hit) return Response.json(hit);

  const info = getLang(code);
  const entries = Object.entries(EN_DICT);
  const CHUNKS = 8;
  const size = Math.ceil(entries.length / CHUNKS);
  const chunks = Array.from({ length: CHUNKS }, (_, i) => entries.slice(i * size, (i + 1) * size)).filter((c) => c.length);

  async function translateChunk(chunk: [string, string][]): Promise<Record<string, string>> {
    const { text } = await generateText({
      model: "openai/gpt-5-mini",
      system: `Translate the VALUES of the JSON object into ${info.english}. Keep every key unchanged. Keep placeholders such as {n} or {p} exactly as they are. Keep the names "Pi" and "Jsc343" untranslated. Keep each translation short enough for a mobile button. Return only valid JSON.`,
      prompt: JSON.stringify(Object.fromEntries(chunk)),
    });
    return parseJson(text);
  }

  try {
    const settled = await Promise.all(chunks.map((c) => translateChunk(c).catch(() => ({}) as Record<string, string>)));
    const merged = Object.assign({}, ...settled) as Record<string, string>;
    const missing = entries.filter(([k]) => !merged[k]);
    if (missing.length > 0) {
      const retry = await translateChunk(missing).catch(() => ({}) as Record<string, string>);
      Object.assign(merged, retry);
    }
    if (entries.every(([k]) => merged[k])) cache.set(code, merged);
    return Response.json(merged);
  } catch (error) {
    console.error("[translate] failed", error);
    return Response.json({}, { status: 500 });
  }
}
