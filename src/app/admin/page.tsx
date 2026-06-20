import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession, hasAdminUnlock } from "@/lib/auth";
import PinForm from "./PinForm";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Logged in but PIN not entered yet -> show the PIN gate.
  if (!(await hasAdminUnlock())) return <PinForm />;

  const t = await getTranslations("admin");
  const cards = [
    { href: "/admin/results", title: t("results"), hint: t("resultsHint") },
    { href: "/admin/members", title: t("members"), hint: t("membersHint") },
    { href: "/admin/pot", title: t("potSettings"), hint: t("potSettingsHint") },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-pitch">{t("title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-pitch"
          >
            <div className="font-semibold text-neutral-900">{c.title}</div>
            <div className="mt-1 text-xs text-neutral-500">{c.hint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
