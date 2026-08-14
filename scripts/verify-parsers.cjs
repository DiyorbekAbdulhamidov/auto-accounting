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
const { readWorkbookSmart } = jiti(path.join(PROJ, 'src/lib/excelWorkbook.ts'));

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

for (const name of Object.keys(ETALON)) run(name, [name]);
run('IMANMAX 7 oylik (oborotka + faktura)', [
  'IMANMAX 7 oylik OBOROTKA.xlsx',
  'IMANMAX 7 oylik FAKTURA.xlsx',
]);
runIncomeBalances();
runSwapTest();

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

