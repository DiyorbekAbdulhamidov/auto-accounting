// app/api/upload-preview/route.ts
//
// Chiqim sverkasi: bank ko'chirmasi (debet) ↔ kelgan hisob-fakturalar.
// Butun o'qish/yig'ish mantig'i src/lib/statementAudit.ts da - uni
// Node'dan haqiqiy bank fayllariga qarshi test qilib bo'ladi.
import { NextResponse } from 'next/server';
import { auditFiles, type InputFile } from '@/lib/statementAudit';
import type { LearnedFormat } from '@/lib/formatMemory';
import { requireUser } from '@/lib/apiAuth';
import type { Firestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// Bir marta o'qilgan eksport shakllari shu yerda saqlanadi. Keyingi
// safar o'sha shapka kelganda ustunlar qaytadan taxmin qilinmaydi.
const FORMATS_COLLECTION = 'excel_formats';

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

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Fayl(lar) yuklanmadi!" }, { status: 400 });
    }

    const inputs: InputFile[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      inputs.push({ name: file.name, buffer: Buffer.from(bytes) });
    }

    // «Ожидает подписи партнёра» фактураларни ҳам ҳисоблашми
    const includePending = String(formData.get('includePending') || '') === 'true';

    const knownFormats = await loadKnownFormats(auth.admin.db);
    const result = auditFiles(inputs, { knownFormats, includePending });
    await saveFormats(auth.admin.db, result.learnedFormats);

    if (result.data.length === 0) {
      return NextResponse.json({
        error: "Файл ичидан ҳисоб-китобга яроқли маълумот топилмади.",
        warnings: result.warnings,
        sheets: result.sheets,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      detectedFormats: result.detectedFormats,
      warnings: result.warnings,
      sheets: result.sheets,
      totals: result.totals,
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
