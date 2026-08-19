// app/api/counterparty-merge/route.ts
//
// Kontragentlarni QO'LDA birlashtirish va ajratish.
//
// Nega kerak: bitta firma bank ko'chirmasida «МЧЖ "ИМАНМАКС"», faktura
// ro'yxatida «IMANMAX MCHJ» bo'lib yozilsa, tizim ikki kontragent
// ko'radi. Birida faqat to'lov, ikkinchisida faqat faktura qoladi va
// IKKALASI ham katta farq ko'rsatadi. Yig'indi to'g'ri bo'lgani uchun
// buni na «Итого», na qoldiq tenglamasi sezadi.
//
// Guruh KORXONA darajasida saqlanadi (toifalar bilan bir xil sabab:
// bir mijozdagi qaror boshqasiga tegishli emas) va SVERKA TOMONI
// bo'yicha ajratiladi — kalit shakli chiqim va kirimda boshqacha.
import { NextResponse } from 'next/server';
import { assertCompanyAccess, requireUser } from '@/lib/apiAuth';
import { MERGES_COLLECTION, mergeDocId, type MergeSide } from '@/lib/counterpartyMerge';

export const runtime = 'nodejs';

function isSide(v: unknown): v is MergeSide {
  return v === 'in' || v === 'out';
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const companyId = String(body.companyId || '').trim();
    const side = body.side;
    const primary = String(body.primary || '').trim();
    const action = body.action === 'unmerge' ? 'unmerge' : 'merge';

    if (!companyId) {
      return NextResponse.json({ error: 'companyId кўрсатилмаган.' }, { status: 400 });
    }
    if (!isSide(side)) {
      return NextResponse.json({ error: 'Сверка томони нотўғри.' }, { status: 400 });
    }
    if (!primary) {
      return NextResponse.json({ error: 'Асосий контрагент кўрсатилмаган.' }, { status: 400 });
    }

    // `companyId` klientdan keladi. Admin SDK Firestore qoidalarini
    // chetlab o'tadi — bu tekshiruvsiz begona korxonaning kontragentlarini
    // birlashtirib yuborish mumkin bo'lardi.
    const denied = await assertCompanyAccess(auth.admin, companyId, auth.user.workspaceId);
    if (denied) return denied;

    const ref = auth.admin.db
      .collection('companies').doc(companyId)
      .collection(MERGES_COLLECTION).doc(mergeDocId(side, primary));

    if (action === 'unmerge') {
      await ref.delete();
      return NextResponse.json({ success: true, primary, removed: true });
    }

    // Asosiy kalit a'zolar ichida takrorlanmasin — `buildMergeMap`
    // uchun zarar emas, lekin ro'yxat chalkash ko'rinadi.
    const members = Array.isArray(body.members)
      ? [...new Set(body.members.map((x: unknown) => String(x || '').trim()))]
          .filter((x): x is string => !!x && x !== primary)
      : [];

    if (members.length === 0) {
      return NextResponse.json(
        { error: 'Бирлаштириш учун камида иккита контрагент керак.' },
        { status: 400 }
      );
    }

    const name = String(body.name || '').trim();

    await ref.set(
      {
        primary,
        members,
        side,
        name: name || '',
        // AUDIT IZI: byuroda «kim buni birlashtirgan?» degan savolga javob
        updatedBy: auth.user.accountKey,
        updatedAt: new Date().toISOString(),
      },
      { merge: false } // to'liq almashtiriladi: a'zo olib tashlansa qolib ketmasin
    );

    return NextResponse.json({ success: true, primary, members });
  } catch (error) {
    console.error('COUNTERPARTY MERGE ERROR:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Бирлаштиришни сақлашда хатолик: ' + message },
      { status: 500 }
    );
  }
}
