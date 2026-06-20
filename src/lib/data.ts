import "server-only";
import { getServiceClient } from "./supabase/server";
import {
  computeStandings,
  type Standing,
  type Code,
} from "./scoring";

/** Domain row shapes (mirror the SQL schema). */
export interface Member {
  id: string;
  name: string;
  email: string | null;
  is_admin: boolean;
  paid: boolean;
}
export interface Match {
  id: string;
  stage: string;
  group_label: string | null;
  equipo_1: string;
  equipo_2: string;
  kickoff_utc: string;
  result_code: Code | null;
  match_order: number | null;
}
export interface Prediction {
  member_id: string;
  match_id: string;
  pick_code: Code;
}
export interface PoolConfig {
  buy_in: number;
  currency: string;
  points_per_correct: number;
  payout_structure: { place: number; pct: number }[];
  picks_hidden_until_kickoff: boolean;
}

export async function getConfig(): Promise<PoolConfig> {
  const db = getServiceClient();
  const { data, error } = await db.from("pool_config").select("*").eq("id", true).single();
  if (error) throw error;
  return data as PoolConfig;
}

export async function getMembers(): Promise<Member[]> {
  const db = getServiceClient();
  const { data, error } = await db.from("members").select("*").order("name");
  if (error) throw error;
  return data as Member[];
}

export async function getMatches(): Promise<Match[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true })
    .order("match_order", { ascending: true });
  if (error) throw error;
  return data as Match[];
}

export async function getMemberPredictions(memberId: string): Promise<Prediction[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("predictions")
    .select("member_id, match_id, pick_code")
    .eq("member_id", memberId);
  if (error) throw error;
  return data as Prediction[];
}

export async function getAllPredictions(): Promise<Prediction[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("predictions")
    .select("member_id, match_id, pick_code");
  if (error) throw error;
  return data as Prediction[];
}

/** Picks for a single match (used to reveal everyone's picks once it locks). */
export async function getMatchPredictions(
  matchId: string,
): Promise<{ member_id: string; pick_code: Code }[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("predictions")
    .select("member_id, pick_code")
    .eq("match_id", matchId);
  if (error) throw error;
  return data as { member_id: string; pick_code: Code }[];
}

/** Computes the live leaderboard (PUNTAJE + PUESTO) from current data. */
export async function getStandings(): Promise<Standing[]> {
  const [members, matches, predictions, config] = await Promise.all([
    getMembers(),
    getMatches(),
    getAllPredictions(),
    getConfig(),
  ]);
  return computeStandings(
    members.map((m) => ({ id: m.id, name: m.name })),
    matches.map((m) => ({ id: m.id, result: m.result_code })),
    predictions.map((p) => ({
      memberId: p.member_id,
      matchId: p.match_id,
      pick: p.pick_code,
    })),
    config.points_per_correct,
  );
}
