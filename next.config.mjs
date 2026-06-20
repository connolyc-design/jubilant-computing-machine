import createNextIntlPlugin from "next-intl/plugin";

// Point next-intl at our request config (locale + messages per request).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
