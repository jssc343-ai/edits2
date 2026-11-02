import { NextResponse } from "next/server";
import { clean, newId, store } from "@/lib/server/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    uid?: unknown;
    username?: unknown;
    text?: unknown;
  };
  const uid = clean(body.uid, 80);
  const text = clean(body.text, 800);
  if (!uid || !text) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const lower = text.toLowerCase();
  const rule = store.rules.find((r) => lower.includes(r.keyword));

  store.feedback.push({
    id: newId(),
    uid,
    username: clean(body.username, 60),
    text,
    createdAt: Date.now(),
    ...(rule ? { reply: rule.reply, repliedAt: Date.now(), auto: true } : {}),
  });
  store.feedback = store.feedback.slice(-500);

  return NextResponse.json({ ok: true, autoReplied: Boolean(rule) });
}
