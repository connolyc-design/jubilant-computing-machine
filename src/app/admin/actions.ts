"use server";

import { revalidatePath } from "next/cache";
import {
  getSession,
  hasAdminUnlock,
  grantAdmin,
  checkAdminPin,
} from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { isValidCode, type Code } from "@/lib/scoring";
import { syncResults } from "@/lib/sync";

/** Guard: must be logged in AND have entered the admin PIN in this browser. */
async function requireAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return hasAdminUnlock();
}

/** Step 1 of admin: verify the PIN and unlock admin powers for this browser. */
export async function unlockAdminAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const pin = String(formData.get("pin") ?? "");
  if (!checkAdminPin(pin)) return { error: "errorBadPin" };
  await grantAdmin();
  revalidatePath("/admin");
  return {};
}

/** Enter / update / clear the actual result (GANADOR) for a match. */
export async function setResultAction(
  matchId: string,
  code: Code | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  if (code !== null && !isValidCode(code)) return { ok: false, error: "badCode" };

  const db = getServiceClient();
  const { error } = await db
    .from("matches")
    .update({ result_code: code })
    .eq("id", matchId);
  if (error) return { ok: false, error: "saveFailed" };

  // Results change scores everywhere.
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/admin/results");
  return { ok: true };
}

/** Save pool settings: buy-in, currency, points-per-correct, payout split, reveal. */
export async function savePoolConfigAction(
  _prev: { ok?: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  if (!(await requireAdmin())) return { error: "unauthorized" };

  const buyIn = Number(formData.get("buy_in"));
  const currency = String(formData.get("currency") ?? "USD").trim().toUpperCase();
  const ppc = Number(formData.get("points_per_correct"));
  const pct1 = Number(formData.get("pct1"));
  const pct2 = Number(formData.get("pct2"));
  const pct3 = Number(formData.get("pct3"));
  const hidden = formData.get("picks_hidden") === "on";

  if (!Number.isFinite(buyIn) || buyIn < 0) return { error: "badNumber" };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "badCurrency" };
  if (!Number.isInteger(ppc) || ppc < 0) return { error: "badNumber" };
  if ([pct1, pct2, pct3].some((p) => !Number.isFinite(p) || p < 0))
    return { error: "badNumber" };

  // Keep only places with a positive share, preserving 1st/2nd/3rd order.
  const payout = [
    { place: 1, pct: pct1 },
    { place: 2, pct: pct2 },
    { place: 3, pct: pct3 },
  ].filter((p) => p.pct > 0);

  const db = getServiceClient();
  const { error } = await db
    .from("pool_config")
    .update({
      buy_in: buyIn,
      currency,
      points_per_correct: ppc,
      payout_structure: payout,
      picks_hidden_until_kickoff: hidden,
    })
    .eq("id", true);
  if (error) return { error: "saveFailed" };

  revalidatePath("/pot");
  revalidatePath("/admin/pot");
  revalidatePath("/leaderboard");
  return { ok: true };
}

/** Manually trigger the automatic results sync (results normally update via cron). */
export async function syncNowAction(): Promise<{
  ok: boolean;
  updated?: number;
  finished?: number;
  error?: string;
}> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };
  try {
    const s = await syncResults();
    revalidatePath("/");
    revalidatePath("/leaderboard");
    revalidatePath("/admin/results");
    return { ok: true, updated: s.updated, finished: s.finished };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "syncFailed" };
  }
}

/** Toggle whether a member has paid the buy-in. */
export async function setPaidAction(
  memberId: string,
  paid: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "unauthorized" };

  const db = getServiceClient();
  const { error } = await db.from("members").update({ paid }).eq("id", memberId);
  if (error) return { ok: false, error: "saveFailed" };

  revalidatePath("/admin/members");
  revalidatePath("/pot");
  return { ok: true };
}
