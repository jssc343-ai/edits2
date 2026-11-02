import { NextResponse } from "next/server";
import { createHmac, randomInt } from "node:crypto";
import { isAdminEmail } from "@/lib/server/admin-auth";

const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isAdminEmail(email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const exp = Date.now() + CODE_TTL_MS;
  const sig = createHmac("sha256", apiKey).update(`${email}.${code}.${exp}`).digest("hex");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Jsc343 AI Edits 2 <onboarding@resend.dev>",
      to: [email],
      subject: "Admin login code",
      text: `Your Jsc343 AI Edits 2 admin login code is ${code}. It expires in 10 minutes.`,
    }),
  });
  if (!res.ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ token: `${exp}.${sig}` });
}
