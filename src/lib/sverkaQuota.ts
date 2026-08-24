// ============================================================
// OYLIK SVERKA SANOG'I
// ------------------------------------------------------------
// Bepul rejada oyiga 3 ta sverka. Sabablar `plans.ts` da.
//
// SANOQ BIRLIGI: ko'chirma EGASI × DAVR OYI.
//
//   · «Egasi» — bank ko'chirmasidan o'qiladigan STIR yoki hisob
//     raqami. Uni parser allaqachon ajratib olardi (egasining o'z
//     qatorlarini sverkadan chiqarish uchun).
//   · «Davr oyi» — ko'chirma boshlanadigan oy (YYYY-MM). Aniq
//     kunlar EMAS: 01.08–30.08 va 01.08–31.08 bir xil sverka,
//     ikki marta pul yemasligi kerak.
//
// Shundan kelib chiqadi:
//   · qayta yuklash bepul — kalit o'zgarmaydi;
//   · chiqim va kirim bitta hisoblanadi — ikkalasida ham egasi va
//     davr bir xil, demak kalit bir xil. Aks holda «3 ta» aslida
//     1,5 ta bo'lib qolardi;
//   · hammasini bitta korxonaga yig'ish yordam bermaydi — kalit
//     korxona yozuvidan emas, FAYLDAN olinadi.
//
// QACHON YOZILADI: tahlil MUVAFFAQIYATLI tugagandan keyin. Fayl
// o'qilmasa yoki ichidan ma'lumot chiqmasa — joy band bo'lmaydi.
// Odam yiqilgan urinish uchun pul to'lamaydi.
// ============================================================

import { limitsOf, planOf, type Plan } from './plans';
import { WORKSPACES } from './workspace';

export const SVERKA_USAGE = 'sverka_usage';

/** Minimal Firestore interfeysi — `firebase-admin` turini bu yerga
 *  tortib kelmaslik uchun (`workspace.ts` dagi bilan bir xil naqsh). */
interface DocRef {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
}
interface TxnDb {
  collection(path: string): { doc(id: string): DocRef };
  runTransaction<T>(fn: (t: Txn) => Promise<T>): Promise<T>;
}
interface Txn {
  get(ref: DocRef): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(ref: DocRef, data: unknown, options?: { merge?: boolean }): unknown;
}

/** Sanoq oynasi: `2026-08`. Ish maydonining vaqt mintaqasi emas,
 *  serverniki — farqi bir necha soat, cheklovga ta'siri yo'q. */
export function usageMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Sverka kaliti.
 *
 * `companyId` — faqat ZAXIRA: ba'zi ko'chirma shakllarida egasining
 * STIRi ham, hisob raqami ham topilmaydi. Unda kalit korxonaga
 * qaytadi, ya'ni eski («korxona bo'yicha») xulq bilan bir xil
 * bo'ladi — bu kamdan-kam holat va u sanoqni pasaytirmaydi.
 */
export function sverkaKey(
  own: { inn?: string; account?: string },
  periodFrom: string | null | undefined,
  companyId: string
): string {
  const inn = own.inn && own.inn !== '-' ? own.inn.trim() : '';
  const account = own.account ? own.account.trim() : '';
  const who = inn || account || `korxona:${companyId}`;
  const when =
    periodFrom && /^\d{4}-\d{2}/.test(periodFrom) ? periodFrom.slice(0, 7) : 'davrsiz';
  return `${who}|${when}`;
}

export interface QuotaOutcome {
  /** Sverka ko'rsatilsinmi */
  allowed: boolean;
  /** Shu oyda ishlatilgan sverka soni (shu urinish bilan birga) */
  used: number;
  /** Oylik cheklov. `null` — cheksiz (JSON `Infinity` ni ko'tarmaydi) */
  limit: number | null;
  plan: Plan;
  planLabel: string;
}

/**
 * Joyni BAND QILADI. Kalit shu oyda allaqachon bo'lsa — hech narsa
 * o'zgarmaydi va sverka o'tadi (qayta yuklash bepul).
 *
 * Tranzaksiya ichida: ikkita fayl bir vaqtda yuklansa ham sanoq
 * buzilmaydi.
 */
export async function claimSverka(
  db: TxnDb,
  workspaceId: string,
  key: string,
  now: Date = new Date()
): Promise<QuotaOutcome> {
  const month = usageMonth(now);
  const wsRef = db.collection(WORKSPACES).doc(workspaceId);
  const usageRef = db.collection(SVERKA_USAGE).doc(`${workspaceId}_${month}`);

  return db.runTransaction(async (t) => {
    // Tranzaksiyada BARCHA o'qish yozishdan oldin bo'lishi shart.
    const wsSnap = await t.get(wsRef);
    const plan = planOf(wsSnap.data()?.plan);
    const limits = limitsOf(plan);

    if (!Number.isFinite(limits.sverkaPerMonth)) {
      // Cheksiz rejada sanoq YOZILMAYDI: keraksiz yozuv ham,
      // keraksiz hujjat ham to'planmaydi.
      return { allowed: true, used: 0, limit: null, plan, planLabel: limits.label };
    }

    const usageSnap = await t.get(usageRef);
    const raw = usageSnap.data()?.keys;
    const keys: string[] = Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : [];

    if (keys.includes(key)) {
      return { allowed: true, used: keys.length, limit: limits.sverkaPerMonth, plan, planLabel: limits.label };
    }

    if (keys.length >= limits.sverkaPerMonth) {
      return { allowed: false, used: keys.length, limit: limits.sverkaPerMonth, plan, planLabel: limits.label };
    }

    const next = [...keys, key];
    t.set(usageRef, { workspaceId, month, keys: next, updatedAt: now.toISOString() }, { merge: true });
    return { allowed: true, used: next.length, limit: limits.sverkaPerMonth, plan, planLabel: limits.label };
  });
}

/** Cheklovga yetganda ko'rsatiladigan matn.
 *
 *  ATAYLAB STATIK: `t()` ning kaliti — kirill matnning O'ZI, ya'ni
 *  ichiga son qo'shilsa lug'atdan o'tmay qoladi va rus/ingliz
 *  interfeysda o'zbekcha kirill bo'lib chiqardi. Sonlar javobning
 *  `used`/`limit` maydonlarida qoladi — ekran ularni o'zi ko'rsatadi.
 *
 *  DIQQAT: matndagi «3» va `PLANS.free.sverkaPerMonth` bir xil
 *  bo'lishi shart. Buni `verify-parsers` tekshiradi. */
export const QUOTA_MESSAGE =
  'Бепул режада ойига 3 та сверка. Бу ойдаги сафингиз тугади. ' +
  'Бир мижознинг айни ўша даврини қайта юклаш янги сверка ҳисобланмайди.';

export function quotaMessage(): string {
  return QUOTA_MESSAGE;
}
