// ============================================================
// UNIVERSAL PARSER - notanish bank oborotkalari uchun
//
// Bu modul FAQAT format aniqlanmagan (GENERIC) fayllar uchun
// ishlatiladi. HAMKORBANK / IPOTEKA_ASBT / FAKTURA kabi maxsus
// parserlarga umuman aralashmaydi.
//
// Ikki bosqichda ishlaydi:
//   1. HEADER    - kengaytirilgan sinonimlar lug'ati bilan shapka
//                  qatorini topish (2 qatorli birlashgan shapkalar
//                  ham qo'llanadi)
//   2. STATISTICAL - shapka topilmasa, ustunlarning ICHIDAGI
//                  ma'lumot turiga qarab aniqlash (sana ustuni,
//                  INN ustuni, summa ustunlari...)
//
// Natija ishonchli bo'lmasa null qaytaradi - shunda chaqiruvchi
// tomondagi eski evristika ishlayveradi (xatti-harakat regressi yo'q).
// ============================================================

// XLSX sheet_to_json(header: 1) qaytaradigan katakcha turlari
export type Cell = string | number | boolean | Date | null | undefined;

export interface UniversalTx {
  name: string;
  inn: string;
  date: Date | null;
  debit: number;
  credit: number;
}

export interface UniversalResult {
  rows: UniversalTx[];
  method: 'HEADER' | 'STATISTICAL';
  /** Shapka usulida topilgan ustunlar va shapka qatori - format
   *  xotirasiga yozib qo'yish uchun (src/lib/formatMemory.ts).
   *  Statistik usulda shapka yo'q, shuning uchun berilmaydi. */
  map?: ColumnMap;
  headerRow?: number;
}

interface ColumnMap {
  date: number;
  inn: number;
  name: number;
  debit: number;
  credit: number;
  amount: number;
  purpose: number;
  account: number; // hisob raqami ustuni - ishlatilmaydi, lekin "nom" bo'lib ketmasligi uchun band qilinadi
}

// ------------------------------------------------------------
// Yordamchi funksiyalar (upload-preview dagi bilan bir xil mantiq,
// lekin bu modul o'zini o'zi ta'minlaydi - eski kodga tegilmaydi)
// ------------------------------------------------------------

function parseExcelDate(value: Cell): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  // MUHIM: kasrli serial ham sana bo'lishi mumkin (46056.6464 = sana + vaqt),
  // HTML'dan o'qilgan fayllarda esa serial string ko'rinishida keladi
  const isPureNumeric = typeof value === 'number'
    ? isFinite(value)
    : /^\d+(\.\d+)?$/.test(String(value).trim());

  if (isPureNumeric) {
    const serial = Number(value);
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }

  const strVal = String(value).trim();
  if (!strVal) return null;

  const ruDateMatch = strVal.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (ruDateMatch) {
    const day = Number(ruDateMatch[1]);
    const month = Number(ruDateMatch[2]);
    const year = Number(ruDateMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date.getTime())) return date;
    }
  }

  const fallback = new Date(strVal);
  return !isNaN(fallback.getTime()) ? fallback : null;
}

function parseAmount(val: Cell): number {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return 0;

  let str = String(val).trim();
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

  str = str.replace(/[^\d,.\s]/g, '');
  str = str.replace(/\s/g, '');
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
  if (isNaN(num)) return 0;
  return negative ? -num : num;
}

function cleanInn(inn: Cell): string {
  if (!inn) return '-';
  const cleaned = String(inn).replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : '-';
}

function isValidUzbekInn(inn: string): boolean {
  if (!/^\d{9}$/.test(inn) && !/^\d{14}$/.test(inn)) return false;
  if (inn.length === 9) {
    const mobilePrefixes = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '77', '55'];
    const prefix = inn.substring(0, 2);
    if (mobilePrefixes.includes(prefix)) return false;
  }
  return true;
}

function cellText(v: Cell): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

// O'zbek banklarida keng tarqalgan birlashgan katak:
// "20208000900123456789/305123456/ООО TEST SAVDO" -> hisob/INN/nomi
function splitCombinedCell(s: string): { inn: string; name: string } | null {
  const m = s.match(/^(\d{12,})\s*\/\s*(\d{9}|\d{14})\s*\/\s*(.+)$/);
  if (!m) return null;
  if (!isValidUzbekInn(m[2])) return null;
  return { inn: m[2], name: m[3].trim() };
}

// ------------------------------------------------------------
// Buxgalterning o'z svodka-varag'i (pivot): "Фирма номлари | СТИР |
// январь | феврал | ... | Жами | Фарқи" ko'rinishidagi jadval.
// Bu tranzaksiya ro'yxati EMAS - o'qilsa ma'lumot ikki marta
// hisoblanib ketadi, shuning uchun bunday varaq butunlay o'tkazib
// yuboriladi.
// ------------------------------------------------------------
const MONTH_WORDS = ['ЯНВАР', 'ФЕВРАЛ', 'МАРТ', 'АПРЕЛ', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГУСТ', 'СЕНТЯБР', 'ОКТЯБР', 'НОЯБР', 'ДЕКАБР'];

function isPivotSummary(rawData: Cell[][]): boolean {
  const limit = Math.min(12, rawData.length);
  for (let r = 0; r < limit; r++) {
    const row = rawData[r];
    if (!row || row.length < 6) continue;
    const rowText = row.map((v) => cellText(v)).join('|').toUpperCase();
    if (!/СТИР|ИНН|STIR/.test(rowText)) continue;
    let monthHits = 0;
    for (const m of MONTH_WORDS) if (rowText.includes(m)) monthHits++;
    if (monthHits >= 4) return true;
  }
  return false;
}

// ------------------------------------------------------------
// 1-BOSQICH: shapka qatorini topish
// ------------------------------------------------------------

type Role = keyof ColumnMap;

// TARTIB MUHIM: "ИНН КОНТРАГЕНТА" avval INN bo'lib topilishi kerak
// (name emas), "СУММА ДЕБЕТ" esa debit bo'lishi kerak (amount emas).
const ROLE_PATTERNS: Array<{ role: Role; re: RegExp }> = [
  { role: 'inn', re: /(^|[^А-ЯЁA-Z0-9])(ИНН|СТИР|ЖШШИР|INN|STIR)([^А-ЯЁA-Z0-9]|$)/ },
  // "Счёт корреспондента" kabi ustunlar NOM bo'lib ketmasligi uchun band
  // qilinadi (birinchi harf lotin C bo'lib kelishi ham uchraydi)
  { role: 'account', re: /([СC]Ч[ЁЕ]Т|Р\/С|ЛИЦЕВОЙ|HISOB\s*RAQ)/ },
  { role: 'date', re: /(ДАТА|САНА|(^|[^A-Z])(DATE|SANA)([^A-Z]|$))/ },
  { role: 'debit', re: /(ДЕБЕТ|ДЕБИТ|РАСХОД|ЧИҚИМ|ЧИКИМ|СПИСАН|DEBET|DEBIT|CHIQIM)/ },
  { role: 'credit', re: /(КРЕДИТ|ПРИХОД|КИРИМ|ЗАЧИСЛ|ПОСТУПЛ|CREDIT|KREDIT|KIRIM|TUSHUM)/ },
  { role: 'amount', re: /(СУММА|SUMMA|ОБОРОТ|AMOUNT)/ },
  { role: 'purpose', re: /(НАЗНАЧЕН|МАҚСАД|МАКСАД|ДЕТАЛИ|ОПИСАНИЕ|ИЗОХ|ИЗОҲ|IZOH|MAQSAD|КОММЕНТ|ПРИМЕЧАН)/ },
  { role: 'name', re: /(НАИМЕНОВАН|КОНТРАГЕНТ|КОРРЕСПОНДЕНТ|КЛИЕНТ|ПОЛУЧАТЕЛ|ПЛАТЕЛЬЩИК|ОЛУВЧИ|ТЎЛОВЧИ|ТУЛОВЧИ|ТАШКИЛОТ|ОРГАНИЗАЦ|ФИРМА|(^|[^А-ЯЁ])НОМИ|(^|[^A-Z])NOMI|KONTRAGENT|MIJOZ)/ },
];

function matchRole(text: string): Role | null {
  for (const { role, re } of ROLE_PATTERNS) {
    if (re.test(text)) return role;
  }
  return null;
}

// Qator ma'lumot qatoriga o'xshaydimi? (2 qatorli shapka birlashtirishda
// pastki qator haqiqiy DATA bo'lsa, uni shapka deb qo'shib yubormaslik uchun)
function looksLikeDataRow(row: Cell[]): boolean {
  for (const v of row) {
    if (typeof v === 'number' && isFinite(v) && Math.abs(v) >= 1000) return true;
    const s = cellText(v);
    if (!s) continue;
    if (/^\d{7,}$/.test(s)) return true;
    if (/\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}/.test(s)) return true;
  }
  return false;
}

// "1 2 3 4 5" ko'rinishidagi ustun-tartib qatori (ba'zi bank shakllarida
// shapkadan keyin keladi) - ma'lumot emas, tashlab yuboriladi
function isIndexRow(row: Cell[]): boolean {
  const vals = row.filter((v) => cellText(v) !== '');
  if (vals.length < 3) return false;
  let intCount = 0;
  for (const v of vals) {
    const n = Number(cellText(v));
    if (Number.isInteger(n) && n >= 0 && n <= 99) intCount++;
  }
  return intCount / vals.length >= 0.8;
}

function detectHeaderMapping(rawData: Cell[][]): { map: ColumnMap; dataStart: number; headerRow: number } | null {
  const limit = Math.min(45, rawData.length);
  let best: { map: ColumnMap; dataStart: number; score: number; headerRow: number } | null = null;

  for (let r = 0; r < limit; r++) {
    const row = rawData[r];
    if (!row || row.length < 2) continue;

    for (const twoRows of [false, true]) {
      const next = twoRows ? rawData[r + 1] : null;
      // Pastki qator ma'lumot qatori bo'lsa - u shapkaning davomi emas
      if (twoRows && (!next || looksLikeDataRow(next))) continue;

      const width = Math.min(Math.max(row.length, next ? next.length : 0), 60);
      const map: ColumnMap = { date: -1, inn: -1, name: -1, debit: -1, credit: -1, amount: -1, purpose: -1, account: -1 };
      let matched = 0;

      for (let c = 0; c < width; c++) {
        let text = cellText(row[c]);
        if (twoRows) {
          const sub = cellText(next?.[c]);
          // Faqat qisqa, harfli katakchalar shapka davomi bo'lishi mumkin
          if (sub && sub.length <= 25 && /[А-Яа-яЁёA-Za-z]/.test(sub)) {
            text = (text + ' ' + sub).trim();
          }
        }
        if (!text) continue;
        const role = matchRole(text.toUpperCase());
        if (role && map[role] === -1) {
          map[role] = c;
          matched++;
        }
      }

      const hasParty = map.inn !== -1 || map.name !== -1;
      const hasMoney = map.debit !== -1 || map.credit !== -1 || map.amount !== -1;
      if (!hasParty || !hasMoney) continue;

      let score = matched;
      if (map.inn !== -1) score += 2;
      if (map.date !== -1) score += 1;
      if (map.debit !== -1 && map.credit !== -1) score += 2;
      if (twoRows) score -= 0.5; // teng bo'lsa bitta qatorli shapka afzal

      if (!best || score > best.score) {
        best = { map, dataStart: r + (twoRows ? 2 : 1), score, headerRow: r };
      }
    }
  }

  if (!best) return null;

  const idxRow = rawData[best.dataStart];
  if (idxRow && isIndexRow(idxRow)) best.dataStart++;

  return { map: best.map, dataStart: best.dataStart, headerRow: best.headerRow };
}

// ------------------------------------------------------------
// 2-BOSQICH: statistik ustun tahlili (shapkasiz fayllar uchun)
// ------------------------------------------------------------

function detectStatisticalMapping(rawData: Cell[][]): { map: ColumnMap; dataStart: number } | null {
  // Kamida 3 ta katakchasi to'lgan qatorlar - ma'lumot qatorlari deb qaraladi
  const dataRowIdx: number[] = [];
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;
    let filled = 0;
    for (const v of row) if (cellText(v) !== '') filled++;
    if (filled >= 3) dataRowIdx.push(i);
  }
  if (dataRowIdx.length < 5) return null;

  // Namunalar fayl BO'YLAB tekis olinadi (faqat boshidan emas) - masalan
  // debet qatorlari faylning oxirgi qismida to'plangan bo'lishi mumkin
  const stride = Math.max(1, Math.floor(dataRowIdx.length / 120));
  const sampleIdx: number[] = [];
  for (let k = 0; k < dataRowIdx.length; k += stride) sampleIdx.push(dataRowIdx[k]);
  let width = 0;
  for (const i of sampleIdx) width = Math.max(width, rawData[i].length);
  width = Math.min(width, 40);

  interface ColStat {
    samples: number;
    inn: number;      // 9/14 xonali haqiqiy INN
    dateStr: number;  // DD.MM.YYYY ko'rinishidagi sana
    text: number;     // harfli matn
    amount: number;   // pul summasi bo'lishi mumkin
    account: number;  // 16+ xonali hisob raqami
    nums: number[];   // sonli qiymatlar (serial-sana va rowNum tahlili uchun)
  }

  const stats: ColStat[] = [];
  for (let c = 0; c < width; c++) {
    const st: ColStat = { samples: 0, inn: 0, dateStr: 0, text: 0, amount: 0, account: 0, nums: [] };
    for (const i of sampleIdx) {
      const v = rawData[i][c];
      const s = cellText(v);
      if (!s) continue;
      st.samples++;

      const digits = s.replace(/\D/g, '');
      if (/[А-Яа-яЁёA-Za-z]{3,}/.test(s)) st.text++;
      if (/^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}/.test(s) || v instanceof Date) st.dateStr++;
      if ((/^\d{9}$/.test(s) || /^\d{14}$/.test(s)) && isValidUzbekInn(s)) st.inn++;
      if (digits.length >= 16) st.account++;
      // HTML'dan o'qilgan fayllarda raqamlar string bo'lib keladi -
      // ularni ham sonli qiymat sifatida hisobga olamiz
      if (typeof v === 'number' && isFinite(v)) st.nums.push(v);
      else if (/^\d+(\.\d+)?$/.test(s)) st.nums.push(Number(s));

      const amt = parseAmount(v);
      if (amt !== 0 && digits.length <= 15 && !/[А-Яа-яЁёA-Za-z]/.test(s)) st.amount++;
    }
    stats.push(st);
  }

  const ratio = (st: ColStat, key: 'inn' | 'dateStr' | 'text' | 'amount' | 'account') =>
    st.samples > 0 ? st[key] / st.samples : 0;

  // Excel serial-sana ustuni (raqamli, tor diapazonda: 2000..2040 va
  // butun fayl bo'yicha farq <= 800 kun)
  const isSerialDateCol = (st: ColStat) => {
    if (st.nums.length < 5) return false;
    let min = Infinity, max = -Infinity;
    for (const n of st.nums) {
      // Kasrli serial ham sana (46056.6464 = sana + vaqt qismi)
      if (n < min) min = n;
      if (n > max) max = n;
    }
    return min >= 36526 && max <= 51500 && max - min <= 800;
  };

  // Tartib-raqam ustuni (1, 2, 3, ...) - summa emas
  const isRowNumCol = (st: ColStat) => {
    if (st.nums.length < 5) return false;
    let prev = -Infinity;
    for (const n of st.nums) {
      if (!Number.isInteger(n) || n < 0 || n > sampleIdx.length + 100 || n < prev) return false;
      prev = n;
    }
    return true;
  };

  const map: ColumnMap = { date: -1, inn: -1, name: -1, debit: -1, credit: -1, amount: -1, purpose: -1, account: -1 };

  // Sana ustuni: avval matn ko'rinishidagi sana, keyin serial
  for (let c = 0; c < width; c++) {
    if (ratio(stats[c], 'dateStr') >= 0.6) { map.date = c; break; }
  }
  if (map.date === -1) {
    for (let c = 0; c < width; c++) {
      if (isSerialDateCol(stats[c])) { map.date = c; break; }
    }
  }

  // INN ustuni
  let bestInn = 0.6;
  for (let c = 0; c < width; c++) {
    if (c === map.date) continue;
    const rt = ratio(stats[c], 'inn');
    if (rt >= bestInn) { bestInn = rt; map.inn = c; }
  }

  // Summa ustunlari nomzodlari
  const amountCols: number[] = [];
  for (let c = 0; c < width; c++) {
    if (c === map.date || c === map.inn) continue;
    const st = stats[c];
    if (ratio(st, 'amount') < 0.5) continue;
    if (ratio(st, 'account') >= 0.3) continue; // hisob raqamlari
    if (ratio(st, 'text') >= 0.3) continue;    // matn ustunlari
    if (isRowNumCol(st) || isSerialDateCol(st)) continue;
    amountCols.push(c);
  }
  if (amountCols.length === 0) return null;

  if (amountCols.length === 1) {
    map.amount = amountCols[0];
  } else {
    // Debet/Kredit jufti: bitta qatorda odatda faqat bittasi to'lgan bo'ladi
    let paired = false;
    outer: for (let a = 0; a < Math.min(amountCols.length, 4) - 1; a++) {
      for (let b = a + 1; b < Math.min(amountCols.length, 4); b++) {
        const ca = amountCols[a], cb = amountCols[b];
        let both = 0, either = 0;
        for (const i of sampleIdx) {
          const va = parseAmount(rawData[i][ca]);
          const vb = parseAmount(rawData[i][cb]);
          const pa = va > 0, pb = vb > 0;
          if (pa || pb) either++;
          if (pa && pb) both++;
        }
        if (either >= 5 && both / either <= 0.25) {
          map.debit = ca;
          map.credit = cb;
          paired = true;
          break outer;
        }
      }
    }
    if (!paired) map.amount = amountCols[0];
  }

  // Nomi ustuni: matnli ustunlar orasidan INN ustuniga eng yaqini
  let bestNameDist = Infinity;
  for (let c = 0; c < width; c++) {
    if (c === map.date || c === map.inn || c === map.debit || c === map.credit || c === map.amount) continue;
    if (ratio(stats[c], 'text') < 0.5) continue;
    const dist = map.inn >= 0 ? Math.abs(c - map.inn) : c;
    if (dist < bestNameDist) { bestNameDist = dist; map.name = c; }
  }

  // Statistik usulda ishonch talabi qat'iyroq: INN ustuni topilishi
  // SHART, yoki hech bo'lmasa nom + sana ustunlari birga bo'lsin
  if (map.inn === -1 && !(map.name !== -1 && map.date !== -1)) return null;

  return { map, dataStart: dataRowIdx[0] };
}

// ------------------------------------------------------------
// Umumiy: mapping bo'yicha qatorlarni o'qish
// ------------------------------------------------------------

// So'z chegarasi bilan: "ЖАМИ" alohida so'z bo'lishi shart -
// "маъсулияти чекланган ЖАМИяти" kabi firma nomlariga tegmaydi
const TOTAL_ROW_RE = /(^|[^А-ЯЁA-Z])(ИТОГО|ЖАМИ|ВСЕГО|JAMI|TOTAL|ОСТАТОК НА|САЛЬДО НА)([^А-ЯЁA-Z]|$)/;

function extractRows(
  rawData: Cell[][],
  map: ColumnMap,
  dataStart: number
): { rows: UniversalTx[]; candidates: number } {
  const rows: UniversalTx[] = [];
  let candidates = 0;

  for (let i = dataStart; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    let filled = 0;
    for (const v of row) if (cellText(v) !== '') filled++;
    if (filled < 2) continue;

    candidates++;

    let inn = map.inn >= 0 ? cleanInn(row[map.inn]) : '-';
    let name = map.name >= 0 ? cellText(row[map.name]) : '';

    // "hisob/INN/nomi" birlashgan katak (Hamkorbank/ABS uslubi) - INN yoki
    // nom ustunining o'zi ham shu ko'rinishda kelishi mumkin
    if (!isValidUzbekInn(inn)) {
      for (let c = 0; c < row.length; c++) {
        const comb = splitCombinedCell(cellText(row[c]));
        if (comb) {
          inn = comb.inn;
          if (!name || !/[А-Яа-яЁёA-Za-z]/.test(name) || c === map.name) name = comb.name;
          break;
        }
      }
    }
    if (!isValidUzbekInn(inn) && map.inn === -1) {
      // INN ustuni aniqlanmagan bo'lsa, qator ichidan toza INN qidiramiz
      for (let c = 0; c < row.length; c++) {
        const s = cellText(row[c]);
        if ((/^\d{9}$/.test(s) || /^\d{14}$/.test(s)) && isValidUzbekInn(s)) {
          inn = s;
          break;
        }
      }
    }

    if (name && !/[А-Яа-яЁёA-Za-z]/.test(name)) name = ''; // faqat raqamli "nom" - nom emas

    const date = map.date >= 0 ? parseExcelDate(row[map.date]) : null;

    let debit = 0;
    let credit = 0;
    if (map.debit >= 0) {
      const d = parseAmount(row[map.debit]);
      if (d > 0) debit = d;
    }
    if (map.credit >= 0) {
      const k = parseAmount(row[map.credit]);
      if (k > 0) credit = k;
    }
    if (map.debit === -1 && map.credit === -1 && map.amount >= 0) {
      // Yagona summa ustuni: yo'nalishni bilib bo'lmaydi, chiqim deb olamiz
      // (eski GENERIC evristika bilan bir xil konvensiya)
      const a = Math.abs(parseAmount(row[map.amount]));
      if (a > 0) debit = a;
    }

    if (debit <= 0 && credit <= 0) continue;

    const innOk = isValidUzbekInn(inn);
    if (!innOk && name.length < 3) continue; // na INN, na nom - ishonchsiz qator

    // "Итого"/"Жами" kabi yakuniy qatorlar hisobga olinmaydi.
    // MUHIM: haqiqiy INN'li qator hech qachon yakuniy qator emas -
    // firma nomida "жамияти" kabi so'z bo'lsa ham o'qilaveradi.
    if (!innOk) {
      const headCells = row.slice(0, 6).map((v) => cellText(v).toUpperCase());
      if (headCells.some((s) => TOTAL_ROW_RE.test(s))) continue;
    }

    rows.push({
      name: name || "Noma'lum kontragent",
      inn: innOk ? inn : '-',
      date,
      debit,
      credit,
    });
  }

  return { rows, candidates };
}

// ------------------------------------------------------------
// Asosiy kirish nuqtasi
// ------------------------------------------------------------

export function parseUniversal(rawData: Cell[][]): UniversalResult | null {
  if (!rawData || rawData.length < 3) return null;

  // Buxgalterning svodka-varag'i (oylar bo'yicha pivot) - tranzaksiya emas,
  // o'qilsa ma'lumot ikki marta hisoblanadi. Butunlay o'tkazib yuboriladi.
  if (isPivotSummary(rawData)) return null;

  const viaHeader = detectHeaderMapping(rawData);
  if (viaHeader) {
    const { rows, candidates } = extractRows(rawData, viaHeader.map, viaHeader.dataStart);
    if (rows.length >= 3 && rows.length / Math.max(1, candidates) >= 0.3) {
      return { rows, method: 'HEADER', map: viaHeader.map, headerRow: viaHeader.headerRow };
    }
  }

  const viaStats = detectStatisticalMapping(rawData);
  if (viaStats) {
    const { rows, candidates } = extractRows(rawData, viaStats.map, viaStats.dataStart);
    if (rows.length >= 4 && rows.length / Math.max(1, candidates) >= 0.45) {
      return { rows, method: 'STATISTICAL' };
    }
  }

  return null;
}
