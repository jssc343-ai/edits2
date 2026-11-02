"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLang } from "@/components/lang-context";

export type OutFmt = "orig" | "gif";
export type SessionMode = "once" | "reedit";

export interface WorkLifecycle {
  mode: SessionMode;
  setMode: (m: SessionMode) => void;
  suggest: { fmt: OutFmt; n: number } | null;
  markDownloaded: (fmt: OutFmt) => void;
  discard: () => void;
}

/**
 * Owns the lifetime of one unsaved work. Discarding remounts the editor, which drops every photo and setting.
 * Leaving the page unmounts the editor, so the work is gone as well.
 */
export function WorkSession({ children }: { children: (lc: WorkLifecycle) => ReactNode }) {
  const { L } = useLang();
  const [workKey, setWorkKey] = useState(0);
  const [mode, setMode] = useState<SessionMode>("once");
  const [suggest, setSuggest] = useState<WorkLifecycle["suggest"]>(null);
  const [ask, setAsk] = useState<OutFmt | null>(null);
  const [done, setDone] = useState<null | "both" | "declined">(null);
  const downloaded = useRef<Set<OutFmt>>(new Set());
  const counter = useRef(0);

  const discard = useCallback(() => {
    downloaded.current = new Set();
    setAsk(null);
    setSuggest(null);
    setWorkKey((k) => k + 1);
  }, []);

  const markDownloaded = useCallback(
    (fmt: OutFmt) => {
      if (mode === "reedit") return;
      downloaded.current.add(fmt);
      if (downloaded.current.size >= 2) {
        discard();
        setDone("both");
        return;
      }
      setAsk(fmt === "orig" ? "gif" : "orig");
    },
    [mode, discard],
  );

  const label = (f: OutFmt) => (f === "gif" ? L("GIF", "GIF") : L("保持原創", "Original"));
  const other = ask;
  const first: OutFmt | null = other ? (other === "gif" ? "orig" : "gif") : null;

  const lifecycle: WorkLifecycle = { mode, setMode, suggest, markDownloaded, discard };

  return (
    <>
      <div key={workKey}>{children(lifecycle)}</div>

      <AlertDialog open={ask !== null} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L("已下載完成", "Download complete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {other && first
                ? L(
                    `「${label(first)}」已下載。要繼續下載「${label(other)}」嗎？選擇「否」會立即刪除這個作品。`,
                    `"${label(first)}" is downloaded. Download "${label(other)}" too? Choosing No deletes this work right away.`,
                  )
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAsk(null);
                setDone("declined");
                discard();
              }}
            >
              {L("否，刪除作品", "No, delete it")}
            </Button>
            <Button
              onClick={() => {
                if (other) {
                  counter.current += 1;
                  setSuggest({ fmt: other, n: counter.current });
                }
                setAsk(null);
              }}
            >
              {L("是，繼續下載", "Yes, continue")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={done !== null} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L("作品已刪除", "Work deleted")}</AlertDialogTitle>
            <AlertDialogDescription>
              {done === "both"
                ? L("兩種格式都已下載完成，系統已自動刪除這個作品。", "Both formats are downloaded, so the work was deleted automatically.")
                : L("已刪除這個作品，你可以開始新的編輯。", "The work was deleted. You can start a new one.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setDone(null)}>{L("知道了", "OK")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function LifecycleBar({ lifecycle, disabled }: { lifecycle: WorkLifecycle; disabled?: boolean }) {
  const { L } = useLang();
  const [confirm, setConfirm] = useState(false);
  const { mode, setMode } = lifecycle;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={L("編輯方式", "Edit style")}>
        <Button type="button" variant={mode === "once" ? "default" : "outline"} className="h-auto flex-col gap-0.5 py-2" onClick={() => setMode("once")} aria-pressed={mode === "once"} disabled={disabled}>
          <span>{L("單次編輯", "One-time")}</span>
          <span className="text-xs font-normal opacity-80">{L("下載後自動刪除", "Deleted after download")}</span>
        </Button>
        <Button type="button" variant={mode === "reedit" ? "default" : "outline"} className="h-auto flex-col gap-0.5 py-2" onClick={() => setMode("reedit")} aria-pressed={mode === "reedit"} disabled={disabled}>
          <span>{L("重新編輯", "Keep editing")}</span>
          <span className="text-xs font-normal opacity-80">{L("下載後可繼續修改", "Edit again after download")}</span>
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {mode === "once"
          ? L("下載其中一種後會詢問是否下載另一種，選「否」或兩種都下載完，作品就會刪除。離開頁面也會刪除。", "After one download you are asked about the other format. Choosing No, or finishing both, deletes the work. Leaving the page deletes it too.")
          : L("下載後作品會保留，方便你修改再下載。放棄或離開頁面時才會刪除。", "The work stays after download so you can tweak and download again. It is deleted only when you discard it or leave the page.")}
      </p>
      <Button type="button" variant="ghost" size="sm" className="self-start text-destructive" onClick={() => setConfirm(true)} disabled={disabled}>
        <Trash2 className="size-4" aria-hidden="true" />
        {L("放棄並刪除作品", "Discard this work")}
      </Button>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L("放棄這個作品？", "Discard this work?")}</AlertDialogTitle>
            <AlertDialogDescription>{L("所有素材與設定都會被刪除，無法復原。", "All media and settings will be removed. This cannot be undone.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>{L("取消", "Cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirm(false);
                lifecycle.discard();
              }}
            >
              {L("刪除", "Delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
