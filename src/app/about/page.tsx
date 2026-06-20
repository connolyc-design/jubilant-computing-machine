import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <article className="prose prose-neutral max-w-none">
      <h1 className="text-2xl font-extrabold text-pitch">{t("title")}</h1>
      <p className="mt-3 text-neutral-700">{t("body")}</p>
      <p className="mt-6 text-sm font-semibold text-neutral-900">
        {/* Required credit — localised */}
        {t("credit")}
      </p>
    </article>
  );
}
