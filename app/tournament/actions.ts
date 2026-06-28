"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createTournamentWithParticipants,
  generateAndSaveBracket,
  randomizeSeeds,
} from "@/lib/tournaments";

const VALID_SIZES = [8, 16, 32, 64] as const;

const participantSchema = z.object({
  name: z.string().trim().min(1, "Competitor name is required").max(120),
  seed: z.number().int().positive().optional(),
  mediaType: z.enum(["anime", "show", "movie", "game"]).optional(),
  mediaId: z.string().max(120).optional(),
  title: z.string().max(300).optional(),
  imageUrl: z.string().url().max(1000).optional(),
});

// Validate name, size, and entries together so the server is the source of
// truth — including the upper bound (entries.length ≤ size).
const createSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    size: z
      .number()
      .int()
      .refine((n) => (VALID_SIZES as readonly number[]).includes(n), {
        message: "Size must be one of 8, 16, 32, 64",
      }),
    entries: z.array(participantSchema).min(2, "Add at least 2 competitors"),
    randomize: z.boolean().optional(),
  })
  .refine((v) => v.entries.length <= v.size, {
    message: "Too many competitors for the chosen bracket size",
    path: ["entries"],
  });

export type CreateTournamentActionInput = z.input<typeof createSchema>;

/**
 * Create a tournament + competitors in one transactional call and return the new
 * id. Validates everything server-side; the lib function performs all writes
 * inside a single transaction, so a partial failure leaves no orphan tournament.
 */
export async function createTournamentAction(
  input: CreateTournamentActionInput,
): Promise<{ id: string }> {
  const parsed = createSchema.parse(input);
  const result = await createTournamentWithParticipants({
    name: parsed.name,
    size: parsed.size,
    entries: parsed.entries,
    randomize: parsed.randomize,
  });
  revalidatePath("/");
  return result;
}

/** Shuffle the seeds for a tournament. */
export async function randomizeSeedsAction(tournamentId: string): Promise<void> {
  const id = z.string().min(1).parse(tournamentId);
  await randomizeSeeds(id);
  revalidatePath(`/tournament/${id}/setup`);
}

/**
 * Generate the bracket (setup -> live). The caller (a client component) performs
 * the navigation afterward.
 */
export async function generateBracketAction(tournamentId: string): Promise<void> {
  const id = z.string().min(1).parse(tournamentId);
  await generateAndSaveBracket(id);
  revalidatePath(`/tournament/${id}`);
  revalidatePath(`/tournament/${id}/setup`);
  revalidatePath("/");
}
