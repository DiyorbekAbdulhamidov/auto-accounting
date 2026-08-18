// app/api/income-audit/route.ts
//
// KIRIM SVERKASI: bank ko'chirmasidagi JAMI KELGAN PUL (kredit) ni
// biz YOZIB BERGAN счёт-фактуралар bilan kontragent kesimida
// solishtiradi.
//
// Bu route butunlay mustaqil: /api/upload-preview va u ishlatadigan
// parserlarga umuman tegmaydi.

import { NextResponse } from 'next/server';
import { analyzeIncome, type InputFile } from '@/lib/incomeParser';
import { assertCompanyAccess, requireUser } from '@/lib/apiAuth';
import {
  MERGES_COLLECTION,
  mergeIncomingRows,
  suggestMerges,
  type MergeGroup,
} from '@/lib/counterpartyMerge';
import type { Firestore } from 'firebase-admin/firestore';

/** Qo'lda birlashtirilgan kontragent guruhlari. O'qilmasa sverka
 *  baribir ishlaydi — qatorlar ajratilgan holicha qoladi, ya'ni
 *  hech narsa YASHIRILMAYDI (xavfsiz tomon). */
async function loadMergeGroups(db: Firestore, companyId: string): Promise<MergeGroup[]> {
  if (!companyId) return [];
  try {
    const snap = await db
      .collection('companies').doc(companyId)
      .collection(MERGES_COLLECTION).get();
    return snap.docs
      .map((d) => d.data() as MergeGroup)
      .filter((g) => g && g.primary && Array.isArray(g.members));
  } catch (err) {
    console.error("counterparty_merges o'qilmadi:", err);
    return [];
  }
}

export const runtime = 'nodejs';

// ============================================================
// YUKLASH CHEKLOVI
// ------------------------------------------------------------
// Cheklovsiz bitta katta fayl butun xizmatni qotirib qo'yadi:
// `arrayBuffer()` faylni BUTUNLAY xotiraga oladi. Eng katta etalon
// bank ko'chirmasi ~5 MB, shuning uchun 15 MB — keng zaxira bilan.
// Xato JIM emas: qaysi fayl va qancha ekani aytiladi.
// ============================================================
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 20;

function checkUpload(files: File[]): string | null {
  if (files.length > MAX_FILES) {
    return `Бир вақтда кўпи билан ${MAX_FILES} та файл юклаш мумкин. Ҳозир ${files.length} та танланди.`;
  }
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      const mb = (f.size / 1024 / 1024).toFixed(1);
      const lim = MAX_FILE_BYTES / 1024 / 1024;
      return `«${f.name}» ҳажми ${mb} МБ — чегара ${lim} МБ. Файлни даврларга бўлиб юкланг.`;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'Файл(лар) юкланмади!' }, { status: 400 });
    }

    const tooBig = checkUpload(files);
    if (tooBig) return NextResponse.json({ error: tooBig }, { status: 413 });

    const inputs: InputFile[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      inputs.push({ name: file.name, buffer: Buffer.from(bytes) });
    }

    // «Ожидает подписи партнёра» фактураларни ҳам ҳисоблашми.
    // Стандарт — ЙЎҚ (чиқим сверкаси билан бир хил хулқ).
    const includePending = String(formData.get('includePending') || '') === 'true';

    // `companyId` ilgari бу route'да УМУМАН йўқ эди. Энди керак:
    // бирлаштириш гуруҳлари КОРХОНА даражасида сақланади. Шу билан
    // бирга кириш ҳуқуқи ҳам текширилади — бошқа иш майдонининг
    // корхонаси кўрсатилса, рад этилади.
    const companyId = String(formData.get('companyId') || '');
    if (companyId) {
      const denied = await assertCompanyAccess(auth.admin, companyId, auth.user.workspaceId);
      if (denied) return denied;
    }

    const report = analyzeIncome(inputs, { includePending });

    if (report.parties.length === 0) {
      return NextResponse.json(
        {
          error:
            'Файллардан на банк кирими (кредит), на счёт-фактура реестри топилмади. ' +
            'Банк кўчирмаси (Дебет/Кредит устунлари бор) ва E-фактурадан юкланган ' +
            '"юборилган фактуралар" файлини юкланг.',
        },
        { status: 400 }
      );
    }

    // BIRLASHTIRISH — parserdan KEYIN, alohida qadam. `analyzeIncome`
    // regress tekshiruvlari bilan qoplangan va unga tegilmaydi;
    // birlashtirish esa faqat qatorlarni qo'shadi, ya'ni `totals`
    // shundayligicha to'g'ri qoladi.
    const mergeGroups = await loadMergeGroups(auth.admin.db, companyId);
    const parties = mergeIncomingRows(report.parties, mergeGroups);
    const mergeSuggestions = suggestMerges(report.parties, mergeGroups, 'in');

    return NextResponse.json({
      success: true,
      ...report,
      parties,
      merges: mergeGroups.filter((g) => g.side === 'in'),
      mergeSuggestions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('KIRIM AUDIT ERROR:', error);
    return NextResponse.json({ error: 'Файлни ўқишда хатолик: ' + message }, { status: 500 });
  }
}
