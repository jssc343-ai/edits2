import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_SECONDS,
  adminConfigured,
  isAdmin,
  makeAdminToken,
  safeEqual,
} from "@/lib/server/admin-auth";

export async function GET() {
  const ok = await isAdmin().catch(() => false);
  return NextResponse.json({ ok, configured: adminConfigured() });
}

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { passcode?: unknown };
  const passcode = typeof body.passcode === "string" ? body.passcode : "";
  if (!safeEqual(passcode, process.env.ADMIN_PASSCODE ?? "")) {
    return NextResponse.json({ error: "wrong" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeAdminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 0 });
  return res;
}
