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

// .env.local ni o'qish (Next.js buni o'zi qiladi, skript esa yo'q)
const ENV_FILE = path.join(PROJ, '.env.local');
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const APPLY = process.argv.includes('--apply');
const OWNER = process.argv.find((a) => a.includes('@'));

const admin = require(path.join(PROJ, 'node_modules/firebase-admin'));

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
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  return admin.firestore();
}

async function main() {
  const db = init();

  const [companies, reports, users] = await Promise.all([
    db.collection('companies').get(),
    db.collection('sverka_reports').get(),
    db.collection('allowed_users').get(),
  ]);

  const orphanCompanies = companies.docs.filter((d) => !d.data().workspaceId);
  const orphanReports = reports.docs.filter((d) => !d.data().workspaceId);

  console.log('============================================================');
  console.log(`Korxona:   ${companies.size} ta, egasiz: ${orphanCompanies.length}`);
  console.log(`Hisobot:   ${reports.size} ta, egasiz: ${orphanReports.length}`);
  console.log(`Foydalanuvchi: ${users.size} ta`);
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

  const now = admin.firestore.FieldValue.serverTimestamp();
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
