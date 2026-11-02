"use client";

import { ArrowDownToLine, ArrowUpToLine, Check, RotateCcw } from "lucide-react";
import { useLang } from "@/components/lang-context";

interface LayerBarProps {
  canFix: boolean;
  canConfirm: boolean;
  onFix: () => void;
  onConfirm: () => void;
  hasTarget: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}

const base = "flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 text-sm font-semibold disabled:opacity-30 disabled:grayscale";

export function LayerBar({ canFix, canConfirm, onFix, onConfirm, hasTarget, canUp, canDown, onUp, onDown }: LayerBarProps) {
  const { L } = useLang();
  return (
    <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={L("確認與層次", "Confirm and layers")}>
      <button type="button" disabled={!canFix} onClick={onFix} className={`${base} bg-orange-500 text-white`}>
        <RotateCcw className="size-4" aria-hidden="true" />
        {L("更正", "Revert")}
      </button>
      <button
        type="button"
        disabled={!hasTarget || !canUp}
        onClick={onUp}
        className={`${base} border border-border bg-card text-foreground`}
        aria-label={L("上一層：物件往上移一層", "Up one layer")}
      >
        <ArrowUpToLine className="size-4" aria-hidden="true" />
        {L("上一層", "Up")}
      </button>
      <button
        type="button"
        disabled={!hasTarget || !canDown}
        onClick={onDown}
        className={`${base} border border-border bg-card text-foreground`}
        aria-label={L("下一層：物件往下移一層", "Down one layer")}
      >
        <ArrowDownToLine className="size-4" aria-hidden="true" />
        {L("下一層", "Down")}
      </button>
      <button type="button" disabled={!canConfirm} onClick={onConfirm} className={`${base} bg-green-600 text-white`}>
        <Check className="size-4" aria-hidden="true" />
        {L("確認", "Confirm")}
      </button>
    </div>
  );
}
