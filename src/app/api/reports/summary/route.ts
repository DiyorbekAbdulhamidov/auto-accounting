// app/api/reports/summary/route.ts
//
// KORXONALAR RO'YXATI UCHUN YENGIL YIG'MA.
//
// Muammo: `clients/page.tsx` ish maydonidagi HAMMA saqlangan chiqim
// sverkasini klientdan to'liq o'qirdi. Har bir hujjat 900 KB gacha
// (`firmsData` — butun jadval), ro'yxatda esa undan atigi TO'RT son
// kerak: qaysi korxona, qachon, debet/kredit va nechtasida farq bor.
// 20 ta hisobot = har sahifa ochilishida ~18 MB. Spark rejasida bu
// oylik trafik kvotasini bir necha kunda yeydi.
//
// Yechim: so'rov serverga ko'chirildi va `select()` bilan cheklandi —
// Firestore faqat sanalgan maydonlarni uzatadi. `select()` faqat
// admin SDK'da bor, klient SDK'sida YO'Q — shuning uchun route.
//
// `firmsData` bu yerda ham o'qilmaydi: «nechtasida farq bor» soni
// SAQLASHDA yoziladi (`diffCount`). Eski hujjatlarda u maydon yo'q —
// null qaytadi va ekranda «—» ko'rinadi (mavjud xatti-harakat, ilgari
// `firmsData` bo'lmagan hujjatlarda ham shunday edi). Migratsiya yo'q.

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth';
import { INCOME_REPORTS, SVERKA_REPORTS } from '@/lib/workspace';

export const runtime = 'nodejs';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    /* IKKALA YO'NALISH BIRGA.
       Ilgari bu yerda faqat CHIQIM sverkasi o'qilardi — ya'ni
       ro'yxat «biz to'ladikmi, faktura keldimi» degan savolga
       javob berardi, «bizga to'lashdimi» degan savol esa ro'yxatda
       UMUMAN yo'q edi va faqat korxona ichida ko'rinardi.
       Ikkita so'rov parallel ketadi: ketma-ket qo'yilsa sahifa
       ochilishi ikki baravar kutardi. */
    const [outSnap, inSnap] = await Promise.all([
      auth.admin.db
        .collection(SVERKA_REPORTS)
        .where('workspaceId', '==', auth.user.workspaceId)
        .select('companyId', 'savedAt', 'totals', 'diffCount')
        .get(),
      auth.admin.db
        .collection(INCOME_REPORTS)
        .where('workspaceId', '==', auth.user.workspaceId)
        .select('companyId', 'savedAt', 'totals', 'diffCount')
        .get(),
    ]);

    type Doc = {
      companyId?: string;
      savedAt?: { toMillis?: () => number };
      totals?: {
        debit?: number;
        credit?: number;
        /* KIRIM hisoboti BOSHQA nom bilan saqlanadi (`reportHistory.ts`):
           yozilgan faktura — `facturaSent`, tushgan pul — `bankCredit`.
           Bu yerda ikkalasi ham bitta shaklga keltiriladi:
           debet = biz yozgan faktura, kredit = bizga tushgan pul. */
        facturaSent?: number;
        bankCredit?: number;
      };
      diffCount?: number;
    };

    const lite = (d: FirebaseFirestore.QueryDocumentSnapshot, kind: 'in' | 'out') => {
      const data = d.data() as Doc;
      const debit = kind === 'out' ? num(data.totals?.debit) : num(data.totals?.facturaSent);
      const credit = kind === 'out' ? num(data.totals?.credit) : num(data.totals?.bankCredit);
      return {
        id: d.id,
        companyId: String(data.companyId ?? ''),
        // Sana MILLISEKUND bo'lib ketadi: JSON'da `Timestamp` yo'q.
        // `serverTimestamp()` hali yozilmagan hujjatda maydon UMUMAN
        // bo'lmasligi mumkin — o'shanda null.
        savedAtMs: typeof data.savedAt?.toMillis === 'function' ? data.savedAt.toMillis() : null,
        // `totals` YO'Q hujjat «saqlangan» deb sanalmasligi kerak —
        // ilgari klient shu maydonning borligiga qarardi.
        hasTotals: data.totals != null,
        debit,
        credit,
        diffCount: typeof data.diffCount === 'number' ? data.diffCount : null,
      };
    };

    const reports = outSnap.docs.map((d) => lite(d, 'out'));
    const income = inSnap.docs.map((d) => lite(d, 'in'));

    return NextResponse.json({ reports, income });
  } catch (err) {
    console.error('reports/summary:', err);
    return NextResponse.json({ error: 'Ҳисоботлар рўйхатини ўқиб бўлмади.' }, { status: 500 });
  }
}
