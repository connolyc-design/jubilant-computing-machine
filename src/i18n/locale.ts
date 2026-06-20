"use server";

import { cookies } from "next/headers";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./config";

const COOKIE_NAME = "locale";

/** Reads the active locale from the cookie, falling back to Spanish. */
export async function getUserLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

/** Server action used by the language toggle to switch ES <-> EN. */
export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, LOCALES.includes(locale) ? locale : DEFAULT_LOCALE, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
