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
import { SVERKA_REPORTS } from '@/lib/workspace';

export const runtime = 'nodejs';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const snap = await auth.admin.db
      .collection(SVERKA_REPORTS)
      .where('workspaceId', '==', auth.user.workspaceId)
      .select('companyId', 'savedAt', 'totals', 'diffCount')
      .get();

    const reports = snap.docs.map((d) => {
      const data = d.data() as {
        companyId?: string;
        savedAt?: { toMillis?: () => number };
        totals?: { debit?: number; credit?: number };
        diffCount?: number;
      };
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
        debit: num(data.totals?.debit),
        credit: num(data.totals?.credit),
        diffCount: typeof data.diffCount === 'number' ? data.diffCount : null,
      };
    });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error('reports/summary:', err);
    return NextResponse.json({ error: 'Ҳисоботлар рўйхатини ўқиб бўлмади.' }, { status: 500 });
  }
}
