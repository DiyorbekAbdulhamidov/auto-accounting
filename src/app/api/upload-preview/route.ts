import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// 1. Sanalarni xavfsiz va aniq o'girish (Xatoliklarni oldini olish)
function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  if (typeof value === 'number' || (!isNaN(Number(value)) && !String(value).includes('.'))) {
    const serial = Number(value);
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  let dateStr = String(value).trim();
  const ruDateMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (ruDateMatch) {
    const date = new Date(`${ruDateMatch[3]}-${ruDateMatch[2]}-${ruDateMatch[1]}T00:00:00Z`);
    return isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(dateStr);
  return !isNaN(fallback.getTime()) ? fallback : null;
}

// 2. Pul summalarini tozalash (Probel, vergullardan tozalash)
function parseAmount(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  let str = String(val).trim();
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/,/g, '');
  } else if (str.includes(',') && !str.includes('.')) {
    str = str.replace(/,/g, '.');
  }
  str = str.replace(/\s/g, '');
  return Number(str) || 0;
}

// 3. INN (STIR) ni xavfsiz tozalash
function cleanInn(inn: any): string {
  if (!inn) return '-';
  const cleaned = String(inn).replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : '-';
}

// 🌟 YANGI: O'zbekiston INN (STIR) raqamlarini haqiqiyligini tekshirish
function isValidUzbekInn(inn: string): boolean {
  // INN aniq 9 xonali raqam bo'lishi kerak (yoki JShShIR bo'lsa 14 xonali)
  if (!/^\d{9}$/.test(inn) && !/^\d{14}$/.test(inn)) return false;

  // Agar 9 xonali bo'lsa, u mobil raqam bo'lmasligini tekshiramiz
  if (inn.length === 9) {
    const mobilePrefixes = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '77', '55'];
    const prefix = inn.substring(0, 2);
    if (mobilePrefixes.includes(prefix)) {
      return false; // Bu katta ehtimol bilan telefon raqami
    }
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Fayl(lar) yuklanmadi!" }, { status: 400 });
    }

    const agg: Record<string, any> = {};

    // 🌟 YANGI: Tranzaksiyalarni qo'shish mantiqi (Yil-Oy va Detalizatsiya bilan)
    function addTx(name: string, inn: string, date: Date | null, debit: number, credit: number, docType: string) {
      const cInn = cleanInn(inn);
      let cName = name ? String(name).trim() : "Noma'lum kontragent";

      // Agar INN topilmasa, nomini kalit qilamiz, aks holda INNni
      const key = (cInn !== '-' && cInn !== '0' && cInn.length > 5) ? cInn : cName.toUpperCase() || 'UNKNOWN';

      if (!agg[key]) {
        agg[key] = {
          inn: cInn,
          name: cName,
          monthlyData: {}, // Masalan: "2023-01": { debit: 100, credit: 50 }
          transactions: [], // Barcha operatsiyalar ro'yxati (Buxgalter tekshirishi uchun)
          totalDebit: 0,
          totalCredit: 0,
        };
      }

      const txDate = date || new Date();
      const year = txDate.getFullYear();
      const month = String(txDate.getMonth() + 1).padStart(2, '0');
      const periodKey = `${year}-${month}`; // Format: YYYY-MM (Yillar aralashib ketmaydi)

      if (!agg[key].monthlyData[periodKey]) {
        agg[key].monthlyData[periodKey] = { debit: 0, credit: 0 };
      }

      if (debit > 0) {
        agg[key].monthlyData[periodKey].debit += debit;
        agg[key].totalDebit += debit;
      }
      if (credit > 0) {
        agg[key].monthlyData[periodKey].credit += credit;
        agg[key].totalCredit += credit;
      }

      // Har bir operatsiyani tarixda saqlaymiz
      if (debit > 0 || credit > 0) {
        agg[key].transactions.push({
          date: txDate.toISOString().split('T')[0],
          type: docType, // 'BANK' yoki 'FAKTURA'
          debit: debit,
          credit: credit
        });
      }
    }

    const detectedFormats: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer', cellDates: false });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let formatType = 'UNKNOWN';
      let isIpotekaDebit = true;

      const headerChunk = JSON.stringify(rawData.slice(0, 25)).toUpperCase();

      if (headerChunk.includes('СЧЁТ-ФАКТУРА') && headerChunk.includes('СУММА К ОПЛАТЕ')) {
        formatType = 'FAKTURA';
      } else if (headerChunk.includes('HAMKORBANK') || headerChunk.includes('СВЕДЕНИЯ О РАБОТЕ СЧЕТА')) {
        formatType = 'HAMKORBANK';
      } else if (headerChunk.includes('ASBT') || headerChunk.includes('ИПОТЕКА-БАНК') || headerChunk.includes('ОБОРОТАХ ПО СЧЕТУ')) {
        formatType = 'IPOTEKA_ASBT';
        if (headerChunk.includes('КРЕДИТОВЫХ ОБОРОТАХ')) isIpotekaDebit = false;
      } else {
        formatType = 'GENERIC';
      }

      if (!detectedFormats.includes(formatType)) {
        detectedFormats.push(formatType);
      }

      if (formatType === 'HAMKORBANK') {
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 4) continue;
          const accountInfo = String(row[1] || '').split('/');
          if (accountInfo.length >= 2) {
            const rawInn = accountInfo[1] ? accountInfo[1].trim() : '';
            const rawName = accountInfo[2] ? accountInfo[2].trim() : String(row[1]);
            const txDate = parseExcelDate(row[0]);
            const debit = parseAmount(row[2]);
            const credit = parseAmount(row[3]);
            addTx(rawName, rawInn, txDate, debit, credit, 'BANK');
          }
        }
      }
      else if (formatType === 'IPOTEKA_ASBT') {
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 8) continue;
          const rowNumStr = String(row[0]).trim();
          if (/^\d+$/.test(rowNumStr)) {
            const txDate = parseExcelDate(row[5]);
            const sum = parseAmount(row[7]);
            let targetName = isIpotekaDebit ? String(row[8] || '') : String(row[3] || '');
            let targetInn = isIpotekaDebit ? String(row[9] || '') : String(row[4] || '');
            let debit = isIpotekaDebit ? sum : 0;
            let credit = isIpotekaDebit ? 0 : sum;
            addTx(targetName, targetInn, txDate, debit, credit, 'BANK');
          }
        }
      }
      else if (formatType === 'FAKTURA') {
        let startIndex = 1;
        for (let r = 0; r < Math.min(20, rawData.length); r++) {
          if (rawData[r] && String(rawData[r][0]).includes('№') && String(rawData[r][1]).includes('СТАТУС')) {
            startIndex = r + 1;
            break;
          }
        }
        for (let i = startIndex; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 8) continue;
          const rowNumStr = String(row[0]).trim();
          if (!/^\d+(\.\d+)?$/.test(rowNumStr)) continue;

          const status = String(row[1] || '').trim().toLowerCase();
          // Bekor qilingan fakturalarni hisobga olmaymiz
          if (status.includes('отклонен') || status.includes('отменен') || status.includes('bekor')) continue;

          const docStr = String(row[2] || '');
          const txDate = parseExcelDate(docStr);
          const sellerInn = String(row[4] || '');
          const sellerName = String(row[5] || '');
          const amount = parseAmount(row[8]);

          if (amount > 0) addTx(sellerName, sellerInn, txDate, 0, amount, 'FAKTURA');
        }
      }
      else if (formatType === 'GENERIC') {
        let innIdx = -1, nameIdx = -1, dateIdx = -1, debitIdx = -1, creditIdx = -1, sumIdx = -1;

        for (let r = 0; r < Math.min(15, rawData.length); r++) {
          const row = rawData[r];
          if (!row) continue;
          for (let c = 0; c < row.length; c++) {
            const cellStr = String(row[c]).toUpperCase();
            if (cellStr === 'ИНН' || cellStr === 'СТИР' || cellStr.includes('ИНН КОНТРАГЕНТА')) innIdx = c;
            else if (cellStr.includes('НАИМЕНОВАНИЕ') || cellStr.includes('НОМИ') || cellStr.includes('КОНТРАГЕНТ') || cellStr.includes('КЛИЕНТ')) nameIdx = c;
            else if (cellStr === 'ДАТА' || cellStr === 'САНА' || cellStr === 'DATE' || cellStr.includes('ДАТА ДОК')) dateIdx = c;
            else if (cellStr === 'ДЕБЕТ' || cellStr.includes('РАСХОД') || cellStr.includes('ЎТКАЗМА')) debitIdx = c;
            else if (cellStr === 'КРЕДИТ' || cellStr.includes('ПРИХОД') || cellStr.includes('КИРИМ')) creditIdx = c;
            else if (cellStr === 'СУММА' || cellStr.includes('ИТОГО') || cellStr.includes('ОБОРОТ')) sumIdx = c;
          }
          if (innIdx !== -1 && (sumIdx !== -1 || debitIdx !== -1 || creditIdx !== -1)) break;
        }

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 2) continue;

          let targetInn = '';
          let targetName = "Noma'lum firma";
          let txDate: Date | null = null;
          let debit = 0;
          let credit = 0;

          if (innIdx !== -1) {
            targetInn = cleanInn(row[innIdx]);
            if (nameIdx !== -1) targetName = String(row[nameIdx] || '');
            if (dateIdx !== -1) txDate = parseExcelDate(row[dateIdx]);

            if (debitIdx !== -1) debit = parseAmount(row[debitIdx]);
            if (creditIdx !== -1) credit = parseAmount(row[creditIdx]);
            else if (sumIdx !== -1) debit = parseAmount(row[sumIdx]);
          }
          else {
            let foundInn = false;
            const nums: number[] = [];

            for (let c = 0; c < row.length; c++) {
              const cellStr = String(row[c]).trim();
              const possibleInn = cleanInn(cellStr);

              // 🌟 YANGI: Strogiy INN tekshiruvi (Mobil raqamlarni chetlab o'tish)
              if (!foundInn && isValidUzbekInn(possibleInn)) {
                targetInn = possibleInn;
                foundInn = true;
                targetName = String(row[c - 1] || row[c + 1] || 'Noma\'lum');
              }
              else if (cellStr.includes('.') && cellStr.split('.').length === 3 && cellStr.length <= 10) {
                txDate = parseExcelDate(row[c]);
              }
              else {
                const amount = parseAmount(row[c]);
                if (!isNaN(amount) && amount > 0 && amount !== Number(possibleInn)) nums.push(amount);
              }
            }

            if (foundInn) {
              debit = nums[0] || 0;
              credit = nums[1] || 0;
            }
          }

          if (targetInn.length >= 8 && (debit > 0 || credit > 0)) {
            addTx(targetName, targetInn, txDate, debit, credit, 'GENERIC_DOC');
          }
        }
      }
    }

    if (Object.keys(agg).length === 0) {
      return NextResponse.json({
        error: "Fayl ichidan yaroqli INN (STIR) va Summa ma'lumotlari topilmadi."
      }, { status: 400 });
    }

    // 🌟 YANGI: Sal'doni aniq hisoblash (Faktura vs Pul to'lovi qoldig'i)
    const result = Object.values(agg).map((item) => {
      // difference > 0 bo'lsa korxona qarzdor, < 0 bo'lsa xaridor qarzdor
      item.difference = item.totalCredit - item.totalDebit;

      // Buxgalter uchun tranzaksiyalarni sana bo'yicha saralaymiz
      item.transactions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return item;
    });

    return NextResponse.json({ success: true, data: result, detectedFormats });
  } catch (error: any) {
    console.error("EXCEL PARSE ERROR:", error);
    return NextResponse.json({ error: "Faylni o'qishda tizimli xatolik yuz berdi: " + error.message }, { status: 500 });
  }
}