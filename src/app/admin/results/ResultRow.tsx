"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setResultAction } from "../actions";
import type { Code } from "@/lib/scoring";

export interface ResultRowData {
  id: string;
  label: string; // "Group · time"
  equipo1: string;
  equipo2: string;
  resultCode: Code | null;
}

/** One row in the admin results screen: tap 1 / X / 2 to set the GANADOR. */
export default function ResultRow({ data }: { data: ResultRowData }) {
  const t = useTranslations("admin");
  const [result, setResult] = useState<Code | null>(data.resultCode);
  const [pending, startTransition] = useTransition();

  function set(code: Code | null) {
    if (pending) return;
    const prev = result;
    setResult(code);
    startTransition(async () => {
      const res = await setResultAction(data.id, code);
      if (!res.ok) setResult(prev);
    });
  }

  const opts: { code: Code; label: string }[] = [
    { code: 1, label: "1" },
    { code: 0, label: "X" },
    { code: 2, label: "2" },
  ];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {data.equipo1} <span className="text-neutral-400">vs</span> {data.equipo2}
        </div>
        <div className="text-xs text-neutral-500">{data.label}</div>
      </div>
      <div className="flex items-center gap-1">
        {opts.map((o) => (
          <button
            key={o.code}
            type="button"
            disabled={pending}
            onClick={() => set(o.code)}
            data-selected={result === o.code}
            className="pick-btn !flex-none !px-3 !py-2 text-sm"
          >
            {o.label}
          </button>
        ))}
        {result !== null && (
          <button
            type="button"
            disabled={pending}
            onClick={() => set(null)}
            className="ml-1 text-xs text-neutral-400 underline"
          >
            {t("clear")}
          </button>
        )}
      </div>
    </div>
  );
}
