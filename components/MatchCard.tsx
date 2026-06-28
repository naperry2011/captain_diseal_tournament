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
 * divider. When the match is `ready` and an onOpen handler is supplied, the whole
 * card is a button that opens the full-screen MatchSpotlight (where the winner is
 * chosen). While `pending` (an advance is in flight) it's disabled. When `done`,
 * the winner / loser are marked.
 */
export default function MatchCard({
  match,
  p1,
  p2,
  onOpen,
  pending = false,
}: {
  match: MatchCardMatch;
  p1: CompetitorCardParticipant | null;
  p2: CompetitorCardParticipant | null;
  onOpen?: () => void;
  pending?: boolean;
}) {
  const isDone = match.status === "done";
  const canOpen = match.status === "ready" && !!onOpen && !pending;

  const content = (
    <>
      <CompetitorCard
        participant={p1}
        isWinner={isDone && match.winnerId === match.p1Id}
        isLoser={isDone && match.winnerId !== match.p1Id && !!match.p1Id}
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
      />
    </>
  );

  const baseClass = `flex w-48 flex-col gap-1 rounded-lg border border-dojo-steel/70 bg-dojo-black/40 p-1.5 ${
    pending ? "opacity-60" : ""
  }`;

  if (canOpen) {
    const p1Label = p1 ? p1.title || p1.name : "TBD";
    const p2Label = p2 ? p2.title || p2.name : "TBD";
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open match: ${p1Label} versus ${p2Label}`}
        className={`${baseClass} cursor-pointer text-left transition hover:border-dojo-red hover:shadow-red-glow`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
