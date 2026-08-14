// ============================================================
// FORMAT XOTIRASI
//
// Har bir eksport shaklining SHAPKA QATORI o'zgarmas "barmoq izi"
// beradi. Bir marta muvaffaqiyatli o'qilgan shapka shu iz bilan
// saqlanadi; keyingi safar o'sha fayl kelganda ustunlar qaytadan
// TAXMIN QILINMAYDI - saqlangan xarita bo'yicha o'qiladi.
//
// Bu ikki narsani beradi:
//   1) Notanish format bir marta o'qilsa, keyin u TANISH format;
//   2) Bir xil fayl har safar AYNAN bir xil o'qiladi (evristika
//      "fikrini o'zgartirib" jimgina boshqa raqam bermaydi).
//
// Saqlash joyi - Firestore `excel_formats` to'plami (route qatlami
// yozadi/o'qiydi); bu modul faqat sof mantiq, tashqi bog'liqliksiz.
// ============================================================

import { createHash } from 'crypto';
import { findAccountBalances, parseAmount, parseDate, type BankStatement, type BankTx, type Cell } from './bankStatements';

export type FormatKind = 'BANK' | 'FAKTURA';

/** Ustun roli -> ustun indeksi */
export type ColumnMap = Record<string, number>;

export interface LearnedFormat {
  /** Shapka barmoq izi (SHA1, 16 belgi) */
  id: string;
  kind: FormatKind;
  /** Qaysi parser aniqlagan: COLUMNAR / TWO_SIDED / FAKTURA / UNIVERSAL */
  parser: string;
  /** Foydalanuvchiga ko'rsatiladigan nom */
  label: string;
  /** Shapka yorliqlari - foydalanuvchi ko'rib tanishi uchun */
  headerLabels: string[];
  columns: ColumnMap;
  /** Ko'chirma yo'nalishi (faqat bitta tomonli varaqlarda) */
  direction?: 'DEBIT' | 'CREDIT';
  createdAt: string;
  updatedAt: string;
  uses: number;
  sampleFile: string;
}

// ------------------------------------------------------------
// Barmoq izi
// ------------------------------------------------------------

function normLabel(v: Cell): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[«»"'`’.:]/g, '')
    .trim();
}

/** Shapka qatoridan barqaror iz. Bo'sh kataklar ham hisobga olinadi -
 *  ular ustun tartibini saqlaydi. */
export function fingerprint(headerLabels: Cell[]): string {
  const parts = headerLabels.map(normLabel);
  // Oxiridagi bo'sh kataklar tashlanadi (Excel ularni beqaror qaytaradi)
  while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
  if (parts.filter((p) => p !== '').length < 3) return '';
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}

/** Varaqning dastlabki qatorlaridan tanish shapkani qidiradi. */
export function matchKnownFormat(
  rows: Cell[][],
  known: Map<string, LearnedFormat>,
  limit = 40
): { format: LearnedFormat; headerRow: number } | null {
  if (known.size === 0) return null;
  const max = Math.min(limit, rows.length);
  for (let r = 0; r < max; r++) {
    const row = rows[r];
    if (!row || row.length < 3) continue;
    const id = fingerprint(row);
    if (!id) continue;
    const format = known.get(id);
    if (format) return { format, headerRow: r };
  }
  return null;
}

// ------------------------------------------------------------
// Yangi formatni yozib olish
// ------------------------------------------------------------

export function describeFormat(kind: FormatKind, headerLabels: Cell[]): string {
  const shown = headerLabels
    .map(normLabel)
    .filter((s) => s !== '')
    .slice(0, 4)
    .join(' · ');
  return `${kind === 'FAKTURA' ? 'Фактура реестри' : 'Банк кўчирмаси'}: ${shown}`;
}

export function makeLearnedFormat(params: {
  kind: FormatKind;
  parser: string;
  headerLabels: Cell[];
  columns: ColumnMap;
  direction?: 'DEBIT' | 'CREDIT';
  sampleFile: string;
}): LearnedFormat | null {
  const id = fingerprint(params.headerLabels);
  if (!id) return null;
  const now = new Date().toISOString();
  return {
    id,
    kind: params.kind,
    parser: params.parser,
    label: describeFormat(params.kind, params.headerLabels),
    headerLabels: params.headerLabels.map(normLabel),
    columns: params.columns,
    direction: params.direction,
    createdAt: now,
    updatedAt: now,
    uses: 1,
    // MAXFIYLIK: format xotirasi BARCHA ish maydonlari uchun umumiy —
    // bu ataylab, chunki qancha ko'p foydalanuvchi bo'lsa, shuncha ko'p
    // bank shakli taniladi. Lekin fayl NOMIda odatda mijoz firmasining
    // nomi turadi («IMANMAX.xls»), ya'ni uni saqlash begonaga mijoz
    // ro'yxatini ochib berardi. Shuning uchun faqat TURI saqlanadi.
    sampleFile: fileKind(params.sampleFile),
  };
}

/** Fayl nomidan faqat kengaytma: «KARVON MEBILLARI.xls» → «.xls» */
function fileKind(name: string): string {
  const m = /(\.[a-z0-9]{1,5})$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
}

// ------------------------------------------------------------
// Saqlangan xarita bo'yicha o'qish
// ------------------------------------------------------------

const COMBINED_RE = /^\s*(\d{16,})\s*\/\s*(\d{9}|\d{14})\s*\/\s*(.+)$/;

function text(v: Cell): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function cleanInn(v: Cell): string {
  const d = text(v).replace(/\D/g, '');
  return /^\d{9}$/.test(d) || /^\d{14}$/.test(d) ? d : '';
}

const FOOTER_RE = /^(ИТОГ|ВСЕГО|ЖАМИ|JAMI|TOTAL|СУММА ОБОРОТОВ|КОЛИЧЕСТВО ОБОРОТОВ|ОБОРОТ|ВХОДЯЩИЙ ОСТАТОК|ИСХОДЯЩИЙ ОСТАТОК|ОСТАТОК|САЛЬДО|РУКОВОДИТЕЛЬ|ГЛАВНЫЙ|ИСПОЛНИТЕЛЬ)/;

function isFooter(row: Cell[]): boolean {
  for (let c = 0; c < Math.min(row.length, 2); c++) {
    const t = text(row[c]).toUpperCase().replace(/\s+/g, ' ');
    if (t && FOOTER_RE.test(t)) return true;
  }
  return false;
}

/** Bank ko'chirmasini SAQLANGAN ustun xaritasi bo'yicha o'qish.
 *  Taxmin yo'q: qaysi ustun nima ekani oldindan ma'lum. */
export function readBankWithFormat(
  rows: Cell[][],
  fmt: LearnedFormat,
  headerRow: number
): BankStatement | null {
  const c = fmt.columns;
  const has = (k: string) => c[k] !== undefined && c[k] >= 0;
  if (!has('debit') && !has('credit') && !has('amount')) return null;

  const txs: BankTx[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let footerDebit: number | undefined;
  let footerCredit: number | undefined;

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    let debit = has('debit') ? parseAmount(row[c.debit]) : 0;
    let credit = has('credit') ? parseAmount(row[c.credit]) : 0;
    if (!has('debit') && !has('credit') && has('amount')) {
      const a = parseAmount(row[c.amount]);
      if (fmt.direction === 'CREDIT') credit = a;
      else debit = a;
    }

    if (isFooter(row)) {
      if (footerDebit === undefined && (debit > 0 || credit > 0)) {
        footerDebit = debit > 0 ? debit : 0;
        footerCredit = credit > 0 ? credit : 0;
      }
      continue;
    }
    if (debit <= 0 && credit <= 0) continue;

    const combined = has('combined') ? text(row[c.combined]).match(COMBINED_RE) : null;
    const name = combined ? combined[3].trim() : (has('name') ? text(row[c.name]) : '');
    const inn = combined ? combined[2] : (has('inn') ? cleanInn(row[c.inn]) : '');
    const account = combined
      ? combined[1]
      : (has('account') ? text(row[c.account]).replace(/\D/g, '') : '');

    if (debit > 0) totalDebit += debit;
    if (credit > 0) totalCredit += credit;

    txs.push({
      date: has('date') ? parseDate(row[c.date]) : null,
      inn,
      name,
      account,
      debit: debit > 0 ? debit : 0,
      credit: credit > 0 ? credit : 0,
      doc: has('doc') ? text(row[c.doc]) : '',
      purpose: has('purpose') ? text(row[c.purpose]) : '',
    });
  }

  if (txs.length === 0) return null;

  // Hisob egasi: saqlangan «o'z STIRi» ustunidan eng ko'p takrorlangani
  let ownInn = '';
  if (has('ownInn')) {
    const counts = new Map<string, number>();
    let total = 0;
    for (let i = headerRow + 1; i < rows.length; i++) {
      const v = cleanInn(rows[i]?.[c.ownInn]);
      if (!v) continue;
      counts.set(v, (counts.get(v) || 0) + 1);
      total++;
    }
    let best = '', bestN = 0;
    for (const [v, n] of counts) if (n > bestN) { bestN = n; best = v; }
    if (total > 0 && bestN / total >= 0.7) ownInn = best;
  }

  return {
    format: 'COLUMNAR',
    txs,
    ownInn,
    ownName: '',
    ownAccount: '',
    totalDebit,
    totalCredit,
    footerDebit,
    footerCredit,
    // Qoldiq tenglamasi saqlangan xarita bo'yicha o'qishda ham ishlaydi:
    // qoldiq ustunlar xaritasiga bog'liq emas, u sarlavha/yakun
    // qatorida matn bilan yozilgan.
    balances: findAccountBalances(rows),
    layout: [{
      headerRow,
      amountCol: has('credit') ? c.credit : (c.amount ?? -1),
      dateCol: has('date') ? c.date : -1,
      direction: fmt.direction || 'CREDIT',
      counterpartyNameCol: has('name') ? c.name : -1,
      counterpartyInnCol: has('inn') ? c.inn : -1,
    }],
  };
}
