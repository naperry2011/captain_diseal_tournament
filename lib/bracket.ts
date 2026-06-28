export type MediaType = "anime" | "cartoon" | "game";

export interface SeedEntry {
  id: string;
  name: string;
  seed: number; // 1-based
}

export interface BracketMatch {
  round: number; // 1 = first round, increasing toward the final
  position: number; // 0-based slot within the round
  p1Id: string | null; // null = empty/bye slot
  p2Id: string | null;
  winnerId: string | null;
}

export interface Bracket {
  size: number;
  matches: BracketMatch[];
}

export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
