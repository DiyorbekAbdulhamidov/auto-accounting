// app/api/admin/plan/route.ts
//
// FOYDALANUVCHI REJASINI QO'LDA QO'YISH — 1-noyabr uchun zaxira yo'l.
//
// Nega kerak: `workspaces/{id}.plan` maydoniga butun kodda faqat `'free'`
// yoziladi (`signup/route.ts` va `workspace.ts`). Ya'ni bepul davr
// tugagach (`PROMO_UNTIL`, `src/lib/plans.ts`) HAMMA 3 ta korxona /
// 1 ta foydalanuvchi chekloviga qaytadi va uni ko'tarishning mahsulot
// ichidagi yo'li YO'Q edi — 12 mijozli buxgalter 13-chisini qo'sha
// olmay qolardi va to'lay ham olmasdi.
//
// Bu route to'lov tizimi EMAS. To'lov qo'lda (Click orqali) qabul
// qilinadi, keyin admin shu yerdan rejani qo'yadi. Click integratsiyasi
// kelganda u ham AYNAN shu maydonni yozadi — ya'ni bu yo'l tashlanmaydi,
// avtomatlashtiriladi.
//
// Reja ISH MAYDONIGA qo'yiladi, foydalanuvchiga emas: cheklov ish
// maydoni bo'yicha hisoblanadi (`/api/companies`, `/api/workspace/members`),
// va byuroda bir necha odam bitta rejadan foydalanadi.

import { NextResponse } from 'next/server';
import type { Firestore } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/apiAuth';
import { PLANS, limitsOf, planOf, promoActive, PROMO_UNTIL, type Plan } from '@/lib/plans';
import { ALLOWED_USERS, MEMBERS, WORKSPACES } from '@/lib/workspace';

export const runtime = 'nodejs';

const PLAN_KEYS = Object.keys(PLANS) as Plan[];

/**
 * Hisob kaliti: email YOKI telefon (E.164). `authKey()` bilan bir xil.
 *
 * IKKI variant qaytariladi: yozilganicha va kichik harfda. Hujjat
 * identifikatori AYNAN mos kelishi kerak, admin esa emailni katta harf
 * bilan yozib yuborishi mumkin — bitta variantni majburlash u holda
 * «topilmadi» berardi va sababi ko'rinmasdi.
 */
function keyVariants(raw: unknown): string[] {
  const exact = String(raw || '').trim();
  const lower = exact.toLowerCase();
  return exact === lower ? [exact] : [exact, lower];
}

/**
 * Foydalanuvchining ish maydonini va hozirgi holatini topadi.
 *
 * `allowed_users` da yo'q bo'lsa — XATO qaytaradi, o'zi yaratmaydi:
 * admin noto'g'ri email yozganda jimgina bo'sh ish maydoni ochilib,
 * reja «qo'yildi» deb ko'rinishi mumkin edi.
 */
async function loadState(
  db: Firestore,
  keys: string[]
): Promise<
  | { ok: true; key: string; workspaceId: string; plan: Plan; companies: number; members: number }
  | { ok: false; error: string; status: number }
> {
  let userSnap = null;
  let key = keys[0];
  for (const candidate of keys) {
    const snap = await db.collection(ALLOWED_USERS).doc(candidate).get();
    if (snap.exists) {
      userSnap = snap;
      key = candidate;
      break;
    }
  }
  if (!userSnap) {
    return { ok: false, error: `«${keys[0]}» топилмади. Бу одам ҳали рўйхатдан ўтмаган.`, status: 404 };
  }

  const workspaceId = String(userSnap.data()?.workspaceId || '') || key;
  const wsSnap = await db.collection(WORKSPACES).doc(workspaceId).get();
  if (!wsSnap.exists) {
    return { ok: false, error: `Иш майдони топилмади: ${workspaceId}`, status: 404 };
  }

  const companies = await db
    .collection('companies')
    .where('workspaceId', '==', workspaceId)
    .count()
    .get();
  const members = await db.collection(WORKSPACES).doc(workspaceId).collection(MEMBERS).get();

  return {
    ok: true,
    key,
    workspaceId,
    plan: planOf(wsSnap.data()?.plan),
    companies: companies.data().count,
    members: members.size,
  };
}

/** Ekranda ko'rsatish uchun: reja, amaldagi cheklov va bepul davr holati. */
function describe(state: { plan: Plan; companies: number; members: number; workspaceId: string }) {
  const base = PLANS[state.plan];
  const effective = limitsOf(state.plan);
  const num = (n: number) => (Number.isFinite(n) ? n : null); // Infinity -> null (JSON)
  return {
    workspaceId: state.workspaceId,
    plan: state.plan,
    planLabel: base.label,
    priceUzs: base.priceUzs,
    companies: state.companies,
    members: state.members,
    // Rejaning O'ZIDAGI cheklov
    planLimits: { companies: num(base.companies), members: num(base.members) },
    // HOZIR amal qiladigan cheklov (bepul davrda ikkalasi ham cheksiz)
    effectiveLimits: { companies: num(effective.companies), members: num(effective.members) },
    promoActive: promoActive(),
    promoUntil: PROMO_UNTIL,
  };
}

/** GET ?key=<email yoki telefon> — o'zgartirishdan OLDIN holatni ko'rish. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const keys = keyVariants(new URL(req.url).searchParams.get('key'));
    if (!keys[0]) {
      return NextResponse.json({ error: 'Фойдаланувчи кўрсатилмаган.' }, { status: 400 });
    }

    const state = await loadState(auth.admin.db, keys);
    if (!state.ok) return NextResponse.json({ error: state.error }, { status: state.status });

    return NextResponse.json({ success: true, key: state.key, ...describe(state) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ADMIN PLAN GET ERROR:', message);
    return NextResponse.json({ error: 'Ҳолатни ўқишда хатолик: ' + message }, { status: 500 });
  }
}

/** POST { key, plan, note? } — rejani qo'yadi. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const keys = keyVariants(body.key);
    const plan = String(body.plan || '') as Plan;
    const note = String(body.note || '').trim().slice(0, 200);

    if (!keys[0]) {
      return NextResponse.json({ error: 'Фойдаланувчи кўрсатилмаган.' }, { status: 400 });
    }
    // `planOf` номаълум қийматни жимгина `free` га айлантиради — бу ерда
    // ундай бўлмаслиги керак: админ хато ёзса, буни КЎРИШИ шарт.
    if (!PLAN_KEYS.includes(plan)) {
      return NextResponse.json(
        { error: `Режа нотўғри. Мумкин: ${PLAN_KEYS.join(', ')}` },
        { status: 400 }
      );
    }

    const { db } = auth.admin;
    const before = await loadState(db, keys);
    if (!before.ok) return NextResponse.json({ error: before.error }, { status: before.status });

    const { FieldValue } = await import('firebase-admin/firestore');
    await db.collection(WORKSPACES).doc(before.workspaceId).set(
      {
        plan,
        // Изи: ким, қачон ва НЕГА ўзгартирди. Тўлов қўлда қабул
        // қилингани учун бу ягона ҳужжат.
        planUpdatedBy: auth.user.accountKey,
        planUpdatedAt: FieldValue.serverTimestamp(),
        ...(note ? { planNote: note } : {}),
      },
      { merge: true }
    );

    const after = await loadState(db, [before.key]);
    if (!after.ok) return NextResponse.json({ error: after.error }, { status: after.status });

    return NextResponse.json({
      success: true,
      key: before.key,
      previousPlan: before.plan,
      ...describe(after),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ADMIN PLAN POST ERROR:', message);
    return NextResponse.json({ error: 'Режани қўйишда хатолик: ' + message }, { status: 500 });
  }
}
