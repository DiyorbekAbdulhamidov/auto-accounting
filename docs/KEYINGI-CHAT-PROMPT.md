# KEYINGI CHAT UCHUN PROMPT

> Shu faylning MAZMUNINI yangi chatga to'liq nusxala. U 2026-08-18
> sessiyasi oxirida yozilgan va o'sha kundagi HAQIQIY holatni aks
> ettiradi — hammasi o'lchangan, taxmin yo'q.

---

Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

═══════════════════════════════════════════════════════════
0. AVVAL SHULARNI QIL — TARTIB BILAN
═══════════════════════════════════════════════════════════

1. Shu uchta faylni o'qi:
   - `HANDOFF.md` — texnik holat. **§17 va §18 (a…h) eng yangisi.**
   - `MAHSULOT-QARORLARI.md` — nom, atamalar, bozor, narx
   - `docs/TAHLIL-2026-08-18.md` — dunyo tajribasi bilan solishtirish

2. Tekshiruvlarni yurgiz va solishtir:
   ```
   node scripts/verify-parsers.cjs   ->  124/124 o'tishi SHART
   npx tsc --noEmit                  ->  toza
   npx eslint src --max-warnings=0   ->  toza
   npx next build                    ->  xatosiz, 41 marshrut
   ```
   Bittasi ham yiqilsa — MENGA AYT, o'zing "tuzatib" ketma.

3. `git log --oneline -1` → `4f638fb "added analytics"`.
   **Ish daraxti TOZA** — hamma narsa commit qilingan.

═══════════════════════════════════════════════════════════
1. HOZIRGI HOLAT — 2026-08-18 OXIRIDA
═══════════════════════════════════════════════════════════

**Reja:** 1 sentabrga to'liq tayyor → 1 sentabr–1 noyabr bepul va
cheksiz (faqat ro'yxatdan o'tish shart) → keyin bepul reja qaytadi.

### Bajarilgan va TEKSHIRILGAN

| Nima | Holat |
|---|---|
| Firestore qoidalari deploy qilindi | ✅ jonli |
| Ish maydoni migratsiyasi (egasiz hujjat → 0) | ✅ |
| Bepul davr `PROMO_UNTIL = 2026-11-01T00:00+05:00` | ✅ testli |
| Yiqilgan fayl jurnali (`parse_failures`) | ✅ testli |
| Hisobot tarixi (ochish/o'chirish) | ✅ |
| Kontragentlarni birlashtirish | ✅ testli |
| Ish maydoniga a'zo taklif qilish | ✅ |
| SMS (telefon) bilan kirish — KOD tayyor | ✅ sinov raqamida ishladi |
| Narx sahifasida ochilish e'loni | ✅ 4 tilda |

### Kirish hozir QANDAY ishlaydi

- **ASOSIY yo'l — email va parol.** Login sahifasi shundan boshlanadi.
- **Telefon (SMS) — ikkinchi yo'l**, pastdagi havolada. Kodi to'liq
  yozilgan va sinov raqami bilan ISHLADI.
- Almashtirish uchun `LoginForm.tsx` dagi `useState<Step>("email")`
  ni `"phone"` ga o'zgartirish yetadi — boshqa hech narsa.
- Hisob KALITI: email bo'lsa email, bo'lmasa telefon
  (`accountKeyOf`, `src/lib/workspace.ts`). Superadmin hisobiga
  `+998900104240` BOG'LANGAN, ya'ni SMS bilan kirsa ham o'sha ish
  maydoniga tushadi (dalil: HANDOFF §18f).

### Vercel

Qo'yilgan: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY` (uchalasi Sensitive, Production+Preview).

Qaror: `NEXT_PUBLIC_DEMO_EMAIL/PASSWORD` **QO'YILMADI** — ular sahifa
manbasida ochiq turadi, superadmin esa `role: admin`. Hakamlarga
login og'zaki aytiladi.

`OPENROUTER_API_KEY` va `GEMINI_API_KEY` kodda ISHLATILMAYDI.

═══════════════════════════════════════════════════════════
2. KEYINGI ISHLAR — MUHIMLIK TARTIBIDA
═══════════════════════════════════════════════════════════

1. **`NEXT_PUBLIC_SITE_URL`** ni Vercel'ga qo'yish. Qo'yilmasa kod
   `https://moslik.uz` ni ishlatadi va sitemap/canonical/hreflang
   o'lik domenga ishora qiladi. **`NEXT_PUBLIC_` qurish paytida
   singdiriladi — qo'shgandan keyin QAYTA DEPLOY shart.**
2. **Firebase → Authentication → Settings → Authorized domains** ga
   Vercel domenini qo'shish. Unutilsa login JIMGINA ishlamaydi.
3. **Jonli sinov** (login ortidagi hech narsa haqiqiy sessiyada
   sinalmagan) — 3-bo'lim.
4. **Blaze rejasi** — Spark'da haqiqiy SMS UMUMAN yuborilmaydi
   (`auth/billing-not-enabled`). Sinov raqamlari ishlayveradi.
   Yoqilganda Google Cloud'da BYUDJET OGOHLANTIRISHI qo'yilsin.
5. **1 noyabrgacha TO'LOV yoki hech bo'lmasa rejani qo'lda qo'yish
   yo'li.** Hozir `workspaces.plan` faqat `signup` da `'free'` deb
   yoziladi va uni o'zgartirish YO'LI YO'Q. 1 noyabrda 3 tadan ko'p
   korxonali buxgalter qotib qoladi va to'lay olmaydi.
6. **10 ta haqiqiy buxgalterga berish.** O'lchov: nechtasi IKKINCHI
   oyda qaytadi (MAHSULOT-QARORLARI §8.3).
7. Ekran testlari — loyihada test yuruvchisining O'ZI yo'q
   (parser harness bor, React komponentlari qoplanmagan).
8. `api.faktura.uz` integratsiyasi.
9. Birlashtirishni AJRATISH hozir faylni qayta yuklashni talab qiladi.

═══════════════════════════════════════════════════════════
3. JONLI SINOV RO'YXATI — hali BAJARILMAGAN
═══════════════════════════════════════════════════════════

Login ortidagi hech narsa haqiqiy sessiyada sinalmagan. Kod to'g'ri
va qoidalar REST orqali tekshirilgan, lekin ekranda o'tilmagan:

- ro'yxatdan o'tish → ish maydoni yaralishi
- 4-korxona → cheklov YO'Q bo'lishi (bepul davr!) — 1 noyabrdan
  keyin esa cheklov QAYTISHI
- ikkinchi akkaunt: birinchisining korxonasi KO'RINMASLIGI
- chiqim/kirim sverkasini saqlash → qayta ochilganda tiklanishi
- hisobot tarixi: ikki marta saqla → ro'yxat, ochish, O'CHIRISH
- korxonani o'chirish (ilgari admin bo'lmaganda yiqilardi)
- boshlang'ich qoldiq → aktga tushishi
- birlashtirish: yig'indi O'ZGARMASLIGI, qayta yuklashda saqlanishi
- jamoa: email taklif → o'sha email bilan ro'yxatdan o'tish →
  YANGI ish maydoni OCHILMASLIGI
- notanish fayl yuklab, `parse_failures` ga yozuv tushishini
  tekshirish

═══════════════════════════════════════════════════════════
4. BUZILMAYDIGAN QOIDALAR
═══════════════════════════════════════════════════════════

- Bu **Next.js 16** — API'lar sening bilimingdan farq qiladi. Kod
  yozishdan OLDIN `node_modules/next/dist/docs/` ni o'qi.
- **Workflow / subagent — MEN so'ramagunimcha ISHLATMA.**
- `src/lib/` dagi kirill matnlarga TEGILMAYDI — ular parser kalit
  so'zlari (`ИТОГО`, `Остаток на начало периода`, `ПАССИВ`).
- **Parser (`auditFiles`/`analyzeIncome`) ga TEGILMAYDI.** Yangi
  mantiq undan KEYIN, alohida qadam bo'lib qo'shiladi — shunda 124 ta
  regress kuchda qoladi.
- «Акт сверки» bloki — rasmiy hujjat shakli, etalon PDF bilan
  qatorma-qator mos kelishi shart.
- Raqamni "to'g'rilash" uchun qo'lda tuzatma QO'SHILMAYDI — sabab
  topiladi.
- **«Фарқ» = debet − kredit**, ikkala sverkada. Boshlang'ich qoldiq
  bu raqamga QO'SHILMAYDI — alohida ustunda.
- **Birlashtirish PUL YO'QOTMAYDI.** Yig'indi o'zgarsa — bu
  "to'g'rilash" emas, ma'lumotni buzish.
- **HISOB KALITI qoidasi UCH joyda AYNAN bir xil bo'lsin:**
  `firestore.rules` dagi `authKey()`, server (`apiAuth.ts`,
  `signup/route.ts`), klient (`AuthContext.tsx`). Bittasi farq qilsa
  foydalanuvchi «Missing or insufficient permissions» oladi va sababi
  KO'RINMAYDI (2026-08-18 da aynan shu bo'lgan).
- Ikki rang o'qi aralashtirilmaydi: modul rangi (`--accent`) faqat
  tugma/tab/fokus; ma'lumot rangi (`--cash`/`--invoice`/`--ok`/
  `--warn`/`--bad`) moduldan mustaqil.
- `t()` kaliti = KIRILL matnning O'ZI. Yangi matn qo'shsang `ru` va
  `en` ni ham qo'sh. **Dublikat kalit `tsc` ni yiqitadi** — oldin
  `grep -n "^  '<matn>':" src/lib/i18n/dictionary.ts`.
- Havola qo'lda yozilmaydi: `path("pricing", locale)` /
  `clientPath(id, locale)`.
- SEO matnlari (`src/lib/seo.ts`) `t()` dan O'TMAYDI — har til uchun qo'lda.
- FAQ bitta manbadan: `src/lib/faq.ts`.
- **Firestore'da saqlanadigan qiymatlar migratsiyasiz
  o'zgartirilmaydi.** Mavjud ma'lumotga yangi maydon kerak bo'lsa:
  AVVAL migratsiya, KEYIN qoidalar deploy.
- Yangi UI taklif qilishdan oldin savol: *bu qadam qo'shyaptimi yoki
  olyaptimi?* Mavjud jadval BEKITILMAYDI (rad etilgan «natija
  paneli» tajribasi — HANDOFF §14).
- Har o'zgarishdan keyin: `verify-parsers` → `tsc` → `eslint` → `build`.

═══════════════════════════════════════════════════════════
5. TEXNIK TUZOQLAR — QIMMATGA TUSHGANLARI
═══════════════════════════════════════════════════════════

**Firebase / qoidalar:**

- **Qoidalarda mavjud bo'lmagan token kalitiga nuqta bilan murojaat
  qilish XATO beradi va butun qoida RAD ETADI.** Telefon tokenida
  `email` kaliti UMUMAN YO'Q (bo'sh satr emas — yo'q). Har doim
  `request.auth.token.get('email', '')`.
- **Qoidalarni brauzersiz tekshirish mumkin** va bu eng ishonchli
  usul (skript namunalari HANDOFF §18f da):
  ```
  accounts:sendVerificationCode  -> sessionInfo (sinov raqamida SMS YO'Q)
  accounts:signInWithPhoneNumber -> idToken
  firestore.googleapis.com/...   -> qoida HAQIQIY token bilan sinaladi
  accounts:signInWithPassword    -> email yo'li regressiyasi
  ```
- Firebase SINOV raqami sifatida **haqiqiy hisobga bog'langan
  raqamni qabul qilmaydi**.
- **SMS mintaqa siyosati** — Authentication → **Settings** (Sign-in
  method emas!). O'zbekiston ro'yxatda bo'lmasa
  `OPERATION_NOT_ALLOWED` beradi.
- `firebase-admin` **v14**: eski `admin.credential.cert` YO'Q,
  modulli kirish nuqtalari (`lib/app`, `lib/firestore`).
- Skriptlar `.env.local` NI EMAS, `.env` ni o'qishi kerak (ikkalasini
  sinasin).
- Firestore `undefined` qiymatga ISTISNO tashlaydi — `auth.user.email`
  telefon foydalanuvchisida undefined, shuning uchun audit izi
  `accountKey` yozadi.
- Firestore: maydoni YO'Q hujjat `where('field','==',...)` so'roviga
  QO'SHILMAYDI. Shuning uchun mavjud kolleksiyaga ajratuvchi maydon
  qo'shish o'rniga YANGI kolleksiya ochiladi.

**Next / Vercel:**

- `NEXT_PUBLIC_*` **qurish paytida** kodga singdiriladi → qo'shgandan
  keyin QAYTA DEPLOY shart. Va u MAXFIY EMAS — sahifa manbasida
  ko'rinadi.
- Statik (SSG) sahifada sana bo'yicha shart JSX ichiga YOZILMAYDI —
  gidratatsiya mos kelmaydi. HTML har doim bir xil chizilib, qaror
  gidratatsiyadan KEYIN DOM'da qo'llanadi (`PromoBanner.tsx` namuna).

**O'lchash:**

- Tema `data-theme` bilan EMAS, `<html class="dark">` bilan
  almashadi. Yorug' va tungi bir xil raqam bersa — tema umuman
  almashmagan.
- Brauzer paneli yopiq bo'lsa `transition` va `IntersectionObserver`
  ishlamaydi va MAVJUD BO'LMAGAN nuqson «topiladi». O'lchashdan oldin:
  ```js
  * { transition: none !important; animation: none !important }
  ```
- Gradient matn (`color: transparent`) kontrast o'lchovida soxta xato
  beradi — chetlab o't.
- Qurilmada dev parolini (`12345678`) QIDIRMA — polyfill ichidagi
  `"0123456789"` ga tushib soxta signal beradi. Ishonchli belgi —
  dev EMAIL.

**Qobiq (shell):**

- **Katta `<<'EOF'` heredoc YIQILADI va `\\` ni buzadi** — uzun matn
  uchun `Write` ishlat yoki python skriptini faylga yozib chaqir.
  (Bu sessiyada ikki marta vaqt yedi.)
- Bu mashinada LibreOffice ham, poppler ham YO'Q.
- TypeScript kutubxonani Node'dan chaqirish:
  ```js
  const {createJiti} = require(PROJ + '/node_modules/jiti');
  const {auditFiles} = createJiti(__filename)(PROJ + '/src/lib/statementAudit.ts');
  ```

═══════════════════════════════════════════════════════════
6. ASBOBLAR
═══════════════════════════════════════════════════════════

- **3000-portda MENING dev-serverim ishlaydi** — ikkinchisini ochma.
  `.claude/launch.json` dagi `"ulanish"` mavjud serverga ULANADI,
  `"dev-tekshiruv"` esa 3100-portni ishlatadi.
- Login ortidagi sahifalarni brauzerda ko'rib bo'lmaydi. Vaqtinchalik
  `/[locale]/dev-preview` yasaladi va o'lchashdan keyin O'CHIRILADI
  (build sahifalar sonini tasdiqla: 41 marshrut).
- `verify-parsers` skill — `statementAudit.ts` / `bankStatements.ts` /
  `incomeParser.ts` / `universalParser.ts` / `excelWorkbook.ts` /
  `formatMemory.ts` / `counterpartyCategory.ts` / `aging.ts` /
  `counterpartyMerge.ts` ga TEGSANG majburiy.
- Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`
- Sinov hisobi: `+998901234567` / kod `123456` (Firebase sinov
  raqami, haqiqiy SMS yubormaydi) — bazada bo'sh ish maydoni bilan
  turibdi, ATAYLAB qoldirilgan.

═══════════════════════════════════════════════════════════
7. ISH USLUBI
═══════════════════════════════════════════════════════════

- **Ishonch bildirma — O'LCHA.** «Ishlashi kerak» qabul qilinmaydi.
- Xato topsang yashirma va "jimgina tuzatib" ham qo'yma — ochiq ayt,
  sababini ko'rsat, qaror mendan.
- Bajarib bo'lmaydigan narsa chiqsa — sababi bilan ayt, qolganini
  oxirigacha qil. Yarim ish qilib "tayyor" dema.
- Katta ishni bo'laklab qil va HAR BO'LAKDAN KEYIN tekshiruvni
  yurgiz.
- Ortiqcha uzr so'rama, ortiqcha maqtama. Qisqa va aniq yoz.

═══════════════════════════════════════════════════════════
8. MENDAN JAVOB KUTAYOTGAN SAVOLLAR
═══════════════════════════════════════════════════════════

1. `moslik.uz` olindimi? 2026-08-18 da WHOIS «mavjud emas» dedi.
   Nom kodda, hujjatda va SEO'da ishlatilyapti.
2. Tashabbus arizasi ID-000951 da «Buxgaltersiz» nomi turibdi,
   StartupBase'da esa «Moslik». Moderatorga izoh berilsinmi?
3. 100 mln so'mgacha soliq ozodligi 2026 dan bekor qilinganmi?
   Manbalar zid — MAHSULOT-QARORLARI §4.
4. Video inglizcha subtitr bilanmi yoki inglizcha ovoz kerakmi?

═══════════════════════════════════════════════════════════
BUGUNGI VAZIFA:
═══════════════════════════════════════════════════════════

<shu yerga bugungi ishni yoz>
