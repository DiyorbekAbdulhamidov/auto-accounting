// ============================================================
// ILDIZ LAYOUT — `[locale]` ICHIDA
// ------------------------------------------------------------
// `app/layout.tsx` ATAYLAB yo'q. Til manzilning birinchi bo'lagida
// bo'lgani uchun `<html lang>` ni faqat shu yerda to'g'ri qo'yish
// mumkin — yuqoriroqda til hali ma'lum emas.
//
// Manzilga tushmagan so'rovni (`/`, `/pricing`) `src/proxy.ts`
// to'g'ri tilga yo'naltiradi.
// ============================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import {
  LOCALES,
  LOCALE_HREFLANG,
  isLocale,
  localeToLang,
  type Locale,
} from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/seo";
import "@/app/globals.css";

// ШРИФТ — тўртала тил учун БИТТА оила.
// `cyrillic` кичик тўплами МАЖБУРИЙ: усиз ўзбек кирилл ва рус
// матни браузернинг захира шрифтига тушарди, яъни битта саҳифада
// икки хил ҳарф шакли кўринарди.
// `variable` — оғирлик CSS'дан олинади (400/500/600/700 учун
// алоҳида файл юкланмайди).
// `display: "swap"` — шрифт келгунча матн КЎРИНИБ туради.
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  display: "swap",
});

/** To'rt til ham statik quriladi */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "uz";
  return {
    // `metadataBase` shu yerda BIR MARTA — usiz nisbiy manzilli
    // meta maydonlari qurishda xato beradi.
    metadataBase: new URL(SITE_URL),
    title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
    applicationName: BRAND.name,
    // Tarjimalar bir xil mahsulot ekanini bildiradi
    other: { "og:locale:alternate": LOCALES.filter((x) => x !== l).map((x) => LOCALE_HREFLANG[x]) },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Noma'lum til bo'lagi — 404. Aks holda `/xyz/pricing` sahifani
  // standart tilda ochib, dublikat manzil yaratardi.
  if (!isLocale(locale)) notFound();

  const lang = localeToLang(locale);

  return (
    <html lang={LOCALE_HREFLANG[locale]} suppressHydrationWarning>
      {/* Шрифт синфи `<html>` да ЭМАС, `<body>` да: тема скрипти
          `<html>` га `dark` синфини гидратациядан ОЛДИН қўшади,
          иккита манба битта атрибутга ёзса React уни серверники
          билан алмаштириб, тунги режимни ўчириб юбориши мумкин. */}
      <body className={inter.variable}>
        {/* Rang rejimi React ishga tushmasdan OLDIN qo'llanadi — aks
            holda sahifa bir lahza oq yonib, keyin qorayardi.

            Bu `<script>` ATAYLAB shu yerda, server komponentida turadi
            va faqat SHU HOLDA xatosiz gidratsiya bo'ladi. Ikki yo'l
            sinab ko'rildi va ikkalasi ham yiqildi:
              · klient komponentida — React `<script>` ni gidratsiya
                QILMAYDI, butun DOM ikkilanadi (o'lchangan);
              · `next/script` `beforeInteractive` bilan — u ham aynan
                shu `<script>` elementini chizadi, farqi yo'q.

            Til almashganda bu element klientda QAYTA yaratilmasligi
            kerak (React ogohlantiradi, brauzer esa uni bajarmaydi) —
            shuning uchun til almashinuvi to'liq sahifa yuklashi bilan
            qilinadi: `src/context/LanguageContext.tsx`. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('theme');if(s==='dark'||(!s&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        {/* Barcha sahifalar auth holatidan xabardor bo'lishi uchun provider ichiga olamiz */}
        <AuthProvider>
          {/* Til endi localStorage'dan EMAS, manzildan keladi — shuning
              uchun server va klient bir xil HTML chiqaradi. */}
          <LanguageProvider lang={lang} locale={locale}>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
