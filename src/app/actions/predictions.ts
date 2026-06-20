"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { isLocked } from "@/lib/time";
import { isValidCode, type Code } from "@/lib/scoring";

/**
 * Saves (or updates) the logged-in member's pick for a match.
 * Enforced server-side: rejects unknown codes and any match already locked at
 * kickoff, so a late or tampered request cannot change a locked prediction.
 */
export async function savePick(
  matchId: string,
  pick: Code,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  if (!isValidCode(pick)) return { ok: false, error: "badPick" };

  const db = getServiceClient();

  // Re-read the kickoff from the DB and check the lock on the server.
  const { data: match, error: mErr } = await db
    .from("matches")
    .select("kickoff_utc")
    .eq("id", matchId)
    .single();
  if (mErr || !match) return { ok: false, error: "noMatch" };
  if (isLocked(match.kickoff_utc)) return { ok: false, error: "locked" };

  const { error } = await db
    .from("predictions")
    .upsert(
      { member_id: session.memberId, match_id: matchId, pick_code: pick },
      { onConflict: "member_id,match_id" },
    );
  if (error) return { ok: false, error: "saveFailed" };

  revalidatePath("/");
  return { ok: true };
}
