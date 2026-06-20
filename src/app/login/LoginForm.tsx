"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "./actions";

export default function LoginForm({ names }: { names: string[] }) {
  const t = useTranslations("login");
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          {t("selectName")}
        </label>
        <select
          id="name"
          name="name"
          defaultValue=""
          required
          className="w-full rounded-xl border-2 border-neutral-200 bg-white px-3 py-3 text-base"
        >
          <option value="" disabled>
            {t("selectNamePlaceholder")}
          </option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border-2 border-neutral-200 bg-white px-3 py-3 text-base"
        />
      </div>

      {state?.error && (
        <p className="text-sm font-medium text-red-600">{t(state.error)}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-pitch px-4 py-3 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {t("submit")}
      </button>

      <p className="pt-2 text-center text-xs text-neutral-500">{t("adminHint")}</p>
    </form>
  );
}
