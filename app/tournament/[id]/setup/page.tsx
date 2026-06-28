import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SetupControls from "@/components/SetupControls";
import { getTournament } from "@/lib/tournaments";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) notFound();
  if (tournament.status !== "setup") redirect(`/tournament/${id}`);

  const participants = tournament.participants;
  const canGenerate = participants.length >= 2;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="display text-dojo-white text-3xl sm:text-4xl">
            {tournament.name}
          </h1>
          <p className="display mt-1 text-sm tracking-widest text-dojo-ash">
            Seeding · {participants.length} / {tournament.size} competitors
          </p>
        </div>
        <Link
          href="/"
          className="display text-sm tracking-widest text-dojo-ash transition hover:text-dojo-red"
        >
          ← Dashboard
        </Link>
      </div>

      <ol className="flex flex-col gap-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-lg border border-dojo-steel bg-dojo-coal p-3"
          >
            <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded bg-dojo-steel text-sm text-dojo-white">
              {p.seed}
            </span>
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt=""
                className="h-12 w-9 shrink-0 rounded object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="display truncate text-dojo-white">{p.name}</p>
              {p.title ? (
                <p className="truncate text-xs text-dojo-ash">{p.title}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <SetupControls tournamentId={id} canGenerate={canGenerate} />
    </section>
  );
}
