import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getSession, hasAdminUnlock } from "@/lib/auth";
import { getMatches } from "@/lib/data";
import { formatLima } from "@/lib/time";
import ResultRow, { type ResultRowData } from "./ResultRow";

export default async function AdminResultsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await hasAdminUnlock())) redirect("/admin");

  const locale = await getLocale();
  const t = await getTranslations("admin");
  const matches = await getMatches();

  const rows: ResultRowData[] = matches.map((m) => ({
    id: m.id,
    label: `${m.group_label ? m.group_label + " · " : ""}${formatLima(m.kickoff_utc, locale)}`,
    equipo1: m.equipo_1,
    equipo2: m.equipo_2,
    resultCode: m.result_code,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-pitch">{t("results")}</h1>
      <p className="mb-4 text-xs text-neutral-500">{t("resultsHint")}</p>
      <div className="space-y-2">
        {rows.map((r) => (
          <ResultRow key={r.id} data={r} />
        ))}
      </div>
    </div>
  );
}
