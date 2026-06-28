import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BracketTree from "@/components/BracketTree";
import { getTournament } from "@/lib/tournaments";

const STATUS_STYLES: Record<string, string> = {
  live: "bg-dojo-red text-dojo-white shadow-red-glow",
  done: "border border-dojo-steel bg-dojo-steel text-dojo-white",
};

/**
 * The bracket view — the screen the streamer shares. High-contrast and clean;
 * the advance controls are subtle hover affordances inside the tree itself.
 */
export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) notFound();
  if (tournament.status === "setup") redirect(`/tournament/${id}/setup`);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="display text-dojo-white text-3xl sm:text-4xl">
            {tournament.name}
          </h1>
          <span
            className={`display w-fit rounded px-2 py-0.5 text-xs tracking-widest ${
              STATUS_STYLES[tournament.status] ?? ""
            }`}
          >
            {tournament.status === "live" ? "● Live" : "Complete"}
          </span>
        </div>
        <Link
          href="/"
          className="display text-sm tracking-widest text-dojo-ash transition hover:text-dojo-red"
        >
          ← Dashboard
        </Link>
      </div>

      <BracketTree
        tournamentId={tournament.id}
        size={tournament.size}
        participants={tournament.participants}
        matches={tournament.matches}
        status={tournament.status}
      />
    </section>
  );
}
