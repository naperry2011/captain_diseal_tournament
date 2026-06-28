"use client";

import CoverImage from "@/components/CoverImage";

export interface CompetitorCardParticipant {
  id: string;
  name: string;
  title: string | null;
  imageUrl: string | null;
  seed: number;
}

/**
 * Presentational card for one competitor slot inside a match (display-only —
 * winner-picking happens in the MatchSpotlight overlay). A null participant
 * renders a muted "TBD" placeholder (awaiting a feeder result or a bye). Winner /
 * loser states get brand styling.
 */
export default function CompetitorCard({
  participant,
  isWinner = false,
  isLoser = false,
}: {
  participant: CompetitorCardParticipant | null;
  isWinner?: boolean;
  isLoser?: boolean;
}) {
  const label = participant ? participant.title || participant.name : null;

  const base =
    "flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left";

  const stateClass = !participant
    ? "border-dashed border-dojo-steel bg-dojo-coal/60"
    : isWinner
      ? "winner-slash border-l-4 border-dojo-red bg-dojo-steel font-bold text-dojo-white shadow-red-glow"
      : isLoser
        ? "border-dojo-steel bg-dojo-coal opacity-40 line-through"
        : "border-dojo-steel bg-dojo-coal text-dojo-white";

  return (
    <div className={`${base} ${stateClass}`}>
      {participant ? (
        <CoverImage
          src={participant.imageUrl}
          alt={label ?? ""}
          className="h-9 w-7 shrink-0 rounded object-cover"
        />
      ) : (
        <div
          className="h-9 w-7 shrink-0 rounded bg-dojo-steel/40"
          aria-hidden="true"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="display block truncate text-sm leading-tight">
          {label ?? "TBD"}
        </span>
      </span>
      {participant ? (
        <span className="display flex h-5 w-5 shrink-0 items-center justify-center rounded bg-dojo-black/60 text-[10px] text-dojo-ash">
          {participant.seed}
        </span>
      ) : null}
    </div>
  );
}
