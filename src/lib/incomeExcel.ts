// ============================================================
// INCOME (KIRIM) SVERKASI — Excel hisoboti (6 varaq)
//
//   1) Сверка     — chiqim sverkasining aynan teskarisi (asosiy jadval)
//                   + pastida yillar bo'yicha qisqa jadval
//   2) Йиллар     — har bir firma har bir yil kesimida (2025 | 2026 | ...)
//   3) Ойма-ой    — qaysi oyda qancha pul kelgan va faktura yozilgan
//   4) Тўловлар   — har bir bank o'tkazmasi: sana, oy, summa, to'lov maqsadi
//   5) Фактуралар — har bir yuborilgan счёт-фактура: sana, oy, raqam, summa
//   6) Қарз ёши   — FIFO bilan yopilmagan qoldiq yosh guruhlari bo'yicha.
//                   Ekrandagi «Қарз ёши» tab'i bilan AYNAN bir xil:
//                   ilgari u faqat ekranda bor edi va faylga chiqmasdi.
//
// Modul brauzerda ham, Node'da ham ishlaydi (test uchun muhim).
// ============================================================

import ExcelJS from 'exceljs';
import { buildAging, BUCKET_KEYS, type BucketKey } from './aging';

export interface XlPayment { date: string | null; amount: number; doc: string; purpose: string }
export interface XlInvoice { date: string | null; number: string; amount: number }
export interface XlParty {
  name: string;
  inn: string;
  bankCredit: number;
  facturaSent: number;
  difference: number;
  monthly: Record<string, { credit: number; factura: number }>;
  payments: XlPayment[];
  invoices: XlInvoice[];
}
export interface XlReport {
  totals: { bankCredit: number; facturaSent: number; difference: number };
  meta: {
    ownName: string;
    byYear: { year: string; bankCredit: number; facturaSent: number; difference: number }[];
    periodFrom: string | null;
    periodTo: string | null;
  };
}
export interface XlTotals { credit: number; factura: number; diff: number }

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const NO_DATE = 'Санасиз';
const MONEY = '#,##0.00';
const THIN = { style: 'thin' as const };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function fmtDate(iso: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// Фарқнинг маъноси. Фарқ = ФАКТУРА − ПУЛ (сальдо, `incomeParser.ts`).
//   > 0 — фактура ёзилган, пул келмаган -> мижоз қарздор
//   < 0 — пул келган, фактура ёзилмаган -> фактура ёзиш керак
// Чиқим сверкаси билан БИР ХИЛ қоида: мусбат = улар қарздор.
export function verdictText(diff: number): string {
  if (diff > 0.01) return 'Бизга қарздор';
  if (diff < -0.01) return 'Ҳисоб фактура ёзиш керак';
  return '-';
}

function yearOfPeriod(period: string): string {
  return /^\d{4}-\d{2}$/.test(period) ? period.slice(0, 4) : NO_DATE;
}

// Firmaning ma'lum yildagi summalari
function yearOf(p: XlParty, year: string) {
  let credit = 0;
  let factura = 0;
  for (const [period, b] of Object.entries(p.monthly)) {
    if (yearOfPeriod(period) === year) {
      credit += b.credit;
      factura += b.factura;
    }
  }
  return { credit, factura, diff: factura - credit };
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 32;
  row.eachCell((cell) => {
    cell.font = { bold: true, name: 'Times New Roman', size: 12 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  });
}

function styleBody(row: ExcelJS.Row, moneyCols: number[], centerCols: number[] = []) {
  row.eachCell((cell, col) => {
    cell.font = { name: 'Times New Roman', size: 11 };
    cell.border = BORDER;
    if (moneyCols.includes(col)) {
      cell.numFmt = MONEY;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else if (centerCols.includes(col)) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    }
  });
}

function styleTotal(row: ExcelJS.Row, moneyCols: number[]) {
  row.eachCell((cell, col) => {
    cell.font = { bold: true, name: 'Times New Roman', size: 12 };
    cell.border = { ...BORDER, top: { style: 'medium' } };
    if (moneyCols.includes(col)) {
      cell.numFmt = MONEY;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });
}

/** «Қарз ёши» варағидаги гуруҳ сарлавҳалари — экрандагиси билан бир хил */
const BUCKET_TITLES: Record<BucketKey, string> = {
  d0_30: '0–30 кун',
  d31_60: '31–60 кун',
  d61_90: '61–90 кун',
  d90plus: '90+ кун',
  noDate: 'Санасиз',
};

export function buildIncomeWorkbook(
  report: XlReport,
  rows: XlParty[],
  shown: XlTotals,
  todayLabel: string,
  /** Қарз ёши қайси кунга ҳисобланади. Экран билан БИР ХИЛ бўлиши
   *  учун чақирувчидан келади; берилмаса `buildAging` бугунни олади. */
  agingAsOf?: string | null
): ExcelJS.Workbook {
  const years = report.meta.byYear.map((y) => y.year);
  const wb = new ExcelJS.Workbook();

  const periodText =
    report.meta.periodFrom && report.meta.periodTo
      ? `${fmtDate(report.meta.periodFrom)} — ${fmtDate(report.meta.periodTo)}`
      : `${todayLabel} йил ҳолатига`;

  // ---------- 1) АСОСИЙ СВЕРКА ----------
  const ws = wb.addWorksheet('Сверка');
  ws.columns = [{ width: 50 }, { width: 18 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 35 }];

  const titleRow = ws.addRow([report.meta.ownName || 'Кирим сверкаси']);
  titleRow.getCell(1).font = { bold: true, size: 14, name: 'Times New Roman' };

  const dateRow = ws.addRow(['', '', '', '', '', `${todayLabel} йил ҳолатига`]);
  dateRow.getCell(6).alignment = { horizontal: 'right' };
  dateRow.getCell(6).font = { size: 11, name: 'Times New Roman' };

  styleHeader(ws.addRow(['Фирма номлари', 'СТИР', 'Тушган пул жами', 'Ёзилган фактура жами', 'Фарқи', 'Изоҳ']));

  for (const p of rows) {
    styleBody(
      ws.addRow([p.name, p.inn, p.bankCredit, p.facturaSent, p.difference, verdictText(p.difference)]),
      [3, 4, 5],
      [2, 6]
    );
  }
  styleTotal(ws.addRow(['ЖАМИ', '', shown.credit, shown.factura, shown.diff, verdictText(shown.diff)]), [3, 4, 5]);

  // Asosiy varaqning ostida — yillar bo'yicha qisqa jadval
  if (years.length > 0) {
    ws.addRow([]);
    const capRow = ws.addRow([`ЙИЛЛАР БЎЙИЧА (давр: ${periodText})`]);
    capRow.getCell(1).font = { bold: true, size: 12, name: 'Times New Roman' };
    styleHeader(ws.addRow(['Йил', '', 'Тушган пул жами', 'Ёзилган фактура жами', 'Фарқи', 'Изоҳ']));

    let yc = 0;
    let yf = 0;
    for (const y of years) {
      const c = rows.reduce((a, p) => a + yearOf(p, y).credit, 0);
      const f = rows.reduce((a, p) => a + yearOf(p, y).factura, 0);
      yc += c;
      yf += f;
      // ИШОРА: ФАКТУРА − ПУЛ. Бу қатор илгари `c - f` ёзарди, яъни
      // АЙНИ ШУ ВАРАҚНИНГ ўз ЖАМИ қаторига тескари эди: юқорида
      // «+3 500 Бизга қарздор», олти қатор пастда «−3 500 Ҳисоб
      // фактура ёзиш керак». Экран, «Йиллар» варағи ва парсернинг
      // ўзи ҳам `factura − credit` ишлатади.
      styleBody(ws.addRow([y, '', c, f, f - c, verdictText(f - c)]), [3, 4, 5], [1, 2, 6]);
    }
    styleTotal(ws.addRow(['ЖАМИ', '', yc, yf, yf - yc, verdictText(yf - yc)]), [3, 4, 5]);
  }

  // ---------- 2) ЙИЛЛАР КЕСИМИДА ҲАР БИР ФИРМА ----------
  if (years.length > 1) {
    const wy = wb.addWorksheet('Йиллар');
    wy.columns = [
      { width: 50 }, { width: 18 },
      ...years.flatMap(() => [{ width: 20 }, { width: 20 }, { width: 20 }]),
      { width: 20 }, { width: 20 }, { width: 20 },
    ];

    const t = wy.addRow([report.meta.ownName || 'Кирим сверкаси', '', `Йиллар кесимида — ${periodText}`]);
    t.getCell(1).font = { bold: true, size: 14, name: 'Times New Roman' };

    styleHeader(
      wy.addRow([
        'Фирма номлари',
        'СТИР',
        ...years.flatMap((y) => [`${y} тушган пул`, `${y} ёзилган фактура`, `${y} фарқи`]),
        'ЖАМИ тушган пул',
        'ЖАМИ фактура',
        'ЖАМИ фарқи',
      ])
    );

    const moneyCols = years.flatMap((_, i) => [3 + i * 3, 4 + i * 3, 5 + i * 3]);
    moneyCols.push(3 + years.length * 3, 4 + years.length * 3, 5 + years.length * 3);

    for (const p of rows) {
      const cells: (string | number)[] = [p.name, p.inn];
      for (const y of years) {
        const v = yearOf(p, y);
        cells.push(v.credit, v.factura, v.diff);
      }
      cells.push(p.bankCredit, p.facturaSent, p.difference);
      styleBody(wy.addRow(cells), moneyCols, [2]);
    }

    const totalCells: (string | number)[] = ['ЖАМИ', ''];
    for (const y of years) {
      const c = rows.reduce((a, p) => a + yearOf(p, y).credit, 0);
      const f = rows.reduce((a, p) => a + yearOf(p, y).factura, 0);
      totalCells.push(c, f, f - c);
    }
    totalCells.push(shown.credit, shown.factura, shown.diff);
    styleTotal(wy.addRow(totalCells), moneyCols);

    wy.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }];
  }

  // ---------- 3) ОЙМА-ОЙ ----------
  const wm = wb.addWorksheet('Ойма-ой');
  wm.columns = [{ width: 50 }, { width: 18 }, { width: 10 }, { width: 16 }, { width: 22 }, { width: 22 }, { width: 22 }];
  styleHeader(wm.addRow(['Фирма номлари', 'СТИР', 'Йил', 'Ой', 'Тушган пул', 'Ёзилган фактура', 'Фарқи']));

  for (const p of rows) {
    for (const period of Object.keys(p.monthly).sort()) {
      const b = p.monthly[period];
      const dated = /^\d{4}-\d{2}$/.test(period);
      styleBody(
        wm.addRow([
          p.name,
          p.inn,
          dated ? period.slice(0, 4) : NO_DATE,
          dated ? MONTH_NAMES[Number(period.slice(5, 7)) - 1] : '—',
          b.credit,
          b.factura,
          b.factura - b.credit,
        ]),
        [5, 6, 7],
        [2, 3, 4]
      );
    }
  }
  styleTotal(wm.addRow(['ЖАМИ', '', '', '', shown.credit, shown.factura, shown.diff]), [5, 6, 7]);
  wm.views = [{ state: 'frozen', ySplit: 1 }];

  // ---------- 4) ТЎЛОВЛАР (қачон пул ўтказилган) ----------
  const wp = wb.addWorksheet('Тўловлар');
  wp.columns = [
    { width: 14 }, { width: 10 }, { width: 16 }, { width: 46 }, { width: 16 }, { width: 22 }, { width: 16 }, { width: 70 },
  ];
  styleHeader(wp.addRow(['Сана', 'Йил', 'Ой', 'Фирма номлари', 'СТИР', 'Тушган пул', 'Ҳужжат №', 'Тўлов мақсади']));

  const payments = rows.flatMap((p) => p.payments.map((pay) => ({ ...pay, name: p.name, inn: p.inn })));
  payments.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.name.localeCompare(b.name, 'ru'));

  for (const pay of payments) {
    const dated = !!pay.date && /^\d{4}-\d{2}-\d{2}$/.test(pay.date);
    styleBody(
      wp.addRow([
        fmtDate(pay.date),
        dated ? pay.date!.slice(0, 4) : '—',
        dated ? MONTH_NAMES[Number(pay.date!.slice(5, 7)) - 1] : '—',
        pay.name,
        pay.inn,
        pay.amount,
        pay.doc,
        pay.purpose,
      ]),
      [6],
      [1, 2, 3, 5, 7]
    );
  }
  styleTotal(wp.addRow(['ЖАМИ', '', '', `${payments.length} та ўтказма`, '', shown.credit, '', '']), [6]);
  wp.views = [{ state: 'frozen', ySplit: 1 }];

  // ---------- 5) ЮБОРИЛГАН ФАКТУРАЛАР ----------
  const wf = wb.addWorksheet('Фактуралар');
  wf.columns = [{ width: 14 }, { width: 10 }, { width: 16 }, { width: 46 }, { width: 16 }, { width: 22 }, { width: 40 }];
  styleHeader(wf.addRow(['Сана', 'Йил', 'Ой', 'Фирма номлари', 'СТИР', 'Сумма', 'Счёт-фактура']));

  const invoices = rows.flatMap((p) => p.invoices.map((inv) => ({ ...inv, name: p.name, inn: p.inn })));
  invoices.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.name.localeCompare(b.name, 'ru'));

  for (const inv of invoices) {
    const dated = !!inv.date && /^\d{4}-\d{2}-\d{2}$/.test(inv.date);
    styleBody(
      wf.addRow([
        fmtDate(inv.date),
        dated ? inv.date!.slice(0, 4) : '—',
        dated ? MONTH_NAMES[Number(inv.date!.slice(5, 7)) - 1] : '—',
        inv.name,
        inv.inn,
        inv.amount,
        inv.number,
      ]),
      [6],
      [1, 2, 3, 5]
    );
  }
  styleTotal(wf.addRow(['ЖАМИ', '', '', `${invoices.length} та фактура`, '', shown.factura, '']), [6]);
  wf.views = [{ state: 'frozen', ySplit: 1 }];

  // ---------- 6) ҚАРЗ ЁШИ (AGING) ----------
  // Экрандаги «Қарз ёши» таби фақат экранда қоларди — бухгалтер
  // кўрган ягона нарсани файлга ололмасди. Ҳисоб ШУ ЕРДА қилинмайди:
  // `aging.ts` даги айнан ўша функция, айнан ўша ҳисоб санаси билан.
  const aging = buildAging(
    rows.map((p) => ({
      key: p.inn && p.inn !== '-' ? p.inn : `NAME:${p.name}`,
      inn: p.inn,
      name: p.name,
      payments: p.payments.map((x) => ({ date: x.date, amount: x.amount })),
      invoices: p.invoices.map((x) => ({ date: x.date, number: x.number, amount: x.amount })),
    })),
    agingAsOf ?? report.meta.periodTo ?? null
  );

  const wa = wb.addWorksheet('Қарз ёши');
  wa.columns = [
    { width: 50 }, { width: 18 }, { width: 22 },
    ...BUCKET_KEYS.map(() => ({ width: 20 })),
    { width: 20 }, { width: 14 },
  ];

  const at = wa.addRow([
    report.meta.ownName || 'Кирим сверкаси',
    '',
    `Ҳисоб санаси: ${fmtDate(aging.asOf)}`,
  ]);
  at.getCell(1).font = { bold: true, size: 14, name: 'Times New Roman' };

  styleHeader(
    wa.addRow([
      'Фирма номлари',
      'СТИР',
      'Қарз қолдиғи',
      ...BUCKET_KEYS.map((k) => BUCKET_TITLES[k]),
      'Ортиқча тушган',
      'Энг эски (кун)',
    ])
  );

  const agingMoney = [3, 4, 5, 6, 7, 8, 9];
  for (const p of aging.parties) {
    styleBody(
      wa.addRow([
        p.name,
        p.inn,
        p.receivable,
        ...BUCKET_KEYS.map((k) => p.buckets[k]),
        p.advance,
        p.oldestDays === null ? '—' : p.oldestDays,
      ]),
      agingMoney,
      [2, 10]
    );
  }
  styleTotal(
    wa.addRow([
      'ЖАМИ',
      '',
      aging.totals.receivable,
      ...BUCKET_KEYS.map((k) => aging.totals.buckets[k]),
      aging.totals.advance,
      '',
    ]),
    agingMoney
  );

  wa.addRow([]);
  const note = wa.addRow([
    'Ҳисоблаш усули: келган пул энг эски фактурадан бошлаб ёпилади (FIFO). ' +
      'Ёпилмай қолган қолдиқ фактура санасидан ҳисоб санасигача ўтган кунга қараб ' +
      'гуруҳланади. Фактурадан ортиқча келган пул — аванс.',
  ]);
  note.getCell(1).font = { size: 10, name: 'Times New Roman' };

  wa.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }];

  return wb;
}
