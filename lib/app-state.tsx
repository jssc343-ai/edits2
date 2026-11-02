"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useSWR from "swr";
import { pi } from "@/lib/pi";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { detectLang, getLang, translate, type TKey } from "@/lib/i18n";
import type { Announcement, ChatMode, FeedbackItem } from "@/lib/edit-types";

interface Profile {
  email: string;
  verified: boolean;
}

interface Inbox {
  announcements: Announcement[];
  feedback: FeedbackItem[];
}

interface AppState {
  lang: string;
  setLang: (code: string) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  profile: Profile;
  setProfile: (p: Profile) => void;
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
  uid: string;
  username: string;
  inbox: Inbox | undefined;
  refreshInbox: () => void;
  trackExport: () => void;
}

const AppContext = createContext<AppState | null>(null);

const PROFILE_KEY = "profile";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = usePiAuth();
  const uid = user?.uid ?? "guest";
  const username = user?.username ?? "guest";

  const [lang, setLangState] = useState("zh-TW");
  const [mode, setModeState] = useState<ChatMode>("text");
  const [profile, setProfileState] = useState<Profile>({ email: "", verified: false });
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    pi.userState
      .get(PROFILE_KEY)
      .then((record) => {
        if (cancelled) return;
        const data = (record as { data?: Record<string, unknown> } | null)?.data ?? (record as Record<string, unknown> | null);
        if (data && typeof data === "object") {
          if (typeof data.lang === "string") setLangState(data.lang);
          else setLangState(detectLang());
          if (data.mode === "voice" || data.mode === "text") setModeState(data.mode);
          setProfileState({
            email: typeof data.email === "string" ? data.email : "",
            verified: data.verified === true,
          });
        } else {
          setLangState(detectLang());
        }
      })
      .catch(() => setLangState(detectLang()))
      .finally(() => {
        loaded.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: { lang: string; mode: ChatMode; profile: Profile }) => {
    if (!loaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      pi.userState
        .set(PROFILE_KEY, {
          lang: next.lang,
          mode: next.mode,
          email: next.profile.email,
          verified: next.profile.verified,
        })
        .catch(() => {});
    }, 2000);
  }, []);

  const setLang = useCallback(
    (code: string) => {
      setLangState(code);
      persist({ lang: code, mode, profile });
    },
    [mode, profile, persist],
  );
  const setMode = useCallback(
    (m: ChatMode) => {
      setModeState(m);
      persist({ lang, mode: m, profile });
    },
    [lang, profile, persist],
  );
  const setProfile = useCallback(
    (p: Profile) => {
      setProfileState(p);
      persist({ lang, mode, profile: p });
    },
    [lang, mode, persist],
  );

  useEffect(() => {
    const info = getLang(lang);
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.rtl ? "rtl" : "ltr";
  }, [lang]);

  const { data: inbox, mutate } = useSWR<Inbox>(
    ["presence", uid, username, lang],
    () => postJson<Inbox>("/api/presence", { uid, username, lang }),
    { refreshInterval: 30_000, revalidateOnFocus: true },
  );

  const trackExport = useCallback(() => {
    postJson("/api/presence", { uid, username, lang, event: "export" }).catch(() => {});
  }, [uid, username, lang]);

  const needsRemote = lang !== "en" && lang !== "zh-TW";
  const { data: extra } = useSWR<Record<string, string>>(
    needsRemote ? ["ui-translation", lang] : null,
    () => postJson<Record<string, string>>("/api/translate", { lang }),
    { revalidateOnFocus: false, revalidateIfStale: false, errorRetryCount: 3, errorRetryInterval: 4000, dedupingInterval: 3_600_000 },
  );

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars, extra),
    [lang, extra],
  );

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      t,
      profile,
      setProfile,
      mode,
      setMode,
      uid,
      username,
      inbox,
      refreshInbox: () => void mutate(),
      trackExport,
    }),
    [lang, setLang, t, profile, setProfile, mode, setMode, uid, username, inbox, mutate, trackExport],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export { postJson };
