"use client";

import { ArrowLeft, ArrowRight, Film, Trash2 } from "lucide-react";
import type { MediaItem } from "@/lib/edit-types";
import { useApp } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem[];
  onMove: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}

export function MediaSheet({ open, onOpenChange, media, onMove, onRemove }: Props) {
  const { t } = useApp();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto overscroll-contain rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("mediaCount", { n: media.length })}</SheetTitle>
          <SheetDescription>{t("notSaved")}</SheetDescription>
        </SheetHeader>
        <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          {media.map((m, i) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-xl border border-border bg-secondary p-2">
              {m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={m.name}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg bg-muted px-2 text-center">
                  <Film className="size-8 text-primary" aria-hidden="true" />
                  <span className="line-clamp-2 break-all text-xs text-muted-foreground">{m.name}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-1">
                <Button variant="outline" size="icon" className="size-10" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label={t("earlier")}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button variant="outline" size="icon" className="size-10" disabled={i === media.length - 1} onClick={() => onMove(i, 1)} aria-label={t("later")}>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <Button variant="destructive" size="icon" className="size-10" onClick={() => onRemove(i)} aria-label={t("remove")}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
