import * as XLSX from 'xlsx';
import iconv from 'iconv-lite';

// ============================================================
// Ba'zi banklar (ABS/IABS eksportlari, masalan CBreport21) .xls
// deb aslida HTML fayl beradi va unda charset=windows-1251 turadi.
// XLSX kutubxonasi bunday faylni UTF-8 deb o'qib, kirill matnini
// butunlay buzib yuboradi (����). Bu yerda faylning haqiqiy turi
// aniqlanadi va HTML bo'lsa to'g'ri kodirovkada dekodlanadi.
// Haqiqiy Excel (BIFF/XLSX) fayllar avvalgidek o'qiladi.
// ============================================================
export function readWorkbookSmart(buffer: Buffer): XLSX.WorkBook {
  const head = buffer.subarray(0, 2048).toString('latin1');
  const trimmed = head.trimStart().toLowerCase();
  const isHtml =
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<table') ||
    trimmed.startsWith('<head') ||
    trimmed.startsWith('<meta');

  if (isHtml) {
    const charsetMatch = head.match(/charset\s*=\s*["']?([\w-]+)/i);
    let charset = charsetMatch ? charsetMatch[1].toLowerCase() : 'windows-1251';
    if (!iconv.encodingExists(charset)) charset = 'windows-1251';
    const html = iconv.decode(buffer, charset);
    return XLSX.read(html, { type: 'string', cellDates: false });
  }

  return XLSX.read(buffer, { type: 'buffer', cellDates: false });
}
