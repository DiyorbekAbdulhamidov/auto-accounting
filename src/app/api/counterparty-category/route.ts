// app/api/counterparty-category/route.ts
//
// Kontragentni «kommunal / byudjet / bank / xizmat» deb belgilash
// (yoki «korxona»ga qaytarish).
//
// Toifa KORXONA darajasida saqlanadi — bir mijoz uchun kommunal
// bo'lgan tashkilot boshqasi uchun asosiy kontragent bo'lishi mumkin
// (masalan mijozning o'zi chiqindi yoki logistika firmasi bo'lsa).
//
// 'korxona' ni ochiq yozib qo'yish ham MA'NOLI: shu yo'l bilan
// tizimning boshlang'ich ro'yxatidagi (SEED_CATEGORIES) yozuv bekor
// qilinadi va kontragent asosiy sverkaga qaytariladi.
import { NextResponse } from 'next/server';
import { assertCompanyAccess, requireUser } from '@/lib/apiAuth';
import { categoryDocId, CATEGORY_LABELS, type Category } from '@/lib/counterpartyCategory';

export const runtime = 'nodejs';

const CATEGORIES_COLLECTION = 'counterparty_categories';

/** Korxonalararo statistika. Bu yerdagi ma'lumot HECH QACHON toifa
 *  bo'lib qo'llanmaydi — u faqat boshqa korxonalarda «?» belgisi
 *  chiqaradi. Shu sabab bitta buxgalterning xatosi boshqa mijozning
 *  pulini yashirib qo'ya olmaydi. */
const STATS_COLLECTION = 'counterparty_category_stats';

function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, v);
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const companyId = String(body.companyId || '').trim();
    const key = String(body.key || '').trim();
    const inn = String(body.inn || '').trim();
    const name = String(body.name || '').trim();
    const category = body.category;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId кўрсатилмаган.' }, { status: 400 });
    }
    if (!key) {
      return NextResponse.json({ error: 'Контрагент калити кўрсатилмаган.' }, { status: 400 });
    }
    if (!isCategory(category)) {
      return NextResponse.json({ error: 'Тоифа нотўғри.' }, { status: 400 });
    }

    // `companyId` klientdan keladi. Admin SDK Firestore qoidalarini
    // chetlab o'tadi, ya'ni bu tekshiruvsiz istalgan foydalanuvchi
    // begona korxonaning toifalarini o'zgartira olardi.
    const denied = await assertCompanyAccess(auth.admin, companyId, auth.user.workspaceId);
    if (denied) return denied;

    await auth.admin.db
      .collection('companies').doc(companyId)
      .collection(CATEGORIES_COLLECTION).doc(categoryDocId(key))
      .set(
        {
          key,
          inn: inn && inn !== '-' ? inn : '',
          name,
          category,
          updatedBy: auth.user.email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    // Korxonalararo statistika — faqat STIR bo'lganda. STIRsiz
    // kontragentlar nom bo'yicha ulanadi, u esa korxonadan korxonaga
    // ishonchli emas.
    if (inn && inn !== '-') {
      try {
        await auth.admin.db
          .collection(STATS_COLLECTION).doc(inn)
          .set(
            {
              inn,
              lastName: name,
              // Har korxonaning OXIRGI qarori. Fikrini o'zgartirsa,
              // eski ovoz almashadi — qo'shilib ketmaydi.
              companies: { [companyId]: category },
            },
            { merge: true }
          );
      } catch (err) {
        // Statistika yozilmasa ham asosiy amal bajarilgan bo'lsin
        console.error('counterparty_category_stats yozilmadi:', err);
      }
    }

    return NextResponse.json({ success: true, key, category });
  } catch (error) {
    console.error('COUNTERPARTY CATEGORY ERROR:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Тоифани сақлашда хатолик: ' + message }, { status: 500 });
  }
}
