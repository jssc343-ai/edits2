"use client";

import { useState } from "react";
import { Gem } from "lucide-react";
import { toast } from "sonner";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { usePurchase } from "@/lib/pi-payment";
import { useApp, postJson } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function StorePanel() {
  const { products } = usePiAuth();
  const { makePurchase } = usePurchase();
  const { t, uid, username } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = (products ?? []).filter((p) => p.is_active);

  async function buy(productId: string) {
    setBusyId(productId);
    try {
      const result = await makePurchase(productId);
      postJson("/api/payments", {
        uid,
        username,
        productId: result.productId,
        paymentId: result.paymentId,
        txid: result.txid,
      }).catch(() => {});
      toast.success(t("purchaseOk"));
    } catch (e) {
      const message = e instanceof Error ? e.message.toLowerCase() : "";
      toast.error(message.includes("cancel") ? t("purchaseCancel") : t("purchaseFail"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="store-title" className="rounded-2xl border border-border bg-card p-5">
      <h2 id="store-title" className="flex items-center gap-2 text-lg font-semibold">
        <Gem className="size-5 text-primary" aria-hidden="true" />
        {t("store")}
      </h2>
      {active.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("storeEmpty")}</p> : null}
      <ul className="mt-3 flex flex-col gap-3">
        {active.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-sm text-muted-foreground">{p.description}</p>
            </div>
            <Button onClick={() => buy(p.id)} disabled={busyId !== null} className="h-11 shrink-0">
              {busyId === p.id ? <Spinner /> : null}
              {t("buy")} · {p.price_in_pi} Pi
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
