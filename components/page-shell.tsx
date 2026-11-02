"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { Button } from "@/components/ui/button";

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useApp();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-border bg-background px-3 py-2">
        <Button asChild variant="ghost" size="icon" className="size-11 shrink-0">
          <Link href="/" aria-label={t("back")}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="truncate text-base font-semibold">{title}</h1>
      </header>
      <main className="flex flex-col gap-4 px-4 pb-10 pt-4">{children}</main>
    </div>
  );
}
