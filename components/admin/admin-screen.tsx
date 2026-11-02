"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp, postJson } from "@/lib/app-state";
import type { Announcement, AutoRule, FeedbackItem, PaymentRecord, PlayerRecord } from "@/lib/edit-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminData {
  players: PlayerRecord[];
  online: PlayerRecord[];
  announcements: Announcement[];
  feedback: FeedbackItem[];
  rules: AutoRule[];
  payments: PaymentRecord[];
}

const jsonFetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

const fmt = (ms: number) => new Date(ms).toLocaleString();

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function LoginForm({ configured, onDone }: { configured: boolean; onDone: () => void }) {
  const { t } = useApp();
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) throw new Error();
      onDone();
    } catch {
      toast.error(t("adminWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold">{t("adminLogin")}</h1>
      {!configured ? <p className="text-sm text-accent">{t("adminUnavailable")}</p> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="passcode">{t("passcode")}</Label>
        <Input
          id="passcode"
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="h-11"
        />
      </div>
      <Button type="submit" className="h-11" disabled={busy || !passcode || !configured}>
        {busy ? <Spinner /> : null}
        {t("login")}
      </Button>
    </form>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { t } = useApp();
  const { data, error, mutate } = useSWR<AdminData>("/api/admin/data", jsonFetcher, {
    refreshInterval: 15000,
    shouldRetryOnError: false,
  });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [keyword, setKeyword] = useState("");
  const [ruleReply, setRuleReply] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});

  async function act(payload: Record<string, string>) {
    try {
      await postJson("/api/admin/data", payload);
      await mutate();
      return true;
    } catch {
      toast.error(t("chatError"));
      return false;
    }
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("admLoadFail")}</p>
        <div className="flex gap-2">
          <Button className="h-11" onClick={() => mutate()}>
            {t("admRetry")}
          </Button>
          <Button variant="outline" className="h-11" onClick={onLogout}>
            {t("logout")}
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center p-10">
        <Spinner />
      </div>
    );
  }

  return (
    <Tabs defaultValue="players" className="w-full">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="players" className="h-10">{t("admTabPlayers")} ({data.players.length})</TabsTrigger>
        <TabsTrigger value="online" className="h-10">{t("admTabOnline")} ({data.online.length})</TabsTrigger>
        <TabsTrigger value="pi" className="h-10">{t("admTabPi")} ({data.payments.length})</TabsTrigger>
        <TabsTrigger value="auto" className="h-10">{t("admTabAuto")}</TabsTrigger>
        <TabsTrigger value="announce" className="h-10">{t("admTabAnnounce")}</TabsTrigger>
        <TabsTrigger value="feedback" className="h-10">{t("admTabFeedback")} ({data.feedback.length})</TabsTrigger>
        <TabsTrigger value="settings" className="h-10">{t("admTabSettings")}</TabsTrigger>
      </TabsList>

      <TabsContent value="players" className="mt-4">
        {data.players.length === 0 ? (
          <Empty text={t("admNoPlayers")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.players.map((p) => (
              <li key={p.uid} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-medium">{p.username}</p>
                <p className="text-muted-foreground">
                  {t("admPlayerLine", {
                    lang: p.lang,
                    first: fmt(p.firstSeen),
                    last: fmt(p.lastSeen),
                    exports: p.exports,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="online" className="mt-4">
        {data.online.length === 0 ? (
          <Empty text={t("admNoOnline")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.online.map((p) => (
              <li key={p.uid} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                <span className="font-medium">{p.username}</span>
                <span className="text-muted-foreground">{fmt(p.lastSeen)}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="pi" className="mt-4">
        {data.payments.length === 0 ? (
          <Empty text={t("admNoPayments")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.payments.map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-medium">{p.username} · {p.productId}</p>
                <p className="break-all text-muted-foreground">{fmt(p.createdAt)} · {p.txid}</p>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="auto" className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="kw">{t("admKeyword")}</Label>
          <Input id="kw" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-11" />
          <Label htmlFor="rr">{t("admReplyContent")}</Label>
          <Textarea id="rr" value={ruleReply} onChange={(e) => setRuleReply(e.target.value)} />
          <Button
            className="h-11"
            disabled={!keyword.trim() || !ruleReply.trim()}
            onClick={async () => {
              if (await act({ action: "addRule", keyword, reply: ruleReply })) {
                setKeyword("");
                setRuleReply("");
              }
            }}
          >
            {t("admAddRule")}
          </Button>
        </div>
        <ul className="flex flex-col gap-2">
          {data.rules.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm">
              <div>
                <p className="font-medium">{r.keyword}</p>
                <p className="text-muted-foreground">{r.reply}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-10 shrink-0" aria-label={t("deleteLabel")} onClick={() => act({ action: "deleteRule", id: r.id })}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </TabsContent>

      <TabsContent value="announce" className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="at">{t("admTitle")}</Label>
          <Input id="at" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" maxLength={80} />
          <Label htmlFor="ab">{t("admContent")}</Label>
          <Textarea id="ab" value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} />
          <Button
            className="h-11"
            disabled={!title.trim() || !body.trim()}
            onClick={async () => {
              if (await act({ action: "announce", title, body })) {
                setTitle("");
                setBody("");
                toast.success(t("admSent"));
              }
            }}
          >
            {t("admSend")}
          </Button>
        </div>
        {data.announcements.length === 0 ? (
          <Empty text={t("admNoAnnounce")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.announcements.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted-foreground">{a.body}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-10 shrink-0" aria-label={t("deleteLabel")} onClick={() => act({ action: "deleteAnnouncement", id: a.id })}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="feedback" className="mt-4">
        {data.feedback.length === 0 ? (
          <Empty text={t("admNoFeedback")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {data.feedback.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-medium">{f.username} <span className="font-normal text-muted-foreground">{fmt(f.createdAt)}</span></p>
                <p>{f.text}</p>
                {f.reply ? (
                  <p className="border-t border-border pt-2 text-primary">
                    {f.auto ? t("admAutoReply") : t("admReply")}: {f.reply}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Input
                    value={replies[f.id] ?? ""}
                    onChange={(e) => setReplies((r) => ({ ...r, [f.id]: e.target.value }))}
                    placeholder={t("admReplyPh")}
                    aria-label={t("admReply")}
                    className="h-11"
                  />
                  <Button
                    className="h-11 shrink-0"
                    disabled={!replies[f.id]?.trim()}
                    onClick={async () => {
                      if (await act({ action: "reply", id: f.id, text: replies[f.id] })) {
                        setReplies((r) => ({ ...r, [f.id]: "" }));
                      }
                    }}
                  >
                    {t("admSubmit")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-muted-foreground">{t("admHint")}</p>
          <Button variant="outline" className="h-11" onClick={onLogout}>
            <LogOut className="size-4" aria-hidden="true" />
            {t("logout")}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function AdminScreen() {
  const { t } = useApp();
  const { data, error, mutate } = useSWR<{ ok: boolean; configured: boolean }>("/api/admin/session", jsonFetcher, {
    shouldRetryOnError: false,
  });

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    mutate();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 p-4">
      <Link href="/" className="flex w-fit items-center gap-2 rounded-lg py-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("admHome")}
      </Link>
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("admConnectFail")}</p>
          <Button className="h-11" onClick={() => mutate()}>
            {t("admRetry")}
          </Button>
        </div>
      ) : !data ? (
        <div className="flex justify-center p-10">
          <Spinner />
        </div>
      ) : data.ok ? (
        <Dashboard onLogout={logout} />
      ) : (
        <LoginForm configured={data.configured} onDone={() => mutate()} />
      )}
    </div>
  );
}
