export const ADMIN_EMAILS = [
  "jangshihchang@gmail.com",
  "a0988576990@gmail.com",
  "a0931653580@gmail.com",
  "a0936753580@gmail.com",
  "a0932158918@gmail.com",
] as const;

export const ADMIN_DAILY_POINTS = 1000;
export const ADMIN_TIME_ZONE = "Asia/Taipei";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return (ADMIN_EMAILS as readonly string[]).includes(e);
}
