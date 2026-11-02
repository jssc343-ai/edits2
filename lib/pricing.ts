export const POINTS_PER_PI = 1000;

// Set to false once Pi payments are live to start charging points.
export const FREE_TESTING = true;

export const COST = { photo: 30, video: 50 } as const;

export interface Pack {
  slug: string;
  pi: number;
  points: number;
}

export const PACKS: Pack[] = [
  { slug: "points_1pi", pi: 1, points: 1 * POINTS_PER_PI },
  { slug: "points_5pi", pi: 5, points: 5 * POINTS_PER_PI },
  { slug: "points_10pi", pi: 10, points: 10 * POINTS_PER_PI },
];
