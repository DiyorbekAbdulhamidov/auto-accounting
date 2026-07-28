// app/api/upload-preview/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { parseUniversal } from '@/lib/universalParser';
import { readWorkbookSmart } from '@/lib/excelWorkbook';
import {
  parseTwoSidedTurnover,
  parseThreeRowAccountReport,
  parseColumnarStatement,
  sameEntity,
  type BankStatement,
} from '@/lib/bankStatements';

// ============================================================
// 1. Sanani xavfsiz va aniq o'girish
//    - Excel serial (number YOKI raqamli string) -> UTC asosida
//    - DD.MM.YYYY / DD-MM-YYYY (1 yoki 2 xonali kun/oy, matn ichida
//      qayerda bo'lishidan qat'iy nazar, masalan "1036 от 30.06.2026")
//    - Hammasi UTC bilan quriladi, shuning uchun keyinchalik
//      getUTCFullYear/getUTCMonth bilan mos keladi (server qaysi
//      timezone'da ishlashidan qat'iy nazar oy/yil siljib ketmaydi)
// ============================================================
function parseExcelDate(value: any): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const isPureNumeric = typeof value === 'number'
    ? isFinite(value)
    : /^\d+$/.test(String(value).trim());

  if (isPureNumeric) {
    const serial = Number(value);
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }

  const strVal = String(value).trim();
  if (!strVal) return null;

  const ruDateMatch = strVal.match(/(\d{1,2})[.\-](\d{1,2})[.\-](\d{4})/);
  if (ruDateMatch) {
    const day = Number(ruDateMatch[1]);
    const month = Number(ruDateMatch[2]);
    const year = Number(ruDateMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!isNaN(date.getTime())) return date;
    }
  }

  const fallback = new Date(strVal);
  return !isNaN(fallback.getTime()) ? fallback : null;
}

// ============================================================
// 2. Pul summalarini tozalash
//    - "1,234.56" (US), "1.234,56" (EU/RU), "1 234,56" (probel bilan)
//    - "(1 234,56)" -> manfiy
//    - valyuta harflari/belgilari ("so'm", "сум", "UZS", "$") olib tashlanadi
// ============================================================
function parseAmount(val: any): number {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return 0;

  let str = String(val).trim();
  if (!str) return 0;

  let negative = false;
  if (/^\(.*\)$/.test(str)) {
    negative = true;
    str = str.slice(1, -1).trim();
  }
  if (str.startsWith('-')) {
    negative = true;
    str = str.slice(1);
  }

  str = str.replace(/[^\d,.\s]/g, '');
  str = str.replace(/\s/g, '');
  if (!str) return 0;

  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    // ikkalasi ham bor: eng oxirgisi kasr ajratkichi hisoblanadi
    str = lastComma > lastDot
      ? str.replace(/\./g, '').replace(',', '.')
      : str.replace(/,/g, '');
  } else if (lastComma !== -1) {
    const parts = str.split(',');
    const isDecimal = parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2;
    str = isDecimal ? str.replace(',', '.') : str.replace(/,/g, '');
  }
  // faqat nuqta bo'lsa (yoki umuman ajratkich bo'lmasa) - Number() to'g'ri o'qiydi

  const num = Number(str);
  if (isNaN(num)) return 0;
  return negative ? -num : num;
}

// ============================================================
// 3. INN (STIR) ni xavfsiz tozalash
// ============================================================
function cleanInn(inn: any): string {
  if (!inn) return '-';
  const cleaned = String(inn).replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : '-';
}

// O'zbekiston INN (STIR) raqamlarini haqiqiyligini tekshirish (mobil raqamlarni chetlab o'tish)
function isValidUzbekInn(inn: string): boolean {
  if (!/^\d{9}$/.test(inn) && !/^\d{14}$/.test(inn)) return false;
  if (inn.length === 9) {
    const mobilePrefixes = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '88', '77', '55'];
    const prefix = inn.substring(0, 2);
    if (mobilePrefixes.includes(prefix)) return false;
  }
  return true;
}

// ============================================================
// Umumiy tiplar
// ============================================================
interface MonthlyBucket {
  debit: number;
  credit: number;
}
interface TxRecord {
  date: string;
  type: string;
  debit: number;
  credit: number;
}
interface AggEntry {
  inn: string;
  name: string;
  monthlyData: Record<string, MonthlyBucket>; // key: "YYYY-MM"
  transactions: TxRecord[];
  totalDebit: number;
  totalCredit: number;
  difference?: number;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Fayl(lar) yuklanmadi!" }, { status: 400 });
    }

    const agg: Record<string, AggEntry> = {};
    // FAKTURA fayllarida bir xil hisob-faktura ikki marta tushib qolmasligi uchun
    // (masalan fayl ichida qisman ustma-ust tushgan qatorlar bo'lsa)
    const seenInvoiceSignatures = new Set<string>();

    function addTx(
      name: string,
      inn: string,
      date: Date | null,
      debit: number,
      credit: number,
      docType: string
    ) {
      const cInn = cleanInn(inn);
      const cName = name ? String(name).trim() : "Noma'lum kontragent";
      const key = (cInn !== '-' && cInn !== '0' && cInn.length > 5) ? cInn : (cName.toUpperCase() || 'UNKNOWN');

      if (!agg[key]) {
        agg[key] = {
          inn: cInn,
          name: cName,
          monthlyData: {},
          transactions: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }

      const txDate = date || new Date();
      // MUHIM: UTC getterlar ishlatiladi, chunki txDate ham UTC asosida qurilgan
      // (server qaysi timezone'da ishlashidan qat'iy nazar oy/yil noto'g'ri
      // hisoblanib qolmasligi uchun - masalan 01.01.2026 dekabrga tushib qolmasligi kerak)
      const year = txDate.getUTCFullYear();
      const month = String(txDate.getUTCMonth() + 1).padStart(2, '0');
      const periodKey = `${year}-${month}`;

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

      if (debit > 0 || credit > 0) {
        agg[key].transactions.push({
          date: txDate.toISOString().split('T')[0],
          type: docType,
          debit,
          credit,
        });
      }
    }

    // Yangi shakldagi ko'chirmani (src/lib/bankStatements.ts) umumiy
    // yig'indiga qo'shish. O'z hisobvarag'i ichidagi harakatlar - o'z
    // korporativ kartasiga o'tkazma, ikkinchi hisobvaraq - kontragent
    // emas, shuning uchun ular tashlab yuboriladi (eski IPOTEKA_ASBT
    // shoxchasida ham xuddi shunday qilingan).
    function addStatement(st: BankStatement, docType: string) {
      for (const tx of st.txs) {
        if (tx.debit <= 0 && tx.credit <= 0) continue;
        const isOwnMovement =
          (!!st.ownInn && !!tx.inn && tx.inn === st.ownInn) ||
          (!!st.ownAccount && !!tx.account && tx.account === st.ownAccount) ||
          (!!st.ownName && !!tx.name && sameEntity(tx.name, st.ownName));
        if (isOwnMovement) continue;
        addTx(tx.name, tx.inn, tx.date, tx.debit, tx.credit, docType);
      }
    }

    const detectedFormats: string[] = [];

    // Bitta varaq (sheet) uchun format-aniqlash va o'qish. Ilgari faqat
    // birinchi varaq o'qilardi; endi faylning BARCHA varaqlari shu
    // funksiyadan o'tadi (ba'zi banklar ma'lumotni 2-varaqqa yozadi,
    // buxgalterlar esa bank oborotkasi va fakturalarni alohida
    // varaqlarga joylashtiradi). Parserlar mantig'i o'zgarmagan.
    function processSheet(rawData: any[][]) {
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
            const rawName = accountInfo[2] ? accountInfo[2].trim() : (rawInn || String(row[1]));
            const txDate = parseExcelDate(row[0]);
            const debit = parseAmount(row[2]);
            const credit = parseAmount(row[3]);
            if (debit > 0 || credit > 0) addTx(rawName, rawInn, txDate, debit, credit, 'BANK');
          }
        }
      }

      else if (formatType === 'IPOTEKA_ASBT') {
        // ---- YANGI ASBT eksport shakllari -------------------------------
        // Bank bitta sarlavha ostida bir necha xil jadval beradi. Quyidagi
        // uchta tekshiruv o'z IMZOsiga qarab ishlaydi; imzo topilmasa eski
        // mantiq (pastda) avvalgidek, so'zma-so'z o'zgarishsiz ishlaydi.

        // (a) «Cправка о работе счета» - bitta o'tkazma uch qatorga yoyilgan
        const threeRow = parseThreeRowAccountReport(rawData);
        if (threeRow) {
          if (!detectedFormats.includes('ASBT_3ROW')) detectedFormats.push('ASBT_3ROW');
          addStatement(threeRow, 'BANK');
          return;
        }

        // (b) «СПРАВКА ПО РАБОТЕ СЧЕТА» - Дебет va Кредит alohida ustunlarda
        const columnar = parseColumnarStatement(rawData);
        if (columnar) {
          if (!detectedFormats.includes('ASBT_ACCOUNT_REPORT')) detectedFormats.push('ASBT_ACCOUNT_REPORT');
          addStatement(columnar, 'BANK');
          return;
        }

        // (c) «дебетовых/кредитовых оборотах» - ustunlar soni eksport
        //     versiyasiga qarab farq qiladi (10 ta ham, 14 ta ham).
        //     Eski qattiq indekslar (сана=5, сумма=7) shu varaqqa MOS
        //     bo'lsa - hech narsa o'zgarmaydi, eski kod ishlaydi.
        //     Mos bo'lmasa (yoki varaqda ikkita bo'lim bo'lsa) - ustunlar
        //     shapka nomi bo'yicha aniqlanadi.
        const twoSided = parseTwoSidedTurnover(rawData);
        const legacyLayoutFits =
          !!twoSided &&
          twoSided.layout.length === 1 &&
          twoSided.layout[0].amountCol === 7 &&
          twoSided.layout[0].dateCol === 5;
        if (twoSided && !legacyLayoutFits) {
          if (!detectedFormats.includes('ASBT_TURNOVER')) detectedFormats.push('ASBT_TURNOVER');
          addStatement(twoSided, 'BANK');
          return;
        }
        // ---- ESKI MANTIQ (o'zgartirilmagan) -----------------------------

        // Qaysi ustun "o'zimizning" (hisob egasining) INN'i, qaysisi kontragentniki -
        // debit (chiqim) faylida "получатель" (8/9-ustun) kontragent, "плательщик" (3/4) - o'zimiz.
        // Kredit (kirim) faylida buning aksi.
        const ownInnCol = isIpotekaDebit ? 4 : 9;
        const targetNameCol = isIpotekaDebit ? 8 : 3;
        const targetInnCol = isIpotekaDebit ? 9 : 4;

        // Hisob egasining o'z INN'ini birinchi to'g'ri qatordan aniqlaymiz -
        // shu orqali o'zining ikkinchi hisobvarag'iga o'tkazma/kredit to'lovlarini
        // (kontragent emasligini) aniqlab, hisobotdan chetlashtiramiz.
        let ownInn = '-';
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length < 9) continue;
          if (/^\d+$/.test(String(row[0]).trim())) {
            const candidate = cleanInn(row[ownInnCol]);
            if (candidate !== '-') { ownInn = candidate; break; }
          }
        }

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          // MUHIM: oldin "row.length < 8" edi, lekin 8/9-indeksdagi ustunlarga
          // (nomi/INN) kirish uchun kamida 9 ta ustun kerak - aks holda
          // qatorning oxiri qirqilib qolgan hollarda xato ma'lumot chiqishi mumkin edi.
          if (!row || row.length < 9) continue;
          const rowNumStr = String(row[0]).trim();
          if (!/^\d+$/.test(rowNumStr)) continue;

          const txDate = parseExcelDate(row[5]);
          const sum = parseAmount(row[7]);
          if (sum <= 0) continue;

          const targetName = String(row[targetNameCol] || '');
          const targetInn = cleanInn(row[targetInnCol]);

          // O'zining ikkinchi hisobvarag'iga o'tkazma / kredit asosiy qarzi to'lovi
          // kabi ICHKI harakatlar - bu kontragent emas, shot-fakturaga qarshi
          // solishtirish uchun kerak emas.
          if (ownInn !== '-' && targetInn === ownInn) continue;

          const debit = isIpotekaDebit ? sum : 0;
          const credit = isIpotekaDebit ? 0 : sum;
          addTx(targetName, targetInn, txDate, debit, credit, 'BANK');
        }
      }

      else if (formatType === 'FAKTURA') {
        // E-фактура portali eksport ustunlarini vaqti-vaqti bilan o'zgartiradi:
        // yangi eksportda ID / ТИП ЭСФ / ДОГОВОР / филиал ustunlari qo'shilgan
        // va СУММА К ОПЛАТЕ 8-o'rindan 14-o'ringa surilgan. Shuning uchun
        // ustunlar avval SHAPKA NOMI bo'yicha topiladi; shapka topilmasa -
        // eski qattiq indekslar (1/2/4/5/8) avvalgidek ishlatiladi.
        let cStatus = 1, cDoc = 2, cSellerInn = 4, cSellerName = 5, cAmount = 8;
        let startIndex = 1;
        let headerFound = false;

        for (let r = 0; r < Math.min(20, rawData.length); r++) {
          const row = rawData[r];
          if (!row) continue;
          let st = -1, doc = -1, sInn = -1, sName = -1, amt = -1;
          for (let c = 0; c < row.length; c++) {
            const t = String(row[c] ?? '').toUpperCase().replace(/\s+/g, ' ').trim();
            if (!t) continue;
            if (st === -1 && /^(СТАТУС|STATUS|ҲОЛАТ|ХОЛАТ|HOLAT)$/.test(t)) st = c;
            else if (doc === -1 && /СЧ[ЁЕ]Т-?ФАКТУРА|ҲИСОБ-?ФАКТУРА|ХИСОБ-?ФАКТУРА/.test(t)) doc = c;
            else if (sInn === -1 && /ПРОДАВЕЦ.*(ИНН|ПИНФЛ|СТИР)|СОТУВЧИ.*(СТИР|ИНН)/.test(t)) sInn = c;
            else if (sName === -1 && /ПРОДАВЕЦ.*(НАИМЕНОВАНИЕ|НОМ)|СОТУВЧИ.*НОМИ/.test(t)) sName = c;
            else if (amt === -1 && /СУММА К ОПЛАТЕ|ТЎЛОВГА|ТУЛОВГА|ЖАМИ СУММА/.test(t)) amt = c;
          }
          if (st !== -1 && doc !== -1 && amt !== -1) {
            cStatus = st; cDoc = doc; cAmount = amt;
            if (sInn !== -1) cSellerInn = sInn;
            if (sName !== -1) cSellerName = sName;
            startIndex = r + 1;
            headerFound = true;
            break;
          }
        }

        if (!headerFound) {
          for (let r = 0; r < Math.min(20, rawData.length); r++) {
            if (rawData[r] && String(rawData[r][0]).includes('№') && String(rawData[r][1]).includes('СТАТУС')) {
              startIndex = r + 1;
              break;
            }
          }
        }

        // Fayl "Подтверждён/Тасдиқланган" kabi status tizimidan foydalanadimi?
        // Agar ha - faqat SHU statusdagi (ikkala tomon tomonidan yakunlangan)
        // fakturalarni hisoblaymiz. "Ожидает подписи партнёра" (hali imzolanmagan)
        // yoki bo'sh statusli qatorlar (bu ayni faylda ba'zan bitta yozuvning
        // ustma-ust tushган nusxasi bo'lib chiqadi) hisobga olinmaydi.
        let hasConfirmedMarker = false;
        for (let i = startIndex; i < rawData.length; i++) {
          const s = String(rawData[i]?.[cStatus] || '').toLowerCase();
          if (s.includes('подтвержд') || s.includes('тасдиқ')) { hasConfirmedMarker = true; break; }
        }

        for (let i = startIndex; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length <= cAmount) continue;
          const rowNumStr = String(row[0]).trim();
          if (!/^\d+(\.\d+)?$/.test(rowNumStr)) continue;

          const status = String(row[cStatus] || '').trim().toLowerCase();
          if (status.includes('отклонен') || status.includes('отменен') || status.includes('bekor') || status.includes('rad et')) continue;
          if (hasConfirmedMarker && !(status.includes('подтвержд') || status.includes('тасдиқ'))) continue;

          const docStr = String(row[cDoc] || '');
          const txDate = parseExcelDate(docStr);
          const sellerInn = String(row[cSellerInn] || '');
          const sellerName = String(row[cSellerName] || '');
          const amount = parseAmount(row[cAmount]);

          if (amount <= 0) continue;

          const signature = `${docStr.trim()}|${cleanInn(sellerInn)}|${amount}`;
          if (seenInvoiceSignatures.has(signature)) continue;
          seenInvoiceSignatures.add(signature);

          addTx(sellerName, sellerInn, txDate, 0, amount, 'FAKTURA');
        }
      }

      else if (formatType === 'GENERIC') {
        // Uch qatorli «Cправка о работе счета» sarlavhasida bank nomi
        // ko'rsatilmasligi mumkin - unda fayl bu yerga tushadi. Imzosi
        // aniq (kontragent katagi «МФО:.. Счет:.. ИНН:..» ko'rinishida),
        // shuning uchun universal qatlamdan oldin tekshiriladi: aks holda
        // firma nomi o'rniga o'sha xizmat matni o'qilib qolardi.
        const threeRow = parseThreeRowAccountReport(rawData);
        if (threeRow) {
          if (!detectedFormats.includes('ASBT_3ROW')) detectedFormats.push('ASBT_3ROW');
          addStatement(threeRow, 'BANK');
          return;
        }

        // YANGI QATLAM: universal parser - kengaytirilgan shapka lug'ati va
        // statistik ustun tahlili bilan NOTANISH formatlarni o'qiydi.
        // Ishonchli natija topa olmasa null qaytaradi va quyidagi eski
        // evristika avvalgidek ishlayveradi. HAMKORBANK / IPOTEKA_ASBT /
        // FAKTURA parserlariga bu qatlam umuman aralashmaydi.
        const universal = parseUniversal(rawData);

        if (universal) {
          if (!detectedFormats.includes('UNIVERSAL')) {
            detectedFormats.push('UNIVERSAL');
          }
          for (const tx of universal.rows) {
            addTx(tx.name, tx.inn, tx.date, tx.debit, tx.credit, 'GENERIC_DOC');
          }
        } else {
          // ESKI EVRISTIKA (o'zgartirilmagan)
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
            } else {
              let foundInn = false;
              const nums: number[] = [];

              for (let c = 0; c < row.length; c++) {
                const cellStr = String(row[c]).trim();
                const possibleInn = cleanInn(cellStr);

                if (!foundInn && isValidUzbekInn(possibleInn)) {
                  targetInn = possibleInn;
                  foundInn = true;
                  targetName = String(row[c - 1] || row[c + 1] || 'Noma\'lum');
                } else if (cellStr.includes('.') && cellStr.split('.').length === 3 && cellStr.length <= 10) {
                  txDate = parseExcelDate(row[c]);
                } else {
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
    }

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      // readWorkbookSmart: bank "HTML-in-.xls" fayllarini (CBreport va h.k.)
      // to'g'ri kodirovkada (windows-1251) o'qiydi, oddiy Excel'ni avvalgidek
      const workbook = readWorkbookSmart(Buffer.from(bytes));

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rawData.length === 0) continue;
        processSheet(rawData);
      }
    }

    if (Object.keys(agg).length === 0) {
      return NextResponse.json({
        error: "Fayl ichidan yaroqli INN (STIR) va Summa ma'lumotlari topilmadi."
      }, { status: 400 });
    }

    const result = Object.values(agg).map((item) => {
      // difference > 0 => kelgan (kredit/faktura) summa to'langandan (debit) ko'p => KORXONA QARZDOR
      // difference < 0 => to'langan summa fakturadan ko'p => HISOB-FAKTURA OLISH KERAK
      item.difference = item.totalCredit - item.totalDebit;
      item.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return item;
    });

    return NextResponse.json({ success: true, data: result, detectedFormats });
  } catch (error: any) {
    console.error("EXCEL PARSE ERROR:", error);
    return NextResponse.json({ error: "Faylni o'qishda tizimli xatolik yuz berdi: " + error.message }, { status: 500 });
  }
}