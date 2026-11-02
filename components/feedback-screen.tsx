"use client";

import { useApp } from "@/lib/app-state";
import { PageShell } from "@/components/page-shell";
import { FeedbackForm } from "@/components/feedback-panel";

export function FeedbackScreen() {
  const { t } = useApp();
  return (
    <PageShell title={t("feedbackTitle")}>
      <FeedbackForm />
    </PageShell>
  );
}
