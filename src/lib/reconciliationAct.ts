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

// НОМЛАР НЕЙТРАЛ — «фактура» ва «тўлов» ЭМАС.
//
// Сабаб: акт иккала сверкада ҳам ишлатилади ва ролллар ТЕСКАРИ:
//   · кирим (харидор, 4010 актив): биз ёзган фактура — ДЕБЕТ,
//     келган пул — КРЕДИТ;
//   · чиқим (етказиб берувчи, 6010 пассив): биз тўлаган пул —
//     ДЕБЕТ, келган фактура — КРЕДИТ.
// Майдон «invoices» деб аталса, чиқим томонида унга ТЎЛОВ
// узатилиши керак бўларди — бу эртами-кечми хатога олиб келади.
export interface ActDoc {
  date: string | null;
  /** Ҳужжат рақами (фактура №, тўлов топшириқномаси №) */
  number: string;
  amount: number;
}
export interface ActParty {
  name: string;
  inn: string;
  /** Дебет айланмаси жами */
  debitTotal: number;
  /** Кредит айланмаси жами */
  creditTotal: number;
  /** ДЕБЕТ томонидаги ҳужжатлар (қарзни ОШИРАДИ) */
  debitDocs: ActDoc[];
  /** КРЕДИТ томонидаги ҳужжатлар (қарзни КАМАЙТИРАДИ) */
  creditDocs: ActDoc[];
}
export interface ActOptions {
  ownName: string;
  /** Давр БОШИДАГИ қолдиқ (сальдо начальное), дебет томонда мусбат.
   *
   *  МУҲИМ: тизим буни ЎЗИ БИЛМАЙДИ. Банк кўчирмасидаги «Остаток на
   *  начало периода» — ҲИСОБВАРАҚ қолдиғи, контрагент бўйича эмас.
   *  Шунинг учун берилмаса, ҳужжат остига қоldиқ ҲИСОБГА ОЛИНМАГАНИ
   *  ёзиб қўйилади — акс ҳолда акт «нол эди» деб ЁЛҒОН айтарди. */
  openingBalance?: number;
  /** Ҳужжат қамраган давр (экранда топилгани), изоҳ учун */
  periodLabel?: string;
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
export function buildReconciliationActWorkbook(party: ActParty, opts: ActOptions): ExcelJS.Workbook {
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

  // Сальдо начальное. Берилмаса 0 — лекин бу «нол эди» дегани ЭМАС,
  // «ҳисобга олинмади» дегани. Фарқи жадвал остида ёзилади.
  const opening = opts.openingBalance ?? 0;
  const openingKnown = opts.openingBalance !== undefined;
  bodyRow([
    'Сальдо начальное', '',
    opening > 0 ? opening : 0, opening < 0 ? -opening : 0,
    'Сальдо начальное', '',
    opening < 0 ? -opening : 0, opening > 0 ? opening : 0,
  ], true);

  // ---- Ҳужжатлар (фактура = дебет, тўлов = кредит) ----
  type Doc = { date: string | null; doc: string; debit: number; credit: number };
  const docs: Doc[] = [
    ...party.debitDocs.map((d) => ({ date: d.date, doc: docNumber(d.number), debit: d.amount, credit: 0 })),
    ...party.creditDocs.map((d) => ({ date: d.date, doc: docNumber(d.number), debit: 0, credit: d.amount })),
  ];
  docs.sort((a, b) => (a.date || '').localeCompare(b.date || '') || b.debit - a.debit);

  for (const d of docs) {
    const dt = fmtDate(d.date);
    bodyRow([dt, d.doc, d.debit, d.credit, dt, d.doc, d.credit, d.debit]);
  }

  const debit = party.debitTotal;
  const credit = party.creditTotal;
  // Охирги сальдо бошланғич қолдиқни ҲАМ ҳисобга олади
  const saldo = opening + debit - credit;

  bodyRow(['Обороты за период', '', debit, credit, 'Обороты за период', '', credit, debit], true);
  bodyRow([
    'Сальдо конечное', '',
    saldo > 0 ? saldo : 0, saldo < 0 ? -saldo : 0,
    'Сальдо конечное', '',
    saldo < 0 ? -saldo : 0, saldo > 0 ? saldo : 0,
  ], true);

  // ОГОҲЛАНТИРИШ ИЗОҲИ — жадвалдан ТАШҚАРИДА, яъни расмий шаклга
  // тегилмайди. Бошланғич қолдиқ киритилмаган бўлса, ҳужжат буни
  // ЯШИРМАЙДИ: акс ҳолда шерик «нол эди» деб ўқирди.
  if (!openingKnown) {
    const note = ws.addRow([
      'Диққат: сальдо начальное киритилмаган — акт фақат юкланган давр' +
      (opts.periodLabel ? ` (${opts.periodLabel})` : '') +
      ' ҳаракатини кўрсатади. Аввалги давр қолдиғи ҳисобга олинмаган.',
    ]);
    ws.mergeCells(note.number, 1, note.number, 8);
    const c = note.getCell(1);
    c.font = { name: FONT, size: 9, italic: true };
    c.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    note.height = 26;
  }

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
