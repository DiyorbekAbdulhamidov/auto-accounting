import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell, { PublicHeading } from "@/components/landing/PublicShell";
import { FinalCta } from "@/components/landing/Sections";
import Guide from "@/components/guide/Guide";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/JsonLd";
import { isLocale, localeToLang } from "@/lib/i18n";
import { pageMeta } from "@/lib/pageMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, "guide");
}

/**
 * QO'LLANMA — kirish TALAB QILINMAYDI.
 *
 * Bosh sahifa ham qo'llanmaning asosiy bo'limlarini ko'rsatadi. Bu
 * sahifa esa TO'LIQ variant: bitta `<Guide />` komponenti, bitta
 * manba — ikkita joyda matn eskirib qolmaydi.
 */
export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = localeToLang(locale);

  return (
    <>
      <BreadcrumbJsonLd locale={locale} page="guide" />
      {/* `<Guide />` ичида ТСС бўлими КЎРИНАДИ — разметка ҳақиқатга мос */}
      <FaqJsonLd lang={lang} />
      <PublicShell>
        <PublicHeading
          title="Қўлланма"
          lead="Тизим нима қилади, файлларни қандай юкланади ва натижани қандай ўқилади — уч қадамда, мисоллар билан."
        />
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
          <Guide />
        </div>
        <FinalCta />
      </PublicShell>
    </>
  );
}
