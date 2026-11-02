"use client";

import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useLang } from "@/components/lang-context";

export type LockPhase = "idle" | "editing" | "confirmed";

export function useEditLock<T extends string>(initial: T) {
  const [tab, setTab] = useState<T>(initial);
  const [phase, setPhase] = useState<LockPhase>("idle");

  const canOpen = (id: T) => (phase === "idle" ? true : phase === "editing" ? id === tab : id !== tab);

  const open = (id: T) => {
    if (!canOpen(id)) return false;
    setTab(id);
    setPhase("editing");
    return true;
  };

  return {
    tab,
    phase,
    canOpen,
    open,
    confirm: () => setPhase("confirmed"),
    reopen: () => setPhase("editing"),
  };
}

export function EditLockPanel({ phase, children }: { phase: LockPhase; children: ReactNode }) {
  const { L } = useLang();
  const locked = phase !== "editing";
  return (
    <div className="flex flex-col gap-3">
      {locked && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {phase === "idle"
            ? L("請先點按上方一個主項目，才會開啟它的細項編輯。", "Tap a main item above first to unlock its detail options.")
            : L(
                "已確認，細項已鎖住。按橘色「更正」可再編輯這個項目，或點按上方其他主項目。",
                "Confirmed and locked. Tap the orange Revise to edit this item again, or pick another main item above.",
              )}
        </p>
      )}
      <div inert={locked} aria-disabled={locked} className={`flex flex-col gap-4 ${locked ? "opacity-40" : ""}`}>
        {children}
      </div>
    </div>
  );
}
