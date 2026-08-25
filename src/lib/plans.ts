// ============================================================
// REJALAR VA CHEKLOVLAR
//
// QAROR (2026-08-25, o'zgartirildi): cheklov KORXONA soniga emas,
// oylik SVERKA soniga qo'yiladi.
//
// NEGA KORXONA SONI TASHLANDI. Avvalgi qaror «bepul 3 ta korxona»
// edi va u ushlaydi deb faraz qilgandi. Ushlamas ekan — buni
// tajribali buxgalter aytdi va kod tasdiqladi:
//
//   «Korxona» — bu shunchaki nom va STIR yozilgan yozuv. Sverka esa
//   YUKLANGAN FAYLDAN ishlaydi. Ya'ni 10 mijozli buxgalter bitta
//   «Mijozlar» degan korxona ochib, o'n mijozning ko'chirmasini
//   navbatma-navbat o'sha yerda tekshiraveradi va mahsulotning
//   butun qiymatini bepul oladi. U faqat mijoz bo'yicha tarixni
//   yo'qotadi — buning uchun hech kim oyiga pul to'lamaydi.
//
// NEGA «SAQLANGAN HISOBOT» ham emas. Natijani saqlamasdan «Excel
// yuklash» bilan olib ketish mumkin. Ya'ni saqlash ham qiymat
// yetkazilgan lahza EMAS.
//
// QIYMAT TAHLIL LAHZASIDA yetkaziladi va u ikkala tomonda ham
// SERVERDA bajariladi (`/api/upload-preview`, `/api/income-audit`).
// Brauzer natijani o'zi hisoblay olmaydi — demak sanoq shu yerda
// aylanib o'tib bo'lmaydigan bo'ladi.
//
// SANOQ BIRLIGI — `sverkaQuota.ts` da: ko'chirma EGASI (STIR yoki
// hisob raqami) × DAVR OYI. Shundan ikki natija chiqadi:
//   · qayta yuklash BEPUL — buxgalter farqni ko'radi, mijozdan
//     fakturani so'raydi, to'g'rilangan ro'yxatni qayta yuklaydi.
//     Ko'chirma o'sha, davr o'sha, kalit o'sha — sanoq o'zgarmaydi.
//     Ya'ni eski qarordagi «sverka sanog'i ishonch tug'ilayotgan
//     lahzada urib qo'yadi» degan e'tiroz bartaraf bo'ladi;
//   · hammasini bitta korxonaga yig'ish YORDAM BERMAYDI, chunki
//     kalit korxona yozuvidan emas, ko'chirmadan olinadi.
//
// Korxona soni endi CHEKLANMAYDI — hamma rejada cheksiz.
// ============================================================

export type Plan = 'free' | 'buxgalter' | 'byuro';

export interface PlanLimits {
  /** Oyiga nechta sverka (Infinity — cheksiz) */
  sverkaPerMonth: number;
  /** Ish maydonidagi foydalanuvchilar soni */
  members: number;
  /** Oyiga so'm. 0 — bepul */
  priceUzs: number;
  label: string;
}

// NARX: 9 999 so'm — tajribali buxgalterdan so'ralgan (2026-08-14).
// Bu bozordan kelgan dalil, taxmin emas.
//
// Pulli rejada sverka CHEKSIZ, pog'ona esa FOYDALANUVCHI soniga
// qo'yiladi: 3 mijozli buxgalter ham, 300 mijozli byuro ham bir xil
// to'lamasligi kerak, lekin o'sishni odam soni bilan o'lchash
// tushuntirishga oson.
export const PLANS: Record<Plan, PlanLimits> = {
  // ⚠️ CHEKLOV YOQILADIGAN YAGONA JOY — quyidagi ikkita son.
  //    Pulli qilish payti kelganda `free` ga eski qiymatlar
  //    qaytariladi: `sverkaPerMonth: 3, members: 1`. Boshqa hech
  //    qayerga tegish SHART EMAS — sanoq mexanizmi (`sverkaQuota.ts`),
  //    devor ekrani (`QuotaWall.tsx`) va a'zo cheklovi
  //    (`api/workspace/members`) joyida, sinovlari bilan turibdi va
  //    o'sha zahoti ishlay boshlaydi.
  free: { sverkaPerMonth: Infinity, members: Infinity, priceUzs: 0, label: 'Бепул' },

  // Bu ikkalasi HOZIR HECH KIMGA berilmaydi va saytda ko'rsatilmaydi.
  // Ular kelajakdagi qiymat uchun saqlanadi: `api/admin/plan` shu
  // ro'yxatdan o'qiydi, ya'ni narx qaytarilganda tayyor turadi.
  buxgalter: { sverkaPerMonth: Infinity, members: 1, priceUzs: 9_999, label: 'Бухгалтер' },
  byuro: { sverkaPerMonth: Infinity, members: 5, priceUzs: 39_999, label: 'Бюро' },
};

export function planOf(value: unknown): Plan {
  return value === 'buxgalter' || value === 'byuro' ? value : 'free';
}

/* ============================================================
   HAMMASI BEPUL — QAROR 2026-08-25 (EGASI)
   ------------------------------------------------------------
   Cheklov UMUMAN qo'yilmaydi: sverka ham, foydalanuvchi ham,
   korxona ham cheksiz. Sayt narx haqida HECH NARSA demaydi.

   Sabab egasining o'z so'zi bilan: odamlar o'rganmaguncha va
   auditoriya katta bo'lmaguncha pul so'ralmaydi; qachon pulli
   qilish — egasining qarori. «Qolgan qoladi, qolmagan ketadi.»

   NEGA VAQT CHEGARASI (masalan «ro'yxatdan 6 oy») KODGA
   YOZILMADI. Sanoq qo'yilsa, u bir kuni O'ZI ISHLAB KETADI va
   hech kim buni kutmagan paytda hisoblar qulflanadi — pulli
   qilish qarori esa egasida, kodda emas. Shuning uchun cheklov
   YO'Q, uni yoqish esa yuqoridagi ikkita sonni o'zgartirish.

   Eski «2026-09-01 … 2026-11-01» global davri ham shu sababdan
   olib tashlangan edi (2026-08-19).
   ============================================================ */

/* ============================================================
   NEGA VAQTINCHALIK «CHEKSIZ» DAVR YO'Q
   ------------------------------------------------------------
   Ilgari bu yerda 2026-09-01 … 2026-11-01 oralig'ida hamma
   cheklovni CHEKSIZ qiladigan global davr turardi. U olib
   tashlangan edi (qaror: 2026-08-19), chunki korxona cheklovi
   FAQAT yaratishda tekshirilardi: ochiq oynada 30 ta korxona
   yig'ib olgan odam davr tugagach ham hammasini saqlab qolardi.

   Oylik sverka sanog'ida bu muammo YO'Q: sanoq har oy o'zi
   yangilanadi va o'tgan oyda nima qilingani keyingi oyga
   ta'sir qilmaydi. Ya'ni ochilish davrini xohlagan payt
   qo'shsa ham bo'ladi — u mangu bepul hisob yasamaydi.
   ============================================================ */

/**
 * Amaldagi cheklovlar.
 *
 * Narx sahifasi va JSON-LD `PLANS` ni to'g'ridan-to'g'ri o'qiydi.
 * Bu funksiya esa cheklovni QO'LLASH uchun — ikkalasi bir manbadan
 * kelishi uchun shu yerda turadi.
 */
export function limitsOf(plan: unknown): PlanLimits {
  return PLANS[planOf(plan)];
}
