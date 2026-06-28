import Link from "next/link";
import TournamentList from "@/components/TournamentList";
import { listTournaments } from "@/lib/tournaments";

export default async function Home() {
  const tournaments = await listTournaments();

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="display text-dojo-white text-3xl sm:text-4xl">
            Tournaments
          </h1>
          <p className="display text-dojo-ash mt-1 text-sm tracking-widest">
            Anime · Shows · Movies · Game showdowns
          </p>
        </div>
        <Link
          href="/tournament/create"
          className="display rounded bg-dojo-red px-5 py-3 text-sm tracking-widest text-dojo-white shadow-red-glow transition hover:bg-dojo-blood"
        >
          Create Tournament
        </Link>
      </div>

      <TournamentList tournaments={tournaments} />
    </section>
  );
}
