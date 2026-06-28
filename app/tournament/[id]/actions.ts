"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { advanceMatch } from "@/lib/tournaments";

const advanceSchema = z.object({
  tournamentId: z.string().min(1),
  round: z.number().int().positive(),
  position: z.number().int().nonnegative(),
  winnerId: z.string().min(1),
});

/**
 * Record the winner of a ready match and propagate to the next round. Validates
 * inputs, delegates all bracket math + persistence to advanceMatch, then
 * revalidates the bracket page and the dashboard so both reflect the new state.
 * A thrown error message is surfaced to the client.
 */
export async function advanceWinner(
  tournamentId: string,
  round: number,
  position: number,
  winnerId: string,
): Promise<void> {
  const parsed = advanceSchema.parse({ tournamentId, round, position, winnerId });

  await advanceMatch(
    parsed.tournamentId,
    parsed.round,
    parsed.position,
    parsed.winnerId,
  );

  revalidatePath(`/tournament/${parsed.tournamentId}`);
  revalidatePath("/");
}
