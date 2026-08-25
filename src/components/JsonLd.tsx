// ============================================================
// TUZILMALI MA'LUMOT (JSON-LD)
// ------------------------------------------------------------
// Google uchun sahifa MAZMUNINI mashina o'qiy oladigan shaklda
// takrorlaydi. Buning natijasi qidiruvda kengaytirilgan natija
// (narx, reyting, savol-javob ochiladigan bo'lim) bo'lishi mumkin.
//
// MUHIM QOIDA: bu yerdagi matn sahifada KO'RINADIGAN matnga aynan
// mos kelishi shart. Shuning uchun u ham `translate()` orqali,
// ekрандаги bilan BITTA manbadan (`lib/faq.ts`) chiqariladi —
// qo'lda ikkinchi nusxa yozilmaydi.
//
// Server komponenti: `<script>` HTML'ga bir marta yoziladi va
// klient bundle'iga hech narsa qo'shmaydi.
// ============================================================

import { translate, type Lang, type Locale, LOCALE_HREFLANG } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { FAQ } from "@/lib/faq";
import { PLANS } from "@/lib/plans";
import { PATHS, type PathKey } from "@/lib/routes";
import { SITE_URL, seo } from "@/lib/seo";

function Script({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify natijasi — bizning o'z ma'lumotimiz, tashqi
      // kirish yo'q. `<` belgisi HTML'ni buzmasligi uchun qochiriladi.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Mahsulot + tashkilot. Faqat bosh sahifada. */
export function ProductJsonLd({ locale, lang }: { locale: Locale; lang: Lang }) {
  const copy = seo(locale, "home");
  const home = `${SITE_URL}/${locale}`;

  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: BRAND.name,
            url: SITE_URL,
            logo: `${SITE_URL}/icon.svg`,
            areaServed: { "@type": "Country", name: "Uzbekistan" },
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: home,
            name: BRAND.name,
            inLanguage: LOCALE_HREFLANG[locale],
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          {
            "@type": "SoftwareApplication",
            "@id": `${SITE_URL}/#software`,
            name: BRAND.name,
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "AccountingApplication",
            operatingSystem: "Web",
            url: home,
            inLanguage: LOCALE_HREFLANG[locale],
            description: copy.description,
            featureList: [
              translate("Қолдиқ тенгламаси", lang),
              translate("Формат хотираси", lang),
              translate("Акт сверки", lang),
              translate("Қарздорлик ёши", lang),
            ],
            /* БИТТА таклиф: 0 сўм.
               ------------------------------------------------------------
               Илгари бу ерда учта Offer турарди ва иккитасида 9 999 /
               39 999 сўм ёзилганди. Дастур бепул бўлгач, тузилмали
               маълумотда нарх қолиши — қидирув натижасида «дан 9 999
               сўм» деб чиқиши демакдир, яъни саҳифада йўқ нарса. */
            offers: {
              "@type": "Offer",
              name: translate(PLANS.free.label, lang),
              price: 0,
              priceCurrency: "UZS",
              availability: "https://schema.org/InStock",
            },
          },
        ],
      }}
    />
  );
}

/**
 * Savol-javob. Faqat TSS bo'limi KO'RINADIGAN sahifalarda
 * chizilishi shart — aks holda Google buni yolg'on deb hisoblaydi.
 */
export function FaqJsonLd({ lang }: { lang: Lang }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: translate(item.q, lang),
          acceptedAnswer: { "@type": "Answer", text: translate(item.a, lang) },
        })),
      }}
    />
  );
}

/** Yo'l zanjiri: qidiruv natijasida «Moslik › Narx» bo'lib ko'rinadi */
export function BreadcrumbJsonLd({ locale, page }: { locale: Locale; page: PathKey }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: BRAND.name,
            item: `${SITE_URL}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            // `seo()` matnlari ALLAQACHON kerakli tilda (qo'lda
            // yozilgan) — ular `translate()` dan o'tkazilmaydi.
            name: seo(locale, page).title,
            item: `${SITE_URL}/${locale}${PATHS[page]}`,
          },
        ],
      }}
    />
  );
}
