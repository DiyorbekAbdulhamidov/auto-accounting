// ============================================================
// QO'LDA TO'LOV — Click ulangunicha
//
// Ochilishda (2026-09-01) to'lov tizimi hali ulanmagan. Reja
// shunday ochiladi: foydalanuvchi kartaga o'tkazadi, chekni
// Telegram botga tashlaydi, admin `/api/admin/plan` orqali
// rejani qo'yadi.
//
// NEGA ANIQ MUDDAT YOZILADI. «Avtomat ulanasiz» deb yozib
// bo'lmaydi — hech qanday avtomatika yo'q, odam qo'lda ochadi.
// Pul to'lagan odamga noto'g'ri va'da berish — mahsulotga
// bo'lgan ishonchni birinchi kunidayoq sindiradi. Shuning
// uchun matn kutish vaqtini AYTADI va yuqori chegara qo'yadi.
//
// KARTA RAQAMI OCHIQ SAHIFAGA QO'YILMAYDI — faqat tizim ichida,
// cheklovga yetgan foydalanuvchiga ko'rsatiladi. U baribir
// klient to'plamida bo'ladi (maxfiy emas), lekin ochiq sahifada
// tursa avtomatik yig'ib olinadi — va keyinroq Click moderatsiyasi
// ham aynan o'sha sahifaga qaraydi.
// ============================================================

export const MANUAL_PAYMENT = {
  /** Ekranda ko'rinadigan shakl */
  card: '9860 0101 2959 4213',
  cardHolder: 'DIYORBEK ABDULHAMIDOV',
  /** Nusxa olish uchun — bo'shliqsiz */
  cardPlain: '9860010129594213',
  /** Chek shu yerga tashlanadi */
  botUsername: '@webleaderscontactbot',
  botUrl: 'https://t.me/webleaderscontactbot',
} as const;
