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

export function seedOrder(size: number): number[] {
  let rounds = [1, 2];
  while (rounds.length < size) {
    const sum = rounds.length * 2 + 1;
    const next: number[] = [];
    rounds.forEach((s, i) => {
      if (i % 2 === 0) { next.push(s); next.push(sum - s); }
      else { next.push(sum - s); next.push(s); }
    });
    rounds = next;
  }
  return rounds;
}

function placeWinnerIntoNext(matches: BracketMatch[], round: number, position: number, winnerId: string): void {
  const next = matches.find(m => m.round === round + 1 && m.position === Math.floor(position / 2));
  if (!next) return;
  if (position % 2 === 0) next.p1Id = winnerId; else next.p2Id = winnerId;
}

export function generateBracket(participants: SeedEntry[]): Bracket {
  const size = nextPowerOfTwo(Math.max(participants.length, 2));
  const order = seedOrder(size);
  const bySeed = new Map(participants.map(p => [p.seed, p]));
  const slots: (string | null)[] = order.map(seed => bySeed.get(seed)?.id ?? null);
  const matches: BracketMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const p1 = slots[i * 2], p2 = slots[i * 2 + 1];
    const winnerId = p2 === null && p1 !== null ? p1 : p1 === null && p2 !== null ? p2 : null;
    matches.push({ round: 1, position: i, p1Id: p1, p2Id: p2, winnerId });
  }
  let round = 2, count = size / 4;
  while (count >= 1) {
    for (let i = 0; i < count; i++) matches.push({ round, position: i, p1Id: null, p2Id: null, winnerId: null });
    count = Math.floor(count / 2);
    round++;
  }
  for (const m of matches.filter(x => x.round === 1 && x.winnerId)) {
    placeWinnerIntoNext(matches, m.round, m.position, m.winnerId!);
  }
  return { size, matches };
}
