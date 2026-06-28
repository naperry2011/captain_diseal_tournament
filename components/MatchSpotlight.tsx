"use client";

import { useEffect } from "react";
import CoverImage from "@/components/CoverImage";
import type { CompetitorCardParticipant } from "@/components/CompetitorCard";

/**
 * Full-screen head-to-head overlay shown when a ready match is clicked on the
 * bracket. Built for the screen-shared monitor: large cover art, names, seeds,
 * the round title, and a katana "VS". Clicking a competitor crowns the winner.
 * Escape or the close button dismisses without picking.
 */
export default function MatchSpotlight({
  roundLabel,
  p1,
  p2,
  onPick,
  onClose,
  pending,
}: {
  roundLabel: string;
  p1: CompetitorCardParticipant;
  p2: CompetitorCardParticipant;
  onPick: (winnerId: string) => void;
  onClose: () => void;
  pending: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-dojo-black/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${roundLabel}: ${p1.title || p1.name} versus ${p2.title || p2.name}`}
    >
      <button
        type="button"
        onClick={onClose}
        disabled={pending}
        aria-label="Close match view"
        className="display absolute right-5 top-5 rounded border border-dojo-steel px-3 py-1 text-sm text-dojo-ash transition hover:border-dojo-red hover:text-dojo-red disabled:opacity-50"
      >
        ✕ Close
      </button>

      <span className="display text-sm tracking-[0.5em] text-dojo-ash sm:text-base">
        {roundLabel}
      </span>

      <div className="flex w-full max-w-5xl items-stretch justify-center gap-3 sm:gap-8">
        <SpotlightCompetitor participant={p1} onPick={onPick} pending={pending} />
        <div className="flex items-center">
          <span className="display text-3xl text-dojo-red sm:text-5xl">VS</span>
        </div>
        <SpotlightCompetitor participant={p2} onPick={onPick} pending={pending} />
      </div>

      <p className="display text-xs tracking-widest text-dojo-ash">
        {pending ? "Advancing…" : "Click a competitor to crown the winner"}
      </p>
    </div>
  );
}

function SpotlightCompetitor({
  participant,
  onPick,
  pending,
}: {
  participant: CompetitorCardParticipant;
  onPick: (winnerId: string) => void;
  pending: boolean;
}) {
  const label = participant.title || participant.name;
  return (
    <button
      type="button"
      onClick={() => onPick(participant.id)}
      disabled={pending}
      aria-label={`Crown ${label} as the winner`}
      className="group flex flex-1 flex-col items-center gap-3 rounded-xl border-2 border-dojo-steel bg-dojo-coal p-4 transition hover:border-dojo-red hover:shadow-red-glow disabled:opacity-60 sm:p-6"
    >
      <span className="display flex h-6 w-6 items-center justify-center rounded bg-dojo-black/70 text-xs text-dojo-ash">
        {participant.seed}
      </span>
      <CoverImage
        src={participant.imageUrl}
        alt={label}
        className="aspect-[2/3] w-full max-w-[220px] rounded-lg object-cover"
      />
      <span className="display text-center text-lg leading-tight text-dojo-white group-hover:text-dojo-red sm:text-2xl">
        {label}
      </span>
      <span className="display text-[10px] tracking-widest text-dojo-ash opacity-0 transition group-hover:opacity-100">
        ▶ Crown winner
      </span>
    </button>
  );
}
