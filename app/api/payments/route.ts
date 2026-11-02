import { NextResponse } from "next/server";
import { clean, newId, store } from "@/lib/server/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const uid = clean(body.uid, 80);
  const productId = clean(body.productId, 80);
  if (!uid || !productId) return NextResponse.json({ error: "invalid" }, { status: 400 });

  store.payments.push({
    id: newId(),
    uid,
    username: clean(body.username, 60),
    productId,
    paymentId: clean(body.paymentId, 120),
    txid: clean(body.txid, 160),
    createdAt: Date.now(),
  });
  store.payments = store.payments.slice(-500);
  return NextResponse.json({ ok: true });
}
