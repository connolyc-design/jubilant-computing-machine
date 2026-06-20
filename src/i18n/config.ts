/** Locale constants/types — safe to import from anywhere (client or server). */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es"; // Spanish default for this Lima group
