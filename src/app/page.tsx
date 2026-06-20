import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const t = await getTranslations("home");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-pitch px-5 py-6 text-white">
        <h1 className="text-xl font-extrabold">{t("welcome")}</h1>
        <p className="mt-1 text-sm text-white/90">
          {session.name}
        </p>
      </div>

      {/* Phase 3 will render the upcoming-matches list with the 1 / 0 / 2 picks here. */}
      <section className="rounded-2xl border border-dashed border-neutral-300 px-5 py-10 text-center text-sm text-neutral-500">
        {t("next")} — <span className="italic">próximamente / coming soon</span>
      </section>
    </div>
  );
}
