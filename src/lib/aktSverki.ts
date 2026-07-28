// ============================================================
// АКТ СВЕРКИ — bitta kontragent uchun ikki tomonlama solishtiruv
// dalolatnomasi (Didox/Rouming shakliga mos).
//
// Chap taraf  — BIZNING ma'lumot:  Дебет = biz yozgan счёт-фактура,
//                                  Кредит = mijozdan kelgan pul
// O'ng taraf  — MIJOZNING ma'lumoti: aynan teskarisi (ko'zgu)
//
// Сальдо конечное = фактура − келган пул
//   > 0 -> qarz BIZNING foydamizga (mijoz to'lamagan)
//   < 0 -> qarz MIJOZ foydasiga (ortiqcha to'lagan / avans)
// ============================================================

import ExcelJS from 'exceljs';

export interface AktPayment { date: string | null; amount: number; doc: string }
export interface AktInvoice { date: string | null; number: string; amount: number }
export interface AktParty {
  name: string;
  inn: string;
  bankCredit: number;
  facturaSent: number;
  payments: AktPayment[];
  invoices: AktInvoice[];
}
export interface AktOptions {
  ownName: string;
}

const THIN = { style: 'thin' as const };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const MONEY = '#,##0.00';
const FONT = 'Times New Roman';

function fmtDate(iso: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// "31-BPF от 30.04.2025" -> "31-BPF"
function docNumber(full: string): string {
  return String(full || '').split(/\s+от\s+/i)[0].trim();
}

// ------------------------------------------------------------
// Sonni ruscha so'z bilan yozish ("Три миллиона двести двадцать две тысячи")
// ------------------------------------------------------------
const ONES_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const ONES_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

function tripleToWords(n: number, female: boolean): string[] {
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) out.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) {
    out.push(TEENS[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t) out.push(TENS[t]);
    if (o) out.push((female ? ONES_F : ONES_M)[o]);
  }
  return out;
}

function plural(n: number, forms: [string, string, string]): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

export function numberToWordsRu(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'Ноль';

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 1000);
    rest = Math.floor(rest / 1000);
  }

  const NAMES: Array<[string, string, string] | null> = [];
  const total = groups.length;
  for (let i = 0; i < total; i++) {
    const pow = total - i - 1;
    if (pow === 0) NAMES.push(null);
    else if (pow === 1) NAMES.push(['тысяча', 'тысячи', 'тысяч']);
    else if (pow === 2) NAMES.push(['миллион', 'миллиона', 'миллионов']);
    else if (pow === 3) NAMES.push(['миллиард', 'миллиарда', 'миллиардов']);
    else NAMES.push(['триллион', 'триллиона', 'триллионов']);
  }

  const words: string[] = [];
  for (let i = 0; i < total; i++) {
    const g = groups[i];
    if (!g) continue;
    const name = NAMES[i];
    words.push(...tripleToWords(g, name !== null && name[0] === 'тысяча'));
    if (name) words.push(plural(g, name));
  }

  const s = words.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function amountInWords(value: number): string {
  const abs = Math.abs(value);
  const tiyin = Math.round((abs - Math.floor(abs)) * 100);
  return `${numberToWordsRu(abs)} сум ${String(tiyin).padStart(2, '0')} тийин`;
}

// ------------------------------------------------------------
// Excel hujjatini qurish
// ------------------------------------------------------------
export function buildAktWorkbook(party: AktParty, opts: AktOptions): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Акт сверки');

  ws.columns = [
    { width: 13 }, { width: 20 }, { width: 18 }, { width: 18 },
    { width: 13 }, { width: 20 }, { width: 18 }, { width: 18 },
  ];

  // ---- Икки томон сарлавҳаси (фақат жадвалнинг ўзи) ----
  const sideRow = ws.addRow([`По данным "${opts.ownName}", сум`, '', '', '', `По данным "${party.name}", сум`, '', '', '']);
  ws.mergeCells(`A${sideRow.number}:D${sideRow.number}`);
  ws.mergeCells(`E${sideRow.number}:H${sideRow.number}`);
  sideRow.height = 30;
  sideRow.eachCell((c) => {
    c.font = { name: FONT, size: 11, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = BORDER;
  });

  const head = ws.addRow(['Дата', 'Документ', 'Дебет', 'Кредит', 'Дата', 'Документ', 'Дебет', 'Кредит']);
  head.height = 24;
  head.eachCell((c) => {
    c.font = { name: FONT, size: 11, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = BORDER;
  });

  const bodyRow = (cells: (string | number)[], bold = false) => {
    const r = ws.addRow(cells);
    r.eachCell((c, col) => {
      c.font = { name: FONT, size: 10, bold };
      c.border = BORDER;
      if (col === 3 || col === 4 || col === 7 || col === 8) {
        c.numFmt = MONEY;
        c.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
    return r;
  };

  bodyRow(['Сальдо начальное', '', 0, 0, 'Сальдо начальное', '', 0, 0], true);

  // ---- Ҳужжатлар (фактура = дебет, тўлов = кредит) ----
  type Doc = { date: string | null; doc: string; debit: number; credit: number };
  const docs: Doc[] = [
    ...party.invoices.map((i) => ({ date: i.date, doc: docNumber(i.number), debit: i.amount, credit: 0 })),
    ...party.payments.map((p) => ({ date: p.date, doc: p.doc || '', debit: 0, credit: p.amount })),
  ];
  docs.sort((a, b) => (a.date || '').localeCompare(b.date || '') || b.debit - a.debit);

  for (const d of docs) {
    const dt = fmtDate(d.date);
    bodyRow([dt, d.doc, d.debit, d.credit, dt, d.doc, d.credit, d.debit]);
  }

  const debit = party.facturaSent;
  const credit = party.bankCredit;
  const saldo = debit - credit;

  bodyRow(['Обороты за период', '', debit, credit, 'Обороты за период', '', credit, debit], true);
  bodyRow([
    'Сальдо конечное', '',
    saldo > 0 ? saldo : 0, saldo < 0 ? -saldo : 0,
    'Сальдо конечное', '',
    saldo < 0 ? -saldo : 0, saldo > 0 ? saldo : 0,
  ], true);

  // Босма учун: А4 бўйига, бир саҳифа энига
  ws.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
  };

  return wb;
}
