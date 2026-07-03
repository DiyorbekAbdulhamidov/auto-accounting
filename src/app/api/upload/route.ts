import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import crypto from 'crypto'; // Unikal ID xeshini yaratish uchun

// Excel/CSV ichidagi har xil formatdagi sanalarni JS Date-ga xavfsiz o'tkazish
function parseExcelDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  if (typeof value === 'number' || (!isNaN(Number(value)) && !String(value).includes('.'))) {
    const serial = Number(value);
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const minutes = Math.floor(total_seconds / 60) % 60;
    const hours = Math.floor(total_seconds / 3600);

    const parsedDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }

  const dateStr = String(value).trim();
  const parts = dateStr.split(/[./-]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    } else if (parts[0].length === 4 && parts[2].length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
  }

  const fallbackDate = new Date(dateStr);
  if (!isNaN(fallbackDate.getTime())) return fallbackDate;
  return new Date();
}

function detectCategory(purpose: string, counterparty: string): string {
  const p = purpose.toLowerCase();
  const c = counterparty.toLowerCase();
  if (p.includes('комиссия') || p.includes('абонплата') || p.includes('sms') || p.includes('хизмат кўрсатганлик')) return 'BANK_FEES';
  if (p.includes('солиқ') || p.includes('солик') || c.includes('дси') || c.includes('казначейство') || p.includes('солиғи')) return 'TAX';
  if (p.includes('выручка') || p.includes('pos') || p.includes('humo') || p.includes('uzcard') || p.includes('тушум')) return 'REVENUE';
  return 'SUPPLIER';
}

// Tranzaksiya takrorlanmasligi uchun xesh generatsiya qilish funksiyasi
function generateTxId(companyId: string, date: string, debit: number, credit: number, purpose: string, inn: string): string {
  const rawString = `${companyId}_${date}_${debit}_${credit}_${purpose.trim()}_${inn.trim()}`;
  return crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 24);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const formatType = formData.get('formatType') as string;

    if (!file || !companyId || !formatType) {
      return NextResponse.json({ error: "Ma'lumotlar to'liq emas!" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 4 });
    const transactions: any[] = [];

    // --- 1-FORMAT: HAMKORBANK PARSER ---
    if (formatType === 'HAMKORBANK') {
      for (const row of rawData) {
        if (!row[0] || String(row[0]).includes('Итого') || String(row[0]).includes('Остаток')) continue;

        const accountInfo = String(row[1] || '').split('/');
        const cInn = accountInfo[1] ? accountInfo[1].trim() : '';
        const cName = accountInfo[2] ? accountInfo[2].trim() : '';
        const txDate = parseExcelDate(row[0]);

        const dateStr = txDate.toISOString().split('T')[0];
        const debit = Number(row[2]) || 0.0;
        const credit = Number(row[3]) || 0.0;
        const purpose = row[4] || '';

        // Unikal ID hosil qilamiz
        const txCustomId = generateTxId(companyId, dateStr, debit, credit, purpose, cInn);

        transactions.push({
          id: txCustomId, // Keyinchalik Batch yozishda doc ID qilish uchun asqotadi
          companyId,
          txDate: dateStr,
          counterpartyName: cName,
          counterpartyInn: cInn,
          debitAmount: debit,
          creditAmount: credit,
          purpose,
          category: detectCategory(purpose, cName),
          periodMonth: txDate.getMonth() + 1,
          periodYear: txDate.getFullYear(),
          createdAt: new Date().toISOString()
        });
      }
    }
    // --- 2-FORMAT: IPOTEKA ASBT PARSER ---
    else if (formatType === 'IPOTEKA_ASBT') {
      for (const row of rawData) {
        if (!row[0] || isNaN(Number(row[0])) || String(row[0]).includes('Оборот')) continue;

        const txDate = parseExcelDate(row[5]);
        const dateStr = txDate.toISOString().split('T')[0];
        const cName = row[8] ? String(row[8]).trim() : '';
        const cInn = row[9] ? String(row[9]).trim() : '';
        const debit = Number(row[7]) || 0.0;
        const purpose = row[6] || '';

        const txCustomId = generateTxId(companyId, dateStr, debit, 0, purpose, cInn);

        transactions.push({
          id: txCustomId,
          companyId,
          txDate: dateStr,
          counterpartyName: cName,
          counterpartyInn: cInn,
          debitAmount: debit,
          creditAmount: 0.0,
          purpose,
          category: detectCategory(purpose, cName),
          periodMonth: txDate.getMonth() + 1,
          periodYear: txDate.getFullYear(),
          createdAt: new Date().toISOString()
        });
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json({ message: "Yuklash uchun mos ma'lumot topilmadi." }, { status: 400 });
    }

    // --- FIREBASE FIRESTORE'GA BATCH YOZISH (DUBLIKATSIZ) ---
    const chunks = [];
    for (let i = 0; i < transactions.length; i += 490) {
      chunks.push(transactions.slice(i, i + 490));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((tx) => {
        // Avtomatik ID o'rniga, o'zimiz yaratgan unikal xesh 'tx.id' ni hujjat kaliti qilamiz
        const txRef = doc(db, 'transactions', tx.id);

        // ID ni hujjat ichida ortiqcha saqlamaslik uchun o'chirib yuborish mumkin
        const { id, ...cleanData } = tx;
        batch.set(txRef, cleanData, { merge: true }); // merge: true xavfsizlikni oshiradi
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}