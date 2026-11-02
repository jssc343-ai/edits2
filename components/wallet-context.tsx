"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePurchase } from "@/lib/pi-payment";
import { pi } from "@/lib/pi";
import { PACKS, type Pack } from "@/lib/pricing";
import { ADMIN_DAILY_POINTS, ADMIN_TIME_ZONE } from "@/lib/app-config";

export type BuyResult = { ok: true } | { ok: false; reason: "cancelled" | "unavailable" | "error" };

interface WalletValue {
  points: number;
  ready: boolean;
  isAdmin: boolean;
  setAdmin: (on: boolean) => void;
  canAfford: (cost: number) => boolean;
  buy: (pack: Pack) => Promise<BuyResult>;
  spend: (cost: number) => Promise<boolean>;
}

const WalletContext = createContext<WalletValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

const todayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: ADMIN_TIME_ZONE }).format(new Date());

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const api = usePurchase();
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  });

  const store = useRef({
    wallet: 0,
    units: {} as Record<string, number>,
    adminPts: 0,
    adminDay: "",
    admin: false,
    loaded: false,
  });
  const [points, setPoints] = useState(0);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const publish = useCallback(() => {
    const s = store.current;
    const total = s.admin ? s.adminPts : PACKS.reduce((sum, p) => sum + (s.units[p.slug] ?? 0) * p.points, s.wallet);
    setPoints(total);
    setIsAdmin(s.admin);
  }, []);

  const persist = useCallback(async (attempt = 0) => {
    const s = store.current;
    try {
      await pi.userState.set("wallet", { points: s.wallet, adminPts: s.adminPts, adminDay: s.adminDay });
    } catch {
      if (attempt < 3) setTimeout(() => persist(attempt + 1), 6000 * (attempt + 1));
    }
  }, []);

  const ensureDaily = useCallback(() => {
    const s = store.current;
    if (!s.admin || !s.loaded) return;
    const today = todayKey();
    if (s.adminDay !== today) {
      s.adminPts = ADMIN_DAILY_POINTS;
      s.adminDay = today;
      persist();
    }
  }, [persist]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rec = await pi.userState.get("wallet");
        const b = rec?.blob as { points?: unknown; adminPts?: unknown; adminDay?: unknown } | undefined;
        if (typeof b?.points === "number" && b.points >= 0) store.current.wallet = b.points;
        if (typeof b?.adminPts === "number" && b.adminPts >= 0) store.current.adminPts = b.adminPts;
        if (typeof b?.adminDay === "string") store.current.adminDay = b.adminDay;
      } catch {}
      try {
        const { purchases } = await apiRef.current.restore();
        const units: Record<string, number> = {};
        purchases.forEach((x) => {
          units[x.productId] = x.quantity;
        });
        store.current.units = units;
      } catch {}
      if (!alive) return;
      store.current.loaded = true;
      ensureDaily();
      publish();
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [publish, ensureDaily]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!store.current.admin) return;
      ensureDaily();
      publish();
    }, 60000);
    return () => clearInterval(id);
  }, [ensureDaily, publish]);

  const setAdmin = useCallback(
    (on: boolean) => {
      store.current.admin = on;
      ensureDaily();
      publish();
    },
    [ensureDaily, publish],
  );

  const buy = useCallback(
    async (pack: Pack): Promise<BuyResult> => {
      try {
        const result = await apiRef.current.makePurchase(pack.slug);
        if (!result.ok) return { ok: false, reason: "error" };
        const s = store.current;
        s.units = { ...s.units, [pack.slug]: (s.units[pack.slug] ?? 0) + 1 };
        publish();
        return { ok: true };
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "purchase_cancelled") return { ok: false, reason: "cancelled" };
        if (code === "product_not_found") return { ok: false, reason: "unavailable" };
        return { ok: false, reason: "error" };
      }
    },
    [publish],
  );

  const spend = useCallback(
    async (cost: number) => {
      const s = store.current;
      if (s.admin) {
        ensureDaily();
        if (s.adminPts < cost) return false;
        s.adminPts -= cost;
        publish();
        persist();
        return true;
      }
      const byValue = [...PACKS].sort((a, b) => a.points - b.points);
      while (s.wallet < cost) {
        const pack = byValue.find((p) => (s.units[p.slug] ?? 0) > 0);
        if (!pack) return false;
        try {
          await apiRef.current.consume(pack.slug, 1);
        } catch {
          return false;
        }
        s.units = { ...s.units, [pack.slug]: s.units[pack.slug] - 1 };
        s.wallet += pack.points;
      }
      s.wallet -= cost;
      publish();
      persist();
      return true;
    },
    [publish, persist, ensureDaily],
  );

  const value = useMemo<WalletValue>(
    () => ({ points, ready, isAdmin, setAdmin, canAfford: (cost) => points >= cost, buy, spend }),
    [points, ready, isAdmin, setAdmin, buy, spend],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
