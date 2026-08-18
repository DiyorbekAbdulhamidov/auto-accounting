/* ============================================================
 * ISH MAYDONI MIGRATSIYASI
 *
 * Nega kerak: 2026-08-13 gacha `companies` va `sverka_reports`
 * hujjatlarida EGA yo'q edi. Yangi Firestore qoidalari egasiz
 * hujjatni KO'RSATMAYDI — ya'ni qoidalarni deploy qilishdan oldin
 * mavjud ma'lumotga `workspaceId` qo'yilishi shart, aks holda
 * eski hisobotlar «yo'qolgandek» bo'lib qoladi.
 *
 * Skript XAVFSIZ:
 *   - standart holatda faqat KO'RSATADI, hech narsa yozmaydi
 *   - `workspaceId` allaqachon bor hujjatga tegmaydi (qayta ishga
 *     tushirsa bo'ladi)
 *   - ma'lumot bo'lmasa hech narsa qilmaydi
 *
 * Ishlatish:
 *   node scripts/migrate-workspaces.cjs                     — ko'rish
 *   node scripts/migrate-workspaces.cjs --apply egam@mail.uz — yozish
 *
 * Muhit o'zgaruvchilari (.env.local dagi bilan bir xil):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const PROJ = path.resolve(__dirname, '..');
process.env.NODE_PATH = path.join(PROJ, 'node_modules');
require('module').Module._initPaths();

// Muhit faylini o'qish (Next.js buni o'zi qiladi, skript esa yo'q).
//
// IKKI nom sinaladi. Ilgari faqat `.env.local` o'qilardi, loyihada esa
// `.env` bor edi — skript «Muhit o'zgaruvchilari yo'q» deb yiqilardi va
// migratsiyani UMUMAN ishga tushirib bo'lmasdi. Birinchi topilgan
// qiymat qoladi (`.env.local` mahalliy ustunlikka ega).
for (const name of ['.env.local', '.env']) {
  const file = path.join(PROJ, name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const APPLY = process.argv.includes('--apply');
const OWNER = process.argv.find((a) => a.includes('@'));

// firebase-admin v14 da eski `admin.credential.cert` API YO'Q — faqat
// modulli kirish nuqtalari bor. Skript eski API'ga yozilgani uchun
// o'rnatilgan versiya bilan HECH QACHON ishlamagan
// («Cannot read properties of undefined (reading 'cert')»).
const { initializeApp, cert, getApps } = require(
  path.join(PROJ, 'node_modules/firebase-admin/lib/app')
);
const { getFirestore, FieldValue } = require(
  path.join(PROJ, 'node_modules/firebase-admin/lib/firestore')
);

function init() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const missing = [
    !projectId && 'FIREBASE_PROJECT_ID',
    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
    !privateKey && 'FIREBASE_PRIVATE_KEY',
  ].filter(Boolean);
  if (missing.length) {
    console.error("Muhit o'zgaruvchilari yo'q: " + missing.join(', '));
    process.exit(1);
  }
  privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = init();

  const [companies, reports, users, income, balances] = await Promise.all([
    db.collection('companies').get(),
    db.collection('sverka_reports').get(),
    db.collection('allowed_users').get(),
    // Bular 2026-08-18 da qo'shilgan. Qoidalar deploy qilinmagani uchun
    // klient ularga yoza olmagan, ya'ni bo'sh bo'lishi KERAK. «Kerak»
    // yetarli emas — SANALADI: egasiz hujjat bo'lsa, deploy'dan keyin u
    // jimgina yo'qoladi.
    db.collection('income_reports').get(),
    db.collection('opening_balances').get(),
  ]);

  const orphan = (snap) => snap.docs.filter((d) => !d.data().workspaceId);
  const orphanCompanies = orphan(companies);
  const orphanReports = [...orphan(reports), ...orphan(income), ...orphan(balances)];

  /** Mavjud `workspaceId` qiymatlari — EGA kim ekanini TAXMIN emas,
   *  ma'lumotning o'zi aytadi. Ikki foydalanuvchi bo'lganda bu yagona
   *  ishonchli dalil. */
  const tally = (snap) => {
    const m = new Map();
    for (const d of snap.docs) {
      const w = d.data().workspaceId || "(yo'q)";
      m.set(w, (m.get(w) || 0) + 1);
    }
    return [...m].map(([k, v]) => `${k}: ${v}`).join('  ·  ') || '—';
  };

  console.log('============================================================');
  console.log(`Korxona:             ${companies.size} ta, egasiz: ${orphanCompanies.length}`);
  console.log(`   ${tally(companies)}`);
  console.log(`Chiqim hisoboti:     ${reports.size} ta, egasiz: ${orphan(reports).length}`);
  console.log(`   ${tally(reports)}`);
  console.log(`Kirim hisoboti:      ${income.size} ta, egasiz: ${orphan(income).length}`);
  console.log(`Boshlang'ich qoldiq: ${balances.size} ta, egasiz: ${orphan(balances).length}`);
  console.log(`Foydalanuvchi:       ${users.size} ta`);
  for (const d of users.docs) {
    const u = d.data();
    console.log(`   ${d.id}  role=${u.role || 'user'}  status=${u.status || 'active'}  workspaceId=${u.workspaceId || "(yo'q)"}`);
  }
  console.log('============================================================');

  if (orphanCompanies.length === 0 && orphanReports.length === 0) {
    console.log("Egasiz hujjat yo'q — migratsiya kerak emas.");
    return;
  }

  // Ega kim? Buyruq qatorida berilmasa, yagona foydalanuvchi bo'lsa o'sha.
  let owner = OWNER;
  if (!owner) {
    const emails = users.docs.map((d) => d.id);
    if (emails.length === 1) owner = emails[0];
  }
  if (!owner) {
    console.log('\nEgani ko\'rsating: node scripts/migrate-workspaces.cjs --apply egam@mail.uz');
    console.log('Mavjud foydalanuvchilar: ' + users.docs.map((d) => d.id).join(', '));
    return;
  }

  console.log(`\nEga: ${owner}`);
  console.log(`Ish maydoni: ${owner}`);
  for (const d of orphanCompanies.slice(0, 10)) {
    console.log(`  korxona  ${d.id}  ${d.data().name || ''}`);
  }
  if (orphanCompanies.length > 10) console.log(`  ... yana ${orphanCompanies.length - 10} ta`);

  if (!APPLY) {
    console.log('\n[KO\'RISH REJIMI] Hech narsa yozilmadi.');
    console.log(`Yozish uchun: node scripts/migrate-workspaces.cjs --apply ${owner}`);
    return;
  }

  const now = FieldValue.serverTimestamp();
  const workspaceId = owner;

  await db.collection('workspaces').doc(workspaceId).set(
    {
      name: (owner.split('@')[0] || 'Ish maydoni').replace(/^./, (c) => c.toUpperCase()),
      ownerEmail: owner,
      createdAt: now,
      plan: 'free',
    },
    { merge: true }
  );
  await db.collection('workspaces').doc(workspaceId)
    .collection('members').doc(owner)
    .set({ role: 'owner', status: 'active', addedAt: now }, { merge: true });
  await db.collection('allowed_users').doc(owner).set({ workspaceId }, { merge: true });

  let written = 0;
  const CHUNK = 400;
  const all = [...orphanCompanies, ...orphanReports];
  for (let i = 0; i < all.length; i += CHUNK) {
    const batch = db.batch();
    for (const d of all.slice(i, i + CHUNK)) {
      batch.set(d.ref, { workspaceId }, { merge: true });
      written++;
    }
    await batch.commit();
  }

  console.log(`\nBAJARILDI: ${written} ta hujjatga workspaceId qo'yildi.`);
  console.log('Endi qoidalarni deploy qiling: firebase deploy --only firestore:rules');
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('XATO:', e && e.message ? e.message : e);
    process.exit(1);
  }
);
