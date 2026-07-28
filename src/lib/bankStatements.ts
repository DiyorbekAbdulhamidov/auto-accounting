// ============================================================
// YANGI BANK KO'CHIRMA FORMATLARI
//
// Bu modul faqat ILGARI O'QILMAGAN (yoki noto'g'ri o'qilgan)
// ko'chirma shakllarini taniydi va ularni bir xil ko'rinishga
// (BankTx) keltiradi. Ikkala sahifa ham shundan foydalanadi:
//   - /income-audit  (kirim sverkasi)
//   - /excel-audit   (chiqim sverkasi, /api/upload-preview)
//
// MUHIM: har bir parser o'z IMZOsiga qarab ishlaydi va imzo
// topilmasa null qaytaradi. Shuning uchun hozir xatosiz ishlab
// turgan formatlar (HAMKORBANK / eski IPOTEKA_ASBT / FAKTURA)
// bu modulga umuman kirmaydi.
//
// Qo'llab-quvvatlanadigan shakllar:
//
// 1) TWO_SIDED — ASBT 3 «Справка о дебетовых/кредитовых
//    оборотах по счету». Bitta varaqda ikkita bo'lim ketma-ket
//    turishi mumkin (avval debet, keyin kredit). Har qatorda
//    ikki tomon bor: to'lovchi va oluvchi; summa esa bitta
//    «Сумма платежа» ustunida. Ustunlar soni bankdan bankka
//    farq qiladi (10 ta ham, 14 ta ham bo'ladi), shuning uchun
//    ustunlar RAQAM bilan emas, SHAPKA NOMI bilan topiladi.
//
// 2) THREE_ROW — «Cправка о работе счета»: bitta o'tkazma UCH
//    qatorga yoyilgan:
//      1-qator: sana | hujjat | ВО | "МФО:.. Счет:.. ИНН:.." | дебет | кредит
//      2-qator: vaqt |     |    | KONTRAGENT NOMI
//      3-qator:      |     |    | to'lov maqsadi
//
// 3) COLUMNAR — «СПРАВКА ПО РАБОТЕ СЧЕТА»: har o'tkazma bitta
//    qator, «Дебет» va «Кредит» alohida ustunlarda.
// ============================================================

export type Cell = string | number | boolean | Date | null | undefined;

export interface BankTx {
  date: Date | null;
  inn: string;      // topilmasa ''
  name: string;
  account: string;  // kontragentning hisob raqami
  debit: number;    // hisobdan chiqqan
  credit: number;   // hisobga kelgan
  doc: string;
  purpose: string;
}

export interface BankStatement {
  format: 'TWO_SIDED' | 'THREE_ROW' | 'COLUMNAR';
  txs: BankTx[];
  ownInn: string;
  ownName: string;
  ownAccount: string;
  totalDebit: number;
  totalCredit: number;
  /** Har bo'lim uchun aniqlangan ustunlar — chaqiruvchi tomon
   *  eski mantiq bilan mos-nomosligini tekshirishi uchun. */
  layout: SectionLayout[];
}

export interface SectionLayout {
  headerRow: number;
  amountCol: number;
  dateCol: number;
  direction: 'DEBIT' | 'CREDIT';
  counterpartyNameCol: number;
  counterpartyInnCol: number;
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

// "2,800,000.00" (US), "2060000,00" (RU), "1 234,56", "(1 234)" -> manfiy
export function parseAmount(v: Cell): number {
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

// Excel serial (45688), Date, "24.06.2024", "05.01.2026 11:14:46"
export function parseDate(v: Cell): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  const str = String(v).trim();
  if (!str) return null;

  const dmy = str.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(Number(dmy[3]), month - 1, day));
      if (!isNaN(d.getTime())) return d;
    }
  }

  const ymd = str.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (ymd) {
    const d = new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])));
    if (!isNaN(d.getTime())) return d;
  }

  if (typeof v === 'number' || /^\d+(\.\d+)?$/.test(str)) {
    const serial = Number(v);
    if (serial > 20000 && serial < 60000) {
      const d = new Date(Math.floor(serial - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

function cleanInn(v: Cell): string {
  const digits = text(v).replace(/\D/g, '');
  if (!/^\d{9}$/.test(digits) && !/^\d{14}$/.test(digits)) return '';
  // 9 xonali "STIR" aslida mobil telefon raqami bo'lib qolmasin
  if (digits.length === 9) {
    const mobile = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '77', '55'];
    if (mobile.includes(digits.slice(0, 2))) return '';
  }
  return digits;
}

// Yakuniy/xizmat qatorlari. FAQAT qatorning birinchi kataklariga qaraladi
// va ibora BOSHIDAN moslashtiriladi — aks holda «Комиссионные доходы по
// дебетовым ОБОРОТАМ» kabi haqiqiy kontragent nomi ham o'chib ketardi.
const FOOTER_RE = new RegExp(
  '^(' +
  'ИТОГО|ВСЕГО|JAMI|TOTAL|' +
  'СУММА ОБОРОТОВ|КОЛИЧЕСТВО ОБОРОТОВ|ОБОРОТ(Ы)? (ВСЕГО|ЗА)|' +
  'ВХОДЯЩИЙ ОСТАТОК|ИСХОДЯЩИЙ ОСТАТОК|ОСТАТОК (НА|ЗА)|САЛЬДО|' +
  'БАНКОВСКАЯ СИСТЕМА|РУКОВОДИТЕЛЬ|ГЛАВНЫЙ|ИСПОЛНИТЕЛЬ' +
  ')'
);

function isFooterRow(row: Cell[] | undefined): boolean {
  if (!row) return false;
  for (let c = 0; c < Math.min(row.length, 2); c++) {
    const t = up(row[c]);
    if (t && FOOTER_RE.test(t)) return true;
  }
  return false;
}

// Yuridik shakl qisqartmalari — nomlarni solishtirishdan oldin olib tashlanadi
const LEGAL_TOKEN_RE = /(^|[^A-ZА-ЯЁ0-9])(ООО|ОАО|ЗАО|АО|АЖ|МЧЖ|ХК|ХЖ|ИП|ЧП|OOO|MCHJ|XK|HK|AJ|LLC|LTD|SP|YATT|ЯТТ)([^A-ZА-ЯЁ0-9]|$)/g;

/** Ikki nom AYNAN bir yuridik shaxsnimi (o'z hisobvarag'i ichidagi
 *  harakatni ajratish uchun). Qism-nom mosligi ataylab qabul
 *  qilinmaydi: «LIVE ART» va «LIVE ART TRADE» boshqa firmalar. */
export function sameEntity(a: string, b: string): boolean {
  const norm = (s: string) => {
    let t = ' ' + s.toUpperCase().replace(/[^A-ZА-ЯЁ0-9]+/g, ' ').trim() + ' ';
    for (let i = 0; i < 3; i++) t = t.replace(LEGAL_TOKEN_RE, '$1 $3');
    return t.replace(/\s+/g, '');
  };
  const x = norm(a);
  const y = norm(b);
  return !!x && !!y && x === y;
}

// Sarlavha qismidan hisob egasining nomi. Ko'chirmaning yuqorisida
// BANK nomi ham qo'shtirnoq ichida turadi ("ИПОТЕКА-БАНК" АТИБ ...),
// shuning uchun bank/filial nomlari chetlab o'tiladi.
const BANK_NAME_RE = /БАНК|BANK|АТИБ|ATIB|ФИЛИАЛ|FILIAL|ШЎЪБА|АКБ/;
const QUOTED_NAME_RE = /((?:ООО|МЧЖ|АО|ЧП|ИП)?\s*["«][^"»]{2,}["»]\s*(?:MCHJ|МЧЖ|ООО|XK|ХК)?)/;

function findOwnName(rows: Cell[][], beforeRow: number): string {
  for (let r = 0; r < beforeRow && r < rows.length; r++) {
    const line = (rows[r] || []).map((v) => text(v)).join(' ');
    if (!line) continue;
    const m = line.match(QUOTED_NAME_RE);
    if (!m) continue;
    const candidate = m[1].trim();
    if (BANK_NAME_RE.test(candidate.toUpperCase())) continue;
    return candidate;
  }
  return '';
}

// ------------------------------------------------------------
// 1) TWO_SIDED — «Справка о дебетовых / кредитовых оборотах»
// ------------------------------------------------------------

interface SideCols {
  name: number;
  inn: number;
  account: number;
}

interface TwoSidedHeader {
  row: number;
  amountCol: number;
  dateCol: number;
  purposeCol: number;
  docCol: number;
  payer: SideCols;
  receiver: SideCols;
}

function firstAfter(list: number[], after: number, before: number): number {
  let best = -1;
  for (const c of list) {
    if (c > after && c < before && (best === -1 || c < best)) best = c;
  }
  return best;
}

function findTwoSidedHeaders(rows: Cell[][]): TwoSidedHeader[] {
  const out: TwoSidedHeader[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 6) continue;

    let amountCol = -1;
    let payerName = -1;
    let receiverName = -1;
    let dateCol = -1;
    let purposeCol = -1;
    let docCol = -1;
    const innCols: number[] = [];
    const accCols: number[] = [];

    for (let c = 0; c < row.length; c++) {
      const t = up(row[c]);
      if (!t) continue;

      if (amountCol === -1 && /^СУММА( ПЛАТЕЖА)?$/.test(t)) amountCol = c;
      else if (payerName === -1 && /НАИМЕНОВАНИЕ ПЛАТЕЛЬЩИКА|ПЛАТЕЛЬЩИК \(НАИМЕНОВАНИЕ\)/.test(t)) payerName = c;
      else if (receiverName === -1 && /НАИМЕНОВАНИЕ ПОЛУЧАТЕЛ|ПОЛУЧАТЕЛЬ \(НАИМЕНОВАНИЕ\)/.test(t)) receiverName = c;
      else if (dateCol === -1 && /^ДАТА/.test(t)) dateCol = c;
      else if (purposeCol === -1 && /НАЗНАЧЕНИЕ/.test(t)) purposeCol = c;
      else if (docCol === -1 && /^(№|N|NO)? ?ДОК/.test(t)) docCol = c;

      if (/^(ИНН|СТИР|INN|STIR)$/.test(t)) innCols.push(c);
      if (/^(РАСЧ[ЕЁ]ТНЫЙ СЧ[ЕЁ]Т|Р\/С|СЧ[ЕЁ]Т|ЛИЦЕВОЙ СЧ[ЕЁ]Т)$/.test(t)) accCols.push(c);
    }

    if (amountCol === -1 || payerName === -1 || receiverName === -1) continue;

    // Har bir tomonning ИНН / счет ustuni — o'sha tomon nomidan KEYIN,
    // ikkinchi tomon nomidan OLDIN turgan birinchi mos ustun.
    const payerEnd = receiverName > payerName ? receiverName : row.length;
    const receiverEnd = payerName > receiverName ? payerName : row.length;

    out.push({
      row: r,
      amountCol,
      dateCol,
      purposeCol,
      docCol,
      payer: {
        name: payerName,
        inn: firstAfter(innCols, payerName, payerEnd),
        account: firstAfter(accCols, payerName, payerEnd),
      },
      receiver: {
        name: receiverName,
        inn: firstAfter(innCols, receiverName, receiverEnd),
        account: firstAfter(accCols, receiverName, receiverEnd),
      },
    });
  }

  return out;
}

/** Shapka tepasidagi sarlavhadan bo'lim turini aniqlash. */
function directionFromTitle(rows: Cell[][], headerRow: number): 'DEBIT' | 'CREDIT' | null {
  for (let r = Math.max(0, headerRow - 8); r < headerRow; r++) {
    const line = (rows[r] || []).map((v) => up(v)).join(' ');
    if (!line) continue;
    if (/КРЕДИТОВ[А-ЯЁ]* ОБОРОТ/.test(line)) return 'CREDIT';
    if (/ДЕБЕТОВ[А-ЯЁ]* ОБОРОТ/.test(line)) return 'DEBIT';
  }
  return null;
}

/** Ustunda bitta qiymat necha ulushda takrorlanadi (o'z STIRini topish). */
function dominantValue(rows: Cell[][], from: number, to: number, col: number): { value: string; share: number } {
  if (col < 0) return { value: '', share: 0 };
  const counts = new Map<string, number>();
  let total = 0;
  for (let i = from; i <= to && i < rows.length; i++) {
    const v = cleanInn(rows[i]?.[col]);
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
    total++;
  }
  let best = '';
  let bestCount = 0;
  for (const [v, n] of counts) {
    if (n > bestCount) { bestCount = n; best = v; }
  }
  return { value: best, share: total ? bestCount / total : 0 };
}

export function parseTwoSidedTurnover(rows: Cell[][]): BankStatement | null {
  const headers = findTwoSidedHeaders(rows);
  if (headers.length === 0) return null;

  const txs: BankTx[] = [];
  const layout: SectionLayout[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let ownInn = '';
  let ownName = '';
  let ownAccount = '';
  let dataRows = 0;

  for (let s = 0; s < headers.length; s++) {
    const h = headers[s];
    const end = s + 1 < headers.length ? headers[s + 1].row - 1 : rows.length - 1;
    const start = h.row + 1;
    if (start > end) continue;

    // Tomonlardan qaysi biri BIZ ekanligi: avval sarlavhaga qaraladi,
    // topilmasa — qaysi tomonda bitta STIR deyarli hamma qatorda
    // takrorlansa, o'sha tomon hisob egasi.
    let direction = directionFromTitle(rows, h.row);
    const payerDom = dominantValue(rows, start, end, h.payer.inn);
    const receiverDom = dominantValue(rows, start, end, h.receiver.inn);

    if (!direction) {
      if (payerDom.share >= 0.7 && payerDom.share >= receiverDom.share) direction = 'DEBIT';
      else if (receiverDom.share >= 0.7) direction = 'CREDIT';
      else continue; // ishonchsiz — bu bo'lim o'qilmaydi
    }

    // DEBET bo'limida biz to'lovchimiz, KREDIT bo'limida — oluvchi.
    const own = direction === 'DEBIT' ? h.payer : h.receiver;
    const other = direction === 'DEBIT' ? h.receiver : h.payer;
    const ownDom = direction === 'DEBIT' ? payerDom : receiverDom;

    if (!ownInn && ownDom.share >= 0.5) ownInn = ownDom.value;

    let sectionRows = 0;

    for (let i = start; i <= end; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      if (isFooterRow(row)) continue;

      const amount = parseAmount(row[h.amountCol]);
      if (amount <= 0) continue;

      const name = text(row[other.name]);
      const ownRowName = text(row[own.name]);
      if (!name && !ownRowName) continue;

      sectionRows++;
      if (!ownName && ownRowName) ownName = ownRowName;
      if (!ownAccount && own.account >= 0) ownAccount = text(row[own.account]).replace(/\D/g, '');

      const tx: BankTx = {
        date: h.dateCol >= 0 ? parseDate(row[h.dateCol]) : null,
        inn: other.inn >= 0 ? cleanInn(row[other.inn]) : '',
        name,
        account: other.account >= 0 ? text(row[other.account]).replace(/\D/g, '') : '',
        debit: direction === 'DEBIT' ? amount : 0,
        credit: direction === 'CREDIT' ? amount : 0,
        doc: h.docCol >= 0 ? text(row[h.docCol]) : '',
        purpose: h.purposeCol >= 0 ? text(row[h.purposeCol]) : '',
      };

      if (tx.debit > 0) totalDebit += tx.debit;
      if (tx.credit > 0) totalCredit += tx.credit;
      txs.push(tx);
    }

    if (sectionRows > 0) {
      dataRows += sectionRows;
      layout.push({
        headerRow: h.row,
        amountCol: h.amountCol,
        dateCol: h.dateCol,
        direction,
        counterpartyNameCol: other.name,
        counterpartyInnCol: other.inn,
      });
    }
  }

  if (dataRows === 0) return null;

  return { format: 'TWO_SIDED', txs, ownInn, ownName, ownAccount, totalDebit, totalCredit, layout };
}

// ------------------------------------------------------------
// 2) THREE_ROW — «Cправка о работе счета»
// ------------------------------------------------------------

const MFO_CELL_RE = /МФО\s*:\s*\d+/;

export function parseThreeRowAccountReport(rows: Cell[][]): BankStatement | null {
  let headerRow = -1;
  let corrCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let dateCol = -1;
  let docCol = -1;

  const limit = Math.min(40, rows.length);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row || row.length < 4) continue;

    let corr = -1, deb = -1, cred = -1, dt = -1, doc = -1;
    for (let c = 0; c < row.length; c++) {
      const t = up(row[c]);
      if (!t) continue;
      if (corr === -1 && /КОРРЕСПОНДЕНТ/.test(t)) corr = c;
      else if (deb === -1 && /^ДЕБЕТ/.test(t)) deb = c;
      else if (cred === -1 && /^КРЕДИТ/.test(t)) cred = c;
      else if (dt === -1 && /^ДАТА/.test(t)) dt = c;
      else if (doc === -1 && /ДОКУМЕНТ|ДОК-ТА/.test(t)) doc = c;
    }
    if (corr !== -1 && deb !== -1 && cred !== -1) {
      headerRow = r; corrCol = corr; debitCol = deb; creditCol = cred; dateCol = dt; docCol = doc;
      break;
    }
  }
  if (headerRow === -1) return null;

  // IMZO: bu shaklda kontragent katagi «МФО:.. Счет:.. ИНН:..» ko'rinishida
  // bo'ladi, nomi esa keyingi qatorda turadi. Shu imzo bo'lmasa — bu boshqa
  // format, aralashmaymiz.
  let signature = 0;
  for (let i = headerRow + 1; i < rows.length; i++) {
    if (MFO_CELL_RE.test(text(rows[i]?.[corrCol]))) signature++;
    if (signature >= 3) break;
  }
  if (signature < 3) return null;

  // Sarlavha qismidan hisob egasi
  let ownAccount = '';
  let ownInn = '';
  const ownName = findOwnName(rows, headerRow);
  for (let r = 0; r < headerRow; r++) {
    const line = (rows[r] || []).map((v) => text(v)).join(' ');
    if (!line) continue;
    if (!ownAccount) {
      const m = line.match(/(?:ЛИЦЕВОЙ\s+СЧ[ЕЁ]Т|СЧ[ЕЁ]ТА?)\s*(?:No|№|N)?\s*(\d{20})/i) || line.match(/\b(\d{20})\b/);
      if (m) ownAccount = m[1];
    }
    if (!ownInn) {
      const m = line.match(/(?:ИНН|СТИР)\s*:?\s*(\d{9}|\d{14})/i);
      if (m) ownInn = m[1];
    }
  }

  const txs: BankTx[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    if (isFooterRow(row)) continue;

    const debit = parseAmount(row[debitCol]);
    const credit = parseAmount(row[creditCol]);
    if (debit <= 0 && credit <= 0) continue;

    const corr = text(row[corrCol]);
    const innMatch = corr.match(/(?:ИНН|СТИР)\s*:\s*(\d{9}|\d{14})/i);
    const accMatch = corr.match(/СЧ[ЕЁ]Т\s*:\s*(\d{20})/i);

    // Nomi va to'lov maqsadi — keyingi 1–2 qatorda, AYNI ustunda.
    let name = '';
    let purpose = '';
    for (let k = i + 1; k <= i + 3 && k < rows.length; k++) {
      const next = rows[k];
      if (!next) break;
      // keyingi o'tkazma boshlandi — to'xtaymiz
      if (parseAmount(next[debitCol]) > 0 || parseAmount(next[creditCol]) > 0) break;
      if (isFooterRow(next)) break;
      const t = text(next[corrCol]);
      if (!t || MFO_CELL_RE.test(t)) continue;
      if (!name) name = t;
      else if (!purpose) purpose = t;
    }

    if (debit > 0) totalDebit += debit;
    if (credit > 0) totalCredit += credit;

    txs.push({
      date: dateCol >= 0 ? parseDate(row[dateCol]) : null,
      inn: innMatch ? cleanInn(innMatch[1]) : '',
      name,
      account: accMatch ? accMatch[1] : '',
      debit,
      credit,
      doc: docCol >= 0 ? text(row[docCol]) : '',
      purpose,
    });
  }

  if (txs.length === 0) return null;

  return {
    format: 'THREE_ROW',
    txs,
    ownInn: cleanInn(ownInn),
    ownName,
    ownAccount,
    totalDebit,
    totalCredit,
    layout: [{
      headerRow,
      amountCol: creditCol,
      dateCol,
      direction: 'CREDIT',
      counterpartyNameCol: corrCol,
      counterpartyInnCol: -1,
    }],
  };
}

// ------------------------------------------------------------
// 3) COLUMNAR — «СПРАВКА ПО РАБОТЕ СЧЕТА» (har o'tkazma — bitta qator)
// ------------------------------------------------------------

export function parseColumnarStatement(rows: Cell[][]): BankStatement | null {
  let headerRow = -1;
  let nameCol = -1, debitCol = -1, creditCol = -1, dateCol = -1, accCol = -1, docCol = -1, purposeCol = -1;

  const limit = Math.min(40, rows.length);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row || row.length < 4) continue;

    let nm = -1, deb = -1, cred = -1, dt = -1, acc = -1, doc = -1, purp = -1;
    let hasSingleAmount = false;

    for (let c = 0; c < row.length; c++) {
      const t = up(row[c]);
      if (!t) continue;
      if (/^СУММА( ПЛАТЕЖА)?$/.test(t)) hasSingleAmount = true;
      if (nm === -1 && /НАИМЕНОВАНИЕ|КОНТРАГЕНТ|НОМИ/.test(t)) nm = c;
      else if (deb === -1 && /^ДЕБЕТ/.test(t)) deb = c;
      else if (cred === -1 && /^КРЕДИТ/.test(t)) cred = c;
      else if (dt === -1 && /^ДАТА|^САНА/.test(t)) dt = c;
      else if (acc === -1 && /^(СЧ[ЕЁ]Т|Р\/С|ЛИЦЕВОЙ СЧ[ЕЁ]Т)$/.test(t)) acc = c;
      else if (doc === -1 && /НОМЕР ДОК|№ ?ДОК|ДОК-ТА/.test(t)) doc = c;
      else if (purp === -1 && /НАЗНАЧЕНИЕ/.test(t)) purp = c;
    }

    // «Сумма платежа» bo'lsa — bu TWO_SIDED shakli, bu yerda emas.
    if (hasSingleAmount) continue;
    if (nm !== -1 && deb !== -1 && cred !== -1) {
      headerRow = r; nameCol = nm; debitCol = deb; creditCol = cred;
      dateCol = dt; accCol = acc; docCol = doc; purposeCol = purp;
      break;
    }
  }
  if (headerRow === -1) return null;

  // Hisob egasi — sarlavhadan
  let ownAccount = '';
  const ownName = findOwnName(rows, headerRow);
  for (let r = 0; r < headerRow; r++) {
    const line = (rows[r] || []).map((v) => text(v)).join(' ');
    if (!line) continue;
    const m = line.match(/(?:СЧ[ЕЁ]ТА?|HISOB)\D{0,12}(\d{20})/i) || line.match(/\b(\d{20})\b/);
    if (m) { ownAccount = m[1]; break; }
  }

  const txs: BankTx[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    if (isFooterRow(row)) continue;

    const debit = parseAmount(row[debitCol]);
    const credit = parseAmount(row[creditCol]);
    if (debit <= 0 && credit <= 0) continue;

    // Shapkadan keyingi "1 2 3 4 ..." tartib qatori
    const values = row.filter((v) => text(v) !== '');
    const smallInts = values.filter((v) => {
      const n = Number(text(v));
      return Number.isInteger(n) && n >= 0 && n <= 99;
    });
    if (values.length >= 3 && smallInts.length === values.length) continue;

    if (debit > 0) totalDebit += debit;
    if (credit > 0) totalCredit += credit;

    txs.push({
      date: dateCol >= 0 ? parseDate(row[dateCol]) : null,
      inn: '',
      name: text(row[nameCol]),
      account: accCol >= 0 ? text(row[accCol]).replace(/\D/g, '') : '',
      debit,
      credit,
      doc: docCol >= 0 ? text(row[docCol]) : '',
      purpose: purposeCol >= 0 ? text(row[purposeCol]) : '',
    });
  }

  if (txs.length === 0) return null;

  return {
    format: 'COLUMNAR',
    txs,
    ownInn: '',
    ownName,
    ownAccount,
    totalDebit,
    totalCredit,
    layout: [{
      headerRow,
      amountCol: creditCol,
      dateCol,
      direction: 'CREDIT',
      counterpartyNameCol: nameCol,
      counterpartyInnCol: -1,
    }],
  };
}

// ------------------------------------------------------------
// Umumiy kirish nuqtasi: faqat YANGI shakllar
// ------------------------------------------------------------

/** TWO_SIDED yoki THREE_ROW; boshqasi bo'lsa null. */
export function parseNewBankFormats(rows: Cell[][]): BankStatement | null {
  return parseTwoSidedTurnover(rows) || parseThreeRowAccountReport(rows);
}
