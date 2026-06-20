"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setUserLocale } from "@/i18n/locale";
import { type Locale } from "@/i18n/config";

/**
 * ES <-> EN toggle shown in the top nav on every screen. Flips the locale
 * cookie via a server action and refreshes the server components.
 */
export default function LanguageToggle() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setUserLocale(next);
    });
  }

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-neutral-300 text-xs font-semibold">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={locale === l}
          className={
            locale === l
              ? "bg-pitch px-3 py-1 text-white"
              : "bg-white px-3 py-1 text-neutral-600"
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
