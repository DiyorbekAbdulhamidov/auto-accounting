// ============================================================
// MARSHRUTLAR — bitta manba
// ------------------------------------------------------------
// Har manzil `/[locale]/...` ko'rinishida. Sahifada qo'lda
// `/uz/clients` YOZILMAYDI — `path.clients(locale)` chaqiriladi,
// aks holda til almashganda bitta havola eski tilda qolib ketardi.
//
// Nomlar INGLIZCHA va sahifaning VAZIFASIga qarab qo'yilgan:
//   /guide     — qo'llanma (o'quv materiali)
//   /pricing   — narx
//   /features  — imkoniyatlar
//   /clients   — buxgalterning mijozlari (korxonalar)
// Ilgari `/excel-audit` (vositani nomlagan, ishni emas) va
// `/korxonalar` (o'zbekcha, qidiruvda ko'rinmaydi) edi.
// ============================================================

import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n';

/** Til bo'lagidan keyingi qism. Bosh sahifa uchun bo'sh. */
export const PATHS = {
  home: '',
  guide: '/guide',
  pricing: '/pricing',
  features: '/features',
  login: '/login',
  // Huquqiy sahifalar. To'lov tizimi (Click) moderatsiyasi saytda
  // AYNAN shularni qidiradi: ommaviy oferta, to'lovni qaytarish
  // tartibi va rekvizitlar bilan aloqa. Ular bo'lmasa ariza qaytadi.
  offer: '/offer',
  refund: '/refund',
  contact: '/contact',
  clients: '/clients',
  adminUsers: '/admin/users',
} as const;

export type PathKey = keyof typeof PATHS;

/** Qidiruv tizimiga ochiq (indekslanadigan) sahifalar */
export const PUBLIC_PATHS: PathKey[] = [
  'home',
  'guide',
  'pricing',
  'features',
  'login',
  'offer',
  'refund',
  'contact',
];

/** `/uz/pricing` kabi to'liq manzil */
export function path(key: PathKey, locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}${PATHS[key]}`;
}

/** Bitta mijoz sahifasi: `/uz/clients/abc123` */
export function clientPath(id: string, locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}${PATHS.clients}/${id}`;
}

/**
 * Joriy manzilni BOSHQA tilga o'girish.
 *
 * Til almashganda odam turgan sahifasida qolishi kerak — bosh
 * sahifaga uloqtirilmasligi. Shuning uchun faqat birinchi bo'lak
 * almashtiriladi.
 */
export function switchLocale(pathname: string, next: Locale): string {
  const rest = pathname.replace(/^\/[^/]+/, '');
  return `/${next}${rest}`;
}

/**
 * Manzilning birinchi bo'lagidan tilni oladi.
 *
 * `AuthContext` uchun kerak: u `LanguageProvider` dan YUQORIDA turadi
 * (chunki til holati auth'ga bog'liq emas), shuning uchun `useLocale()`
 * ni chaqira olmaydi. Manzil esa har doim mavjud.
 */
export function localeFromPathname(pathname: string | null): Locale {
  const first = (pathname ?? '').split('/')[1];
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

/** `/uz/login`, `/ru/login` — barchasi uchun `true` */
export function isPath(pathname: string | null, key: PathKey): boolean {
  const rest = (pathname ?? '').replace(/^\/[^/]+/, '');
  return rest === PATHS[key] || (PATHS[key] === '' && rest === '');
}
