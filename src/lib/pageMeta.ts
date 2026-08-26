// ============================================================
// SAHIFA META MA'LUMOTI — hreflang bilan birga
// ------------------------------------------------------------
// Har sahifa to'rt tilda mavjud. Google ular BIR XIL mazmunning
// tarjimalari ekanini o'zi topa olmaydi — aytish kerak:
//
//   <link rel="alternate" hreflang="uz-Latn" href=".../uz/pricing">
//   <link rel="alternate" hreflang="uz-Cyrl" href=".../uz-cyrl/pricing">
//   <link rel="alternate" hreflang="ru"      href=".../ru/pricing">
//   <link rel="alternate" hreflang="en"      href=".../en/pricing">
//   <link rel="alternate" hreflang="x-default" href=".../uz/pricing">
//   <link rel="canonical" href=".../ru/pricing">      <- O'ZIGA
//
// Bu ayniqsa `uz` va `uz-cyrl` uchun MUHIM: matn bir xil, faqat
// yozuv boshqa. Yozuv `hreflang` da ko'rsatilmasa (`uz-Latn` /
// `uz-Cyrl` o'rniga shunchaki `uz`) Google ikkalasini dublikat deb
// hisoblaydi va bittasini tashlab yuboradi.
// ============================================================

import type { Metadata } from 'next';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_HREFLANG,
  type Locale,
} from './i18n';
import { PATHS, type PathKey } from './routes';
import { SITE_URL, seo } from './seo';
import { BRAND } from './brand';

/**
 * HAVOLA RASMI — `src/app/opengraph-image.tsx` chizadi.
 *
 * ATAYLAB shu yerda OSHKORA yoziladi. Next metama'lumot faylini
 * ildizdan o'zi qo'shadi deb kutish mumkin edi, lekin sahifalar
 * `[locale]` ichida va `generateMetadata` o'z `openGraph` obyektini
 * qaytaradi — natijada `og:image` tegi UMUMAN chiqmasdi.
 * Jonli qurilmada tekshirildi: 2026-08-21.
 */
const OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: BRAND.name,
};

function url(locale: Locale, key: PathKey): string {
  return `${SITE_URL}/${locale}${PATHS[key]}`;
}

/** Barcha tillarning shu sahifadagi manzillari */
function languages(key: PathKey): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[LOCALE_HREFLANG[l]] = url(l, key);
  // Tili mos kelmagan yoki noma'lum foydalanuvchi uchun
  out['x-default'] = url(DEFAULT_LOCALE, key);
  return out;
}

export function pageMeta(locale: Locale, key: PathKey): Metadata {
  const copy = seo(locale, key);
  const canonical = url(locale, key);
  const isPublic = key !== 'clients' && key !== 'adminUsers';

  return {
    // Brend nomi SARLAVHADA bo'lishi SHART: Google brend so'roviga
    // (`moslik`) aynan `<title>` ga qaraydi. Ilgari «Moslik» faqat
    // `og:title` va JSON-LD ichida bor edi — ular reytingga ta'sir
    // qilmaydi, ya'ni sayt o'z nomi bilan topilmasdi.
    title: `${copy.title} · ${BRAND.name}`,
    description: copy.description,
    keywords: copy.keywords.length ? copy.keywords : undefined,
    alternates: { canonical, languages: languages(key) },
    openGraph: {
      type: 'website',
      siteName: BRAND.name,
      locale: LOCALE_HREFLANG[locale],
      url: canonical,
      title: `${copy.title} · ${BRAND.name}`,
      description: copy.description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${copy.title} · ${BRAND.name}`,
      description: copy.description,
      images: [OG_IMAGE.url],
    },
    // Kirish ortidagi sahifalar indekslanmaydi: ular mijoz ma'lumoti
    // va qidiruvda hech qanday qiymati yo'q.
    robots: isPublic
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}
