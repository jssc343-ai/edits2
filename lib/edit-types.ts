import type { TKey } from "@/lib/i18n";

export type EditKind = "poster" | "collage" | "single" | "tour" | "video";
export type EditRoute = "ai" | "manual";
export type ChatMode = "text" | "voice";

export const STYLES = [
  "kenburns",
  "flip",
  "cube",
  "carousel",
  "parallax",
  "stack",
  "poster",
] as const;
export const TEMPOS = ["slow", "medium", "fast"] as const;
export const MOODS = ["warm", "cool", "vivid", "mono"] as const;

export type StyleName = (typeof STYLES)[number];
export type Tempo = (typeof TEMPOS)[number];
export type Mood = (typeof MOODS)[number];

export interface EditPlan {
  style: StyleName;
  tempo: Tempo;
  mood: Mood;
  title: string;
  subtitle: string;
  order: number[];
}

export const DEFAULT_STYLE: Record<EditKind, StyleName> = {
  poster: "poster",
  collage: "carousel",
  single: "parallax",
  tour: "kenburns",
  video: "kenburns",
};

export function defaultPlan(kind: EditKind): EditPlan {
  return { style: DEFAULT_STYLE[kind], tempo: "medium", mood: "warm", title: "", subtitle: "", order: [] };
}

export interface KindConfig {
  id: EditKind;
  group: "photo" | "video";
  label: TKey;
  min: number;
  max: number;
  accept: string;
  greeting: TKey;
}

export const KINDS: KindConfig[] = [
  { id: "poster", group: "photo", label: "kind_poster", min: 1, max: 1, accept: "image/*", greeting: "greet_poster" },
  { id: "collage", group: "photo", label: "kind_collage", min: 2, max: 6, accept: "image/*", greeting: "greet_collage" },
  { id: "single", group: "photo", label: "kind_single", min: 1, max: 1, accept: "image/*", greeting: "greet_single" },
  { id: "tour", group: "photo", label: "kind_tour", min: 2, max: 60, accept: "image/*", greeting: "greet_tour" },
  { id: "video", group: "video", label: "kind_video", min: 1, max: 20, accept: "video/*", greeting: "greet_video" },
];

export const MAX_VIDEO_SECONDS = 20 * 60;

export interface MediaItem {
  id: string;
  kind: "image" | "video";
  url: string;
  name: string;
  el: HTMLImageElement | HTMLVideoElement;
  duration: number;
}

export interface Stroke {
  color: string;
  width: number;
  points: [number, number][];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: string[];
  }

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

export interface FeedbackItem {
  id: string;
  uid: string;
  username: string;
  text: string;
  createdAt: number;
  reply?: string;
  repliedAt?: number;
  auto?: boolean;
}

export interface AutoRule {
  id: string;
  keyword: string;
  reply: string;
}

export interface PlayerRecord {
  uid: string;
  username: string;
  lang: string;
  firstSeen: number;
  lastSeen: number;
  exports: number;
}

export interface PaymentRecord {
  id: string;
  uid: string;
  username: string;
  productId: string;
  paymentId: string;
  txid: string;
  createdAt: number;
}
