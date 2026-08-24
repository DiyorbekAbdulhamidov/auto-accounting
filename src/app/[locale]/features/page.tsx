import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell, { PublicHeading } from "@/components/landing/PublicShell";
import FeatureGrid from "@/components/landing/FeatureGrid";
import { FinalCta, Roadmap } from "@/components/landing/Sections";
import { GuideDirections } from "@/components/guide/Guide";
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
  return pageMeta(locale, "features");
}

/**
 * IMKONIYATLAR — to'liq ro'yxat.
 *
 * Bosh sahifada bu bo'lim QISQARTIRILGAN (4 ta) turadi va bu yerga
 * havola qiladi. Bir xil matn ikki manzilda to'liq takrorlansa,
 * Google uni dublikat deb hisoblaydi.
 */
export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <BreadcrumbJsonLd locale={locale} page="features" />
      <PublicShell>
        <PublicHeading
          title="Нима бор"
          lead="Ҳар бир имконият ҳақиқий банк файлида чиққан муаммодан келиб чиққан — рўйхат тўлдириш учун эмас."
        />
        {/* Сарлавҳа юқорида `<h1>` бўлиб турибди, шунинг учун бўлим
            ўз сарлавҳасини чизмайди — битта саҳифада иккита h1/h2
            бир хил матн билан турмаслиги керак. */}
        <FeatureGrid heading={false} />
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
          <GuideDirections />
        </div>
        <Roadmap />
        <FinalCta />
      </PublicShell>
    </>
  );
}
