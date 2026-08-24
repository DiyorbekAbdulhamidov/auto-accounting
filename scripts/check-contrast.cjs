// ============================================================
// КОНТРАСТ ТЕКШИРУВИ — brauzersiz, WCAG 2.1
// ------------------------------------------------------------
// NEGA KERAK. Rang tokenlari o'zgarganda «ko'zga chiroyli
// ko'rinadi» degan gap dalil emas: matn kontrasti 4,5 dan
// tushsa, buxgalter jadvaldagi raqamni yomon o'qiy boshlaydi va
// buni HECH KIM aytmaydi — u shunchaki charchaydi.
//
// Brauzer paneli yopiq bo'lsa ekran surati olinmaydi, ya'ni
// rangni «ko'rib» tekshirib bo'lmaydi. Bu skript esa `globals.css`
// dagi токенларни ЎҚИЙДИ ва нисбатни ҲИСОБЛАЙДИ — панель очиқми,
// йўқми, аҳамияти йўқ.
//
// Ishga tushirish:  node scripts/check-contrast.cjs
// ============================================================
'use strict';

const fs = require('fs');
const path = require('path');

const CSS = path.join(__dirname, '..', 'src', 'app', 'globals.css');

/** `--token: #rrggbb;` larni bitta blokdan yig'adi */
function readBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Blok topilmadi: ${selector}`);
  const open = css.indexOf('{', start);
  // Blok ichida ichma-ich qavs yo'q — birinchi `}` yetarli
  const end = css.indexOf('\n}', open);
  const body = css.slice(open, end);
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|var\(--[a-z0-9-]+\))\s*;/g;
  let m;
  while ((m = re.exec(body))) out[m[1]] = m[2];
  // Bir pog'onali `var(--x)` havolasi ochiladi: `--accent: var(--brand-out)`
  for (const k of Object.keys(out)) {
    const v = out[k];
    const ref = /^var\(--([a-z0-9-]+)\)$/.exec(v);
    if (ref) out[k] = out[ref[1]] || null;
    if (!out[k]) delete out[k];
  }
  return out;
}

function toRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** WCAG 2.1 nisbiy yorqinlik */
function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* ------------------------------------------------------------
   TEKSHIRILADIGAN JUFTLIKLAR
   ------------------------------------------------------------
   `min` — WCAG chegarasi:
     4.5 — oddiy matn (14px, 16px)
     3.0 — yirik matn (24px+ yoki 18px qalin) va CHEGARA chizig'i
   ------------------------------------------------------------ */
const PAIRS = [
  // Asosiy matn — uchala sirtda ham
  ['ink', 'page', 4.5], ['ink', 'surface', 4.5], ['ink', 'surface-2', 4.5],
  ['ink-2', 'page', 4.5], ['ink-2', 'surface', 4.5], ['ink-2', 'surface-2', 4.5],
  ['ink-3', 'page', 4.5], ['ink-3', 'surface', 4.5], ['ink-3', 'surface-2', 4.5],

  // Ma'lumot ranglari — raqam ustunlari
  ['cash', 'surface', 4.5], ['cash', 'surface-2', 4.5],
  ['invoice', 'surface', 4.5], ['invoice', 'surface-2', 4.5],
  ['ok', 'surface', 4.5], ['warn', 'surface', 4.5],
  ['bad', 'surface', 4.5], ['info', 'surface', 4.5],
  ['ok', 'surface-2', 4.5], ['warn', 'surface-2', 4.5],
  ['bad', 'surface-2', 4.5], ['info', 'surface-2', 4.5],

  // Yumshoq fonli belgilar
  ['ok', 'ok-soft', 4.5], ['warn', 'warn-soft', 4.5],
  ['bad', 'bad-soft', 4.5], ['info', 'info-soft', 4.5],
  ['accent-ink', 'accent-soft', 4.5], ['accent-ink', 'surface', 4.5],
  ['mark', 'mark-soft', 4.5],

  // To'ldirilgan belgi ustidagi yozuv
  ['fill-fg', 'ok', 4.5], ['fill-fg', 'bad', 4.5],
  ['fill-fg', 'warn', 4.5], ['fill-fg', 'info', 4.5],
  ['accent-fg', 'accent', 4.5],
  ['mark-fg', 'mark', 4.5],

  // Chegara — matn emas, shuning uchun 3.0
  ['line-strong', 'surface', 1.4],
];

function run(name, tokens, base) {
  const get = (k) => tokens[k] || base[k];
  let bad = 0;
  const rows = [];
  for (const [fg, bg, min] of PAIRS) {
    const f = get(fg);
    const b = get(bg);
    if (!f || !b) {
      rows.push(['?', fg, bg, 'TOKEN YO\'Q']);
      bad++;
      continue;
    }
    const r = ratio(f, b);
    const ok = r >= min;
    if (!ok) bad++;
    rows.push([ok ? 'ok' : 'XATO', fg, bg, `${r.toFixed(2)} (kerak ${min})`]);
  }
  console.log(`\n--- ${name} ---`);
  for (const [st, fg, bg, val] of rows) {
    if (st !== 'ok') console.log(`  ${st.padEnd(5)} ${fg} / ${bg}: ${val}`);
  }
  console.log(`  ${rows.length - bad}/${rows.length} o'tdi`);
  return bad;
}

const css = fs.readFileSync(CSS, 'utf8');
const light = readBlock(css, ':root {');
const dark = readBlock(css, '.dark {');

const bad = run('YORUG\'', light, light) + run('TUNGI', dark, light);

console.log('\n============================================================');
if (bad === 0) {
  console.log("HAMMASI O'TDI ✔   (kontrast, WCAG 2.1)");
  process.exit(0);
}
console.log(`YIQILDI ✖   ${bad} ta juftlik chegaradan past`);
process.exit(1);
