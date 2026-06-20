/**
 * Seeds the database with the fixed roster and ensures the pool_config row.
 * Run with:  npm run seed   (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *
 * Fixtures (the 72 group-stage matches) are seeded in a later step once the
 * schema is confirmed — see scripts/seed-fixtures.ts (added in Phase 3).
 */
import { createClient } from "@supabase/supabase-js";
import members from "../supabase/seed/members.json" assert { type: "json" };

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
