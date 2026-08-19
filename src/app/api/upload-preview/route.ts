// app/api/upload-preview/route.ts
//
// Chiqim sverkasi: bank ko'chirmasi (debet) ↔ kelgan hisob-fakturalar.
// Butun o'qish/yig'ish mantig'i src/lib/statementAudit.ts da - uni
// Node'dan haqiqiy bank fayllariga qarshi test qilib bo'ladi.
import { NextResponse } from 'next/server';
import { auditFiles, type InputFile } from '@/lib/statementAudit';
import type { LearnedFormat } from '@/lib/formatMemory';
import { MIN_COMPANIES_FOR_HINT, type Category, type GlobalHint } from '@/lib/counterpartyCategory';
import { assertCompanyAccess, requireUser } from '@/lib/apiAuth';
import {
  MERGES_COLLECTION,
  mergeOutgoingRows,
  suggestMerges,
  type MergeGroup,
} from '@/lib/counterpartyMerge';
import { buildFailureRecord, logParseFailure } from '@/lib/parseFailureLog';
import type { Firestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// Bir marta o'qilgan eksport shakllari shu yerda saqlanadi. Keyingi
// safar o'sha shapka kelganda ustunlar qaytadan taxmin qilinmaydi.
const FORMATS_COLLECTION = 'excel_formats';

/** Kontragent toifalari KORXONA darajasida saqlanadi: bir mijoz uchun
 *  kommunal bo'lgan tashkilot boshqasi uchun asosiy kontragent
 *  bo'lishi mumkin. Shu sabab global emas, subkolleksiya. */
const CATEGORIES_COLLECTION = 'counterparty_categories';
const STATS_COLLECTION = 'counterparty_category_stats';

/**
 * Boshqa korxonalar qaysi STIRni qanday belgilagani.
 *
 * MUHIM: bu natija HECH QACHON toifa bo'lib qo'llanmaydi — u faqat
 * «?» belgisi chiqaradi (src/lib/counterpartyCategory.ts). Shu sabab
 * bitta buxgalterning xatosi boshqa mijozning pulini yashira olmaydi.
 *
 * Taklif bo'lishi uchun kamida MIN_COMPANIES_FOR_HINT ta MUSTAQIL
 * korxona bir xil toifani tanlagan bo'lishi shart. Korxonalar turli
 * toifa tanlagan bo'lsa — kelishuv yo'q, taklif ham berilmaydi.
 */
async function loadGlobalHints(
  db: Firestore,
  currentCompanyId: string
): Promise<Record<string, GlobalHint>> {
  try {
    const snap = await db.collection(STATS_COLLECTION).get();
    const out: Record<string, GlobalHint> = {};
    for (const doc of snap.docs) {
      const d = doc.data() as { inn?: string; companies?: Record<string, Category> };
      if (!d.inn || !d.companies) continue;

      // O'z qarorimiz taklif sifatida qaytib kelmasin
      const tally = new Map<Category, number>();
      for (const [companyId, cat] of Object.entries(d.companies)) {
        if (companyId === currentCompanyId) continue;
        if (cat === 'korxona') continue; // «korxona» — taklif emas
        tally.set(cat, (tally.get(cat) || 0) + 1);
      }
      if (tally.size !== 1) continue; // kelishuv yo'q yoki bo'sh

      const [[category, companyCount]] = [...tally];
      if (companyCount < MIN_COMPANIES_FOR_HINT) continue;
      out[d.inn] = { category, companyCount };
    }
    return out;
  } catch (err) {
    // Taklif ro'yxati o'qilmasa ham sverka ishlaydi — shunchaki «?»
    // belgilari kamroq chiqadi
    console.error("counterparty_category_stats o'qilmadi:", err);
    return {};
  }
}

/** Kim va qachon o'zgartirgani — AUDIT IZI. Byuroda bir necha odam
 *  ishlaydi va «kim buni коммунал деб белгилаган?» degan savolga
 *  javob bo'lishi kerak. Ma'lumot allaqachon yozilardi, faqat
 *  ekranga chiqmasdi. */
export interface CategoryAuthor {
  by: string;
  at: string;
}

async function loadCategoryOverrides(
  db: Firestore,
  companyId: string
): Promise<{ map: Record<string, Category>; authors: Record<string, CategoryAuthor> }> {
  if (!companyId) return { map: {}, authors: {} };
  try {
    const snap = await db
      .collection('companies').doc(companyId)
      .collection(CATEGORIES_COLLECTION).get();
    const out: Record<string, Category> = {};
    const authors: Record<string, CategoryAuthor> = {};
    for (const doc of snap.docs) {
      const d = doc.data() as {
        key?: string; inn?: string; category?: Category;
        updatedBy?: string; updatedAt?: string;
      };
      if (!d.category) continue;
      // STIR bo'yicha ham, kalit bo'yicha ham yozib qo'yiladi: STIRsiz
      // kontragentlar faqat kalit bilan topiladi.
      if (d.inn && d.inn !== '-') out[d.inn] = d.category;
      if (d.key) out[d.key] = d.category;
      if (d.updatedBy) {
        const a = { by: d.updatedBy, at: d.updatedAt || '' };
        if (d.inn && d.inn !== '-') authors[d.inn] = a;
        if (d.key) authors[d.key] = a;
      }
    }
    return { map: out, authors };
  } catch (err) {
    // Toifa ro'yxati o'qilmasa ham sverka ishlashi kerak — shunda
    // hamma kontragent 'korxona' bo'lib qoladi, ya'ni hech narsa
    // yashirilmaydi (xavfsiz tomon).
    console.error("counterparty_categories o'qilmadi:", err);
    return { map: {}, authors: {} };
  }
}

/** Qo'lda birlashtirilgan kontragent guruhlari (korxona darajasida).
 *  O'qilmasa sverka baribir ishlaydi — shunchaki qatorlar ajratilgan
 *  holicha qoladi, ya'ni hech narsa YASHIRILMAYDI (xavfsiz tomon). */
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

async function loadKnownFormats(db: Firestore): Promise<LearnedFormat[]> {
  try {
    const snap = await db.collection(FORMATS_COLLECTION).get();
    return snap.docs.map((d) => d.data() as LearnedFormat);
  } catch (err) {
    // Format xotirasi ishlamasa ham sverka ishlashi kerak
    console.error('excel_formats o\'qilmadi:', err);
    return [];
  }
}

async function saveFormats(db: Firestore, formats: LearnedFormat[]): Promise<void> {
  if (formats.length === 0) return;
  try {
    const batch = db.batch();
    for (const fmt of formats) {
      batch.set(db.collection(FORMATS_COLLECTION).doc(fmt.id), fmt, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('excel_formats saqlanmadi:', err);
  }
}

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
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Fayl(lar) yuklanmadi!" }, { status: 400 });
    }

    const tooBig = checkUpload(files);
    if (tooBig) return NextResponse.json({ error: tooBig }, { status: 413 });

    const inputs: InputFile[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      inputs.push({ name: file.name, buffer: Buffer.from(bytes) });
    }

    // «Ожидает подписи партнёра» фактураларни ҳам ҳисоблашми
    const includePending = String(formData.get('includePending') || '') === 'true';
    const companyId = String(formData.get('companyId') || '');

    // `companyId` klientdan keladi — u haqiqatan shu ish maydoniga
    // tegishlimi, tekshirilmasa begona korxona ma'lumoti ochilardi.
    const denied = await assertCompanyAccess(auth.admin, companyId, auth.user.workspaceId);
    if (denied) return denied;

    const [knownFormats, categoryOverrides, categoryGlobalHints, mergeGroups] = await Promise.all([
      loadKnownFormats(auth.admin.db),
      loadCategoryOverrides(auth.admin.db, companyId),
      loadGlobalHints(auth.admin.db, companyId),
      loadMergeGroups(auth.admin.db, companyId),
    ]);
    const result = auditFiles(inputs, {
      knownFormats,
      includePending,
      categoryOverrides: categoryOverrides.map,
      categoryGlobalHints,
    });
    await saveFormats(auth.admin.db, result.learnedFormats);

    // BIRLASHTIRISH — parserdan KEYIN, alohida qadam.
    //
    // Ataylab shunday: `auditFiles` 90 ta regress tekshiruvi bilan
    // qoplangan va unga tegilmaydi. Birlashtirish esa faqat qatorlarni
    // qo'shadi — yig'indi o'zgarmaydi, ya'ni `result.totals` va
    // `categoryTotals` shundayligicha to'g'ri qoladi.
    const mergedData = mergeOutgoingRows(result.data, mergeGroups);
    const mergeSuggestions = suggestMerges(result.data, mergeGroups, 'out');

    // YIQILGAN FAYL JURNALI. Muvaffaqiyatli yuklashda hech narsa
    // yozilmaydi — `buildFailureRecord` null qaytaradi.
    await logParseFailure(
      auth.admin.db,
      buildFailureRecord({
        workspaceId: auth.user.workspaceId,
        companyId,
        side: 'out',
        at: new Date().toISOString(),
        fileCount: files.length,
        parsedCount: result.data.length,
        sheets: result.sheets,
        unverifiedFiles: result.unverifiedFiles,
        detectedFormats: result.detectedFormats,
        warnings: result.warnings,
      })
    );

    if (result.data.length === 0) {
      return NextResponse.json({
        error: "Файл ичидан ҳисоб-китобга яроқли маълумот топилмади.",
        warnings: result.warnings,
        sheets: result.sheets,
        balanceChecks: result.balanceChecks,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: mergedData,
      // Қўлда бирлаштирилган гуруҳлар — экранда «ажратиш» тугмаси учун
      merges: mergeGroups.filter((g) => g.side === 'out'),
      // ТАКЛИФ: бир хил СТИР ёки бир хил номли қаторлар. Ҳеч қачон
      // ўзи қўлланмайди — қарор бухгалтерники.
      mergeSuggestions,
      detectedFormats: result.detectedFormats,
      warnings: result.warnings,
      sheets: result.sheets,
      // Қолдиқ тенгламаси: бошланғич қолдиқ + кредит − дебет = охирги қолдиқ.
      // «Итого»дан мустақил назорат — дебет билан кредит алмашиб кетса
      // «Итого» сезмайди, бу эса сезади.
      balanceChecks: result.balanceChecks,
      // Рақамини ТАСДИҚЛАБ бўлмайдиган файллар (на «Итого», на қолдиқ)
      unverifiedFiles: result.unverifiedFiles,
      // Ҳар икки томоннинг ТОПИЛГАН даври. Экранда кўрсатилади:
      // бухгалтер файлни очмасдан «тўғри файл юкладимми» деб билади.
      periods: result.periods,
      // AUDIT IZI: toifani kim va qachon o'zgartirgani
      categoryAuthors: categoryOverrides.authors,
      totals: result.totals,
      categoryTotals: result.categoryTotals,
      // Qaysi shakllar tanish bo'lgani/yangi o'rganilgani
      formats: result.learnedFormats.map((f) => ({
        id: f.id,
        kind: f.kind,
        label: f.label,
        isNew: !knownFormats.some((k) => k.id === f.id),
      })),
    });
  } catch (error) {
    console.error('EXCEL PARSE ERROR:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Файлни ўқишда тизимли хатолик: " + message }, { status: 500 });
  }
}
