"use client";

import { useApp } from "@/lib/app-state";
import { PageShell } from "@/components/page-shell";
import { AnnouncementsPanel } from "@/components/feedback-panel";

export function AnnouncementsScreen() {
  const { t } = useApp();
  return (
    <PageShell title={t("announcements")}>
      <AnnouncementsPanel />
    </PageShell>
  );
}
