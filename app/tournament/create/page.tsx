import Link from "next/link";
import CreateWizard from "@/components/CreateWizard";

export default function CreateTournamentPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-dojo-white text-3xl sm:text-4xl">
          New Tournament
        </h1>
        <Link
          href="/"
          className="display text-sm tracking-widest text-dojo-ash transition hover:text-dojo-red"
        >
          ← Back
        </Link>
      </div>
      <CreateWizard />
    </section>
  );
}
