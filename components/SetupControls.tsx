"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  generateBracketAction,
  randomizeSeedsAction,
} from "@/app/tournament/actions";

export default function SetupControls({
  tournamentId,
  canGenerate,
}: {
  tournamentId: string;
  canGenerate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRandomize() {
    setError(null);
    startTransition(async () => {
      try {
        await randomizeSeedsAction(tournamentId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not randomize seeds");
      }
    });
  }

  async function handleGoLive() {
    setError(null);
    setGoing(true);
    try {
      await generateBracketAction(tournamentId);
      router.push(`/tournament/${tournamentId}`);
    } catch (e) {
      setGoing(false);
      setError(e instanceof Error ? e.message : "Could not generate bracket");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded border border-dojo-red bg-dojo-coal px-3 py-2 text-sm text-dojo-red">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRandomize}
          disabled={pending || going}
          className="display rounded border border-dojo-steel px-5 py-3 text-sm tracking-widest text-dojo-white transition hover:border-dojo-red disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Shuffling…" : "Randomize seeds"}
        </button>
        <button
          type="button"
          onClick={handleGoLive}
          disabled={!canGenerate || going || pending}
          className="display rounded bg-dojo-red px-6 py-3 text-sm tracking-widest text-dojo-white shadow-red-glow transition hover:bg-dojo-blood disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {going ? "Generating…" : "Generate Bracket & Go Live"}
        </button>
      </div>
      {!canGenerate && (
        <p className="text-xs text-dojo-ash">
          Add at least 2 competitors to generate a bracket.
        </p>
      )}
    </div>
  );
}
