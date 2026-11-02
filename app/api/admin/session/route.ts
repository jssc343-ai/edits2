import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import {
  ADMIN_COOKIE,
  SESSION_SECONDS,
  adminConfigured,
  isAdmin,
  isAdminEmail,
  makeAdminToken,
  safeEqual,
} from "@/lib/server/admin-auth";

function startSession() {
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

export async function GET() {
  const ok = await isAdmin().catch(() => false);
  return NextResponse.json({ ok, configured: adminConfigured() });
}

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    code?: unknown;
    token?: unknown;
    passcode?: unknown;
  };

  const passcodeSecret = process.env.ADMIN_PASSCODE;
  if (typeof body.passcode === "string" && passcodeSecret) {
    if (!safeEqual(body.passcode, passcodeSecret)) {
      return NextResponse.json({ error: "wrong" }, { status: 401 });
    }
    return startSession();
  }

  const apiKey = process.env.RESEND_API_KEY;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const token = typeof body.token === "string" ? body.token : "";
  const [exp, sig] = token.split(".");
  if (!apiKey || !isAdminEmail(email) || !/^\d{6}$/.test(code) || !exp || !sig || Number(exp) < Date.now()) {
    return NextResponse.json({ error: "wrong" }, { status: 401 });
  }
  const expected = createHmac("sha256", apiKey).update(`${email}.${code}.${exp}`).digest("hex");
  if (!safeEqual(sig, expected)) {
    return NextResponse.json({ error: "wrong" }, { status: 401 });
  }
  return startSession();
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 0 });
  return res;
}
