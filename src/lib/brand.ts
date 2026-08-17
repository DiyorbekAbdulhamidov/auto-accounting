// ============================================================
// BREND — bitta manba
// ------------------------------------------------------------
// Nom hech qachon t() dan o'tkazilmaydi: brend tarjima qilinmaydi
// va transliteratsiya ham qilinmaydi. Sahifada `BRAND.name` yoziladi.
//
// NOM QAYERDAN CHIQDI (2026-08-16 da qabul qilingan)
// ------------------------------------------------------------
// Rasmiy ta'rif: «Korxona tovar-moddiy boyliklarini olish uchun
// yuborilgan pul mablag'larini hamda kelgan mahsulotlar hisob-
// varaqalarini tez aniqlash SOLISHTIRMASI».
//
// Ta'rifning o'zagi — «solishtirma». Solishtirmaning NATIJASI esa
// bitta so'z bilan aytiladi: mos keldi yoki mos kelmadi. Ilova ham
// aynan shu javobni beradi. Shuning uchun nom — natijaning o'zi:
//
//   solishtirma  ->  mos kelish  ->  MOSLIK
//
// Nega boshqasi emas:
//   · «Buxgaltersiz» — mahsulot buxgalter UCHUN, nom esa unga qarshi
//     va'da beradi. Buxgalterga «buxgaltersiz» degan dasturni sotib
//     bo'lmaydi.
//   · «Tezhisob / Aniqhisob» — «hisob» butun buxgalteriyani va'da
//     qiladi, mahsulot esa sverka qiladi. Ortiqcha va'da.
//   · «Tenglik» — qidiruvda ijtimoiy ma'no bilan aralashadi.
//
// «Moslik» ikkala yo'nalishga ham neytral (kirim ham, chiqim ham),
// sof o'zbekcha, 6 harf, tarjima talab qilmaydi.
// ============================================================

export const BRAND = {
  /** Sahifada ko'rinadigan nom. t() dan O'TKAZILMAYDI. */
  name: 'Moslik',
  domain: 'moslik.uz',

  /**
   * SHIOR (2026-08-16 da almashtirildi).
   *
   * Ilgari «Пул билан фактура мос келдими» edi — u faqat BUGUNGI
   * modulni tasvirlardi. Ombor qoldig'i yoki soliq xavfi qo'shilsa,
   * shior yolg'onga aylanardi. Endi u TOIFAni e'lon qiladi.
   *
   * Toifa shiori o'zi «nima qilishini» aytmaydi — shuning uchun
   * `promise` MAJBURIY juftlik: sarlavha ostida doim shu turadi.
   */
  tagline: 'Бухгалтер учун автоматик текширув тизими',

  /** Shiorning ostidagi qator — bugun aynan nima qilishini aytadi */
  promise:
    'Банк кўчирмаси билан фактура рўйхатини юкланг — тизим ҳар бир контрагент ' +
    'бўйича рақамларни солиштиради ва фарқ борларини ажратиб беради.',

  /**
   * Rasmiy ta'rif (Tashabbus arizasi va hujjatlar uchun).
   * Nom emas — ta'rif. Saytda footer'da to'liq holicha turadi.
   */
  definition:
    'Корхона товар-моддий бойликларини олиш учун юборилган пул маблағларини ' +
    'ҳамда келган маҳсулотлар ҳисоб-варақаларини тез аниқлаш солиштирмаси',

} as const;
