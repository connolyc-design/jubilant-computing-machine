/**
 * Time helpers. Rule for the whole app: timestamps are STORED in UTC and
 * RENDERED in Lima time (America/Lima, UTC-5, no DST). We use Intl with an
 * explicit timeZone so it is correct regardless of the server's locale.
 */

export const LIMA_TZ = "America/Lima";

/** Formats a UTC instant as a Lima date+time, e.g. "11 jun, 2:00 p. m.". */
export function formatLima(
  utc: string | Date,
  locale: string,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  },
): string {
  const date = typeof utc === "string" ? new Date(utc) : utc;
  return new Intl.DateTimeFormat(locale, { timeZone: LIMA_TZ, ...opts }).format(date);
}

/** Lima date only, e.g. "jueves 11 de junio". */
export function formatLimaDate(utc: string | Date, locale: string): string {
  return formatLima(utc, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Lima time only, e.g. "2:00 p. m.". */
export function formatLimaTime(utc: string | Date, locale: string): string {
  return formatLima(utc, locale, { hour: "numeric", minute: "2-digit" });
}

/**
 * A match LOCKS at kickoff: once now >= kickoff, picks are read-only. This is
 * the single source of truth for "locked" (the DB does not store it).
 */
export function isLocked(kickoffUtc: string | Date, now: Date = new Date()): boolean {
  const kickoff = typeof kickoffUtc === "string" ? new Date(kickoffUtc) : kickoffUtc;
  return now.getTime() >= kickoff.getTime();
}
