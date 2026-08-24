// app/api/companies/route.ts
//
// KORXONA QO'SHISH — cheklov shu yerda tekshiriladi.
//
// Nega klientdan emas: Firestore qoidalari hujjatlarni SANAY OLMAYDI,
// ya'ni «3 tadan ko'p bo'lmasin» degan shartni qoidada yozib bo'lmaydi.
// Klient tomondagi tekshiruv esa cheklov emas — uni har kim chetlab
// o'tadi. Shuning uchun korxona faqat shu route orqali yaratiladi,
// firestore.rules da esa klient uchun `create` YOPIQ.
//
// KORXONANI O'CHIRISH ham shu yerda (DELETE) — sababi quyida yozilgan.

import { NextResponse } from 'next/server';
import { assertCompanyAccess, requireUser } from '@/lib/apiAuth';
import { INCOME_REPORTS, SVERKA_REPORTS } from '@/lib/workspace';
import { OPENING_BALANCES } from '@/lib/openingBalance';
import { MERGES_COLLECTION } from '@/lib/counterpartyMerge';
import {
  CATEGORIES_COLLECTION,
  CATEGORY_STATS_COLLECTION,
} from '@/lib/counterpartyCategory';

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

    // KORXONA SONI CHEKLANMAYDI (qaror: 2026-08-25).
    //
    // Ilgari bepul rejada 3 ta edi. U cheklov ushlamasdi: sverka
    // yuklangan FAYLDAN ishlaydi, ya'ni hamma mijozni bitta korxona
    // yozuviga yig'ib, bepul ishlayverish mumkin edi. Endi sanoq
    // sverkaning O'ZIGA qo'yilgan (`sverkaQuota.ts`), korxona esa
    // shunchaki papka — uni cheklashning ma'nosi yo'q.
    const { FieldValue } = await import('firebase-admin/firestore');
    const ref = await db.collection('companies').add({
      name,
      inn,
      workspaceId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('COMPANY CREATE ERROR:', message);
    return NextResponse.json({ error: 'Корхона қўшишда хатолик: ' + message }, { status: 500 });
  }
}

/**
 * KORXONANI VA UNGA TEGISHLI HAMMA NARSANI O'CHIRISH.
 *
 * Nega SERVERDA, klientda emas (ilgari `clients/page.tsx` o'zi
 * `writeBatch` bilan o'chirardi):
 *
 *  1. Firestore'da KASKAD o'chirish YO'Q va SUBKOLLEKSIYA ota hujjat
 *     bilan o'chmaydi. Klient esa `companies/{id}/counterparty_merges`
 *     va `.../counterparty_categories` ga umuman yeta olmasdi —
 *     `firestore.rules` da ular uchun qoida yo'q, ya'ni yopiq.
 *     Natijada korxona «o'chirildi» deb ko'rinardi, birlashtirish va
 *     toifa qarorlari esa bazada MANGU qolardi (2026-08-19 da o'lchandi).
 *  2. `opening_balances` ni klient o'chira olmasdi: qoidada `delete`
 *     faqat adminga ochiq. Ya'ni oddiy buxgalter o'chirgan korxonasining
 *     kontragent STIR va qoldiqlarini hech qachon tozalay olmasdi.
 *  3. Admin SDK qoidalardan o'tadi va hammasi BITTA joyda turadi —
 *     yangi kolleksiya qo'shilganda uni shu ro'yxatga qo'shish yetadi.
 *
 * `parse_failures` ATAYLAB tegilmaydi: u foydalanuvchi ma'lumoti emas,
 * yiqilgan fayl shakllarining jurnali — korxona o'chirilgani bilan
 * «bu shaklni o'qiy olmaganmiz» degan fakt yo'qolmaydi.
 */
export async function DELETE(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const companyId = (new URL(req.url).searchParams.get('id') || '').trim();
    if (!companyId) {
      return NextResponse.json({ error: 'Корхона кўрсатилмаган.' }, { status: 400 });
    }

    const { db } = auth.admin;
    const workspaceId = auth.user.workspaceId;

    // Begona korxonani o'chirib bo'lmaydi. Admin SDK qoidalarga
    // BO'YSUNMAYDI, shuning uchun tekshiruv shu yerda majburiy.
    const denied = await assertCompanyAccess(auth.admin, companyId, workspaceId);
    if (denied) return denied;

    const { FieldValue } = await import('firebase-admin/firestore');
    let removed = 0;

    // 1) Korxonaga bog'langan yuqori darajali hujjatlar.
    for (const name of [SVERKA_REPORTS, INCOME_REPORTS, OPENING_BALANCES]) {
      const snap = await db
        .collection(name)
        .where('workspaceId', '==', workspaceId)
        .where('companyId', '==', companyId)
        .get();
      for (const doc of snap.docs) {
        await doc.ref.delete();
        removed++;
      }
    }

    const companyRef = db.collection('companies').doc(companyId);

    // 2) Toifa qarorlari + korxonalararo statistikadagi SHU korxonaning
    //    ovozi. Ovoz qoldirilsa, o'chirilgan korxona boshqa mijozlarda
    //    «?» belgisini chiqarishda davom etardi.
    const cats = await companyRef.collection(CATEGORIES_COLLECTION).get();
    for (const doc of cats.docs) {
      const inn = String(doc.data()?.inn || '').trim();
      if (inn) {
        try {
          await db
            .collection(CATEGORY_STATS_COLLECTION)
            .doc(inn)
            .set({ companies: { [companyId]: FieldValue.delete() } }, { merge: true });
        } catch (err) {
          // Statistika tozalanmasa ham korxona o'chirilishi kerak
          console.error('category_stats tozalanmadi:', err);
        }
      }
      await doc.ref.delete();
      removed++;
    }

    // 3) Birlashtirish guruhlari.
    const merges = await companyRef.collection(MERGES_COLLECTION).get();
    for (const doc of merges.docs) {
      await doc.ref.delete();
      removed++;
    }

    // 4) Eng oxirida korxonaning O'ZI. Oradan uzilib qolsa, yetim
    //    ma'lumot emas, qayta urinsa bo'ladigan holat qoladi.
    await companyRef.delete();

    return NextResponse.json({ success: true, removed });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('COMPANY DELETE ERROR:', message);
    return NextResponse.json({ error: 'Корхонани ўчиришда хатолик: ' + message }, { status: 500 });
  }
}
