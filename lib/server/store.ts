import type {
  Announcement,
  AutoRule,
  FeedbackItem,
  PaymentRecord,
  PlayerRecord,
} from "@/lib/edit-types";

interface Store {
  players: Map<string, PlayerRecord>;
  announcements: Announcement[];
  feedback: FeedbackItem[];
  rules: AutoRule[];
  payments: PaymentRecord[];
}

const g = globalThis as unknown as { __jscStore?: Store };

export const store: Store = (g.__jscStore ??= {
  players: new Map(),
  announcements: [],
  feedback: [],
  rules: [
    {
      id: "default-download",
      keyword: "download",
      reply: "To keep your edit, press the Download button in the studio. Edits are not stored.",
    },
  ],
  payments: [],
});

export const ONLINE_WINDOW_MS = 60_000;

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
