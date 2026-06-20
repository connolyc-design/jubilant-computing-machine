/**
 * ============================================================================
 *  LA QUINIELA — SCORING ENGINE
 * ============================================================================
 *
 *  This is the heart of the app and the part most likely to be tweaked, so it
 *  is written as a set of PURE functions (no database, no framework) and is
 *  covered by unit tests in `tests/scoring.test.ts`.
 *
 *  It reproduces the exact logic of the original Excel sheet ("Hoja1"):
 *
 *    Each match has two teams — EQUIPO 1 and EQUIPO 2 — and every member
 *    submits a single prediction using these codes (the group already thinks
 *    in these numbers, so we preserve them everywhere under the hood):
 *
 *        1  ->  Equipo 1 wins        (local)
 *        2  ->  Equipo 2 wins        (visitante)
 *        0  ->  Empate / draw
 *
 *    The admin later enters the actual result (GANADOR) using the same codes.
 *    In the spreadsheet an unplayed match is marked with the placeholder `5`;
 *    here an unplayed/unknown result is simply `null`.
 *
 *    Scoring (matches the sheet's "1 / 0" legend):
 *        correct prediction -> POINTS_PER_CORRECT   (default 1)
 *        wrong prediction   -> 0
 *        missing prediction -> 0
 *
 *    There is intentionally NO exact-score bonus in v1. The points-per-correct
 *    value is a config setting (`pool_config.points_per_correct`, default 1) so
 *    it is trivial to change later — e.g. to weight knockout rounds.
 * ============================================================================
 */

/** The only valid prediction / result codes. `1` = Equipo 1, `2` = Equipo 2, `0` = draw. */
export type Code = 0 | 1 | 2;

/** A result is a `Code` once the match has been played, or `null` while unknown. */
export type ResultCode = Code | null;

/** A member's pick is a `Code`, or `null`/`undefined` when they did not predict. */
export type PickCode = Code | null | undefined;

/** Codes accepted by the scoring functions (runtime guard helper below). */
export const VALID_CODES: readonly Code[] = [0, 1, 2] as const;

/** Spreadsheet placeholder used in the original sheet for "not played yet". */
export const NOT_PLAYED_PLACEHOLDER = 5;

export function isValidCode(value: unknown): value is Code {
  return value === 0 || value === 1 || value === 2;
}

/**
 * Normalises a raw cell/value coming from the sheet (or an old import) into our
 * `ResultCode`. The Excel used `5` to mean "not played" — we map that, and any
 * other out-of-range value, to `null`.
 */
export function normaliseResult(raw: unknown): ResultCode {
  if (isValidCode(raw)) return raw;
  return null; // includes the `5` placeholder and anything unexpected
}

/**
 * Points earned by a single prediction against a single result.
 *
 * @param pick              The member's pick (may be null/undefined = no pick).
 * @param result            The actual result (null = match not yet scored).
 * @param pointsPerCorrect  Config value; defaults to 1 to match the sheet.
 * @returns                 `pointsPerCorrect` if the pick is correct, else `0`.
 *
 * A match with no result yet always scores 0 (it simply has not been awarded).
 * A missing pick always scores 0.
 */
export function scorePrediction(
  pick: PickCode,
  result: ResultCode,
  pointsPerCorrect = 1,
): number {
  if (result === null) return 0; // not played / not yet entered
  if (!isValidCode(pick)) return 0; // member never predicted this match
  return pick === result ? pointsPerCorrect : 0;
}

/** A member as far as scoring is concerned. */
export interface ScoringMember {
  id: string;
  name: string;
}

/** One prediction row: who picked what for which match. */
export interface ScoringPrediction {
  memberId: string;
  matchId: string;
  pick: PickCode;
}

/** One match row: its id and the entered result (or null). */
export interface ScoringMatch {
  id: string;
  result: ResultCode;
}

/** A member's computed standing: total points (PUNTAJE) and rank (PUESTO). */
export interface Standing {
  memberId: string;
  name: string;
  /** PUNTAJE — running total of awarded points. */
  points: number;
  /** Number of matches the member predicted correctly (== points when flat 1). */
  correct: number;
  /** Number of finished matches the member submitted a pick for. */
  played: number;
  /** PUESTO — 1-based rank using standard competition ranking (1,2,2,4). */
  rank: number;
}

/**
 * Computes the full leaderboard (PUNTAJE + PUESTO) from raw rows.
 *
 * This is the function the leaderboard screen and the totals row (`PUNTAJES`)
 * are built on. It is deliberately O(members + predictions) and side-effect
 * free so it can run on the server per request or in a test.
 *
 * Ranking rule — STANDARD COMPETITION RANKING ("1224"):
 *   members are ordered by points descending; equal points share the same
 *   rank, and the next distinct score skips ranks accordingly. Ties are broken
 *   for *display order only* (not rank) by name, so the table is stable.
 */
export function computeStandings(
  members: ScoringMember[],
  matches: ScoringMatch[],
  predictions: ScoringPrediction[],
  pointsPerCorrect = 1,
): Standing[] {
  // Index results by matchId for O(1) lookup.
  const resultByMatch = new Map<string, ResultCode>();
  for (const m of matches) resultByMatch.set(m.id, m.result);

  // Seed every member at zero so members with no predictions still appear.
  const acc = new Map<string, { points: number; correct: number; played: number }>();
  for (const m of members) acc.set(m.id, { points: 0, correct: 0, played: 0 });

  for (const p of predictions) {
    const bucket = acc.get(p.memberId);
    if (!bucket) continue; // prediction for an unknown member — ignore defensively
    const result = resultByMatch.get(p.matchId);
    if (result === undefined || result === null) continue; // match not scored yet
    if (!isValidCode(p.pick)) continue; // no real pick
    bucket.played += 1;
    if (p.pick === result) {
      bucket.correct += 1;
      bucket.points += pointsPerCorrect;
    }
  }

  // Build standings array.
  const standings: Standing[] = members.map((m) => {
    const b = acc.get(m.id)!;
    return {
      memberId: m.id,
      name: m.name,
      points: b.points,
      correct: b.correct,
      played: b.played,
      rank: 0, // assigned below
    };
  });

  // Order by points desc, then name asc for a stable, readable table.
  standings.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  // Assign standard competition ranking (ties share a rank, next rank skips).
  let lastPoints: number | null = null;
  let lastRank = 0;
  standings.forEach((s, i) => {
    if (lastPoints === null || s.points !== lastPoints) {
      lastRank = i + 1; // position in the (1-based) sorted list
      lastPoints = s.points;
    }
    s.rank = lastRank;
  });

  return standings;
}

/**
 * Convenience: total points awarded for one member across all matches.
 * (Equivalent to one cell in the spreadsheet's `PUNTAJES` row.)
 */
export function memberTotal(
  memberId: string,
  matches: ScoringMatch[],
  predictions: ScoringPrediction[],
  pointsPerCorrect = 1,
): number {
  const resultByMatch = new Map(matches.map((m) => [m.id, m.result]));
  let total = 0;
  for (const p of predictions) {
    if (p.memberId !== memberId) continue;
    const result = resultByMatch.get(p.matchId) ?? null;
    total += scorePrediction(p.pick, result, pointsPerCorrect);
  }
  return total;
}
