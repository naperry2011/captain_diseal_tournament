"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addParticipants,
  createTournament,
  generateAndSaveBracket,
  type ParticipantEntry,
  randomizeSeeds,
} from "@/lib/tournaments";

const VALID_SIZES = [8, 16, 32, 64] as const;

const sizeSchema = z
  .number()
  .int()
  .refine((n) => (VALID_SIZES as readonly number[]).includes(n), {
    message: "Size must be one of 8, 16, 32, 64",
  });

const nameSchema = z.string().trim().min(1, "Name is required").max(120);

const participantSchema = z.object({
  name: z.string().trim().min(1, "Competitor name is required").max(120),
  seed: z.number().int().positive().optional(),
  mediaType: z.enum(["anime", "cartoon", "game"]).optional(),
  mediaId: z.string().optional(),
  title: z.string().optional(),
  imageUrl: z.string().optional(),
});

/** Create a tournament and return its new id. */
export async function createTournamentAction(
  name: string,
  size: number,
): Promise<{ id: string }> {
  const parsedName = nameSchema.parse(name);
  const parsedSize = sizeSchema.parse(size);
  const t = await createTournament(parsedName, parsedSize);
  revalidatePath("/");
  return { id: t.id };
}

/** Attach competitors to a tournament. */
export async function addParticipantsAction(
  tournamentId: string,
  entries: ParticipantEntry[],
): Promise<void> {
  const id = z.string().min(1).parse(tournamentId);
  const parsed = z
    .array(participantSchema)
    .min(2, "Add at least 2 competitors")
    .parse(entries);
  await addParticipants(id, parsed);
  revalidatePath(`/tournament/${id}/setup`);
}

/** Shuffle the seeds for a tournament. */
export async function randomizeSeedsAction(tournamentId: string): Promise<void> {
  const id = z.string().min(1).parse(tournamentId);
  await randomizeSeeds(id);
  revalidatePath(`/tournament/${id}/setup`);
}

/**
 * Generate the bracket (setup -> live) and report success. The caller (a client
 * component) performs the navigation, since redirect() from within a try/catch
 * in the client action wrapper is awkward; here we keep it explicit.
 */
export async function generateBracketAction(tournamentId: string): Promise<void> {
  const id = z.string().min(1).parse(tournamentId);
  await generateAndSaveBracket(id);
  revalidatePath(`/tournament/${id}`);
  revalidatePath(`/tournament/${id}/setup`);
  revalidatePath("/");
}
