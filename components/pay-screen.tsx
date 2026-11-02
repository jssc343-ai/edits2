"use client";

import { useApp } from "@/lib/app-state";
import { PageShell } from "@/components/page-shell";
import { StorePanel } from "@/components/store-panel";

export function PayScreen() {
  const { t } = useApp();
  return (
    <PageShell title={t("store")}>
      <StorePanel />
    </PageShell>
  );
}
