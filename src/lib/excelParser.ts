import * as XLSX from 'xlsx';

// Excel sanasini JS Date ob'ektiga o'tkazish
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

// Avtomatik kategoriya aniqlash mantig'i
export function detectCategory(purpose: string, counterparty: string): string {
  const p = purpose.toLowerCase();
  const c = counterparty.toLowerCase();

  if (p.includes('комиссия') || p.includes('абонплата') || p.includes('sms')) {
    return 'BANK_FEES';
  }
  if (p.includes('солиқ') || p.includes('солик') || c.includes('дси') || c.includes('казначейство')) {
    return 'TAX';
  }
  if (p.includes('выручка') || p.includes('pos') || p.includes('humo') || p.includes('uzcard')) {
    return 'REVENUE';
  }
  return 'SUPPLIER';
}

// 1. HAMKORBANK Parser
export function parseHamkorbank(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Ma'lumotlarni massiv ko'rinishida olamiz (shapkani hisobga olib 5-qatordan)
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 4 });

  return rawData.map(row => {
    if (!row[0] || String(row[0]).includes('Итого')) return null;

    const accountInfo = String(row[1] || '').split('/');
    const cInn = accountInfo[1] || '';
    const cName = accountInfo[2] || '';
    const txDate = parseExcelDate(Number(row[0]));

    return {
      txDate,
      counterpartyName: cName,
      counterpartyInn: cInn,
      debitAmount: Number(row[2]) || 0.0,
      creditAmount: Number(row[3]) || 0.0,
      purpose: row[4] || '',
      category: detectCategory(row[4] || '', cName),
      periodMonth: txDate.getMonth() + 1,
      periodYear: txDate.getFullYear()
    };
  }).filter(Boolean);
}