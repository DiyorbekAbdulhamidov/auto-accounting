// ============================================================
// REJALAR VA CHEKLOVLAR
//
// QAROR: cheklov SVERKA soniga emas, KORXONA soniga qo'yiladi.
//
// Nega sverka soni emas:
//   1) Buxgalter sverkani bir marta qilmaydi — yuklaydi, farq ko'radi,
//      faylni to'g'rilaydi, qayta yuklaydi. Sverka sanog'i aynan
//      ishonch tug'ilayotgan lahzada urib qo'yardi.
//   2) Uni to'g'ri sanash qimmat: hisoblagich hujjat, oylik nolga
//      qaytarish, parallel so'rovlar poygasi. Korxona sonini sanash —
//      bitta so'rov, poyga yo'q.
//   3) Buxgalterning DAROMADI mijozlar soniga bog'liq. To'lov ham
//      o'shanga bog'lansa, u o'sganda biz ham o'samiz va buni
//      tushuntirish shart emas.
//
// Sverka har doim CHEKSIZ.
// ============================================================

export type Plan = 'free' | 'buxgalter' | 'byuro';

export interface PlanLimits {
  /** Nechta korxona qo'shsa bo'ladi (Infinity — cheksiz) */
  companies: number;
  /** Ish maydonidagi foydalanuvchilar soni */
  members: number;
  /** Oyiga so'm. 0 — bepul */
  priceUzs: number;
  label: string;
}

// NARX: 9 999 so'm — tajribali buxgalterdan so'ralgan (2026-08-14).
// Bu bozordan kelgan dalil, taxmin emas, shuning uchun oldingi 149 000
// o'rniga shu qo'yildi.
//
// Pulli rejada korxona CHEKSIZ, pog'ona esa FOYDALANUVCHI soniga
// qo'yiladi. Sabab: «cheksiz korxona bitta narxga» pog'onani butunlay
// yo'q qilardi — 3 mijozli buxgalter ham, 300 mijozli byuro ham bir xil
// to'lardi va o'sish faqat yangi odamdan kelardi.
export const PLANS: Record<Plan, PlanLimits> = {
  // 3 ta ATAYLAB: bitta korxona bilan ko'p mijozli ekran ko'rinmaydi,
  // ya'ni mahsulotning asosiy qiymati his qilinmaydi. 3 ta bilan
  // buxgalter eng chalkash mijozlarini kiritadi va ODATLANADI.
  free: { companies: 3, members: 1, priceUzs: 0, label: 'Бепул' },
  buxgalter: { companies: Infinity, members: 1, priceUzs: 9_999, label: 'Бухгалтер' },
  byuro: { companies: Infinity, members: 5, priceUzs: 39_999, label: 'Бюро' },
};

export function planOf(value: unknown): Plan {
  return value === 'buxgalter' || value === 'byuro' ? value : 'free';
}

/* ============================================================
   BEPUL DAVR (2026-09-01 … 2026-11-01)
   ------------------------------------------------------------
   Qaror: ochilish davrida HAMMA cheksiz ishlatadi, faqat
   ro'yxatdan o'tish shart.
   
   Nega BITTA konstanta, reja maydoni emas: aks holda har
   foydalanuvchiga rejani qo'yish uchun admin paneli, keyin uni
   qaytarib olish uchun yana bir amal kerak bo'lardi. Davr global
   bo'lgani uchun sana bitta joyda turadi va tugagach O'ZI tugaydi.
   
   NEGA 2 OY, 1 emas: buxgalter sverkani OYDA BIR MARTA qiladi.
   Bir oylik davrda u tsiklni bir marta bajaradi — bu sinov, odat
   emas. O'lchov savoli esa «ikkinchi oyda ham qaytadimi». Agar
   ikkinchi oy pulli bo'lsa, «yordam bermagani uchun ketdi» bilan
   «pulli bo'lgani uchun ketdi» ni ajratib bo'lmaydi.
   
   DAVR TUGAGANDA MA'LUMOT YASHIRILMAYDI. Cheklov FAQAT yaratishda
   tekshiriladi (`/api/companies` POST), o'qishda hech qanday filtr
   yo'q. Ya'ni 12 korxona yuklagan buxgalter 1 noyabrdan keyin ham
   hammasini ko'radi — faqat 13-chisini qo'sha olmaydi.
   
   Vaqt mintaqasi ATAYLAB ko'rsatilgan: server UTC'da ishlaydi,
   Toshkent esa +05:00. Ko'rsatilmasa davr 5 soat oldin tugardi.
   ============================================================ */

export const PROMO_UNTIL = '2026-11-01T00:00:00+05:00';

/** Bepul davr hali davom etyaptimi. `now` sinov uchun beriladi. */
export function promoActive(now: Date = new Date()): boolean {
  return now.getTime() < Date.parse(PROMO_UNTIL);
}

/**
 * Amaldagi cheklovlar.
 *
 * MUHIM: bu funksiya faqat CHEKLOVNI QO'LLASH uchun. Narx sahifasi va
 * JSON-LD `PLANS` ni to'g'ridan-to'g'ri o'qiydi, shuning uchun bepul
 * davr e'lon qilingan narxlarni buzmaydi.
 */
export function limitsOf(plan: unknown, now: Date = new Date()): PlanLimits {
  const base = PLANS[planOf(plan)];
  if (!promoActive(now)) return base;
  // Reja NOMI o'zgarmaydi — xabarlarda «Бепул» ko'rinib turishi kerak,
  // aks holda foydalanuvchi qaysi rejada ekanini bilmaydi.
  return { ...base, companies: Infinity, members: Infinity };
}

/** Cheklovga yetgandami? Chaqiruvchi buni SERVERDA tekshiradi —
 *  faqat UI'da yashirish cheklov emas. */
export function companyLimitReached(plan: unknown, current: number): boolean {
  return current >= limitsOf(plan).companies;
}
