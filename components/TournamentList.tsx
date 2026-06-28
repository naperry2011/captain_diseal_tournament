import Link from "next/link";
import type { Tournament } from "@prisma/client";

const STATUS_STYLES: Record<Tournament["status"], string> = {
  setup: "border border-dojo-steel bg-dojo-steel text-dojo-ash",
  live: "bg-dojo-red text-dojo-white shadow-red-glow",
  done: "border border-dojo-steel bg-dojo-steel text-dojo-white",
};

function hrefFor(t: Tournament): string {
  return t.status === "setup"
    ? `/tournament/${t.id}/setup`
    : `/tournament/${t.id}`;
}

/**
 * Presentational grid of tournament cards. Server-friendly (no client state).
 */
export default function TournamentList({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dojo-steel bg-dojo-coal px-6 py-16 text-center">
        <p className="display text-dojo-ash text-lg tracking-widest">
          No tournaments yet — start one.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((t) => (
        <li key={t.id}>
          <Link
            href={hrefFor(t)}
            className="group flex h-full flex-col justify-between gap-4 rounded-lg border border-dojo-steel bg-dojo-coal p-5 transition hover:border-dojo-red hover:shadow-red-glow"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="display text-dojo-white text-xl leading-tight group-hover:text-dojo-red">
                {t.name}
              </h3>
              <span
                className={`display shrink-0 rounded px-2 py-0.5 text-xs tracking-widest ${STATUS_STYLES[t.status]}`}
              >
                {t.status}
              </span>
            </div>
            <p className="display text-dojo-ash text-sm tracking-widest">
              {t.size} competitors
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
