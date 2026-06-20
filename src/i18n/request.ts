import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./locale";
import en from "./messages/en.json";
import es from "./messages/es.json";

// Static imports (not a dynamic `import(\`./messages/${locale}\`)`) so the JSON
// is always bundled into the serverless function — Netlify's tracer does not
// reliably include dynamically-pathed imports, which 500s every page.
const MESSAGES = { en, es } as const;

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  return {
    locale,
    messages: MESSAGES[locale],
  };
});
