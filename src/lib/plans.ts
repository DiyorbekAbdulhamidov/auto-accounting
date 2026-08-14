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

export function limitsOf(plan: unknown): PlanLimits {
  return PLANS[planOf(plan)];
}

/** Cheklovga yetgandami? Chaqiruvchi buni SERVERDA tekshiradi —
 *  faqat UI'da yashirish cheklov emas. */
export function companyLimitReached(plan: unknown, current: number): boolean {
  return current >= limitsOf(plan).companies;
}
