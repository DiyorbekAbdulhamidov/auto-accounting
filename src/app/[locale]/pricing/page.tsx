import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell, { PublicHeading } from "@/components/landing/PublicShell";
import { FinalCta, Pricing } from "@/components/landing/Sections";
import { PricingFaq } from "@/components/landing/PricingFaq";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "pricing");
}

/**
 * NARX — alohida sahifa.
 *
 * Nega alohida: «buxgalteriya dasturi narxi» / «цена бухгалтерской
 * программы» — mustaqil qidiruv so'rovi. Bosh sahifadagi bo'lim shu
 * so'rov bo'yicha hech qachon alohida sahifachalik kuchli turmaydi.
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <BreadcrumbJsonLd locale={locale} page="pricing" />
      <PublicShell>
        <PublicHeading
          title="Нарх йўқ — ҳаммаси бепул"
          lead="Барча имкониятлар очиқ ва чекловсиз. Карта сўралмайди, тўлов сўралмайди, синов муддати йўқ."
        />
        <Pricing heading={false} />
        <PricingFaq />
        <FinalCta />
      </PublicShell>
    </>
  );
}
