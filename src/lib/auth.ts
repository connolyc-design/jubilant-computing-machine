import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Lightweight session layer for the "pick name + pool password" login model.
 *
 *  - A MEMBER logs in by choosing their name and entering POOL_PASSWORD. We then
 *    issue a signed cookie ("q_session") naming who they are.
 *  - The ADMIN (Angelo) unlocks result-entry / management by additionally
 *    entering ADMIN_PIN, which sets a second signed cookie ("q_admin").
 *
 * Tokens are HMAC-signed with SESSION_SECRET (no DB lookup needed to verify),
 * so we avoid pulling in an auth library. Payloads are NOT encrypted — they
 * only contain a member id/name, which is not sensitive.
 */

const SESSION_COOKIE = "q_session";
const ADMIN_COOKIE = "q_admin";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export interface Session {
  memberId: string;
  name: string;
  isAdmin: boolean; // member's roster flag (still needs the PIN to act as admin)
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET missing or too short (need >= 16 chars).");
  }
  return s;
}

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

/** Validates the shared pool password (constant-time). */
export function checkPoolPassword(input: string): boolean {
  const expected = process.env.POOL_PASSWORD ?? "";
  if (!expected) throw new Error("POOL_PASSWORD not configured.");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Validates the admin PIN (constant-time). */
export function checkAdminPin(input: string): boolean {
  const expected = process.env.ADMIN_PIN ?? "";
  if (!expected) throw new Error("ADMIN_PIN not configured.");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createSession(s: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verify<Session>(store.get(SESSION_COOKIE)?.value);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ADMIN_COOKIE);
}

/** Grants admin powers for this browser after a correct PIN. */
export async function grantAdmin(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, sign({ admin: true }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** True only when the PIN has been entered in this browser. */
export async function hasAdminUnlock(): Promise<boolean> {
  const store = await cookies();
  return verify<{ admin: boolean }>(store.get(ADMIN_COOKIE)?.value)?.admin === true;
}
