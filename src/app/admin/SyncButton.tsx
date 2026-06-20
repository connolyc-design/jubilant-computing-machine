"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { syncNowAction } from "./actions";

/** Admin button to force the automatic results sync (it also runs on a cron). */
export default function SyncButton() {
  const t = useTranslations("admin");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (pending) return;
    setMsg(null);
    startTransition(async () => {
      const r = await syncNowAction();
      setMsg(
        r.ok
          ? t("syncDone", { updated: r.updated ?? 0, finished: r.finished ?? 0 })
          : t("syncFailed"),
      );
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="font-semibold text-neutral-900">{t("autoResults")}</div>
      <div className="mt-1 text-xs text-neutral-500">{t("autoResultsHint")}</div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-xl bg-pitch px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : t("syncNow")}
        </button>
        {msg && <span className="text-xs text-neutral-600">{msg}</span>}
      </div>
    </div>
  );
}
