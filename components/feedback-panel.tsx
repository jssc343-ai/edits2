"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { useApp, postJson } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AnnouncementsPanel() {
  const { t, inbox } = useApp();
  const announcements = inbox?.announcements ?? [];

  return (
    <section aria-labelledby="ann-title" className="rounded-2xl border border-border bg-card p-5">
      <h2 id="ann-title" className="flex items-center gap-2 text-lg font-semibold">
        <Megaphone className="size-5 text-accent" aria-hidden="true" />
        {t("announcements")}
      </h2>
      {announcements.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("noAnnouncements")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-xl bg-secondary p-3">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function FeedbackForm() {
  const { t, uid, username, inbox, refreshInbox } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await postJson("/api/feedback", { uid, username, text });
      setText("");
      toast.success(t("feedbackThanks"));
      refreshInbox();
    } catch {
      toast.error(t("chatError"));
    } finally {
      setBusy(false);
    }
  }

  const feedback = inbox?.feedback ?? [];

  return (
    <section aria-labelledby="fb-title" className="rounded-2xl border border-border bg-card p-5">
      <h2 id="fb-title" className="text-lg font-semibold">
        {t("feedbackTitle")}
      </h2>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("feedbackPlaceholder")}
        maxLength={800}
        className="mt-3 min-h-28"
        aria-label={t("feedbackTitle")}
      />
      <Button onClick={submit} disabled={busy || !text.trim()} className="mt-3 h-11 w-full">
        <Send className="size-4" aria-hidden="true" />
        {t("submit")}
      </Button>
      {feedback.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("yourFeedback")}</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {feedback.slice(0, 10).map((f) => (
              <li key={f.id} className="rounded-xl bg-secondary p-3 text-sm">
                <p>{f.text}</p>
                {f.reply ? (
                  <p className="mt-2 border-t border-border pt-2 text-primary">
                    {t("replyLabel")}: {f.reply}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
