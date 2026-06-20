import "server-only";
import { getServiceClient } from "./supabase/server";
import { isLocked } from "./time";
import type { Code } from "./scoring";

/**
 * AUTOMATIC RESULTS SYNC
 * ----------------------
 * Pulls finished group-stage scores from the openfootball 2026 dataset and
 * writes the GANADOR (1 / 2 / 0) into our `matches` table — so results appear
 * without anyone entering them by hand.
 *
 * The dataset is keyed the same way we seeded fixtures (team1 = equipo_1), so we
 * match on the canonical team pair. We ONLY set a result for matches whose
 * kickoff has already passed, so a score that exists in the dataset for a
 * not-yet-played match can never leak before lock.
 */

const SOURCE_URL =
  process.env.SYNC_SOURCE_URL ??
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// openfootball name -> our canonical name (only the spellings that differ).
const NAME_MAP: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Czech Republic": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  Turkey: "Türkiye",
  USA: "United States",
};
const canon = (n: string) => NAME_MAP[n] ?? n;
const key = (a: string, b: string) => `${a}|||${b}`;

interface SourceMatch {
  group?: string;
  team1: string;
  team2: string;
  score?: { ft?: [number, number] };
}

/** Derives the result code from a full-time score. */
function resultFromScore(ft: [number, number]): Code {
  const [a, b] = ft;
  if (a > b) return 1; // equipo_1 wins
  if (a < b) return 2; // equipo_2 wins
  return 0; // draw
}

export interface SyncSummary {
  total: number; // group matches in our DB
  finished: number; // matches whose kickoff has passed
  updated: number; // results actually written this run
  skippedFuture: number; // had a score in the source but kickoff not reached
}

export async function syncResults(): Promise<SyncSummary> {
  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Source fetch failed: ${res.status}`);
  const data = (await res.json()) as { matches: SourceMatch[] };

  // Build a lookup of canonical team pair -> result code (only scored matches).
  const scoreByPair = new Map<string, Code>();
  for (const m of data.matches) {
    if (!String(m.group ?? "").startsWith("Group")) continue;
    if (!m.score?.ft || m.score.ft.length !== 2) continue;
    scoreByPair.set(key(canon(m.team1), canon(m.team2)), resultFromScore(m.score.ft));
  }

  const db = getServiceClient();
  const { data: matches, error } = await db
    .from("matches")
    .select("id, equipo_1, equipo_2, kickoff_utc, result_code")
    .eq("stage", "group");
  if (error) throw error;

  const summary: SyncSummary = {
    total: matches?.length ?? 0,
    finished: 0,
    updated: 0,
    skippedFuture: 0,
  };

  const updates: { id: string; result_code: Code }[] = [];
  for (const m of matches ?? []) {
    const code = scoreByPair.get(key(m.equipo_1, m.equipo_2));
    if (code === undefined) continue; // no final score in the source yet
    if (!isLocked(m.kickoff_utc)) {
      summary.skippedFuture++; // protect against leaking a future result
      continue;
    }
    summary.finished++;
    if (m.result_code !== code) updates.push({ id: m.id, result_code: code });
  }

  // Apply updates (one statement each; the set is small — at most 72).
  for (const u of updates) {
    const { error: uErr } = await db
      .from("matches")
      .update({ result_code: u.result_code })
      .eq("id", u.id);
    if (uErr) throw uErr;
  }
  summary.updated = updates.length;
  return summary;
}
