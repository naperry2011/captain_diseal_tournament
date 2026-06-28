"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Participant } from "@prisma/client";
import MatchCard, { type MatchCardMatch } from "@/components/MatchCard";
import MatchSpotlight from "@/components/MatchSpotlight";
import type { CompetitorCardParticipant } from "@/components/CompetitorCard";
import { advanceWinner } from "@/app/tournament/[id]/actions";

type Match = MatchCardMatch & { id: string };

function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round; // 0 = final
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${round}`;
}

function toCardParticipant(
  id: string | null,
  lookup: Map<string, Participant>,
): CompetitorCardParticipant | null {
  if (!id) return null;
  const p = lookup.get(id);
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    title: p.title,
    imageUrl: p.imageUrl,
    seed: p.seed,
  };
}

/**
 * The screen-shared centerpiece: rounds laid out left→right as columns, each
 * later-round match centered between its two feeders (flex justify-around). Wide
 * brackets (32/64) scroll horizontally. Clicking a competitor in a ready match
 * advances the winner via the advanceWinner server action; revalidation refreshes
 * the tree. A champion banner crowns the winner once the final is decided.
 */
export default function BracketTree({
  tournamentId,
  participants,
  matches,
  status,
}: {
  tournamentId: string;
  size: number;
  participants: Participant[];
  matches: Match[];
  status: "setup" | "live" | "done";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = new Map(participants.map((p) => [p.id, p]));

  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort(
    (a, b) => a - b,
  );
  const totalRounds = rounds.length;

  const finalRound = totalRounds > 0 ? Math.max(...rounds) : 0;
  const finalMatch = matches.find(
    (m) => m.round === finalRound && m.position === 0,
  );
  const championId =
    finalMatch && finalMatch.status === "done" ? finalMatch.winnerId : null;
  const champion = championId ? lookup.get(championId) ?? null : null;

  function handlePick(match: Match, winnerId: string) {
    if (status !== "live" || isPending) return;
    setError(null);
    setPendingMatchId(match.id);
    startTransition(async () => {
      try {
        await advanceWinner(
          tournamentId,
          match.round,
          match.position,
          winnerId,
        );
        setSpotlightId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not advance winner");
      } finally {
        setPendingMatchId(null);
      }
    });
  }

  const spotlightMatch = spotlightId
    ? matches.find((m) => m.id === spotlightId) ?? null
    : null;
  const spotlightP1 = spotlightMatch
    ? toCardParticipant(spotlightMatch.p1Id, lookup)
    : null;
  const spotlightP2 = spotlightMatch
    ? toCardParticipant(spotlightMatch.p2Id, lookup)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {champion && (
        <div className="winner-slash flex flex-col items-center gap-1 rounded-lg border border-dojo-red bg-dojo-coal py-5 shadow-red-glow">
          <span className="display text-xs tracking-[0.4em] text-dojo-ash">
            Champion
          </span>
          <span className="display text-3xl text-dojo-red sm:text-4xl">
            {champion.title || champion.name}
          </span>
        </div>
      )}

      {error && (
        <p className="rounded border border-dojo-red bg-dojo-coal px-3 py-2 text-sm text-dojo-red">
          {error}
        </p>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-6">
          {rounds.map((round) => {
            const roundMatches = matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.position - b.position);
            return (
              <div key={round} className="flex flex-col">
                <h2 className="display mb-3 text-center text-sm tracking-widest text-dojo-ash">
                  {roundLabel(round, totalRounds)}
                </h2>
                <div className="flex flex-1 flex-col justify-around gap-4">
                  {roundMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      p1={toCardParticipant(m.p1Id, lookup)}
                      p2={toCardParticipant(m.p2Id, lookup)}
                      onOpen={
                        status === "live" ? () => setSpotlightId(m.id) : undefined
                      }
                      pending={pendingMatchId === m.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {spotlightMatch && spotlightP1 && spotlightP2 && (
        <MatchSpotlight
          roundLabel={roundLabel(spotlightMatch.round, totalRounds)}
          p1={spotlightP1}
          p2={spotlightP2}
          onPick={(winnerId) => handlePick(spotlightMatch, winnerId)}
          onClose={() => setSpotlightId(null)}
          pending={pendingMatchId === spotlightMatch.id}
        />
      )}
    </div>
  );
}
