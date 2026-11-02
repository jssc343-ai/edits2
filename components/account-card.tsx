"use client";

import { useState } from "react";
import { BadgeCheck, MailWarning, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp, postJson } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function AccountCard() {
  const { t, username, profile, setProfile } = useApp();
  const [email, setEmail] = useState(profile.email);
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    try {
      const res = await postJson<{ token: string }>("/api/email/send", { email });
      setToken(res.token);
      toast.success(t("codeSent"));
    } catch {
      toast.error(t("emailUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      await postJson("/api/email/verify", { email, code, token });
      setProfile({ email: email.trim().toLowerCase(), verified: true });
      setCode("");
      setToken("");
      toast.success(t("verified"));
    } catch {
      toast.error(t("codeWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="account-title" className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="account-title" className="text-lg font-semibold">
            {t("accountTitle")}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            {t("piUser")}: <span className="font-medium text-foreground">{username}</span>
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            profile.verified ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
          }`}
        >
          {profile.verified ? (
            <BadgeCheck className="size-4" aria-hidden="true" />
          ) : (
            <MailWarning className="size-4" aria-hidden="true" />
          )}
          {profile.verified ? t("verified") : t("notVerified")}
        </span>
      </div>

      {profile.verified ? (
        <p className="mt-4 break-all text-sm text-muted-foreground">{profile.email}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
              <Button onClick={sendCode} disabled={busy || !email.includes("@")} className="h-11 shrink-0">
                {busy && !token ? <Spinner /> : null}
                {t("sendCode")}
              </Button>
            </div>
          </div>
          {token ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t("codeLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="h-11 tracking-widest"
                />
                <Button onClick={verify} disabled={busy || code.length !== 6} className="h-11 shrink-0">
                  {busy ? <Spinner /> : null}
                  {t("verify")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
