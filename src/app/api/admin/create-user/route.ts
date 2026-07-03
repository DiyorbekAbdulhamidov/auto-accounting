import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dns from "dns";

// O'zbekiston/Windows sharoitida IPv6 dagi ulanish bloklarini chetlab o'tish
dns.setDefaultResultOrder("ipv4first");

const globalRef = global as any;

if (!globalRef.firebaseAdminApp) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Kalitni tozalash (ortiqcha qo'shtirnoq va yangi qator belgilari)
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, "\n");

    if (getApps().length === 0) {
      globalRef.firebaseAdminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
      console.log("⚡ Firebase Admin Singleton muvaffaqiyatli ishga tushdi.");
    } else {
      globalRef.firebaseAdminApp = getApps()[0];
    }
  }
}

export async function POST(req: Request) {
  try {
    if (!globalRef.firebaseAdminApp) {
      return NextResponse.json({ error: "Firebase sozlamalari to'liq emas." }, { status: 500 });
    }

    const auth = getAuth();
    const db = getFirestore();
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email va parol kiritilishi shart." }, { status: 400 });
    }

    // Promise.race orqali Firebase ulanishini 8 soniya bilan cheklaymiz
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase serveriga ulanish vaqti tugadi (Timeout).")), 8000)
    );

    const createUserPromise = async () => {
      const userRecord = await auth.createUser({ email, password, emailVerified: true });
      await db.collection("allowed_users").doc(email).set({
        uid: userRecord.uid,
        role: role || "user",
        status: "active",
        createdAt: new Date().toISOString(),
      });
      return userRecord;
    };

    // Yoki createUser tugaydi, yoki timeout ishga tushib xato qaytaradi
    await Promise.race([createUserPromise(), timeoutPromise]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🔴 API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}