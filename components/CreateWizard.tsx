"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import MediaSearch, { type MediaSelection } from "@/components/MediaSearch";
import {
  addParticipantsAction,
  createTournamentAction,
  randomizeSeedsAction,
} from "@/app/tournament/actions";

const SIZES = [8, 16, 32, 64] as const;
type Size = (typeof SIZES)[number];

interface Competitor {
  key: string;
  name: string;
  media?: MediaSelection;
}

let keyCounter = 0;
function newCompetitor(name = ""): Competitor {
  keyCounter += 1;
  return { key: `c${keyCounter}`, name };
}

const competitorSchema = z.object({
  name: z.string().trim().min(1, "Competitor names cannot be empty"),
});

export default function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [size, setSize] = useState<Size | null>(null);

  const [competitors, setCompetitors] = useState<Competitor[]>([
    newCompetitor(),
    newCompetitor(),
  ]);
  const [bulk, setBulk] = useState("");
  const [randomize, setRandomize] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step1Valid = name.trim().length > 0 && size !== null;

  function updateCompetitor(key: string, patch: Partial<Competitor>) {
    setCompetitors((prev) =>
      prev.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    );
  }

  function addRow() {
    setCompetitors((prev) => [...prev, newCompetitor()]);
  }

  function removeRow(key: string) {
    setCompetitors((prev) => prev.filter((c) => c.key !== key));
  }

  function applyBulk() {
    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return;
    setCompetitors((prev) => {
      // Replace any trailing empty rows, then append the parsed names.
      const kept = prev.filter((c) => c.name.trim().length > 0);
      return [...kept, ...lines.map((l) => newCompetitor(l))];
    });
    setBulk("");
  }

  async function handleSubmit() {
    setError(null);

    if (size === null || name.trim().length === 0) {
      setStep(1);
      setError("Choose a size and name first");
      return;
    }

    const filled = competitors.filter((c) => c.name.trim().length > 0);

    if (competitors.some((c) => c.name.trim().length === 0)) {
      setError("Competitor names cannot be empty (remove blank rows)");
      return;
    }
    if (filled.length < 2) {
      setError("Add at least 2 competitors");
      return;
    }
    if (filled.length > size) {
      setError(`Too many competitors for a ${size}-slot bracket`);
      return;
    }
    for (const c of filled) {
      const parsed = competitorSchema.safeParse(c);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid competitor");
        return;
      }
    }

    setSubmitting(true);
    try {
      const { id } = await createTournamentAction(name.trim(), size);
      await addParticipantsAction(
        id,
        filled.map((c) => ({
          name: c.name.trim(),
          mediaType: c.media?.mediaType,
          mediaId: c.media?.mediaId,
          title: c.media?.title,
          imageUrl: c.media?.imageUrl,
        })),
      );
      if (randomize) {
        await randomizeSeedsAction(id);
      }
      router.push(`/tournament/${id}/setup`);
    } catch (e) {
      setSubmitting(false);
      setError(
        e instanceof Error ? e.message : "Something went wrong creating the tournament",
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <StepDot active={step === 1} done={step === 2} label="1" />
        <span className="display text-sm tracking-widest text-dojo-ash">
          Setup
        </span>
        <div className="h-px w-8 bg-dojo-steel" />
        <StepDot active={step === 2} done={false} label="2" />
        <span className="display text-sm tracking-widest text-dojo-ash">
          Competitors
        </span>
      </div>

      {error && (
        <p className="rounded border border-dojo-red bg-dojo-coal px-3 py-2 text-sm text-dojo-red">
          {error}
        </p>
      )}

      {step === 1 ? (
        <div className="flex flex-col gap-6">
          <div>
            <label className="display mb-2 block text-sm tracking-widest text-dojo-ash">
              Tournament name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Best Anime Opening"
              className="w-full rounded border border-dojo-steel bg-dojo-coal px-4 py-3 text-dojo-white placeholder:text-dojo-ash focus:border-dojo-red focus:outline-none"
            />
          </div>

          <div>
            <span className="display mb-2 block text-sm tracking-widest text-dojo-ash">
              Bracket size
            </span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`display rounded-lg border py-6 text-2xl tracking-widest transition ${
                    size === s
                      ? "border-dojo-red text-dojo-white shadow-red-glow"
                      : "border-dojo-steel text-dojo-ash hover:border-dojo-red hover:text-dojo-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              className="display rounded bg-dojo-red px-6 py-3 text-sm tracking-widest text-dojo-white shadow-red-glow transition hover:bg-dojo-blood disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="display text-sm tracking-widest text-dojo-ash">
            {competitors.filter((c) => c.name.trim()).length} / {size} competitors
          </p>

          <ul className="flex flex-col gap-3">
            {competitors.map((c, i) => (
              <li
                key={c.key}
                className="flex flex-col gap-2 rounded-lg border border-dojo-steel bg-dojo-coal p-3 sm:flex-row sm:items-center"
              >
                <span className="display w-8 shrink-0 text-center text-dojo-ash">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) =>
                    updateCompetitor(c.key, { name: e.target.value })
                  }
                  placeholder={`Competitor ${i + 1}`}
                  className="flex-1 rounded border border-dojo-steel bg-dojo-black px-3 py-2 text-dojo-white placeholder:text-dojo-ash focus:border-dojo-red focus:outline-none"
                />
                <MediaSearch
                  selection={c.media}
                  onSelect={(sel) => updateCompetitor(c.key, { media: sel })}
                  onClear={() => updateCompetitor(c.key, { media: undefined })}
                />
                <button
                  type="button"
                  onClick={() => removeRow(c.key)}
                  className="display shrink-0 rounded border border-dojo-steel px-3 py-2 text-xs tracking-widest text-dojo-ash transition hover:border-dojo-red hover:text-dojo-red"
                  aria-label={`Remove competitor ${i + 1}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addRow}
              className="display rounded border border-dojo-steel px-4 py-2 text-sm tracking-widest text-dojo-white transition hover:border-dojo-red"
            >
              + Add competitor
            </button>
          </div>

          <div className="rounded-lg border border-dojo-steel bg-dojo-coal p-3">
            <label className="display mb-2 block text-sm tracking-widest text-dojo-ash">
              Bulk add (one name per line)
            </label>
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={4}
              placeholder={"Naruto\nGoku\nLuffy"}
              className="w-full rounded border border-dojo-steel bg-dojo-black px-3 py-2 text-sm text-dojo-white placeholder:text-dojo-ash focus:border-dojo-red focus:outline-none"
            />
            <button
              type="button"
              onClick={applyBulk}
              className="display mt-2 rounded border border-dojo-steel px-4 py-2 text-sm tracking-widest text-dojo-white transition hover:border-dojo-red"
            >
              Add names
            </button>
          </div>

          <label className="flex items-center gap-3 text-sm text-dojo-white">
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
              className="h-4 w-4 accent-dojo-red"
            />
            Randomize seeds after creation
          </label>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="display rounded border border-dojo-steel px-6 py-3 text-sm tracking-widest text-dojo-white transition hover:border-dojo-red"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="display rounded bg-dojo-red px-6 py-3 text-sm tracking-widest text-dojo-white shadow-red-glow transition hover:bg-dojo-blood disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? "Creating…" : "Create Tournament"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`display flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
        active
          ? "border-dojo-red bg-dojo-red text-dojo-white shadow-red-glow"
          : done
            ? "border-dojo-red text-dojo-red"
            : "border-dojo-steel text-dojo-ash"
      }`}
    >
      {label}
    </span>
  );
}
