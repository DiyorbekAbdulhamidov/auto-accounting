# KEYINGI CHAT UCHUN PROMPT

> Shu faylning MAZMUNINI yangi chatga to'liq nusxala. U 2026-08-18
> sessiyasining IKKINCHI qismi oxirida yozilgan va o'sha kundagi
> HAQIQIY holatni aks ettiradi (taxmin emas — hammasi o'lchangan).

---

Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** (moslik.uz) — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

═══════════════════════════════════════════════════════════
0. AVVAL SHULARNI QIL — TARTIB BILAN
═══════════════════════════════════════════════════════════

1. Shu uchta faylni TO'LIQ o'qi:
   - `HANDOFF.md` — texnik holat. **§17, §18 eng yangisi.**
   - `MAHSULOT-QARORLARI.md` — nom, atamalar, UI rejasi, bozor, narx
   - `docs/TAHLIL-2026-08-18.md` — dunyo tajribasi bilan solishtirish,
     kamchiliklar ro'yxati (dalil bilan), tayyorlik bahosi

2. Tekshiruvlarni ishga tushir va natijani solishtir:
   ```
   node scripts/verify-parsers.cjs   ->  124/124 o'tishi SHART
   npx tsc --noEmit                  ->  toza
   npx eslint src --max-warnings=0   ->  toza
   npx next build                    ->  xatosiz, 41 marshrut
   ```
   Bittasi ham yiqilsa — MENGA AYT, o'zing "tuzatib" ketma.

3. `git log --oneline -1` → `49d92e7 "a numerous changes"`.
   **Undan keyingi HAMMA ish commit qilinmagan.**

═══════════════════════════════════════════════════════════
1. ✅ QOIDALAR DEPLOY QILINDI — bu endi bloker EMAS
═══════════════════════════════════════════════════════════

2026-08-18 da bajarildi (HANDOFF §17d):

- `.firebaserc` yaratildi — yo'q edi, CLI loyihani bilmasdi
- `firebase login --reauth` — token 2023-yildan buzuq edi
- migratsiya: 3 ta egasiz hujjatga `workspaceId` qo'yildi (egasiz → 0)
- `firebase deploy --only firestore:rules` → `released rules`,
  ogohlantirishsiz

Jonli qoidalar endi repo fayliga TENG. Ilgari jonli bazada egalik
UMUMAN yo'q edi (har bir foydalanuvchi hammasini ko'rardi) —
shu ham yopildi.

Qoidalarga yana tegsang, tartib O'ZGARMAYDI: mavjud ma'lumotga yangi
maydon kerak bo'lsa AVVAL migratsiya, keyin deploy. `counterparty_merges`
uchun qoida kerak emas (Admin SDK orqali ishlaydi).

═══════════════════════════════════════════════════════════
2. BLOKER — O'ZGARMADI
═══════════════════════════════════════════════════════════

**Login ortidagi hech narsa jonli Firestore'da hech qachon
sinalmagan.** Kod to'g'ri, lekin bitta ham haqiqiy yozuv-o'qish
qilinmagan.

Sinov ro'yxati (yangilangan):
- test email bilan ro'yxatdan o'tish → ish maydoni yaralyaptimi
- 4-korxona qo'shishga urinish → cheklov + «Кўпроқ керак»
- ikkinchi akkaunt: birinchisining korxonasi KO'RINMASLIGI
- chiqim/kirim sverkasini saqlash → qayta ochilganda tiklanadimi
- **hisobot tarixi**: ikki marta saqla → ro'yxatda ikkita chiqadimi,
  eskisini ochish va O'CHIRISH ishlaydimi
- **korxonani o'chirish** — ilgari admin bo'lmaganda yiqilardi
- boshlang'ich qoldiq kiritish → saqlanadimi, aktga tushadimi
- **birlashtirish**: ikki qatorni qo'sh → yig'indi o'zgarmasligi,
  qayta yuklaganda ham birlashgan turishi
- **jamoa**: email taklif qil → o'sha email bilan ro'yxatdan o't →
  YANGI ish maydoni OCHILMASLIGI, birinchisining mijozlari ko'rinishi
- a'zoni chiqar → u endi ko'rmasligi

Shu sinovsiz: video yozib bo'lmaydi, mijozga berib bo'lmaydi.

═══════════════════════════════════════════════════════════
3. 2026-08-18 DA NIMA QILINDI
═══════════════════════════════════════════════════════════

### Birinchi qism (HANDOFF §15, §16)

- Kod nomlari inglizchaga o'tkazildi
- **Davr kelishuvi tekshiruvi** — 1 oylik ko'chirma + 7 oylik faktura
  = 3 258 650 804 so'mlik soxta farq, ogohlantirishsiz. Tuzatildi.
- Aktdagi soxta `Сальдо начальное = 0`
- Yuklash cheklovi (15 MB × 20 fayl), 13 ta `alert()` → `sonner`
- Kirim sverkasi SAQLANADI · boshlang'ich qoldiq · yopilmagan faktura
  · chiqimda Akt sverki · mijozlar ro'yxatida holat ustuni

### Ikkinchi qism (HANDOFF §17)

| Ish | Qayerda |
|---|---|
| Hisobot tarixi (ochish/o'chirish, qo'shimcha so'rovsiz) | §17a |
| Chiqimda «Сақланган ҳисобот» belgisi (yo'q edi) | §17a |
| Qoida: hisobot `delete` a'zoga — korxona o'chirish yiqilardi | §17a |
| Kontragentlarni birlashtirish (+taklif) | §17b |
| Ish maydoniga a'zo taklif qilish («Бюро» sotib bo'lmasdi) | §17c |

**Birlashtirishda o'z kodimda jimgina xato topildi va tuzatildi:**
birlashgan qator toifasini guruhning BIRINCHI qatoridan olardi —
«kommunal» a'zo butun guruhni asosiy sverkadan chiqarib yuborishi
mumkin edi. Endi nom/STIR/TOIFA har doim ASOSIY qatordan.

### RAD ETILGAN g'oya — takrorlama

Yig'ma «natija paneli» yasaldi, o'lchandi va OLIB TASHLANDI: yangi
ma'lumot bermadi, faqat qatlam qo'shdi (HANDOFF §14).

**Qoida:** yangi UI taklif qilishdan oldin savol — *bu qadam
qo'shyaptimi yoki olyaptimi?*

═══════════════════════════════════════════════════════════
4. KEYINGI ISHLAR — MUHIMLIK TARTIBIDA
═══════════════════════════════════════════════════════════

1. **Firebase Console: telefon autentifikatsiyasini yoqish** —
   HANDOFF §18c oxiridagi 5 ta band. Kod tayyor, Console'siz SMS
   ketmaydi. Sinovni «Test phone numbers» bilan qiling, haqiqiy
   raqamga kod yubormang.
2. **Firebase Blaze rejasi** — Spark'da haqiqiy SMS UMUMAN
   yuborilmaydi (`auth/billing-not-enabled`). Sinov raqamlari
   ishlayveradi, ya'ni ishlab chiqish uchun kerak emas; haqiqiy
   foydalanuvchi uchun SHART. Yoqilganda byudjet ogohlantirishi
   qo'yilsin.
3. **Domen + Vercel'ga deploy.** Ilova hech qayerga deploy qilinmagan
   (`vercel.json` yo'q) — 1 sentabr uchun eng katta xavf, chunki bu
   qadamlarning ko'pi kod EMAS.
4. **Jonli Firestore sinovi** (2-bo'lim) — BLOKER.
4. **Narx sahifasi matni:** bepul davrda cheklov CHEKSIZ, lekin
   sahifada hali «3 та корхона» turadi (`limitsOf` faqat cheklovni
   qo'llaydi, marketing `PLANS` ni o'qiydi).
5. **10 ta haqiqiy buxgalterga berish.** O'lchov: nechtasi IKKINCHI
   oyda ham qaytadi. Mezon: MAHSULOT-QARORLARI §8.3.
6. Ekran testlari — loyihada test yuruvchisining O'ZI ham yo'q
   (parser harness bor, React komponentlari qoplanmagan)
7. ~~Parol tiklash~~ — BEKOR: SMS bilan kirishda parol yo'q
5. `api.faktura.uz` bilan bog'lanish (MAHSULOT-QARORLARI §8.3)
6. Notanish formatni 3 namuna qator bilan tasdiqlatish
7. Birlashtirishni AJRATISH hozir faylni qayta yuklashni talab qiladi
   — kerak bo'lsa asl qatorlarni saqlash o'ylab ko'riladi

═══════════════════════════════════════════════════════════
5. BUZILMAYDIGAN QOIDALAR
═══════════════════════════════════════════════════════════

- Bu **Next.js 16** — API'lar sening bilimingdan farq qiladi. Kod
  yozishdan OLDIN `node_modules/next/dist/docs/` ni o'qi.
- `src/lib/` dagi kirill matnlarga TEGILMAYDI — ular parser kalit
  so'zlari (`ИТОГО`, `Остаток на начало периода`, `ПАССИВ`).
- «Акт сверки» bloki (Дебет/Кредит/Сальдо) — rasmiy hujjat shakli,
  etalon PDF bilan qatorma-qator mos kelishi shart.
- Raqamni "to'g'rilash" uchun qo'lda tuzatma QO'SHILMAYDI — sabab
  topiladi.
- **«Фарқ» = debet − kredit**, ikkala sverkada. Boshlang'ich qoldiq
  bu raqamga QO'SHILMAYDI — alohida ustunda (HANDOFF §16b).
- **Birlashtirish PUL YO'QOTMAYDI.** Yig'indi o'zgarsa — bu
  "to'g'rilash" emas, ma'lumotni buzish. Harness shuni tekshiradi.
- **Parser (`auditFiles`/`analyzeIncome`) ga TEGILMAYDI.** Yangi
  mantiq undan KEYIN, alohida qadam bo'lib qo'shiladi — shunda 93 ta
  regress tekshiruvi kuchda qoladi.
- Ikki rang o'qi aralashtirilmaydi: modul rangi (`--accent`) faqat
  tugma/tab/fokus; ma'lumot rangi (`--cash`/`--invoice`/`--ok`/
  `--warn`/`--bad`) moduldan mustaqil.
- `t()` kaliti = KIRILL matnning O'ZI. Yangi matn qo'shsang, `ru` va
  `en` tarjimasini ham `dictionary.ts` ga qo'sh. **Dublikat kalit
  `tsc` ni yiqitadi** — qo'shishdan oldin `grep -n "^  '<matn>':"`.
- Havola qo'lda yozilmaydi: `path("pricing", locale)` /
  `clientPath(id, locale)`.
- SEO matnlari (`src/lib/seo.ts`) `t()` dan O'TMAYDI — har til uchun qo'lda.
- FAQ bitta manbadan: `src/lib/faq.ts`.
- **Firestore'da saqlanadigan qiymatlar migratsiyasiz
  o'zgartirilmaydi** — ro'yxati HANDOFF §15 oxirida.
- Har o'zgarishdan keyin: `verify-parsers` → `tsc` → `eslint` → `build`.

═══════════════════════════════════════════════════════════
6. TEXNIK TUZOQLAR — QIMMATGA TUSHGANLARI
═══════════════════════════════════════════════════════════

**O'lchash tuzoqlari:**

- **Tema `data-theme` bilan EMAS, `<html class="dark">` bilan
  almashadi** (`ThemeToggle.tsx`, `globals.css` dagi
  `@custom-variant dark`). `documentElement.setAttribute('data-theme',
  'dark')` HECH NARSA qilmaydi va tungi o'lchov soxta bo'lib chiqadi —
  2026-08-18 da aynan shunga tushib qolindi (yorug' va tungi bir xil
  raqam berdi). To'g'risi:
  `document.documentElement.classList.add('dark')`.
- **Brauzer paneli yopiq bo'lsa `transition` va `IntersectionObserver`
  ISHLAMAYDI.** O'lchashdan OLDIN majburiy:
  ```js
  * { transition: none !important; animation: none !important }
  [style*="opacity"] { opacity: 1 !important }
  ```
- **Skrinshot olinmaydi** («Browser pane is not displayed»). O'lchov
  `getComputedStyle` / `getBoundingClientRect` / `read_page` bilan.
- Gradient matn (`color: transparent`) kontrast o'lchovida SOXTA
  xato beradi — uni chetlab o't.

**CSS va Tailwind:**

- Tailwind v4: `globals.css` dagi oddiy sinf QATLAMSIZ, ya'ni
  utilitadan KUCHLI. Balandlik `className` emas, `Card` ning
  `elevation` propi orqali.
- `@theme inline` o'zgaruvchini `:root` ga CHIQARMAYDI.
- **Sonner (xabarlar):** izoh matnini o'z kulrangida chizadi va CSS
  o'zgaruvchidan OLMAYDI. `globals.css` da TO'RT darajali qoida bor.
  Xabarning O'LCHAMIGA tegadigan sinf berilmaydi.

**React / lint:**

- **Effekt ichida `setState`ni SINXRON chaqirib bo'lmaydi** — lint
  yiqiladi («cascading renders»). Yechim: boshlang'ich qiymatni
  `true` qilib qo'y va faqat `await` dan KEYIN o'zgartir
  (`TeamModal.tsx` ga qara).
- Route fayldan (`route.ts`) qo'shimcha const EKSPORT QILINMAYDI —
  Next.js turini buzadi. Umumiy qiymat `src/lib/` ga qo'yiladi.
- `mergeOutgoingRows` kabi generik funksiyaga `key?: string` turidagi
  massiv berilmaydi — klientda `rowKey(d)` bilan to'ldirib ber.

**Parser va ma'lumot:**

- Bank faylida `ИТОГО` qatori BIRINCHI katakda bo'lishi shart.
- `AuditResult` maydonlari: `data` (`rows` emas), `status === 'MOS'`,
  kontragentda `totalDebit`/`totalCredit`.
- **Kontragent bo'yicha boshlang'ich qoldiq bankda YO'Q.**
  «Остаток на начало периода» — HISOBVARAQ qoldig'i.
- Firestore: maydoni YO'Q hujjat `where('field','==',...)` so'roviga
  QO'SHILMAYDI. Shuning uchun mavjud kolleksiyaga ajratuvchi maydon
  qo'shish o'rniga YANGI kolleksiya ochiladi.
- **`writeBatch` bitta amal rad etilsa BUTUNLAY yiqiladi.** Qoidani
  unutish butun amalni jimgina o'ldiradi (korxona o'chirish shunday
  buzilgan edi).

**Qobiq (shell):**

- Katta `<<'EOF'` heredoc YIQILADI — uzun fayl uchun `Write` ishlat
  yoki python bilan yoz. 2026-08-18 da yana takrorlandi.
- Bu mashinada LibreOffice ham, poppler ham YO'Q.
- TypeScript kutubxonani Node'dan ishga tushirish:
  ```js
  const {createJiti} = require(PROJ + '/node_modules/jiti');
  const {auditFiles} = createJiti(__filename)(PROJ + '/src/lib/statementAudit.ts');
  ```

═══════════════════════════════════════════════════════════
7. ASBOBLAR
═══════════════════════════════════════════════════════════

- **3000-portda MENING dev-serverim ishlaydi** — ikkinchisini ochma.
  `.claude/launch.json` dagi `"ulanish"` konfiguratsiyasi mavjud
  serverga ULANADI.
- Login ortidagi sahifalarni brauzerda ko'rib bo'lmaydi. Yangi
  komponentni o'lchash uchun VAQTINCHALIK `/[locale]/dev-preview`
  sahifasi yasaladi va **o'lchashdan keyin O'CHIRILADI** (build
  marshrutlar sonini tekshirib tasdiqla: 41 ta).
- `verify-parsers` skill — `statementAudit.ts` / `bankStatements.ts` /
  `incomeParser.ts` / `universalParser.ts` / `excelWorkbook.ts` /
  `formatMemory.ts` / `counterpartyCategory.ts` / `aging.ts` /
  `counterpartyMerge.ts` ga TEGSANG majburiy.
- Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`
- **Workflow / subagent — MEN so'ramagunimcha ISHLATMA.**

═══════════════════════════════════════════════════════════
8. ISH USLUBI
═══════════════════════════════════════════════════════════

- **Ishonch bildirma — O'LCHA.** Kontrast, raqam, format, tarjima
  qamrovi. «Ishlashi kerak» degan gap qabul qilinmaydi.
- Xato topsang yashirma va "jimgina tuzatib" ham qo'yma — ochiq ayt,
  sababini ko'rsat, qaror mendan.
- Bajarib bo'lmaydigan narsa chiqsa — sababi bilan ayt, qolganini
  oxirigacha qil. Yarim ish qilib "tayyor" dema.
- Tekshirib bo'lmaydigan narsani yuborma.
- Ortiqcha uzr so'rama, ortiqcha maqtama. Qisqa va aniq yoz.
- Katta ishni bo'laklab qil va HAR BO'LAKDAN KEYIN tekshiruvni
  yurgiz.

═══════════════════════════════════════════════════════════
9. MENDAN JAVOB KUTAYOTGAN SAVOLLAR
═══════════════════════════════════════════════════════════

1. `moslik.uz` olindimi? 2026-08-18 da WHOIS «домени мавжуд эмас»
   dedi. Nom kodda, hujjatda va SEO'da ishlatilyapti.
2. Tashabbus arizasi ID-000951 da «Buxgaltersiz» nomi turibdi,
   StartupBase'da esa «Moslik». Moderatorga izoh berilsinmi?
3. `NEXT_PUBLIC_SITE_URL` deploy'da haqiqiy domenga qo'yilsin —
   hozir `https://moslik.uz` qotirilgan.
4. 100 mln so'mgacha soliq ozodligi 2026 dan bekor qilinganmi?
   Manbalar zid — MAHSULOT-QARORLARI §4.
5. Video inglizcha subtitr bilanmi yoki inglizcha ovoz kerakmi?
