"use client";

import { useState } from "react";
import { Coins, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLang } from "@/components/lang-context";
import { useWallet } from "@/components/wallet-context";
import { COST, PACKS, POINTS_PER_PI } from "@/lib/pricing";

export function PayView() {
  const { L } = useLang();
  const wallet = useWallet();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const buy = async (slug: string) => {
    const pack = PACKS.find((p) => p.slug === slug);
    if (!pack || busySlug) return;
    setBusySlug(slug);
    setMessage(null);
    const result = await wallet.buy(pack);
    setBusySlug(null);
    if (result.ok) {
      setMessage({ ok: true, text: L(`儲值成功，已增加 ${pack.points.toLocaleString()} 點。`, `Top-up complete: +${pack.points.toLocaleString()} points.`) });
    } else if (result.reason === "cancelled") {
      setMessage({ ok: false, text: L("已取消支付。", "Payment cancelled.") });
    } else if (result.reason === "unavailable") {
      setMessage({ ok: false, text: L("此儲值方案尚未開放。", "This top-up option is not available yet.") });
    } else {
      setMessage({ ok: false, text: L("支付未完成，請稍後再試。", "Payment did not complete. Please try again.") });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-1 rounded-2xl bg-primary p-6 text-primary-foreground">
        <Coins className="size-8" aria-hidden="true" />
        <p className="text-sm opacity-90">{L("目前點數", "Your points")}</p>
        <p className="text-4xl font-bold tabular-nums">{wallet.ready ? wallet.points.toLocaleString() : "..."}</p>
        <p className="text-xs opacity-90">{`1 Pi = ${POINTS_PER_PI.toLocaleString()} ${L("點", "points")}`}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{L("儲值", "Top up")}</h2>
        {PACKS.map((p) => (
          <Button
            key={p.slug}
            variant="outline"
            className="h-14 justify-between px-4 text-base"
            disabled={!!busySlug}
            onClick={() => buy(p.slug)}
          >
            <span className="font-semibold tabular-nums">{p.points.toLocaleString()} {L("點", "pts")}</span>
            <span className="flex items-center gap-2 text-primary">
              {busySlug === p.slug && <Spinner />}
              {p.pi} Pi
            </span>
          </Button>
        ))}
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-secondary p-4">
        <h2 className="text-lg font-semibold">{L("每次製作扣點", "Cost per creation")}</h2>
        <div className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" aria-hidden="true" />
            {L("相片編輯", "Photo editing")}
          </span>
          <span className="font-semibold tabular-nums">{COST.photo} {L("點", "pts")}</span>
        </div>
        <div className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Video className="size-5 text-primary" aria-hidden="true" />
            {L("短視頻編輯", "Video editing")}
          </span>
          <span className="font-semibold tabular-nums">{COST.video} {L("點", "pts")}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {L("測試期間暫不收費，Pi 支付完成後才會正式開啟扣點。", "Creating is free during testing. Points will only be deducted once Pi payment is officially live.")}
        </p>
      </section>
    </div>
  );
}
