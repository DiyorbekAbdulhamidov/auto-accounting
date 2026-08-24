// ============================================================
// QO'LDA TO'LOV — Click ulangunicha
//
// Ochilishda (2026-09-01) to'lov tizimi hali ulanmagan. Reja
// shunday ochiladi: foydalanuvchi Telegram botga yozadi, to'lov
// rekvizitlarini o'sha yerda oladi, to'laydi va chekni tashlaydi,
// admin `/api/admin/plan` orqali rejani qo'yadi.
//
// NEGA ANIQ MUDDAT YOZILADI. «Avtomat ulanasiz» deb yozib
// bo'lmaydi — hech qanday avtomatika yo'q, odam qo'lda ochadi.
// Pul to'lagan odamga noto'g'ri va'da berish — mahsulotga
// bo'lgan ishonchni birinchi kunidayoq sindiradi. Shuning
// uchun matn kutish vaqtini AYTADI va yuqori chegara qo'yadi.
//
// KARTA RAQAMI KODDA SAQLANMAYDI (2026-08-23). Ilgari u shu yerda
// turar va ekranga chiqardi. Endi yo'q: to'lov rekvizitlari faqat
// botda, odamdan odamga beriladi. Sabab — klient to'plamidagi har
// qanday qiymat OCHIQ, uni avtomatik yig'ib olish mumkin. To'lov
// tizimi ulanganda bu yerga uning kaliti keladi, karta emas.
// ============================================================

export const MANUAL_PAYMENT = {
  /** So'rov ham, chek ham shu yerga tashlanadi */
  botUsername: '@webleaderscontactbot',
  botUrl: 'https://t.me/webleaderscontactbot',
} as const;
