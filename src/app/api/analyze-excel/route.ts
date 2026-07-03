import { NextResponse } from "next/server";
import * as xlsx from "xlsx";
import { getFirestore } from "firebase-admin/firestore";
// Agar bu marshrutda ham Firebase yozish kerak bo'lsa, initializeApp qilinganiga ishonch hosil qilish kerak.
// Bizning oldingi route.ts dagi kabi global instanceni ishlata olamiz.

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Fayl yuklanmadi." }, { status: 400 });
    }

    // Faylni buferga o'tkazish
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Excel faylini o'qish
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // Birinchi sahifani olish
    const worksheet = workbook.Sheets[sheetName];

    // Ma'lumotlarni JSON formatiga o'tkazish
    const rawData = xlsx.utils.sheet_to_json(worksheet) as any[];

    if (rawData.length === 0) {
      return NextResponse.json({ error: "Fayl bo'sh yoki noto'g'ri formatda." }, { status: 400 });
    }

    let totalDebit = 0;
    let totalCredit = 0;
    const transactions = [];

    // Tahlil mexanizmi (2 xil formatni aniqlash)
    for (const row of rawData) {
      const isFormatA = row.hasOwnProperty('Debit') || row.hasOwnProperty('Credit');

      let debit = 0;
      let credit = 0;
      const description = row['Description'] || row['Ta\'rif'] || 'Noma\'lum';
      const date = row['Date'] || row['Sana'] || new Date().toISOString();

      if (isFormatA) {
        // Format A: Debit va Credit ustunlari alohida
        debit = parseFloat(row['Debit']) || 0;
        credit = parseFloat(row['Credit']) || 0;
      } else {
        // Format B: Faqat bitta 'Amount' (Summa) ustuni bor, tushum/chiqim +/- orqali ajratiladi
        const amount = parseFloat(row['Amount'] || row['Summa']) || 0;
        if (amount > 0) {
          credit = amount; // Tushum
        } else {
          debit = Math.abs(amount); // Chiqim
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      transactions.push({
        date,
        description,
        debit,
        credit,
        balance: credit - debit // O'sha vaqtdagi sof qoldiq
      });
    }

    const netBalance = totalCredit - totalDebit;

    const analysisResult = {
      totalDebit,
      totalCredit,
      netBalance,
      transactionCount: transactions.length,
      timestamp: new Date().toISOString(),
      transactions
    };

    // Agar ma'lumotlarni Firestore-ga saqlashni xohlasangiz:
    /*
    const db = getFirestore();
    await db.collection("excel_analyses").add(analysisResult);
    */

    return NextResponse.json({
      success: true,
      message: "Tahlil muvaffaqiyatli yakunlandi.",
      data: analysisResult
    });

  } catch (error: any) {
    console.error("🔴 EXCEL PARSE ERROR:", error);
    return NextResponse.json({ error: "Faylni tahlil qilishda xatolik yuz berdi." }, { status: 500 });
  }
}