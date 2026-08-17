// ============================================================
// TIL QATLAMI
//
// Tarjima kaliti — KIRILL o'zbekcha matnning O'ZI. Boshqa tillar
// undan hosil qilinadi:
//   uz-latn : translit.ts orqali AVTOMATIK (lug'at kerak emas)
//   ru / en : dictionary.ts orqali
//
// Tarjima topilmasa matn kirill holicha qaytadi — ya'ni yangi matn
// qo'shilganda ilova buzilmaydi, faqat o'sha joy tarjimasiz qoladi.
// ============================================================

import { DICTIONARY } from './dictionary';
import { toLatin } from './translit';

export const LANGS = ['uz-cyrl', 'uz-latn', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];

// ============================================================
// MANZILDAGI TIL (2026-08-16)
// ------------------------------------------------------------
// Til endi localStorage'da emas, URL'ning BIRINCHI bo'lagida:
//   /uz/pricing · /uz-cyrl/pricing · /ru/pricing · /en/pricing
//
// Nega: localStorage'dagi til Google uchun umuman ko'rinmaydi —
// qidiruv tizimi faqat bitta (standart) variantni indekslaydi va
// ruscha qidirgan buxgalter hech qachon topmaydi. Manzilda bo'lsa
// har til alohida sahifa bo'ladi va hreflang bilan bog'lanadi.
// ============================================================

/** URL bo'lagi. `uz` — lotin yozuvi (davlat rasmiy alifbosi). */
export const LOCALES = ['uz', 'uz-cyrl', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'uz';

/** Marshrut bo'lagi -> ichki til kodi */
export const LOCALE_TO_LANG: Record<Locale, Lang> = {
  uz: 'uz-latn',
  'uz-cyrl': 'uz-cyrl',
  ru: 'ru',
  en: 'en',
};

/** Ichki til kodi -> marshrut bo'lagi */
export const LANG_TO_LOCALE: Record<Lang, Locale> = {
  'uz-latn': 'uz',
  'uz-cyrl': 'uz-cyrl',
  ru: 'ru',
  en: 'en',
};

/**
 * `<html lang>` va `hreflang` uchun BCP-47 belgisi.
 *
 * O'zbek tili uchun yozuv ALOHIDA ko'rsatiladi (`uz-Latn` / `uz-Cyrl`) —
 * aks holda ikkala sahifa ham «uz» bo'lib qoladi va Google ularni
 * bir-birining dublikati deb hisoblaydi.
 */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  uz: 'uz-Latn',
  'uz-cyrl': 'uz-Cyrl',
  ru: 'ru',
  en: 'en',
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/** Noma'lum bo'lsa standart tilga tushadi */
export function localeToLang(v: unknown): Lang {
  return isLocale(v) ? LOCALE_TO_LANG[v] : LOCALE_TO_LANG[DEFAULT_LOCALE];
}

export const LANG_LABELS: Record<Lang, string> = {
  'uz-cyrl': 'Ўзбекча',
  'uz-latn': "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

/** Tanlash ro'yxatida ko'rinadigan qisqa belgi */
export const LANG_SHORT: Record<Lang, string> = {
  'uz-cyrl': 'ЎЗ',
  'uz-latn': 'UZ',
  ru: 'РУ',
  en: 'EN',
};

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as readonly string[]).includes(v);
}

/**
 * Matnni tanlangan tilga o'girish.
 *
 * @param text kirill o'zbekcha manba matn (kalit ham shu)
 */
export function translate(text: string, lang: Lang): string {
  if (!text) return text;
  if (lang === 'uz-cyrl') return text;

  const entry = DICTIONARY[text];

  if (lang === 'uz-latn') {
    // Lug'atda maxsus variant bo'lsa - o'sha, aks holda avtomatik
    // transliteratsiya. Shu sababli lotin yozuvi HAMMA matnni
    // qamrab oladi, hatto serverdan kelgan огоҳлантиришларни ҳам.
    return entry?.latn ?? toLatin(text);
  }

  if (lang === 'ru') {
    // Tarjima yo'q bo'lsa kirill holicha qoldiramiz: rus tilida
    // o'qiydigan odam kirill yozuvini baribir o'qiy oladi.
    return entry?.ru ?? text;
  }

  // Ingliz tili: tarjima yo'q bo'lsa hech bo'lmasa lotin yozuvida
  // ko'rsatamiz - kirill ingliz o'quvchisi uchun umuman o'qilmaydi.
  return entry?.en ?? toLatin(text);
}

export { toLatin } from './translit';
