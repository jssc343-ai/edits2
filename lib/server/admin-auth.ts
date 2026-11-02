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

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE);
}

export function makeAdminToken(): string {
  const secret = process.env.ADMIN_PASSCODE ?? "";
  const exp = String(Date.now() + SESSION_MS);
  return `${exp}.${sign(`admin.${exp}`, secret)}`;
}

export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSCODE;
  if (!secret) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(`admin.${exp}`, secret));
}

export const SESSION_SECONDS = SESSION_MS / 1000;
