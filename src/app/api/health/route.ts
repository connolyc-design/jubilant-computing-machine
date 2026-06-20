import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Diagnostic endpoint — open /api/health in the browser to check the Supabase
 * connection. It returns ONLY booleans, lengths, and the DB error message
 * (never the secret values), so it is safe to view.
 */
export async function GET() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const env = {
    SUPABASE_URL_present: Boolean(url),
    SUPABASE_URL_host: url ? safeHost(url) : null,
    SUPABASE_SERVICE_ROLE_KEY_present: Boolean(key),
    // A real service_role key is a long JWT (~200+ chars). A short value here
    // means it was truncated or the wrong value was pasted.
    SERVICE_ROLE_KEY_length: key.length,
    SERVICE_ROLE_looks_like_jwt: key.trim().startsWith("eyJ"),
    // First 11 chars only (key "type"), never the secret itself.
    SERVICE_ROLE_KEY_prefix: key.slice(0, 11),
    SESSION_SECRET_present: Boolean(process.env.SESSION_SECRET),
    POOL_PASSWORD_present: Boolean(process.env.POOL_PASSWORD),
    ADMIN_PIN_present: Boolean(process.env.ADMIN_PIN),
  };

  let db: Record<string, unknown>;
  try {
    const client = getServiceClient();
    const { count, error } = await client
      .from("matches")
      .select("*", { count: "exact", head: true });
    db = error
      ? { ok: false, error: error.message, code: error.code, hint: error.hint }
      : { ok: true, matches_count: count };
  } catch (e) {
    db = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ env, db });
}

function safeHost(u: string): string | null {
  try {
    return new URL(u).host;
  } catch {
    return "INVALID_URL";
  }
}
