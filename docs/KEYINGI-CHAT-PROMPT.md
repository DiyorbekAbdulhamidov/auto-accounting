Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi.
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

---

## 0. BOSHLASH

```
node scripts/verify-parsers.cjs   →  168/168 (etalon fayllar yo’qolgan — 2-C ga qara)
node scripts/check-contrast.cjs   →  70/70 (35 yorug' + 35 tungi)
npx tsc --noEmit                  →  toza
npx eslint src --max-warnings=0   →  toza
npx next build                    →  xatosiz
```

Bittasi yiqilsa — **MENGA AYT**, o'zing "tuzatib" ketma.
Chuqurroq: `HANDOFF.md` (texnik ma'lumotnoma), `MAHSULOT-QARORLARI.md`
(nima uchun shunday qilingan), `AGENTS.md`.

---

## 1. HOLAT (2026-08-25, kechqurun)

**Avval `git status` va `git log --oneline -3` ni O'QI** — quyidagisi
2026-08-25 kunining OXIRIDAGI holat.

Oxirgi kommit **`317572c`** («changed project plan»), `origin/master`
bilan teng, deploy bo'lgan. Jonli tekshirildi: `moslik.uz/uz/pricing`
yangi «Narx yo'q — hammasi bepul» sahifasini ko'rsatadi. Ya'ni **kod va
jonli sayt bir xil**.

### Ertalab kommit qilingani

Dizayn tizimi «hisob qog'ozi» (Golos Text + Literata + IBM Plex Mono,
iliq palitra, radius 2–8px), shaxsiy ma'lumot saytdan olib tashlangan,
`/clients` ish stoli ikkala yo'nalishni ko'rsatadi, marshrutlar
birlashtirilgan, sitemap Search Console'ga yuborilgan (32 URL, «Успешно»),
404 va xato sahifalari, dizayn tizimidagi uch jimgina xato, brauzer
dialoglari o'rniga `ConfirmDialog`.

### Kechqurun qo'shilgani — IKKI KATTA ISH

**A. HAMMASI BEPUL BO'LDI.** Egasining qarori: cheklov UMUMAN yo'q —
sverka, korxona, foydalanuvchi hammasi cheksiz; sayt narx haqida
hech narsa demaydi. «Qachon pulli qilish — mening ishim; odamlar
o'rgansin, auditoriya katta bo'lsin.»

- **Muddat KODGA YOZILMADI** (suhbat «ro'yxatdan 6 oy» dan boshlangan
  edi). Sanoq qo'yilsa u bir kuni O'ZI ishlab ketadi va hech kim
  kutmagan paytda hisoblar qulflanadi. Qaror egasida bo'lsin.
- **Cheklov yoqiladigan YAGONA joy:** `src/lib/plans.ts` dagi
  `free: { sverkaPerMonth, members }` — ularni `3` va `1` ga
  qaytarish yetarli. Sanoq mexanizmi, `QuotaWall`, a'zo cheklovi va
  tariflar (9 999 / 39 999) kodda joyida, faqat ko'rsatilmaydi.
- Sayt tomoni: narx sahifasi, narx savollari, bosh sahifa, ТСС,
  `seo.ts` (4 til), JSON-LD (bitta Offer, 0 so'm), `legal.ts`
  (oferta 4-bo'limi + qaytarish sahifasi — «30 kun oldin ogohlantirish»).
  Uch tilda jonli tekshirildi.

**B. KIRIM SVERKASI KO'RIB CHIQILDI, 8 ta nuqson tuzatildi.**
Uchtasi raqamga tegadigan:
- `incomeExcel.ts` — «Сверка» varag'i ostidagi «ЙИЛЛАР БЎЙИЧА» bloki
  farqni TESKARI ishorada yozardi (`c - f`), ya'ni ayni varaqning o'z
  ЖАМИ qatoriga zid edi. Harness `buildIncomeWorkbook` ni chaqirardi,
  lekin KATAKKA qaramasdi — endi qaraydi (`runIncomeExcelTest`).
- `agingByKey` faqat BELGILANGAN qatorlardan qurilardi, jadval esa
  hammasini chizadi → птичкаси olingan qatorni ochganda «Ёпилмаган
  фактура йўқ» degan YOLG'ON chiqardi. Endi `openInvoicesByKey`
  hamma kontragentdan quriladi (chiqimdagi naqsh).
- `incomeParser.ts` ga **davr kelishuvi** qo'shildi («ДАВРЛАР МОС
  КЕЛМАЙДИ») — chiqimda bor edi, kirimda YO'Q edi. Yig'indiga
  tegilmadi, faqat ogohlantirish.

Qolgan beshtasi: aging hisob sanasi endi fakturani ham hisobga oladi
(«bugun» ga tushmaydi), tab sanoqlari chizilgan qatorga teng,
oltala tabda bo'sh holat, Excelga **6-varaq «Қарз ёши»** qo'shildi,
`Tabs` va chiqim toolbariga `flex-wrap` (375px da sahifa 707px ga
surilardi), asosiy jadvallarga `max-h-[70vh]` (sticky shapka
ISHLAMASDI — o'lchandi), 404 sahifasi pastidagi 106px bo'shliq.

## 2. XAVFSIZLIK

**Ish stolini/ekranni suratga OLISH TAQIQLANADI.** Bir marta urinilganda
surat Chrome emas, Telegram oynasini olgan va begona odamlarning ismi
bilan telefon raqami tushgan. Rasm darhol o'chirilgan.

Ko'rish uchun **Claude-in-Chrome** ishlatiladi — u sahifaning o'zini
oladi, ish stolini emas. Diqqat: uning `save_to_disk` parametri **fayl
yo'lini qaytarmaydi**, ya'ni surat diskka tushmaydi (sinalgan).

**Jonli ekranlarda haqiqiy mijoz nomlari va STIRlari turadi.** Ular
ochiq sahifaga (qo'llanma, prezentatsiya) QO'YILMAYDI.

---

## 2-A. 2026-09-27 DA O'LCHANGAN — HAQIQIY FOYDALANUVCHI YO'Q

`scripts/retention.cjs` (yangi, faqat o'qiydi) bazani o'lchadi:

* `allowed_users` — **3 ta**, uchalasi ham O'ZIMIZNIKI/sinov:
  `+998901234567` (sinov raqami), `admin@gmail.com` (sinov),
  `webleaders.uz@gmail.com` (demo, `status` hatto `active` emas).
* `sverka_reports` — 3 ta, **uchalasi ham** `webleaders.uz@gmail.com` niki
  (15-iyul, 13-avgust, 16-avgust).
* `income_reports` — **0 ta**. Kirim sverkasini hech kim ishlatmagan.
* `companies` — 4 ta, hammasi demo hisobda: `test`, `das`,
  **`Babybum`** (haqiqiy firma nomiga o'xshaydi, STIR 311091791), `test`.

Ya'ni TASHQI foydalanuvchi **nol**. Eski HANDOFF dagi «4 ta
foydalanuvchi, oyiga ~2 ta ro'yxatdan o'tish» bazaga MOS EMAS.
Qo'mitaning «10 ta mijozdagi churn» savoliga hozir javob yo'q —
ketadigan odam yo'q. Vazifa «4 dan 10 ga» emas, **0 dan 1 ga**.

### Hakamlar saytga kirdimi — o'lchangan

* Firebase: **19-sentyabrdan keyin hech kim parol yozib KIRMAGAN**
  (xat 25-sentyabrda kelgan).
* Vercel Analytics, 25-sentyabr: 4 ta tashrifchi, hammasi `/en`,
  har biriga 1 ta sahifa, referrer yo'q, davlat **US**. O'zbekistondan
  o'sha kuni 0 ta. Bu odam emas, avtomatik havola tekshiruvi izi.
* Sentyabr bo'yicha `/en`: **7 tashrifchi / 7 sahifa** — o'sha sahifaga
  tushgan HECH KIM ichkariga bosmagan.
* Kabinet: «Ҳозирча мавжуд ҳафталар йўқ» — dastur boshlanmagan,
  jiddiy qarash OLDINDA.

Hakamlarga berilgan MVP havolasi: **`https://test-project.webleaders.uz/en`**
(`www.moslik.uz` EMAS). Ikkala domen bitta Vercel loyihasida
(`auto-accounting`), ya'ni env va kod umumiy.

## 2-B. KIRISH QAYTA QURILDI (2026-09-27, egasi qarori)

* «Рўйхатдан ўтиш / Кириш» bo'linishi, SMS qadami, email yo'li,
  parolni tiklash — UI dan OLIB TASHLANDI.
* Endi **modal oyna**, faqat **telefon + parol**, BITTA tugma. Raqam
  tanish bo'lsa kiradi, bo'lmasa hisob ochiladi (`phoneAccess()`).
* Firebase'da «telefon + parol» YO'Q, shuning uchun raqam barqaror
  soxta emailga o'giriladi: `+998901234567` -> `998901234567@moslik.uz`
  (`src/lib/phone.ts`, `phoneToAuthEmail`). Hisob kaliti ham shu bo'ladi.
* **SMS TASDIQLASH YO'Q** — raqam kimniki ekani tekshirilmaydi.
  Bu ataylab tanlangan; narxi kodda ochiq yozilgan.
* Sessiya doimiy: `browserLocalPersistence` ataylab yozib qo'yilgan.
* `sendSmsCode` / `confirmSmsCode` AuthContext'da QOLDI (UI dan uzilgan) —
  qaror qaytarilsa tayyor turadi.
* **Orqaga moslik**: `phoneAccess()` `@` bo'lsa uni EMAIL deb qabul
  qiladi va `NEXT_PUBLIC_DEMO_PHONE` topilmasa eski
  `NEXT_PUBLIC_DEMO_EMAIL` ga tushadi. Sabab: hakamlarning demo
  hisobi email bilan ochilgan — Vercel o'zgaruvchisi almashtirilmasa
  ham kirish UZILMAYDI.

## 2-C. 2026-09-30 — KIRISH MODAL, DEMO OLIB TASHLANDI, BOT TUZATILDI

### Kirish endi MODAL
* «Кириш» bosilganda `/login` ga O'TILMAYDI — oyna joyida ochiladi.
* `LoginFields` — forma BITTA manba: modal ham, `/login` sahifasi ham
  shundan chiziladi. Ikki nusxa bo'lsa biri eskirardi.
* `LoginModal` + `LoginModalProvider` ildizda (`[locale]/layout.tsx`).
  Holat HOSILA: oyna qaysi sahifada ochilgani saqlanadi, shuning uchun
  sahifa almashsa yoki odam kirsa o'zi yopiladi. Effekt ichida
  `setState` YO'Q — eslint `react-hooks/set-state-in-effect` uni
  o'tkazmaydi.
* `LoginLink` ataylab `<a href="/login">` bo'lib qoladi: JS yiqilsa
  yoki provayder bo'lmasa oddiy havola sifatida ishlaydi.
* **`/login` marshruti O'CHIRILMAYDI** — `AuthContext` va `AppShell`
  kirmagan odamni o'sha yerga yo'naltiradi.
* Matn: «Кириш ёки рўйхатдан ўтиш» + «Ҳисобингиз бўлмаса —
  рақамингизни ёзинг, ўзи очилади». Amal bitta, lekin yangi odam
  hisob qayerda ochilishini biladi.

### Demo to'ldirish YO'Q
`NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD` **koddan**
olib tashlandi, Vercel'dan emas. Sabab: muhit o'zgaruvchisi koddagi
qarorni jimgina bekor qiladi — bu loyihada `NEXT_PUBLIC_SITE_URL`
(saytni ikkiga bo'lgan) va o'sha demo paroli aynan shunday qaytgan.
Env ATAYLAB qo'yib qurildi — sahifada `value=""` chiqdi.

ESLATMA: Chrome o'z parol menejeri bilan formani to'ldirishi mumkin —
bu KOD emas. Inkognito oynada tekshiriladi.

### Demo hisobi tozalandi
`webleaders.uz@gmail.com` ish maydonida **haqiqiy mijoz ma'lumoti**
turgan edi: `das` korxonasi ichida 35 ta haqiqiy o'zbek kompaniyasi,
STIRlari va 3,88 mlrd so'mlik aylanma. Paroli esa sahifa manbasida
ochiq edi. O'chirildi, o'rniga `NAVBAHOR SAVDO` demo ma'lumoti
yuklandi (ikkala sverka, mahsulotning o'z oqimi orqali).
**Zaxira:** `.backup/demo-workspace-2026-09-27.json` (gitignore'da,
hech qachon kommit qilinmaydi).

### Kirim sverkasi ro'yxatda 0,00 ko'rsatardi
`/api/reports/summary` `totals.facturaSent`, `totals.bankCredit` va
`diffCount` ni o'qiydi, `IncomingReconciliation` esa ularni umuman
yozmasdi. Tuzatildi (`3845741`), hisob-kitob o'zgarmadi.

### Telegram bot — BOSHQA LOYIHADA
`@webleaderscontactbot` kodi `webleaders/company-site` da
(`src/app/api/telegram/route.ts`). Admin bo'lmagan chatdan kelgan
xabar JIMGINA tashlanardi — ofertadagi aloqa kanali ishlamasdi.
Tuzatildi, jonli sinovdan o'tdi. Batafsil xotirada.

### ETALON FAYLLAR YO'QOLGAN
`C:\Users\hp\Downloads\Telegram Desktop` papkasi o'chgan.
`verify-parsers` **248 -> 168** ga tushdi: hech narsa yiqilmadi,
lekin **80 ta tekshiruv o'tkazib yuborilmoqda** — aynan haqiqiy bank
fayllariga qarshi ishlaydiganlari. Fayllarni qayta yuklab, Downloads
DAN TASHQARIGA qo'yish kerak:

    node scripts/verify-parsers.cjs "C:/Users/hp/Desktop/moslik-etalon"

## 3. NAVBATDAGI ISH

1. **«Сумма прописью» hujjatda YO'Q** — `reconciliationAct.ts` da
   `amountInWords()` va `numberToWordsRu()` EXPORT qilingan, lekin
   butun loyihada hech qayerdan CHAQIRILMAYDI (grep bilan o'lchangan).
   Ya'ni rasmiy akt shaklida odatda bo'ladigan «summa so'z bilan»
   qatori umuman chizilmaydi. Funksiyalarning o'zi ishlaydi va endi
   qoplangan (rus tili rod/ko'plik shakllari bilan) — qaror: qatorni
   aktga qo'shishmi yoki o'lik kodni olib tashlashmi.
   ESLATMA: «Акт сверки» ning O'ZI endi SINOVSIZ EMAS — 2026-09-26
   da `runActTest()` qo'shildi (77 ta tekshiruv): ekran = hujjat,
   Фарқ = дебет − кредит ikkala sverkada, o'ng taraf ko'zgu, pul
   yo'qolmaydi, qoldiq NOMA'LUM ≠ NOL. Mutatsiya bilan isbotlangan:
   aktdan boshlang'ich qoldiq olib tashlansa 5 ta tekshiruv, ko'zgu
   buzilsa 6 ta tekshiruv YIQILADI.
2. **Chiqim Excel eksporti komponent ichida** —
   `OutgoingReconciliation.tsx` `ExcelJS` ni to'g'ridan import qiladi,
   ya'ni Node'dan sinab bo'lmaydi. Kirimniki `src/lib/incomeExcel.ts`
   da va qoplangan. Yana bir farq: chiqim **1 varaq**, kirim **6**.
   Ideal — `lib/outgoingExcel.ts` ga ko'chirib, harness bilan qoplash.
3. **Firebase Blaze** ($9,09 qarz) — SMS bilan kirish umuman
   ishlamaydi. Hammasi bepul bo'lgach bu MUHIMROQ bo'ldi: maqsad
   imkon qadar ko'p ro'yxatdan o'tish, telefon esa eng tabiiy yo'l.
4. **Search Console** — narx sahifasining matni butunlay almashdi,
   qayta indekslash so'ralsin.
5. **Ko'rilmagan modullar:** `counterpartyMerge.ts`,
   `openingBalance.ts`, `formatMemory.ts`, `universalParser.ts` va
   login ortidagi qolgan ekranlar (`/clients` ro'yxati, admin, jamoa).

**Ro'yxatdan TUSHDI:** «to'lov yo'li 1-noyabrgacha» — 2026-08-25 dagi
«hammasi bepul» qarori uni bekor qildi.

**Egasi «tursin» degani (tegilmaydi):** `Hamkorbank` belgisi,
`counterpartyCategory.ts` dagi STIR→nom jadvali, `docs/pitch-deck.html`,
kirish sahifasidagi demo email/parol (hakamlar tekshirishi uchun),
`test-project.webleaders.uz`, qo'llanmadagi namuna ekranlar
(hozirgisi yetadi — ular jonli komponentlardan yasalgan, PNG emas).

⚠️ `docs/pitch-deck.html` da hali **9 999 / 39 999 UZS/mo** turibdi va
bu mahsulotga ZID. Egasi ataylab «tegma» dedi (2026-08-25) — jimgina
«tuzatib» qo'yilmaydi, faqat so'ralganda o'zgartiriladi.

## 4. BUZILMAYDIGAN QOIDALAR

* Bu **Next.js 16** — kod yozishdan OLDIN `node_modules/next/dist/docs/`
  ni o'qi. (`error.tsx` da `reset` emas, **`unstable_retry`**.)
* **Workflow / subagent — MEN so'ramagunimcha ISHLATMA.**
* **Ekran/ish stolini suratga OLMA** (2-bo'limga qara).
* `src/lib/` dagi kirill matnlar parser kalitlari — TEGILMAYDI
  (`ИТОГО`, `ПАССИВ`).
* Parserga (`auditFiles`/`analyzeIncome`) **hisob-kitob o'zgaradigan**
  tarzda tegilmaydi. Sof qo'shimcha maydon (2026-08-25 da `own`
  qo'shilgan) mumkin, lekin `verify-parsers` bilan ISBOTLANADI.
* «Акт сверки» — ekran va Excel bir xil raqam bersin.
* «Фарқ» = debet − kredit, ikkala sverkada.
* Birlashtirish PUL YO'QOTMAYDI.
* Raqamni "to'g'rilash" uchun qo'lda tuzatma qo'shilmaydi — sabab topiladi.
* **HISOB KALITI** uch joyda AYNAN bir xil: `firestore.rules` `authKey()`,
  server (`apiAuth.ts`, `signup/route.ts`), klient (`AuthContext.tsx`).
* `t()` kaliti = KIRILL matnning O'ZI. Dublikat kalit `tsc` ni yiqitadi.
  Kalit ichiga SON qo'yilmaydi — u lug'atdan o'tmay qoladi
  (`sverkaQuota.ts` dagi `QUOTA_MESSAGE` shuning uchun statik).
* Huquqiy matnlar (`legal.ts`) va SEO (`seo.ts`) `t()` dan O'TMAYDI —
  ular to'rt tilda QO'LDA yoziladi.
* Havola qo'lda yozilmaydi: `path(...)` / `clientPath(...)`.
* **`.tabular` FAQAT RAQAM uchun** (`word-spacing: -0.22em` bor).
* Yangi UI qadam QO'SHILMASIN; mavjud jadval bekitilmaydi.
* Rang tokeni o'zgarsa — `node scripts/check-contrast.cjs`.
* Har o'zgarishdan keyin: `verify-parsers` → `check-contrast` → `tsc` →
  `eslint` → `build`.

---

## 5. TUZOQLAR

**Tailwind sinf to'qnashuvi — eng qimmat tuzoq:**
* Umumiy sinf qatoriga (`fieldClasses`, `tableCls.th`) kenglik yoki
  tekislash **qattiq yozilmasin**. Chaqiruvchi `className` bilan uni
  bekor qila olmaydi: ikkala sinf ham beriladi, g'olibni CSS dagi
  tartib hal qiladi. Uch marta jimgina buzgan. Qoida: **kenglik/
  tekislash sinfi BITTA bo'lsin** (`fieldWidth()` naqshi).

**Next / Vercel:**
* `next build` ni dev-server ishlab turganda ISHLATMA — `.next` umumiy.
  **`rm -rf .next` boshqa sessiyaning dev-serverini 500 ga tushiradi**
  (2026-08-25 da yuz bergan). Avval to'xtat, keyin qur.
* Turbopack keshi buziladi: `Internal Server Error` + `JSON.parse`
  xatosi kelsa `.next` VA `node_modules/.cache` ni o'chirib qayta yur.
* `NEXT_PUBLIC_*` qurishda singdiriladi → qo'shgach QAYTA DEPLOY.
  Shu sababli demo email/parol jonli to'plamdan **o'qib olinadi**.
* `@theme inline` dagi o'zgaruvchi `:root` ga CHIQMAYDI.
* CSS o'zgarishi dev-serverda ba'zan yetib bormaydi — `globals.css` ga
  bo'sh qator qo'shib "turtki" beriladi.
* `moslik.uz` → `www.moslik.uz` ga 308 bilan yo'naltiriladi; canonical
  va sitemap `www` ni ko'rsatadi (`seo.ts` dagi `SITE_URL`).

**Firestore / skript:**
* `.env` qiymatlari QO'SHTIRNOQ ichida — skript o'qiganda olib tashla,
  aks holda admin SDK boshqa loyihaga ulanadi va **jimgina** «topilmadi»
  deydi.
* `FIREBASE_PRIVATE_KEY` da `\n` haqiqiy qatorga aylantiriladi.
* `firebase-admin` v14: modulli kirish (`lib/app`, `lib/firestore`, `lib/auth`).
* Firestore qoidalari hujjat **SANAY OLMAYDI** — sanoqqa bog'liq cheklov
  faqat serverda (admin SDK) qo'llanadi.

**Sinov (login ortidagi ekran):**
* Sinov hisobi yaratiladi va oxirida bazadan O'CHIRILADI.
* Ro'yxatdan o'tish ~10 soniya oladi.
* Element qidirganda `id` ishlat (`#company-name`, `#company-inn`).
* Brauzer paneli yopiq bo'lsa **ekran surati olinmaydi** va mavjud
  bo'lmagan nuqson «topiladi». `get_page_text` / `read_page` ishlaydi.

**Qobiq:**
* Konsol kirillni chiqara olmaydi → faylga yoz, `cat` bilan o'qi.
* Katta heredoc `\\` ni buzadi — python skriptini `Write` bilan faylga yoz.
* Python skriptida **absolyut yo'l** ishlat: `cd` qilinsa nisbiy yo'l sinadi.
* `openpyxl` bu bank fayllarini odatiy rejimda ocha olmaydi —
  `read_only=True` bilan faqat QIYMAT o'qiladi.
* Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`

---

## 6. ISH USLUBI

* **Ishonch bildirma — O'LCHA.** «Ishlashi kerak» qabul qilinmaydi.
  Joylashuv muammosini ko'z bilan emas, `getBoundingClientRect` bilan o'lch.
* Xato topsang yashirma va jimgina tuzatib ham qo'yma — ochiq ayt,
  sababini ko'rsat, qaror mendan.
* O'zing buzgan narsani ham ayt (dev-server yiqilgani kabi).
* Bajarib bo'lmaydigan narsa chiqsa — sababi bilan ayt, qolganini
  oxirigacha qil.
* Katta ishni bo'laklab qil, HAR BO'LAKDAN KEYIN tekshiruvni yurgiz.
* Qisqa va aniq yoz. Ortiqcha uzr ham, maqtov ham kerak emas.
