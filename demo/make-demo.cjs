/* ============================================================
 * DEMO FAYLLAR — video uchun
 * ------------------------------------------------------------
 * Ma'lumot TO'LIQ o'ylab topilgan: firma nomlari, STIRlar va
 * summalar haqiqiy emas. Lekin SHAKL haqiqiy: fayl loyihaning
 * o'z parseridan o'tadi va oxirida shu yerda tekshiriladi.
 *
 *   node make-demo.cjs
 * ============================================================ */

const fs = require('fs');
const path = require('path');
const PROJ = path.resolve(__dirname, '..');
process.env.NODE_PATH = path.join(PROJ, 'node_modules');
require('module').Module._initPaths();

const XLSX = require(path.join(PROJ, 'node_modules/xlsx'));
const { createJiti } = require(path.join(PROJ, 'node_modules/jiti'));
const jiti = createJiti(path.join(PROJ, 'scripts/x.cjs'));
const { auditFiles } = jiti(path.join(PROJ, 'src/lib/statementAudit.ts'));

const OUT = __dirname;

/* ---------- BIZNING KORXONA ---------- */
const OWN = {
  name: 'OOO "NAVBAHOR SAVDO"',
  inn: '305412876',
  account: '20208000905412876001',
};
const PERIOD = { from: '01.07.2026', to: '31.07.2026' };
const OPENING = 600_000_000;

/* ---------- YETKAZIB BERUVCHILAR (chiqim) ----------
   paid  — bankdan chiqqan pul
   inv   — kelgan faktura summasi
   Uchtasida ATAYLAB farq bor — video shuni ko'rsatadi. */
const SUPPLIERS = [
  { name: 'OOO "ZAMIN AGRO SAVDO"',        inn: '301447215', pays: [78_400_000, 50_000_000], invs: [128_400_000] },
  { name: 'OOO "BARAKA TEKSTIL GROUP"',    inn: '302778934', pays: [76_250_000],             invs: [76_250_000] },
  { name: 'OOO "SAMARQAND QURILISH MAT"',  inn: '303915602', pays: [120_000_000, 85_800_000, 40_000_000], invs: [145_800_000, 100_000_000] },
  { name: 'OOO "OQ ORZU LOGISTIKA"',       inn: '304526118', pays: [39_600_000],             invs: [47_100_000] },   // -7 500 000
  { name: 'OOO "TOSHKENT ENERGO TAMINOT"', inn: '305833470', pays: [18_900_000],             invs: [] },             // +18 900 000
  { name: 'OOO "MEGA PLAST INDUSTRIYA"',   inn: '306241795', pays: [],                       invs: [62_350_000] },   // -62 350 000
  { name: 'OOO "YANGI DAVR SERVIS"',       inn: '307119458', pays: [54_000_000],             invs: [54_000_000] },
];

/* ---------- XARIDORLAR (kirim — ko'chirma haqiqiy ko'rinsin) ---------- */
const CUSTOMERS = [
  { name: 'OOO "FARGONA SAVDO MARKAZI"', inn: '308654201', amount: 210_000_000 },
  { name: 'OOO "BUXORO TAOM SANOAT"',    inn: '309337846', amount: 185_000_000 },
  { name: 'OOO "XORAZM DEHQON XIZMATI"', inn: '310228573', amount: 125_000_000 },
];

const day = (n) => `${String(n).padStart(2, '0')}.07.2026`;

/* ============================================================
   1) BANK KO'CHIRMASI — COLUMNAR shakli
   («СПРАВКА ПО РАБОТЕ СЧЕТА»: har o'tkazma bitta qator)
   ============================================================ */
function buildStatement() {
  const rows = [];
  rows.push(['СПРАВКА ПО РАБОТЕ СЧЕТА']);
  rows.push([`Счет: ${OWN.account}  ${OWN.name}  ИНН : ${OWN.inn}`]);
  rows.push([`Период: ${PERIOD.from} - ${PERIOD.to}`]);
  rows.push([]);
  rows.push(['Остаток на начало периода:', OPENING, 'ПАССИВ']);
  rows.push([]);
  rows.push(['Дата', 'Номер док.', 'Наименование', 'ИНН', 'Расчетный счет', 'Дебет', 'Кредит', 'Назначение платежа']);

  const tx = [];
  let d = 2, doc = 1401;

  for (const s of SUPPLIERS) {
    for (const amount of s.pays) {
      tx.push({
        date: day(d), doc: String(doc++), name: s.name, inn: s.inn,
        acc: `20208000${s.inn}001`, debit: amount, credit: 0,
        purpose: 'Оплата за товар по договору поставки',
      });
      d += 2; if (d > 28) d = 3;
    }
  }
  tx.sort((a, b) => Number(a.date.slice(0, 2)) - Number(b.date.slice(0, 2)));

  let debit = 0, credit = 0;
  for (const t of tx) {
    debit += t.debit; credit += t.credit;
    rows.push([t.date, t.doc, t.name, t.inn, t.acc, t.debit || '', t.credit || '', t.purpose]);
  }

  rows.push([]);
  rows.push(['ИТОГО', '', '', '', '', debit, credit, '']);
  const closing = OPENING + credit - debit;
  rows.push(['Остаток на конец периода:', closing, 'ПАССИВ']);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Выписка');
  return { wb, debit, credit, closing, count: tx.length };
}

/* ============================================================
   2) KELGAN FAKTURALAR RO'YXATI
   Biz — XARIDOR, shuning uchun «Покупатель ИНН» hamma qatorda
   bir xil: parser aynan shundan «biz kim» ekanini aniqlaydi.
   ============================================================ */
function buildInvoices() {
  const rows = [];
  rows.push(['Реестр входящих счетов-фактур']);
  rows.push([`${OWN.name}   ИНН: ${OWN.inn}`]);
  rows.push([`Период: ${PERIOD.from} - ${PERIOD.to}`]);
  rows.push([]);
  rows.push([
    '№', 'ID', 'Счет-фактура', 'Дата', 'Статус',
    'Продавец ИНН', 'Продавец наименование',
    'Покупатель ИНН', 'Покупатель наименование',
    'Сумма к оплате',
  ]);

  let n = 1, id = 970451, d = 3, total = 0;
  for (const s of SUPPLIERS) {
    for (const amount of s.invs) {
      total += amount;
      rows.push([
        n++, String(id++), `СФ-${2600 + n}`, day(d), 'Подтверждён',
        s.inn, s.name, OWN.inn, OWN.name, amount,
      ]);
      d += 2; if (d > 29) d = 4;
    }
  }
  rows.push([]);
  rows.push(['', '', '', '', '', '', '', '', 'ИТОГО', total]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Счета-фактуры');
  return { wb, total, count: n - 1 };
}

/* ============================================================
   YOZISH VA TEKSHIRISH
   ============================================================ */
const st = buildStatement();
const iv = buildInvoices();

const F_BANK = 'NAVBAHOR-SAVDO_bank-statement_07-2026.xlsx';
const F_INV = 'NAVBAHOR-SAVDO_invoices_07-2026.xlsx';

const bufBank = XLSX.write(st.wb, { type: 'buffer', bookType: 'xlsx' });
const bufInv = XLSX.write(iv.wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(path.join(OUT, F_BANK), bufBank);
fs.writeFileSync(path.join(OUT, F_INV), bufInv);

const M = (n) => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

console.log('YOZILDI');
console.log('  ' + F_BANK + '   — ' + st.count + ' o\'tkazma');
console.log('  ' + F_INV + '   — ' + iv.count + ' faktura');
console.log('');
console.log('KUTILGAN QIYMATLAR');
console.log('  debet (to\'langan) :', M(st.debit));
console.log('  kredit (tushgan)  :', M(st.credit));
console.log('  faktura jami      :', M(iv.total));
console.log('  qoldiq tenglamasi :', M(OPENING), '+', M(st.credit), '−', M(st.debit), '=', M(st.closing));
console.log('');

/* --- HAQIQIY PARSER --- */
const res = auditFiles([
  { name: F_BANK, buffer: bufBank },
  { name: F_INV, buffer: bufInv },
]);

console.log('PARSER NATIJASI');
console.log('  kontragentlar:', res.data.length);
let ok = true;
const check = (label, got, want) => {
  const good = Math.abs(got - want) < 0.005;
  if (!good) ok = false;
  console.log(`  ${good ? '[OK] ' : '[XATO]'} ${label}: ${M(got)}${good ? '' : '  (kutilgan ' + M(want) + ')'}`);
};
check('jami to\'lov', res.totals.debit, st.debit);
check('jami faktura', res.totals.credit, iv.total);

console.log('');
console.log('QOLDIQ TENGLAMASI');
for (const b of res.balanceChecks || []) {
  console.log(`  ${b.status === 'MOS' ? '[OK] ' : '[XATO]'} ${b.file}: ${b.status}  (${M(b.opening)} + ${M(b.credit)} − ${M(b.debit)} = ${M(b.expected)})`);
  if (b.status !== 'MOS') ok = false;
}

console.log('');
console.log('FARQI BOR KONTRAGENTLAR');
for (const r of res.data.filter((x) => Math.abs(x.totalDebit - x.totalCredit) > 0.005)) {
  console.log(`  ${r.name.padEnd(34)} to'lov ${M(r.totalDebit).padStart(18)}  faktura ${M(r.totalCredit).padStart(18)}  farq ${M(r.totalDebit - r.totalCredit).padStart(18)}`);
}

console.log('');
console.log(res.warnings && res.warnings.length ? 'OGOHLANTIRISHLAR:' : 'Ogohlantirish yo\'q');
for (const w of res.warnings || []) console.log('  · ' + w);

console.log('');
console.log(ok ? '>>> HAMMASI MOS' : '>>> NOMUVOFIQLIK BOR');
