import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Quiniela — World Cup 2026",
  description: "World Cup 2026 prediction pool.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // mobile-first; prevent accidental zoom on the pick buttons
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Nav />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
