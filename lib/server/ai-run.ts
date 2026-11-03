import { generateText, Output } from "ai";
import type { ZodType } from "zod";

const MODELS = ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "google/gemini-2.5-flash-lite"];

interface Options<T> {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  schema: ZodType<T>;
  /** Keys every action object must carry, so a plain-JSON fallback can fill missing ones with null. */
  actionKeys: string[];
}

export function selectedNote(selected: unknown): string {
  if (!selected || typeof selected !== "object") return "";
  const multi = (selected as { multiple?: unknown }).multiple;
  if (Array.isArray(multi) && multi.length) {
    return `\nThe player has tapped and boxed ${multi.length} elements on the canvas: ${JSON.stringify(multi).slice(0, 900)}. Whenever the player says "this", "these", "it", "them", "all of them", "這個", "這些", "它們" or gives an instruction with no named target, it means exactly these boxed elements: apply the instruction to every one of them (return one action per element, each with its own index). "Delete"/"remove"/"刪除" means delete every boxed element. Only act on other elements if the player clearly names them.`;
  }
  return `\nThe player has tapped and boxed this element on the canvas: ${JSON.stringify(selected).slice(0, 400)}. Whenever the player says "this", "it", "that", "這個", "它" or gives an instruction with no named target, it means exactly this element (use its index/number in your action). Only act on a different element if the player clearly names one.`;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function fillNulls(raw: unknown, keys: string[]): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as { reply?: unknown; actions?: unknown };
  const actions = Array.isArray(obj.actions) ? obj.actions : [];
  return {
    reply: typeof obj.reply === "string" ? obj.reply : "",
    actions: actions
      .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
      .map((a) => Object.fromEntries(keys.map((k) => [k, a[k] ?? null]))),
  };
}

export async function runStructured<T>({ system, messages, schema, actionKeys }: Options<T>): Promise<T | null> {
  for (const model of MODELS) {
    try {
      const { output } = await generateText({
        model,
        maxOutputTokens: 1500,
        abortSignal: AbortSignal.timeout(14000),
        system,
        messages,
        output: Output.object({ schema }),
      });
      if (output) return output;
    } catch (error) {
      console.error("[ai-run] structured call failed", model, error);
    }
  }

  const jsonSystem = `${system}\nReturn ONLY one JSON object, no markdown, in the shape {"reply": string, "actions": [ {${actionKeys.map((k) => `"${k}": ...`).join(", ")}} ]}. Use null for unused fields.`;
  for (const model of MODELS.slice(0, 2)) {
    try {
      const { text } = await generateText({
        model,
        maxOutputTokens: 1500,
        abortSignal: AbortSignal.timeout(14000),
        system: jsonSystem,
        messages,
      });
      const parsed = schema.safeParse(fillNulls(extractJson(text), actionKeys));
      if (parsed.success) return parsed.data;
    } catch (error) {
      console.error("[ai-run] json fallback failed", model, error);
    }
  }
  return null;
}
