import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/admin-auth";
import { ONLINE_WINDOW_MS, clean, newId, store } from "@/lib/server/store";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = Date.now();
  const players = [...store.players.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  return NextResponse.json({
    players,
    online: players.filter((p) => now - p.lastSeen < ONLINE_WINDOW_MS),
    announcements: store.announcements,
    feedback: [...store.feedback].sort((a, b) => b.createdAt - a.createdAt),
    rules: store.rules,
    payments: [...store.payments].sort((a, b) => b.createdAt - a.createdAt),
  });
}

interface Action {
  action?: string;
  id?: string;
  title?: string;
  body?: string;
  text?: string;
  keyword?: string;
  reply?: string;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const data = (await req.json().catch(() => ({}))) as Action;

  switch (data.action) {
    case "announce": {
      const title = clean(data.title, 80);
      const body = clean(data.body, 600);
      if (!title || !body) return NextResponse.json({ error: "invalid" }, { status: 400 });
      store.announcements.unshift({ id: newId(), title, body, createdAt: Date.now() });
      store.announcements = store.announcements.slice(0, 50);
      break;
    }
    case "deleteAnnouncement":
      store.announcements = store.announcements.filter((a) => a.id !== data.id);
      break;
    case "reply": {
      const text = clean(data.text, 600);
      const item = store.feedback.find((f) => f.id === data.id);
      if (!item || !text) return NextResponse.json({ error: "invalid" }, { status: 400 });
      item.reply = text;
      item.repliedAt = Date.now();
      item.auto = false;
      break;
    }
    case "addRule": {
      const keyword = clean(data.keyword, 40).toLowerCase();
      const reply = clean(data.reply, 600);
      if (!keyword || !reply) return NextResponse.json({ error: "invalid" }, { status: 400 });
      store.rules.push({ id: newId(), keyword, reply });
      break;
    }
    case "deleteRule":
      store.rules = store.rules.filter((r) => r.id !== data.id);
      break;
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
