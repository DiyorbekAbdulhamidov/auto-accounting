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
//   sverka_reports/{id}               + workspaceId
//
// Foydalanuvchining ish maydoni `allowed_users/{email}.workspaceId` da
// yoziladi — mijoz uni o'z hujjatidan o'qiy oladi (qoida ruxsat beradi),
// ya'ni qo'shimcha so'rov kerak emas.
// ============================================================

export const WORKSPACES = 'workspaces';
export const MEMBERS = 'members';
export const ALLOWED_USERS = 'allowed_users';

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

/** Ish maydoni nomi: «Aziz (buxgalter)» emas, oddiy va o'zgartirsa bo'ladigan */
export function defaultWorkspaceName(email: string): string {
  const local = email.split('@')[0] || 'Ish maydoni';
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
  email: string,
  now: unknown
): Promise<string> {
  const userRef = db.collection(ALLOWED_USERS).doc(email);
  const snap = await userRef.get();
  const existing = snap.exists ? snap.data()?.workspaceId : undefined;
  if (typeof existing === 'string' && existing) return existing;

  // Ish maydoni identifikatori — emailning o'zi. Barqaror, taxmin
  // qilinadigan va migratsiyada qayta hisoblash oson.
  const workspaceId = email;

  await db.collection(WORKSPACES).doc(workspaceId).set(
    {
      name: defaultWorkspaceName(email),
      ownerEmail: email,
      createdAt: now,
      plan: 'free',
    },
    { merge: true }
  );
  await db.collection(WORKSPACES).doc(workspaceId)
    .collection(MEMBERS).doc(email)
    .set({ role: 'owner', status: 'active', addedAt: now }, { merge: true });

  await userRef.set({ workspaceId }, { merge: true });
  return workspaceId;
}
