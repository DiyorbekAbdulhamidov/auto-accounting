// ============================================================
// KONTRAGENT BO'YICHA BOSHLANG'ICH QOLDIQ (сальдо начальное)
// ------------------------------------------------------------
// NEGA BU KERAK — o'lchov bilan (docs/TAHLIL-2026-08-18.md):
// buxgalter tizimga o'rtadan qo'shiladi. Uning mijozi 2020-yildan
// ishlaydi, u esa 2026-yil fayllarini yuklaydi. Oldingi davrlardan
// qolgan qarz tizimga KO'RINMAYDI va «Акт сверки» hujjatida
// «Сальдо начальное = 0» deb chiqib ketardi — ya'ni sherikka
// yuboriladigan rasmiy hujjat YOLG'ON gapirardi.
//
// MANBASI QAYERDA:
//   · bank ko'chirmasidagi «Остаток на начало периода» — bu
//     HISOBVARAQ qoldig'i, kontragent kesimida EMAS. Yaramaydi.
//   · buxgalteriya dasturining oborotkasi — kontragent kesimi bor,
//     lekin uni bizga hech kim bermaydi.
//   · oldingi davr uchun SHU TIZIMDA saqlangan hisobot — bor.
//   · qo'lda kiritish — har doim bor.
// Shuning uchun ikkita yo'l qo'llab-quvvatlanadi: qo'lda kiritish
// va oldingi hisobotdan ko'chirish.
//
// ISHORA — butun tizimdagi bilan bir xil (HANDOFF 8-bo'lim):
//   musbat = ular qarzdor · manfiy = biz qarzdormiz
//
// MUHIM: boshlang'ich qoldiq DAVR FARQIGA QO'SHILMAYDI. «Фарқ»
// ustuni shu davrda nima bo'lganini ko'rsatadi va shundayligicha
// qoladi (58 ta tekshiruv shunga tayanadi). Qoldiq esa alohida
// ustunda turadi va YAKUNIY QOLDIQni beradi:
//
//     yakuniy qoldiq = boshlang'ich qoldiq + davr farqi
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export const OPENING_BALANCES = 'opening_balances';

/** Qaysi sverka: chiqim (yetkazib beruvchi) yoki kirim (xaridor) */
export type BalanceKind = 'out' | 'in';

export interface OpeningBalanceDoc {
  workspaceId: string;
  companyId: string;
  kind: BalanceKind;
  /** Qaysi sanadagi holat (YYYY-MM-DD). Faqat ko'rsatish uchun —
   *  hisobga kirmaydi, lekin buxgalter qaysi davrdan ekanini bilishi
   *  SHART, aks holda raqam ma'nosini yo'qotadi. */
  asOf: string;
  /** kontragent kaliti -> summa. Kalit `rowKey()` bilan bir xil:
   *  STIR bo'lsa STIR, bo'lmasa `NAME:<nom>`. */
  balances: Record<string, number>;
  updatedAt?: unknown;
}

export interface OpeningBalances {
  /** Firestore hujjati id — yangilash uchun */
  id: string | null;
  asOf: string;
  balances: Record<string, number>;
}

export const EMPTY_BALANCES: OpeningBalances = { id: null, asOf: '', balances: {} };

/**
 * Saqlangan qoldiqlarni o'qish.
 *
 * Ish maydoni filtri SHART: Firestore qoidasi so'rovni hujjatlarni
 * o'qimasdan tekshiradi va filtrsiz so'rov BUTUNLAY rad etiladi
 * (bo'sh ro'yxat emas — xato).
 */
export async function loadOpeningBalances(
  workspaceId: string,
  companyId: string,
  kind: BalanceKind
): Promise<OpeningBalances> {
  const snap = await getDocs(
    query(
      collection(db, OPENING_BALANCES),
      where('workspaceId', '==', workspaceId),
      where('companyId', '==', companyId),
      where('kind', '==', kind)
    )
  );
  if (snap.empty) return EMPTY_BALANCES;
  // Bitta korxona + yo'nalish uchun bitta hujjat bo'lishi kerak.
  // Bir nechta bo'lib qolsa — eng oxirgisi olinadi (jimgina
  // birinchisini olish noto'g'ri raqam berardi).
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as OpeningBalanceDoc) }))
    .sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
  const latest = docs[0];
  return { id: latest.id, asOf: latest.asOf || '', balances: latest.balances || {} };
}

/** Saqlash. Hujjat bor bo'lsa yangilanadi, yo'q bo'lsa yaratiladi. */
export async function saveOpeningBalances(
  workspaceId: string,
  companyId: string,
  kind: BalanceKind,
  asOf: string,
  balances: Record<string, number>,
  existingId: string | null
): Promise<string> {
  // Nol qiymatlar saqlanmaydi — ular «kiritilmagan» bilan bir xil
  // ma'noda va hujjatni bekorga shishiradi.
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(balances)) {
    if (Number.isFinite(v) && Math.abs(v) > 0.005) clean[k] = v;
  }

  if (existingId) {
    await updateDoc(doc(db, OPENING_BALANCES, existingId), {
      asOf,
      balances: clean,
      updatedAt: serverTimestamp(),
    });
    return existingId;
  }

  const ref = await addDoc(collection(db, OPENING_BALANCES), {
    workspaceId,
    companyId,
    kind,
    asOf,
    balances: clean,
    updatedAt: serverTimestamp(),
  } satisfies OpeningBalanceDoc);
  return ref.id;
}

/** Matndan summa: «1 234,56» ham, «1234.56» ham, «-1 234» ham. */
export function parseBalanceInput(raw: string): number {
  const cleaned = raw.replace(/\s| /g, '').replace(',', '.');
  if (!cleaned || cleaned === '-') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
