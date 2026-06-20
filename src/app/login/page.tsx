import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { listMemberNames } from "./actions";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  const t = await getTranslations("login");
  const names = await listMemberNames();

  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="text-2xl font-extrabold text-pitch">{t("title")}</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-600">{t("subtitle")}</p>
      <LoginForm names={names} />
    </div>
  );
}
