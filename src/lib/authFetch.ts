"use client";

// API so'rovlariga joriy foydalanuvchining Firebase ID tokenini qo'shadi.
// Barcha /api/... chaqiruvlari shu orqali ketishi kerak.

import { getAuth } from "firebase/auth";
import { app } from "./firebase";

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const user = getAuth(app).currentUser;
  if (!user) {
    throw new Error("Сессия тугаган. Илтимос, қайта киринг.");
  }

  const token = await user.getIdToken();

  // Headers orqali qo'shamiz — FormData yuborilganda brauzer
  // Content-Type'ni (multipart boundary bilan) o'zi qo'yishi kerak.
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...init, headers });
}
