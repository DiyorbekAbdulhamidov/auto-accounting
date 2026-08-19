/* ============================================================
 * PARSER REGRESS TESTI
 *
 * Nega bu fayl bor: sverka mantig'ini brauzersiz, haqiqiy bank
 * fayllariga qarshi ishga tushirish uchun. Route'ni Node'dan test
 * qilib bo'lmaydi, lib'ni esa bo'ladi.
 *
 * Ishlatish:
 *   node scripts/verify-parsers.cjs
 *   node scripts/verify-parsers.cjs "C:/boshqa/papka"
 *
 * TEKSHIRILADIGAN INVARIANTLAR
 *
 *  1) «ИТОГО» — har varaqda o'qilgan qatorlar yig'indisi faylning
 *     O'Z yakuniy qatoriga teng bo'lishi shart.
 *
 *  2) QOLDIQ TENGLAMASI — boshlang'ich qoldiq + kredit − debet =
 *     oxirgi qoldiq. Bu «Итого»dan MUSTAQIL: fayl boshqa joyidan
 *     olinadi va ustunlar xaritasiga bog'liq emas. Eng muhimi —
 *     debet bilan kredit ALMASHIB ketsa «Итого» buni sezmaydi
 *     (yig'indi baribir to'g'ri), qoldiq tenglamasi esa yiqiladi.
 *     Ipoteka/ASBT fayli aynan shu xatoni keltirgan edi.
 *
 *  3) TOIFALAR — kommunal/byudjet kesimlari yig'indisi umumiy
 *     JAMIga teng bo'lishi shart (toifalash pul yo'qotmasligi kerak).
 *
 *  5) YOPILMAGAN FAKTURALAR — FIFO bilan yopilgandan keyin
 *     qolgan qoldiq matematikaga MOS bo'lishi shart:
 *
 *         sum(outstanding) − advance = kredit − debet
 *
 *     Ya'ni ekranda ko'rsatiladigan «shu fakturalar yopilmagan»
 *     ro'yxati jadvaldagi «Фарқ» raqami bilan bir xil narsani
 *     aytadi. Aks holda ikkita raqam bir-biriga qarshi turardi.
 *
 *  4) DAVR KELISHUVI — bank ko'chirmasi va faktura ro'yxati BIR XIL
 *     davrni qamrashi kerak. Aks holda tizim ikkalasini baribir
 *     qo'shib ayiradi va soxta farq chiqadi. Haqiqiy fayllarda
 *     o'lchangan: 1 oylik ko'chirma + 7 oylik faktura = 3 258 650 804
 *     so'mlik soxta farq, ogohlantirishsiz.
 * ============================================================ */

const fs = require('fs');
const path = require('path');
const { createJiti } = require('jiti');

const PROJ = path.resolve(__dirname, '..');
process.env.NODE_PATH = path.join(PROJ, 'node_modules');
require('module').Module._initPaths();

const jiti = createJiti(__filename);
const XLSX = require(path.join(PROJ, 'node_modules/xlsx'));
const { auditFiles } = jiti(path.join(PROJ, 'src/lib/statementAudit.ts'));
const { analyzeIncome } = jiti(path.join(PROJ, 'src/lib/incomeParser.ts'));
const { buildIncomeWorkbook } = jiti(path.join(PROJ, 'src/lib/incomeExcel.ts'));
const { buildAging } = jiti(path.join(PROJ, 'src/lib/aging.ts'));
const { readWorkbookSmart } = jiti(path.join(PROJ, 'src/lib/excelWorkbook.ts'));
const { promoActive, limitsOf, PROMO_UNTIL } = jiti(path.join(PROJ, 'src/lib/plans.ts'));
const { buildFailureRecord } = jiti(path.join(PROJ, 'src/lib/parseFailureLog.ts'));
const { toE164, formatPhone } = jiti(path.join(PROJ, 'src/lib/phone.ts'));
const { accountKeyOf } = jiti(path.join(PROJ, 'src/lib/workspace.ts'));
const {
  mergeOutgoingRows,
  mergeIncomingRows,
  normalizeName,
  suggestMerges,
  buildMergeMap,
} = jiti(path.join(PROJ, 'src/lib/counterpartyMerge.ts'));

const DIR = process.argv[2] || 'C:/Users/hp/Downloads/Telegram Desktop';

const M = (n) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

/** Faylning o'z yakuniy qatoridan olingan etalonlar (tasdiqlangan) */
const ETALON = {
  'ULUGBEK UKTAM BARAKA.xls': { debit: 533714200.0, credit: 530328064.0 },
  'STROY MARKET BIZNES.XLS': { debit: 177989618.29, credit: 177534882.0 },
  'ANGREN ADMIRAL 0107.xls': { debit: 110863934.99, credit: 97771309.0 },
  'KARVON MEBILLARI.xls': { debit: 583281698.9, credit: 558967921.58 },
  'IMANMAX.xls': { debit: 699298176.27, credit: 722034354.04 },
  'AZON.xlsx': { debit: 264267101.16, credit: 283515711.36 },
};

/** MA'LUM kamchiliklar: manba faylda qatorlar o'chirilgan.
 *  Bu dasturning emas, faylning muammosi — shuning uchun oq ro'yxat. */
const KNOWN_GAP = {
  '01-06 yanvar-iyun': 3651343.89,
  '07 iyul': 513361.23,
};

let failed = 0;
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) failed++;
  console.log(`  ${cond ? '[OK]  ' : '[XATO]'} ${msg}`);
};

// ------------------------------------------------------------
// Qoldiq tenglamasi uchun faylni xom holda skanerlash
// ------------------------------------------------------------
const NUM = /-?\d[\d\s\u00a0,.]*/g;

function parseMoney(s) {
  const t = String(s).replace(/[\s\u00a0]/g, '');
  // 1 234 567.89 va 1 234 567,89 - ikkalasi ham uchraydi
  const dot = t.lastIndexOf('.');
  const com = t.lastIndexOf(',');
  let norm = t;
  if (com > dot) norm = t.replace(/\./g, '').replace(',', '.');
  else norm = t.replace(/,/g, '');
  const v = parseFloat(norm);
  return isFinite(v) ? v : null;
}

/** Faylda «Остаток на начало / конец периода» bormi? */
function findBalances(buffer) {
  let wb;
  try {
    wb = readWorkbookSmart(buffer);
  } catch {
    return null;
  }
  let start = null;
  let end = null;
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false });
    for (const row of rows) {
      const cells = row.filter((v) => v !== null && v !== undefined).map(String);
      const line = cells.join(' | ');
      if (!/остаток/i.test(line)) continue;

      // «Остаток на начало периода: 5 310 044.59 | Остаток на конец периода: 1 923 908.59»
      const grab = (re) => {
        const m = line.match(re);
        if (!m) return null;
        const tail = line.slice(m.index + m[0].length);
        const nums = tail.match(NUM);
        if (!nums) return null;
        for (const n of nums) {
          const v = parseMoney(n);
          if (v !== null && Math.abs(v) > 0.004) return v;
        }
        return null;
      };
      if (start === null) start = grab(/остаток\s*на\s*начало[^:]*:?\s*\|?/i);
      if (end === null) end = grab(/остаток\s*на\s*конец[^:]*:?\s*\|?/i);
    }
  }
  return { start, end };
}

// ------------------------------------------------------------

function run(label, fileNames) {
  const inputs = [];
  for (const n of fileNames) {
    const p = path.join(DIR, n);
    if (!fs.existsSync(p)) {
      console.log(`\n=== ${label}\n  [O'TKAZILDI] fayl topilmadi: ${p}`);
      return;
    }
    inputs.push({ name: n, buffer: fs.readFileSync(p) });
  }

  console.log(`\n============================================================`);
  console.log(label);

  const res = auditFiles(inputs);

  // --- 1) «ИТОГО» ---
  for (const s of res.sheets) {
    const gap = KNOWN_GAP[s.sheet] || 0;
    if (s.fileDebit !== undefined) {
      ok(
        Math.abs((s.allDebit || 0) + gap - s.fileDebit) < 0.5,
        `«${s.sheet}» debet ${M(s.allDebit)} = Итого ${M(s.fileDebit)}` +
          (gap ? `  (${M(gap)} — manbada o'chirilgan qatorlar, ma'lum)` : '')
      );
    }
    if (s.fileCredit !== undefined && s.fileCredit > 0) {
      ok(
        Math.abs((s.allCredit || 0) - s.fileCredit) < 0.5,
        `«${s.sheet}» kredit ${M(s.allCredit)} = Итого ${M(s.fileCredit)}`
      );
    }
  }

  // --- 2) QOLDIQ TENGLAMASI ---
  // Buni endi DASTURNING O'ZI tekshiradi (statementAudit.ts). Skript
  // esa dasturga ishonmaydi: faylni xom holda qayta skanerlab, dastur
  // o'qigan qoldiqlar haqiqatan faylda turganini tasdiqlaydi.
  for (const inp of inputs) {
    const bc = res.balanceChecks.find((b) => b.file === inp.name);
    if (!bc) continue; // ko'chirma emas (masalan faktura reestri)
    const raw = findBalances(inp.buffer);
    const hasRaw = raw && raw.start !== null && raw.end !== null;

    if (!hasRaw) {
      ok(bc.status === "YO'Q", `«${inp.name}» qoldiq yo'q — dastur ham «${bc.status}» dedi`);
      continue;
    }
    ok(
      bc.status === 'MOS',
      `qoldiq: ${M(bc.opening)} + ${M(bc.credit)} − ${M(bc.debit)} = ${M(bc.expected)} ` +
        `(faylda ${M(bc.closing)})`
    );
    ok(
      Math.abs(bc.opening - raw.start) < 0.005 && Math.abs(bc.closing - raw.end) < 0.005,
      `dastur o'qigan qoldiqlar xom skaner bilan bir xil (${M(raw.start)} / ${M(raw.end)})`
    );
  }

  // --- 3) QAT'IY REJIM: fayl o'zini tasdiqlay oladimi? ---
  // Faylni tasdiqlaydigan ikki mustaqil yo'l bor: «Итого» qatori va
  // qoldiq tenglamasi. Ikkalasi ham bo'lmasa fayl «tasdiqlanmagan»
  // deb belgilanishi SHART — aks holda taxminiy raqam tekshirilgandek
  // ko'rinardi.
  for (const inp of inputs) {
    const own = res.sheets.filter((s) => s.file === inp.name);
    if (own.length === 0) continue;
    const bc = res.balanceChecks.find((b) => b.file === inp.name);
    const hasFooter = own.some((s) => s.fileDebit !== undefined || s.fileCredit !== undefined);
    const provable = hasFooter || (bc && bc.status === 'MOS');
    const flagged = res.unverifiedFiles.includes(inp.name);
    if (!provable && bc) {
      ok(flagged, `«${inp.name}» tasdiqlab bo'lmaydi — dastur shuni AYTDI`);
    } else if (provable) {
      ok(!flagged, `«${inp.name}» tasdiqlandi — bekorga ogohlantirilmadi`);
    }
  }

  // --- 4) TOIFALAR ---
  let cd = 0, cc = 0, cn = 0;
  for (const v of Object.values(res.categoryTotals)) {
    cd += v.debit; cc += v.credit; cn += v.count;
  }
  ok(
    Math.abs(cd - res.totals.debit) < 0.005 &&
      Math.abs(cc - res.totals.credit) < 0.005 &&
      cn === res.data.length,
    `toifalar yig'indisi = JAMI (${res.data.length} kontragent)`
  );

  for (const w of res.warnings) console.log('  ⚠  ' + w);
}

// ------------------------------------------------------------
// SINTETIK SINOV: qoldiq tenglamasi ALMASHINUVni ushlaydimi?
//
// «Итого» debet bilan kredit almashib ketsa buni SEZMAYDI — har
// bo'limning yig'indisi baribir o'z yakuniga teng bo'lib qolaveradi.
// Shuning uchun bu yerda ataylab buzilgan fayl tuziladi: raqamlar
// o'sha-o'sha qoladi, faqat varaq SARLAVHAlari almashtiriladi
// (Ipoteka/ASBT fayli aynan shunday xato bergan edi).
//
// Kutilgan natija: «Итого» o'tadi, qoldiq tenglamasi YIQILADI.
// ------------------------------------------------------------

const OWN_ACC = '20208000105628578001';
const BANK_HEADER = [
  '№', '№док', 'ВО', 'Наименование плательщика', 'ИНН', 'МФО', 'Расчетный счет',
  'Дата платежа', 'Назначение платежа', 'Сумма платежа',
  'Наименование получателя', 'ИНН', 'МФО', 'Расчетный счет',
];
const US = ['ООО "SINOV"', '300000001', '00461_', OWN_ACC + '_'];
const THEM = [
  ['ООО "BIRINCHI"', '300000002', '00450_', '20208000500000000011_'],
  ['ООО "IKKINCHI"', '300000003', '00450_', '20208000500000000012_'],
];

function titleSheet(direction, opening) {
  return [
    ['Банковская система ASBT 3 (03.08.2026 11:37)', '', '', '', '', '', '', '00461-АНГРЕН Ш.'],
    [`Справка о ${direction === 'DEBIT' ? 'дебетовых' : 'кредитовых'} оборотах по счету ` +
      `${OWN_ACC} за период c 01.07.2026 по 31.07.2026`],
    ['Остаток на начало периода:', '', '', '', '', '', '', '', '', opening, 'ПАССИВ'],
  ];
}

function dataSheet(direction, amounts, closing) {
  const rows = [BANK_HEADER];
  amounts.forEach((amount, i) => {
    const them = THEM[i % THEM.length];
    const [payer, receiver] = direction === 'DEBIT' ? [US, them] : [them, US];
    rows.push([
      i + 1, `30000${i}`, 21, payer[0], payer[1], payer[2], payer[3],
      `0${(i % 9) + 1}.07.2026`, 'товар учун тўлов', amount,
      receiver[0], receiver[1], receiver[2], receiver[3],
    ]);
  });
  const total = amounts.reduce((a, b) => a + b, 0);
  const footer = ['Итого за период:', '', '', '', '', '', '', '', '', total];
  if (closing !== undefined) {
    footer.push('', '', '', '', 'Остаток на конец периода:', closing, 'ПАССИВ');
  }
  rows.push(footer);
  return rows;
}

/** swap=true bo'lsa varaq sarlavhalari almashadi: chiqim kirim,
 *  kirim esa chiqim bo'lib o'qiladi. */
function buildSwapTest({ opening, debits, credits, swap }) {
  const debitTotal = debits.reduce((a, b) => a + b, 0);
  const creditTotal = credits.reduce((a, b) => a + b, 0);
  const closing = opening + creditTotal - debitTotal;

  const first = swap ? 'CREDIT' : 'DEBIT';
  const second = swap ? 'DEBIT' : 'CREDIT';

  const wb = XLSX.utils.book_new();
  const add = (name, aoa) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
  add('Sheet1', titleSheet(first, opening));
  add('Sheet2', dataSheet(first, debits));
  add('Sheet3', titleSheet(second, opening));
  add('Sheet4', dataSheet(second, credits, closing));

  return { buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), closing };
}

/** KIRIM sverkasi (incomeParser.ts) ham AYNI invariantni tekshiradi.
 *  Ikki sverka bitta ko'chirmani bir xil o'qishi shart — aks holda
 *  bir sahifa to'g'ri, ikkinchisi noto'g'ri raqam ko'rsatardi. */
function runIncomeBalances() {
  console.log(`\n============================================================`);
  console.log('KIRIM sverkasi — qoldiq tenglamasi');

  for (const name of Object.keys(ETALON)) {
    const p = path.join(DIR, name);
    if (!fs.existsSync(p)) continue;
    const buffer = fs.readFileSync(p);
    const raw = findBalances(buffer);
    const hasRaw = raw && raw.start !== null && raw.end !== null;

    const bc = analyzeIncome([{ name, buffer }]).meta.balanceChecks[0];
    if (!bc) {
      ok(false, `«${name}» — kirim tomonda ko'chirma umuman o'qilmadi`);
      continue;
    }
    if (!hasRaw) {
      ok(bc.status === "YO'Q", `«${name}» qoldiq yo'q — kirim tomoni ham «${bc.status}» dedi`);
      continue;
    }
    ok(
      bc.status === 'MOS' && Math.abs(bc.closing - raw.end) < 0.005,
      `«${name}» kirim tomonda ham MOS (${M(bc.expected)} = ${M(bc.closing)})`
    );
    // Ikkala sverka bitta faylni bir xil o'qidimi?
    const chiqim = auditFiles([{ name, buffer }]).balanceChecks[0];
    ok(
      Math.abs(chiqim.debit - bc.debit) < 0.5 && Math.abs(chiqim.credit - bc.credit) < 0.5,
      `«${name}» chiqim va kirim bir xil raqam o'qidi (Д ${M(bc.debit)} / К ${M(bc.credit)})`
    );
  }
}

/** Dastur O'Z eksportini qayta yuklashni tanishi SHART. Aks holda
 *  hisobot fayli manba deb o'qilib, summa ikki marta hisoblanadi.
 *  Bu himoya Excel SARLAVHA matniga tayanadi — ya'ni atamalar
 *  o'zgarganda jimgina ishlamay qolishi mumkin, shuning uchun
 *  eksport qilib, qaytadan o'qib tekshiriladi. */
async function runOwnExportTest() {
  console.log(`\n============================================================`);
  console.log("Dastur o'z eksportini taniydimi");

  const name = 'ULUGBEK UKTAM BARAKA.xls';
  const p = path.join(DIR, name);
  if (!fs.existsSync(p)) {
    console.log("  [O'TKAZILDI] etalon fayl yo'q");
    return;
  }
  const report = analyzeIncome([{ name, buffer: fs.readFileSync(p) }]);
  const shown = report.parties.reduce(
    (a, r) => ({
      credit: a.credit + r.bankCredit,
      factura: a.factura + r.facturaSent,
      diff: a.diff + r.difference,
    }),
    { credit: 0, factura: 0, diff: 0 }
  );
  const wb = buildIncomeWorkbook(report, report.parties, shown, '13.08.2026');
  const buffer = Buffer.from(await wb.xlsx.writeBuffer());

  const again = analyzeIncome([{ name: 'kirim-hisobot.xlsx', buffer }]);
  ok(
    again.meta.warnings.some((w) => /ЧИҚАРГАН ҳисобот файли/.test(w)),
    "yangi sarlavhali eksport qayta yuklanganda TANILDI"
  );
  ok(
    again.parties.length === 0,
    `hisobot fayli manba sifatida o'qilmadi (${again.parties.length} kontragent)`
  );
}

function runSwapTest() {
  console.log(`\n============================================================`);
  console.log('SINTETIK: debet ↔ kredit almashinuvi');

  const params = { opening: 1_000_000, debits: [120_000, 80_000], credits: [200_000, 100_000] };

  // (a) To'g'ri fayl — hech qanday ogohlantirish bo'lmasligi kerak
  const good = buildSwapTest({ ...params, swap: false });
  const rGood = auditFiles([{ name: 'SINOV to\'g\'ri.xlsx', buffer: good.buffer }]);
  const bGood = rGood.balanceChecks[0];
  ok(
    bGood && bGood.status === 'MOS',
    `to'g'ri fayl: qoldiq tenglamasi MOS (${M(bGood && bGood.expected)} = ${M(good.closing)})`
  );
  ok(rGood.warnings.length === 0, `to'g'ri faylda ogohlantirish yo'q (${rGood.warnings.length} ta)`);

  // (b) Almashgan fayl — «Итого» o'tadi, qoldiq tenglamasi yiqilishi SHART
  const bad = buildSwapTest({ ...params, swap: true });
  const rBad = auditFiles([{ name: 'SINOV almashgan.xlsx', buffer: bad.buffer }]);
  const bBad = rBad.balanceChecks[0];

  // Har varaqda «Итого» qatori HAQIQATAN topilgan bo'lishi va o'qilgan
  // yig'indiga teng chiqishi kerak — ya'ni tekshiruv bo'sh o'tmaydi.
  const itogoOk = rBad.sheets.every((s) => {
    const found = s.fileDebit !== undefined || s.fileCredit !== undefined;
    const dOk = s.fileDebit === undefined || Math.abs((s.allDebit || 0) - s.fileDebit) < 0.5;
    const cOk = s.fileCredit === undefined || Math.abs((s.allCredit || 0) - s.fileCredit) < 0.5;
    return found && dOk && cOk;
  });
  ok(itogoOk, "almashgan faylda har varaqning «Итого»si o'z yig'indisiga TENG");
  ok(
    !rBad.warnings.some((w) => /якуний қатори/.test(w)),
    "«Итого» almashinuvni sezmadi — bitta ham ogohlantirish bermadi (kutilgani shu)"
  );
  ok(bBad && bBad.status === 'NOMOS', `almashgan fayl: qoldiq tenglamasi YIQILDI (${bBad && bBad.status})`);
  ok(
    rBad.warnings.some((w) => /ҚОЛДИҚ ТЕНГЛАМАСИ/.test(w)),
    'foydalanuvchiga ogohlantirish chiqdi'
  );
  ok(
    rBad.warnings.some((w) => /алмашиб кетган/.test(w)),
    'ogohlantirish sababni aytdi: debet bilan kredit almashib ketgan'
  );
  for (const w of rBad.warnings) console.log('  ⚠  ' + w);
}

/** DAVR KELISHUVI. Ikkita holat tekshiriladi:
 *    - TO'G'RI juftlik (7 oylik ko'chirma + 7 oylik faktura) —
 *      ogohlantirish BO'LMASLIGI kerak (yolg'on signal bermasin);
 *    - NOTO'G'RI juftlik (1 oylik ko'chirma + 7 oylik faktura) —
 *      ogohlantirish CHIQISHI va sababni AYTISHI kerak.
 *  Ikkinchisi eng muhim: ilgari bu holat jimgina o'tib ketardi. */
function runPeriodTest() {
  console.log(`\n============================================================`);
  console.log('DAVR KELISHUVI: kо\'chirma ↔ faktura');

  const hasDavr = (r) => r.warnings.some((w) => w.startsWith('ДАВРЛАР'));
  const load = (n) => {
    const fp = path.join(DIR, n);
    if (!fs.existsSync(fp)) return null;
    return { name: n, buffer: fs.readFileSync(fp) };
  };
  const inputs = (names) => {
    const out = names.map(load);
    return out.some((x) => !x) ? null : out;
  };
  const goodIn = inputs(['IMANMAX 7 oylik OBOROTKA.xlsx', 'IMANMAX 7 oylik FAKTURA.xlsx']);
  const badIn = inputs(['IMANMAX   Июл.xls', 'IMANMAX 7 oylik FAKTURA.xlsx']);
  if (!goodIn || !badIn) {
    console.log("  [O'TKAZILDI] etalon fayllar topilmadi");
    return;
  }

  const good = auditFiles(goodIn, {});
  ok(!hasDavr(good), "to'g'ri juftlikda davr ogohlantirishi YO'Q (yolg'on signal yo'q)");
  ok(
    good.periods.bank.from === '2026-01' && good.periods.bank.to === '2026-07',
    `bank davri to'g'ri topildi: ${good.periods.bank.from} … ${good.periods.bank.to}`
  );
  ok(
    good.periods.faktura.from === '2026-01' && good.periods.faktura.to === '2026-07',
    `faktura davri to'g'ri topildi: ${good.periods.faktura.from} … ${good.periods.faktura.to}`
  );

  const bad = auditFiles(badIn, {});
  ok(hasDavr(bad), "1 oylik ko'chirma + 7 oylik faktura — OGOHLANTIRISH chiqdi");
  ok(
    bad.periods.bank.from === '2026-07' && bad.periods.faktura.from === '2026-01',
    'ikkala davr alohida ko\'rsatildi (bank 2026-07, faktura 2026-01 dan)'
  );
  const w = bad.warnings.find((x) => x.startsWith('ДАВРЛАР')) || '';
  ok(w.includes('2026-07') && w.includes('2026-01'), 'ogohlantirish IKKALA davrni aytdi');
  ok(/\d{2}%/.test(w), 'ogohlantirish qancha pul tashqarida qolganini AYTDI');
  for (const x of bad.warnings.filter((y) => y.startsWith('ДАВРЛАР'))) console.log('  ⚠  ' + x);
}

/** YOPILMAGAN FAKTURALAR — ekran komponenti ishlatadigan AYNAN o'sha
 *  moslashtirish (chiqim tomonida to'lov va faktura bitta ro'yxatda).
 *  Bu yerda tekshiriladigan narsa — ro'yxat jadvaldagi «Фарқ» bilan
 *  bir xil narsani aytadimi. */
function runOpenInvoiceTest() {
  console.log(`\n============================================================`);
  console.log('YOPILMAGAN FAKTURALAR: FIFO qoldig\'i «Фарқ»қа мос келадими');

  const names = ['IMANMAX 7 oylik OBOROTKA.xlsx', 'IMANMAX 7 oylik FAKTURA.xlsx'];
  const inputs = [];
  for (const n of names) {
    const fp = path.join(DIR, n);
    if (!fs.existsSync(fp)) {
      console.log("  [O'TKAZILDI] etalon fayllar topilmadi");
      return;
    }
    inputs.push({ name: n, buffer: fs.readFileSync(fp) });
  }

  const res = auditFiles(inputs, {});
  const rows = res.data.filter((d) => (d.category || 'korxona') === 'korxona');

  const agingInput = rows.map((tx) => ({
    key: tx.key,
    inn: tx.inn,
    name: tx.name,
    invoices: (tx.transactions || [])
      .filter((r) => (r.credit || 0) > 0)
      .map((r) => ({ date: r.date || null, number: r.doc || '', amount: r.credit })),
    payments: (tx.transactions || [])
      .filter((r) => (r.debit || 0) > 0)
      .map((r) => ({ date: r.date || null, amount: r.debit })),
  }));

  const report = buildAging(agingInput, null);
  const byKey = new Map(report.parties.map((x) => [x.key, x]));

  let bad = 0;
  let withOpen = 0;
  for (const tx of rows) {
    const a = byKey.get(tx.key);
    if (!a) continue;
    const outstanding = a.openInvoices.reduce((s2, i) => s2 + i.outstanding, 0);
    // sum(outstanding) − advance  ===  kredit − debet
    const left = outstanding - a.advance;
    const right = tx.totalCredit - tx.totalDebit;
    if (Math.abs(left - right) > 0.02) {
      bad++;
      if (bad <= 3) {
        console.log(`     ${tx.name}: ${left.toFixed(2)} != ${right.toFixed(2)}`);
      }
    }
    if (a.openInvoices.length > 0) withOpen++;
  }

  ok(bad === 0, `${rows.length} ta kontragentda qoldiq «Фарқ» bilan mos keldi`);
  ok(withOpen > 0, `yopilmagan faktura topilgan kontragent: ${withOpen} ta`);

  // Har fakturaning qoldig'i o'z summasidan katta bo'la olmaydi
  let overflow = 0;
  for (const party of report.parties) {
    for (const inv of party.openInvoices) {
      if (inv.outstanding > inv.amount + 0.01 || inv.outstanding < -0.01) overflow++;
    }
  }
  ok(overflow === 0, 'hech bir fakturaning qoldig\'i o\'z summasidan oshmadi');
}


/* ============================================================
 * KONTRAGENTLARNI BIRLASHTIRISH
 * ------------------------------------------------------------
 * Bitta firma ikki xil yozilsa (bankda «МЧЖ "X"», fakturada
 * «X MCHJ») tizim ikki qator ko'rsatadi va IKKALASIDA ham soxta
 * farq chiqadi. Birlashtirish buni yopadi.
 *
 * ENG MUHIM INVARIANT: birlashtirish PUL YO'QOTMASLIGI shart.
 * Yig'indi o'zgarsa — bu «to'g'rilash» emas, ma'lumotni buzish.
 * ============================================================ */
function runMergeTest() {
  console.log(`\n============================================================`);
  console.log('BIRLASHTIRISH: yig\'indi saqlanadimi');

  // --- nom normallashtirish (taklif shu bilan ishlaydi) ---
  ok(
    normalizeName('МЧЖ "ИМАНМАКС"') === normalizeName('IMANMAX MCHJ'),
    'kirill va lotin yozuvidagi bir xil nom bitta o\'zakka keldi'
  );
  // Lotin «x» ikki xil o'qiladi: «ТЕХНО»/«TEXNO» (h tovushi) va
  // «ИМАНМАКС»/«IMANMAX» (кс tovushi). Ikkalasi ham tanilishi shart.
  ok(
    normalizeName('ХК "ТЕХНО"') === normalizeName('TEXNO XK'),
    '«х» tovushidagi x ham tanildi (ТЕХНО = TEXNO)'
  );
  ok(
    normalizeName('ЎЗБЕКҚУРИЛИШ') === normalizeName('OZBEKQURILISH'),
    "o'zbek kirilli (ў, қ) lotin yozuvi bilan mos keldi"
  );
  ok(
    normalizeName('ЯТТ Каримов') === normalizeName('Karimov YATT'),
    "tashkiliy-huquqiy shakl (ЯТТ/YATT) o'zakka ta'sir qilmadi"
  );
  ok(
    normalizeName('ООО "ALFA"') !== normalizeName('ООО "BETA"'),
    'har xil firma har xil o\'zak berdi (yolg\'on birlashuv yo\'q)'
  );

  // --- kalit ikki guruhda: to'qnashuv JIM ketmasin ---
  const conf = buildMergeMap(
    [
      { primary: 'A', members: ['X'], side: 'out' },
      { primary: 'B', members: ['X'], side: 'out' },
    ],
    'out'
  );
  ok(conf.conflicts.includes('X'), 'bitta kalit ikki guruhda — to\'qnashuv aytildi');

  const names = ['IMANMAX 7 oylik OBOROTKA.xlsx', 'IMANMAX 7 oylik FAKTURA.xlsx'];
  const inputs = [];
  for (const n of names) {
    const fp = path.join(DIR, n);
    if (!fs.existsSync(fp)) {
      console.log("  [O'TKAZILDI] etalon fayllar topilmadi");
      return;
    }
    inputs.push({ name: n, buffer: fs.readFileSync(fp) });
  }

  // ---------- CHIQIM TOMONI ----------
  const res = auditFiles(inputs, {});
  const rows = res.data;
  if (rows.length < 3) {
    console.log("  [O'TKAZILDI] kontragent kam");
    return;
  }

  const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);
  const beforeD = sum(rows, (r) => r.totalDebit);
  const beforeC = sum(rows, (r) => r.totalCredit);
  const beforeTx = sum(rows, (r) => (r.transactions || []).length);

  // Eng katta aylanmali ikkitasi birlashtiriladi — natija ko'rinarli
  const sorted = [...rows].sort(
    (a, b) => b.totalDebit + b.totalCredit - (a.totalDebit + a.totalCredit)
  );
  const [p, m] = sorted;
  const groups = [{ primary: p.key, members: [m.key], side: 'out' }];

  // Chuqur nusxa: birlashtirish KIRISHNI o'zgartirmasligi kerak
  const input = JSON.parse(JSON.stringify(rows));
  const merged = mergeOutgoingRows(input, groups);

  ok(merged.length === rows.length - 1, `qator soni 1 taga kamaydi (${rows.length} → ${merged.length})`);
  ok(
    Math.abs(sum(merged, (r) => r.totalDebit) - beforeD) < 0.01,
    `debet yig'indisi o'zgarmadi: ${M(beforeD)}`
  );
  ok(
    Math.abs(sum(merged, (r) => r.totalCredit) - beforeC) < 0.01,
    `kredit yig'indisi o'zgarmadi: ${M(beforeC)}`
  );
  ok(
    sum(merged, (r) => (r.transactions || []).length) === beforeTx,
    `bitta ham o'tkazma yo'qolmadi (${beforeTx} ta)`
  );

  const row = merged.find((r) => r.key === p.key);
  ok(!!row, 'birlashgan qator asosiy kalit bilan turibdi');
  ok(
    Math.abs(row.totalDebit - (p.totalDebit + m.totalDebit)) < 0.01 &&
      Math.abs(row.totalCredit - (p.totalCredit + m.totalCredit)) < 0.01,
    'birlashgan qator summasi ikkalasining yig\'indisiga teng'
  );
  ok(
    Math.abs(row.difference - (row.totalDebit - row.totalCredit)) < 0.01,
    '«Фарқ» qayta hisoblandi: debet − kredit'
  );
  ok(
    Array.isArray(row.mergedFrom) && row.mergedFrom.length === 2,
    'qaysi kalitlardan yig\'ilgani yozib qo\'yildi (ajratib bo\'ladi)'
  );

  // Oylik kesim ham yig'ilishi shart — aks holda oyma-oy jadval
  // birlashgan qatorda bo'sh chiqadi.
  const monthBefore = {};
  for (const r of [p, m]) {
    for (const [k, v] of Object.entries(r.monthlyData || {})) {
      monthBefore[k] = (monthBefore[k] || 0) + v.debit + v.credit;
    }
  }
  let monthBad = 0;
  for (const [k, v] of Object.entries(monthBefore)) {
    const got = row.monthlyData[k];
    if (!got || Math.abs(got.debit + got.credit - v) > 0.01) monthBad++;
  }
  ok(monthBad === 0, `oylik kesim ham yig'ildi (${Object.keys(monthBefore).length} ta oy)`);

  // ---------- TOIFA ASOSIY QATORDAN ----------
  // Bu jimgina xatoning eng qimmat turi edi: guruhning BIRINCHI
  // uchragan qatori «kommunal» bo'lsa, u butun guruhni asosiy
  // sverkadan chiqarib yuborardi va millionlar jadvaldan yo'qolardi.
  // Endi toifa ASOSIY qatordan olinadi, tartibdan qat'i nazar.
  {
    const a = JSON.parse(JSON.stringify(sorted[0]));
    const b = JSON.parse(JSON.stringify(sorted[1]));
    // Ro'yxatda «kommunal» a'zo BIRINCHI turadi, asosiy — ikkinchi
    b.category = 'kommunal';
    b.categoryLabel = 'Коммунал';
    a.category = 'korxona';
    const res2 = mergeOutgoingRows([b, a], [{ primary: a.key, members: [b.key], side: 'out' }]);
    const m2 = res2.find((r) => r.key === a.key);
    ok(
      m2 && m2.category === 'korxona',
      "birlashgan qator toifasi ASOSIY qatordan olindi (a'zo «kommunal» bo'lsa ham)"
    );
    ok(
      m2 && m2.name === a.name && m2.inn === a.inn,
      'nom va STIR ham asosiy qatordan olindi'
    );
    ok(
      m2 && Math.abs(m2.totalDebit - (a.totalDebit + b.totalDebit)) < 0.01,
      "tartib teskari bo'lganda ham summa to'g'ri yig'ildi"
    );
  }

  // Guruhsiz chaqiruv massivni O'ZGARTIRMASLIGI kerak
  ok(mergeOutgoingRows(rows, []) === rows, 'guruh yo\'q bo\'lsa ro\'yxat tegilmaydi');

  // ---------- TAKLIF ----------
  const sug = suggestMerges(rows, groups, 'out');
  ok(
    !sug.some((x) => x.keys.includes(p.key) && x.keys.includes(m.key)),
    'allaqachon birlashtirilgan juftlik qayta taklif qilinmadi'
  );

  // ---------- KIRIM TOMONI ----------
  const inc = analyzeIncome(inputs, { includePending: false });
  const parties = inc.parties || [];
  if (parties.length < 2) {
    console.log("  [O'TKAZILDI] kirim tomonida kontragent kam");
    return;
  }
  const beforeCr = sum(parties, (r) => r.bankCredit);
  const beforeFa = sum(parties, (r) => r.facturaSent);
  const [ip, im] = [...parties].sort(
    (a, b) => b.bankCredit + b.facturaSent - (a.bankCredit + a.facturaSent)
  );
  const inGroups = [{ primary: ip.key, members: [im.key], side: 'in' }];
  const inMerged = mergeIncomingRows(JSON.parse(JSON.stringify(parties)), inGroups);

  ok(inMerged.length === parties.length - 1, `kirimda ham qator soni 1 taga kamaydi`);
  ok(
    Math.abs(sum(inMerged, (r) => r.bankCredit) - beforeCr) < 0.01 &&
      Math.abs(sum(inMerged, (r) => r.facturaSent) - beforeFa) < 0.01,
    'kirimda tushgan pul va faktura yig\'indisi o\'zgarmadi'
  );
  const inRow = inMerged.find((r) => r.key === ip.key);
  ok(
    Math.abs(inRow.difference - (inRow.facturaSent - inRow.bankCredit)) < 0.01,
    'kirimda «Фарқ» = faktura − tushgan pul'
  );
  ok(
    inRow.aliases.includes(im.name) || im.name === inRow.name,
    'qo\'shilgan nom taxallusda saqlandi (yo\'qolmadi)'
  );
  ok(
    (inRow.payments || []).length === (ip.payments || []).length + (im.payments || []).length &&
      (inRow.invoices || []).length === (ip.invoices || []).length + (im.invoices || []).length,
    'to\'lov va faktura ro\'yxati to\'liq qo\'shildi (akt sverki uchun)'
  );
}


/* ============================================================
 * BEPUL DAVR (2026-09-01 … 2026-11-01)
 * ------------------------------------------------------------
 * Sana chegarasi va VAQT MINTAQASI tekshiriladi. Server UTC'da
 * ishlaydi, Toshkent esa +05:00 — mintaqa ko'rsatilmasa davr besh
 * soat oldin tugardi va cheklov kutilmaganda yopilardi.
 * ============================================================ */
function runPromoTest() {
  console.log(`\n============================================================`);
  console.log('BEPUL DAVR: chegara va vaqt mintaqasi');

  const at = (iso) => new Date(iso);

  ok(promoActive(at('2026-09-01T00:00:00+05:00')), 'davr boshida faol');
  ok(promoActive(at('2026-10-15T12:00:00+05:00')), 'davr o\'rtasida faol');

  // PROMO_UNTIL = 2026-11-01T00:00+05:00  ===  2026-10-31T19:00Z
  ok(promoActive(at('2026-10-31T18:59:00Z')), 'Toshkent yarim tunidan BIR DAQIQA oldin faol');
  ok(!promoActive(at('2026-10-31T19:01:00Z')), 'Toshkent yarim tunidan keyin TUGADI');
  ok(
    Date.parse(PROMO_UNTIL) === Date.parse('2026-10-31T19:00:00Z'),
    'mintaqa hisobga olindi: +05:00 → 19:00 UTC'
  );

  // Cheklovlar
  const during = limitsOf('free', at('2026-10-01T00:00:00+05:00'));
  const after = limitsOf('free', at('2026-11-02T00:00:00+05:00'));
  ok(during.companies === Infinity, 'davr ichida korxona CHEKSIZ');
  ok(during.members === Infinity, 'davr ichida foydalanuvchi CHEKSIZ');
  ok(after.companies === 3, `davr tugagach bepul reja qaytdi: ${after.companies} korxona`);
  ok(after.members === 1, 'davr tugagach foydalanuvchi cheklovi qaytdi');
  ok(during.label === after.label, `reja NOMI o'zgarmadi: «${during.label}»`);
  ok(
    during.priceUzs === 0 && after.priceUzs === 0,
    'narx tegilmadi (narx sahifasi PLANS ni o\'zi o\'qiydi)'
  );

  // Pulli rejalarda ham davr ishlashi kerak — ular allaqachon cheksiz
  ok(
    limitsOf('byuro', at('2026-10-01T00:00:00+05:00')).members === Infinity,
    'byuro rejasida ham davr ichida foydalanuvchi cheksiz'
  );
}


/* ============================================================
 * YIQILGAN FAYL JURNALI
 * ------------------------------------------------------------
 * Ikki shart tekshiriladi:
 *   1) MUVAFFAQIYATLI yuklashda hech narsa yozilmaydi — aks holda
 *      kolleksiya har yuklashda o'sadi va haqiqiy muammoni ichidan
 *      topib bo'lmaydi;
 *   2) SUMMALAR yozuvga TUSHMAYDI — jurnalning vazifasi «qaysi
 *      shakl tanilmadi», «qancha pul» emas.
 * ============================================================ */
/**
 * Qiymat Firestore'ga yozilishi mumkinmi.
 *
 * Firestore ikki narsani QABUL QILMAYDI va ikkalasi ham istisno tashlaydi:
 *   · `undefined` (siyrak massiv teshigi ham shunday ko'rinadi)
 *   · massiv ICHIDA massiv
 *
 * Birinchi mos kelmagan joyning yo'lini qaytaradi, hammasi joyida bo'lsa
 * `null`. Sinov shu funksiya orqali yoziladi: matnni emas, YOZUVNI
 * tekshiradi — shakl o'zgarsa sinov ham o'zgarishi kerak bo'ladi.
 */
function firestoreUnsafePath(value, path = 'rec', insideArray = false) {
  if (value === undefined) return `${path} = undefined`;
  if (Array.isArray(value)) {
    if (insideArray) return `${path} — massiv ichida massiv`;
    for (let i = 0; i < value.length; i++) {
      // `i in value` FALSE bo'lsa — bu teshik, ya'ni `undefined`
      if (!(i in value)) return `${path}[${i}] = teshik (undefined)`;
      const bad = firestoreUnsafePath(value[i], `${path}[${i}]`, true);
      if (bad) return bad;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const bad = firestoreUnsafePath(v, `${path}.${k}`, false);
      if (bad) return bad;
    }
  }
  return null;
}

function runFailureLogTest() {
  console.log(`\n============================================================`);
  console.log('YIQILGAN FAYL JURNALI: qachon yoziladi va nima yozilmaydi');

  const base = {
    workspaceId: 'w', companyId: 'c', side: 'out', at: '2026-09-01T00:00:00Z', fileCount: 1,
  };

  // 1) Hammasi joyida — yozilmaydi
  ok(
    buildFailureRecord({
      ...base, parsedCount: 42,
      sheets: [{ file: 'a.xls', sheet: 'Лист1', format: 'COLUMNAR', rows: 100, debit: 500, credit: 400 }],
      unverifiedFiles: [], detectedFormats: ['COLUMNAR'], warnings: [],
    }) === null,
    "muvaffaqiyatli yuklashda yozuv YO'Q"
  );

  // 2) Ogohlantirishning O'ZI sabab emas (davr mos kelmasligi —
  //    foydalanuvchi xatosi, parser yiqilishi emas)
  ok(
    buildFailureRecord({
      ...base, parsedCount: 42,
      sheets: [{ file: 'a.xls', sheet: 'Лист1', format: 'COLUMNAR', rows: 100 }],
      unverifiedFiles: [], warnings: ['ДАВРЛАР МОС КЕЛМАЙДИ: ... 2 723 410 208,97 сўм'],
    }) === null,
    "faqat ogohlantirish bo'lsa ham yozuv YO'Q"
  );

  // 3) Tanilmagan varaq — yoziladi
  const rec = buildFailureRecord({
    ...base, parsedCount: 10,
    sheets: [
      { file: 'a.xls', sheet: 'Лист1', format: 'COLUMNAR', rows: 100, debit: 999, credit: 888 },
      {
        file: 'notanish.xls', sheet: 'Варақ2', format: 'TANILMADI', rows: 0, note: 'Ўқилмади',
        debit: 0, credit: 0, allDebit: 777, allCredit: 666,
        sampleRows: [['Дебет', 'Кредит', 'Контрагент']],
      },
    ],
    unverifiedFiles: [], detectedFormats: ['COLUMNAR'], warnings: ['bir', 'ikki'],
  });
  ok(!!rec && rec.reason === 'TANILMADI', 'tanilmagan varaq yozuv yaratdi');
  ok(rec.sheets.length === 1, "faqat MUAMMOLI varaq yozildi (tanilganlari emas)");
  ok(
    Array.isArray(rec.sheets[0].sampleRows) && rec.sheets[0].sampleRows[0].cells[0] === 'Дебет',
    'shapka namunasi saqlandi — «qaysi shakl» savoliga javob shu'
  );

  // FIRESTORE SHAKLI — 2026-08-19 gacha jurnal HECH QACHON yozilmagan.
  // Ikkita xato bir-birini yashirib turgan edi va ikkalasi ham
  // `logParseFailure` da YUTILARDI, ya'ni ekranda hech narsa ko'rinmasdi:
  //   1) siyrak (sparse) massiv teshigi -> `undefined` -> istisno
  //   2) massiv ichida massiv (`string[][]`) — Firestore uni RAD ETADI
  //      («Property array contains an invalid nested entity»)
  // Shuning uchun tekshiruv MATNGA emas, yozuvning O'ZIGA qo'yiladi.
  ok(
    firestoreUnsafePath(rec) === null,
    `yozuv Firestore shakliga mos (${firestoreUnsafePath(rec) || 'undefined ham, ichma-ich massiv ham yo\'q'})`
  );
  ok(rec.warningCount === 2, `ogohlantirish SONI yozildi: ${rec.warningCount}`);

  // Summalar yozuvda BO'LMASLIGI shart
  const flat = JSON.stringify(rec);
  const leaked = ['999', '888', '777', '666', '2 723 410'].filter((n) => flat.includes(n));
  ok(leaked.length === 0, `summalar yozuvga TUSHMADI (tekshirildi: 999/888/777/666)`);
  ok(!/"debit"|"credit"|allDebit|allCredit/.test(flat), 'debet/kredit maydonlari umuman yo\'q');

  // 4) Bitta ham kontragent chiqmadi — eng og'ir holat
  const empty = buildFailureRecord({ ...base, parsedCount: 0, sheets: [], warnings: [] });
  ok(!!empty && empty.reason === 'BOSH', "bitta ham kontragent chiqmasa reason='BOSH'");

  // 5) O'qildi lekin tasdiqlanmadi
  const unver = buildFailureRecord({
    ...base, parsedCount: 5, sheets: [{ file: 'a.xls', sheet: 'S', format: 'COLUMNAR', rows: 9 }],
    unverifiedFiles: ['a.xls'], warnings: [],
  });
  ok(!!unver && unver.reason === 'TASDIQLANMADI', "tasdiqlanmagan fayl reason='TASDIQLANMADI'");

  // 6) HAQIQIY FAYLDAN — uchidan uchiga.
  //
  // Yuqoridagi sinovlar `sampleRows` ni QO'LDA beradi, ya'ni massiv
  // zich (dense) chiqadi. Haqiqiy Excel'da esa chap kataklari bo'sh
  // qator SIYRAK massiv beradi va aynan shu yiqitardi. Shuning uchun
  // varaq shu yerda XLSX bilan quriladi va `auditFiles` dan o'tkaziladi.
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['38-MAKTAB'],
      [],
      [null, null, null, null, null, null, null, '2022/2023-o‘quv yil'], // <-- chap kataklar BO'SH
      ['T/R', 'Shahar', 'O‘quvchi F.I.O', 'Ball'],
      // Qator soni ATAYLAB yetarli: kam bo'lsa varaq «sarlavha varag'i»
      // deb hisoblanadi (`isTitleOnly`) va TANILMADI umuman yozilmaydi.
      ['1', 'Angren', 'Aliyev A.', '37.8'],
      ['2', 'Angren', 'Valiyev V.', '36.1'],
      ['3', 'Angren', 'G‘aniyev G.', '35.0'],
      ['4', 'Angren', 'Doniyorov D.', '34.2'],
      ['5', 'Angren', 'Eshonov E.', '33.7'],
      ['6', 'Angren', 'Fozilov F.', '32.9'],
      ['7', 'Angren', 'Halilov H.', '31.4'],
    ]),
    'Kimyo'
  );
  const strayBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const strayResult = auditFiles([{ name: 'begona.xlsx', buffer: strayBuffer }]);
  const strayRec = buildFailureRecord({
    ...base,
    parsedCount: strayResult.parties ? strayResult.parties.length : 0,
    sheets: strayResult.sheets,
    unverifiedFiles: [],
    detectedFormats: strayResult.detectedFormats || [],
    warnings: strayResult.warnings || [],
  });
  ok(!!strayRec, 'begona fayl uchun yozuv yaratildi');
  ok(
    firestoreUnsafePath(strayRec) === null,
    `begona fayl yozuvi Firestore'ga yozila oladi (${firestoreUnsafePath(strayRec) || "bo'sh katak '' bo'lib saqlandi"})`
  );
  const strayCells = strayRec.sheets[0] && strayRec.sheets[0].sampleRows
    ? strayRec.sheets[0].sampleRows.map((r) => r.cells)
    : [];
  ok(
    strayCells.some((cells) => cells[0] === '' && cells.includes('2022/2023-o‘quv yil')),
    "chap tomondagi bo'sh kataklar '' bo'lib saqlandi (teshik emas)"
  );
}


/* ============================================================
 * TELEFON RAQAMI VA HISOB KALITI
 * ------------------------------------------------------------
 * Nega tekshiriladi: raqam E.164 ga to'g'ri o'girilmasa SMS
 * UMUMAN ketmaydi. Undan ham qimmati — raqam hisob KALITI
 * bo'ladi, ya'ni «+998901234567» va «998901234567» ikki xil
 * hisob bo'lib qolsa, odam o'z ma'lumotini topolmaydi.
 * ============================================================ */
function runPhoneTest() {
  console.log(`\n============================================================`);
  console.log('TELEFON RAQAMI: E.164 va hisob kaliti');

  const same = '+998901234567';
  const forms = ['901234567', '90 123 45 67', '998901234567', '+998 90 123-45-67', '(90) 123 45 67'];
  let bad = 0;
  for (const f of forms) {
    if (toE164(f) !== same) {
      bad++;
      console.log(`     «${f}» -> ${toE164(f)}`);
    }
  }
  ok(bad === 0, `${forms.length} xil yozuv BITTA kalitga keldi: ${same}`);

  // Rad etilishi SHART: taxmin qilib begona raqamga SMS yuborilmaydi
  const rejects = ['', '123', '9012345678', '79012345678', '+7 901 234 56 78', 'abc'];
  const wrongly = rejects.filter((r) => toE164(r) !== null);
  ok(wrongly.length === 0, `noto'g'ri raqamlar rad etildi (${rejects.length} ta sinaldi)`);

  ok(formatPhone(same) === '+998 90 123 45 67', `ekran shakli: ${formatPhone(same)}`);
  ok(formatPhone('notanish') === 'notanish', "tanilmagan qiymat o'zgartirilmaydi");

  // ---- HISOB KALITI ----
  // Qoida UCH joyda bir xil: firestore.rules authKey(), apiAuth, AuthContext
  ok(accountKeyOf('a@b.uz', null) === 'a@b.uz', 'email bo\'lsa email kalit bo\'ladi');
  ok(accountKeyOf(null, same) === same, "email yo'q bo'lsa telefon kalit bo'ladi");
  ok(accountKeyOf('a@b.uz', same) === 'a@b.uz', 'ikkalasi bo\'lsa EMAIL ustun (mavjud hujjatlar joyida qoladi)');
  ok(accountKeyOf(null, null) === null, "ikkalasi ham yo'q bo'lsa null (kirish rad etiladi)");
  ok(accountKeyOf('', same) === same, "bo'sh email telefonni to'smaydi");
}

for (const name of Object.keys(ETALON)) run(name, [name]);
run('IMANMAX 7 oylik (oborotka + faktura)', [
  'IMANMAX 7 oylik OBOROTKA.xlsx',
  'IMANMAX 7 oylik FAKTURA.xlsx',
]);
runIncomeBalances();
runSwapTest();
runPeriodTest();
runOpenInvoiceTest();
runMergeTest();
runPromoTest();
runFailureLogTest();
runPhoneTest();

// Eksportni qayta o'qish sinovi ExcelJS tufayli asinxron — shuning
// uchun yakuniy hisob shu yerda chiqariladi.
runOwnExportTest().then(() => {
  console.log('\n============================================================');
  console.log(
    failed === 0
      ? `HAMMASI O'TDI ✔   (${checks} ta tekshiruv)`
      : `${failed} / ${checks} ta tekshiruv YIQILDI ✘`
  );
  process.exit(failed === 0 ? 0 : 1);
});

