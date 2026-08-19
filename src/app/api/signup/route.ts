// app/api/signup/route.ts
//
// RO'YXATDAN O'TISH — o'zi ro'yxatdan o'tadi va DARHOL ishlaydi.
//
// Nega alohida route: `requireUser()` foydalanuvchi `allowed_users` da
// bo'lishini talab qiladi, yangi kelgan odamda esa u hali yo'q — ya'ni
// tovuq-tuxum holati. Shuning uchun bu yerda token O'ZI tekshiriladi.
//
// Klient avval Firebase'da hisob ochadi (createUserWithEmailAndPassword),
// keyin o'sha tokeni bilan shu route'ni chaqiradi. Route esa:
//   allowed_users/{email}  yaratadi (status: active)
//   workspaces/{email}     ish maydonini ochadi va uni ega qiladi
//
// Idempotent: ikkinchi marta chaqirilsa hech narsa buzilmaydi.

import { NextResponse } from 'next/server';
import { getAdminServices, getAdminInitError } from '@/lib/firebaseAdmin';
import { accountKeyOf, resolveWorkspaceId, ALLOWED_USERS, MEMBERS, WORKSPACES } from '@/lib/workspace';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const admin = await getAdminServices();
    if (!admin) {
      return NextResponse.json(
        { error: `Server созламалари: ${getAdminInitError() ?? 'номаълум хато'}` },
        { status: 500 }
      );
    }

    const header = req.headers.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'Авторизация талаб қилинади.' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await admin.auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Сессия яроқсиз. Қайта уриниб кўринг.' }, { status: 401 });
    }

    // Email YOKI telefon raqami (E.164). SMS bilan ro'yxatdan o'tganda
    // email UMUMAN bo'lmaydi — `firestore.rules` dagi `authKey()` va
    // `apiAuth.ts` bilan bir xil qoida.
    const email = decoded.email;
    const phone = decoded.phone_number;
    const accountKey = accountKeyOf(email, phone);
    if (!accountKey) {
      return NextResponse.json(
        { error: 'Фойдаланувчи аниқланмади: электрон почта ҳам, телефон рақами ҳам йўқ.' },
        { status: 400 }
      );
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    const now = FieldValue.serverTimestamp();

    const userRef = admin.db.collection(ALLOWED_USERS).doc(accountKey);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set(
        {
          // Firestore `undefined` qiymatga istisno tashlaydi — shuning
          // uchun mavjud bo'lganigina yoziladi.
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          role: 'user',
          status: 'active',
          createdAt: now,
          // Ro'yxatdan o'tgan odam qaysi rejada — cheklovlar shundan
          // hisoblanadi (src/lib/plans.ts)
          plan: 'free',
        },
        { merge: true }
      );
    } else if (snap.data()?.status && snap.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Ҳисобингиз фаол эмас.' }, { status: 403 });
    }

    const workspaceId = await resolveWorkspaceId(
      admin.db as unknown as Parameters<typeof resolveWorkspaceId>[0],
      accountKey,
      now
    );

    // TAKLIF QILINGAN odam endi haqiqatan kirdi — a'zolik maqomi
    // «invited» dan «active» ga o'tadi. Bu yagona joy: `resolveWorkspaceId`
    // har so'rovda chaqiriladi, unga yozish qo'shilsa har API chaqiruvi
    // qo'shimcha yozuv qilardi. Signup esa bir marta ishlaydi.
    if (workspaceId !== accountKey) {
      try {
        await admin.db
          .collection(WORKSPACES).doc(workspaceId)
          .collection(MEMBERS).doc(accountKey)
          .set({ status: 'active', joinedAt: now }, { merge: true });
      } catch (err) {
        // Maqom yangilanmasa ham kirish ISHLAYDI — bu faqat ekrandagi belgi
        console.error("A'zolik maqomi yangilanmadi:", err);
      }
    }

    return NextResponse.json({ success: true, workspaceId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('SIGNUP ERROR:', message);
    return NextResponse.json({ error: 'Рўйхатдан ўтишда хатолик: ' + message }, { status: 500 });
  }
}
