import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession, hasAdminUnlock } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import PotForm from "./PotForm";

export default async function AdminPotPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await hasAdminUnlock())) redirect("/admin");

  const t = await getTranslations("admin");
  const config = await getConfig();

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-2xl font-extrabold text-pitch">{t("potSettings")}</h1>
      <p className="mb-5 text-xs text-neutral-500">{t("potSettingsHint")}</p>
      <PotForm config={config} />
    </div>
  );
}
