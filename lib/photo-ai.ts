export interface PhotoAction {
  type: string;
  index: number | null;
  text: string | null;
  color: string | null;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  amount: number | null;
  flag: boolean | null;
}

export const num = (v: number | null | undefined, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
