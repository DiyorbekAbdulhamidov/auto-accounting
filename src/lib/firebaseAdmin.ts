// Firebase Admin SDK singleton.
//
// Bu modul faqat SERVER tomonda ishlaydi (firebase-admin Node runtime
// talab qiladi, Proxy/Edge'da ishlamaydi).

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import dns from "dns";

// O'zbekiston/Windows sharoitida IPv6 dagi ulanish bloklarini chetlab o'tish
dns.setDefaultResultOrder("ipv4first");

// Next.js hot-reload'da modul qayta yuklansa ham bitta app qolishi uchun
const globalRef = global as unknown as { firebaseAdminApp?: App };

/**
 * Admin app'ni qaytaradi. Muhit o'zgaruvchilari to'liq bo'lmasa null —
 * chaqiruvchi tomon buni 500 bilan qaytarishi kerak.
 */
export function getAdminApp(): App | null {
  if (globalRef.firebaseAdminApp) return globalRef.firebaseAdminApp;

  if (getApps().length > 0) {
    globalRef.firebaseAdminApp = getApps()[0];
    return globalRef.firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  // Kalitni tozalash (ortiqcha qo'shtirnoq va yangi qator belgilari)
  privateKey = privateKey.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

  globalRef.firebaseAdminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  console.log("⚡ Firebase Admin Singleton muvaffaqiyatli ishga tushdi.");

  return globalRef.firebaseAdminApp;
}
