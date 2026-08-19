// ============================================================
// YIQILGAN FAYL JURNALI
// ------------------------------------------------------------
// Muammo: fayl o'qilmasa foydalanuvchi ekranda xato ko'radi va
// KETADI — biz esa buni hech qachon bilmaymiz. `excel_formats`
// faqat MUVAFFAQIYATLI o'rganilgan shakllarni saqlaydi, ya'ni
// tizim o'z g'alabalarini eslaydi, mag'lubiyatlarini esa yo'q.
//
// 2026-09-01 dan 10+ buxgalterga beriladi va har biri O'Z bankining
// shakli bilan keladi. Notanish shakl deyarli aniq chiqadi. Shu
// jurnalsiz sinov «nechta odam qaytdi» degan raqamdan boshqa hech
// narsa o'rgatmaydi — NEGA qaytmaganini aytmaydi.
//
// MAXFIYLIK QARORI: yozuv ISH MAYDONIGA bog'lab saqlanadi va faqat
// server (Admin SDK) o'qiydi. Shu sabab u YANGI ma'lumot oqimi
// YARATMAYDI: o'sha ish maydonining `sverka_reports` hujjatlarida
// allaqachon to'liq moliyaviy tafsilot turadi. Shunga qaramay
// SUMMALAR ataylab tashlanadi — jurnalning vazifasi «qaysi SHAKL
// tanilmadi», «qancha pul» emas.
//
// Qoidalar fayliga band QO'SHILMAYDI: klient bu kolleksiyaga
// tegmaydi, umumiy yopiq qoida amal qiladi (`excel_formats` va
// `counterparty_categories` bilan bir xil naqsh).
// ============================================================

export const PARSE_FAILURES = 'parse_failures';

/** Nima uchun yozildi. Eng og'iridan yengiliga. */
export type FailureReason =
  /** Bitta ham kontragent chiqmadi — fayl umuman ishga tushmadi */
  | 'BOSH'
  /** Varaq tanilmadi va hisobga olinmadi */
  | 'TANILMADI'
  /** O'qildi, lekin raqamini tasdiqlab bo'lmadi (na «Итого», na qoldiq) */
  | 'TASDIQLANMADI';

/** Muammoli varaqning tavsifi. SUMMALAR YO'Q — ataylab. */
export interface FailureSheet {
  file: string;
  sheet: string;
  format: string;
  rows: number;
  note?: string;
  /** `TANILMADI` varaqlarda dastlabki qatorlar — «qaysi shakl» degan
   *  savolga javob beradigan YAGONA artefakt. */
  sampleRows?: string[][];
}

export interface FailureRecord {
  workspaceId: string;
  companyId: string;
  side: 'in' | 'out';
  reason: FailureReason;
  at: string;
  fileCount: number;
  sheets: FailureSheet[];
  unverifiedFiles: string[];
  detectedFormats: string[];
  /** Ogohlantirish MATNI emas, SONI: matn ichida summalar bor. */
  warningCount: number;
}

/** Kirishdagi varaq hisoboti (statementAudit.SheetReport ning kerakli qismi) */
interface SheetLike {
  file?: string;
  sheet?: string;
  format?: string;
  rows?: number;
  note?: string;
  sampleRows?: string[][];
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Yozuvni tuzadi. Yozishga arzimasa `null` qaytaradi.
 *
 * MUVAFFAQIYATLI yuklashda yozilmaydi. Aks holda kolleksiya har
 * yuklashda o'sardi va ichidan haqiqiy muammoni topib bo'lmasdi.
 * Ogohlantirishning O'ZI ham sabab emas: davr mos kelmasligi —
 * foydalanuvchi xatosi, parser yiqilishi emas.
 */
export function buildFailureRecord(input: {
  workspaceId: string;
  companyId: string;
  side: 'in' | 'out';
  at: string;
  fileCount: number;
  parsedCount: number;
  sheets?: SheetLike[];
  unverifiedFiles?: string[];
  detectedFormats?: string[];
  warnings?: string[];
}): FailureRecord | null {
  const sheets = (input.sheets || []).filter((s) => str(s.format) === 'TANILMADI');
  const unverified = input.unverifiedFiles || [];

  let reason: FailureReason | null = null;
  if (input.parsedCount === 0) reason = 'BOSH';
  else if (sheets.length > 0) reason = 'TANILMADI';
  else if (unverified.length > 0) reason = 'TASDIQLANMADI';
  if (!reason) return null;

  return {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    side: input.side,
    reason,
    at: input.at,
    fileCount: input.fileCount,
    // Summalar (`debit`, `credit`, `allDebit` ...) UZATILMAYDI
    sheets: sheets.map((s) => ({
      file: str(s.file),
      sheet: str(s.sheet),
      format: str(s.format),
      rows: num(s.rows),
      ...(s.note ? { note: s.note } : {}),
      ...(s.sampleRows && s.sampleRows.length ? { sampleRows: s.sampleRows } : {}),
    })),
    unverifiedFiles: unverified,
    detectedFormats: input.detectedFormats || [],
    warningCount: (input.warnings || []).length,
  };
}

/** Minimal Firestore interfeysi — `firebase-admin` turini bu yerga
 *  tortib kelmaslik uchun (`workspace.ts` dagi bilan bir xil naqsh). */
interface AddableDb {
  collection(path: string): { add(data: unknown): Promise<unknown> };
}

/**
 * Yozuvni saqlaydi. Xato YUTILADI: jurnal yozilmagani uchun
 * foydalanuvchining sverkasi to'xtab qolmasligi kerak.
 */
export async function logParseFailure(
  db: AddableDb,
  record: FailureRecord | null
): Promise<void> {
  if (!record) return;
  try {
    await db.collection(PARSE_FAILURES).add(record);
  } catch (err) {
    console.error('parse_failures yozilmadi:', err);
  }
}
