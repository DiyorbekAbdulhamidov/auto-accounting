import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Faqat administrator yangi foydalanuvchi yarata oladi
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email ва парол киритилиши шарт." }, { status: 400 });
    }
    if (role && role !== "user" && role !== "admin") {
      return NextResponse.json({ error: "Роль нотўғри." }, { status: 400 });
    }

    const adminAuth = getAuth();
    const db = getFirestore();

    // Promise.race orqali Firebase ulanishini 8 soniya bilan cheklaymiz
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase серверига уланиш вақти тугади (Timeout).")), 8000)
    );

    const createUserPromise = async () => {
      const userRecord = await adminAuth.createUser({ email, password, emailVerified: true });
      await db.collection("allowed_users").doc(email).set({
        uid: userRecord.uid,
        role: role || "user",
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: auth.user.email,
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
