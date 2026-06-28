import type { Bracket, BracketMatch } from "@/lib/bracket";

// Pure helpers bridging the DB representation of matches and the bracket engine.
// This module intentionally imports NO database code so it can be unit-tested in
// isolation (importing lib/db.ts would construct a PrismaClient at module load).

/**
 * Pure status rule for a match given its slots and winner.
 * - done:    a winner has been decided
 * - ready:   both participants are present and no winner yet
 * - pending: a slot is still empty (waiting on an earlier round)
 */
export function matchStatusFor(
  p1Id: string | null,
  p2Id: string | null,
  winnerId: string | null,
): "pending" | "ready" | "done" {
  if (winnerId !== null) return "done";
  if (p1Id !== null && p2Id !== null) return "ready";
  return "pending";
}

/** A DB-shaped match row (subset of the Prisma Match model needed for bracket math). */
export interface MatchRow {
  round: number;
  position: number;
  p1Id: string | null;
  p2Id: string | null;
  winnerId: string | null;
}

/**
 * Convert persisted match rows back into a Bracket the pure engine understands.
 * Rows are normalized (sorted by round then position) so the result is stable.
 */
export function rowsToBracket(size: number, matchRows: MatchRow[]): Bracket {
  const matches: BracketMatch[] = matchRows
    .map((m) => ({
      round: m.round,
      position: m.position,
      p1Id: m.p1Id,
      p2Id: m.p2Id,
      winnerId: m.winnerId,
    }))
    .sort((a, b) => (a.round - b.round) || (a.position - b.position));
  return { size, matches };
}
