"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTournamentAction } from "@/app/tournament/actions";

/**
 * Trash button with an inline two-step confirm (trash -> "Delete? ✓ / ✕"), so a
 * destructive delete never fires on a single click. Lives on dashboard cards.
 */
export default function DeleteTournamentButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      await deleteTournamentAction(id);
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div
        className="flex items-center gap-1 rounded bg-dojo-black/80 px-1.5 py-1"
        role="group"
        aria-label={`Confirm deleting ${name}`}
      >
        <span className="display text-[10px] tracking-widest text-dojo-ash">
          Delete?
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          aria-label={`Confirm delete ${name}`}
          className="rounded bg-dojo-red px-1.5 py-0.5 text-xs text-dojo-white transition hover:bg-dojo-blood disabled:opacity-50"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          aria-label="Cancel delete"
          className="rounded border border-dojo-steel px-1.5 py-0.5 text-xs text-dojo-ash transition hover:text-dojo-white disabled:opacity-50"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${name}`}
      title="Delete tournament"
      className="rounded border border-dojo-steel bg-dojo-black/60 p-1.5 text-dojo-ash transition hover:border-dojo-red hover:text-dojo-red"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
