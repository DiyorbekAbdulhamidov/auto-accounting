import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminServices() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(".env.local faylida Firebase kalitlari to'liq kiritilmagan!");
  }

  if (getApps().length === 0) {
    // --- KALITNI TOZALASH VA FORMATLASH FILTERI ---
    // Agar kalit chetlarida ortiqcha qo'shtirnoqlar qolib ketgan bo'lsa olib tashlaymiz
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

    // Agar kalit ichida \n harflari bo'lsa, ularni haqiqiy yangi qator belgisiga aylantiramiz
    privateKey = privateKey.replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

export async function POST(req: Request) {
  try {
    const { auth, db } = getAdminServices();
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email va parol majburiy!" }, { status: 400 });
    }

    // 1. Firebase Auth'da foydalanuvchi ochish
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // 2. Firestore'ga oq ro'yxat sifatida yozish
    await db.collection("allowed_users").doc(email).set({
      uid: userRecord.uid,
      role: role || "user",
      status: "active",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Foydalanuvchi yaratildi!" });
  } catch (error: any) {
    console.error("🔴 API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}