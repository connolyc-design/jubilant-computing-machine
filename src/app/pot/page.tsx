import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { getConfig, getMembers, getStandings } from "@/lib/data";

export default async function PotPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const t = await getTranslations("pot");
  const [config, members, standings] = await Promise.all([
    getConfig(),
    getMembers(),
    getStandings(),
  ]);

  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: config.currency || "USD",
      maximumFractionDigits: 2,
    }).format(n);

  const paidCount = members.filter((m) => m.paid).length;
  // The pot is the buy-in collected from everyone who has paid.
  const total = config.buy_in * paidCount;

  // Map each payout place to the member currently in that rank.
  const byRank = new Map<number, string>();
  for (const s of standings) if (!byRank.has(s.rank)) byRank.set(s.rank, s.name);
  const payouts = [...config.payout_structure]
    .sort((a, b) => a.place - b.place)
    .map((p) => ({
      place: p.place,
      pct: p.pct,
      amount: (total * p.pct) / 100,
      who: byRank.get(p.place) ?? "—",
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-pitch">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-pitch px-4 py-5 text-white">
          <div className="text-xs uppercase opacity-80">{t("total")}</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{money(total)}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5">
          <div className="text-xs uppercase text-neutral-500">{t("buyIn")}</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">
            {money(config.buy_in)}
          </div>
        </div>
      </div>

      {/* Payouts from current standings */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-neutral-700">{t("payouts")}</h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {payouts.map((p) => (
            <div
              key={p.place}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 last:border-0"
            >
              <span className="text-sm">
                <span className="font-bold">{p.place}º</span>
                <span className="ml-2 text-neutral-500">{p.pct}%</span>
                <span className="ml-2">{p.who}</span>
              </span>
              <span className="font-bold tabular-nums">{money(p.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Paid / owes list */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-neutral-700">
          {t("paid")} · {paidCount}/{members.length}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b border-neutral-100 px-4 py-2 text-sm last:border-0"
            >
              <span>{m.name}</span>
              <span
                className={
                  m.paid
                    ? "text-xs font-semibold text-pitch"
                    : "text-xs font-semibold text-neutral-400"
                }
              >
                {m.paid ? t("paid") : t("unpaid")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-neutral-500">{t("disclaimer")}</p>
    </div>
  );
}
