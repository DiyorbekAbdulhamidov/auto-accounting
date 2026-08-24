// ============================================================
// SEO MATNLARI
// ------------------------------------------------------------
// Bu matnlar `t()` dan O'TMAYDI va transliteratsiya qilinmaydi —
// har til uchun QO'LDA yoziladi. Sabab: meta-sarlavha qidiruv
// so'roviga so'zma-so'z mos kelishi kerak, avtomatik o'girilgan
// matn esa hech qachon to'g'ri kalit so'zni bermaydi.
//
// Eng qimmatli til — RUS: O'zbekistondagi buxgalterlar kasbiy
// atamalarni («сверка», «акт сверки», «счёт-фактура») rus tilida
// qidiradi. Shuning uchun ruscha matn eng batafsil yozilgan.
// ============================================================

import type { Locale } from './i18n';
import type { PathKey } from './routes';

/** Ishlab chiqarish manzili. Vercel/hosting'da o'zgartirish uchun env. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://moslik.uz'
).replace(/\/$/, '');

export interface SeoCopy {
  title: string;
  description: string;
  keywords: string[];
}

const UZ: Record<PathKey, SeoCopy> = {
  home: {
    title: "Buxgalter uchun avtomatik tekshiruv tizimi",
    description:
      "Bank ko'chirmasi va faktura ro'yxatini yuklang — tizim har bir kontragent bo'yicha " +
      "raqamlarni tekshiradi va farq borlarini ajratib beradi. Akt sverki, qarzdorlik yoshi, " +
      "Excel hisobot. Bepul rejada 3 ta korxona.",
    keywords: [
      "buxgalteriya dasturi",
      "sverka",
      "akt sverki",
      "bank ko'chirmasi",
      "faktura solishtirish",
      "kontragent bilan sverka",
      "buxgalter uchun dastur",
      "qarzdorlik nazorati",
      "O'zbekiston buxgalteriya",
    ],
  },
  guide: {
    title: "Qo'llanma — tizim qanday ishlaydi",
    description:
      "Uch qadamda: fayllarni yuklang, tizim nimani o'qiganini ko'rsatadi, farqni ko'ring. " +
      "Qoldiq tenglamasi, bank formatlari, kontragent toifalari va Akt sverki haqida.",
    keywords: [
      "sverka qanday qilinadi",
      "akt sverki tayyorlash",
      "bank ko'chirmasini o'qish",
      "buxgalteriya qo'llanma",
    ],
  },
  pricing: {
    title: "Narx — bepul 3 ta korxona, sverka cheksiz",
    description:
      "Cheklov sverka soniga emas, korxona soniga. Bepul: 3 ta korxona. Buxgalter: 9 999 so'm/oy, " +
      "korxona cheksiz. Byuro: 39 999 so'm/oy, 5 foydalanuvchi.",
    keywords: [
      "buxgalteriya dasturi narxi",
      "sverka dasturi narx",
      "arzon buxgalteriya dasturi",
      "bepul buxgalteriya dasturi",
    ],
  },
  features: {
    title: "Imkoniyatlar — qoldiq tenglamasi, format xotirasi, qarz yoshi",
    description:
      "Qoldiq tenglamasi fayl to'g'riligini o'zi tekshiradi. Notanish bank shaklini tizim " +
      "o'rganib oladi. Kommunal va byudjet ajratiladi, JAMI to'liq qoladi. Akt sverki va " +
      "5 varaqli Excel hisobot.",
    keywords: [
      "qoldiq tenglamasi",
      "bank formatlari",
      "qarzdorlik yoshi",
      "akt sverki excel",
      "kontragent toifalari",
    ],
  },
  login: {
    title: "Kirish",
    description: "Hisobingizga kiring yoki bepul ro'yxatdan o'ting — 3 ta korxona, sverka cheksiz.",
    keywords: [],
  },
  offer: {
    title: "Ommaviy oferta",
    description:
      "Moslik veb-xizmatidan foydalanish shartnomasi: xizmat predmeti, narx va to'lov tartibi, " +
      "tomonlarning majburiyatlari, ma'lumot maxfiyligi va javobgarlik chegarasi.",
    keywords: ["ommaviy oferta", "foydalanish shartlari", "shartnoma"],
  },
  refund: {
    title: "To'lovni qaytarish",
    description:
      "Pul qaytariladigan holatlar, ariza berish tartibi va muddatlar. Obunani bekor qilish — " +
      "yuklangan korxonalar va hisobotlar yo'qolmaydi.",
    keywords: ["to'lovni qaytarish", "pulni qaytarish", "obunani bekor qilish"],
  },
  contact: {
    title: "Aloqa va rekvizitlar",
    description:
      "Moslik xizmati bilan bog'lanish: Telegram kanali, ish vaqti va xizmat rekvizitlari.",
    keywords: ["aloqa", "rekvizitlar", "qo'llab-quvvatlash"],
  },
  clients: { title: "Mijozlar", description: "", keywords: [] },
  adminUsers: { title: "Foydalanuvchilar", description: "", keywords: [] },
};

const UZ_CYRL: Record<PathKey, SeoCopy> = {
  home: {
    title: "Буxгалтер учун автоматик текширув тизими",
    description:
      "Банк кўчирмаси ва фактура рўйхатини юкланг — тизим ҳар бир контрагент бўйича " +
      "рақамларни текширади ва фарқ борларини ажратиб беради. Акт сверки, қарздорлик ёши, " +
      "Excel ҳисобот. Бепул режада 3 та корхона.",
    keywords: [
      "буxгалтерия дастури",
      "сверка",
      "акт сверки",
      "банк кўчирмаси",
      "фактура солиштириш",
      "контрагент билан сверка",
      "буxгалтер учун дастур",
      "Ўзбекистон буxгалтерия",
    ],
  },
  guide: {
    title: "Қўлланма — тизим қандай ишлайди",
    description:
      "Уч қадамда: файлларни юкланг, тизим нимани ўқиганини кўрсатади, фарқни кўринг. " +
      "Қолдиқ тенгламаси, банк форматлари, контрагент тоифалари ва Акт сверки ҳақида.",
    keywords: ["сверка қандай қилинади", "акт сверки тайёрлаш", "буxгалтерия қўлланма"],
  },
  pricing: {
    title: "Нарх — бепул 3 та корхона, сверка чексиз",
    description:
      "Чеклов сверка сонига эмас, корхона сонига. Бепул: 3 та корхона. Буxгалтер: 9 999 сўм/ой, " +
      "корхона чексиз. Бюро: 39 999 сўм/ой, 5 фойдаланувчи.",
    keywords: ["буxгалтерия дастури нархи", "сверка дастури нарх", "бепул буxгалтерия дастури"],
  },
  features: {
    title: "Имкониятлар — қолдиқ тенгламаси, формат хотираси, қарз ёши",
    description:
      "Қолдиқ тенгламаси файл тўғрилигини ўзи текширади. Нотаниш банк шаклини тизим " +
      "ўрганиб олади. Коммунал ва бюджет ажратилади, ЖАМИ тўлиқ қолади. Акт сверки ва " +
      "5 варақли Excel ҳисобот.",
    keywords: ["қолдиқ тенгламаси", "банк форматлари", "қарздорлик ёши", "акт сверки excel"],
  },
  login: {
    title: "Кириш",
    description: "Ҳисобингизга киринг ёки бепул рўйхатдан ўтинг — 3 та корхона, сверка чексиз.",
    keywords: [],
  },
  offer: {
    title: "Оммавий оферта",
    description:
      "Moslik веб-хизматидан фойдаланиш шартномаси: хизмат предмети, нарх ва тўлов тартиби, " +
      "тарафларнинг мажбуриятлари, маълумот махфийлиги ва жавобгарлик чегараси.",
    keywords: ["оммавий оферта", "фойдаланиш шартлари", "шартнома"],
  },
  refund: {
    title: "Тўловни қайтариш",
    description:
      "Пул қайтариладиган ҳолатлар, ариза бериш тартиби ва муддатлар. Обунани бекор қилиш — " +
      "юкланган корхоналар ва ҳисоботлар йўқолмайди.",
    keywords: ["тўловни қайтариш", "пулни қайтариш", "обунани бекор қилиш"],
  },
  contact: {
    title: "Алоқа ва реквизитлар",
    description:
      "Moslik хизмати билан боғланиш: Телеграм канали, иш вақти ва хизмат реквизитлари.",
    keywords: ["алоқа", "реквизитлар", "қўллаб-қувватлаш"],
  },
  clients: { title: "Мижозлар", description: "", keywords: [] },
  adminUsers: { title: "Фойдаланувчилар", description: "", keywords: [] },
};

const RU: Record<PathKey, SeoCopy> = {
  home: {
    title: "Автоматическая сверка для бухгалтера",
    description:
      "Загрузите выписку банка и реестр счетов-фактур — система сверит суммы по каждому " +
      "контрагенту и покажет, где расхождение. Акт сверки, анализ дебиторской задолженности " +
      "по срокам, выгрузка в Excel. Бесплатно: 3 организации, сверок без ограничений.",
    keywords: [
      "сверка взаиморасчетов",
      "акт сверки",
      "сверка с контрагентами",
      "выписка банка",
      "счет-фактура",
      "бухгалтерская программа Узбекистан",
      "автоматизация бухгалтерии",
      "дебиторская задолженность",
      "сверка excel",
    ],
  },
  guide: {
    title: "Как это работает — руководство",
    description:
      "Три шага: загрузите файлы, система покажет что именно прочитала, посмотрите расхождения. " +
      "Балансовое равенство, форматы банков, категории контрагентов и акт сверки.",
    keywords: [
      "как сделать сверку",
      "как составить акт сверки",
      "сверка выписки банка",
      "инструкция сверка взаиморасчетов",
    ],
  },
  pricing: {
    title: "Цены — бесплатно 3 организации, сверок без ограничений",
    description:
      "Ограничение не на количество сверок, а на количество организаций. Бесплатно: 3 организации. " +
      "Бухгалтер: 9 999 сум/мес, организаций без ограничений. Бюро: 39 999 сум/мес, 5 пользователей.",
    keywords: [
      "цена бухгалтерской программы",
      "стоимость сверки",
      "бесплатная бухгалтерская программа",
      "программа для сверки цена",
    ],
  },
  features: {
    title: "Возможности — балансовое равенство, память форматов, сроки долга",
    description:
      "Балансовое равенство проверяет сам файл: если дебет и кредит перепутаны, «Итого» этого " +
      "не заметит, а равенство — заметит. Незнакомый формат банка система запоминает. " +
      "Коммунальные и бюджетные платежи выделяются отдельно, ИТОГО остаётся полным.",
    keywords: [
      "балансовое равенство",
      "форматы выписок банка",
      "дебиторская задолженность по срокам",
      "акт сверки excel",
      "категории контрагентов",
    ],
  },
  login: {
    title: "Вход",
    description: "Войдите в аккаунт или зарегистрируйтесь бесплатно — 3 организации, сверок без ограничений.",
    keywords: [],
  },
  offer: {
    title: "Публичная оферта",
    description:
      "Договор на использование сервиса Moslik: предмет услуги, цена и порядок оплаты, " +
      "обязанности сторон, конфиденциальность данных и пределы ответственности.",
    keywords: ["публичная оферта", "условия использования", "договор"],
  },
  refund: {
    title: "Возврат средств",
    description:
      "Случаи возврата платежа, порядок подачи заявления и сроки. Отмена подписки — " +
      "загруженные организации и отчёты не пропадают.",
    keywords: ["возврат средств", "возврат платежа", "отмена подписки"],
  },
  contact: {
    title: "Контакты и реквизиты",
    description:
      "Связь с сервисом Moslik: Телеграм-канал, часы работы и реквизиты сервиса.",
    keywords: ["контакты", "реквизиты", "поддержка"],
  },
  clients: { title: "Клиенты", description: "", keywords: [] },
  adminUsers: { title: "Пользователи", description: "", keywords: [] },
};

const EN: Record<PathKey, SeoCopy> = {
  home: {
    title: "Automated reconciliation for accountants",
    description:
      "Upload a bank statement and an invoice register — the system checks every counterparty " +
      "and shows where the numbers disagree. Reconciliation act, receivables ageing, Excel export. " +
      "Free plan: 3 companies, unlimited reconciliations.",
    keywords: [
      "reconciliation software",
      "accounts reconciliation",
      "bank statement reconciliation",
      "invoice matching",
      "accounting software Uzbekistan",
      "receivables ageing",
    ],
  },
  guide: {
    title: "How it works — guide",
    description:
      "Three steps: upload the files, see exactly what the system read, review the differences. " +
      "Balance equation, bank formats, counterparty categories and the reconciliation act.",
    keywords: ["how to reconcile accounts", "reconciliation act", "bank statement parsing"],
  },
  pricing: {
    title: "Pricing — free for 3 companies, unlimited reconciliations",
    description:
      "The limit is on companies, not on reconciliations. Free: 3 companies. Accountant: 9,999 UZS/month, " +
      "unlimited companies. Bureau: 39,999 UZS/month, 5 users.",
    keywords: ["reconciliation software pricing", "accounting software price", "free reconciliation tool"],
  },
  features: {
    title: "Features — balance equation, format memory, ageing",
    description:
      "The balance equation validates the file itself: if debit and credit are swapped, the file's own " +
      "total will not notice — the equation will. Unknown bank layouts are learned once and recognised after.",
    keywords: ["balance equation", "bank statement formats", "receivables ageing", "reconciliation act excel"],
  },
  login: {
    title: "Sign in",
    description: "Sign in or create a free account — 3 companies, unlimited reconciliations.",
    keywords: [],
  },
  offer: {
    title: "Public offer",
    description:
      "Terms for using the Moslik service: subject of the service, price and payment, " +
      "obligations of the parties, data confidentiality and limits of liability.",
    keywords: ["public offer", "terms of use", "agreement"],
  },
  refund: {
    title: "Refunds",
    description:
      "When a payment is refunded, how to request it, and the timelines. Cancelling a " +
      "subscription — uploaded companies and reports are not lost.",
    keywords: ["refund", "money back", "cancel subscription"],
  },
  contact: {
    title: "Contacts and details",
    description:
      "Contact the Moslik service: Telegram channel, working hours and service details.",
    keywords: ["contacts", "company details", "support"],
  },
  clients: { title: "Clients", description: "", keywords: [] },
  adminUsers: { title: "Users", description: "", keywords: [] },
};

export const SEO: Record<Locale, Record<PathKey, SeoCopy>> = {
  uz: UZ,
  'uz-cyrl': UZ_CYRL,
  ru: RU,
  en: EN,
};

export function seo(locale: Locale, key: PathKey): SeoCopy {
  return SEO[locale][key];
}
