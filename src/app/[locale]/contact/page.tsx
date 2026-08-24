import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell, { PublicHeading } from "@/components/landing/PublicShell";
import { ContactBody } from "@/components/legal/ContactBody";
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
  return pageMeta(locale, "contact");
}

/**
 * ALOQA VA REKVIZITLAR.
 *
 * To'lov tizimi moderatsiyasi xizmat ortida ANIQ shaxs turganini
 * ko'rishi kerak: kim, qanday maqomda, qaysi hujjat asosida va qayerda.
 * Foydalanuvchi uchun esa bu — pul to'lashdan oldin «kimga to'layapman»
 * degan savolning javobi.
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <BreadcrumbJsonLd locale={locale} page="contact" />
      <PublicShell>
        <PublicHeading
          title="Алоқа ва реквизитлар"
          lead="Савол, таклиф ёки тўлов бўйича мурожаат — Телеграм орқали ёзинг."
        />
        <ContactBody />
      </PublicShell>
    </>
  );
}
