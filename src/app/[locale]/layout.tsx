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
import { Toaster } from "@/components/ui";
import { Golos_Text, IBM_Plex_Mono, Literata } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Analytics } from "@vercel/analytics/next"

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

// ШРИФТ — ИККИТА оила, иккови ҳам тўртала тилни ўқийди.
//
// НЕГА Inter ЭМАС. Inter — 2020-йиллардаги ҳар иккинчи веб-хизмат
// шрифти. У ёмон эмас, лекин ҲЕЧ НАРСА демайди: сайт «андоза»
// бўлиб кўринишининг биринчи сабаби шу. Ўлчаб бўлмайдиган нарса
// эмас — одам сайтга кирган заҳоти танийди.
//
// GOLOS TEXT — интерфейс ва жадвал матни. Кирилл учун АТАЙЛАБ
// чизилган (Paratype), яъни ўзбек кирилли ва русча матн лотин
// билан бир хил оғирликда туради. Рақамлари тор ва бир хил
// кенгликда — ҳисоб-китоб устуни учун айнан шу керак.
//
// LITERATA — фақат КАТТА сарлавҳалар учун. Бу серифли, «ҳужжат»
// шрифти: бухгалтерга таниш бўлган расмий қоғоз оҳангини беради
// ва саҳифани дарҳол оддий SaaS қолипидан чиқаради. Матн ичида
// ИШЛАТИЛМАЙДИ — фақат `.text-display` ва `.text-title`.
//
// `cyrillic` кичик тўплами МАЖБУРИЙ: усиз ўзбек кирилл ва рус
// матни браузернинг захира шрифтига тушарди.
// `display: "swap"` — шрифт келгунча матн КЎРИНИБ туради.
const golos = Golos_Text({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-golos",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-literata",
  display: "swap",
});

// IBM PLEX MONO — фақат РАҚАМЛАР учун (`.tabular`).
//
// НЕГА. Бухгалтер экранда биринчи навбатда СОННИ ўқийди, ва уни
// ёнидаги сон билан солиштиради. Пропорционал шрифтда «1» билан
// «8» ҳар хил кенглик эгаллайди, яъни устундаги рақамлар кўз учун
// текис турмайди — `tabular-nums` буни фақат ҚИСМАН тузатади.
// Моношрифтда эса ҳар белги бир хил кенглик: устун ҳақиқий
// ҳисоб варағига айланади ва хато рақам дарҳол кўзга ташланади.
//
// Плекснинг кирилли бор — СТИР ва ҳужжат рақами ҳам шу оилада.
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-plex-mono",
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
      <body className={`${golos.variable} ${literata.variable} ${plexMono.variable}`}>
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
            __html: `try{var e=document.documentElement,s=localStorage.getItem('theme'),p=(s==='dark'||s==='light')?s:'system';e.setAttribute('data-theme-pref',p);if(p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme:dark)').matches))e.classList.add('dark')}catch(x){}`,
          }}
        />
        {/* Barcha sahifalar auth holatidan xabardor bo'lishi uchun provider ichiga olamiz */}
        <AuthProvider>
          {/* Til endi localStorage'dan EMAS, manzildan keladi — shuning
              uchun server va klient bir xil HTML chiqaradi. */}
          <LanguageProvider lang={lang} locale={locale}>
            <Analytics />
            {children}
            {/* Xabarlar (`alert()` o'rniga) — ildizda BIR MARTA */}
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
