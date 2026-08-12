// app/api/upload-preview/route.ts
//
// Chiqim sverkasi: bank ko'chirmasi (debet) ↔ kelgan hisob-fakturalar.
// Butun o'qish/yig'ish mantig'i src/lib/statementAudit.ts da - uni
// Node'dan haqiqiy bank fayllariga qarshi test qilib bo'ladi.
import { NextResponse } from 'next/server';
import { auditFiles, type InputFile } from '@/lib/statementAudit';
import { requireUser } from '@/lib/apiAuth';

export const runtime = 'nodejs';

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

    const result = auditFiles(inputs);

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
    });
  } catch (error) {
    console.error('EXCEL PARSE ERROR:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Файлни ўқишда тизимли хатолик: " + message }, { status: 500 });
  }
}
