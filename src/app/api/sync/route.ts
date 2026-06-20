import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncResults } from "@/lib/sync";

// Always run fresh (no caching) and on the Node runtime (uses the service key).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Automatic results sync endpoint.
 *
 * Called on a schedule by Vercel Cron (see vercel.json). When CRON_SECRET is
 * set, the request must present it (Vercel Cron sends it as a Bearer token);
 * this also lets you trigger a manual sync with:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://APP/api/sync
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    const url = new URL(request.url);
    const provided = auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await syncResults();
    // Results changed scores — refresh the affected pages.
    revalidatePath("/");
    revalidatePath("/leaderboard");
    revalidatePath("/pot");
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "sync failed" },
      { status: 500 },
    );
  }
}
