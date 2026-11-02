import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "jsc_admin";
const SESSION_MS = 1000 * 60 * 60 * 8;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const DEFAULT_ADMIN_EMAILS = ["jangshch10998@gmail.com", "a0935309655@gmail.com"];

export function adminEmails(): string[] {
  const extra = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...extra]));
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

function sessionSecret(): string {
  return process.env.ADMIN_PASSCODE || process.env.RESEND_API_KEY || "";
}

export function adminConfigured(): boolean {
  return Boolean(sessionSecret());
}

export function makeAdminToken(): string {
  const secret = sessionSecret();
  const exp = String(Date.now() + SESSION_MS);
  return `${exp}.${sign(`admin.${exp}`, secret)}`;
}

export async function isAdmin(): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(`admin.${exp}`, secret));
}

export const SESSION_SECONDS = SESSION_MS / 1000;
