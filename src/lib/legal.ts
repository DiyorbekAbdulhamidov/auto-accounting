// ============================================================
// HUQUQIY MATNLAR — oferta, to'lovni qaytarish, rekvizitlar
// ------------------------------------------------------------
// NEGA `t()` DAN O'TMAYDI. Bu matnlar SHARTNOMA. Avtomatik
// transliteratsiya lotin uchun to'g'ri ishlaydi (yozuv o'zgaradi,
// so'z o'zgarmaydi), lekin rus va ingliz tiliga «o'girib qo'yish»
// mumkin emas — shartnoma bandi har tilda ANIQ yozilishi kerak.
// Shuning uchun bu yerda `src/lib/seo.ts` bilan bir xil usul:
// har til uchun alohida matn.
//
// LOTIN QO'LDA YOZILMAYDI: kirilldan `translate()` bilan olinadi.
// Ikkita qo'lda yozilgan variant vaqt o'tib bir-biridan uzoqlashadi
// va shartnomaning ikki xil o'qilishi paydo bo'ladi.
//
// REKVIZITLAR — hozircha SHAXSSIZ (2026-08-23). F.I.Sh., ma'lumotnoma
// raqami, shaxsiy telefon, shaxsiy pochta va karta saytdan OLIB
// TASHLANGAN. Sabab: to'lov tizimi hali ulanmagan, ya'ni bu
// ma'lumotlarning ochiq turishi hech narsa bermaydi, lekin ularni
// avtomatik yig'ib olish mumkin.
//
// OGOHLANTIRISH: to'lov tizimi ulanganda rekvizitlar QAYTARILADI —
// oferta ijrochisi nomsiz qolsa, shartnoma sifatida zaif bo'ladi.
// ============================================================

import { translate, type Lang } from '@/lib/i18n';

/** Xizmat rekvizitlari. Tarjima qilinmaydi. Shaxsiy ma'lumot yo'q. */
export const MERCHANT = {
  brand: 'Moslik',
  site: 'moslik.uz',
  /** Yagona ochiq aloqa kanali */
  telegram: '@webleaderscontactbot',
  telegramUrl: 'https://t.me/webleaderscontactbot',
} as const;

export interface LegalSection {
  /** Bo'lim sarlavhasi */
  h: string;
  /** Bandlar */
  items: string[];
}

export interface LegalDoc {
  title: string;
  lead: string;
  sections: LegalSection[];
}

/* ------------------------------------------------------------
   OMMAVIY OFERTA
   ------------------------------------------------------------ */

const OFFER_CYRL: LegalDoc = {
  title: 'Оммавий оферта',
  lead:
    'Ушбу ҳужжат moslik.uz веб-хизматидан фойдаланиш бўйича оммавий оферта — ' +
    'яъни шартнома тузиш таклифи. Рўйхатдан ўтиш ёки тўлов қилиш офертани ' +
    'тўлиқ қабул қилиш ҳисобланади.',
  sections: [
    {
      h: '1. Тарафлар',
      items: [
        'Ижрочи — moslik.uz веб-хизматининг эгаси, Ўзбекистон Республикасида ' +
          'рўйхатдан ўтган тадбиркорлик субъекти. Фаолият тури: дастурий таъминот ' +
          'ишлаб чиқиш. Тўлиқ реквизитлар тўлов тизими уланганда шу саҳифада ' +
          'эълон қилинади. Мурожаат: ' + MERCHANT.telegram + ' Телеграм канали.',
        'Фойдаланувчи — moslik.uz сайтида рўйхатдан ўтган ҳар қандай жисмоний ёки юридик шахс.',
      ],
    },
    {
      h: '2. Оферта предмети',
      items: [
        'Ижрочи Фойдаланувчига moslik.uz веб-хизматидан фойдаланиш ҳуқуқини беради.',
        'Хизмат банк кўчирмаси ва фактура рўйхатини солиштиради, ҳар бир контрагент ' +
          'бўйича фарқни кўрсатади, Акт сверкини ва Excel ҳисоботини шакллантиради.',
        'Хизмат интернет орқали кўрсатилади: дастур Фойдаланувчининг компьютерига ' +
          'ўрнатилмайди, у браузерда ишлайди.',
      ],
    },
    {
      h: '3. Офертани қабул қилиш',
      items: [
        'Сайтда рўйхатдан ўтиш ёки хизмат ҳақини тўлаш офертани тўлиқ ва сўзсиз ' +
          'қабул қилиш (акцепт) ҳисобланади.',
        'Акцепт лаҳзасидан бошлаб шартнома тузилган ҳисобланади. Қоғоз шартнома ' +
          'имзолаш талаб қилинмайди.',
      ],
    },
    {
      h: '4. Хизмат нархи ва тўлов тартиби',
      items: [
        'Бепул режа: ойига 3 та сверка ва 1 та фойдаланувчи, корхона сони чекланмайди. Тўлов талаб қилинмайди, ' +
          'карта сўралмайди.',
        '«Бухгалтер» режаси: ойига 9 999 сўм. Корхона сони чекланмайди, 1 та фойдаланувчи.',
        '«Бюро» режаси: ойига 39 999 сўм. Корхона сони чекланмайди, 5 тагача фойдаланувчи.',
        'Сверкалар сони ҳамма режада чекланмайди.',
        'Нархлар Ўзбекистон сўмида кўрсатилган ва бошқа солиқлар қўшилмайди.',
        'Тўлов бир ой учун олдиндан амалга оширилади.',
        'Ҳозирча тўлов қўлда қабул қилинади: Фойдаланувчи ' + MERCHANT.telegram +
          ' Телеграм каналига ёзади, тўлов реквизитларини ўша ерда олади ва ' +
          'тўловни амалга оширади. Тўлов чеки юборилгач режа очилади — одатда ' +
          'бир неча соат ичида, кечи билан 1 иш куни.',
        'Онлайн тўлов тизими уланганидан кейин тўлов у орқали ҳам қабул қилинади ' +
          'ва ушбу офертада эълон қилинади.',
        'Ижрочи нархни ўзгартириш ҳуқуқига эга. Янги нарх фақат кейинги тўлов даврига ' +
          'татбиқ этилади — тўланган давр ўзгармайди.',
      ],
    },
    {
      h: '5. Тарафларнинг мажбуриятлари',
      items: [
        'Ижрочи хизматнинг узлуксиз ишлашини таъминлашга ҳаракат қилади ва режали ' +
          'техник ишлар ҳақида олдиндан хабар беради.',
        'Фойдаланувчи ҳисоб маълумотларини (парол, СМС код) учинчи шахсларга бермайди. ' +
          'Улар орқали қилинган ҳаракатлар Фойдаланувчи томонидан қилинган ҳисобланади.',
        'Фойдаланувчи хизматга фақат ўзи қонуний асосда эга бўлган маълумотни юклайди.',
      ],
    },
    {
      h: '6. Маълумот ва махфийлик',
      items: [
        'Фойдаланувчи юклаган файллар ва шакллантирилган ҳисоботлар фақат унинг иш ' +
          'майдонида сақланади ва бошқа фойдаланувчиларга кўринмайди.',
        'Ижрочи Фойдаланувчи маълумотини учинчи шахсларга бермайди — қонунда ' +
          'белгиланган ҳоллар бундан мустасно.',
        'Фойдаланувчи истаган вақтда ўз корхоналарини, ҳисоботларини ва ҳисобини ' +
          'ўчириши мумкин. Ўчирилган маълумот тикланмайди.',
      ],
    },
    {
      h: '7. Тўловни қайтариш',
      items: [
        'Тўловни қайтариш тартиби алоҳида саҳифада батафсил ёзилган ва ушбу ' +
          'офертанинг ажралмас қисми ҳисобланади.',
      ],
    },
    {
      h: '8. Жавобгарлик',
      items: [
        'Хизмат бухгалтерия ҳисобини ЮРИТМАЙДИ ва солиқ ҳисоботини ТОПШИРМАЙДИ. ' +
          'У фақат юкланган ҳужжатлардаги рақамларни солиштиради ва фарқни кўрсатади.',
        'Бухгалтерия ва солиқ ҳужжатларининг тўғрилиги учун жавобгарлик Фойдаланувчида ' +
          'қолади. Хизмат натижаси текширув учун восита, якуний ҳужжат эмас.',
        'Ижрочининг жавобгарлиги охирги тўланган ой учун тўланган сумма билан чекланади.',
      ],
    },
    {
      h: '9. Амал қилиш муддати',
      items: [
        'Оферта сайтда эълон қилинган пайтдан амал қилади ва янги таҳрир эълон ' +
          'қилингунича кучда бўлади.',
        'Фойдаланувчи истаган вақтда обунани бекор қилиши ва ҳисобини ўчириши мумкин.',
      ],
    },
    {
      h: '10. Низоларни ҳал қилиш',
      items: [
        'Низолар музокара йўли билан ҳал этилади.',
        'Келишувга эришилмаса, низо Ўзбекистон Республикаси қонунчилигига мувофиқ ҳал этилади.',
      ],
    },
  ],
};

const OFFER_RU: LegalDoc = {
  title: 'Публичная оферта',
  lead:
    'Настоящий документ является публичной офертой — предложением заключить договор ' +
    'на использование веб-сервиса moslik.uz. Регистрация или оплата означают полное ' +
    'принятие оферты.',
  sections: [
    {
      h: '1. Стороны',
      items: [
        'Исполнитель — владелец веб-сервиса moslik.uz, субъект предпринимательства, ' +
          'зарегистрированный в Республике Узбекистан. Вид деятельности: разработка ' +
          'программного обеспечения. Полные реквизиты будут опубликованы на этой ' +
          'странице после подключения платёжной системы. Связь: Телеграм-канал ' +
          MERCHANT.telegram + '.',
        'Пользователь — любое физическое или юридическое лицо, зарегистрировавшееся на сайте moslik.uz.',
      ],
    },
    {
      h: '2. Предмет оферты',
      items: [
        'Исполнитель предоставляет Пользователю право использования веб-сервиса moslik.uz.',
        'Сервис сопоставляет банковскую выписку и список счетов-фактур, показывает ' +
          'разницу по каждому контрагенту, формирует акт сверки и отчёт в Excel.',
        'Услуга оказывается через интернет: программа не устанавливается на компьютер ' +
          'Пользователя и работает в браузере.',
      ],
    },
    {
      h: '3. Принятие оферты',
      items: [
        'Регистрация на сайте или оплата услуги считается полным и безоговорочным ' +
          'принятием оферты (акцептом).',
        'С момента акцепта договор считается заключённым. Подписание бумажного ' +
          'договора не требуется.',
      ],
    },
    {
      h: '4. Стоимость и порядок оплаты',
      items: [
        'Бесплатный тариф: 3 сверки в месяц и 1 пользователь, количество организаций не ограничено. Оплата не требуется, ' +
          'карта не запрашивается.',
        'Тариф «Бухгалтер»: 9 999 сум в месяц. Число организаций не ограничено, 1 пользователь.',
        'Тариф «Бюро»: 39 999 сум в месяц. Число организаций не ограничено, до 5 пользователей.',
        'Количество сверок не ограничено на всех тарифах.',
        'Цены указаны в сумах Республики Узбекистан, дополнительные налоги не начисляются.',
        'Оплата производится авансом за один месяц.',
        'Пока оплата принимается вручную: Пользователь пишет в Телеграм-канал ' +
          MERCHANT.telegram + ', получает там платёжные реквизиты и совершает оплату. ' +
          'После отправки чека тариф открывается: обычно в течение нескольких часов, ' +
          'максимум 1 рабочий день.',
        'После подключения платёжной системы оплата будет приниматься и через неё, ' +
          'о чём будет объявлено в настоящей оферте.',
        'Исполнитель вправе изменить цену. Новая цена применяется только к следующему ' +
          'оплачиваемому периоду — оплаченный период не меняется.',
      ],
    },
    {
      h: '5. Обязанности сторон',
      items: [
        'Исполнитель стремится обеспечить непрерывную работу сервиса и заранее ' +
          'сообщает о плановых технических работах.',
        'Пользователь не передаёт данные доступа (пароль, SMS-код) третьим лицам. ' +
          'Действия, совершённые с их использованием, считаются совершёнными Пользователем.',
        'Пользователь загружает в сервис только те данные, на которые имеет законное право.',
      ],
    },
    {
      h: '6. Данные и конфиденциальность',
      items: [
        'Загруженные файлы и сформированные отчёты хранятся только в рабочем ' +
          'пространстве Пользователя и не видны другим пользователям.',
        'Исполнитель не передаёт данные Пользователя третьим лицам, за исключением ' +
          'случаев, предусмотренных законодательством.',
        'Пользователь в любой момент может удалить свои организации, отчёты и учётную ' +
          'запись. Удалённые данные не восстанавливаются.',
      ],
    },
    {
      h: '7. Возврат средств',
      items: [
        'Порядок возврата средств подробно изложен на отдельной странице и является ' +
          'неотъемлемой частью настоящей оферты.',
      ],
    },
    {
      h: '8. Ответственность',
      items: [
        'Сервис НЕ ведёт бухгалтерский учёт и НЕ сдаёт налоговую отчётность. Он только ' +
          'сопоставляет цифры из загруженных документов и показывает расхождения.',
        'Ответственность за правильность бухгалтерских и налоговых документов остаётся ' +
          'на Пользователе. Результат сервиса — инструмент проверки, а не итоговый документ.',
        'Ответственность Исполнителя ограничена суммой, оплаченной за последний ' +
          'оплаченный месяц.',
      ],
    },
    {
      h: '9. Срок действия',
      items: [
        'Оферта действует с момента публикации на сайте и до публикации новой редакции.',
        'Пользователь в любой момент может отменить подписку и удалить учётную запись.',
      ],
    },
    {
      h: '10. Разрешение споров',
      items: [
        'Споры разрешаются путём переговоров.',
        'При недостижении согласия спор разрешается в соответствии с законодательством ' +
          'Республики Узбекистан.',
      ],
    },
  ],
};

const OFFER_EN: LegalDoc = {
  title: 'Public offer',
  lead:
    'This document is a public offer — a proposal to enter into an agreement on the use ' +
    'of the moslik.uz web service. Signing up or paying constitutes full acceptance of the offer.',
  sections: [
    {
      h: '1. Parties',
      items: [
        'Provider — the owner of the moslik.uz web service, a business entity registered ' +
          'in the Republic of Uzbekistan. Activity: software development. Full legal ' +
          'details will be published on this page once the payment system is connected. ' +
          'Contact: Telegram channel ' + MERCHANT.telegram + '.',
        'User — any individual or legal entity registered on moslik.uz.',
      ],
    },
    {
      h: '2. Subject of the offer',
      items: [
        'The Provider grants the User the right to use the moslik.uz web service.',
        'The service reconciles a bank statement against a list of invoices, shows the ' +
          'difference per counterparty, and produces a reconciliation act and an Excel report.',
        'The service is delivered over the internet: no software is installed on the ' +
          "User's computer; it runs in the browser.",
      ],
    },
    {
      h: '3. Acceptance',
      items: [
        'Registering on the site or paying for the service constitutes full and ' +
          'unconditional acceptance of this offer.',
        'The agreement is concluded at the moment of acceptance. No paper contract is required.',
      ],
    },
    {
      h: '4. Price and payment',
      items: [
        'Free plan: 3 reconciliations a month and 1 user, with no limit on companies. No payment is required and no card is requested.',
        'Buxgalter plan: 9,999 UZS per month. Unlimited companies, 1 user.',
        'Byuro plan: 39,999 UZS per month. Unlimited companies, up to 5 users.',
        'The number of reconciliations is unlimited on every plan.',
        'Prices are stated in Uzbek soums; no additional taxes are added.',
        'Payment is made in advance for one month.',
        'For now, payment is handled manually: the User writes to the Telegram channel ' +
          MERCHANT.telegram + ', receives the payment details there and makes the payment. ' +
          'Once the receipt is sent, the plan is opened — usually within a few hours, ' +
          'at most 1 business day.',
        'Once an online payment system is connected, payment will also be accepted ' +
          'through it, and this offer will be updated accordingly.',
        'The Provider may change prices. A new price applies only to the next payment ' +
          'period — a period already paid for is not affected.',
      ],
    },
    {
      h: '5. Obligations of the parties',
      items: [
        'The Provider aims to keep the service running without interruption and announces ' +
          'planned maintenance in advance.',
        'The User does not share access credentials (password, SMS code) with third ' +
          'parties. Actions taken with them are deemed taken by the User.',
        'The User uploads only data they are legally entitled to.',
      ],
    },
    {
      h: '6. Data and confidentiality',
      items: [
        'Uploaded files and generated reports are stored only in the User workspace and ' +
          'are not visible to other users.',
        'The Provider does not disclose User data to third parties, except where required by law.',
        'The User may delete their companies, reports and account at any time. Deleted ' +
          'data is not recoverable.',
      ],
    },
    {
      h: '7. Refunds',
      items: [
        'The refund procedure is set out in detail on a separate page and forms an ' +
          'integral part of this offer.',
      ],
    },
    {
      h: '8. Liability',
      items: [
        'The service does NOT keep accounting records and does NOT file tax reports. It ' +
          'only compares figures from uploaded documents and shows discrepancies.',
        'Responsibility for the correctness of accounting and tax documents remains with ' +
          'the User. The output is a checking tool, not a final document.',
        "The Provider's liability is limited to the amount paid for the last paid month.",
      ],
    },
    {
      h: '9. Term',
      items: [
        'The offer is effective from publication on the site until a new version is published.',
        'The User may cancel the subscription and delete the account at any time.',
      ],
    },
    {
      h: '10. Disputes',
      items: [
        'Disputes are resolved through negotiation.',
        'Failing agreement, disputes are resolved under the laws of the Republic of Uzbekistan.',
      ],
    },
  ],
};

/* ------------------------------------------------------------
   TO'LOVNI QAYTARISH
   ------------------------------------------------------------ */

const REFUND_CYRL: LegalDoc = {
  title: 'Тўловни қайтариш',
  lead:
    'Тўлов қайтарилиши мумкин бўлган ҳолатлар, ариза бериш тартиби ва муддатлар. ' +
    'Ушбу саҳифа Оммавий офертанинг ажралмас қисми.',
  sections: [
    {
      h: 'Қачон қайтарилади',
      items: [
        'Хизмат Ижрочи айби билан 24 соатдан ортиқ ишламаса — ишламаган кунлар учун.',
        'Фойдаланувчи тўланган ой ичида обунани бекор қилса — фойдаланилмаган кунлар ' +
          'учун, кунлик ҳисобда.',
        'Тўлов техник хато туфайли иккиланиб ўтказилса — ортиқча сумма тўлиқ.',
      ],
    },
    {
      h: 'Қачон қайтарилмайди',
      items: [
        'Бепул режа учун — унда тўлов умуман олинмайди.',
        'Фойдаланувчи хизматдан тўлиқ фойдаланиб бўлган ўтган ойлар учун.',
        'Фойдаланувчи ўз ҳисоб маълумотларини бошқага бериши натижасида юзага келган ' +
          'ҳолатлар учун.',
      ],
    },
    {
      h: 'Ариза бериш тартиби',
      items: [
        'Ариза ' + MERCHANT.telegram + ' Телеграм канали орқали, ҳисобга уланган ' +
          'электрон почта кўрсатилган ҳолда юборилади.',
        'Аризада кўрсатилади: ҳисоб электрон почтаси, тўлов санаси ва суммаси, қайтариш сабаби.',
        'Ариза 3 иш куни ичида кўриб чиқилади ва натижа ўша канал орқали билдирилади.',
        'Тасдиқланган сумма 10 иш куни ичида тўлов амалга оширилган ўша картага қайтарилади.',
        'Қайтариш учун қўшимча ҳақ олинмайди.',
      ],
    },
    {
      h: 'Обунани бекор қилиш',
      items: [
        'Обунани истаган вақтда бекор қилиш мумкин — бунинг учун ариза шарт эмас, ' +
          'кейинги ой учун тўлов қилинмаса кифоя.',
        'Обуна тугагач юкланган корхоналар ва ҳисоботлар ЙЎҚОЛМАЙДИ — улар кўринишда ' +
          'қолади, фақат бепул режа чеклови қайтади.',
      ],
    },
  ],
};

const REFUND_RU: LegalDoc = {
  title: 'Возврат средств',
  lead:
    'Случаи, когда платёж может быть возвращён, порядок подачи заявления и сроки. ' +
    'Эта страница является неотъемлемой частью Публичной оферты.',
  sections: [
    {
      h: 'Когда средства возвращаются',
      items: [
        'Если сервис не работал по вине Исполнителя более 24 часов — за нерабочие дни.',
        'Если Пользователь отменяет подписку внутри оплаченного месяца — за ' +
          'неиспользованные дни, в расчёте по дням.',
        'Если из-за технической ошибки платёж прошёл дважды — излишняя сумма полностью.',
      ],
    },
    {
      h: 'Когда средства не возвращаются',
      items: [
        'За бесплатный тариф — по нему оплата вообще не взимается.',
        'За прошедшие месяцы, в течение которых Пользователь полностью пользовался сервисом.',
        'За последствия передачи Пользователем своих данных доступа другому лицу.',
      ],
    },
    {
      h: 'Порядок подачи заявления',
      items: [
        'Заявление направляется через Телеграм-канал ' + MERCHANT.telegram +
          ' с указанием почты учётной записи.',
        'В заявлении указываются: почта учётной записи, дата и сумма платежа, причина возврата.',
        'Заявление рассматривается в течение 3 рабочих дней, ответ направляется в тот же канал.',
        'Подтверждённая сумма возвращается в течение 10 рабочих дней на ту же карту, ' +
          'с которой был совершён платёж.',
        'Дополнительная плата за возврат не взимается.',
      ],
    },
    {
      h: 'Отмена подписки',
      items: [
        'Подписку можно отменить в любой момент — заявление не требуется, достаточно ' +
          'не оплачивать следующий месяц.',
        'После окончания подписки загруженные организации и отчёты НЕ пропадают — они ' +
          'остаются видимыми, возвращается только ограничение бесплатного тарифа.',
      ],
    },
  ],
};

const REFUND_EN: LegalDoc = {
  title: 'Refunds',
  lead:
    'When a payment can be refunded, how to request it, and the timelines. This page is ' +
    'an integral part of the Public offer.',
  sections: [
    {
      h: 'When a refund is given',
      items: [
        'If the service was unavailable through the fault of the Provider for more than ' +
          '24 hours — for the affected days.',
        'If the User cancels the subscription within a paid month — for the unused days, ' +
          'calculated per day.',
        'If a technical error caused a double charge — the excess amount in full.',
      ],
    },
    {
      h: 'When a refund is not given',
      items: [
        'For the free plan — no payment is taken for it at all.',
        'For past months during which the User made full use of the service.',
        'For consequences of the User sharing their access credentials with another person.',
      ],
    },
    {
      h: 'How to request a refund',
      items: [
        'Send a request via the Telegram channel ' + MERCHANT.telegram +
          ', stating the email address linked to the account.',
        'State the account email, the payment date and amount, and the reason for the refund.',
        'The request is reviewed within 3 business days and the outcome is sent in the same channel.',
        'The approved amount is returned within 10 business days to the same card the ' +
          'payment was made from.',
        'No additional fee is charged for a refund.',
      ],
    },
    {
      h: 'Cancelling a subscription',
      items: [
        'A subscription can be cancelled at any time — no request is needed, simply do ' +
          'not pay for the next month.',
        'After a subscription ends, uploaded companies and reports are NOT lost — they ' +
          'stay visible; only the free-plan limit returns.',
      ],
    },
  ],
};

/* ------------------------------------------------------------
   LOTIN VARIANTI — kirilldan olinadi, qo'lda yozilmaydi
   ------------------------------------------------------------ */

function toLatinDoc(doc: LegalDoc): LegalDoc {
  const tr = (s: string) => translate(s, 'uz-latn');
  return {
    title: tr(doc.title),
    lead: tr(doc.lead),
    sections: doc.sections.map((s) => ({
      h: tr(s.h),
      items: s.items.map(tr),
    })),
  };
}

export const OFFER: Record<Lang, LegalDoc> = {
  'uz-cyrl': OFFER_CYRL,
  'uz-latn': toLatinDoc(OFFER_CYRL),
  ru: OFFER_RU,
  en: OFFER_EN,
};

export const REFUND: Record<Lang, LegalDoc> = {
  'uz-cyrl': REFUND_CYRL,
  'uz-latn': toLatinDoc(REFUND_CYRL),
  ru: REFUND_RU,
  en: REFUND_EN,
};
