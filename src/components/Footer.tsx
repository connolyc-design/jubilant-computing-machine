import { getTranslations } from "next-intl/server";

/** Footer with the required credit line (localised). */
export default async function Footer() {
  const t = await getTranslations("app");
  return (
    <footer className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-neutral-500">
      {/* EN: "Made by Angelo Chavez and Connoly Chavez" */}
      {/* ES: "Hecho por Angelo Chávez y Connoly Chávez" */}
      {t("credit")}
    </footer>
  );
}
