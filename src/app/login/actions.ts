"use server";

import { redirect } from "next/navigation";
import { checkPoolPassword, createSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import roster from "../../../supabase/seed/members.json";

/** Roster names for the login dropdown — from the DB when available, else seed. */
export async function listMemberNames(): Promise<string[]> {
  try {
    const db = getServiceClient();
    const { data, error } = await db.from("members").select("name").order("name");
    if (error) throw error;
    if (data?.length) return data.map((m) => m.name);
  } catch {
    // DB not configured yet — fall back to the fixed seed roster.
  }
  return roster.map((m) => m.name).sort((a, b) => a.localeCompare(b));
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "errorNoName" };
  if (!checkPoolPassword(password)) return { error: "errorBadPassword" };

  // Resolve the member's id + admin flag from the DB when possible.
  let memberId = name;
  let isAdmin = false;
  try {
    const db = getServiceClient();
    const { data } = await db
      .from("members")
      .select("id, is_admin")
      .eq("name", name)
      .single();
    if (data) {
      memberId = data.id;
      isAdmin = data.is_admin;
    }
  } catch {
    // DB not configured — proceed with a name-based placeholder session.
  }

  await createSession({ memberId, name, isAdmin });
  redirect("/");
}
