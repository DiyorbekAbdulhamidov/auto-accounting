# HANDOFF — loyihaning joriy holati

**Oxirgi yangilanish: 2026-08-14.** Loyiha: `accounting-automation`
(Next.js 16, Turbopack, `master`).

Ikki sahifa: `/excel-audit` (chiqim: to'langan pul ↔ kelgan faktura) va
`/income-audit` (kirim: tushgan pul ↔ yozilgan faktura).

## Bir qarashda

| | Holat |
|---|---|
| **Mahsulot kimga** | **Buxgalter uchun sverka vositasi** (A yo'l). YATT/soliq moduli YOZILMAYDI |
| **Nom** | Hali tanlanmagan. UI atamalari brenddan mustaqil qilingan |
| **Kirish** | O'zi ro'yxatdan o'tadi, darhol ishlaydi |
| **Rejalar** | Bepul 3 korxona · Buxgalter 9 999 so'm · Byuro 39 999 so'm |
| **Tekshiruv** | `node scripts/verify-parsers.cjs` — **58 ta, hammasi o'tadi** |
| **Commit** | Bu sessiyadagi hech narsa commit QILINMAGAN |

## Ikki asosiy hujjat

- **`HANDOFF.md`** (shu fayl) — texnik holat, parserlar, deploy tartibi
- **`MAHSULOT-QARORLARI.md`** — nom, atamalar lug'ati, UI rejasi, bozor,
  narx, to'lov tizimlari va soliq bo'yicha tekshirilgan faktlar

## Bu sessiyada nima qilindi (2026-08-13 → 14)

1. **Qoldiq tenglamasi dasturga kiritildi** — ikkala sverkada (3-bo'lim)
2. **Qat'iy rejim** — tasdiqlab bo'lmaydigan fayl ochiq aytiladi
3. **«Ожидает подписи» kirim tomonda** ham ajratildi
4. **Atamalar lug'ati** — 28 ta matn almashtirildi (`MAHSULOT-QARORLARI.md` 2-bo'lim)
5. **Ish maydoni (egalik) modeli** — ilgari har kim hammaning ma'lumotini
   ko'rardi (5a-bo'lim, deploy tartibi QAT'IY)
6. **Ro'yxatdan o'tish + rejalar** (5b-bo'lim)

## Darhol e'tibor talab qiladi

- ⚠️ **Deploy tartibi:** migratsiya → keyin qoidalar. Teskari qilinsa
  mavjud ma'lumot «yo'qolgandek» bo'ladi. 5a-bo'limga qarang.
- ⚠️ **Firestore'da hech narsa sinalmagan** — kalitlar yo'q edi. Ish
  maydoni, ro'yxatdan o'tish va cheklovlar **jonli bazada bir marta
  sinalishi shart**.
- ⚠️ **Soliq savoli ochiq:** 100 mln so'mgacha ozodlik 2026 dan bekor
  qilinganmi? Manbalar zid — `MAHSULOT-QARORLARI.md` 4-bo'lim.

---

## 1. Kontragent toifalari (kommunal/byudjet ajratish)

Muammo: asosiy sverkada kommunal, byudjet va bank komissiyasi shovqin
qilardi — buxgalter faqat korxonalarni ko'rishni xohladi.

**Asosiy tamoyil:** o'chirilmaydi, TOIFAlanadi. Ikki xil xatoning narxi
teng emas:

| Xato | Oqibat |
|---|---|
| Oddiy firmani «kommunal» deb belgilash | Pul jadvaldan **yo'qoladi** — jimgina xato |
| Kommunalni «korxona» qoldirish | Ortiqcha qator — ko'zga tashlanadi, zarari yo'q |

Shuning uchun avtomatika **hech qachon** o'zi «kommunal» deb qo'ymaydi.

### Yangi fayllar
- `src/lib/counterpartyCategory.ts` — toifa mantig'i, STIR ro'yxati (13 ta),
  hisob raqami qoidalari, nom bo'yicha taxminlar
- `src/app/api/counterparty-category/route.ts` — toifani saqlash

### Aniqlash uch qatlamda
1. **Foydalanuvchi qarori** (Firestore, korxona darajasida) — eng ustun.
   `korxona` ni tanlash tizim ro'yxatini ham bekor qiladi.
2. **STIR ro'yxati** — nom bo'yicha EMAS. Uchta dalil (haqiqiy fayllardan):
   - STIR `201577953` bankda **4 xil nom** bilan, jumladan «ГУП СУВОКОВА»
   - `307626378` va `309841086` — ikki xil yuridik shaxs, ikkalasi «Zero Waste»
   - `311791997` «WATER DISTRIBUTION OLMALIQ» — nomida «WATER» bor, lekin
     haqiqiy kontragent (buxgalter aynan unda +3 248 farq topgan)
3. **Hisob raqami prefiksi** — hududiy ro'yxatsiz, butun mamlakat uchun:
   - `23402…` g'aznachilik (50/50 byudjet), `452…` bank daromadi (22/22)
   - `226xx` va `20208` **ataylab ishlatilmaydi** — aralash

### Himoya qoidasi (eng muhim yangilik)
Toifalash pul yo'qotmasligi uchun uch xil zid xulq tekshiriladi va
ogohlantirish beriladi (filtrdan qat'i nazar):
- **byudjet + faktura** → g'aznachilikka faktura yozilmaydi
- **ulush kattaligi** → kommunal/xizmat 2% dan oshmaydi, byudjet 15%
  (haqiqiy fayllarda g'aznachilik ulushi 1,0–10,3%)
- **yopilmagan farq** → fakturasi bor va 25%+ farq qolgan

Sinov: eng katta yetkazib beruvchini (`YOSH ULGURJI`, 473 954 000) adashib
belgilaganda ikkala yo'lda ham ushlandi, ЖАМИ raqamlar o'zgarmadi.

### Bu qancha shovqinni oladi
IMANMAX 7 oyligida 48 kontragentdan 13 tasi (27%) ajraldi, pul jihatdan
esa atigi **6,4%** (266 086 206,90 dan 4 149 372 694,10).

### Himoya darhol haqiqiy narsa topdi — TEKSHIRISH KERAK
- `306605769` **HUDUDGAZTA'MINOT — 50 278 000,00 faktura bor, to'lov 0.**
  Bu men ro'yxatga qo'shgan STIR edi, ya'ni himoya o'z xatomni ushladi.
- `200833833` O'zbekiston pochtasi — 227 503 faktura, to'lov yo'q
- ANGREN ISSIQLIK farqi 2 234 051,85 (37%), Zero Waste −1 366 176 (28%)

### Tasdiqlanmagan
`307712152` «ЦОТУ ООО TSS Center» — kimligi noma'lum, `korxona` bo'lib qoldi.

---

## 2. Ko'p tillilik

Standart til — **o'zbek kirill**. Tugma dark mode chap tomonida, 6 sahifada.

### Arxitektura qarori: kirill matnning O'ZI kalit
`t("Фирма номлари")`. Tarjima topilmasa matn kirill holicha chiqadi —
hech qachon bo'sh joy yoki `missing.key` ko'rinmaydi.

- **uz-latn** — `translit.ts` orqali AVTOMATIK. Lug'at kerak emas va
  serverdan kelgan dinamik ogohlantirishlarni ham qamrab oladi.
- **ru / en** — `dictionary.ts`, 237 ta yozuv, to'liqsizi 0 ta.
- Ruscha atamalar uchun `latn` maydoni bor («Нарастающий» → «Yig'indi bilan»).

### Yangi fayllar
`src/lib/i18n/{translit,dictionary,index}.ts`,
`src/context/LanguageContext.tsx`, `src/components/LanguageToggle.tsx`

### Ikki texnik qaror
- Til `useSyncExternalStore` bilan o'qiladi (localStorage — tashqi holat).
  `useState`+`useEffect` hydration xatosi va lint qoidasini buzardi.
- Ro'yxat **portal orqali `<body>` ga** chiqariladi. `absolute` bo'lganda
  kartochkalar (`relative z-10`) uning ustiga chizilardi va **bosish
  kartochkaga tushardi** — rus tili tanlanmasdi. Brauzerda tasdiqlangan.

### Tarjima qilinmagan (ATAYLAB)
`lib/aktSverki.ts`, `incomeParser.ts`, `bankStatements.ts` va boshqalardagi
kirill matnlar — bular UI emas, **parser kalit so'zlari**. Tarjima qilinsa
fayl o'qish buziladi.

---

## 3. Tekshiruv tizimi

`scripts/verify-parsers.cjs` + `.claude/skills/verify-parsers/SKILL.md`.
Hozir **38 ta tekshiruv, hammasi o'tadi**.

### Qoldiq tenglamasi — ENDI DASTURDA
Boshlang'ich qoldiq + kredit − debet = oxirgi qoldiq. 6 fayldan 5 tasida
mavjud va **tiyinigacha** mos:

| Fayl | Hisob | Natija |
|---|---|---|
| ULUGBEK | 5 310 044,59 + 530 328 064,00 − 533 714 200,00 | 1 923 908,59 ✔ |
| STROY MARKET | 10 073 773,70 + 177 534 882,00 − 177 989 618,29 | 9 619 037,41 ✔ |
| ANGREN ADMIRAL | 14 739 427,31 + 97 771 309,00 − 110 863 934,99 | 1 646 801,32 ✔ |
| KARVON | 33 069 378,00 + 558 967 921,58 − 583 281 698,90 | 8 755 600,68 ✔ |
| IMANMAX | 3 038 511,11 + 722 034 354,04 − 699 298 176,27 | 25 774 688,88 ✔ |

**Nega bu «Итого»dan kuchli:** debet bilan kredit almashib ketsa «Итого»
buni sezmaydi (yig'indi baribir to'g'ri), qoldiq tenglamasi esa yiqiladi.
Ipoteka/ASBT fayli aynan shu xatoni keltirgan edi.

`AZON.xlsx` — 6 tadan yagona fayl bo'lib, unda na «Итого», na qoldiq bor.
Ya'ni o'zini tekshirish imkoni yo'q.

#### Qanday kiritildi (2026-08-13, ikkinchi sessiya)

| Fayl | Nima qo'shildi |
|---|---|
| `bankStatements.ts` | `AccountBalances`, `findAccountBalances()`; uchala parser `balances` qaytaradi |
| `formatMemory.ts` | `readBankWithFormat` ham `balances` qaytaradi — qoldiq ustunlar xaritasiga bog'liq emas |
| `statementAudit.ts` | `BalanceCheck`, `checkBalanceEquation()`; natija `AuditResult.balanceChecks` da |
| `upload-preview/route.ts` | `balanceChecks` javobga qo'shildi |
| `companies/[id]/page.tsx` | «Ўқиш ҳисоботи» panelida tenglama ko'rinadi (✓ / ⚠ / —) |

**Uch qaror va sabablari:**

1. **Fayl darajasida, varaq darajasida emas.** ASBT eksportida debet
   Sheet2 da, kredit Sheet4 da, oxirgi qoldiq esa faqat Sheet4 ning
   «Итого» qatorida (`c14: Остаток на конец периода`). Varaq bo'yicha
   tekshirilsa hech qachon yopilmasdi.
2. **Yorliq katak BOSHIDAN moslashtiriladi.** IMANMAX kredit varag'ida
   to'lov maqsadi «...инкасса мк за терминал 100% от сальдо 42000»
   ko'rinishida 200 dan ortiq qatorda uchraydi — erkin qidiruv ularni
   qoldiq deb o'qib, raqamni butunlay buzardi.
3. **Sana raqam emas.** `parseAmount("31.07.2026")` = 0. Shuning uchun
   sanaga o'xshash qiymat qoldiq sifatida qabul qilinmaydi — aks holda
   qoldiq JIMGINA nolga aylanardi.

Qoldiqning ikki joylashuvi ham qo'llab-quvvatlanadi: raqam yorliq bilan
bitta katakda (`Остаток на начало периода: 5 310 044.59`) yoki o'ngdagi
alohida katakda (IMANMAX: yorliq `c0`, raqam `c9`, `ПАССИВ` `c10`).
`ПАССИВ`/`АКТИВ` belgisi o'qiladi: aktiv hisobda tenglama teskari
(qoldiqni debet oshiradi). Namunalarning hammasi passiv.

#### Harness endi xatoni USHLASHNI ham tekshiradi

Ilgari 24 ta tekshiruvning hammasi «to'g'ri fayl to'g'ri o'qildimi» edi.
Endi `runSwapTest()` xotirada ataylab buzilgan `.xlsx` tuzadi — raqamlar
o'zgarmaydi, faqat varaq **sarlavhalari almashtiriladi**:

```
to'g'ri:  debet 200 000, kredit 300 000 → 1 000 000 + 300 000 − 200 000 = 1 100 000 ✔
almashgan: debet 300 000, kredit 200 000 → 1 000 000 + 200 000 − 300 000 =   900 000 ✘
```

Almashgan faylda **har varaqning «Итого»si o'z yig'indisiga teng qolaveradi
va bitta ham ogohlantirish bermaydi** — bu skriptda alohida tasdiqlanadi.
Ya'ni «Итого» ojizligi endi taxmin emas, sinov bilan qayd etilgan.

---

## 4. Bank formatlari

Tizim taniydigan shakllar: `TWO_SIDED` (ASBT 3 / Ipoteka), `THREE_ROW`,
`COLUMNAR`, `HAMKORBANK`, eski `IPOTEKA_ASBT`, `FAKTURA`. Ustiga
`TANISH_SHAKL` (format xotirasi) va `UNIVERSAL` (ogohlantirish bilan).

Fayl turlari: `.xls` (BIFF), `.xlsx`, ichi HTML bo'lgan soxta `.xls`,
CSV (windows-1251 va UTF-8).

### Ipoteka (ASBT 3) — eng xavfli shakl
`IMANMAX.xls` aynan shu. Debet va kredit **alohida varaqlarda**:
```
Sheet1  Справка о ДЕБЕТОВЫХ оборотах по счету 20208000105628578001
Sheet2  (jadval)
Sheet3  Справка о КРЕДИТОВЫХ оборотах по счету 20208000105628578001  ← O'SHA HISOB
Sheet4  (jadval)
```
Sheet2 va Sheet4 ning **shapkasi AYNAN bir xil**, hisob raqami ham bir xil.
Yo'nalish faqat sarlavha varag'ida, unda esa ma'lumot yo'q.

**Shuning uchun format xotirasi parserlarni HECH QACHON bosib o'tmaydi** —
shapka izi ikkalasida bir xil.

---

## 5. Keyingi ishlar (muhimlik tartibida)

### Bajarilganlar (2026-08-13 → 14)

| Ish | Qayerda |
|---|---|
| Qoldiq tenglamasi — ikkala sverkada | `bankStatements.ts`: `findAccountBalances`, `checkBalanceEquation` |
| Qat'iy rejim | `AuditResult.unverifiedFiles`. **Raqam YO'QOTILMAYDI** — o'chirish ham jimgina xato bo'lardi. Hozir ro'yxatga faqat `AZON.xlsx` tushadi |
| «Ожидает подписи» kirim tomonda | `analyzeIncome(files, { includePending })`. Sahifada tugma YO'Q — yangi UI bilan qo'yiladi |
| Atamalar lug'ati (UI 1-bosqich) | 28 ta matn, 4 sahifa + 2 Excel eksport |
| Ish maydoni (egalik) | `workspace.ts`, `firestore.rules`, `assertCompanyAccess` |
| Ro'yxatdan o'tish + rejalar | `api/signup`, `api/companies`, `plans.ts` |

### 1. Jonli Firestore'da sinash — ENG BIRINCHI

Ish maydoni, ro'yxatdan o'tish va cheklovlar **hech qachon haqiqiy
bazada ishlamagan** (kalitlar yo'q edi). Tartib 5a-bo'limda. Sinov
ro'yxati:
- test email bilan ro'yxatdan o'tish → ish maydoni yaratilyaptimi
- 4-korxona qo'shishga urinish → cheklov ushlaydimi
- ikkinchi akkaunt ochib, birinchisining korxonasi ko'rinmasligi

### 2. UI ni qayta qurish — 2-5 bosqichlar

1-bosqich (lug'at) bajarildi. Qolgani:
- **2)** dizayn tizimi: rang tokenlari, bitta jadval/kartochka/tugma
- **3)** chiqim va kirim bitta sahifada tab bo'lib (hozir alohida sahifa,
  alohida lug'at, alohida eksport — buxgalter uchun esa bu bitta ish)
- **4)** natija ekrani: avval «nechta kontragentda farq bor va qancha»,
  20 ustunli jadval — ikkinchi ekranda
- **5)** yuklash oqimi: tizim nima topganini OLDIN aytadi (qaysi bank,
  qaysi davr, qaysi korxona) → tasdiqla → natija

### 3. «Ko'proq kerak» tugmasi

Bepul 3 korxona to'lgach chiqadi, hozircha faqat aloqa qoldiradi.
Bu **haqiqiy talab o'lchovi** — to'lov ulanmasidan oldin.

### 4. Bir martalik ustun tasdiqlash

Notanish shakl kelganda topilgan xaritani 3 namuna qator bilan
ko'rsatib tasdiqlatish. Format xotirasi bor, tasdiqlash bosqichi yo'q —
ya'ni bir marta noto'g'ri o'rganilsa, keyin jimgina takrorlanadi.

### 5. Ekran tomonida test yo'q

Parser 58 ta tekshiruv bilan qoplangan, sahifalar va route'lar —
umuman qoplanmagan. Parser to'g'ri hisoblab, ekranda noto'g'ri
ko'rsatilishi mumkin.

### 6. Uzoq muddatli

- **Excel o'rniga standart format** — 1C «Клиент-Банк», MT940,
  ISO 20022 `camt.053`. Qaysi bank qaysi birini beradi — TEKSHIRILMAGAN.
- **Fayl to'plami** — har mijozdan bittadan ko'chirma, ~20 bank uchun
  doimiy regress to'plami. Hozir 6 ta fayl bor.
- Korxonalararo toifa o'rganish **lokal sinalmagan** — Firestore kerak.
- To'lov ulash (Click yoki Uzum) — `MAHSULOT-QARORLARI.md` 4-bo'lim.

---

## 5b. Ro'yxatdan o'tish va rejalar (2026-08-14)

O'zi ro'yxatdan o'tadi, tasdiqlash kutilmaydi. Yangi fayllar:
`src/lib/plans.ts`, `src/app/api/signup/route.ts`,
`src/app/api/companies/route.ts`.

**Cheklov korxona soniga** (bepul 3 / Buxgalter 20 / Byuro cheksiz),
**sverka har doim cheksiz**. Sabab `MAHSULOT-QARORLARI.md` da.

Ikki tuzoq va ular qanday yopilgani:
- `/api/signup` `requireUser()` ni ISHLATMAYDI — u `allowed_users` ni
  talab qiladi, yangi odamda esa u hali yo'q (tovuq-tuxum).
- Korxona endi faqat `/api/companies` orqali yaratiladi; qoidalarda
  klient uchun `create: if false`. Firestore qoidalari hujjat SANAY
  OLMAYDI, ya'ni cheklovni qoidada yozib bo'lmaydi.

Login sahifasidan tayyor email/parol olib tashlandi.

**Hali yo'q:** to'lov qabul qilish (yuridik shaxs va Payme/Click shartnomasi
kerak), «Ko'proq kerak» tugmasi, email tasdiqlash.

---

## 5a. DEPLOY QILISHDAN OLDIN — tartib muhim

Ish maydoni (egalik) modeli qo'shildi. **Qoidalarni ma'lumotdan OLDIN
deploy qilsangiz, mavjud korxona va hisobotlar "yo'qolgandek" bo'ladi** —
yangi qoida egasiz hujjatni ko'rsatmaydi. Tartib:

```bash
node scripts/migrate-workspaces.cjs
```

Bu faqat ko'rsatadi, hech narsa yozmaydi. Keyin:

```bash
node scripts/migrate-workspaces.cjs --apply sizning@email.uz
```

Va faqat shundan keyin:

```bash
firebase deploy --only firestore:rules
```

Skript idempotent: `workspaceId` bor hujjatga tegmaydi, qayta ishga
tushirsa bo'ladi. Ma'lumot bo'lmasa hech narsa qilmaydi.

---

## 6. Ish uslubi

- Har parser o'zgarishidan keyin: `node scripts/verify-parsers.cjs`,
  `npx tsc --noEmit`, `npx eslint`, `npx next build`
- **Raqamni "to'g'rilash" uchun qo'lda tuzatma qo'shilmaydi** — faqat sabab
  topiladi va manba bilan solishtiriladi
- Foydalanuvchi tili: o'zbekcha. UI matnlari — kirill o'zbekcha.
- Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`
  (6 ta bank ko'chirmasi + IMANMAX 7 oylik oborotka/faktura)
- Dev-server login talab qiladi; parol kiritib bo'lmaydi, shuning uchun
  avtorizatsiya ortidagi sahifalarni brauzerda ko'rish imkoni yo'q.
  Login sahifasining o'zi ochiq — UI ni o'sha yerda sinash mumkin.
- **`lib/` dagi kirill matnlarga tegilmaydi** — ular UI emas, parser
  kalit so'zlari (`ИТОГО`, `Остаток на начало периода`, `ПАССИВ`).
  Tarjima qilinsa fayl o'qish buziladi.
- **Акт сверки** bloki (`Дебет / Кредит / Сальдо`) ham tegilmaydi — u
  rasmiy ikki tomonlama hujjat shakli, etalon PDF bilan qatorma-qator
  mos kelishi shart.
- Foydalanuvchi «hamma ishni qil» desa — bajarib bo'ladiganini qilib,
  bajarib bo'lmaydiganini SABABI bilan aytish kerak.

## 7. Bu sessiyada tegilgan fayllar

Yangi: `src/lib/{workspace,plans}.ts`, `src/app/api/{signup,companies}/`,
`scripts/migrate-workspaces.cjs`, `MAHSULOT-QARORLARI.md`.

O'zgargan: `src/lib/{bankStatements,statementAudit,incomeParser,incomeExcel,formatMemory,apiAuth}.ts`,
`src/lib/i18n/dictionary.ts`, `src/context/AuthContext.tsx`,
`src/app/login/page.tsx`, `src/app/excel-audit/**`, `src/app/income-audit/page.tsx`,
`src/app/api/{upload-preview,counterparty-category,income-audit}/route.ts`,
`firestore.rules`, `scripts/verify-parsers.cjs`.

**Hech biri commit qilinmagan.**
