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
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebaseAdmin";

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
}

export type AuthError = NextResponse<{ error: string }>;

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: AuthError };

function deny(message: string, status: number): AuthResult {
  return { ok: false, response: NextResponse.json({ error: message }, { status }) };
}

/**
 * Authorization: Bearer <idToken> ni tekshiradi va foydalanuvchi
 * `allowed_users` ro'yxatida faol ekanini tasdiqlaydi.
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  if (!getAdminApp()) {
    return deny("Server созламалари тўлиқ эмас.", 500);
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return deny("Авторизация талаб қилинади.", 401);
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch {
    return deny("Сессия яроқсиз ёки муддати тугаган. Қайта киринг.", 401);
  }

  const email = decoded.email;
  if (!email) {
    return deny("Фойдаланувчи электрон почтаси аниқланмади.", 403);
  }

  const snap = await getFirestore().collection("allowed_users").doc(email).get();
  if (!snap.exists) {
    return deny("Сизга бу тизимга киришга рухсат берилмаган.", 403);
  }

  const data = snap.data() ?? {};
  if (data.status && data.status !== "active") {
    return deny("Ҳисобингиз фаол эмас.", 403);
  }

  return {
    ok: true,
    user: { uid: decoded.uid, email, role: String(data.role ?? "user") },
  };
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
