/**
 * Seeds the database with the fixed roster, the 72 real group-stage fixtures,
 * and ensures the pool_config row.
 * Run with:  npm run seed   (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *
 * Fixtures come from supabase/seed/fixtures.json — the real 2026 group stage
 * (teams, groups, dates, and kickoff times) sourced from the openfootball
 * dataset with exact per-venue UTC offsets; team names normalised to our
 * canonical set. The admin can still fine-tune any fixture in the app.
 */
import { createClient } from "@supabase/supabase-js";
import members from "../supabase/seed/members.json" assert { type: "json" };
import fixtures from "../supabase/seed/fixtures.json" assert { type: "json" };

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // Upsert members by unique name so re-running is safe.
  const { error: mErr } = await db
    .from("members")
    .upsert(members, { onConflict: "name" });
  if (mErr) throw mErr;
  console.log(`Seeded ${members.length} members.`);

  // Seed fixtures. We clear the group stage first so re-running stays idempotent
  // without leaving stale/duplicate matches (predictions cascade-delete).
  const { error: delErr } = await db.from("matches").delete().eq("stage", "group");
  if (delErr) throw delErr;
  const { error: fErr } = await db.from("matches").insert(fixtures);
  if (fErr) throw fErr;
  console.log(`Seeded ${fixtures.length} group-stage fixtures.`);

  // Ensure the singleton config row exists (currency defaults to USD here).
  const { error: cErr } = await db
    .from("pool_config")
    .upsert({ id: true, currency: "USD", points_per_correct: 1 }, { onConflict: "id" });
  if (cErr) throw cErr;
  console.log("Ensured pool_config (currency USD, 1 point per correct).");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
