// Firebase Admin SDK — faqat SERVER tomonda (Node runtime).
//
// firebase-admin ATAYLAB dinamik import qilinadi. Sababi: statik import
// modul yuklanish paytida yiqilsa, uni route handler ichidagi try/catch
// USHLAY OLMAYDI — Next.js JSON o'rniga HTML xato sahifasi qaytaradi va
// deploy'da sababni topib bo'lmaydi. Dinamik import bilan har qanday
// muammo oddiy xato xabariga aylanadi.

import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import dns from "dns";

// O'zbekiston/Windows sharoitida IPv6 ulanish bloklarini chetlab o'tish.
// Ba'zi muhitlarda bu API bo'lmasligi mumkin — yiqilmasin.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // muhim emas
}

// Next.js hot-reload'da modul qayta yuklansa ham bitta app qolishi uchun
const globalRef = global as unknown as { firebaseAdminApp?: App };

let initError: string | null = null;

/** Oxirgi urinish nega muvaffaqiyatsiz bo'lganini qaytaradi. */
export function getAdminInitError(): string | null {
  return initError;
}

export interface AdminServices {
  auth: Auth;
  db: Firestore;
}

/**
 * Admin xizmatlarini qaytaradi, muammo bo'lsa null (sabab getAdminInitError'da).
 * HECH QACHON exception tashlamaydi.
 */
export async function getAdminServices(): Promise<AdminServices | null> {
  try {
    const [appMod, authMod, storeMod] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
      import("firebase-admin/firestore"),
    ]);

    if (!globalRef.firebaseAdminApp) {
      const existing = appMod.getApps();
      if (existing.length > 0) {
        globalRef.firebaseAdminApp = existing[0];
      } else {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        const missing = [
          !projectId && "FIREBASE_PROJECT_ID",
          !clientEmail && "FIREBASE_CLIENT_EMAIL",
          !privateKey && "FIREBASE_PRIVATE_KEY",
        ].filter(Boolean);

        if (missing.length > 0) {
          initError = `муҳит ўзгарувчилари йўқ — ${missing.join(", ")}`;
          console.error("🔴 Firebase Admin:", initError);
          return null;
        }

        // Kalitni tozalash (ortiqcha qo'shtirnoq va yangi qator belgilari)
        privateKey = privateKey!.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

        globalRef.firebaseAdminApp = appMod.initializeApp({
          credential: appMod.cert({
            projectId: projectId!,
            clientEmail: clientEmail!,
            privateKey,
          }),
        });
        console.log("⚡ Firebase Admin Singleton муваффақиятли ишга тушди.");
      }
    }

    initError = null;
    return {
      auth: authMod.getAuth(globalRef.firebaseAdminApp),
      db: storeMod.getFirestore(globalRef.firebaseAdminApp),
    };
  } catch (e) {
    initError = e instanceof Error ? e.message : String(e);
    console.error("🔴 Firebase Admin ишга тушмади:", initError);
    return null;
  }
}
