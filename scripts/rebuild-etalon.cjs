/* ============================================================
 * ETALON JUFTLIGINI TIKLASH — «IMANMAX 7 oylik»
 * ------------------------------------------------------------
 * NEGA BU FAYL BOR: `IMANMAX 7 oylik OBOROTKA.xlsx` va
 * `IMANMAX 7 oylik FAKTURA.xlsx` yo'qolgan (Downloads tozalangan).
 * Ularsiz harnessning TO'RTTA sinovi o'tkazib yuboriladi, jumladan
 * DAVR KELISHUVI — HANDOFF'dagi 3 258 650 804 so'mlik soxta farqni
 * ushlaydigan sinov.
 *
 * TIKLASH MUMKINLIGINING ISBOTI: harnessdagi `KNOWN_GAP` da ikkita
 * varaq nomi va ularning aniq kamchiligi yozib qo'yilgan:
 *     '01-06 yanvar-iyun': 3 651 343,89
 *     '07 iyul'          :   513 361,23
 * Papkada qolgan ikkita fayl AYNAN shu kamchiliklarni beradi:
 *     IMANMAX   Июн.xls / D  ->  3 651 343,89
 *     IMANMAX   Июл.xls / Д  ->    513 361,23
 * Tiyinigacha mos. Ya'ni eski 7 oylik fayl shu ikki varaqdan
 * yig'ilgan bo'lgan.
 *
 * HECH NARSA O'YLAB TOPILMAYDI: varaqlar o'z holicha ko'chiriladi,
 * birorta katak tegilmaydi. Faqat varaq NOMI `KNOWN_GAP` dagi
 * nomga qaytariladi.
 *
 *   node scripts/rebuild-etalon.cjs
 *   node scripts/rebuild-etalon.cjs "C:/boshqa/papka"
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const PROJ = path.resolve(__dirname, '..');
process.env.NODE_PATH = path.join(PROJ, 'node_modules');
require('module').Module._initPaths();
const XLSX = require(path.join(PROJ, 'node_modules/xlsx'));

const DIR = process.argv[2] || 'C:/Users/hp/Downloads/Telegram Desktop';

/** manba fayl, undagi varaq, natijadagi varaq nomi */
const PARTS = {
  OBOROTKA: [
    { file: 'IMANMAX   Июн.xls', sheet: 'D', as: '01-06 yanvar-iyun' },
    { file: 'IMANMAX   Июл.xls', sheet: 'Д', as: '07 iyul' },
  ],
  FAKTURA: [
    { file: 'IMANMAX   Июн.xls', sheet: 'Фак', as: '01-06 yanvar-iyun' },
    { file: 'IMANMAX   Июл.xls', sheet: 'Фак', as: '07 iyul' },
  ],
};

const cache = new Map();
function load(name) {
  if (!cache.has(name)) {
    const p = path.join(DIR, name);
    if (!fs.existsSync(p)) {
      console.error('MANBA TOPILMADI:', p);
      process.exit(1);
    }
    cache.set(name, XLSX.readFile(p, { raw: true }));
  }
  return cache.get(name);
}

function build(kind, outName) {
  const out = XLSX.utils.book_new();
  let total = 0;
  for (const part of PARTS[kind]) {
    const wb = load(part.file);
    const ws = wb.Sheets[part.sheet];
    if (!ws) {
      console.error(`«${part.file}» da «${part.sheet}» varag'i yo'q`);
      process.exit(1);
    }
    XLSX.utils.book_append_sheet(out, ws, part.as);
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).length;
    total += rows;
    console.log(`     «${part.file}» / ${part.sheet}  ->  varaq «${part.as}», ${rows} qator`);
  }
  const p = path.join(DIR, outName);
  XLSX.writeFile(out, p, { bookType: 'xlsx' });
  console.log(`  YOZILDI: ${outName}  (${(fs.statSync(p).size / 1024).toFixed(0)} KB, ${total} qator)`);
  console.log('');
}

console.log('ETALON JUFTLIGI TIKLANMOQDA');
console.log('  papka:', DIR);
console.log('');
build('OBOROTKA', 'IMANMAX 7 oylik OBOROTKA.xlsx');
build('FAKTURA', 'IMANMAX 7 oylik FAKTURA.xlsx');
console.log('Endi tekshiring:  node scripts/verify-parsers.cjs');
