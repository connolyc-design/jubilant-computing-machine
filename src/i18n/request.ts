import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./locale";

// next-intl reads the per-request locale from our cookie and loads the matching
// message table. No locale prefix in the URL — the toggle just flips the cookie.
export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
