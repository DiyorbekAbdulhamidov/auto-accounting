// ============================================================
// HISOBOT TARIXI
// ------------------------------------------------------------
// Muammo: saqlash HAR SAFAR yangi hujjat yaratadi (`addDoc`), lekin
// ekranda faqat ENG SO'NGGISI ko'rinardi. Ya'ni:
//
//   · buxgalter o'tgan oyning saqlangan raqamiga qaytolmasdi;
//   · eski hujjatlarni O'CHIRIB bo'lmasdi — kolleksiya cheksiz
//     o'sardi, har biri 900 KB gacha.
//
// Ikkinchisi qimmatroq: tiklash so'rovi (`getDocs`) HAMMA hujjatni
// YUKLAB OLADI va ichidan bittasini tanlaydi. 20 marta saqlangan
// korxonada bu har sahifa ochilishida o'nlab megabayt demakdir.
//
// Shu sabab tarix RO'YXATI yangi so'rov qilmaydi: tiklash effekti
// allaqachon yuklab olgan snapshot'dan tuziladi. Qo'shimcha o'qish
// NOLGA teng, foyda esa — o'chirish imkoni, ya'ni o'sishning o'zi
// to'xtaydi.
//
// Firestore qoidasi: `delete` a'zoga OCHIQ (ilgari faqat admin edi) —
// aks holda foydalanuvchi o'z ma'lumotini tozalay olmaydi.
// ============================================================
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INCOME_REPORTS, SVERKA_REPORTS } from '@/lib/workspace';

/** `in` — kirim sverkasi, `out` — chiqim sverkasi */
export type ReportKind = 'in' | 'out';

export const REPORT_COLLECTION: Record<ReportKind, string> = {
  in: INCOME_REPORTS,
  out: SVERKA_REPORTS,
};

/** Firestore `Timestamp` ning bizga kerak bo'lgan qismi. To'liq turini
 *  tortib kelmaymiz — saqlangan hujjat `serverTimestamp()` hali
 *  yozilmagan bo'lsa maydon UMUMAN bo'lmasligi mumkin. */
export interface SavedStamp {
  toMillis: () => number;
  toDate: () => Date;
}

/** Ro'yxatda ko'rsatiladigan yengil tavsif — to'liq hisobot emas. */
export interface ReportSummary {
  id: string;
  savedAt: Date | null;
  /** Davr kesimi yozuvi. Chiqim tomonida saqlanadi, kirimda yo'q. */
  periodLabel: string | null;
  /** Nechta kontragent saqlangan */
  partyCount: number;
  totals: { debit: number; credit: number; diff: number };
}

/**
 * Shu sondan oshsa ekranda ogohlantirish chiqadi. Chegara Firestore
 * hujjat hajmidan (900 KB) kelib chiqadi: 20 × 900 KB ≈ 18 MB — har
 * sahifa ochilishida shuncha yuklanadi.
 */
export const HISTORY_SOFT_LIMIT = 20;

export function stampToDate(s?: SavedStamp | null): Date | null {
  if (!s || typeof s.toDate !== 'function') return null;
  try {
    return s.toDate();
  } catch {
    return null;
  }
}

function stampMillis(s?: SavedStamp | null): number {
  if (!s || typeof s.toMillis !== 'function') return 0;
  try {
    return s.toMillis();
  } catch {
    return 0;
  }
}

/**
 * Eng yangisi birinchi. Saralash KLIENTDA — `orderBy('savedAt')`
 * qo'shilsa Firestore (workspaceId, companyId, savedAt) uchun
 * qo'shimcha kompozit indeks talab qiladi.
 *
 * Sanasi yo'q hujjat (server vaqti hali yozilmagan) OXIRIGA tushadi,
 * yo'qolmaydi.
 */
export function newestFirst<T extends { savedAt?: SavedStamp | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => stampMillis(b.savedAt) - stampMillis(a.savedAt));
}

/** Ekranga chiqadigan sana. Bank hujjatlaridagi bilan bir xil shakl. */
export function formatStamp(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------
   TAVSIF TUZISH
   ------------------------------------------------------------
   Ikkala sverkaning saqlangan shakli BOSHQA, lekin ro'yxatda bir
   xil ko'rinadi. Shuning uchun moslashtiruvchilar shu yerda —
   komponentda emas: ishora qoidasi («Фарқ» = debet − kredit)
   bitta joyda turadi.
   ------------------------------------------------------------ */

/** Chiqim tomonining saqlangan hujjati (kerakli qismi) */
export interface OutgoingSavedShape {
  savedAt?: SavedStamp | null;
  period?: { label?: string | null } | null;
  totals?: { debit?: number; credit?: number; diff?: number } | null;
  firmsData?: unknown[] | null;
}

/** Kirim tomonining saqlangan hujjati (kerakli qismi) */
export interface IncomingSavedShape {
  savedAt?: SavedStamp | null;
  report?: {
    parties?: unknown[] | null;
    totals?: { bankCredit?: number; facturaSent?: number; difference?: number } | null;
    meta?: { periodFrom?: string | null; periodTo?: string | null } | null;
  } | null;
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function summarizeOutgoing(id: string, d: OutgoingSavedShape): ReportSummary {
  const debit = num(d.totals?.debit);
  const credit = num(d.totals?.credit);
  return {
    id,
    savedAt: stampToDate(d.savedAt),
    periodLabel: d.period?.label ? String(d.period.label) : null,
    partyCount: Array.isArray(d.firmsData) ? d.firmsData.length : 0,
    // `diff` saqlangan bo'lsa ham QAYTA hisoblanadi: eski hujjatlarda
    // ishora teskari bo'lishi mumkin (2026-08-16 dagi tuzatishgacha).
    totals: { debit, credit, diff: debit - credit },
  };
}

export function summarizeIncoming(id: string, d: IncomingSavedShape): ReportSummary {
  const r = d.report;
  // Kirimda DEBET — yozilgan faktura, KREDIT — tushgan pul.
  const debit = num(r?.totals?.facturaSent);
  const credit = num(r?.totals?.bankCredit);
  const from = r?.meta?.periodFrom;
  const to = r?.meta?.periodTo;
  return {
    id,
    savedAt: stampToDate(d.savedAt),
    periodLabel: from && to ? `${from} … ${to}` : null,
    partyCount: Array.isArray(r?.parties) ? r.parties.length : 0,
    totals: { debit, credit, diff: debit - credit },
  };
}

/** Saqlangan hisobotni o'chirish. Firestore qoidasi ish maydonini
 *  tekshiradi — begona hisobot o'chmaydi. */
export async function deleteReport(kind: ReportKind, id: string): Promise<void> {
  await deleteDoc(doc(db, REPORT_COLLECTION[kind], id));
}
