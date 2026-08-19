import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell from "@/components/landing/PublicShell";
import { LegalDocView } from "@/components/legal/LegalDocView";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/pageMeta";
import { OFFER } from "@/lib/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "offer");
}

/**
 * OMMAVIY OFERTA.
 *
 * Nega kerak: to'lov tizimi (Click) moderatsiyasi saytda shartnoma
 * matnini, narxni so'mda va rekvizitlarni qidiradi. Ular bo'lmasa
 * merchant arizasi qaytariladi. Foydalanuvchi uchun esa bu — nima
 * uchun pul to'layotganining yozma sharti.
 */
export default async function OfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <BreadcrumbJsonLd locale={locale} page="offer" />
      <PublicShell>
        <LegalDocView docs={OFFER} withDetails />
      </PublicShell>
    </>
  );
}
