import { MatchStatus } from "@prisma/client";
import type { Bracket, BracketMatch } from "@/lib/bracket";

// Pure helpers bridging the DB representation of matches and the bracket engine.
// This module intentionally imports NO database *connection* code (it never
// touches lib/db.ts / PrismaClient), so it can be unit-tested in isolation.
// Importing the MatchStatus enum from @prisma/client is safe: it is a plain
// generated object, not the client, so it does not construct a PrismaClient.

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
): MatchStatus {
  if (winnerId !== null) return MatchStatus.done;
  if (p1Id !== null && p2Id !== null) return MatchStatus.ready;
  return MatchStatus.pending;
}

/** A DB-shaped match row (subset of the Prisma Match model needed for bracket math). */
export interface MatchRow {
  round: number;
  position: number;
  p1Id: string | null;
  p2Id: string | null;
  winnerId: string | null;
}

/** A persisted match update: identity (round/position) plus the new slot/status values. */
export interface MatchDiff {
  round: number;
  position: number;
  p1Id: string | null;
  p2Id: string | null;
  winnerId: string | null;
  status: MatchStatus;
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

/**
 * Compute the set of match rows that changed between two brackets (pure).
 * A match is "changed" when any of p1Id/p2Id/winnerId differs from the prior
 * bracket. The returned status is derived from the new slot/winner values.
 * Used by advanceMatch to persist exactly the rows the engine touched.
 */
export function diffMatches(before: Bracket, after: Bracket): MatchDiff[] {
  const diffs: MatchDiff[] = [];
  for (const m of after.matches) {
    const prev = before.matches.find(
      (x) => x.round === m.round && x.position === m.position,
    );
    if (
      prev &&
      (prev.p1Id !== m.p1Id || prev.p2Id !== m.p2Id || prev.winnerId !== m.winnerId)
    ) {
      diffs.push({
        round: m.round,
        position: m.position,
        p1Id: m.p1Id,
        p2Id: m.p2Id,
        winnerId: m.winnerId,
        status: matchStatusFor(m.p1Id, m.p2Id, m.winnerId),
      });
    }
  }
  return diffs;
}
