import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell from "@/components/landing/PublicShell";
import { LegalDocView } from "@/components/legal/LegalDocView";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/pageMeta";
import { REFUND } from "@/lib/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "refund");
}

/**
 * TO'LOVNI QAYTARISH — ATAYLAB alohida sahifa.
 *
 * Oferta ichidagi band ham yetardi, lekin to'lov tizimi moderatsiyasi
 * «ochiq e'lon qilingan qaytarish siyosati» ni alohida qidiradi va
 * uzun shartnoma ichidan izlab o'tirmaydi. Foydalanuvchi ham xuddi
 * shunday: pul qaytarish savoli tug'ilganda u shartnoma o'qimaydi.
 */
export default async function RefundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <BreadcrumbJsonLd locale={locale} page="refund" />
      <PublicShell>
        <LegalDocView docs={REFUND} />
      </PublicShell>
    </>
  );
}
