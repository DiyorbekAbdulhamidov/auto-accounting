// app/api/workspace/members/route.ts
//
// ISH MAYDONIGA A'ZO TAKLIF QILISH.
//
// Nega kerak: «Бюро» rejasi 5 foydalanuvchi va'da qiladi, lekin
// a'zo qo'shish YO'LI umuman yo'q edi — ya'ni o'sha rejani sotib
// bo'lmasdi. Ma'lumot modeli (`workspaces/{id}/members/{email}`)
// 2026-08-13 dan beri tayyor turardi.
//
// TAKLIF QANDAY ISHLAYDI — parolsiz:
//
//   1. Ega email kiritadi.
//   2. Shu yerda `allowed_users/{email}` OLDINDAN yaratiladi va
//      unga `workspaceId` yoziladi.
//   3. Taklif qilingan odam odatdagidek ro'yxatdan o'tadi. Signup
//      route `resolveWorkspaceId` ni chaqiradi, u esa TAYYOR
//      `workspaceId` ni ko'radi va YANGI ish maydoni OCHMAYDI.
//
// Ya'ni bir martalik havola, muddat, elektron xat — hech biri kerak
// emas. Parol HECH QACHON bu yerda ko'rilmaydi va yaratilmaydi.
//
// A'ZONI CHIQARISH:
//   `workspaces/{id}/members/{email}` o'chiriladi — Firestore qoidasi
//   (`isMember`) shu hujjatga tayanadi, ya'ni ruxsat DARHOL yopiladi.
//   Odamning `workspaceId` maydoni ham tozalanadi: aks holda u
//   o'qiy olmaydigan ish maydoniga ishora qilib osilib qolardi.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';
import { ALLOWED_USERS, MEMBERS, WORKSPACES } from '@/lib/workspace';
import { limitsOf, planOf } from '@/lib/plans';
import type { Firestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

interface MemberView {
  email: string;
  role: string;
  /** `invited` — havola berilgan, lekin hali ro'yxatdan o'tmagan.
   *  `active` — kirgan. Signup route uni «active» ga o'giradi. */
  status: string;
}

/** Faqat EGA a'zo qo'sha/chiqara oladi. A'zo boshqa a'zoni chiqarib
 *  yuborsa, ish maydoni egasiz qolishi mumkin edi. */
async function loadWorkspace(
  db: Firestore,
  workspaceId: string
): Promise<{ ownerEmail: string; plan: string } | null> {
  const snap = await db.collection(WORKSPACES).doc(workspaceId).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  return { ownerEmail: String(d.ownerEmail || ''), plan: String(d.plan || 'free') };
}

async function listMembers(
  db: Firestore,
  workspaceId: string
): Promise<MemberView[]> {
  const snap = await db.collection(WORKSPACES).doc(workspaceId).collection(MEMBERS).get();
  const rows: MemberView[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() || {};
    rows.push({
      email: doc.id,
      role: String(d.role || 'member'),
      status: String(d.status || 'active'),
    });
  }
  // Ega birinchi, qolganlari alifbo bo'yicha
  rows.sort((a, b) =>
    a.role === b.role ? a.email.localeCompare(b.email) : a.role === 'owner' ? -1 : 1
  );
  return rows;
}

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const { db } = auth.admin;
    const workspaceId = auth.user.workspaceId;
    const ws = await loadWorkspace(db, workspaceId);
    if (!ws) {
      return NextResponse.json({ error: 'Иш майдони топилмади.' }, { status: 404 });
    }

    const members = await listMembers(db, workspaceId);
    const plan = planOf(ws.plan);
    const limits = limitsOf(plan);

    return NextResponse.json({
      success: true,
      members,
      isOwner: ws.ownerEmail === auth.user.email,
      ownerEmail: ws.ownerEmail,
      plan,
      planLabel: limits.label,
      limit: limits.members,
      current: members.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('WORKSPACE MEMBERS GET ERROR:', message);
    return NextResponse.json({ error: "Рўйхатни ўқишда хатолик: " + message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action === 'remove' ? 'remove' : 'invite';
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Электрон почта нотўғри.' }, { status: 400 });
    }

    const { db } = auth.admin;
    const workspaceId = auth.user.workspaceId;
    const ws = await loadWorkspace(db, workspaceId);
    if (!ws) {
      return NextResponse.json({ error: 'Иш майдони топилмади.' }, { status: 404 });
    }
    if (ws.ownerEmail !== auth.user.email) {
      return NextResponse.json(
        { error: 'Аъзоларни фақат иш майдони эгаси бошқаради.' },
        { status: 403 }
      );
    }

    const memberRef = db
      .collection(WORKSPACES).doc(workspaceId)
      .collection(MEMBERS).doc(email);
    const userRef = db.collection(ALLOWED_USERS).doc(email);

    if (action === 'remove') {
      if (email === ws.ownerEmail) {
        return NextResponse.json(
          { error: 'Иш майдони эгасини чиқариб бўлмайди.' },
          { status: 400 }
        );
      }
      const { FieldValue } = await import('firebase-admin/firestore');
      await memberRef.delete();
      // Ishora tozalanadi: keyingi kirishda odamga O'Z ish maydoni
      // ochiladi (`resolveWorkspaceId`), ya'ni u tizimdan tushib
      // qolmaydi — faqat shu ish maydonini ko'rmaydi.
      const userSnap = await userRef.get();
      if (userSnap.exists && userSnap.data()?.workspaceId === workspaceId) {
        await userRef.set({ workspaceId: FieldValue.delete() }, { merge: true });
      }
      return NextResponse.json({ success: true, removed: email });
    }

    // ---- TAKLIF ----
    const plan = planOf(ws.plan);
    const limits = limitsOf(plan);
    const members = await listMembers(db, workspaceId);

    if (members.some((m) => m.email === email)) {
      return NextResponse.json({ error: 'Бу одам аллақачон аъзо.' }, { status: 409 });
    }
    if (members.length >= limits.members) {
      const shown = Number.isFinite(limits.members) ? String(limits.members) : '—';
      return NextResponse.json(
        {
          error:
            `«${limits.label}» режасида ${shown} тагача фойдаланувчи бўлади. ` +
            `Ҳозир ${members.length} та бор.`,
          limitReached: true,
          plan,
          limit: limits.members,
          current: members.length,
        },
        { status: 403 }
      );
    }

    // Odam BOSHQA ish maydonida bo'lsa — jimgina tortib olinmaydi.
    // Aks holda uning o'z mijozlari ko'rinmay qolardi.
    const userSnap = await userRef.get();
    const existingWs = userSnap.exists ? userSnap.data()?.workspaceId : undefined;
    if (typeof existingWs === 'string' && existingWs && existingWs !== workspaceId) {
      return NextResponse.json(
        {
          error:
            'Бу email бошқа иш майдонига боғланган. Аввал ўша ердан чиқиши керак.',
        },
        { status: 409 }
      );
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    const now = FieldValue.serverTimestamp();

    await memberRef.set(
      {
        role: 'member',
        // `invited` — ro'yxatdan hali o'tmagan. Qoidalar uchun farqi
        // yo'q (hujjat mavjudligi yetarli), lekin ekranda ko'rinadi.
        status: userSnap.exists ? 'active' : 'invited',
        addedAt: now,
        addedBy: auth.user.email,
      },
      { merge: true }
    );

    // `allowed_users` OLDINDAN yaratiladi — signup route shu hujjatni
    // ko'radi va yangi ish maydoni ochmaydi.
    await userRef.set(
      {
        email,
        role: 'user',
        status: 'active',
        workspaceId,
        invitedBy: auth.user.email,
        invitedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      email,
      alreadyRegistered: userSnap.exists,
      remaining: Number.isFinite(limits.members) ? limits.members - members.length - 1 : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('WORKSPACE MEMBERS POST ERROR:', message);
    return NextResponse.json({ error: 'Аъзони сақлашда хатолик: ' + message }, { status: 500 });
  }
}
