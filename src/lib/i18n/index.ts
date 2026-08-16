// ============================================================
// TIL QATLAMI
//
// Standart til — o'zbek KIRILL. Boshqa tillar undan hosil qilinadi:
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

// Standart — o'zbek LOTIN (2026-08-16 da qabul qilingan).
//
// Manba matn va t() kaliti kirill holicha QOLADI — o'zgargani faqat
// birinchi marta kirgan odam nimani ko'rishi. Sabab: davlat rasmiy
// alifbosi lotin va yosh foydalanuvchi lotinni bemalol, kirillni esa
// qiynalib o'qiydi; teskarisi kamroq to'sqinlik qiladi (kirill o'quvchi
// bir bosishda «ЎЗ» ga o'tadi va tanlov localStorage'da saqlanadi).
export const DEFAULT_LANG: Lang = 'uz-latn';

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
