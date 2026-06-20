import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { getStandings } from "@/lib/data";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const t = await getTranslations("leaderboard");
  const standings = await getStandings();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-pitch">{t("title")}</h1>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="px-3 py-2 text-center">{t("place")}</th>
              <th className="px-3 py-2">{t("player")}</th>
              <th className="px-3 py-2 text-right">{t("correct")}</th>
              <th className="px-3 py-2 text-right">{t("points")}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => {
              const me = s.memberId === session.memberId;
              return (
                <tr
                  key={s.memberId}
                  className={`border-b border-neutral-100 last:border-0 ${
                    me ? "bg-pitch/5 font-semibold" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-center tabular-nums">{s.rank}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                    {s.correct}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">
                    {s.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
