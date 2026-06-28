import { MatchStatus, type Tournament, TournamentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { type SeedEntry, advance, generateBracket } from "@/lib/bracket";
import { diffMatches, matchStatusFor, rowsToBracket } from "@/lib/bracket-persist";

// Pure helpers live in lib/bracket-persist.ts (DB-free so they are unit-testable
// without instantiating a PrismaClient). Re-exported here for convenience.
export { diffMatches, matchStatusFor, rowsToBracket };
export type { MatchDiff, MatchRow } from "@/lib/bracket-persist";

const VALID_SIZES = new Set([8, 16, 32, 64]);

// ---------------------------------------------------------------------------
// Persistence (DB-backed). Reuses lib/bracket.ts for all bracket math.
// ---------------------------------------------------------------------------

export async function createTournament(name: string, size: number): Promise<Tournament> {
  if (!VALID_SIZES.has(size)) {
    throw new Error(`Invalid tournament size ${size}; must be one of 8, 16, 32, 64`);
  }
  return prisma.tournament.create({
    data: { name, size },
  });
}

export async function listTournaments() {
  return prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      participants: { orderBy: { seed: "asc" } },
      matches: { orderBy: [{ round: "asc" }, { position: "asc" }] },
    },
  });
}

export interface ParticipantEntry {
  name: string;
  seed?: number;
  mediaType?: "anime" | "cartoon" | "game";
  mediaId?: string;
  title?: string;
  imageUrl?: string;
}

/**
 * Create participants for a tournament. If seeds are omitted, assign sequential
 * seeds by insertion order (1-based).
 */
export async function addParticipants(tournamentId: string, entries: ParticipantEntry[]) {
  const data = entries.map((e, i) => ({
    tournamentId,
    name: e.name,
    seed: e.seed ?? i + 1,
    mediaType: e.mediaType,
    mediaId: e.mediaId,
    title: e.title,
    imageUrl: e.imageUrl,
  }));
  return prisma.participant.createMany({ data });
}

/** Shuffle participant seeds into a 1..n permutation (Fisher–Yates). */
export async function randomizeSeeds(tournamentId: string) {
  const participants = await prisma.participant.findMany({
    where: { tournamentId },
    select: { id: true },
  });
  const n = participants.length;
  const seeds = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    // Math.random is intentional: this is a cosmetic seed shuffle, not security-sensitive.
    const j = Math.floor(Math.random() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }
  await prisma.$transaction(
    participants.map((p, i) =>
      prisma.participant.update({ where: { id: p.id }, data: { seed: seeds[i] } }),
    ),
  );
}

/**
 * Load participants, build a bracket via the pure engine, and persist Match rows.
 * Only allowed while the tournament is in `setup` — refuses to regenerate (and
 * thereby wipe) a bracket once the tournament is live or done. Sets status -> live.
 */
export async function generateAndSaveBracket(tournamentId: string) {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!t) throw new Error(`Tournament ${tournamentId} not found`);
  if (t.status !== TournamentStatus.setup) {
    throw new Error("Bracket already generated; cannot regenerate a live/done tournament");
  }

  const participants = await prisma.participant.findMany({
    where: { tournamentId },
    orderBy: { seed: "asc" },
  });

  const seedEntries: SeedEntry[] = participants.map((p) => ({
    id: p.id,
    name: p.name,
    seed: p.seed,
  }));

  const bracket = generateBracket(seedEntries);

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { tournamentId } }),
    prisma.match.createMany({
      data: bracket.matches.map((m) => ({
        tournamentId,
        round: m.round,
        position: m.position,
        p1Id: m.p1Id,
        p2Id: m.p2Id,
        winnerId: m.winnerId,
        status: matchStatusFor(m.p1Id, m.p2Id, m.winnerId),
      })),
    }),
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.live },
    }),
  ]);

  return getTournament(tournamentId);
}

/**
 * Record a winner for a match and propagate to the next round, reusing the pure
 * advance() engine to compute the diff, then persisting only the changed rows.
 */
export async function advanceMatch(
  tournamentId: string,
  round: number,
  position: number,
  winnerId: string,
) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true, size: true },
  });
  if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);
  if (tournament.status !== TournamentStatus.live) {
    throw new Error("Tournament is not live; cannot advance matches");
  }

  const rows = await prisma.match.findMany({ where: { tournamentId } });
  const before = rowsToBracket(tournament.size, rows);
  const after = advance(before, round, position, winnerId);

  // Persist exactly the rows the engine touched (pure diff, status included).
  const updates = diffMatches(before, after).map((d) =>
    prisma.match.update({
      where: {
        tournamentId_round_position: {
          tournamentId,
          round: d.round,
          position: d.position,
        },
      },
      data: {
        p1Id: d.p1Id,
        p2Id: d.p2Id,
        winnerId: d.winnerId,
        status: d.status,
      },
    }),
  );

  if (updates.length > 0) await prisma.$transaction(updates);

  return getTournament(tournamentId);
}
