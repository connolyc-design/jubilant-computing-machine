"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { unlockAdminAction } from "./actions";

export default function PinForm() {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(unlockAdminAction, {});

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="text-2xl font-extrabold text-pitch">{t("pinTitle")}</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">{t("pinSubtitle")}</p>
      <form action={action} className="space-y-4">
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          required
          autoComplete="one-time-code"
          placeholder={t("pin")}
          className="w-full rounded-xl border-2 border-neutral-200 bg-white px-3 py-3 text-base"
        />
        {state?.error && (
          <p className="text-sm font-medium text-red-600">{t(state.error)}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-pitch px-4 py-3 text-base font-semibold text-white disabled:opacity-60"
        >
          {t("unlock")}
        </button>
      </form>
    </div>
  );
}
