import { NextResponse } from "next/server";
import { createHmac, randomInt } from "node:crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const exp = Date.now() + CODE_TTL_MS;
  const sig = createHmac("sha256", apiKey).update(`${email}.${code}.${exp}`).digest("hex");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Jsc343 AI Edits 2 <onboarding@resend.dev>",
      to: [email],
      subject: "Your verification code",
      text: `Your Jsc343 AI Edits 2 verification code is ${code}. It expires in 10 minutes.`,
    }),
  });
  if (!res.ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });

  return NextResponse.json({ token: `${exp}.${sig}` });
}
