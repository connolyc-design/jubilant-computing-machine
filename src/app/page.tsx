import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import MatchList from "@/components/MatchList";
import { maybeSync } from "@/lib/sync";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Keep results fresh whenever the app is opened (throttled, best-effort).
  await maybeSync();

  const t = await getTranslations("home");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-pitch px-5 py-5 text-white">
        <h1 className="text-lg font-extrabold">{t("welcome")}</h1>
        <p className="mt-0.5 text-sm text-white/90">{session.name}</p>
      </div>

      <MatchList memberId={session.memberId} />
    </div>
  );
}
