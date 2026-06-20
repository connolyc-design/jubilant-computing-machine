import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageToggle from "./LanguageToggle";
import { getSession } from "@/lib/auth";

/** Top navigation bar — present on every screen, with the language toggle. */
export default async function Nav() {
  const t = await getTranslations("nav");
  const tApp = await getTranslations("app");
  const session = await getSession();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-pitch">{tApp("name")}</span>
          <span className="hidden text-xs text-neutral-500 sm:inline">{tApp("tagline")}</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium text-neutral-700">
          {session && (
            <>
              <Link href="/" className="hidden hover:text-pitch sm:inline">
                {t("matches")}
              </Link>
              <Link href="/leaderboard" className="hover:text-pitch">
                {t("leaderboard")}
              </Link>
              <Link href="/pot" className="hover:text-pitch">
                {t("pot")}
              </Link>
            </>
          )}
          <Link href="/about" className="hover:text-pitch">
            {t("about")}
          </Link>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
