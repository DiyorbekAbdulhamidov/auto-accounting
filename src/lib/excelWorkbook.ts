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
// Matnli fayl (CSV) qaysi kodlashda? Kirill matni UTF-8 da 2 baytli
// ketma-ketlik bo'ladi; windows-1251 da esa yakka bayt (0xC0-0xFF).
function sniffTextCharset(buffer: Buffer): string {
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return 'utf-8';
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return 'utf-16le';
  if (buffer[0] === 0xfe && buffer[1] === 0xff) return 'utf-16be';

  const sample = buffer.subarray(0, 8192);
  let utf8Pairs = 0;
  let highBytes = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    if (b < 0x80) continue;
    highBytes++;
    // Kirill UTF-8 da: 0xD0/0xD1 + 0x80..0xBF
    if ((b === 0xd0 || b === 0xd1) && i + 1 < sample.length && sample[i + 1] >= 0x80 && sample[i + 1] <= 0xbf) {
      utf8Pairs++;
      i++;
    }
  }
  if (highBytes === 0) return 'utf-8';
  return utf8Pairs / highBytes > 0.6 ? 'utf-8' : 'windows-1251';
}

/** Fayl turini imzosi bo'yicha aniqlaydi: haqiqiy Excel (BIFF/XLSX),
 *  «.xls» deb nomlangan HTML, yoki oddiy matn (CSV). Excel versiyasi
 *  (2003 / 2007+ / LibreOffice) ahamiyatsiz - hammasi XLSX kutubxonasi
 *  orqali bir xil ko'rinishga keltiriladi. */
export function readWorkbookSmart(buffer: Buffer): XLSX.WorkBook {
  const head = buffer.subarray(0, 2048).toString('latin1');
  const trimmed = head.trimStart().toLowerCase();
  const isHtml =
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<table') ||
    trimmed.startsWith('<head') ||
    trimmed.startsWith('<meta') ||
    trimmed.startsWith('<?xml') && trimmed.includes('<table');

  // XLSX (ZIP) = "PK", eski XLS (OLE2) = D0 CF 11 E0
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const isOle = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

  if (isHtml) {
    const charsetMatch = head.match(/charset\s*=\s*["']?([\w-]+)/i);
    let charset = charsetMatch ? charsetMatch[1].toLowerCase() : 'windows-1251';
    if (!iconv.encodingExists(charset)) charset = 'windows-1251';
    // Uzsanoatqurilishbank (IABS) shapkani "</ht>" bilan yopadi - bu yaroqsiz
    // teg, natijada ikkita shapka katagi bittaga yopishib qoladi va shapka
    // ma'lumot ustunlaridan bitta chapga suriladi.
    const html = iconv
      .decode(buffer, charset)
      .replace(/<\/ht>/gi, '</th>')
      // Raqamli HTML-belgilar (&#171; = «). XLSX faqat nomli belgilarni
      // ochadi, natijada firma nomi «SUPER HOUSE ROOF» o'rniga
      // &#171;SUPER HOUSE ROOF&#187; bo'lib qolardi. Markup belgilariga
      // (&, <, >) tegilmaydi - aks holda teglar buzilishi mumkin.
      .replace(/&#(\d{2,5});/g, (m, d: string) => {
        const code = Number(d);
        if (code === 38 || code === 60 || code === 62) return m;
        return code > 0 && code < 0x10000 ? String.fromCharCode(code) : m;
      });
    // raw: XLSX "01.07.2026" ni AQSH tartibida (7-yanvar) sana deb o'qib
    // yuboradi - kun 12 dan kichik bo'lgan har bir o'tkazma noto'g'ri oyga
    // tushadi. Xom matn qoldirilib, sana o'z parserimizda o'qiladi.
    return XLSX.read(html, { type: 'string', cellDates: false, raw: true });
  }

  if (!isZip && !isOle) {
    // CSV / matnli eksport. Kirill CSV'lar ko'pincha windows-1251 da
    // keladi va UTF-8 deb o'qilsa firma nomlari «????» bo'lib qoladi.
    const charset = sniffTextCharset(buffer);
    const csvText = iconv.decode(buffer, iconv.encodingExists(charset) ? charset : 'utf-8');
    // Ajratkich (`,` `;` yoki tab) XLSX tomonidan o'zi aniqlanadi
    return XLSX.read(csvText, { type: 'string', cellDates: false, raw: true });
  }

  return XLSX.read(buffer, { type: 'buffer', cellDates: false });
}
