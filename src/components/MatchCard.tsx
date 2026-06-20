"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { savePick } from "@/app/actions/predictions";
import type { Code } from "@/lib/scoring";

export interface MatchCardData {
  id: string;
  groupLabel: string | null;
  equipo1: string;
  equipo2: string;
  kickoffLabel: string; // pre-formatted in Lima time on the server
  locked: boolean;
  resultCode: Code | null;
  myPick: Code | null;
  /** Revealed pick tallies (only sent for locked matches). */
  tally?: { e1: number; draw: number; e2: number };
}

/** The big 1 / 0 / 2 pick buttons for one match. */
export default function MatchCard({ data }: { data: MatchCardData }) {
  const t = useTranslations("match");
  const [pick, setPick] = useState<Code | null>(data.myPick);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(code: Code) {
    if (data.locked || pending) return;
    const prev = pick;
    setPick(code);
    setSaved(false);
    startTransition(async () => {
      const res = await savePick(data.id, code);
      if (res.ok) setSaved(true);
      else setPick(prev); // revert on failure (e.g. it just locked)
    });
  }

  // Each option: the code, label, and the team it represents.
  const options: { code: Code; label: string }[] = [
    { code: 1, label: t("equipo1Wins", { team: data.equipo1 }) },
    { code: 0, label: t("draw") },
    { code: 2, label: t("equipo2Wins", { team: data.equipo2 }) },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
        <span className="font-semibold">
          {data.groupLabel ? `${data.groupLabel} · ` : ""}
          {data.kickoffLabel}{" "}
          <span className="font-normal">({t("limaTime")})</span>
        </span>
        <span
          className={
            data.locked
              ? "rounded-full bg-neutral-200 px-2 py-0.5 font-semibold text-neutral-600"
              : "rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700"
          }
        >
          {data.locked ? t("locked") : t("open")}
        </span>
      </div>

      <div className="mb-3 text-center text-base font-bold">
        {data.equipo1} <span className="text-neutral-400">vs</span> {data.equipo2}
      </div>

      <div className="flex gap-2">
        {options.map((o) => {
          const selected = pick === o.code;
          const isResult = data.resultCode === o.code;
          return (
            <button
              key={o.code}
              type="button"
              disabled={data.locked || pending}
              onClick={() => choose(o.code)}
              data-selected={selected}
              className={`pick-btn ${isResult ? "ring-2 ring-amber-400" : ""}`}
            >
              <span className="block text-xs leading-tight">{o.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status line: saved / your pick / result + revealed tallies */}
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
        <span>
          {saved
            ? t("saved")
            : pick !== null
              ? `${t("yourPick")}: ${pick}`
              : ""}
        </span>
        {data.locked && data.tally && (
          <span className="tabular-nums">
            1:{data.tally.e1} · X:{data.tally.draw} · 2:{data.tally.e2}
          </span>
        )}
      </div>
    </div>
  );
}
