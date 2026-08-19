// ============================================================
// ISH MAYDONI (workspace) — ma'lumot EGALIGI
//
// Nega bu bor: 2026-08-13 gacha tizimda egalik tushunchasi umuman
// yo'q edi. `companies` hujjatida faqat {name, inn, createdAt} turardi,
// Firestore qoidasi esa «email allowed_users da bormi» degan yagona
// shartga tayanardi. Ya'ni IKKINCHI foydalanuvchi qo'shilishi bilan
// u BIRINCHISINING mijozlarini va ularning pul aylanmasini ko'rardi.
//
// Model ataylab yagona: shaxsiy akkaunt ham, byuro ham bitta shakl.
// Shaxsiy akkaunt — bu bitta a'zoli ish maydoni. Shuning uchun keyin
// jamoa qo'shilganda ma'lumot modeli qayta qurilmaydi.
//
//   workspaces/{id}                  name, ownerEmail, createdAt, plan
//   workspaces/{id}/members/{email}   role, status
//   companies/{id}                    + workspaceId
//   sverka_reports/{id}               + workspaceId   (CHIQIM sverkasi)
//   income_reports/{id}               + workspaceId   (KIRIM sverkasi)
//
// Foydalanuvchining ish maydoni `allowed_users/{email}.workspaceId` da
// yoziladi — mijoz uni o'z hujjatidan o'qiy oladi (qoida ruxsat beradi),
// ya'ni qo'shimcha so'rov kerak emas.
// ============================================================

export const WORKSPACES = 'workspaces';
export const MEMBERS = 'members';
import { toE164 } from './phone';
export const ALLOWED_USERS = 'allowed_users';

/** Chiqim sverkasi hisobotlari (tarixiy nom — o'zgartirilmaydi:
 *  bazada allaqachon ma'lumot bor) */
export const SVERKA_REPORTS = 'sverka_reports';

/** Kirim sverkasi hisobotlari. Alohida kolleksiya — sabab
 *  `firestore.rules` da yozilgan. */
export const INCOME_REPORTS = 'income_reports';

/**
 * HISOB KALITI — bitta manba.
 *
 * Email bo'lsa email, bo'lmasa telefon raqami (E.164, `+998...`).
 * Bu qoida UCH joyda bir xil bo'lishi SHART:
 *   · `firestore.rules` dagi `authKey()`
 *   · server (`apiAuth.ts`, `signup/route.ts`)
 *   · klient (`AuthContext.tsx`)
 *
 * Biri farq qilsa server bir hujjatni, qoidalar boshqasini tekshiradi va
 * foydalanuvchi «ruxsat yo'q» xatosini oladi — sababi esa ko'rinmaydi.
 * Shu sabab funksiya shu yerda, hamma uni CHAQIRADI.
 *
 * Firebase klient `User` da maydon `phoneNumber`, serverda esa
 * `phone_number` — shuning uchun ikkita alohida parametr.
 */
export function accountKeyOf(
  email?: string | null,
  phone?: string | null
): string | null {
  return email || phone || null;
}

/**
 * Taklif oynasiga yozilgan matndan HISOB KALITINI tuzadi.
 *
 * Yuqoridagi qoidaning JUFTI: u tokendan kalit oladi, bu esa QO'LDA
 * yozilgan matndan. Ikkalasi bir xil natija berishi shart — aks holda
 * taklif bir kalitga yoziladi, odam esa boshqasi bilan kiradi va unga
 * YANGI ish maydoni ochilib ketadi (xato ham chiqmaydi).
 *
 * `@` bo'yicha ajratiladi: telefon raqamida u hech qachon bo'lmaydi.
 * Telefon `toE164` dan o'tadi — Firebase ham aynan shu shaklni yozadi.
 */
export function inviteKeyOf(
  raw: unknown
): { key: string; email?: string; phone?: string } | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  if (value.includes('@')) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { key: email, email } : null;
  }
  const phone = toE164(value);
  return phone ? { key: phone, phone } : null;
}

export type WorkspaceRole = 'owner' | 'member';

export interface WorkspaceDoc {
  name: string;
  ownerEmail: string;
  createdAt: unknown;
  /** Rejalar keyin qo'shiladi; hozir hammasi 'free' */
  plan: 'free' | 'buxgalter' | 'byuro';
}

export interface MemberDoc {
  role: WorkspaceRole;
  status: 'active' | 'invited' | 'blocked';
  addedAt: unknown;
}

/**
 * Ish maydoni nomi: «Aziz (buxgalter)» emas, oddiy va o'zgartirsa bo'ladigan.
 *
 * Kalit TELEFON RAQAMI ham bo'lishi mumkin (`+998...`) — unda `@` yo'q va
 * bo'lish natijasi raqamning o'zi bo'ladi. Shu holda raqam shundayligicha
 * qoladi: buxgalter o'z ish maydonini raqamidan tanib oladi.
 */
export function defaultWorkspaceName(accountKey: string): string {
  const local = accountKey.split('@')[0] || 'Ish maydoni';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Minimal Firestore interfeysi — `firebase-admin` turini bu yerga
 *  tortib kelmaslik uchun (u faqat server tomonda mavjud). */
interface AdminLikeDb {
  collection(path: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
      set(data: unknown, options?: { merge: boolean }): Promise<unknown>;
      collection(path: string): { doc(id: string): { set(data: unknown, options?: { merge: boolean }): Promise<unknown> } };
    };
  };
}

/**
 * Foydalanuvchining ish maydonini qaytaradi. Yo'q bo'lsa YARATADI va
 * `allowed_users` hujjatiga yozib qo'yadi.
 *
 * Ataylab shu yerda: agar bu mantiq har route'da takrorlansa, bittasida
 * unutilib qolishi va ma'lumot egasiz yozilishi mumkin edi.
 */
export async function resolveWorkspaceId(
  db: AdminLikeDb,
  /** Hisob kaliti: email YOKI telefon raqami (E.164). SMS bilan kirganda
   *  email UMUMAN bo'lmaydi — `firestore.rules` dagi `authKey()` bilan
   *  bir xil qoida. */
  accountKey: string,
  now: unknown
): Promise<string> {
  const userRef = db.collection(ALLOWED_USERS).doc(accountKey);
  const snap = await userRef.get();
  const existing = snap.exists ? snap.data()?.workspaceId : undefined;
  if (typeof existing === 'string' && existing) return existing;

  // Ish maydoni identifikatori — hisob kalitining o'zi. Barqaror, taxmin
  // qilinadigan va migratsiyada qayta hisoblash oson.
  const workspaceId = accountKey;

  await db.collection(WORKSPACES).doc(workspaceId).set(
    {
      name: defaultWorkspaceName(accountKey),
      // Tarixiy nom — o'zgartirilmaydi (bazada allaqachon ma'lumot bor).
      // Ichida telefon raqami ham turishi mumkin.
      ownerEmail: accountKey,
      createdAt: now,
      plan: 'free',
    },
    { merge: true }
  );
  await db.collection(WORKSPACES).doc(workspaceId)
    .collection(MEMBERS).doc(accountKey)
    .set({ role: 'owner', status: 'active', addedAt: now }, { merge: true });

  await userRef.set({ workspaceId }, { merge: true });
  return workspaceId;
}
