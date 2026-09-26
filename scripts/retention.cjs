/* ============================================================
 * CHURN / QAYTIB KELISH — FAQAT O'QIYDI
 *
 * Nega bu fayl bor: qo'mita «10 ta mijozdan keyingi churn rate»
 * so'radi. Churn'ni ORQAGA QARAB hisoblab bo'lmaydi, shuning
 * uchun o'lchov foydalanuvchi ko'paymasdan OLDIN tayyor turishi
 * kerak.
 *
 * Yangi maydon yoki tracking kerak EMAS: har saqlangan sverka
 * allaqachon `workspaceId` va `savedAt` bilan yoziladi
 * (`sverka_reports`, `income_reports`).
 *
 * NIMA UCHUN OY: buxgalter sverkani HAR OY qiladi — bu oylik
 * marosim. «Qaytib keldi» degani keyingi OYDA yana sverka qilgani.
 * Haftalik o'lchov bu mahsulot uchun ma'nosiz bo'lardi.
 *
 * UCH BOSQICH, bitta raqam emas:
 *   1) RO'YXATDAN O'TDI  — hisob ochilgan
 *   2) FAOLLASHDI        — kamida BITTA sverka qilgan
 *   3) QAYTIB KELDI      — keyingi oyda YANA sverka qilgan
 * Ro'yxatdan o'tib bir marta ham sverka qilmagan odam churn EMAS,
 * bundan battar. Uni churn ichiga qo'shish raqamni YASHIRADI.
 *
 * Email va telefon NIQOBLANADI (#1, #2 ...) — natijani arizaga
 * yoki hakamga bemalol ko'chirib yuborish mumkin bo'lsin.
 *
 *   node scripts/retention.cjs
 *   node scripts/retention.cjs --show-keys   (niqobsiz, faqat o'zingiz uchun)
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const PROJ = path.resolve(__dirname, '..');
process.env.NODE_PATH = path.join(PROJ, 'node_modules');
require('module').Module._initPaths();

const SHOW_KEYS = process.argv.includes('--show-keys');

/* ------------------------------------------------------------
 * .env — qiymatlar QO'SHTIRNOQ ichida bo'lishi mumkin, olib
 * tashlanadi. FIREBASE_PRIVATE_KEY dagi `\n` HAQIQIY qatorga
 * aylantiriladi, aks holda firebase-admin kalitni o'qiy olmaydi.
 * ---------------------------------------------------------- */
function loadEnv() {
  const file = path.join(PROJ, '.env');
  if (!fs.existsSync(file)) {
    console.error("XATO: .env topilmadi:", file);
    process.exit(1);
  }
  const out = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Qo'shtirnoq BIR EMAS, bir nechta bo'lishi mumkin: shu loyihaning
    // `.env` ida FIREBASE_PRIVATE_KEY aynan `""-----BEGIN...` bilan
    // boshlanadi. Ishlab chiqarish kodi (`firebaseAdmin.ts`) faqat
    // BITTASINI olib tashlaydi — bu yerda hammasi tozalanadi, aks
    // holda PEM «DECODER routines::unsupported» bilan yiqiladi.
    while (/^["']/.test(value)) value = value.slice(1);
    while (/["']$/.test(value)) value = value.slice(0, -1);
    out[key] = value;
  }
  return out;
}

const env = loadEnv();
const NEEDED = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
for (const k of NEEDED) {
  if (!env[k]) {
    console.error(`XATO: .env da ${k} yo'q`);
    process.exit(1);
  }
}

/* firebase-admin v14 — MODULLI kirish (lib/app, lib/firestore) */
const { initializeApp, cert } = require(path.join(PROJ, 'node_modules/firebase-admin/lib/app'));
const { getFirestore } = require(path.join(PROJ, 'node_modules/firebase-admin/lib/firestore'));

const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore(app);

/* ------------------------------------------------------------ */
const ALLOWED_USERS = 'allowed_users';
const WORKSPACES = 'workspaces';
const REPORTS = ['sverka_reports', 'income_reports'];

/** Firestore Timestamp / Date / son -> Date */
function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  return null;
}

const ym = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null);

/** «2026-07» + 1 oy -> «2026-08» */
function nextMonth(m) {
  const [y, mm] = m.split('-').map(Number);
  return mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, '0')}`;
}

/** Niqob: `drk...@gmail.com` -> `#3`. Kalit hech qayerga chiqmaydi. */
function masker() {
  const seen = new Map();
  return (key) => {
    if (SHOW_KEYS) return key;
    if (!seen.has(key)) seen.set(key, `#${seen.size + 1}`);
    return seen.get(key);
  };
}

/** Demo/sinov hisoblari sanoqni bo'yab ko'rsatadi — chiqariladi. */
const DEMO_RE = /^(demo|test|webleaders\.uz@gmail\.com)/i;

async function main() {
  console.log('============================================================');
  console.log('CHURN / QAYTIB KELISH   (faqat o\'qildi, hech narsa yozilmadi)');
  console.log('============================================================');

  /* --- 1) Foydalanuvchilar --- */
  const usersSnap = await db.collection(ALLOWED_USERS).get();
  const users = [];
  for (const doc of usersSnap.docs) {
    const d = doc.data() || {};
    users.push({
      key: doc.id,
      workspaceId: d.workspaceId || null,
      createdAt: toDate(d.createdAt),
      status: d.status || '',
      isPhone: !d.email && !!d.phone,
      demo: DEMO_RE.test(doc.id),
    });
  }

  /* --- 2) Ish maydoni -> egasi (allowed_users da workspaceId
         bo'lmasa, workspaces.ownerEmail dan tiklanadi) --- */
  const wsOwner = new Map();
  const wsSnap = await db.collection(WORKSPACES).get();
  for (const doc of wsSnap.docs) {
    const d = doc.data() || {};
    if (d.ownerEmail) wsOwner.set(doc.id, d.ownerEmail);
  }
  for (const u of users) {
    if (!u.workspaceId) {
      for (const [wid, owner] of wsOwner) if (owner === u.key) u.workspaceId = wid;
    }
  }

  /* --- 3) Sverkalar: ish maydoni -> faol oylar --- */
  const monthsOf = new Map(); // workspaceId -> Set<'YYYY-MM'>
  const countOf = new Map();  // workspaceId -> son
  let reportTotal = 0;

  for (const coll of REPORTS) {
    const snap = await db.collection(coll).get();
    for (const doc of snap.docs) {
      const d = doc.data() || {};
      const wid = d.workspaceId;
      const when = ym(toDate(d.savedAt));
      if (!wid || !when) continue;
      reportTotal++;
      if (!monthsOf.has(wid)) monthsOf.set(wid, new Set());
      monthsOf.get(wid).add(when);
      countOf.set(wid, (countOf.get(wid) || 0) + 1);
    }
  }

  /* --- 4) Voronka --- */
  const real = users.filter((u) => !u.demo);
  const demoCount = users.length - real.length;

  for (const u of real) {
    const set = u.workspaceId ? monthsOf.get(u.workspaceId) : null;
    u.months = set ? [...set].sort() : [];
    u.reports = (u.workspaceId && countOf.get(u.workspaceId)) || 0;
    u.activated = u.months.length > 0;
    // Qaytib kelgan = faol oyidan KEYINGI oyda ham sverka qilgan
    u.returned = u.months.some((m) => u.months.includes(nextMonth(m)));
  }

  const activated = real.filter((u) => u.activated);
  const returned = real.filter((u) => u.returned);

  const pct = (a, b) => (b === 0 ? '—' : `${Math.round((a / b) * 100)}%`);

  console.log('');
  console.log('VORONKA');
  console.log(`  1. Ro'yxatdan o'tdi     : ${real.length}` + (demoCount ? `   (+${demoCount} demo/sinov — sanoqdan chiqarildi)` : ''));
  console.log(`  2. Faollashdi           : ${activated.length}   ${pct(activated.length, real.length)}`);
  console.log(`  3. Keyingi oyda qaytdi  : ${returned.length}   ${pct(returned.length, activated.length)} (faollashganlardan)`);
  console.log('');
  console.log(`  Jami saqlangan sverka   : ${reportTotal}`);

  if (activated.length > 0) {
    const churn = activated.length - returned.length;
    console.log('');
    console.log(`  CHURN = ${churn} / ${activated.length} = ${pct(churn, activated.length)}`);
    console.log('  (faollashgan, lekin keyingi oyda qaytmagan)');
  }

  /* --- 5) Kogortalar --- */
  console.log('');
  console.log("KOGORTA — birinchi sverka oyi bo'yicha");
  const cohorts = new Map();
  for (const u of activated) {
    const first = u.months[0];
    if (!cohorts.has(first)) cohorts.set(first, []);
    cohorts.get(first).push(u);
  }
  if (cohorts.size === 0) {
    console.log('  (hali bironta ham sverka saqlanmagan)');
  } else {
    for (const m of [...cohorts.keys()].sort()) {
      const list = cohorts.get(m);
      const back = list.filter((u) => u.months.includes(nextMonth(m)));
      console.log(`  ${m}   ${String(list.length).padStart(3)} ta  ->  keyingi oyda ${back.length} ta qaytdi   ${pct(back.length, list.length)}`);
    }
  }

  /* --- 6) Har bir foydalanuvchi ---
     4 ta odamda FOIZ yolg'on gapiradi: «50% churn» aslida
     «ikkitadan bittasi» degani. Xom jadval haqiqatni aytadi. */
  console.log('');
  console.log('HAR BIR FOYDALANUVCHI');
  const mask = masker();
  const sorted = [...real].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  for (const u of sorted) {
    const holat = !u.activated ? 'FAOLLASHMAGAN' : u.returned ? 'QAYTIB KELDI' : 'BIR MARTALIK';
    console.log(
      `  ${mask(u.key).padEnd(SHOW_KEYS ? 34 : 5)}` +
      `  ro'yxat ${(ym(u.createdAt) || '—').padEnd(8)}` +
      `  ${u.isPhone ? 'telefon' : 'email  '}` +
      `  sverka ${String(u.reports).padStart(3)}` +
      `  faol oylar: ${(u.months.join(', ') || '—').padEnd(26)}` +
      `  ${holat}`
    );
  }

  /* --- 7) Kirish usuli — login o'zgarishi uchun muhim --- */
  const byPhone = real.filter((u) => u.isPhone).length;
  console.log('');
  console.log('KIRISH USULI (login o\'zgartirilsa kimlar yo\'qotiladi)');
  console.log(`  telefon bilan : ${byPhone}`);
  console.log(`  email bilan   : ${real.length - byPhone}`);
  if (real.length - byPhone > 0) {
    console.log("  DIQQAT: email bilan ochilgan hisoblarning KALITI — o'sha email.");
    console.log("  Kirish faqat telefonga o'tkazilsa, ular hisobiga KIRA OLMAYDI.");
  }

  console.log('');
  console.log('============================================================');
  if (!SHOW_KEYS) console.log("Kalitlar niqoblandi. Niqobsiz: node scripts/retention.cjs --show-keys");
}

main().catch((e) => {
  console.error('XATO:', e && e.message ? e.message : e);
  process.exit(1);
});
