Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi.
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

---

## 0. BOSHLASH

```
node scripts/verify-parsers.cjs   →  171/171
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

## 3. NAVBATDAGI ISH

1. **«Акт сверки» umuman SINOVSIZ** — `reconciliationAct.ts`
   `verify-parsers` da 0 marta uchraydi. U ikkala sverkada
   ishlatiladigan rasmiy ikki tomonlama hujjat, kirim Excel'idagi
   ishora xatosi esa aynan shu turkumdan edi. Naqsh tayyor:
   `runIncomeExcelTest` workbook KATAGINI o'qiydi.
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
