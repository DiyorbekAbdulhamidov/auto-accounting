// app/api/companies/route.ts
//
// KORXONA QO'SHISH — cheklov shu yerda tekshiriladi.
//
// Nega klientdan emas: Firestore qoidalari hujjatlarni SANAY OLMAYDI,
// ya'ni «3 tadan ko'p bo'lmasin» degan shartni qoidada yozib bo'lmaydi.
// Klient tomondagi tekshiruv esa cheklov emas — uni har kim chetlab
// o'tadi. Shuning uchun korxona faqat shu route orqali yaratiladi,
// firestore.rules da esa klient uchun `create` YOPIQ.

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';
import { limitsOf, planOf } from '@/lib/plans';
import { WORKSPACES } from '@/lib/workspace';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const inn = String(body.inn || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Корхона номи кўрсатилмаган.' }, { status: 400 });
    }
    if (!/^\d{9}$|^\d{14}$/.test(inn)) {
      return NextResponse.json({ error: 'СТИР 9 ёки 14 рақамдан иборат бўлиши керак.' }, { status: 400 });
    }

    const { db } = auth.admin;
    const workspaceId = auth.user.workspaceId;

    const wsSnap = await db.collection(WORKSPACES).doc(workspaceId).get();
    const plan = planOf(wsSnap.data()?.plan);
    const limits = limitsOf(plan);

    const existing = await db
      .collection('companies')
      .where('workspaceId', '==', workspaceId)
      .count()
      .get();
    const current = existing.data().count;

    if (current >= limits.companies) {
      // Cheksiz rejada bu yerga umuman kelinmaydi, lekin xabar «Infinity»
      // bo'lib chiqmasligi uchun himoya qoldirilgan.
      const shown = Number.isFinite(limits.companies) ? String(limits.companies) : '—';
      return NextResponse.json(
        {
          error:
            `«${limits.label}» режасида ${shown} тагача корхона қўшиш мумкин. ` +
            `Ҳозир ${current} та бор.`,
          limitReached: true,
          plan,
          limit: limits.companies,
          current,
        },
        { status: 403 }
      );
    }

    const { FieldValue } = await import('firebase-admin/firestore');
    const ref = await db.collection('companies').add({
      name,
      inn,
      workspaceId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: ref.id,
      remaining: limits.companies === Infinity ? null : limits.companies - current - 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('COMPANY CREATE ERROR:', message);
    return NextResponse.json({ error: 'Корхона қўшишда хатолик: ' + message }, { status: 500 });
  }
}
