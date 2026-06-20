"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { savePoolConfigAction } from "../actions";
import type { PoolConfig } from "@/lib/data";

export default function PotForm({ config }: { config: PoolConfig }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(savePoolConfigAction, {});

  const pct = (place: number) =>
    config.payout_structure.find((p) => p.place === place)?.pct ?? 0;

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t("buyIn")}</span>
        <input
          name="buy_in"
          type="number"
          min="0"
          step="0.01"
          defaultValue={config.buy_in}
          className="w-full rounded-xl border-2 border-neutral-200 px-3 py-3"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t("currency")}</span>
        <input
          name="currency"
          maxLength={3}
          defaultValue={config.currency}
          className="w-full rounded-xl border-2 border-neutral-200 px-3 py-3 uppercase"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t("pointsPerCorrect")}</span>
        <input
          name="points_per_correct"
          type="number"
          min="0"
          step="1"
          defaultValue={config.points_per_correct}
          className="w-full rounded-xl border-2 border-neutral-200 px-3 py-3"
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t("payoutSplit")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "pct1", label: t("first"), val: pct(1) },
            { name: "pct2", label: t("second"), val: pct(2) },
            { name: "pct3", label: t("third"), val: pct(3) },
          ].map((f) => (
            <label key={f.name} className="block">
              <span className="mb-1 block text-center text-xs text-neutral-500">
                {f.label}
              </span>
              <input
                name={f.name}
                type="number"
                min="0"
                max="100"
                defaultValue={f.val}
                className="w-full rounded-xl border-2 border-neutral-200 px-2 py-2 text-center"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2">
        <input
          name="picks_hidden"
          type="checkbox"
          defaultChecked={config.picks_hidden_until_kickoff}
          className="h-5 w-5 accent-pitch"
        />
        <span className="text-sm">{t("hidePicks")}</span>
      </label>

      {state?.error && (
        <p className="text-sm font-medium text-red-600">{t(state.error)}</p>
      )}
      {state?.ok && <p className="text-sm font-medium text-pitch">{t("saved")}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-pitch px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : tc("save")}
      </button>
    </form>
  );
}
