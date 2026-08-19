// ============================================================
// KONTRAGENT TOIFASI — kommunal/byudjet/bank to'lovlarini asosiy
// sverkadan ajratish.
//
// ASOSIY QOIDA (buzilmasin): avtomatika HECH QACHON kontragentni
// o'zi «korxona emas» deb belgilamaydi. Ikki xil xatoning narxi
// teng emas:
//   - oddiy firmani kommunal deb belgilash  -> pul jadvaldan
//     YO'QOLADI, ya'ni «jimgina xato» (biz aynan shundan qochamiz);
//   - kommunalni korxona bo'lib qoldirish   -> ro'yxatda ortiqcha
//     qator, ko'zga tashlanadi, zarari yo'q.
// Shuning uchun standart holat har doim 'korxona', nom bo'yicha
// topilgani esa faqat TAKLIF (`hint`) — u qatorni yashirmaydi.
//
// TOIFA STIR BO'YICHA ANIQLANADI, NOM BO'YICHA EMAS. Haqiqiy
// fayllardan olingan uchta dalil:
//   1) STIR 201577953 (suv) bankda TO'RT xil nom bilan yozilgan,
//      jumladan «ГУП СУВОКОВА» — uni nomdan topib bo'lmaydi;
//   2) 307626378 va 309841086 — IKKI xil yuridik shaxs, ikkalasining
//      ham nomi «Zero Waste»;
//   3) 311791997 «WATER DISTRIBUTION OLMALIQ» — nomida «WATER» bor,
//      lekin bu haqiqiy savdo kontragenti (buxgalter aynan unda
//      +3 248 farq topgan). Nom bo'yicha filtr uni o'chirgan bo'lardi.
// ============================================================

export type Category = 'korxona' | 'kommunal' | 'byudjet' | 'bank' | 'xizmat';

/** Toifa qayerdan kelgani — foydalanuvchiga ko'rsatiladi */
export type CategorySource =
  | 'standart'  // hech kim tegmagan, standart 'korxona'
  | 'seed'      // tizimning boshlang'ich ro'yxati (quyida)
  | 'user';     // foydalanuvchi qo'lda belgilagan (Firestore)

/** Boshqa korxonalar shu STIRni qanday belgilagani. FAQAT TAKLIF
 *  uchun: bir buxgalterning xatosi boshqa mijozning pulini yashириб
 *  қўймаслиги керак, шунинг учун бу ҳеч қачон тоифа бўлиб
 *  қўлланмайди — фақат «?» белгиси чиқаради. */
export interface GlobalHint {
  category: Category;
  /** Nechta MUSTAQIL korxona shunday belgilagani */
  companyCount: number;
}

export interface CategoryInfo {
  category: Category;
  source: CategorySource;
  /** Kim ekani (UI'da qator yonida ko'rsatiladi) */
  label?: string;
  /** Nom bo'yicha TAXMIN. Qatorni yashirmaydi — faqat «Коммунал?»
   *  belgisi chiqadi va foydalanuvchi bir klik bilan tasdiqlaydi. */
  hint?: Category;
  hintLabel?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  korxona: 'Корхона',
  kommunal: 'Коммунал',
  byudjet: 'Бюджет',
  bank: 'Банк',
  xizmat: 'Хизмат',
};

// ------------------------------------------------------------
// Boshlang'ich ro'yxat — haqiqiy bank fayllaridan olingan STIRlar
// ------------------------------------------------------------

interface SeedEntry {
  category: Exclude<Category, 'korxona'>;
  label: string;
}

/** Korxona ichidagi toifa qarorlari: `companies/{id}/counterparty_categories`.
 *  Nomi SHU YERDA — uni ikkita route ishlatadi (yozadi va korxona
 *  o'chirilganda tozalaydi), ikki joyda alohida yozilsa bittasi
 *  o'zgarib, ikkinchisi jimgina boshqa kolleksiyaga qarab qolardi. */
export const CATEGORIES_COLLECTION = 'counterparty_categories';

/** Korxonalararo statistika (yuqori darajali kolleksiya): har STIR uchun
 *  qaysi korxona qanday toifa qo'yganini saqlaydi. */
export const CATEGORY_STATS_COLLECTION = 'counterparty_category_stats';

export const SEED_CATEGORIES: Record<string, SeedEntry> = {
  // --- Byudjet: fakturasi hech qachon kelmaydi ---
  '201122919': { category: 'byudjet', label: 'Молия вазирлиги ғазначилиги' },
  '200598707': { category: 'byudjet', label: 'Ангрен шаҳар ДСИ' },

  // --- Kommunal ---
  '201577953': { category: 'kommunal', label: 'Тошкент вилояти сув таъминоти' },
  '307865588': { category: 'kommunal', label: 'HUDUDGAZSERVICE — газ' },
  // HUDUDGAZTA'MINOT — HUDUDGAZSERVICE dan BOSHQA yuridik shaxs
  '306605769': { category: 'kommunal', label: "HUDUDGAZTA'MINOT — газ" },
  '200595932': { category: 'kommunal', label: 'Ангрен «Иссиқлик энергияси»' },
  '307626378': { category: 'kommunal', label: 'Zero-Waste — чиқинди' },
  '309841086': { category: 'kommunal', label: 'Zero Waste Ангрен — чиқинди' },

  // --- Xizmat ---
  '200596281': { category: 'xizmat', label: 'Ангрен ёнғин хавфсизлиги жамияти' },
  '201589463': { category: 'xizmat', label: 'Янги технологиялар илмий-ахборот маркази' },
  // Битта СТИР, банкда ва фактурада ИККИ ХИЛ ном билан:
  //   ўтказмада — «УзРес.МБ РИХ ДУК Тошкент вилоят бошкармаси»
  //   фактурада — «...ИИВ ... ҚЎРИҚЛАШ ХИЗМАТИ» ДАВЛАТ МУАССАСАСИ
  '200524244': { category: 'xizmat', label: 'ИИВ қўриқлаш хизмати' },
  '200833833': { category: 'xizmat', label: 'Ўзбекистон почтаси' },

  // --- Bank: kontragent emas, bankning o'z ushlab qolgani ---
  '200599239': { category: 'bank', label: 'Банк комиссияси' },

  // ATAYLAB QO'SHILMAGAN — kimligi tasdiqlanmagani uchun 'korxona'
  // bo'lib qoladi (shubha bo'lsa yashirmaymiz):
  //   307712152 «ЦОТУ ООО TSS Center»
};

// ------------------------------------------------------------
// HISOB RAQAMI bo'yicha aniqlash — ro'yxatsiz, butun mamlakat uchun
// ------------------------------------------------------------

/** Hisob raqamining boshlanishi bo'yicha toifa. Bu STIR ro'yxatidan
 *  ustun tomoni: hisobvaraqlar rejasi MILLIY, ya'ni Andijonda ham,
 *  Samarqandda ham bir xil — hududiy ro'yxat kerak emas.
 *
 *  Haqiqiy fayllarda tekshirilgan (7 ta ko'chirma):
 *    23402...  50 та о'тказма, 100% ғазначилик
 *    452xx...  22 та о'тказма, 100% банкнинг о'з даромад ҳисоби
 *
 *  ATAYLAB kiritilmagan: 226xx va 20208. Улар аралаш — 226xx ичида
 *  коммунал ҳам, солиқ ҳам, оддий корхонанинг ЎЗ ҳисоби ҳам бор
 *  (KARVON MEBILLARI 22613...), 20208 эса умуман оддий ҳисоб-китоб
 *  рақами. Уларни прeфикс бўйича ажратиш ХАТО бўларди.
 *
 *  Kommunal (suv/gaz/chiqindi) bu yo'l bilan TOPILMAYDI: ular MCHJ
 *  yoki AJ bo'lgani uchun oddiy 20208 hisobida o'tiradi, xuddi
 *  oddiy savdo firmasi kabi. Ular uchun STIR ro'yxati kerak. */
const ACCOUNT_PREFIX_RULES: Array<{ prefix: string; category: Category; label: string }> = [
  { prefix: '23402', category: 'byudjet', label: 'Ғазначилик ягона ҳисобварағи' },
  { prefix: '452', category: 'bank', label: 'Банкнинг ўз даромад ҳисоби' },
];

export function categoryByAccount(
  account: string
): { category: Category; label: string } | null {
  const digits = String(account || '').replace(/\D/g, '');
  if (digits.length < 5) return null;
  for (const rule of ACCOUNT_PREFIX_RULES) {
    if (digits.startsWith(rule.prefix)) return { category: rule.category, label: rule.label };
  }
  return null;
}

// ------------------------------------------------------------
// Nom bo'yicha TAXMIN (faqat taklif, hech narsani yashirmaydi)
// ------------------------------------------------------------

/** Qoidalar ATAYLAB tor: tashkilot turini bildiruvchi TO'LIQ
 *  iboraga bog'langan, «suv»/«gaz» kabi umumiy so'zga emas. Aks
 *  holda «WATER DISTRIBUTION» yoki «GAZ SAVDO» kabi oddiy savdo
 *  firmalari ham taklifga tushib, foydalanuvchini chalg'itardi. */
const HINT_RULES: Array<{ re: RegExp; category: Category; label: string }> = [
  { re: /ҲУДУДГАЗ|ХУДУДГАЗ|HUDUDGAZ|ГАЗТАЪМИНОТ|GAZTA['`’‘]?MINOT/i, category: 'kommunal', label: 'газ' },
  { re: /СУВОКОВА|SUVOQOVA|СУВ\s*ТАЪМИНОТ|SUV\s*TA['`’‘]?MINOT|ВОДОКАНАЛ/i, category: 'kommunal', label: 'сув' },
  // Ҳудудий электр тармоқлари — ҳар вилоятда ўз юридик шахси
  { re: /ЭЛЕКТР\s*ТАРМО[ҚК]|ELEKTR\s*TARMO(Q|G['`’‘]?)|ЭЛЕКТРСЕТ/i, category: 'kommunal', label: 'электр' },
  { re: /ИССИ[ҚК]ЛИК\s*ЭНЕРГИЯ|ISSIQLIK\s*ENERGIYA/i, category: 'kommunal', label: 'иссиқлик' },
  { re: /ZERO[\s-]?WASTE|МАХСУСТРАНС|MAXSUSTRANS/i, category: 'kommunal', label: 'чиқинди' },
  { re: /ГАЗНАЧИЛИГИ|G['`’‘]?AZNACHILIGI|КАЗНАЧЕЙСТВО|ЯГОНА\s*ГАЗНА/i, category: 'byudjet', label: 'ғазначилик' },
  { re: /КОМИССИОННЫЕ\s*ДОХОДЫ|БАНК\s*КОМИССИЯ/i, category: 'bank', label: 'банк комиссияси' },
  { re: /ЎЗБЕКИСТОН\s*ПОЧТА|УЗБЕКИСТОН\s*ПОЧТА|O['`’‘]?ZBEKISTON\s*POCHTA/i, category: 'xizmat', label: 'почта' },
  { re: /ҚЎРИҚЛАШ\s*ХИЗМАТИ|QO['`’‘]?RIQLASH\s*XIZMATI/i, category: 'xizmat', label: 'қўриқлаш' },
  { re: /ПРОТИВОПОЖАРН|ЁНҒИН\s*ХАВФСИЗЛИГИ/i, category: 'xizmat', label: 'ёнғин хавфсизлиги' },
];

/** Boshqa korxonalarning qarori taklif bo'lishi uchun kamida shuncha
 *  MUSTAQIL korxona bir xil belgilagan bo'lishi kerak. Bitta
 *  buxgalterning xatosi hammaga tarqalmasligi uchun 1 emas, 2. */
export const MIN_COMPANIES_FOR_HINT = 2;

function guess(name: string): { category: Category; label: string } | null {
  if (!name) return null;
  for (const rule of HINT_RULES) {
    if (rule.re.test(name)) return { category: rule.category, label: rule.label };
  }
  return null;
}

// ------------------------------------------------------------

/** Firestore hujjat identifikatori sifatida ishlatish uchun xavfsiz
 *  kalit. Kontragent kaliti `NAME:...` shaklida bo'lishi va ichida
 *  Firestore ruxsat bermaydigan `/` belgisi bo'lishi mumkin. */
export function categoryDocId(key: string): string {
  return encodeURIComponent(key).replace(/\./g, '%2E');
}

/**
 * Kontragent toifasini aniqlash.
 *
 * Ustuvorlik: foydalanuvchi belgilagani > boshlang'ich ro'yxat >
 * standart 'korxona'. Nom bo'yicha taxmin hech qachon toifa
 * bo'lib qo'llanmaydi — u faqat `hint` sifatida qaytadi.
 *
 * @param inn       kontragent STIRi ('-' yoki '' bo'lishi mumkin)
 * @param key       AggEntry kaliti (STIRsizlar uchun `NAME:...`)
 * @param name      kontragent nomi (faqat taxmin uchun)
 * @param overrides foydalanuvchi belgilagan toifalar (STIR yoki key bo'yicha)
 * @param account   kontragentning hisob raqami (bo'lsa) — hududга
 *                  боғлиқ бўлмаган энг ишончли белги
 * @param globalHints boshqa korxonalarning qarori — FAQAT taklif
 */
export function resolveCategory(
  inn: string,
  key: string,
  name: string,
  overrides?: Record<string, Category>,
  account?: string,
  globalHints?: Record<string, GlobalHint>
): CategoryInfo {
  const cleanInn = inn && inn !== '-' ? inn : '';

  // 1) Foydalanuvchi qarori — eng ustun. Korxona darajasida
  //    saqlanadi: bir mijoz uchun kommunal bo'lgan tashkilot
  //    boshqasi uchun asosiy kontragent bo'lishi mumkin.
  const userPick = overrides && (overrides[cleanInn] || overrides[key]);
  if (userPick) {
    const seed = cleanInn ? SEED_CATEGORIES[cleanInn] : undefined;
    return { category: userPick, source: 'user', label: seed?.label };
  }

  // 2) Tizimning boshlang'ich ro'yxati — faqat STIR bo'yicha
  const seed = cleanInn ? SEED_CATEGORIES[cleanInn] : undefined;
  if (seed) {
    return { category: seed.category, source: 'seed', label: seed.label };
  }

  // 3) Hisob raqami — ro'yxatga kirmagan YANGI hududlar uchun ham
  //    ishlaydi (ғазначилик ва банк ҳисоблари бутун мамлакатда бир хил)
  const byAcc = account ? categoryByAccount(account) : null;
  if (byAcc) {
    return { category: byAcc.category, source: 'seed', label: byAcc.label };
  }

  // 4) Standart — korxona. NA nom taxmini, NA boshqa korxonalarning
  //    qarori buni o'zgartira olmaydi — ikkalasi ham faqat «?» beradi.
  const shared = cleanInn && globalHints ? globalHints[cleanInn] : undefined;
  if (shared && shared.companyCount >= MIN_COMPANIES_FOR_HINT) {
    return {
      category: 'korxona',
      source: 'standart',
      hint: shared.category,
      hintLabel: `${shared.companyCount} та корхона шундай белгилаган`,
    };
  }

  const g = guess(name);
  return {
    category: 'korxona',
    source: 'standart',
    hint: g?.category,
    hintLabel: g?.label ? `номи «${g.label}» ташкилотига ўхшайди` : undefined,
  };
}
