// ============================================================
// CHIQIM SVERKASI - bank ko'chirmasi ↔ kelgan hisob-fakturalar
//
// /api/upload-preview shu moduldan foydalanadi. Mantiq route'dan
// alohida turadi, chunki uni Node'dan haqiqiy bank fayllariga
// qarshi test qilib bo'ladi (route'ni esa bo'lmaydi).
//
// ASOSIY QOIDA: ustun RAQAM bilan emas, SHAPKA NOMI bilan topiladi.
// Banklar eksport shaklini o'zgartiraveradi (ASBT 3 ga МФО va
// Расчетный счет ustunlarini qo'shgani kabi); qattiq indekslar esa
// xato bermay, JIMGINA axlat hisoblaydi - hujjat raqamini summa,
// to'lov maqsadini firma nomi deb o'qiydi.
// ============================================================

import * as XLSX from 'xlsx';
import { readWorkbookSmart } from './excelWorkbook';
import { parseUniversal } from './universalParser';
import {
  fingerprint,
  makeLearnedFormat,
  matchKnownFormat,
  readBankWithFormat,
  type LearnedFormat,
} from './formatMemory';
import {
  resolveCategory,
  CATEGORY_LABELS,
  type Category,
  type CategorySource,
  type GlobalHint,
} from './counterpartyCategory';
import {
  absorbBalances,
  checkBalanceEquation,
  findAccountBalances,
  newBalanceTally,
  parseTwoSidedTurnover,
  parseThreeRowAccountReport,
  parseColumnarStatement,
  parseAmount,
  parseDate,
  sameEntity,
  type BalanceCheck,
  type BalanceTally,
  type BankStatement,
  type Cell,
} from './bankStatements';

export interface MonthlyBucket {
  debit: number;
  credit: number;
}

export interface TxRecord {
  date: string;
  type: string;
  debit: number;
  credit: number;
  doc?: string;
  purpose?: string;
  source?: string;
}

export interface AggEntry {
  /** Barqaror kalit. STIRi yo'q kontragentlar hammasida inn='-' bo'lgani
   *  uchun ro'yxatda belgilash (ptichka) STIR bo'yicha ishlamaydi. */
  key: string;
  inn: string;
  name: string;
  /** Kontragentning hisob raqami (bank ko'chirmasida bo'lsa). Toifani
   *  hududiy ro'yxatsiz aniqlash uchun ishlatiladi — ғазначилик
   *  (23402...) ва банк (452...) ҳисоблари бутун мамлакатда бир хил. */
  account?: string;
  monthlyData: Record<string, MonthlyBucket>;
  transactions: TxRecord[];
  totalDebit: number;
  totalCredit: number;
  difference?: number;
  /** Kommunal/byudjet/bank to'lovlarini asosiy sverkadan ajratish
   *  uchun. Standart har doim 'korxona' — src/lib/counterpartyCategory.ts */
  category: Category;
  categorySource: CategorySource;
  categoryLabel?: string;
  /** Nom bo'yicha taxmin. Qatorni YASHIRMAYDI, faqat belgisi chiqadi. */
  categoryHint?: Category;
  categoryHintLabel?: string;
}

export interface SheetReport {
  file: string;
  sheet: string;
  format: string;
  /** Sverkaga kirgan qatorlar */
  rows: number;
  debit: number;
  credit: number;
  /** Varaqdagi BARCHA o'tkazmalar (o'z hisobvaraqlari harakati bilan birga) */
  allDebit?: number;
  allCredit?: number;
  /** Faylning o'z yakuniy qatoridagi summa (bo'lsa) */
  fileDebit?: number;
  fileCredit?: number;
  note?: string;
  /** FAQAT `TANILMADI` varaqlar uchun: dastlabki qatorlarning matn
   *  kataklari. Ekranda KO'RSATILMAYDI — u yiqilgan fayl jurnaliga
   *  ketadi (`parse_failures`), ya'ni «qaysi shakl tanilmadi» degan
   *  savolga javob beradi. Bu maydonsiz jurnal «yiqildi» deyishdan
   *  boshqa hech narsa aytolmaydi. */
  sampleRows?: string[][];
}

/** QOLDIQ TENGLAMASI natijasi. Mantiqning o'zi `bankStatements.ts` da —
 *  u invariant ikkala sverkaga ham (chiqim va kirim) tegishli. */
export type { BalanceCheck };

/** Fayldan topilgan davr chegarasi (YYYY-MM). Ikkala tomon uchun
 *  alohida: bank ko'chirmasi va faktura ro'yxati boshqa-boshqa davrni
 *  qamrashi mumkin va aynan shu jimgina xatoning manbai. */
export interface PeriodRange {
  from: string | null;
  to: string | null;
  /** Sanasi aniqlanmagan qatorlar soni */
  undated: number;
}

export interface AuditResult {
  data: AggEntry[];
  detectedFormats: string[];
  warnings: string[];
  sheets: SheetReport[];
  /** Har fayl uchun qoldiq tenglamasi natijasi */
  balanceChecks: BalanceCheck[];
  /** Ikkala tomonning topilgan davri. Ekranda foydalanuvchiga
   *  KO'RSATILADI — «tizim nima topdi» degan savolga javob. */
  periods: { bank: PeriodRange; faktura: PeriodRange };
  /** KO'CHIRMA EGASI — ya'ni sverka KIMNING hisobi bo'yicha ketyapti.
   *  Bu qiymat ichkarida allaqachon aniqlanardi (egasining o'z
   *  qatorlarini sverkadan chiqarib tashlash uchun), endi u tashqariga
   *  ham qaytariladi. Hech qanday hisob-kitob o'zgarmagan.
   *  Chaqiruvchi bundan bepul rejadagi oylik sverka sanog'ining
   *  KALITINI yasaydi: sanoq korxona yozuvidan emas, ko'chirmaning
   *  o'zidan olinsa — hammani bitta korxonaga yig'ib aylanib
   *  o'tib bo'lmaydi. */
  own: { inn: string; name: string; account: string };
  /** Raqamini TASDIQLAB bo'lmaydigan fayllar: na «Итого» qatori, na
   *  qoldiq tenglamasi. Ya'ni fayl to'liq o'qilganini isbotlaydigan
   *  hech narsa yo'q — foydalanuvchi qo'lda solishtirishi kerak. */
  unverifiedFiles: string[];
  /** Shu yuklashda YANGI o'rganilgan yoki qayta ishlatilgan shakllar.
   *  Chaqiruvchi (route) ularni Firestore'ga yozib qo'yadi - keyingi
   *  safar shu shapka kelsa, ustunlar taxmin qilinmaydi. */
  learnedFormats: LearnedFormat[];
  skippedInvoices: Array<{ status: string; count: number; amount: number }>;
  totals: { debit: number; credit: number; difference: number };
  /** Toifalar kesimi. `totals` esa HAR DOIM to'liq qoladi — u
   *  faylning o'z «Итого» qatoriga teng bo'lishi kerak, shuning
   *  uchun undan hech narsa chiqarilmaydi. */
  categoryTotals: Record<Category, { debit: number; credit: number; count: number }>;
}

export interface InputFile {
  name: string;
  buffer: Buffer;
}

// ------------------------------------------------------------
// Yordamchilar
// ------------------------------------------------------------

function text(v: Cell): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function up(v: Cell): string {
  return text(v).toUpperCase().replace(/\s+/g, ' ');
}

function cleanInn(v: Cell): string {
  const digits = text(v).replace(/\D/g, '');
  return /^\d{9}$/.test(digits) || /^\d{14}$/.test(digits) ? digits : '';
}

/** Firma nomini solishtirish uchun normallashtirish (STIR yo'q hollarda) */
function normalizeName(s: string): string {
  return s
    .toUpperCase()
    .replace(/[«»"'`’‘]/g, ' ')
    .replace(/(^|\s)(ООО|ОАО|ЗАО|АО|АЖ|МЧЖ|МЧЖ|ХК|ХЖ|ИП|ЧП|OOO|MCHJ|XK|HK|AJ|LLC|LTD|SP|YATT|ЯТТ|ФХ|FX|OK|ОК)(\s|$)/g, ' ')
    .replace(/[^A-ZА-ЯЁ0-9]+/g, '')
    .trim();
}

const MONEY_FMT = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ------------------------------------------------------------
// Fayl ichidagi varaqlar
// ------------------------------------------------------------

interface SheetData {
  file: string;
  sheet: string;
  rows: Cell[][];
}

function readSheets(file: InputFile): SheetData[] {
  const wb = readWorkbookSmart(file.buffer);
  const out: SheetData[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, blankrows: false });
    if (!rows || rows.length === 0) continue;
    out.push({ file: file.name, sheet: sheetName, rows });
  }
  return out;
}

/** Ma'lumot yo'q, faqat sarlavha qatorlari bo'lgan varaqmi?
 *  ASBT/ABS eksportlari sarlavhani ALOHIDA varaqqa yozadi
 *  («Справка о дебетовых оборотах...» 1-varaqda, jadval 2-varaqda) -
 *  shu sarlavha keyingi varaqqa qo'shib berilmasa, ko'chirmaning
 *  debet yoki kredit ekanligi butunlay yo'qoladi. */
function isTitleOnly(rows: Cell[][]): boolean {
  if (rows.length > 8) return false;
  let filled = 0;
  for (const row of rows) for (const v of row) if (text(v) !== '') filled++;
  return filled > 0 && filled <= 24;
}

// ------------------------------------------------------------
// Varaq turini aniqlash
// ------------------------------------------------------------

/** Buxgalterning o'z svodka jadvali (Фирма номлари | СТИР | ойлар...) -
 *  bu tranzaksiya ro'yxati emas, o'qilsa summa ikki marta hisoblanadi. */
const MONTH_WORDS = ['ЯНВАР', 'ФЕВРАЛ', 'МАРТ', 'АПРЕЛ', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГУСТ', 'СЕНТЯБР', 'ОКТЯБР', 'НОЯБР', 'ДЕКАБР'];

/** «Акт сверки» - ikki tomonlama dalolatnoma. Unda ham sana/summa
 *  ustunlari bor, lekin bu manba emas: o'qilsa o'sha o'tkazmalar
 *  ikkinchi marta hisoblanadi. */
function isReconciliationAct(rows: Cell[][]): boolean {
  const limit = Math.min(6, rows.length);
  for (let r = 0; r < limit; r++) {
    for (const v of rows[r] || []) {
      if (/^АКТ\s+СВЕРКИ|^СОЛИШТИРУВ\s+ДАЛОЛАТНОМА/.test(up(v))) return true;
    }
  }
  return false;
}

function isPivotSheet(rows: Cell[][]): boolean {
  const limit = Math.min(15, rows.length);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row || row.length < 6) continue;
    const line = row.map((v) => up(v)).join('|');
    if (!/СТИР|ИНН|STIR/.test(line)) continue;
    let hits = 0;
    for (const m of MONTH_WORDS) if (line.includes(m)) hits++;
    if (hits >= 4) return true;
  }
  return false;
}

interface InvoiceLayout {
  headerRow: number;
  status: number;
  doc: number;
  id: number;
  sellerInn: number;
  sellerName: number;
  buyerInn: number;
  buyerName: number;
  amount: number;
}

/** Faktura reestri shapkasi. Portal ustunlarni vaqti-vaqti bilan
 *  o'zgartiradi (ID / ТИП ЭСФ / ДОГОВОР / филиал qo'shilgan, СУММА К
 *  ОПЛАТЕ 8-o'rindan 14-o'ringa surilgan), shuning uchun ustunlar
 *  faqat nom bo'yicha topiladi. */
function findInvoiceLayout(rows: Cell[][]): InvoiceLayout | null {
  const limit = Math.min(25, rows.length);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row || row.length < 4) continue;

    const L: InvoiceLayout = {
      headerRow: r, status: -1, doc: -1, id: -1,
      sellerInn: -1, sellerName: -1, buyerInn: -1, buyerName: -1, amount: -1,
    };

    for (let c = 0; c < row.length; c++) {
      const t = up(row[c]);
      if (!t) continue;
      if (L.status === -1 && /^(СТАТУС|STATUS|ҲОЛАТ|ХОЛАТ|HOLAT)$/.test(t)) L.status = c;
      else if (L.doc === -1 && /СЧ[ЁЕ]Т-?ФАКТУРА|ҲИСОБ-?ФАКТУРА|ХИСОБ-?ФАКТУРА/.test(t)) L.doc = c;
      else if (L.id === -1 && /^(ID|ИД)$/.test(t)) L.id = c;
      else if (L.sellerInn === -1 && /(ПРОДАВЕЦ|СОТУВЧИ).*(ИНН|ПИНФЛ|СТИР|ЖШШИР)/.test(t)) L.sellerInn = c;
      else if (L.sellerName === -1 && /(ПРОДАВЕЦ|СОТУВЧИ).*(НАИМЕНОВАНИЕ|НОМ)/.test(t) && !/ФИЛИАЛ/.test(t)) L.sellerName = c;
      else if (L.buyerInn === -1 && /(ПОКУПАТЕЛЬ|ХАРИДОР|ХАРИДОРНИНГ).*(ИНН|ПИНФЛ|СТИР|ЖШШИР)/.test(t)) L.buyerInn = c;
      else if (L.buyerName === -1 && /(ПОКУПАТЕЛЬ|ХАРИДОР).*(НАИМЕНОВАНИЕ|НОМ)/.test(t) && !/ФИЛИАЛ/.test(t)) L.buyerName = c;
      else if (L.amount === -1 && /СУММА К ОПЛАТЕ|ТЎЛОВГА|ТУЛОВГА|ЖАМИ СУММА|ИТОГО К ОПЛАТЕ/.test(t)) L.amount = c;
    }

    if (L.doc !== -1 && L.amount !== -1 && (L.sellerInn !== -1 || L.sellerName !== -1)) return L;
  }
  return null;
}

// ------------------------------------------------------------
// Faktura reestrini o'qish
// ------------------------------------------------------------

const CONFIRMED_RE = /ПОДТВЕРЖД|ТАСДИҚ|ТАСДИК|TASDIQ/;

// BEKOR QILINGAN fakturalar - faqat shular hisobga olinmaydi.
// «Ожидает подписи партнёра» (imzo kutilmoqda) HISOBLANADI: faktura
// yozib berilgan va buxgalter uni sverkada hisobga oladi. Buni
// IMANMAX iyun fayli isbotladi - KAFESOFT bo'yicha qo'lda chiqarilgan
// 27 001 500 aynan imzo kutilayotgan 3 062 500 bilan birga to'g'ri keladi.
const REJECTED_RE = /ОТМЕН|ОТКАЗ|НЕДЕЙСТВ|АННУЛИР|BEKOR|RAD ET/;

interface InvoiceRow {
  inn: string;
  name: string;
  date: Date | null;
  amount: number;
  doc: string;
  status: string;
  /** Takrorni aniqlash uchun kalitlar: portal ID va hujjat+STIR+summa.
   *  IKKALASI ham tekshiriladi, chunki bitta faktura ikki xil eksportda
   *  (biri ID ustunli, ikkinchisi ID ustunsiz) kelishi mumkin. */
  keys: string[];
}

interface InvoiceResult {
  rows: InvoiceRow[];
  skipped: Map<string, { count: number; amount: number }>;
  /** Hisoblangan, lekin hali tasdiqlanmagan (imzo kutilayotgan) */
  pending: Map<string, { count: number; amount: number }>;
  ownInn: string;
  direction: 'RECEIVED' | 'SENT' | 'UNKNOWN';
  total: number;
}

/** Ustunda eng ko'p takrorlangan STIR - hisob egasiniki */
function dominantInn(rows: Cell[][], from: number, col: number): { value: string; share: number } {
  if (col < 0) return { value: '', share: 0 };
  const counts = new Map<string, number>();
  let total = 0;
  for (let i = from; i < rows.length; i++) {
    const v = cleanInn(rows[i]?.[col]);
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
    total++;
  }
  let best = '', bestN = 0;
  for (const [v, n] of counts) if (n > bestN) { bestN = n; best = v; }
  return { value: best, share: total ? bestN / total : 0 };
}

function parseInvoiceSheet(rows: Cell[][], L: InvoiceLayout, includePending: boolean): InvoiceResult {
  const out: InvoiceRow[] = [];
  const skipped = new Map<string, { count: number; amount: number }>();
  const pending = new Map<string, { count: number; amount: number }>();

  // Qaysi tomon BIZ? Kelgan fakturada xaridor ustuni bir xil STIRni
  // takrorlaydi, sotuvchi esa har xil bo'ladi (yuborilganda - aksincha).
  const buyerDom = dominantInn(rows, L.headerRow + 1, L.buyerInn);
  const sellerDom = dominantInn(rows, L.headerRow + 1, L.sellerInn);

  let direction: 'RECEIVED' | 'SENT' | 'UNKNOWN' = 'UNKNOWN';
  let ownInn = '';
  if (buyerDom.share >= 0.8 && buyerDom.share > sellerDom.share) {
    direction = 'RECEIVED';
    ownInn = buyerDom.value;
  } else if (sellerDom.share >= 0.8 && sellerDom.share > buyerDom.share) {
    direction = 'SENT';
    ownInn = sellerDom.value;
  } else if (L.buyerInn !== -1) {
    direction = 'RECEIVED';
    ownInn = buyerDom.value;
  }

  // Kelgan fakturada kontragent = sotuvchi, yuborilganda = xaridor
  const partyInn = direction === 'SENT' ? L.buyerInn : L.sellerInn;
  const partyName = direction === 'SENT' ? L.buyerName : L.sellerName;

  // Fayl «Подтверждён» status tizimidan foydalanadimi?
  let hasStatuses = false;
  for (let i = L.headerRow + 1; i < rows.length; i++) {
    if (CONFIRMED_RE.test(up(rows[i]?.[L.status]))) { hasStatuses = true; break; }
  }

  let total = 0;

  for (let i = L.headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const amount = parseAmount(row[L.amount]);
    const docStr = text(row[L.doc]);
    if (!docStr && amount <= 0) continue;

    const statusRaw = L.status >= 0 ? text(row[L.status]) : '';
    const status = up(statusRaw);

    // Yakuniy/xizmat qatorlari
    if (/^(ИТОГО|ЖАМИ|ВСЕГО|TOTAL)/.test(up(row[0]))) continue;

    const inn = partyInn >= 0 ? cleanInn(row[partyInn]) : '';
    const name = partyName >= 0 ? text(row[partyName]) : '';
    if (!inn && !name) continue;
    if (amount <= 0) continue;

    // Bekor qilingan / rad etilgan - hisobga olinmaydi
    if (REJECTED_RE.test(status)) {
      const key = statusRaw || 'Статуссиз';
      const prev = skipped.get(key) || { count: 0, amount: 0 };
      prev.count++;
      prev.amount += amount;
      skipped.set(key, prev);
      continue;
    }
    // Tasdiqlanmagan, lekin bekor ham qilinmagan («Ожидает подписи
    // партнёра»). Buxgalteriya qoidasi bo'yicha bunday faktura hali
    // kuchga kirmagan - shuning uchun ODATDA hisoblanmaydi. Ba'zi
    // buxgalterlar sverkaga qo'shadi, shuning uchun sahifada uni
    // yoqish tugmasi bor.
    if (hasStatuses && !CONFIRMED_RE.test(status)) {
      const key = statusRaw || 'Статуссиз';
      const bucket = includePending ? pending : skipped;
      const prev = bucket.get(key) || { count: 0, amount: 0 };
      prev.count++;
      prev.amount += amount;
      bucket.set(key, prev);
      if (!includePending) continue;
    }

    // Takroriy faktura (bir necha fayl qisman ustma-ust tushsa).
    // Hujjat raqamidagi ortiqcha bo'shliqlar tozalanadi: bitta eksportda
    // «1 570 от 02.07.2026», boshqasida «1570 от 02.07.2026» bo'lishi mumkin.
    const idVal = L.id >= 0 ? text(row[L.id]) : '';
    const docKey = docStr.replace(/\s+/g, '').toUpperCase();
    const keys = [`${docKey}|${inn}|${amount}`];
    if (idVal) keys.push(`ID:${idVal}`);

    out.push({
      inn,
      name,
      date: parseDate(row[L.doc]) || parseDate(docStr),
      amount,
      doc: docStr,
      status: statusRaw,
      keys,
    });
    total += amount;
  }

  return { rows: out, skipped, pending, ownInn, direction, total };
}

// ------------------------------------------------------------
// Asosiy: fayllarni o'qib, kontragentlar kesimida yig'ish
// ------------------------------------------------------------

export interface AuditOptions {
  /** Ilgari o'rganilgan shakllar (Firestore `excel_formats`) */
  knownFormats?: LearnedFormat[];
  /** «Ожидает подписи партнёра» holatidagi fakturalarni ham hisoblash.
   *  Standart holatda YO'Q: imzolanmagan faktura hali kuchga kirmagan. */
  includePending?: boolean;
  /** Foydalanuvchi qo'lda belgilagan toifalar (STIR yoki kalit bo'yicha).
   *  Korxona darajasida saqlanadi — bir mijoz uchun kommunal bo'lgan
   *  tashkilot boshqasi uchun asosiy kontragent bo'lishi mumkin. */
  categoryOverrides?: Record<string, Category>;
  /** Boshqa korxonalar shu STIRni qanday belgilagani. Bu HECH QACHON
   *  toifa bo'lib qo'llanmaydi — faqat «?» belgisi chiqaradi. */
  categoryGlobalHints?: Record<string, GlobalHint>;
}

/** Ikkinchi fayl qamramagan davrdagi pul ulushi shu chegaradan oshsa
 *  ogohlantiriladi. 10%: iyul тўлови июн фактурасини ёпиши — нормал ҳол
 *  ва у одатда бир неча фоиз бўлади; 7 ойлик фарқ эса 80% дан ошади. */
const PERIOD_MISMATCH_SHARE = 0.10;

export function auditFiles(files: InputFile[], options: AuditOptions = {}): AuditResult {
  const includePending = options.includePending === true;
  const categoryOverrides = options.categoryOverrides;
  const categoryGlobalHints = options.categoryGlobalHints;
  const known = new Map<string, LearnedFormat>();
  for (const f of options.knownFormats || []) known.set(f.id, f);
  const learned = new Map<string, LearnedFormat>();

  /** Muvaffaqiyatli o'qilgan shaklni xotiraga yozib qo'yish */
  function remember(
    kind: 'BANK' | 'FAKTURA',
    parser: string,
    headerLabels: Cell[] | undefined,
    columns: Record<string, number> | undefined,
    sampleFile: string,
    direction?: 'DEBIT' | 'CREDIT'
  ) {
    if (!headerLabels || !columns) return;
    const id = fingerprint(headerLabels);
    if (!id) return;
    const existing = known.get(id);
    if (existing) {
      // Tanish shakl - faqat ishlatilish sonini yangilaymiz
      learned.set(id, { ...existing, uses: (existing.uses || 0) + 1, updatedAt: new Date().toISOString() });
      return;
    }
    const fmt = makeLearnedFormat({ kind, parser, headerLabels, columns, direction, sampleFile });
    if (fmt) {
      learned.set(id, fmt);
      known.set(id, fmt);
    }
  }

  const agg: Record<string, AggEntry> = {};
  const detectedFormats: string[] = [];
  const warnings: string[] = [];
  const sheets: SheetReport[] = [];
  const balanceChecks: BalanceCheck[] = [];
  const unverifiedFiles: string[] = [];
  const seenInvoiceKeys = new Set<string>();
  const skippedInvoices = new Map<string, { count: number; amount: number }>();
  const seenFiles = new Map<string, string>(); // hash -> fayl nomi

  // STIRsiz kontragentlar nom bo'yicha ulanadi; nom bo'yicha ochilgan
  // yozuvga keyinchalik STIR kelib qolsa, ikkalasi birlashtiriladi.
  const nameKeyIndex = new Map<string, string>();

  function noteFormat(f: string) {
    if (f && !detectedFormats.includes(f)) detectedFormats.push(f);
  }

  function entryFor(inn: string, name: string): AggEntry {
    const cleanName = name ? name.trim() : '';
    const nameKey = cleanName ? normalizeName(cleanName) : '';
    let key: string;

    if (inn) {
      key = inn;
      if (nameKey && !nameKeyIndex.has(nameKey)) nameKeyIndex.set(nameKey, key);
    } else if (nameKey && nameKeyIndex.has(nameKey)) {
      key = nameKeyIndex.get(nameKey)!;
    } else if (nameKey) {
      key = `NAME:${nameKey}`;
      nameKeyIndex.set(nameKey, key);
    } else {
      key = 'UNKNOWN';
    }

    let e = agg[key];
    if (!e) {
      e = agg[key] = {
        key,
        inn: inn || '-',
        name: cleanName || "Noma'lum kontragent",
        monthlyData: {},
        transactions: [],
        totalDebit: 0,
        totalCredit: 0,
        // Haqiqiy toifa oxirida, nom to'liq aniqlangandan keyin
        // qo'yiladi (nom bir necha faylda to'liqroq bo'lishi mumkin).
        category: 'korxona',
        categorySource: 'standart',
      };
    }
    if (inn && e.inn === '-') e.inn = inn;
    // To'liqroq nomni saqlaymiz («OOO X» dan «OOO X SAVDO» afzal)
    if (cleanName && (e.name === "Noma'lum kontragent" || cleanName.length > e.name.length)) {
      e.name = cleanName;
    }
    return e;
  }

  // ============================================================
  // DAVR KUZATUVI — qaysi tomon qaysi oylarni qamragan
  // ------------------------------------------------------------
  // `GENERIC_DOC` (universal o'quvchi) ATAYLAB hisobga olinmaydi:
  // u bank ko'chirmasimi yoki faktura ro'yxatimi — aniq emas, ya'ni
  // uni bir tomonga yozib qo'yish YOLG'ON ogohlantirish berardi.
  // ============================================================
  const monthsBy: Record<'BANK' | 'FAKTURA', Map<string, number>> = {
    BANK: new Map(),
    FAKTURA: new Map(),
  };
  const undatedBy: Record<'BANK' | 'FAKTURA', number> = { BANK: 0, FAKTURA: 0 };
  let hasGeneric = false;

  function addTx(
    name: string,
    inn: string,
    date: Date | null,
    debit: number,
    credit: number,
    docType: string,
    source: string,
    doc?: string,
    purpose?: string,
    account?: string
  ) {
    if (debit <= 0 && credit <= 0) return;

    if (docType === 'GENERIC_DOC') {
      hasGeneric = true;
    } else if (docType === 'BANK' || docType === 'FAKTURA') {
      const side = docType;
      if (date) {
        const m = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        monthsBy[side].set(m, (monthsBy[side].get(m) || 0) + debit + credit);
      } else {
        undatedBy[side] += 1;
      }
    }
    const e = entryFor(cleanInn(inn), name);
    if (account && !e.account) e.account = account;

    // Sanasi yo'q o'tkazma bugungi oyga tushib, hisobotni buzmasligi
    // uchun alohida «sanasiz» guruhga yig'iladi
    const periodKey = date
      ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      : 'SANASIZ';

    if (!e.monthlyData[periodKey]) e.monthlyData[periodKey] = { debit: 0, credit: 0 };
    if (debit > 0) {
      e.monthlyData[periodKey].debit += debit;
      e.totalDebit += debit;
    }
    if (credit > 0) {
      e.monthlyData[periodKey].credit += credit;
      e.totalCredit += credit;
    }

    e.transactions.push({
      date: date ? date.toISOString().split('T')[0] : '',
      type: docType,
      debit,
      credit,
      doc,
      purpose,
      source,
    });
  }

  /** Bank ko'chirmasini yig'indiga qo'shish. O'z hisobvaraqlari
   *  orasidagi harakat (o'z kartasiga o'tkazma, terminal tushumi, bank
   *  komissiyasi hisobvarag'i) kontragent emas - u sverkaga kirmaydi,
   *  lekin JIM tashlab yuborilmaydi: soni va summasi hisobotda ko'rinadi. */
  function addStatement(
    st: BankStatement,
    source: string,
    own: { inn: string; name: string; account: string }
  ) {
    let rows = 0, debit = 0, credit = 0;
    let ownSkipped = 0, ownDebit = 0, ownCredit = 0;
    for (const tx of st.txs) {
      if (tx.debit <= 0 && tx.credit <= 0) continue;
      const isOwn =
        (!!own.inn && !!tx.inn && tx.inn === own.inn) ||
        (!!own.account && !!tx.account && tx.account === own.account) ||
        (!!own.name && !!tx.name && sameEntity(tx.name, own.name));
      if (isOwn) {
        ownSkipped++;
        ownDebit += tx.debit > 0 ? tx.debit : 0;
        ownCredit += tx.credit > 0 ? tx.credit : 0;
        continue;
      }
      addTx(tx.name, tx.inn, tx.date, tx.debit, tx.credit, 'BANK', source, tx.doc, tx.purpose, tx.account);
      rows++;
      debit += tx.debit > 0 ? tx.debit : 0;
      credit += tx.credit > 0 ? tx.credit : 0;
    }
    return { rows, debit, credit, ownSkipped, ownDebit, ownCredit };
  }

  // Hamma fayl bo'yicha bitta egasi: birinchi topilgani qoladi.
  const own = { inn: '', name: '', account: '' };

  for (const file of files) {
    // Aynan bir xil fayl ikki marta yuklansa - ikkinchisi hisoblanmaydi
    const hash = `${file.name}|${file.buffer.length}`;
    if (seenFiles.has(hash)) {
      warnings.push(`«${file.name}» файли икки марта юкланди — иккинчиси ҳисобга олинмади.`);
      continue;
    }
    seenFiles.set(hash, file.name);

    let sheetList: SheetData[];
    try {
      sheetList = readSheets(file);
    } catch (err) {
      warnings.push(`«${file.name}» файлини ўқиб бўлмади: ${(err as Error).message}`);
      continue;
    }

    if (sheetList.length === 0) {
      warnings.push(`«${file.name}» файлида маълумот топилмади.`);
      continue;
    }

    // Sarlavha varag'i (ASBT: «Справка о дебетовых оборотах...»)
    // keyingi ma'lumot varag'iga qo'shib beriladi
    let carriedTitle: Cell[][] = [];

    // Hisob egasining kimligi FAYL bo'yicha eslab qolinadi: ASBT
    // eksportida debet varag'ida o'z STIRimiz aniq ko'rinadi, kredit
    // varag'ida esa (terminal tushumlarida) to'lovchi ham o'zimiz
    // bo'lgani uchun uni faqat shu varaqdan aniqlab bo'lmaydi.
    const fileOwn = { inn: '', name: '', account: '' };

    // Qoldiq tenglamasi butun fayl bo'yicha yig'iladi
    const tally: BalanceTally = newBalanceTally();

    for (const sd of sheetList) {
      const label = `${file.name} / ${sd.sheet}`;
      const rowsWithTitle = carriedTitle.length ? [...carriedTitle, ...sd.rows] : sd.rows;

      // 1) Buxgalterning svodka varag'i / akt sverki - manba emas
      if (isPivotSheet(sd.rows)) {
        sheets.push({ file: file.name, sheet: sd.sheet, format: 'SVODKA', rows: 0, debit: 0, credit: 0, note: 'Свод жадвали — манба сифатида ўқилмади' });
        carriedTitle = [];
        continue;
      }
      if (isReconciliationAct(sd.rows)) {
        sheets.push({ file: file.name, sheet: sd.sheet, format: 'AKT_SVERKI', rows: 0, debit: 0, credit: 0, note: 'Акт сверки — манба сифатида ўқилмади' });
        carriedTitle = [];
        continue;
      }

      // 2) Faktura reestri
      const invoiceLayout = findInvoiceLayout(sd.rows);
      if (invoiceLayout) {
        const res = parseInvoiceSheet(sd.rows, invoiceLayout, includePending);
        if (res.rows.length > 0) {
          noteFormat('FAKTURA');
          let added = 0, sum = 0, dup = 0;
          for (const inv of res.rows) {
            if (inv.keys.some((k) => seenInvoiceKeys.has(k))) { dup++; continue; }
            for (const k of inv.keys) seenInvoiceKeys.add(k);
            addTx(inv.name, inv.inn, inv.date, 0, inv.amount, 'FAKTURA', label, inv.doc);
            added++;
            sum += inv.amount;
          }
          for (const [status, v] of res.pending) {
            warnings.push(`«${label}» — «${status}» ҳолатидаги ${v.count} та фактура (${MONEY_FMT(v.amount)}) ҲИСОБГА ОЛИНДИ (фактура ёзиб берилган, фақат имзо кутилмоқда).`);
          }
          for (const [status, v] of res.skipped) {
            const prev = skippedInvoices.get(status) || { count: 0, amount: 0 };
            prev.count += v.count;
            prev.amount += v.amount;
            skippedInvoices.set(status, prev);
          }
          if (res.direction === 'SENT') {
            warnings.push(`«${label}» — бу ЮБОРИЛГАН фактуралар реестри. Чиқим сверкаси КЕЛГАН фактуралар билан солиштиради; барибир қўшилди.`);
          }
          if (dup > 0) {
            warnings.push(`«${label}» — ${dup} та фактура олдинги файлда аллақачон бор эди, такрор ҳисобланмади.`);
          }
          // Faktura shaklini ham xotiraga yozib qo'yamiz
          remember('FAKTURA', 'FAKTURA', sd.rows[invoiceLayout.headerRow], {
            status: invoiceLayout.status, doc: invoiceLayout.doc, id: invoiceLayout.id,
            sellerInn: invoiceLayout.sellerInn, sellerName: invoiceLayout.sellerName,
            buyerInn: invoiceLayout.buyerInn, buyerName: invoiceLayout.buyerName,
            amount: invoiceLayout.amount,
          }, file.name);

          sheets.push({ file: file.name, sheet: sd.sheet, format: 'FAKTURA', rows: added, debit: 0, credit: sum, note: dup ? `${dup} та такрор` : undefined });
          carriedTitle = [];
          continue;
        }
      }

      // 3) Bank ko'chirmalari
      let st: BankStatement | null = null;
      let fmt = '';

      // (a) Avval tekshirilgan parserlar - ular ko'chirmaning debet yoki
      //     kredit ekanini SARLAVHAdan aniqlaydi, buni esa shapka izi
      //     bilan bilib bo'lmaydi (ASBT'da ikkala varaqning shapkasi
      //     AYNAN bir xil). Shuning uchun format xotirasi ularni
      //     HECH QACHON bosib o'tmaydi.
      if ((st = parseThreeRowAccountReport(rowsWithTitle))) fmt = 'BANK_3ROW';
      else if ((st = parseColumnarStatement(rowsWithTitle))) fmt = 'BANK_COLUMNAR';
      else if ((st = parseTwoSidedTurnover(rowsWithTitle))) fmt = 'BANK_TURNOVER';

      if (st && st.headerLabels && st.columns) {
        remember(
          'BANK',
          st.format,
          st.headerLabels,
          st.columns,
          file.name,
          st.layout.length === 1 ? st.layout[0].direction : undefined
        );
      }

      // (b) Parserlar tanimadi - lekin bu shapka ilgari bir marta
      //     o'qilgan bo'lishi mumkin. Shunda ustunlar qaytadan taxmin
      //     qilinmaydi: saqlangan xarita bo'yicha o'qiladi.
      if (!st) {
        const hit = matchKnownFormat(rowsWithTitle, known);
        if (hit && hit.format.kind === 'BANK') {
          st = readBankWithFormat(rowsWithTitle, hit.format, hit.headerRow);
          if (st) {
            fmt = 'TANISH_SHAKL';
            remember('BANK', hit.format.parser, rowsWithTitle[hit.headerRow], hit.format.columns, file.name, hit.format.direction);
          }
        }
      }

      if (st) {
        noteFormat(fmt);
        if (!fileOwn.inn && st.ownInn) fileOwn.inn = st.ownInn;
        if (!fileOwn.name && st.ownName) fileOwn.name = st.ownName;
        if (!fileOwn.account && st.ownAccount) fileOwn.account = st.ownAccount;
        if (!own.inn && fileOwn.inn) own.inn = fileOwn.inn;
        if (!own.name && fileOwn.name) own.name = fileOwn.name;
        if (!own.account && fileOwn.account) own.account = fileOwn.account;

        // Qoldiq tenglamasi uchun: sverkaga kirgan qatorlar emas, varaqdagi
        // BARCHA o'tkazmalar. O'z hisobvaraqlari orasidagi harakat ham
        // qoldiqni o'zgartiradi.
        tally.sheets++;
        tally.debit += st.totalDebit;
        tally.credit += st.totalCredit;
        absorbBalances(tally, st.balances);

        const r = addStatement(st, label, fileOwn);
        const rep: SheetReport = {
          file: file.name, sheet: sd.sheet, format: fmt,
          rows: r.rows, debit: r.debit, credit: r.credit,
          allDebit: st.totalDebit, allCredit: st.totalCredit,
          fileDebit: st.footerDebit, fileCredit: st.footerCredit,
        };

        // Faylning O'Z yakuniy qatori bilan solishtirish - eng ishonchli
        // nazorat. Farq bo'lsa fayl to'liq o'qilmagan degani.
        const parsedD = st.totalDebit;
        const parsedC = st.totalCredit;
        if (st.footerDebit !== undefined && Math.abs(st.footerDebit - parsedD) > 0.5) {
          warnings.push(`«${label}» — файлнинг ўз якуний қатори ${MONEY_FMT(st.footerDebit)} дебет, ўқилгани ${MONEY_FMT(parsedD)}. Фарқ: ${MONEY_FMT(st.footerDebit - parsedD)}`);
        }
        if (st.footerCredit !== undefined && st.footerCredit > 0 && Math.abs(st.footerCredit - parsedC) > 0.5) {
          warnings.push(`«${label}» — файлнинг ўз якуний қатори ${MONEY_FMT(st.footerCredit)} кредит, ўқилгани ${MONEY_FMT(parsedC)}. Фарқ: ${MONEY_FMT(st.footerCredit - parsedC)}`);
        }
        if (r.ownSkipped > 0) {
          rep.note = `${r.ownSkipped} та ўз ҳисобварағи ҳаракати сверкага кирмади (Д ${MONEY_FMT(r.ownDebit)} / К ${MONEY_FMT(r.ownCredit)})`;
        }
        sheets.push(rep);
        carriedTitle = [];
        continue;
      }

      // 4) Notanish shakl - universal qatlam
      const universal = parseUniversal(sd.rows);
      if (universal) {
        noteFormat('UNIVERSAL');
        let rows = 0, debit = 0, credit = 0;
        for (const tx of universal.rows) {
          addTx(tx.name, tx.inn === '-' ? '' : tx.inn, tx.date, tx.debit, tx.credit, 'GENERIC_DOC', label);
          rows++;
          debit += tx.debit;
          credit += tx.credit;
        }
        // Universal o'quvchi ham qoldiq tenglamasiga kiradi — aynan shu
        // yerda u eng kerak: shakl tanilmagan bo'lsa, tenglama o'qish
        // to'g'ri bo'lganini mustaqil tasdiqlaydi.
        tally.sheets++;
        tally.debit += debit;
        tally.credit += credit;
        absorbBalances(tally, findAccountBalances(rowsWithTitle));
        // NOTANISH FORMATNI O'RGANIB QO'YISH: shapka topilgan bo'lsa,
        // ustun xaritasi saqlanadi va keyingi safar shu shapka kelganda
        // qaytadan taxmin qilinmaydi.
        let learnedNow = false;
        if (universal.map && universal.headerRow !== undefined) {
          const cols: Record<string, number> = {};
          for (const [role, idx] of Object.entries(universal.map)) {
            if (typeof idx === 'number' && idx >= 0) cols[role] = idx;
          }
          const before = learned.size;
          remember('BANK', 'UNIVERSAL', sd.rows[universal.headerRow], cols, file.name);
          learnedNow = learned.size > before;
        }

        sheets.push({
          file: file.name, sheet: sd.sheet, format: `UNIVERSAL/${universal.method}`,
          rows, debit, credit,
          note: learnedNow ? 'Нотаниш формат ЎРГАНИБ ОЛИНДИ — текшириб кўринг' : 'Формат нотаниш — статистик усулда ўқилди, текшириб кўринг',
        });
        warnings.push(
          `«${label}» — формат танилмади, универсал ўқувчи ишлатилди (${universal.method}). ` +
          (learnedNow ? 'Устунлар хаританинг эсида сақланди — кейинги сафар шу шакл тўғридан-тўғри ўқилади. ' : '') +
          'Рақамларни файл билан солиштириб кўринг.'
        );
        carriedTitle = [];
        continue;
      }

      // 5) Hech narsa - sarlavha varag'imi yoki umuman tanilmadi
      if (isTitleOnly(sd.rows)) {
        carriedTitle = sd.rows;
        continue;
      }

      carriedTitle = [];
      sheets.push({
        file: file.name,
        sheet: sd.sheet,
        format: 'TANILMADI',
        rows: 0,
        debit: 0,
        credit: 0,
        note: 'Ўқилмади',
        // Dastlabki 5 qator × 15 katak. Shapka odatda shu oraliqda
        // bo'ladi; ko'proq olish ma'no bermaydi va hujjatni kattalashtiradi.
        //
        // `Array.from` ATAYLAB — `map` EMAS. Excel qatori SIYRAK (sparse)
        // massiv bo'lishi mumkin: chap kataklari bo'sh sarlavha, birlashtirilgan
        // katak va h.k. `Array.prototype.map` esa teshiklarni O'TKAZIB
        // YUBORADI va natijada ham teshik qoldiradi — ya'ni quyidagi
        // `undefined ? ''` qorovuli ular uchun UMUMAN ishlamasdi.
        // Oqibati: Firestore `undefined` ga istisno tashlab, `parse_failures`
        // yozuvini butunlay rad etardi va xato jimgina yutilardi (2026-08-19).
        // `Array.from` teshikni ham element deb ko'radi va qorovuldan o'tkazadi.
        sampleRows: Array.from(sd.rows.slice(0, 5), (r) =>
          Array.from(r.slice(0, 15), (c) =>
            c === null || c === undefined ? '' : String(c).slice(0, 60)
          )
        ),
      });
      warnings.push(`«${label}» — варақ танилмади ва ҲИСОБГА ОЛИНМАДИ (${sd.rows.length} қатор).`);
    }

    // Fayldagi barcha varaqlar o'qib bo'lindi — endi qoldiq tenglamasi.
    if (tally.sheets > 0) {
      const { check, warning } = checkBalanceEquation(file.name, tally);
      balanceChecks.push(check);
      if (warning) warnings.push(warning);

      // QAT'IY REJIM. Faylning to'liq o'qilganini isbotlaydigan IKKI
      // mustaqil yo'l bor: «Итого» qatori va qoldiq tenglamasi. Ikkalasi
      // ham bo'lmasa, raqam — sof taxmin. Uni jim ko'rsatish eng xavfli
      // xato: buxgalter tekshirilgan deb o'ylaydi. Shuning uchun raqam
      // YO'QOTILMAYDI (yo'qotish ham jimgina xato bo'lardi), lekin fayl
      // «tasdiqlanmagan» deb belgilanadi.
      const own = sheets.filter((s) => s.file === file.name);
      const hasFooter = own.some((s) => s.fileDebit !== undefined || s.fileCredit !== undefined);
      if (!hasFooter && check.status !== 'MOS') {
        unverifiedFiles.push(file.name);
        const guessed = own.some((s) => s.format.startsWith('UNIVERSAL'));
        warnings.push(
          `«${file.name}» — бу файлни ТЕКШИРИБ БЎЛМАДИ: унда на «Итого» якуний қатори, ` +
          `на қолдиқ кўрсатилган. Ўқилган ${MONEY_FMT(tally.debit)} дебет / ` +
          `${MONEY_FMT(tally.credit)} кредит тўғрилигини тизим ИСБОТЛАЙ ОЛМАЙДИ` +
          (guessed ? ', устига формат ҳам танилмади' : '') +
          `. Рақамларни файлнинг ўзи билан солиштиринг ёки банкдан якуний қатори бор ` +
          `кўчирма сўранг.`
        );
      }
    }
  }

  for (const [status, v] of skippedInvoices) {
    warnings.push(`«${status}» ҳолатидаги ${v.count} та фактура (${MONEY_FMT(v.amount)}) ҳисобга ОЛИНМАДИ.`);
  }

  const data = Object.values(agg).map((item) => {
    item.difference = item.totalDebit - item.totalCredit;
    item.transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    // Toifa endi qo'yiladi: shu paytga kelib nom eng to'liq holatda
    // (bir necha faylda turlicha yozilgan bo'lishi mumkin edi).
    const cat = resolveCategory(
      item.inn, item.key, item.name, categoryOverrides, item.account, categoryGlobalHints
    );
    item.category = cat.category;
    item.categorySource = cat.source;
    item.categoryLabel = cat.label;
    item.categoryHint = cat.hint;
    item.categoryHintLabel = cat.hintLabel;
    return item;
  });

  const categoryTotals = {
    korxona: { debit: 0, credit: 0, count: 0 },
    kommunal: { debit: 0, credit: 0, count: 0 },
    byudjet: { debit: 0, credit: 0, count: 0 },
    bank: { debit: 0, credit: 0, count: 0 },
    xizmat: { debit: 0, credit: 0, count: 0 },
  } as Record<Category, { debit: number; credit: number; count: number }>;

  const totals = data.reduce(
    (acc, it) => {
      acc.debit += it.totalDebit;
      acc.credit += it.totalCredit;
      const c = categoryTotals[it.category];
      c.debit += it.totalDebit;
      c.credit += it.totalCredit;
      c.count++;
      return acc;
    },
    { debit: 0, credit: 0, difference: 0 }
  );
  totals.difference = totals.debit - totals.credit;

  // ------------------------------------------------------------
  // HIMOYA QOIDASI: toifalash pul yo'qotishига олиб келмаслиги учун
  //
  // Коммунал ташкилот билан ҳисоб-китоб ОДАТДА тиқ-тиқ ёпилади:
  // тўлайсиз — фактура келади — фарқ нолга тенг. Агар асосий
  // сверкадан чиқарилган контрагентда ФАКТУРА ҲАМ БОР ва ФАРҚ ҲАМ
  // бор бўлса — у ўзини ҳақиқий контрагентдек тутяпти. Айнан шу
  // ҳолатда уни яшириш пулга тушарди, шунинг учун ЎҚИШ ҲИСОБОТИДА
  // алоҳида айтилади (фильтрдан қатъи назар кўринади).
  // ------------------------------------------------------------
  // Кичик фарқ коммуналда ОДДИЙ ҳол: июль фактураси августда келади,
  // тўлов эса ойма-ой сурилади. Шунинг учун ҳар қандай тийин эмас,
  // фақат СЕЗИЛАРЛИ фарқ айтилади — акс ҳолда огоҳлантириш шовқинга
  // айланиб, ҳеч ким ўқимай қўяди. Айнан шу нисбат тўлов умуман
  // йўқ ҳолатни ҳам ушлайди (фарқ айланманинг 100% и бўлади).
  const MATERIAL_SHARE = 0.25; // фарқ ўз айланмасига нисбатан
  /** Умумий айланмадаги улуш чегараси — тоифага қараб ҳар хил.
   *  СОЛИҚ табиатан катта бўлади: ҳақиқий файлларда ғазначилик улуши
   *  1,0% дан 10,3% гача чиққан, шунинг учун унга 2% чегара қўйилса
   *  ҳар сафар бекорга огоҳлантирарди. Коммунал ва хизмат эса ҳеч
   *  қачон бунча катта бўлмайди (энг каттаси 0,3%). */
  const BIG_PLAYER_SHARE: Record<Category, number> = {
    korxona: Infinity,
    kommunal: 0.02,
    xizmat: 0.02,
    bank: 0.02,
    byudjet: 0.15,
  };
  const grandTurnover = Math.max(totals.debit, totals.credit);

  for (const it of data) {
    if (it.category === 'korxona') continue;
    const own = Math.max(it.totalDebit, it.totalCredit);

    // (a) БЮДЖЕТ + ФАКТУРА = зиддият. Ғазначиликка ҳисоб-фактура
    //     ёзилмайди — солиқ тўловида контрагент сифатида фирма эмас,
    //     ғазна ҳисобварағи туради. Демак фактураси бор бўлса, бу
    //     бюджет тўлови эмас, ўлчамидан қатъи назар.
    if (it.category === 'byudjet' && it.totalCredit > 0.01) {
      warnings.push(
        `«${it.name}» (СТИР ${it.inn}) «Бюджет» деб белгиланган, ЛЕКИН унда ҳисоб-фактура бор ` +
        `(${MONEY_FMT(it.totalCredit)}). Ғазначиликка фактура ёзилмайди — текширинг: ` +
        `балки у ҳақиқий контрагентдир.`
      );
      continue;
    }

    // (b) ЎЛЧОВ. Коммунал тўлов бизнес айланмасининг арзимас қисми
    //     бўлади. Агар «коммунал» деб белгиланган контрагент умумий
    //     айланманинг сезиларли улушини эгалласа — у коммунал эмас.
    //     Айнан шу қоида йирик етказиб берувчини адашиб белгилашдан
    //     сақлайди (фарқи кичик бўлса ҳам).
    if (grandTurnover > 0 && own / grandTurnover >= BIG_PLAYER_SHARE[it.category]) {
      const pct = ((own / grandTurnover) * 100).toFixed(1);
      warnings.push(
        `«${it.name}» (СТИР ${it.inn}) «${CATEGORY_LABELS[it.category]}» деб белгиланган ва асосий ` +
        `сверкада кўринмайди, ЛЕКИН у умумий айланманинг ${pct}% ини (${MONEY_FMT(own)}) ташкил ` +
        `қилади — бу коммунал учун жуда катта. Текширинг: балки у ҳақиқий контрагентдир.`
      );
      continue;
    }

    // (c) ХУЛҚ. Коммунал билан ҳисоб-китоб одатда ёпилади: тўлайсиз —
    //     фактура келади. Фактураси бор, лекин сезиларли фарқи қолган
    //     бўлса — у ўзини контрагентдек тутяпти.
    if (it.totalCredit <= 0) continue; // фактураси йўқ — оддий тўлов
    const diff = it.totalDebit - it.totalCredit;
    if (Math.abs(diff) <= 0.01) continue; // тиқ-тиқ ёпилган — нормал
    if (own <= 0 || Math.abs(diff) / own < MATERIAL_SHARE) continue;
    const pct = Math.round((Math.abs(diff) / own) * 100);
    warnings.push(
      `«${it.name}» (СТИР ${it.inn}) «${CATEGORY_LABELS[it.category]}» деб белгиланган ва асосий ` +
      `сверкада кўринмайди, ЛЕКИН унда фактура бор ва фарқи ${MONEY_FMT(diff)} — айланмасининг ` +
      `${pct}% и. Текширинг: балки у ҳақиқий контрагентдир.`
    );
  }

  // ============================================================
  // DAVR KELISHUVI — «bir xil davrmi?»
  // ------------------------------------------------------------
  // Haqiqiy fayllarda o'lchangan: 1 oylik ko'chirma + 7 oylik faktura
  // = 3 258 650 804 so'mlik SOXTA farq va bitta ham ogohlantirish yo'q
  // edi. Endi bu jim o'tmaydi.
  //
  // Qoida qattiq EMAS: iyul to'lovi iyun fakturasini yopishi normal
  // hol. Shuning uchun chegara — QAMRALMAGAN oylardagi PULNING ulushi.
  // ============================================================
  const rangeOf = (m: Map<string, number>): PeriodRange => {
    const keys = [...m.keys()].sort();
    return { from: keys[0] ?? null, to: keys[keys.length - 1] ?? null, undated: 0 };
  };
  const bankRange = rangeOf(monthsBy.BANK);
  const facturaRange = rangeOf(monthsBy.FAKTURA);
  bankRange.undated = undatedBy.BANK;
  facturaRange.undated = undatedBy.FAKTURA;

  if (bankRange.from && facturaRange.from && !hasGeneric) {
    /** Ikkinchi tomon UMUMAN qamramagan oylardagi pul ulushi */
    const outsideShare = (mine: Map<string, number>, other: PeriodRange) => {
      let outside = 0;
      let total = 0;
      for (const [month, amount] of mine) {
        total += amount;
        if (month < other.from! || month > other.to!) outside += amount;
      }
      return { outside, total, share: total > 0 ? outside / total : 0 };
    };

    const noOverlap = bankRange.to! < facturaRange.from! || facturaRange.to! < bankRange.from!;
    const b = outsideShare(monthsBy.BANK, facturaRange);
    const f = outsideShare(monthsBy.FAKTURA, bankRange);
    const worst = f.share >= b.share ? { ...f, label: 'фактура рўйхатининг' } : { ...b, label: 'банк кўчирмасининг' };

    const shown = (r: PeriodRange) => (r.from === r.to ? r.from : `${r.from} … ${r.to}`);

    if (noOverlap) {
      warnings.push(
        `ДАВРЛАР УМУМАН МОС КЕЛМАЙДИ: банк кўчирмаси ${shown(bankRange)}, ` +
        `фактура рўйхати ${shown(facturaRange)} даврини қамрайди. Бу иккитаси ` +
        `бошқа-бошқа давр — уларни солиштириб бўлмайди. Бир хил давр учун файл юкланг.`
      );
    } else if (worst.share >= PERIOD_MISMATCH_SHARE) {
      warnings.push(
        `ДАВРЛАР МОС КЕЛМАЙДИ: банк кўчирмаси ${shown(bankRange)}, фактура рўйхати ` +
        `${shown(facturaRange)} даврини қамрайди. Шу сабабли ${worst.label} ` +
        `${MONEY_FMT(worst.outside)} сўми (${Math.round(worst.share * 100)}%) иккинчи файлда ` +
        `УМУМАН ЙЎҚ даврга тегишли ва фарқ сифатида кўринади. Икки файл бир хил ` +
        `даврни қамраши керак.`
      );
    }
  }

  return {
    data,
    detectedFormats,
    warnings,
    sheets,
    balanceChecks,
    periods: { bank: bankRange, faktura: facturaRange },
    own,
    unverifiedFiles,
    learnedFormats: [...learned.values()],
    skippedInvoices: [...skippedInvoices].map(([status, v]) => ({ status, ...v })),
    totals,
    categoryTotals,
  };
}
