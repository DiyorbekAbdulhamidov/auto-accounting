// ============================================================
// PROXY — manzilda til bo'lagi bo'lishini ta'minlaydi
// ------------------------------------------------------------
// Next 16 da bu fayl `middleware.ts` EMAS, `proxy.ts` deb ataladi
// (eski nom eskirgan deb belgilangan).
//
// Vazifasi bitta: til bo'lagisiz kelgan so'rovni to'g'ri tilga
// yo'naltirish. `/pricing` -> `/uz/pricing`, `/` -> `/ru` (agar
// brauzer rus tilini so'rasa).
//
// Til qanday tanlanadi (tartib bilan):
//   1. `NEXT_LOCALE` cookie — odam saytda tilni O'ZI tanlagan
//   2. `Accept-Language` sarlavhasi — brauzer tili
//   3. standart: `uz`
//
// Eski o'zbekcha manzillar (`/korxonalar`, `/qollanma`) ham shu
// yerda tarjima qilinadi — ular `next.config.ts` da emas, chunki
// natija TILGA bog'liq va konfiguratsiya buni bilmaydi.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n';

const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Eski manzil -> yangi (tilsiz) yo'l.
 *
 * Xatcho'p qilingan yoki ochiq qolgan yorliqdan kelishi mumkin,
 * shuning uchun 404 emas — yo'naltirish.
 */
const LEGACY: Record<string, string> = {
  '/korxonalar': '/clients',
  '/qollanma': '/guide',
  '/excel-audit': '/clients',
  '/income-audit': '/clients',
  '/astatka': '/',
};

function pickLocale(req: NextRequest): Locale {
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale;

  const header = req.headers.get('accept-language') ?? '';
  // «ru-RU,ru;q=0.9,en;q=0.8» -> ['ru-ru', 'ru', 'en']
  const wanted = header
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean);

  for (const tag of wanted) {
    if (tag.startsWith('ru')) return 'ru';
    if (tag.startsWith('en')) return 'en';
    // «uz-cyrl» yoki «uz-Cyrl-UZ» — yozuvi ko'rsatilgan bo'lsa hurmat qilamiz
    if (tag.startsWith('uz')) return tag.includes('cyrl') ? 'uz-cyrl' : 'uz';
  }
  return DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const locale = pickLocale(req);

  // Eski manzil bo'lsa yangisiga o'giramiz. `/excel-audit/companies/ID`
  // kabi ichki yo'l ham ushlanadi.
  let target = pathname;
  const legacyKey = Object.keys(LEGACY).find(
    (k) => pathname === k || pathname.startsWith(`${k}/`)
  );
  if (legacyKey) {
    const tail = pathname.slice(legacyKey.length);
    // `/excel-audit/companies/ID` -> `/clients/ID`
    target = LEGACY[legacyKey] + tail.replace(/^\/companies/, '');
    if (target.endsWith('/')) target = target.slice(0, -1);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${target === '/' ? '' : target}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // `_next`, `api`, va nuqtali fayllar (favicon.ico, sitemap.xml,
  // robots.txt, icon.svg) tegilmaydi — aks holda ular ham
  // yo'naltirilib, umuman yuklanmasdi.
  //
  // `opengraph-image` ALOHIDA yozilgan: u Next'ning metama'lumot
  // fayli, lekin manzilida NUQTA yo'q — ya'ni yuqoridagi qoidaga
  // tushmasdi va til bilan yo'naltirilib 307 qaytarardi. Natijada
  // Telegram havolani rasmsiz ko'rsatardi.
  matcher: ['/((?!_next|api|opengraph-image|twitter-image|.*\\.).*)'],
};
