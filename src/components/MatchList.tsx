import { getLocale, getTranslations } from "next-intl/server";
import {
  getMatches,
  getMemberPredictions,
  getAllPredictions,
  getConfig,
} from "@/lib/data";
import { isLocked, formatLimaTime, formatLimaDate } from "@/lib/time";
import MatchCard, { type MatchCardData } from "./MatchCard";
import type { Code } from "@/lib/scoring";

/** Renders the full fixture list grouped by Lima day, with the pick buttons. */
export default async function MatchList({ memberId }: { memberId: string }) {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const [matches, myPreds, config] = await Promise.all([
    getMatches(),
    getMemberPredictions(memberId),
    getConfig(),
  ]);

  const myPickByMatch = new Map<string, Code>();
  for (const p of myPreds) myPickByMatch.set(p.match_id, p.pick_code);

  // Tally everyone's picks per match. Per the "hidden until kickoff" setting we
  // only attach a tally to a match AFTER it locks (see below), so open matches
  // never leak other members' picks.
  const tallyByMatch = new Map<string, { e1: number; draw: number; e2: number }>();
  const all = await getAllPredictions();
  for (const p of all) {
    const tl = tallyByMatch.get(p.match_id) ?? { e1: 0, draw: 0, e2: 0 };
    if (p.pick_code === 1) tl.e1++;
    else if (p.pick_code === 0) tl.draw++;
    else if (p.pick_code === 2) tl.e2++;
    tallyByMatch.set(p.match_id, tl);
  }
  void config; // picks_hidden_until_kickoff honoured by only revealing post-lock

  // Group matches by their Lima calendar day for nice date headers.
  const days = new Map<string, MatchCardData[]>();
  for (const m of matches) {
    const locked = isLocked(m.kickoff_utc);
    const card: MatchCardData = {
      id: m.id,
      groupLabel: m.group_label,
      equipo1: m.equipo_1,
      equipo2: m.equipo_2,
      kickoffLabel: formatLimaTime(m.kickoff_utc, locale),
      locked,
      resultCode: m.result_code,
      myPick: myPickByMatch.get(m.id) ?? null,
      // Reveal everyone's picks only once the match is locked.
      tally: locked ? tallyByMatch.get(m.id) ?? { e1: 0, draw: 0, e2: 0 } : undefined,
    };
    const key = formatLimaDate(m.kickoff_utc, locale);
    const arr = days.get(key) ?? [];
    arr.push(card);
    days.set(key, arr);
  }

  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 px-5 py-10 text-center text-sm text-neutral-500">
        {t("next")} — <span className="italic">seed fixtures to begin</span>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {[...days.entries()].map(([day, cards]) => (
        <section key={day}>
          <h2 className="mb-2 text-sm font-bold capitalize text-neutral-700">{day}</h2>
          <div className="space-y-3">
            {cards.map((c) => (
              <MatchCard key={c.id} data={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
