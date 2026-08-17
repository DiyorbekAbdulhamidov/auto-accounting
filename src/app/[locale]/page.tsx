// ============================================================
// BOSH SAHIFA — OCHIQ
// ------------------------------------------------------------
// Server komponenti: meta ma'lumot va tuzilmali ma'lumot (JSON-LD)
// shu yerda. Ko'rinishning o'zi `LandingBody` da — u klient, chunki
// animatsiya va auth holati kerak.
//
// Kirgan foydalanuvchi bu sahifadan QAYTARILMAYDI — u ham narxni,
// ham qo'llanmani ko'ra olishi kerak. Faqat tugma «Ish stoli» ga
// aylanadi.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell from "@/components/landing/PublicShell";
import LandingBody from "@/components/landing/LandingBody";
import { FaqJsonLd, ProductJsonLd } from "@/components/JsonLd";
import { isLocale, localeToLang } from "@/lib/i18n";
import { pageMeta } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "home");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = localeToLang(locale);

  return (
    <>
      <ProductJsonLd locale={locale} lang={lang} />
      {/* ТСС бўлими бу саҳифада КЎРИНАДИ (LandingBody ичида
          `GuideFaq`), шунинг учун разметка ҳақиқатга мос */}
      <FaqJsonLd lang={lang} />
      <PublicShell>
        <LandingBody />
      </PublicShell>
    </>
  );
}
