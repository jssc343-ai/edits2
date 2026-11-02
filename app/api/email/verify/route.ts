import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/server/admin-auth";

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    code?: unknown;
    token?: unknown;
  };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const token = typeof body.token === "string" ? body.token : "";
  const [exp, sig] = token.split(".");

  if (!email || !/^\d{6}$/.test(code) || !exp || !sig || Number(exp) < Date.now()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const expected = createHmac("sha256", apiKey).update(`${email}.${code}.${exp}`).digest("hex");
  if (!safeEqual(sig, expected)) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true });
}
