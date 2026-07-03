import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// 1. Саналарни хавфсиз конвертация қилиш
function parseExcelDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  if (typeof value === 'number' || (!isNaN(Number(value)) && !String(value).includes('.'))) {
    const serial = Number(value);
    const utc_days = Math.floor(serial - 25569);
    return new Date(utc_days * 86400 * 1000);
  }

  let dateStr = String(value).trim();
  // Руспублика формати DD.MM.YYYY ёки шунга ўхшаш матн ичидан санани топиш
  const ruDateMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (ruDateMatch) {
    return new Date(`${ruDateMatch[3]}-${ruDateMatch[2]}-${ruDateMatch[1]}T00:00:00Z`);
  }

  const fallback = new Date(dateStr);
  return !isNaN(fallback.getTime()) ? fallback : new Date();
}

// 2. Пул суммаларини хавфсиз рақамга айлантириш (NaN хатолигини олдини олади)
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

// 3. СТИР (ИНН) ни тозалаш
function cleanInn(inn: any): string {
  if (!inn) return '-';
  const cleaned = String(inn).replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : '-';
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    // Barcha yuklangan fayllarni massiv qilib olish
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Файл(лар) юкланмади!" }, { status: 400 });
    }

    const agg: Record<string, any> = {};

    // Asosiy ma'lumotlarni yig'uvchi funksiya
    function addTx(name: string, inn: string, date: Date, debit: number, credit: number) {
      const cInn = cleanInn(inn);
      let cName = name ? String(name).trim() : "Номаълум контрагент";

      // Bank komissiyalari STIRsiz (0) kelsa chalkashmasligi uchun nomini ham inobatga olamiz
      const key = (cInn !== '-' && cInn !== '0' && cInn.length > 5) ? cInn : cName.toUpperCase() || 'UNKNOWN';

      if (!agg[key]) {
        agg[key] = {
          inn: cInn,
          name: cName,
          debitMonths: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
          creditMonths: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
          totalDebit: 0,
          totalCredit: 0,
        };
      }

      const month = date.getMonth() + 1;
      if (!isNaN(month) && month >= 1 && month <= 12) {
        if (debit > 0) {
          agg[key].debitMonths[month] += debit;
          agg[key].totalDebit += debit;
        }
        if (credit > 0) {
          agg[key].creditMonths[month] += credit;
          agg[key].totalCredit += credit;
        }
      }
    }

    const detectedFormats: string[] = [];

    // Har bir yuklangan faylni alohida ochib tahlil qilamiz
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer', cellDates: false });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 🎯 АВТОМАТИК ФОРМАТ АНИҚЛАШ
      let formatType = 'UNKNOWN';
      let isIpotekaDebit = true;

      const headerChunk = JSON.stringify(rawData.slice(0, 25)).toUpperCase();

      if (headerChunk.includes('СЧЁТ-ФАКТУРА') && headerChunk.includes('СУММА К ОПЛАТЕ')) {
        formatType = 'FAKTURA';
      } else if (headerChunk.includes('HAMKORBANK') || headerChunk.includes('СВЕДЕНИЯ О РАБОТЕ СЧЕТА')) {
        formatType = 'HAMKORBANK';
      } else if (headerChunk.includes('ASBT') || headerChunk.includes('ИПОТЕКА-БАНК') || headerChunk.includes('ОБОРОТАХ ПО СЧЕТУ')) {
        formatType = 'IPOTEKA_ASBT';
        if (headerChunk.includes('КРЕДИТОВЫХ ОБОРОТАХ')) {
          isIpotekaDebit = false;
        }
      }

      if (formatType !== 'UNKNOWN' && !detectedFormats.includes(formatType)) {
        detectedFormats.push(formatType);
      }

      // 🎯 МАЪЛУМОТЛАРНИ ТАҲЛИЛ ҚИЛИШ
      if (formatType === 'HAMKORBANK') {
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 4) continue;

          const accountInfo = String(row[1] || '').split('/');
          if (accountInfo.length >= 2) {
            const rawInn = accountInfo[1] ? accountInfo[1].trim() : '';
            const rawName = accountInfo[2] ? accountInfo[2].trim() : String(row[1]);

            const txDate = parseExcelDate(row[0]);
            // Hamkorbank bankdan chiqgan pul - Debit
            const debit = parseAmount(row[2]);
            const credit = parseAmount(row[3]);

            addTx(rawName, rawInn, txDate, debit, credit);
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

            let targetName = '';
            let targetInn = '';
            let debit = 0;
            let credit = 0;

            if (isIpotekaDebit) {
              targetName = String(row[8] || '');
              targetInn = String(row[9] || '');
              debit = sum; // Biz to'ladik (Дебет)
            } else {
              targetName = String(row[3] || '');
              targetInn = String(row[4] || '');
              credit = sum;
            }

            addTx(targetName, targetInn, txDate, debit, credit);
          }
        }
      }
      else if (formatType === 'FAKTURA') {
        // Avval Sarlavhani (Header) topib olamiz, keyingi qatorlardan o'qiymiz
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
          if (!/^\d+(\.\d+)?$/.test(rowNumStr)) continue; // Faqat tartib raqami bor qatorlar

          const status = String(row[1] || '').trim().toLowerCase();
          // Bekor qilingan hisob-fakturalarni inobatga olmaslik
          if (status.includes('отклонен') || status.includes('отменен')) continue;

          const docStr = String(row[2] || '');
          const txDate = parseExcelDate(docStr);

          // E-Fakturadagi ПРОДАВЕЦ (Sotuvchi/Ta'minotchi) ma'lumotlari
          const sellerInn = String(row[4] || '');
          const sellerName = String(row[5] || '');
          const amount = parseAmount(row[8]);

          // E-Faktura orqali kelgan summa bizning "Кредит" qarzdorligimizni (yoki yopilishni) tashkil qiladi
          if (amount > 0) {
            addTx(sellerName, sellerInn, txDate, 0, amount);
          }
        }
      }
    }

    if (detectedFormats.length === 0) {
      return NextResponse.json({ error: "Юкланган файлларнинг формати танилмади. Илтимос Hamkorbank, Ipoteka ёки Э-Фактура файлларни юкланг." }, { status: 400 });
    }

    // Қолдиқ (Фарқи)ни ҳисоблаш (Дебет - Кредит = Сальдо)
    const result = Object.values(agg).map((item) => {
      item.difference = item.totalDebit - item.totalCredit;
      return item;
    });

    return NextResponse.json({ success: true, data: result, detectedFormats });
  } catch (error: any) {
    console.error("EXCEL PARSE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}