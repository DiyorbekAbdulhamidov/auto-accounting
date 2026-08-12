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
  parseTwoSidedTurnover,
  parseThreeRowAccountReport,
  parseColumnarStatement,
  parseAmount,
  parseDate,
  sameEntity,
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
  monthlyData: Record<string, MonthlyBucket>;
  transactions: TxRecord[];
  totalDebit: number;
  totalCredit: number;
  difference?: number;
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
}

export interface AuditResult {
  data: AggEntry[];
  detectedFormats: string[];
  warnings: string[];
  sheets: SheetReport[];
  skippedInvoices: Array<{ status: string; count: number; amount: number }>;
  totals: { debit: number; credit: number; difference: number };
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
function isAktSverki(rows: Cell[][]): boolean {
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

interface FakturaLayout {
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
function findFakturaLayout(rows: Cell[][]): FakturaLayout | null {
  const limit = Math.min(25, rows.length);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row || row.length < 4) continue;

    const L: FakturaLayout = {
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

interface FakturaRow {
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

interface FakturaResult {
  rows: FakturaRow[];
  skipped: Map<string, { count: number; amount: number }>;
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

function parseFakturaSheet(rows: Cell[][], L: FakturaLayout): FakturaResult {
  const out: FakturaRow[] = [];
  const skipped = new Map<string, { count: number; amount: number }>();

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

    if (hasStatuses && !CONFIRMED_RE.test(status)) {
      const key = statusRaw || 'Статуссиз';
      const prev = skipped.get(key) || { count: 0, amount: 0 };
      prev.count++;
      prev.amount += amount;
      skipped.set(key, prev);
      continue;
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

  return { rows: out, skipped, ownInn, direction, total };
}

// ------------------------------------------------------------
// Asosiy: fayllarni o'qib, kontragentlar kesimida yig'ish
// ------------------------------------------------------------

export function auditFiles(files: InputFile[]): AuditResult {
  const agg: Record<string, AggEntry> = {};
  const detectedFormats: string[] = [];
  const warnings: string[] = [];
  const sheets: SheetReport[] = [];
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
      };
    }
    if (inn && e.inn === '-') e.inn = inn;
    // To'liqroq nomni saqlaymiz («OOO X» dan «OOO X SAVDO» afzal)
    if (cleanName && (e.name === "Noma'lum kontragent" || cleanName.length > e.name.length)) {
      e.name = cleanName;
    }
    return e;
  }

  function addTx(
    name: string,
    inn: string,
    date: Date | null,
    debit: number,
    credit: number,
    docType: string,
    source: string,
    doc?: string,
    purpose?: string
  ) {
    if (debit <= 0 && credit <= 0) return;
    const e = entryFor(cleanInn(inn), name);

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
      addTx(tx.name, tx.inn, tx.date, tx.debit, tx.credit, 'BANK', source, tx.doc, tx.purpose);
      rows++;
      debit += tx.debit > 0 ? tx.debit : 0;
      credit += tx.credit > 0 ? tx.credit : 0;
    }
    return { rows, debit, credit, ownSkipped, ownDebit, ownCredit };
  }

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

    for (const sd of sheetList) {
      const label = `${file.name} / ${sd.sheet}`;
      const rowsWithTitle = carriedTitle.length ? [...carriedTitle, ...sd.rows] : sd.rows;

      // 1) Buxgalterning svodka varag'i / akt sverki - manba emas
      if (isPivotSheet(sd.rows)) {
        sheets.push({ file: file.name, sheet: sd.sheet, format: 'SVODKA', rows: 0, debit: 0, credit: 0, note: 'Свод жадвали — манба сифатида ўқилмади' });
        carriedTitle = [];
        continue;
      }
      if (isAktSverki(sd.rows)) {
        sheets.push({ file: file.name, sheet: sd.sheet, format: 'AKT_SVERKI', rows: 0, debit: 0, credit: 0, note: 'Акт сверки — манба сифатида ўқилмади' });
        carriedTitle = [];
        continue;
      }

      // 2) Faktura reestri
      const fakturaLayout = findFakturaLayout(sd.rows);
      if (fakturaLayout) {
        const res = parseFakturaSheet(sd.rows, fakturaLayout);
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
          sheets.push({ file: file.name, sheet: sd.sheet, format: 'FAKTURA', rows: added, debit: 0, credit: sum, note: dup ? `${dup} та такрор` : undefined });
          carriedTitle = [];
          continue;
        }
      }

      // 3) Bank ko'chirmalari - imzosiga qarab
      let st: BankStatement | null = null;
      let fmt = '';
      if ((st = parseThreeRowAccountReport(rowsWithTitle))) fmt = 'BANK_3ROW';
      else if ((st = parseColumnarStatement(rowsWithTitle))) fmt = 'BANK_COLUMNAR';
      else if ((st = parseTwoSidedTurnover(rowsWithTitle))) fmt = 'BANK_TURNOVER';

      if (st) {
        noteFormat(fmt);
        if (!fileOwn.inn && st.ownInn) fileOwn.inn = st.ownInn;
        if (!fileOwn.name && st.ownName) fileOwn.name = st.ownName;
        if (!fileOwn.account && st.ownAccount) fileOwn.account = st.ownAccount;

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
        sheets.push({ file: file.name, sheet: sd.sheet, format: `UNIVERSAL/${universal.method}`, rows, debit, credit, note: 'Формат нотаниш — статистик усулда ўқилди, текшириб кўринг' });
        warnings.push(`«${label}» — формат танилмади, универсал ўқувчи ишлатилди (${universal.method}). Рақамларни файл билан солиштириб кўринг.`);
        carriedTitle = [];
        continue;
      }

      // 5) Hech narsa - sarlavha varag'imi yoki umuman tanilmadi
      if (isTitleOnly(sd.rows)) {
        carriedTitle = sd.rows;
        continue;
      }

      carriedTitle = [];
      sheets.push({ file: file.name, sheet: sd.sheet, format: 'TANILMADI', rows: 0, debit: 0, credit: 0, note: 'Ўқилмади' });
      warnings.push(`«${label}» — варақ танилмади ва ҲИСОБГА ОЛИНМАДИ (${sd.rows.length} қатор).`);
    }
  }

  for (const [status, v] of skippedInvoices) {
    warnings.push(`«${status}» ҳолатидаги ${v.count} та фактура (${MONEY_FMT(v.amount)}) ҳисобга олинмади — фақат тасдиқлангани ҳисобланади.`);
  }

  const data = Object.values(agg).map((item) => {
    item.difference = item.totalDebit - item.totalCredit;
    item.transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return item;
  });

  const totals = data.reduce(
    (acc, it) => {
      acc.debit += it.totalDebit;
      acc.credit += it.totalCredit;
      return acc;
    },
    { debit: 0, credit: 0, difference: 0 }
  );
  totals.difference = totals.debit - totals.credit;

  return {
    data,
    detectedFormats,
    warnings,
    sheets,
    skippedInvoices: [...skippedInvoices].map(([status, v]) => ({ status, ...v })),
    totals,
  };
}
