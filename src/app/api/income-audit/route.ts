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
import { requireUser } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'Файл(лар) юкланмади!' }, { status: 400 });
    }

    const inputs: InputFile[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      inputs.push({ name: file.name, buffer: Buffer.from(bytes) });
    }

    const report = analyzeIncome(inputs);

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

    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('KIRIM AUDIT ERROR:', error);
    return NextResponse.json({ error: 'Файлни ўқишда хатолик: ' + message }, { status: 500 });
  }
}
