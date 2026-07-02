import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

// Excel/CSV ichidagi sanani JS Date-ga o'tkazish
function parseExcelDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const minutes = Math.floor(total_seconds / 60) % 60;
  const hours = Math.floor(total_seconds / 3600);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

// Avtomatik kategoriya aniqlash filtri
function detectCategory(purpose: string, counterparty: string): string {
  const p = purpose.toLowerCase();
  const c = counterparty.toLowerCase();

  if (p.includes('комиссия') || p.includes('абонплата') || p.includes('sms') || p.includes('хизмат кўрсатганлик')) {
    return 'BANK_FEES';
  }
  if (p.includes('солиқ') || p.includes('солик') || c.includes('дси') || c.includes('казначейство') || p.includes('солиғи')) {
    return 'TAX';
  }
  if (p.includes('выручка') || p.includes('pos') || p.includes('humo') || p.includes('uzcard') || p.includes('тушум')) {
    return 'REVENUE';
  }
  return 'SUPPLIER';
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const formatType = formData.get('formatType') as string; // 'HAMKORBANK' yoki 'IPOTEKA_ASBT'

    if (!file || !companyId || !formatType) {
      return NextResponse.json({ error: 'Ma\'lumotlar to\'liq emas!' }, { status: 400 });
    }

    // Faylni buffer formatida o'qiymiz
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Shapkani tashlab yuborib (range: 4 -> 5-qatordan) massivga o'giramiz
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 4 });
    const transactions: any[] = [];

    // --- 1-FORMAT: HAMKORBANK PARSER ---
    if (formatType === 'HAMKORBANK') {
      for (const row of rawData) {
        if (!row[0] || String(row[0]).includes('Итого') || String(row[0]).includes('Остаток')) continue;

        const accountInfo = String(row[1] || '').split('/');
        const cInn = accountInfo[1] ? accountInfo[1].trim() : '';
        const cName = accountInfo[2] ? accountInfo[2].trim() : '';
        const txDate = parseExcelDate(Number(row[0]));

        transactions.push({
          companyId,
          txDate: txDate.toISOString().split('T')[0],
          counterpartyName: cName,
          counterpartyInn: cInn,
          debitAmount: Number(row[2]) || 0.0,
          creditAmount: Number(row[3]) || 0.0,
          purpose: row[4] || '',
          category: detectCategory(row[4] || '', cName),
          periodMonth: txDate.getMonth() + 1,
          periodYear: txDate.getFullYear(),
          createdAt: new Date().toISOString()
        });
      }
    }
    // --- 2-FORMAT: IPOTEKA ASBT PARSER ---
    else if (formatType === 'IPOTEKA_ASBT') {
      for (const row of rawData) {
        // № ustunida raqam bo'lmasa yoki keraksiz qator bo'lsa tashlab ketamiz
        if (!row[0] || isNaN(Number(row[0])) || String(row[0]).includes('Оборот')) continue;

        const txDate = parseExcelDate(Number(row[5])); // Sana 6-ustunda (index 5)
        const cName = row[8] ? String(row[8]).trim() : '';
        const cInn = row[9] ? String(row[9]).trim() : '';
        const amount = Number(row[7]) || 0.0; // Summa 8-ustunda

        transactions.push({
          companyId,
          txDate: txDate.toISOString().split('T')[0],
          counterpartyName: cName,
          counterpartyInn: cInn,
          debitAmount: amount, // Ipoteka spravkasi faqat chiqim (debet)
          creditAmount: 0.0,
          purpose: row[6] || '',
          category: detectCategory(row[6] || '', cName),
          periodMonth: txDate.getMonth() + 1,
          periodYear: txDate.getFullYear(),
          createdAt: new Date().toISOString()
        });
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json({ message: 'Yuklash uchun mos ma\'lumot topilmadi.' }, { status: 400 });
    }

    // --- FIREBASE FIRESTORE'GA BATCH (YALPI) YOZISH ---
    // Firebase bitta batchda max 500 ta operatsiya qabul qiladi, shunga bo'lib yuboramiz
    const chunks = [];
    for (let i = 0; i < transactions.length; i += 490) {
      chunks.push(transactions.slice(i, i + 490));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((tx) => {
        const txRef = doc(collection(db, 'transactions'));
        batch.set(txRef, tx);
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}