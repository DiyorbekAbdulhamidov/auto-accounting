// ============================================================
// TELEFON RAQAMI — E.164 SHAKLI
// ------------------------------------------------------------
// Firebase `signInWithPhoneNumber` faqat E.164 ni qabul qiladi:
// `+998901234567`. Boshqa har qanday shakl `invalid-phone-number`
// beradi va SMS umuman ketmaydi.
//
// Buxgalter esa raqamni istalgan ko'rinishda yozadi:
//   90 123 45 67 · (90) 123-45-67 · 998901234567 · +998 90 123 45 67
//
// Shu sabab kiritilgani TOZALANADI, tekshiriladi va bitta shaklga
// keltiriladi. Funksiya sof — harness'da tekshiriladi.
//
// Hisob KALITI ham shu qiymat bo'ladi (`workspace.ts` dagi
// `accountKeyOf`), ya'ni bir xil odam bir xil raqam bilan HAR DOIM
// bitta ish maydoniga tushishi kerak. «+998901234567» va
// «998901234567» ikki xil hisob bo'lib qolsa, odam o'z
// ma'lumotini topolmaydi.
// ============================================================

/** O'zbekiston kodi. Boshqa davlat hozircha qo'llanmaydi —
 *  mijozlar bozori O'zbekistonda. */
export const UZ_CODE = '998';

/** Milliy raqam uzunligi (kodsiz): `901234567` */
const NATIONAL_LEN = 9;

/**
 * Kiritilgan matnni E.164 ga o'giradi. Noto'g'ri bo'lsa `null`.
 *
 * Qabul qiladi:
 *   901234567        → +998901234567
 *   90 123 45 67     → +998901234567
 *   998901234567     → +998901234567
 *   +998 90 123-45-67 → +998901234567
 *
 * Rad etadi: qisqa, uzun yoki boshqa davlat kodi bilan yozilganni.
 * Ataylab qat'iy: taxmin qilib SMS yuborish begona raqamga kod
 * jo'natish demakdir.
 */
export function toE164(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === NATIONAL_LEN) return `+${UZ_CODE}${digits}`;
  if (
    digits.length === UZ_CODE.length + NATIONAL_LEN &&
    digits.startsWith(UZ_CODE)
  ) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Ekranda ko'rsatish uchun: `+998 90 123 45 67`.
 *
 * E.164 emas — u faqat Firebase uchun. Odam o'z raqamini bo'shliqsiz
 * uzun qatorda qiyin o'qiydi va «bu meningmi?» deb ikkilanadi.
 */
export function formatPhone(e164: string): string {
  const d = (e164 || '').replace(/\D/g, '');
  if (d.length !== UZ_CODE.length + NATIONAL_LEN) return e164;
  const n = d.slice(UZ_CODE.length);
  return `+${UZ_CODE} ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}
