// API route'lar uchun avtorizatsiya qatlami.
//
// Nega har bir route ichida tekshiriladi (Proxy'da emas):
//   1) Next.js hujjati Proxy'ni to'liq avtorizatsiya yechimi sifatida
//      ishlatishni tavsiya qilmaydi — u faqat "optimistik tekshiruv" uchun;
//   2) firebase-admin Node runtime talab qiladi, Proxy'da ishlamaydi.
//
// Qoida AuthContext.tsx bilan bir xil: Firebase'da autentifikatsiyadan
// o'tgan bo'lish YETARLI EMAS — email `allowed_users` ro'yxatida ham
// bo'lishi shart.

import { NextResponse } from "next/server";
import { getAdminServices, getAdminInitError, type AdminServices } from "./firebaseAdmin";
import { resolveWorkspaceId } from "./workspace";

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
  /** Foydalanuvchining ish maydoni. Yo'q bo'lsa shu yerda YARATILADI —
   *  aks holda ma'lumot egasiz yozilib qolardi (src/lib/workspace.ts). */
  workspaceId: string;
}

export type AuthError = NextResponse<{ error: string }>;

export type AuthResult =
  | { ok: true; user: AuthUser; admin: AdminServices }
  | { ok: false; response: AuthError };

function deny(message: string, status: number): AuthResult {
  return { ok: false, response: NextResponse.json({ error: message }, { status }) };
}

/**
 * Authorization: Bearer <idToken> ni tekshiradi va foydalanuvchi
 * `allowed_users` ro'yxatida faol ekanini tasdiqlaydi.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  // Butun tana try ichida: bu yerdan chiqqan har qanday exception route
  // handler'da ushlanmay qoladi va Next.js JSON o'rniga HTML xato sahifasi
  // qaytaradi — deploy'da sababni ko'rib bo'lmaydi.
  try {
    const admin = await getAdminServices();
    if (!admin) {
      return deny(`Server созламалари: ${getAdminInitError() ?? "номаълум хато"}`, 500);
    }

    const header = req.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      return deny("Авторизация талаб қилинади.", 401);
    }

    let decoded;
    try {
      decoded = await admin.auth.verifyIdToken(token);
    } catch {
      return deny("Сессия яроқсиз ёки муддати тугаган. Қайта киринг.", 401);
    }

    const email = decoded.email;
    if (!email) {
      return deny("Фойдаланувчи электрон почтаси аниқланмади.", 403);
    }

    const snap = await admin.db.collection("allowed_users").doc(email).get();
    if (!snap.exists) {
      return deny("Сизга бу тизимга киришга рухсат берилмаган.", 403);
    }

    const data = snap.data() ?? {};
    if (data.status && data.status !== "active") {
      return deny("Ҳисобингиз фаол эмас.", 403);
    }

    // Ish maydoni har API chaqiruvida ta'minlanadi: eski foydalanuvchilarda
    // u yo'q, shuning uchun birinchi so'rovda yaratiladi.
    let workspaceId = typeof data.workspaceId === "string" ? data.workspaceId : "";
    if (!workspaceId) {
      const { FieldValue } = await import("firebase-admin/firestore");
      workspaceId = await resolveWorkspaceId(
        admin.db as unknown as Parameters<typeof resolveWorkspaceId>[0],
        email,
        FieldValue.serverTimestamp()
      );
    }

    return {
      ok: true,
      user: { uid: decoded.uid, email, role: String(data.role ?? "user"), workspaceId },
      admin,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("🔴 requireUser:", msg);
    return deny(`Авторизация текширувида хато: ${msg}`, 500);
  }
}

/** requireUser + `role: "admin"` sharti. */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const result = await requireUser(req);
  if (!result.ok) return result;

  if (result.user.role !== "admin") {
    return deny("Бу амал учун администратор ҳуқуқи керак.", 403);
  }
  return result;
}

/**
 * Korxona SHU foydalanuvchining ish maydoniga tegishlimi?
 *
 * Nega kerak: `companyId` klientdan keladi. Firestore qoidalari Admin SDK'ga
 * TA'SIR QILMAYDI, ya'ni route ichida tekshirilmasa, istalgan foydalanuvchi
 * begona korxonaning kontragent toifalarini o'qib/yozib yuborardi.
 */
export async function assertCompanyAccess(
  admin: AdminServices,
  companyId: string,
  workspaceId: string
): Promise<AuthError | null> {
  if (!companyId) return null; // korxonasiz ham sverka qilinadi (saqlanmaydi)
  const snap = await admin.db.collection("companies").doc(companyId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Корхона топилмади." }, { status: 404 });
  }
  if (snap.data()?.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Бу корхона сизнинг иш майдонингизга тегишли эмас." }, { status: 403 });
  }
  return null;
}
