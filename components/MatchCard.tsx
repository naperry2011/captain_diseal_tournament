"use client";

import CompetitorCard, {
  type CompetitorCardParticipant,
} from "@/components/CompetitorCard";

export interface MatchCardMatch {
  round: number;
  position: number;
  p1Id: string | null;
  p2Id: string | null;
  winnerId: string | null;
  status: "pending" | "ready" | "done";
}

/**
 * Presentational match: two stacked CompetitorCards separated by a thin VS
 * divider. When the match is `ready` and an onPick handler is supplied, each
 * present competitor is clickable to advance. While `pending` (an advance is in
 * flight) clicks are disabled. When `done`, the winner / loser are marked.
 */
export default function MatchCard({
  match,
  p1,
  p2,
  onPick,
  pending = false,
}: {
  match: MatchCardMatch;
  p1: CompetitorCardParticipant | null;
  p2: CompetitorCardParticipant | null;
  onPick?: (winnerId: string) => void;
  pending?: boolean;
}) {
  const isDone = match.status === "done";
  const canPick = match.status === "ready" && !!onPick && !pending;

  return (
    <div
      className={`flex w-48 flex-col gap-1 rounded-lg border border-dojo-steel/70 bg-dojo-black/40 p-1.5 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <CompetitorCard
        participant={p1}
        isWinner={isDone && match.winnerId === match.p1Id}
        isLoser={isDone && match.winnerId !== match.p1Id && !!match.p1Id}
        clickable={canPick && !!p1}
        onClick={canPick && p1 ? () => onPick?.(p1.id) : undefined}
      />
      <div className="flex items-center justify-center">
        <span className="display text-[9px] tracking-[0.3em] text-dojo-ash">
          VS
        </span>
      </div>
      <CompetitorCard
        participant={p2}
        isWinner={isDone && match.winnerId === match.p2Id}
        isLoser={isDone && match.winnerId !== match.p2Id && !!match.p2Id}
        clickable={canPick && !!p2}
        onClick={canPick && p2 ? () => onPick?.(p2.id) : undefined}
      />
    </div>
  );
}
