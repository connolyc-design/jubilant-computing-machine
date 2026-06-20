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
