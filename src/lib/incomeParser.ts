// ============================================================
// INCOME AUDIT — MUSTAQIL MODUL
//
// Bu modul faqat /kirim-audit sahifasi va /api/kirim-audit
// route'i uchun yozilgan. Eski parserlar (upload-preview,
// universalParser, excelWorkbook) bilan hech qanday bog'liqligi
// YO'Q — ular o'zgarishsiz ishlayveradi.
//
// Vazifasi:
//   1. Bank ko'chirmasidan JAMI KELGAN PUL (KREDIT) ni firma
//      kesimida yig'ish;
//   2. E-faktura portalidan yuklangan "JO'NATILGAN счёт-фактура"
//      reestridan jami yozib berilgan fakturalarni yig'ish;
//   3. Ikkalasini kontragent bo'yicha solishtirib farqni chiqarish.
//
// Bank ko'chirmasida odatda STIR bo'lmaydi (faqat nom + hisob
// raqami), fakturada esa STIR bor. Shuning uchun ulash NOM ni
// normallashtirish orqali bajariladi: yuridik shakl (МЧЖ, ООО,
// ХК, LLC ...), qo'shtirnoq, apostrof, tinish belgilari olib
// tashlanadi, kirill lotinga o'giriladi.
//   "ИП ООО \"KAND-FAVORITE\""  -> KANDFAVORITE
//   "\"KAND-FAVORITE\" MCHJ XK" -> KANDFAVORITE
// ============================================================

import * as XLSX from 'xlsx';
import iconv from 'iconv-lite';
import { createHash } from 'crypto';
import {
  absorbBalances,
  checkBalanceEquation,
  findAccountBalances,
  newBalanceTally,
  parseNewBankFormats,
  type BalanceCheck,
} from './bankStatements';
import { readWorkbookSmart } from './excelWorkbook';

export type Cell = string | number | boolean | Date | null | undefined;

export interface PaymentRec {
  date: string | null;
  amount: number;
  doc: string;
  purpose: string;
}

export interface InvoiceRec {
  date: string | null;
  number: string;
  amount: number;
}

export interface MonthBucket {
  credit: number;
  factura: number;
}

export interface PartyRow {
  key: string;
  inn: string;
  name: string;
  aliases: string[];
  bankCredit: number;   // banktan kelgan pul (kredit)
  facturaSent: number;  // biz yozib bergan счёт-фактура
  difference: number;   // bankCredit - facturaSent
  monthly: Record<string, MonthBucket>;
  payments: PaymentRec[];
  invoices: InvoiceRec[];
}

export interface SkippedInvoice {
  status: string;
  count: number;
  amount: number;
}

export interface YearTotal {
  year: string;
  bankCredit: number;
  facturaSent: number;
  difference: number;
}

export interface IncomeReport {
  parties: PartyRow[];
  totals: {
    bankCredit: number;
    facturaSent: number;
    difference: number;
    bankDebit: number;
  };
  meta: {
    ownInn: string;
    ownName: string;
    bankSheets: string[];
    facturaSheets: string[];
    bankRowCount: number;
    bankCreditRaw: number;   // ko'chirmadagi umumiy kredit (ichki o'tkazmalar bilan)
    invoiceCount: number;
    skippedInvoices: SkippedInvoice[];
    byYear: YearTotal[];
    periodFrom: string | null;
    periodTo: string | null;
    warnings: string[];
    /** Ҳар файл учун қолдиқ тенгламаси: бошланғич қолдиқ + кредит −
     *  дебет = охирги қолдиқ. «Итого»дан мустақил назорат. */
    balanceChecks: BalanceCheck[];
  };
}

export interface InputFile {
  name: string;
  buffer: Buffer;
}

// ------------------------------------------------------------
// Matn / son / sana yordamchilari
// ------------------------------------------------------------

function cellText(v: Cell): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

// Pul summasi: "2,800,000.00" (US), "2060000,00" (RU), "1 234,56"
function parseAmount(v: Cell): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;

  let str = String(v).trim();
  if (!str) return 0;

  let negative = false;
  if (/^\(.*\)$/.test(str)) {
    negative = true;
    str = str.slice(1, -1).trim();
  }
  if (str.startsWith('-')) {
    negative = true;
    str = str.slice(1);
  }

  str = str.replace(/[^\d,.\s]/g, '').replace(/\s/g, '');
  if (!str) return 0;

  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    str = lastComma > lastDot
      ? str.replace(/\./g, '').replace(',', '.')
      : str.replace(/,/g, '');
  } else if (lastComma !== -1) {
    const parts = str.split(',');
    const isDecimal = parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2;
    str = isDecimal ? str.replace(',', '.') : str.replace(/,/g, '');
  }

  const num = Number(str);
  if (!isFinite(num)) return 0;
  return negative ? -num : num;
}

// Sana: Excel serial, Date, "07.01.2025 13:53:05", "100-BPF от 29.09.2025"
function parseDate(v: Cell): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  const str = String(v).trim();
  if (!str) return null;

  const dmy = str.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(d.getTime())) return d;
    }
  }

  const ymd = str.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (ymd) {
    const d = new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])));
    if (!isNaN(d.getTime())) return d;
  }

  // Excel serial (raqam yoki raqamli satr)
  if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(str)) {
    const serial = Number(v);
    if (serial > 20000 && serial < 60000) {
      const d = new Date(Math.floor(serial - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

function isoDay(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function periodKey(d: Date | null): string {
  if (!d) return 'noma\'lum';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function cleanInn(v: Cell): string {
  const digits = cellText(v).replace(/\D/g, '');
  return digits || '-';
}

// MUHIM: STIR har doim ANIQ ustundan yoki «hisob/STIR/nom» birlashgan
// katakdan olinadi, ya'ni telefon raqami bilan adashtirib bo'lmaydi.
// Shuning uchun prefiks bo'yicha filtr YO'Q: YATTlarning haqiqiy STIRi
// 55.. bilan ham boshlanadi (masalan 551640304) va ilgari bunday
// o'tkazmalar «STIRsiz» bo'lib bir uyumga tushib qolardi.
function isValidInn(inn: string): boolean {
  return /^\d{9}$/.test(inn) || /^\d{14}$/.test(inn);
}

// ------------------------------------------------------------
// FIRMA NOMINI NORMALLASHTIRISH (bank ↔ faktura ulanishi shu yerda)
// ------------------------------------------------------------

const CYR_MAP: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Ғ: 'G', Д: 'D', Е: 'E', Ё: 'YO', Ж: 'J', З: 'Z',
  И: 'I', Й: 'Y', К: 'K', Қ: 'Q', Л: 'L', М: 'M', Н: 'N', О: 'O', Ў: 'O', П: 'P',
  Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'X', Ҳ: 'H', Ц: 'TS', Ч: 'CH',
  Ш: 'SH', Щ: 'SH', Ъ: '', Ы: 'I', Ь: '', Э: 'E', Ю: 'YU', Я: 'YA', Ә: 'A', І: 'I',
};

// Uzun yuridik iboralar (translitdan keyingi lotin ko'rinishida)
const LEGAL_PHRASES: RegExp[] = [
  /MAS\s*ULIYATI\s+CHEKLANGAN\s+JAMIYATI?/g,
  /OCHIQ\s+AKSIYADORLIK\s+JAMIYATI?/g,
  /YOPIQ\s+AKSIYADORLIK\s+JAMIYATI?/g,
  /AKSIYADORLIK\s+JAMIYATI?/g,
  /QO\s*SHMA\s+KORXONA(SI)?/g,
  /XUSUSIY\s+KORXONA(SI)?/g,
  /OILAVIY\s+KORXONA(SI)?/g,
  /FERMER\s+XO\s*JALIGI/g,
  /YAKKA\s+TARTIBDAGI\s+TADBIRKOR/g,
  /QIMMATLI\s+QOG\s*OZLAR/g,
  /S\s*OVMESTNOE\s+PREDPRIYATIE/g,
  /OBSHESTVO\s+S\s+OGRANICHENNOY\s+OTVETSTVENNOSTYU/g,
];

// Alohida so'z sifatidagi qisqartmalar
const LEGAL_WORDS = [
  'OOO', 'OAO', 'ZAO', 'AO', 'AJ', 'IP', 'CHP', 'MCHJ', 'XK', 'HK', 'QK', 'KK',
  'JV', 'LLC', 'LTD', 'LLP', 'INC', 'SP', 'YATT', 'FX', 'XT', 'KFY', 'MFY',
];
const LEGAL_WORD_RE = new RegExp(`(^|[^A-Z0-9])(${LEGAL_WORDS.join('|')})([^A-Z0-9]|$)`, 'g');

// Ko'rsatish uchun nomni chiroyli qilish (solishtirish uchun EMAS):
//   "JALIN KO`MIR" MCHJ      -> JALIN KO'MIR MCHJ
//   "OILCHEM"МЧЖ             -> OILCHEM МЧЖ
//   ООО `SEVEN HILLS ...`    -> ООО SEVEN HILLS ...
export function prettifyName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/["«»“”„]/g, ' ')   // qo'shtirnoqlar olib tashlanadi
    .replace(/[`’‘ʻʼ]/g, "'")     // apostroflar bir xil ko'rinishga keladi
    .replace(/\s*'\s*/g, "'")     // "KO ' MIR" -> "KO'MIR"
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeName(raw: string): string {
  if (!raw) return '';

  // 1. Katta harf + qo'shtirnoqlarni PROBEL bilan almashtirish
  //    ("OILCHEM"МЧЖ -> OILCHEM МЧЖ), apostrof/backtickni olib tashlash
  //    (KO`MIR -> KOMIR, mas`uliyati -> masuliyati)
  let t = raw.toUpperCase();
  t = t.replace(/[`'’‘ʻʼ]/g, '');
  t = t.replace(/["«»“”„]/g, ' ');

  // 2. Kirill -> lotin
  t = t.replace(/[А-ЯЁЎҚҒҲӘІ]/g, (ch) => (ch in CYR_MAP ? CYR_MAP[ch] : ch));

  // 3. Uzun yuridik iboralar
  for (const re of LEGAL_PHRASES) t = t.replace(re, ' ');

  // 4. Qisqartmalar (bir necha marta — ketma-ket kelganda ham tozalansin)
  for (let i = 0; i < 3; i++) t = t.replace(LEGAL_WORD_RE, '$1 $3');

  // 5. X/H va Q/K yozuv farqlarini bir xillashtirish
  t = t.replace(/X/g, 'H').replace(/Q/g, 'K');

  // 6. Faqat harf va raqam qoladi
  t = t.replace(/[^A-Z0-9]/g, '');

  return t;
}

// ------------------------------------------------------------
// Fayldan varaqlarni o'qish (Excel / HTML-in-xls / CSV)
// ------------------------------------------------------------

interface SheetData {
  file: string;
  sheet: string;
  rows: Cell[][];
}

function decodeText(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf8');
  }
  const utf8 = buf.toString('utf8');
  if (!utf8.includes('�')) return utf8;
  return iconv.decode(buf, 'windows-1251');
}

function detectDelimiter(line: string): string {
  const candidates = [';', '\t', ','];
  let best = ';';
  let bestCount = -1;
  for (const d of candidates) {
    let count = 0;
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === d && !inQuotes) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function parseDelimited(text: string): Cell[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delim = detectDelimiter(firstLine);

  const rows: Cell[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let touched = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      touched = true;
    } else if (ch === '"') {
      inQuotes = true;
      touched = true;
    } else if (ch === delim) {
      row.push(field); field = ''; touched = true;
    } else if (ch === '\n') {
      row.push(field);
      if (touched) rows.push(row);
      row = []; field = ''; touched = false;
    } else if (ch !== '\r') {
      field += ch; touched = true;
    }
  }
  if (touched) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readSheets(input: InputFile): SheetData[] {
  const { name, buffer } = input;
  const head = buffer.subarray(0, 2048).toString('latin1');
  const trimmed = head.trimStart().toLowerCase();
  const looksHtml =
    trimmed.startsWith('<html') || trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<table') || trimmed.startsWith('<head') ||
    trimmed.startsWith('<meta');
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;          // .xlsx
  const isBiff = buffer[0] === 0xd0 && buffer[1] === 0xcf;         // .xls
  const isCsvName = /\.(csv|txt|tsv)$/i.test(name);

  if (isCsvName && !isZip && !isBiff && !looksHtml) {
    return [{ file: name, sheet: 'CSV', rows: parseDelimited(decodeText(buffer)) }];
  }

  let wb: XLSX.WorkBook;
  if (looksHtml || isZip || isBiff) {
    // Umumiy o'quvchi: HTML-in-.xls ni to'g'ri kodirovkada va sanani
    // AQSH tartibida buzmasdan o'qiydi (src/lib/excelWorkbook.ts)
    wb = readWorkbookSmart(buffer);
  } else {
    // Kengaytmasi noto'g'ri CSV bo'lishi mumkin
    return [{ file: name, sheet: 'CSV', rows: parseDelimited(decodeText(buffer)) }];
  }

  const out: SheetData[] = [];
  // ASBT/ABS eksportlari sarlavhani ALOHIDA varaqqa yozadi («Справка о
  // кредитовых оборотах...» 3-varaqda, jadval 4-varaqda). Sarlavha
  // qo'shib berilmasa, ko'chirmaning debet yoki kredit ekanligi
  // yo'qoladi va kirim chiqim bo'lib hisoblanib qoladi.
  let carriedTitle: Cell[][] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as Cell[][];
    if (!rows.length) continue;

    if (isStatementTitleSheet(rows)) {
      carriedTitle = carriedTitle.concat(rows);
      continue;
    }

    out.push({
      file: name,
      sheet: sheetName,
      rows: carriedTitle.length ? [...carriedTitle, ...rows] : rows,
    });
    carriedTitle = [];
  }
  return out;
}

/** Faqat ko'chirma sarlavhasi turgan varaq (jadvalsiz). Shart qat'iy:
 *  tanish sarlavha matni bo'lishi VA hech bir qatorda 4 tadan ortiq
 *  to'ldirilgan katak bo'lmasligi kerak - aks holda 2-3 o'tkazmali
 *  haqiqiy varaq ham sarlavha deb tashlab yuborilishi mumkin edi. */
const STATEMENT_TITLE_RE = /СПРАВКА|СВЕДЕНИЯ О РАБОТЕ|ОБОРОТАХ ПО СЧ[ЕЁ]ТУ|БАНКОВСКАЯ СИСТЕМА|ВЫПИСКА/i;

function isStatementTitleSheet(rows: Cell[][]): boolean {
  if (rows.length > 8) return false;
  let hasTitle = false;
  for (const row of rows) {
    let filled = 0;
    for (const v of row || []) {
      const s = v === null || v === undefined ? '' : String(v).trim();
      if (!s) continue;
      filled++;
      if (STATEMENT_TITLE_RE.test(s)) hasTitle = true;
    }
    if (filled > 4) return false;
  }
  return hasTitle;
}

// ------------------------------------------------------------
// Shapka (header) qatorini topish
// ------------------------------------------------------------

interface HeaderHit {
  rowIndex: number;
  cols: Record<string, number>;
}

function findHeader(
  rows: Cell[][],
  spec: Array<{ role: string; re: RegExp }>,
  required: string[],
  limit = 30
): HeaderHit | null {
  const max = Math.min(limit, rows.length);
  for (let r = 0; r < max; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;

    const cols: Record<string, number> = {};
    for (let c = 0; c < Math.min(row.length, 60); c++) {
      const text = cellText(row[c]).toUpperCase();
      if (!text) continue;
      // Shapka katagi - qisqa yorliq. Ko'chirmaning tepasidagi uzun
      // sarlavha satrlari shapka bo'lib qolmasligi kerak: masalan
      // «ТОШКЕНТ Ш., "МИКРОКРЕДИТБАНК" АТБ БОШ ОФИСИ» ichida КРЕДИТ,
      // «ABS/Клиент-Банк» ichida КЛИЕНТ so'zi bor.
      if (text.length > 40) continue;
      for (const { role, re } of spec) {
        if (cols[role] === undefined && re.test(text)) {
          cols[role] = c;
          break;
        }
      }
    }
    // Haqiqiy shapkada kamida uchta tanish ustun bo'ladi. Bitta-ikkita
    // tasodifiy moslik - bu shapka emas.
    if (Object.keys(cols).length >= 3 && required.every((role) => cols[role] !== undefined)) {
      return { rowIndex: r, cols };
    }
  }
  return null;
}

const TOTAL_ROW_RE = /(^|[^А-ЯЁA-Z])(ИТОГО|ЖАМИ|ВСЕГО|JAMI|TOTAL|ОБОРОТ ВСЕГО|ОБОРОТЫ ВСЕГО)([^А-ЯЁA-Z]|$)/;

// Ba'zi ko'chirmalarda yakuniy qator «ИТОГО» emas, «Сумма оборотов» /
// «Количество оборотов» / «Исходящий остаток» deb yoziladi. Bular oddiy
// o'tkazma sifatida qo'shilib ketsa, yil summasi IKKI BARAVAR bo'lib
// ketadi. Ibora FAQAT qator boshidan moslashtiriladi — «Комиссионные
// доходы по дебетовым оборотам» kabi haqiqiy nomlar o'chib ketmasin.
const FOOTER_ROW_RE = new RegExp(
  '^(СУММА ОБОРОТОВ|КОЛИЧЕСТВО ОБОРОТОВ|ОБОРОТ(Ы)? (ВСЕГО|ЗА)|' +
  // «Итоговый оборот за период:» — ИТОГО дан keyin harf turgani uchun
  // TOTAL_ROW_RE uni tutmaydi, natijada butun oborotka summasi yana bir
  // marta o'tkazma bo'lib qo'shilib ketardi (yil summasi 2 baravar)
  'ИТОГОВ|' +
  'ВХОДЯЩИЙ ОСТАТОК|ИСХОДЯЩИЙ ОСТАТОК|ОСТАТОК (НА|ЗА)|САЛЬДО|' +
  'БАНКОВСКАЯ СИСТЕМА|РУКОВОДИТЕЛЬ|ГЛАВНЫЙ|ИСПОЛНИТЕЛЬ)'
);

// Shu dasturning O'ZI chiqargan natija fayli qaytadan yuklanганини aniqlash.
// Bunday fayl na bank ko'chirmasi, na faktura reestri - lekin jim o'tkazib
// yuborilsa, foydalanuvchi haqiqiy oborotkani yuklamaganini sezmay qoladi.
function isOwnExportSheet(rows: Cell[][]): boolean {
  const limit = Math.min(8, rows.length);
  for (let r = 0; r < limit; r++) {
    const text = (rows[r] || []).map((v) => cellText(v)).join('|').toUpperCase();
    if (!text.includes('ФИРМА НОМЛАРИ')) continue;
    // Sarlavhalar 2026-08-13 da o'zgardi («келган пул» → «тушган пул»,
    // «счет-ф» → «фактура»). ESKI shakl ham qoldirilgan: foydalanuvchining
    // papkasida ilgari chiqarilgan fayllar turibdi va ular ham tanilishi
    // kerak — aks holda himoya jimgina ishlamay qo'yardi.
    if (/(КЕЛГАН|ЧИҚҚАН|ЧИККАН|ТУШГАН|ТЎЛАНГАН|ТУЛАНГАН)\s+ПУЛ\s+ЖАМИ/.test(text)) return true;
    if (/СЧЕТ-Ф\s+ЖАМИ/.test(text)) return true;
    if (/(ЁЗИЛГАН|ЕЗИЛГАН|КЕЛГАН)\s+ФАКТУРА\s+ЖАМИ/.test(text)) return true;
  }
  return false;
}

// Varaqda umuman ma'lumot bormi? (bo'sh/dekorativ varaqlar uchun
// keraksiz ogohlantirish chiqmasligi kerak)
function hasContent(rows: Cell[][]): boolean {
  let filled = 0;
  for (const row of rows) {
    if (!row) continue;
    for (const v of row) if (cellText(v) !== '') { filled++; break; }
    if (filled >= 5) return true;
  }
  return false;
}

function isTotalRow(row: Cell[]): boolean {
  for (let c = 0; c < Math.min(row.length, 4); c++) {
    const s = cellText(row[c]).toUpperCase();
    if (!s) continue;
    if (TOTAL_ROW_RE.test(s)) return true;
    if (c < 2 && FOOTER_ROW_RE.test(s.replace(/\s+/g, ' '))) return true;
  }
  return false;
}

// ------------------------------------------------------------
// 1) СЧЁТ-ФАКТУРА REESTRI (E-faktura portali eksporti)
// ------------------------------------------------------------

const FACTURA_SPEC = [
  { role: 'status', re: /^(СТАТУС|STATUS|HOLAT|ҲОЛАТ|ХОЛАТ)$/ },
  { role: 'sellerInn', re: /ПРОДАВЕЦ.*(ИНН|ПИНФЛ|СТИР)|СОТУВЧИ.*(СТИР|ИНН)|(ИНН|СТИР).*ПРОДАВЦА/ },
  { role: 'sellerName', re: /ПРОДАВЕЦ.*(НАИМЕНОВАНИЕ|НОМ)|СОТУВЧИ.*НОМИ/ },
  { role: 'buyerInn', re: /ПОКУПАТЕЛ.*(ИНН|ПИНФЛ|СТИР)|ХАРИДОР.*(СТИР|ИНН)|(ИНН|СТИР).*ПОКУПАТЕЛ/ },
  { role: 'buyerName', re: /ПОКУПАТЕЛ.*(НАИМЕНОВАНИЕ|НОМ)|ХАРИДОР.*НОМИ/ },
  { role: 'amount', re: /СУММА К ОПЛАТЕ|ТЎЛОВГА|ТУЛОВГА|УМУМИЙ СУММА|ЖАМИ СУММА/ },
  { role: 'doc', re: /СЧ[ЁЕ]Т-?ФАКТУРА|ҲИСОБ-?ФАКТУРА|ХИСОБ-?ФАКТУРА|ФАКТУРА №/ },
  { role: 'id', re: /^ID$/ },
];

// Faqat ikkala tomon tasdiqlagan fakturalar hisobga olinadi
function isConfirmedStatus(s: string): boolean {
  const t = s.toLowerCase();
  return t.includes('подтверж') || t.includes('тасдиқ') || t.includes('тасдик') ||
         t.includes('tasdiq') || t.includes('confirm');
}

// BEKOR QILINGAN fakturalar — bular HECH QACHON hisoblanmaydi.
// «Ожидает подписи партнёра» (imzo kutilmoqda) esa boshqa narsa:
// faktura yozib berilgan, faqat qarshi tomon hali imzolamagan. Buxgalteriya
// qoidasi bo'yicha u hali kuchga kirmagan — shuning uchun STANDART holatda
// hisoblanmaydi, lekin ba'zi buxgalterlar sverkaga qo'shadi (chiqim
// tomonida ham aynan shu tanlov bor: statementAudit.ts `includePending`).
const REJECTED_RE = /отмен|отказ|недейств|аннулир|bekor|rad et|бекор|рад эт/;

function isRejectedStatus(s: string): boolean {
  return REJECTED_RE.test(s.toLowerCase());
}

function looksLikeFacturaSheet(rows: Cell[][]): HeaderHit | null {
  return findHeader(rows, FACTURA_SPEC, ['amount', 'doc'], 30);
}

interface ParsedInvoice {
  inn: string;
  name: string;
  date: Date | null;
  number: string;
  amount: number;
  status: string;
  id: string;
}

interface FacturaSheetResult {
  invoices: ParsedInvoice[];
  skipped: Map<string, { count: number; amount: number }>;
  /** Hisoblangan, lekin hali imzolanmagan («Ожидает подписи партнёра») */
  pending: Map<string, { count: number; amount: number }>;
  ownInn: string;
  ownName: string;
  direction: 'SENT' | 'RECEIVED' | 'UNKNOWN';
}

function parseFacturaSheet(
  rows: Cell[][],
  hit: HeaderHit,
  includePending: boolean
): FacturaSheetResult {
  const c = hit.cols;
  const start = hit.rowIndex + 1;

  const invoices: ParsedInvoice[] = [];
  const skipped = new Map<string, { count: number; amount: number }>();
  const pending = new Map<string, { count: number; amount: number }>();

  // Kimning reestri ekanini aniqlash: ustunlardan qaysi birida
  // bitta STIR deyarli hamma qatorda takrorlansa - o'sha bizniki.
  function dominantInn(col: number | undefined): { inn: string; name: string; share: number } {
    if (col === undefined) return { inn: '-', name: '', share: 0 };
    const counts = new Map<string, number>();
    let total = 0;
    for (let i = start; i < rows.length; i++) {
      const inn = cleanInn(rows[i]?.[col]);
      if (!isValidInn(inn)) continue;
      counts.set(inn, (counts.get(inn) || 0) + 1);
      total++;
    }
    let bestInn = '-';
    let bestCount = 0;
    for (const [inn, n] of counts) {
      if (n > bestCount) { bestCount = n; bestInn = inn; }
    }
    return { inn: bestInn, name: '', share: total ? bestCount / total : 0 };
  }

  const seller = dominantInn(c.sellerInn);
  const buyer = dominantInn(c.buyerInn);

  let direction: 'SENT' | 'RECEIVED' | 'UNKNOWN' = 'UNKNOWN';
  if (seller.share >= 0.7 && seller.share >= buyer.share) direction = 'SENT';
  else if (buyer.share >= 0.7) direction = 'RECEIVED';

  // SENT: kontragent = xaridor. RECEIVED: kontragent = sotuvchi.
  const partyInnCol = direction === 'RECEIVED' ? c.sellerInn : c.buyerInn;
  const partyNameCol = direction === 'RECEIVED' ? c.sellerName : c.buyerName;
  const ownInn = direction === 'RECEIVED' ? buyer.inn : seller.inn;
  const ownNameCol = direction === 'RECEIVED' ? c.buyerName : c.sellerName;

  let ownName = '';
  const seenIds = new Set<string>();

  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;
    if (isTotalRow(row)) continue;

    const amount = parseAmount(row[c.amount]);
    if (amount <= 0) continue;

    const status = cellText(row[c.status]);
    const docStr = cellText(row[c.doc]);

    // Takror qatorlar (ID bo'lsa - ID bo'yicha, aks holda hujjat+summa)
    const idVal = c.id !== undefined ? cellText(row[c.id]) : '';
    const sig = idVal || `${docStr}|${cellText(row[partyInnCol ?? -1])}|${amount}`;
    if (sig && seenIds.has(sig)) continue;
    if (sig) seenIds.add(sig);

    // Bekor qilingan / rad etilgan — HECH QACHON hisoblanmaydi
    if (status && isRejectedStatus(status)) {
      const prev = skipped.get(status) || { count: 0, amount: 0 };
      prev.count++;
      prev.amount += amount;
      skipped.set(status, prev);
      continue;
    }
    // Tasdiqlanmagan, lekin bekor ham qilinmagan (imzo kutilmoqda)
    if (status && !isConfirmedStatus(status)) {
      const bucket = includePending ? pending : skipped;
      const prev = bucket.get(status) || { count: 0, amount: 0 };
      prev.count++;
      prev.amount += amount;
      bucket.set(status, prev);
      if (!includePending) continue;
    }

    if (!ownName && ownNameCol !== undefined) ownName = cellText(row[ownNameCol]);

    const inn = partyInnCol !== undefined ? cleanInn(row[partyInnCol]) : '-';
    const name = partyNameCol !== undefined ? cellText(row[partyNameCol]) : '';

    invoices.push({
      inn: isValidInn(inn) ? inn : '-',
      name,
      date: parseDate(docStr),
      number: docStr,
      amount,
      status,
      id: idVal,
    });
  }

  return { invoices, skipped, pending, ownInn, ownName, direction };
}

// ------------------------------------------------------------
// 2) BANK KO'CHIRMASI — kredit (kirim) qatorlari
// ------------------------------------------------------------

const BANK_SPEC = [
  { role: 'name', re: /НАИМЕНОВАН|КОНТРАГЕНТ|КОРРЕСПОНДЕНТ|КЛИЕНТ|ПЛАТЕЛЬЩИК|ОТПРАВИТЕЛ|ТЎЛОВЧИ|ТУЛОВЧИ|ЮБОРУВЧИ|НОМИ|NOMI/ },
  { role: 'inn', re: /(^|[^А-ЯЁA-Z0-9])(ИНН|СТИР|INN|STIR)([^А-ЯЁA-Z0-9]|$)/ },
  { role: 'date', re: /ДАТА|САНА|^DATE$/ },
  { role: 'debit', re: /ДЕБЕТ|ДЕБИТ|РАСХОД|ЧИҚИМ|ЧИКИМ|СПИСАН|DEBET|DEBIT/ },
  { role: 'credit', re: /КРЕДИТ|ПРИХОД|КИРИМ|ЗАЧИСЛ|ПОСТУПЛ|CREDIT|KREDIT|KIRIM/ },
  { role: 'purpose', re: /НАЗНАЧЕН|МАҚСАД|МАКСАД|ИЗОҲ|ИЗОХ|ДЕТАЛИ/ },
  { role: 'docNo', re: /НОМЕР ДОК|№ ДОК|ДОК-ТА|ҲУЖЖАТ|ХУЖЖАТ/ },
  { role: 'account', re: /^(СЧ[ЁЕ]Т|СЧ[ЁЕ]Т КОРР\.?|Р\/С|ЛИЦЕВОЙ СЧ[ЁЕ]Т|HISOB)$/ },
];

interface ParsedPayment {
  inn: string;
  name: string;
  account: string;
  date: Date | null;
  amount: number;
  doc: string;
  purpose: string;
}

interface BankSheetResult {
  payments: ParsedPayment[];
  totalCredit: number;
  totalDebit: number;
  rowCount: number;
  ownAccount: string;
}

// "hisob/STIR/nomi" ko'rinishidagi birlashgan katak (ba'zi banklarda)
function splitCombined(s: string): { inn: string; name: string } | null {
  const m = s.match(/^(\d{12,})\s*\/\s*(\d{9}|\d{14})\s*\/\s*(.+)$/);
  if (!m || !isValidInn(m[2])) return null;
  return { inn: m[2], name: m[3].trim() };
}

function parseBankSheet(rows: Cell[][], hit: HeaderHit): BankSheetResult {
  const c = hit.cols;
  let start = hit.rowIndex + 1;

  // Shapkadan keyingi "1 2 3 4 ..." tartib qatorini tashlab yuborish
  const next = rows[start];
  if (next) {
    const vals = next.filter((v) => cellText(v) !== '');
    const ints = vals.filter((v) => {
      const n = Number(cellText(v));
      return Number.isInteger(n) && n >= 0 && n <= 99;
    });
    if (vals.length >= 3 && ints.length / vals.length >= 0.8) start++;
  }

  // Hisob egasining o'z hisob raqami — sarlavhadan ("СПРАВКА ПО РАБОТЕ
  // СЧЕТА - 20208000805571760001"). O'z hisobiga ichki o'tkazmalar
  // kontragent emas.
  let ownAccount = '';
  for (let r = 0; r < Math.min(hit.rowIndex, 6); r++) {
    const line = (rows[r] || []).map((v) => cellText(v)).join(' ');
    const m = line.match(/(?:СЧ[ЁЕ]ТА?|HISOB)\D{0,12}(\d{20})/i) || line.match(/\b(\d{20})\b/);
    if (m) { ownAccount = m[1]; break; }
  }

  const payments: ParsedPayment[] = [];
  let totalCredit = 0;
  let totalDebit = 0;
  let rowCount = 0;

  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    if (isTotalRow(row)) continue;

    const debit = c.debit !== undefined ? parseAmount(row[c.debit]) : 0;
    const credit = c.credit !== undefined ? parseAmount(row[c.credit]) : 0;
    if (debit <= 0 && credit <= 0) continue;

    rowCount++;
    if (debit > 0) totalDebit += debit;
    if (credit <= 0) continue;
    totalCredit += credit;

    let name = c.name !== undefined ? cellText(row[c.name]) : '';
    let inn = c.inn !== undefined ? cleanInn(row[c.inn]) : '-';
    const account = c.account !== undefined ? cellText(row[c.account]) : '';

    if (!isValidInn(inn)) {
      for (let col = 0; col < row.length; col++) {
        const comb = splitCombined(cellText(row[col]));
        if (comb) {
          inn = comb.inn;
          if (!name) name = comb.name;
          break;
        }
      }
    }

    payments.push({
      inn: isValidInn(inn) ? inn : '-',
      name,
      account,
      date: c.date !== undefined ? parseDate(row[c.date]) : null,
      amount: credit,
      doc: c.docNo !== undefined ? cellText(row[c.docNo]) : '',
      purpose: c.purpose !== undefined ? cellText(row[c.purpose]) : '',
    });
  }

  return { payments, totalCredit, totalDebit, rowCount, ownAccount };
}

// ------------------------------------------------------------
// ASOSIY: fayllarni o'qib, kirim–faktura solishtiruvini qurish
// ------------------------------------------------------------

export interface IncomeOptions {
  /** «Ожидает подписи партнёра» ҳолатидаги фактураларни ҳам ҳисоблаш.
   *  Стандарт ҲОЛАТДА ЙЎҚ: имзоланмаган фактура ҳали кучга кирмаган.
   *  Чиқим сверкасидаги `includePending` билан айнан бир хил. */
  includePending?: boolean;
}

export function analyzeIncome(files: InputFile[], options: IncomeOptions = {}): IncomeReport {
  const includePending = options.includePending === true;
  const warnings: string[] = [];
  const bankSheets: string[] = [];
  const facturaSheets: string[] = [];
  const unrecognized: string[] = [];

  const allInvoices: ParsedInvoice[] = [];
  const allPayments: ParsedPayment[] = [];
  const skippedMap = new Map<string, { count: number; amount: number }>();
  const balanceChecks: BalanceCheck[] = [];

  let ownInn = '-';
  let ownName = '';
  let ownAccount = '';
  let bankRowCount = 0;
  let totalCreditRaw = 0;
  let totalDebitRaw = 0;

  // Aynan bir xil fayl ikki marta tanlangan bo'lsa - ikkinchisi o'qilmaydi
  // (summa ikkilanib ketmasligi uchun)
  const seenFileHash = new Map<string, string>();

  for (const file of files) {
    const hash = createHash('sha1').update(file.buffer).digest('hex');
    const twin = seenFileHash.get(hash);
    if (twin) {
      warnings.push(`"${file.name}" — "${twin}" файлининг айнан нусхаси, иккинчи марта ҳисобланмади.`);
      continue;
    }
    seenFileHash.set(hash, file.name);

    let sheets: SheetData[];
    try {
      sheets = readSheets(file);
    } catch (e) {
      warnings.push(`"${file.name}" faylini o'qib bo'lmadi: ${(e as Error).message}`);
      continue;
    }

    // QOLDIQ TENGLAMASI fayl bo'yicha yig'iladi: ASBT eksportida debet va
    // kredit alohida varaqlarda, oxirgi qoldiq esa faqat oxirgisida.
    const tally = newBalanceTally();

    for (const sd of sheets) {
      const label = `${sd.file}${sd.sheet !== 'CSV' ? ` / ${sd.sheet}` : ''}`;

      if (isOwnExportSheet(sd.rows)) {
        warnings.push(
          `"${sd.file}" — бу шу дастур ЧИҚАРГАН ҳисобот файли, кириш файли эмас. ` +
          `Ҳисобга олинмади: ўша йилнинг ҲАҚИҚИЙ банк кўчирмасини юкланг.`
        );
        continue;
      }

      const facturaHit = looksLikeFacturaSheet(sd.rows);
      if (facturaHit) {
        const res = parseFacturaSheet(sd.rows, facturaHit, includePending);
        if (res.invoices.length === 0 && res.skipped.size === 0) continue;

        facturaSheets.push(`${sd.file}${sd.sheet !== 'CSV' ? ` / ${sd.sheet}` : ''}`);

        if (res.direction === 'RECEIVED') {
          warnings.push(
            `"${sd.file}" — бу КЕЛГАН фактуралар реестри. Бу саҳифа ЮБОРИЛГАН (sent) фактуралар учун; барибир солиштирувга қўшилди.`
          );
        } else if (res.direction === 'UNKNOWN') {
          warnings.push(`"${sd.file}" — фактура реестрида ўз СТИРингиз аниқланмади, натижа тахминий.`);
        }

        if (ownInn === '-' && res.ownInn !== '-') ownInn = res.ownInn;
        if (!ownName && res.ownName) ownName = res.ownName;

        allInvoices.push(...res.invoices);
        for (const [status, v] of res.pending) {
          warnings.push(
            `"${sd.file}" — «${status}» ҳолатидаги ${v.count} та фактура ` +
            `(${v.amount.toLocaleString('ru-RU')}) ҲИСОБГА ОЛИНДИ ` +
            `(фактура ёзиб берилган, фақат имзо кутилмоқда).`
          );
        }
        for (const [status, v] of res.skipped) {
          const prev = skippedMap.get(status) || { count: 0, amount: 0 };
          prev.count += v.count;
          prev.amount += v.amount;
          skippedMap.set(status, prev);
        }
        continue;
      }

      // YANGI SHAKLLAR (ASBT «дебетовых/кредитовых оборотах» va uch
      // qatorli «Справка о работе счета»). Bular quyidagi umumiy
      // shapka-qidiruvidan OLDIN tekshiriladi: uch qatorli shaklda
      // shapka topilsa ham kontragent nomi o'rniga «МФО:.. Счет:..»
      // o'qilib qolar edi. Imzo mos kelmasa null qaytadi va hammasi
      // avvalgidek davom etadi.
      const newFormat = parseNewBankFormats(sd.rows);
      if (newFormat) {
        bankSheets.push(label);
        if (!ownAccount && newFormat.ownAccount) ownAccount = newFormat.ownAccount;
        if (ownInn === '-' && newFormat.ownInn) ownInn = newFormat.ownInn;
        if (!ownName && newFormat.ownName) ownName = newFormat.ownName;

        bankRowCount += newFormat.txs.length;
        totalCreditRaw += newFormat.totalCredit;
        totalDebitRaw += newFormat.totalDebit;

        tally.sheets++;
        tally.debit += newFormat.totalDebit;
        tally.credit += newFormat.totalCredit;
        absorbBalances(tally, newFormat.balances);

        for (const tx of newFormat.txs) {
          if (tx.credit <= 0) continue;
          allPayments.push({
            inn: tx.inn && isValidInn(tx.inn) ? tx.inn : '-',
            name: tx.name,
            account: tx.account,
            date: tx.date,
            amount: tx.credit,
            doc: tx.doc,
            purpose: tx.purpose,
          });
        }
        continue;
      }

      // Bank ko'chirmasi: "Кредит" ustuni SHART. Ba'zi banklar faqat
      // kirim (kredit) ko'chirmasini beradi - unda "Дебет" bo'lmaydi,
      // shuning uchun sana+nom ustunlari bo'lsa ham qabul qilinadi.
      const bankHit = findHeader(sd.rows, BANK_SPEC, ['credit'], 40);
      const bankOk = bankHit && (
        bankHit.cols.debit !== undefined ||
        (bankHit.cols.name !== undefined && bankHit.cols.date !== undefined)
      );
      if (bankHit && bankOk) {
        const res = parseBankSheet(sd.rows, bankHit);
        if (res.rowCount > 0) {
          bankSheets.push(label);
          if (!ownAccount && res.ownAccount) ownAccount = res.ownAccount;
          bankRowCount += res.rowCount;
          totalCreditRaw += res.totalCredit;
          totalDebitRaw += res.totalDebit;

          // Eski shakl parseri qoldiqni o'qimaydi — qoldiq ustunlar
          // xaritasiga bog'liq emas, shuning uchun qatorlardan mustaqil
          // ravishda topiladi.
          tally.sheets++;
          tally.debit += res.totalDebit;
          tally.credit += res.totalCredit;
          absorbBalances(tally, findAccountBalances(sd.rows));

          allPayments.push(...res.payments);
          continue;
        }
      }

      // Na bank kо'chirmasi, na faktura reestri — jim o'tkazib yuborilmaydi
      if (hasContent(sd.rows)) unrecognized.push(label);
    }

    // Fayl tugadi — qoldiq tenglamasi. Bu «Итого»dan mustaqil nazorat:
    // debet bilan kredit almashib ketsa «Итого» sezmaydi, bu sezadi.
    if (tally.sheets > 0) {
      const { check, warning } = checkBalanceEquation(file.name, tally);
      balanceChecks.push(check);
      if (warning) warnings.push(warning);
    }
  }

  if (unrecognized.length > 0) {
    warnings.push(
      `Қуйидаги файл/варақ танилмади ва ҲИСОБГА ОЛИНМАДИ: ${unrecognized.slice(0, 6).join('; ')}` +
      `${unrecognized.length > 6 ? ` (яна ${unrecognized.length - 6} та)` : ''}. ` +
      `Банк кўчирмасида «Дебет/Кредит» устунлари, фактура реестрида «СУММА К ОПЛАТЕ» устуни бўлиши керак.`
    );
  }
  if (bankSheets.length === 0) warnings.push('Банк кўчирмаси топилмади — фақат фактуралар ҳисобланди.');
  if (facturaSheets.length === 0) warnings.push('Счёт-фактура реестри топилмади — фақат банк кирими ҳисобланди.');

  // --- Takroriy fakturalarni olib tashlash ---
  // Bir xil davr uchun ikki marta eksport qilingan reestrlar (yoki bitta
  // fayl ikki marta yuklangan holat) summani ikkilantirib yubormasligi kerak.
  const seenInvoice = new Set<string>();
  const uniqueInvoices: ParsedInvoice[] = [];
  let dupInvoiceCount = 0;
  let dupInvoiceSum = 0;
  for (const inv of allInvoices) {
    const sig = inv.id || `${inv.number}|${inv.inn}|${inv.amount}`;
    if (seenInvoice.has(sig)) {
      dupInvoiceCount++;
      dupInvoiceSum += inv.amount;
      continue;
    }
    seenInvoice.add(sig);
    uniqueInvoices.push(inv);
  }
  if (dupInvoiceCount > 0) {
    warnings.push(
      `${dupInvoiceCount} та такрорий счёт-фактура (${dupInvoiceSum.toLocaleString('ru-RU')} сўм) ` +
      `бир марта ҳисобланди — файллар устма-уст тушган.`
    );
  }

  // --- Kontragentlar jadvali ---
  const parties = new Map<string, PartyRow>();
  const byInn = new Map<string, string>();               // STIR -> key
  const normIndex = new Map<string, Set<string>>();      // normallashgan nom -> key(lar)

  // Nom bo'yicha ulash FAQAT bitta nomzod bo'lganda ishonchli.
  // Ikki xil STIRli firma bir xil nomga normallашса - taxmin qilinmaydi.
  function resolveByNorm(norm: string): string | null {
    if (!norm) return null;
    const set = normIndex.get(norm);
    if (!set || set.size !== 1) return null;
    return [...set][0];
  }
  function indexNorm(norm: string, key: string) {
    if (!norm) return;
    let set = normIndex.get(norm);
    if (!set) { set = new Set(); normIndex.set(norm, set); }
    set.add(key);
  }
  const ambiguousNames = new Set<string>();

  const ownNorm = normalizeName(ownName);
  // Ko'rsatiladigan nom uchun E-faktura reestridagi rasmiy nom ustun turadi
  // (bankdagi nom "ИП ООО ..." kabi qisqartma/tarjima bo'lishi mumkin)
  const officialName = new Set<string>();

  function touch(key: string, inn: string, name: string, official = false): PartyRow {
    let p = parties.get(key);
    if (!p) {
      p = {
        key,
        inn,
        name,
        aliases: [],
        bankCredit: 0,
        facturaSent: 0,
        difference: 0,
        monthly: {},
        payments: [],
        invoices: [],
      };
      parties.set(key, p);
    }
    if (p.inn === '-' && inn !== '-') p.inn = inn;
    if (name && !p.aliases.includes(name)) p.aliases.push(name);

    if (name) {
      const pretty = prettifyName(name);
      if (official) {
        if (!officialName.has(key) || pretty.length > p.name.length) p.name = pretty;
        officialName.add(key);
      } else if (!officialName.has(key) && pretty.length > p.name.length) {
        p.name = pretty;
      }
    }
    return p;
  }

  function bucket(p: PartyRow, period: string): MonthBucket {
    if (!p.monthly[period]) p.monthly[period] = { credit: 0, factura: 0 };
    return p.monthly[period];
  }

  // 1. Avval fakturalar — ularda STIR har doim bor, indeks shular asosida quriladi.
  //    MUHIM: STIR bo'lsa, kalit FAQAT STIR bo'yicha olinadi. Nom bo'yicha
  //    birlashtirish bu yerda ishlatilmaydi — aks holda nomi o'xshash, lekin
  //    STIRi boshqa ikki firma bitta qatorga qo'shilib ketishi mumkin edi.
  for (const inv of uniqueInvoices) {
    const norm = normalizeName(inv.name);
    const key = inv.inn !== '-'
      ? (byInn.get(inv.inn) || `INN:${inv.inn}`)
      : (resolveByNorm(norm) || `NAME:${norm || 'UNKNOWN'}`);

    const p = touch(key, inv.inn, inv.name, true);
    if (inv.inn !== '-') byInn.set(inv.inn, key);
    indexNorm(norm, key);

    p.facturaSent += inv.amount;
    bucket(p, periodKey(inv.date)).factura += inv.amount;
    p.invoices.push({ date: isoDay(inv.date), number: inv.number, amount: inv.amount });
  }

  // 2. Bank kirimlari — STIR bo'lsa STIR bo'yicha, aks holda nom bo'yicha ulanadi
  let ownTransferTotal = 0;
  const paySignatures = new Set<string>();
  let dupPayCount = 0;
  let dupPaySum = 0;

  for (const pay of allPayments) {
    const norm = normalizeName(pay.name);

    // O'z hisobvarag'i ichidagi harakat — kontragent emas
    if ((ownAccount && pay.account && pay.account === ownAccount) ||
        (ownNorm && norm && norm === ownNorm) ||
        (ownInn !== '-' && pay.inn === ownInn)) {
      ownTransferTotal += pay.amount;
      continue;
    }

    // Bir xil ko'chirma ikki marta yuklanганini sezish uchun (o'chirilmaydi,
    // faqat ogohlantiriladi — bir kunda bir xil summali ikki to'lov ham bo'ladi)
    const sig = `${isoDay(pay.date)}|${pay.amount}|${norm}|${pay.doc}`;
    if (paySignatures.has(sig)) { dupPayCount++; dupPaySum += pay.amount; }
    else paySignatures.add(sig);

    let key: string | undefined;
    if (pay.inn !== '-') {
      key = byInn.get(pay.inn);
      if (!key) {
        // Bankdagi STIR fakturalar ичida topilmadi: nom bo'yicha faqat
        // STIRi noma'lum qatorga qo'shilishi mumkin
        const nk = resolveByNorm(norm);
        if (nk && parties.get(nk)?.inn === '-') key = nk;
      }
      if (!key) key = `INN:${pay.inn}`;
    } else {
      key = resolveByNorm(norm) || undefined;
      if (!key && norm && (normIndex.get(norm)?.size || 0) > 1) ambiguousNames.add(pay.name);
      if (!key) key = `NAME:${norm || 'UNKNOWN'}`;
    }

    const p = touch(key, pay.inn, pay.name);
    if (pay.inn !== '-') byInn.set(pay.inn, key);
    indexNorm(norm, key);

    p.bankCredit += pay.amount;
    bucket(p, periodKey(pay.date)).credit += pay.amount;
    p.payments.push({
      date: isoDay(pay.date),
      amount: pay.amount,
      doc: pay.doc,
      purpose: pay.purpose,
    });
  }

  if (ownTransferTotal > 0) {
    warnings.push(
      `Ўз ҳисобварағингиз ичидаги ҳаракатлар (${ownTransferTotal.toLocaleString('ru-RU')} сўм) контрагент сифатида ҳисобланмади.`
    );
  }
  if (dupPayCount > 0) {
    warnings.push(
      `ДИҚҚАТ: банк кўчирмасида ${dupPayCount} та бир хил ўтказма топилди ` +
      `(${dupPaySum.toLocaleString('ru-RU')} сўм) — битта файлни икки марта юклаган бўлишингиз мумкин. ` +
      `Улар ҳисобдан чиқарилмади, текширинг.`
    );
  }
  if (ambiguousNames.size > 0) {
    warnings.push(
      `Қуйидаги банк номлари бир нечта фирмага тўғри келгани учун уланмади: ` +
      `${[...ambiguousNames].slice(0, 5).join(', ')}. Уларни қўлда текширинг.`
    );
  }

  // --- Yakuniy hisob-kitob ---
  const list = [...parties.values()];
  for (const p of list) {
    p.difference = p.bankCredit - p.facturaSent;
    p.payments.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    p.invoices.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }
  list.sort((a, b) => b.bankCredit - a.bankCredit || b.facturaSent - a.facturaSent);

  const totals = list.reduce(
    (acc, p) => {
      acc.bankCredit += p.bankCredit;
      acc.facturaSent += p.facturaSent;
      return acc;
    },
    { bankCredit: 0, facturaSent: 0, difference: 0, bankDebit: totalDebitRaw }
  );
  totals.difference = totals.bankCredit - totals.facturaSent;

  // Davr chegaralari
  let from: string | null = null;
  let to: string | null = null;
  for (const p of list) {
    for (const rec of p.payments) {
      if (!rec.date) continue;
      if (!from || rec.date < from) from = rec.date;
      if (!to || rec.date > to) to = rec.date;
    }
  }

  // Yillar kesimida (bir necha yillik fayllar birga yuklanганда kerak)
  const NO_DATE = 'Санасиз';
  const yearMap = new Map<string, YearTotal>();
  for (const p of list) {
    for (const [period, b] of Object.entries(p.monthly)) {
      const year = /^\d{4}-\d{2}$/.test(period) ? period.slice(0, 4) : NO_DATE;
      let y = yearMap.get(year);
      if (!y) { y = { year, bankCredit: 0, facturaSent: 0, difference: 0 }; yearMap.set(year, y); }
      y.bankCredit += b.credit;
      y.facturaSent += b.factura;
    }
  }
  const byYear = [...yearMap.values()]
    .map((y) => ({ ...y, difference: y.bankCredit - y.facturaSent }))
    .sort((a, b) => {
      if (a.year === NO_DATE) return 1;
      if (b.year === NO_DATE) return -1;
      return a.year.localeCompare(b.year);
    });

  // Yil bo'yicha fayl yetishmayotganini aniqlash — eng xavfli xato shu:
  // masalan 2026 fakturalari yuklanган, lekin 2026 oborotkasi unutilgan
  // bo'lsa, butun yil "mijoz qarzdor" bo'lib chiqadi.
  for (const y of byYear) {
    if (y.year === NO_DATE) continue;
    if (y.bankCredit === 0 && y.facturaSent > 0) {
      warnings.push(
        `${y.year} йил учун БАНК КЎЧИРМАСИ юкланмаган: ўша йилги ${y.facturaSent.toLocaleString('ru-RU')} сўмлик ` +
        `фактура «қарздор» бўлиб кўринади. Ўша йилнинг обороткасини ҳам юкланг.`
      );
    } else if (y.facturaSent === 0 && y.bankCredit > 0) {
      warnings.push(
        `${y.year} йил учун СЧЁТ-ФАКТУРА РЕЕСТРИ юкланмаган: ўша йилги ${y.bankCredit.toLocaleString('ru-RU')} сўмлик ` +
        `кирим «фактура ёзилмаган» бўлиб кўринади. Ўша йилнинг фактура файлини ҳам юкланг.`
      );
    }
  }

  const skippedInvoices: SkippedInvoice[] = [...skippedMap.entries()]
    .map(([status, v]) => ({ status, count: v.count, amount: v.amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    parties: list,
    totals,
    meta: {
      ownInn,
      ownName: prettifyName(ownName),
      bankSheets,
      facturaSheets,
      bankRowCount,
      bankCreditRaw: totalCreditRaw,
      invoiceCount: allInvoices.length,
      skippedInvoices,
      byYear,
      periodFrom: from,
      periodTo: to,
      warnings,
      balanceChecks,
    },
  };
}
