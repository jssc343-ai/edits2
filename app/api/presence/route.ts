import { NextResponse } from "next/server";
import { clean, store } from "@/lib/server/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    uid?: unknown;
    username?: unknown;
    lang?: unknown;
    event?: unknown;
  };
  const uid = clean(body.uid, 80);
  if (!uid) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const now = Date.now();
  const existing = store.players.get(uid);
  const record = existing ?? {
    uid,
    username: "",
    lang: "",
    firstSeen: now,
    lastSeen: now,
    exports: 0,
  };
  record.username = clean(body.username, 60) || record.username;
  record.lang = clean(body.lang, 10) || record.lang;
  record.lastSeen = now;
  if (body.event === "export") record.exports += 1;
  store.players.set(uid, record);

  return NextResponse.json({
    announcements: store.announcements,
    feedback: store.feedback.filter((f) => f.uid === uid).sort((a, b) => b.createdAt - a.createdAt),
  });
}
