# HANDOFF — loyihaning joriy holati

**Oxirgi yangilanish: 2026-08-16.** Loyiha: `accounting-automation`
(Next.js 16.2, Turbopack, `master`). Mahsulot nomi — **Moslik**.

## Marshrutlar (2026-08-17 da tilga bo'lingan)

Har manzil `/[locale]/...` ko'rinishida. **Til — URL'ning birinchi
bo'lagida**, `localStorage` da EMAS.

| Manzil | Nima | Kirish |
|---|---|---|
| `/[locale]` | **Ochiq tanishtiruv sahifasi** | ochiq · indeksda |
| `/[locale]/guide` | To'liq qo'llanma (`<Guide />`) | ochiq · indeksda |
| `/[locale]/pricing` | Narx + narxga oid TSS | ochiq · indeksda |
| `/[locale]/features` | Imkoniyatlar (to'liq 8 ta) | ochiq · indeksda |
| `/[locale]/login` | Kirish va ro'yxatdan o'tish | ochiq · indeksda |
| `/[locale]/clients` | Mijozlar ro'yxati — **ikkala sverka uchun bitta** | login · `noindex` |
| `/[locale]/clients/[id]` | Bitta mijoz: **Чиқим \| Кирим — tab** | login · `noindex` |
| `/[locale]/admin/users` | Foydalanuvchilar | login · `noindex` |

`locale` ∈ `uz` · `uz-cyrl` · `ru` · `en` — 4 × 5 = **20 ta ochiq
sahifa statik quriladi**.

**Yo'naltirish `src/proxy.ts` da** (Next 16 da `middleware.ts` EMAS —
nom o'zgargan). U tilsiz kelgan so'rovni to'g'ri tilga oladi:
`NEXT_LOCALE` cookie → `Accept-Language` → `uz`. Eski manzillar ham
shu yerda tarjima qilinadi, chunki natija TILGA bog'liq:

| Eski | Yangi |
|---|---|
| `/korxonalar` | `/{til}/clients` |
| `/qollanma` | `/{til}/guide` |
| `/excel-audit/companies/{id}` | `/{til}/clients/{id}` |
| `/income-audit` | `/{til}/clients` |

Brauzerda tekshirilgan: 10 ta manzil, `/xyz/pricing` → 404.

## Bir qarashda

| | Holat |
|---|---|
| **Mahsulot kimga** | **Buxgalter uchun sverka vositasi** (A yo'l). YATT/soliq moduli YOZILMAYDI |
| **Nom** | **Moslik** (`moslik.uz`). Sabab: `src/lib/brand.ts` va `MAHSULOT-QARORLARI.md` 1-bo'lim |
| **Shior** | «Бухгалтер учун автоматик текширув тизими» + majburiy `BRAND.promise` qatori |
| **Logotip** | Ikkita teng chiziq = «мос келди». Yuqorigi `--cash`, pastkisi `--invoice`. `src/components/Brand.tsx`, `src/app/icon.svg` |
| **Tillar** | 4 ta, **URL'da**: `uz` (lotin) · `uz-cyrl` · `ru` · `en`. Lug'at qamrovi **92,4%** (qolgani tarjima qilinmaydigan narsalar) |
| **Kirish** | O'zi ro'yxatdan o'tadi, darhol ishlaydi |
| **Rejalar** | Bepul 3 korxona · Buxgalter 9 999 so'm · Byuro 39 999 so'm |
| **Tekshiruv** | `node scripts/verify-parsers.cjs` — **58 ta, hammasi o'tadi** |
| **Commit** | `b4ab63c "big changes"` (2026-08-16) — shu sessiyaning katta qismi kiritilgan. Undan keyingi tuzatmalar hali commit qilinmagan |

## Ikki asosiy hujjat

- **`HANDOFF.md`** (shu fayl) — texnik holat, parserlar, deploy tartibi
- **`MAHSULOT-QARORLARI.md`** — nom, atamalar lug'ati, UI rejasi, bozor,
  narx, to'lov tizimlari va soliq bo'yicha tekshirilgan faktlar

## Bu sessiyada nima qilindi (2026-08-16)

1. **Nom va logotip** — `Moslik`. `src/lib/brand.ts` bitta manba, nom
   hech qachon `t()` dan o'tkazilmaydi.
2. **Standart alifbo lotinga o'tdi** — `DEFAULT_LANG = 'uz-latn'`.
   Bitta qator; kalitlar tegilmadi. Saqlangan tanlov ustun turadi.
3. **Bosh sahifa qayta yozildi** — endi OCHIQ tanishtiruv sahifasi.
   Ilgari u login ortida edi va «Иш Муҳитини Танланг» deb turardi,
   ya'ni ishontirish kerak bo'lgan odam uni hech qachon ko'rmasdi.
4. **Chiqim va kirim BITTA sahifaga birlashdi** (UI 3-bosqich).
   Yo'nalish endi sahifa emas, tab. Kirim sverkasida ilgari korxona
   tushunchasi umuman yo'q edi.
5. **«Фарқ» ishorasi to'g'rilandi** — quyida 8-bo'lim.
6. **Uchta o'lchangan kontrast xatosi tuzatildi** — quyida 9-bo'lim.
7. **O'lik fayllar o'chirildi** — 10-bo'lim.

## Darhol e'tibor talab qiladi

- ⚠️ **Deploy tartibi:** migratsiya → keyin qoidalar. Teskari qilinsa
  mavjud ma'lumot «yo'qolgandek» bo'ladi. 5a-bo'limga qarang.
- ⚠️ **Firestore'da hech narsa sinalmagan** — kalitlar yo'q edi. Ish
  maydoni, ro'yxatdan o'tish va cheklovlar **jonli bazada bir marta
  sinalishi shart**. Login ortidagi sahifalar (`/korxonalar`) shu
  sababli brauzerda ham sinab ko'rilmagan.
- ⚠️ **Eski saqlangan hisobotlar** `sverka_reports` da chiqim
  tomondan yozilgan va ishorasi o'zgarmagan — ular to'g'ri qoladi.
  Kirim sverkasi hech narsa saqlamaydi, ya'ni ishora o'zgarishi
  bazadagi ma'lumotga TEGMAYDI.
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
Hozir **58 ta tekshiruv, hammasi o'tadi**.

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

### 2. UI ni qayta qurish — 4 va 5 bosqichlar QOLDI

- **1) lug'at** ✅ (2026-08-13)
- **2) dizayn tizimi** ✅ (2026-08-15) — `globals.css` tokenlari,
  `src/components/ui/` da 21 komponent
- **3) chiqim va kirim bitta sahifada** ✅ (2026-08-16) —
  `/korxonalar/[id]`, `ModuleScope` bilan rang tabga bog'landi
- **4) natija ekrani** ❌ — hozir birinchi ko'rinadigan narsa hali ham
  ko'p ustunli jadval. Ko'rinishi kerak: «nechta kontragentda farq
  bor va qancha», jadval — ikkinchi ekranda
- **5) yuklash oqimi** ❌ — tizim nima topganini OLDIN aytadi (qaysi
  bank, qaysi davr, qaysi korxona) → tasdiqla → natija

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

---

## 7a. Til va SEO qatlami (2026-08-17)

### Muammo o'lchov bilan qayd etildi

Rus va ingliz tillari «umuman ishlamaydi» degan shikoyat o'lchandi:

```
UI dagi kirill matn : 410 ta
lug'atda bor        : 200 ta
TARJIMASIZ          : 210 ta  ->  qamrov 48,8%
```

Ya'ni rus tilida sahifaning yarmi o'zbekcha, inglizchada esa
lotin-o'zbekcha chiqardi. Yangi landing deyarli butunlay tarjimasiz
edi. **Hozir: 92,4%** — qolgan 31 tasi shablon parchalari
(`${...}`), regex ichidagi matn va tashkilotlarning O'Z nomlari,
ya'ni tarjima qilinmaydigan narsalar.

Qamrovni o'lchash: `scripts` da emas, sessiya papkasida vaqtinchalik
skript ishlatilgan. Kerak bo'lsa qayta yozish oson — u `src/components`
va `src/app/[locale]` dagi barcha kirill literalni yig'ib, lug'at
kalitlariga solishtiradi.

### Arxitektura qarori: til URL'da, kalit tuzilishi TEGILMADI

`t()` kaliti hali ham **kirill matnning O'ZI**. O'zgargani faqat
tilning QAYERDAN kelishi:

| | Ilgari | Hozir |
|---|---|---|
| Manba | `localStorage` | URL bo'lagi (`/ru/...`) |
| Server bilan mos | yo'q (gidratatsiya xavfi) | ha, bir xil HTML |
| Google ko'radimi | **yo'q** | ha, har til alohida sahifa |

`LanguageProvider` endi `lang` ni PROP bo'lib oladi
(`app/[locale]/layout.tsx` dan). `setLang` esa `router.push` qiladi va
`NEXT_LOCALE` cookie qo'yadi — odam TURGAN sahifasida qoladi.

### Nega `uz` va `uz-cyrl` alohida manzil

Lotin va kirill — bir tilning ikki YOZUVI, mazmuni bir xil. Ularni
alohida manzilga chiqarish dublikat kontent xavfini tug'diradi.
Yagona himoya — `hreflang` da YOZUVNI ko'rsatish:

```html
<link rel="alternate" hrefLang="uz-Latn" href=".../uz/pricing">
<link rel="alternate" hrefLang="uz-Cyrl" href=".../uz-cyrl/pricing">
```

Agar ikkalasi ham shunchaki `uz` bo'lsa, Google bittasini tashlaydi.
`LOCALE_HREFLANG` (`src/lib/i18n/index.ts`) aynan shuning uchun bor.

### SEO qatlami — nima qilindi

| Narsa | Qayerda | Holat |
|---|---|---|
| Har til uchun QO'LDA yozilgan title/description/keywords | `src/lib/seo.ts` | 4 til × 5 sahifa |
| `hreflang` × 5 (+ `x-default`) va o'ziga `canonical` | `src/lib/pageMeta.ts` | brauzerda tasdiqlangan |
| `sitemap.xml` — 20 manzil, 100 ta alternate | `src/app/sitemap.ts` | tasdiqlangan |
| `robots.txt` — app sahifalari yopiq | `src/app/robots.ts` | tasdiqlangan |
| JSON-LD: Organization + WebSite + SoftwareApplication (narx bilan) | `src/components/JsonLd.tsx` | bosh sahifada |
| JSON-LD: FAQPage — 8 savol | `src/lib/faq.ts` → JsonLd | bosh sahifa va qo'llanma |
| JSON-LD: BreadcrumbList | JsonLd | ichki sahifalarda |
| OpenGraph + Twitter card | `pageMeta.ts` | har sahifada |
| `noindex` + `disallow` app sahifalariga | `pageMeta.ts` + `robots.ts` | ikki qatlamda |

**FAQ BITTA MANBADAN** (`src/lib/faq.ts`): ekranda ko'rinadigan
matn ham, `FAQPage` razметkasi ham o'sha yerdan. Google razmetka
ko'rinadigan matnga AYNAN mos kelishini talab qiladi — ikkita nusxa
bo'lsa, biri o'zgarganda razmetka yolg'on bo'lib qolardi.

**Halol chegara:** bu TEXNIK poydevor. «Top 1» ni texnika bermaydi —
uni kontent, tashqi havolalar va vaqt beradi. Hozir qilingani:
qidiruv tizimi sahifani to'g'ri o'qiy oladi, to'rt tilni bog'lay
oladi va narx/imkoniyat sahifalari mustaqil so'rovlar uchun mavjud.

### Sinov hisobi — FAQAT dev rejimida

`src/components/LoginForm.tsx` da email va parol oldindan
to'ldirilgan. `process.env.NODE_ENV` qurish paytida matn bilan
almashtirilgani uchun ishlab chiqarish qurilmasida butun shox
o'chib ketadi. **Tekshirilgan:** `next build` dan keyin
`.next/static` va `.next/server` da email TOPILMADI.

---

## 8. «Фарқ» ishorasi — buxgalteriya qoidasiga keltirildi (2026-08-16)

Ilgari uch joyda uch xil edi. Endi bitta qoida:

> **Farq = DEBET − KREDIT** (ya'ni sof saldo), har ikkala sverkada.

| Sverka | Hisob | Debet | Kredit | Farq |
|---|---|---|---|---|
| **Chiqim** | 6010, **passiv** (yetkazib beruvchi) | to'langan pul | kelgan faktura | **to'lov − faktura** |
| **Kirim** | 4010, **aktiv** (xaridor) | yozilgan faktura | tushgan pul | **faktura − to'lov** |

Natijada ma'no ikkala tomonda BIR XIL bo'ladi:
**musbat = ular qarzdor · manfiy = biz qarzdormiz.**

**Nima o'zgardi.** Chiqim tomoni allaqachon to'g'ri edi. Ikki joy
tuzatildi:

1. `/excel-audit` ro'yxati `credit − debit` hisoblardi — butun tizimga
   teskari. Endi `/korxonalar` da `tolov − faktura`.
2. Kirim sverkasi `bankCredit − facturaSent` hisoblardi, ya'ni
   **o'zining Akt sverkisiga teskari**: `aktSverki.ts` («Сальдо
   конечное», etalon PDF bilan qatorma-qator mos) doim
   `facturaSent − bankCredit` bo'lib kelgan. Bitta ekranda ikkita
   qarama-qarshi ishora turardi.

Tegilgan: `incomeParser.ts` (3 joy), `incomeExcel.ts` (4 joy),
`KirimSverka.tsx`, `korxonalar/page.tsx`. **58 ta tekshiruv o'tdi** —
harness `difference` ni faqat yig'adi, ishoraga da'vo qilmaydi.

**Rang ishoraga emas, MA'NOga bog'langan** (ikkala sverkada bir xil):
`bad` — PUL yetishmayapti (qarz) · `warn` — QOG'OZ yetishmayapti
(faktura yozish/so'rash kerak).

---

## 9. O'lchangan kontrast xatolari (2026-08-16)

Brauzerda `getComputedStyle` bilan o'lchangan, taxmin emas. Sahifada
223 ta matn elementi supurildi — hozir yorug' va tungi rejimda **0 ta
xato**, eng past nisbat 4,68:1.

| Joy | Nima edi | O'lchov | Yechim |
|---|---|---|---|
| `Highlight` yorlig'i (qo'llanma) | `bg-mark text-white` | tungi **2,69:1** | `--mark-fg` tokeni: yorug'da oq, tungida to'q |
| Animatsiyadagi ✓/✗ | `bg-ok/bg-bad text-white` | tungi **1,92 / 2,69:1** | `--fill-fg` tokeni |
| Til ro'yxati, tanlangan qator | `text-accent` | tungi **2,37:1** | `text-accent-ink` (7,47) |
| Til ro'yxati, qisqa belgi | `opacity-60` | yorug' **2,88:1** | `text-ink-3` (5,43) |
| «Tez kunda» kartalari | `opacity-80` | **3,53:1** | shaffoflik olib tashlandi |

**Umumiy sabab bitta:** tungi rejimda `--ok`, `--bad`, `--mark`,
`--accent` OCHroq variantga o'tadi — ustidagi oq yozuv yiqiladi.
Shuning uchun **to'ldirilgan** belgining yozuvi uchun alohida token
kerak. Shaffoflik esa kontrastni har doim buzadi: sustlashtirish
`opacity` bilan emas, RANG bilan qilinadi.

**O'lchash haqida eslatma.** Brauzer paneli yopiq bo'lsa
`IntersectionObserver` va `transition` ishlamaydi: `Reveal` bo'limlari
`opacity:0` da qoladi va `transition-colors` bo'lgan element eski
rangda qotib turadi. O'lchashdan oldin:
`* { transition: none !important } [style*="opacity"] { opacity: 1 !important }`.
Aks holda mavjud bo'lmagan xato «topiladi» (shu sessiyada 4 tasi
aynan shunday soxta chiqdi).

---

## 10. O'chirilgan fayllar (2026-08-16)

Hammasi tekshirilgan: hech qayerdan import qilinmagan yoki
hozirgi qoidalarda ishlamaydi. Kod git tarixida qoladi.

| Fayl | Sabab |
|---|---|
| `src/app/excel-audit/companies/page.tsx` | `workspaceId` siz so'rov (qoidalar RAD etadi), klientdan `addDoc` (`create: false`), mavjud bo'lmagan `/companies/{id}` havolasi |
| `src/app/astatka/page.tsx` + `api/calculate-astatka/` | `ASTATKA_ENABLED = false` ortida edi |
| `src/components/FileUpload.tsx` | import qiluvchi yo'q, `/api/upload` route'i mavjud emas |
| `src/lib/excelParser.ts` | import qiluvchi yo'q (`detectCategory`, `parseHamkorbank` — o'lik) |
| `src/components/ComingSoon.tsx` | eski bosh sahifa bilan birga keraksiz qoldi |
| `src/app/favicon.ico` | o'rniga `src/app/icon.svg` (brend belgisi) |

---

## 11. Bu sessiyada tegilgan fayllar (2026-08-16)

**Yangi:** `src/lib/brand.ts`, `src/components/Brand.tsx`,
`src/components/AppShell.tsx`, `src/components/ui/Module.tsx`,
`src/components/sverka/{ChiqimSverka,KirimSverka}.tsx`,
`src/components/landing/Sections.tsx`, `src/app/icon.svg`,
`src/app/korxonalar/{layout,page}.tsx`, `src/app/korxonalar/[id]/page.tsx`,
`src/app/{login,qollanma}/layout.tsx`.

**O'zgargan:** `src/app/page.tsx` (to'liq qayta yozildi),
`src/app/{layout,globals.css}`, `src/app/{login,qollanma}/page.tsx`,
`src/lib/{incomeParser,incomeExcel,bankStatements}.ts`,
`src/lib/i18n/index.ts`, `src/context/AuthContext.tsx` (tiplandi),
`src/components/ui/{Modal,PageHeader,index}.ts(x)`,
`src/components/{LanguageToggle}.tsx`,
`src/components/guide/{Guide,Annotate,SverkaAnimation}.tsx`,
`src/app/api/admin/create-user/route.ts`, `next.config.ts`,
`.claude/launch.json`.

**Commit holati:** katta qismi `b4ab63c "big changes"` da. Undan
keyin qilingan tuzatmalar (kontrast tokenlari `--fill-fg` / `--mark-fg`,
`LanguageToggle`, `AppShell` ajratilishi, `login`/`qollanma` uchun
`layout.tsx`, shu hujjatning o'zi) hali commit qilinmagan.

### Tekshiruv holati (2026-08-17)

```
node scripts/verify-parsers.cjs   ->  58/58 ✔
npx tsc --noEmit                  ->  toza
npx eslint src --max-warnings=0   ->  toza
npx next build                    ->  xatosiz, 20 ta ochiq sahifa statik
lug'at qamrovi                    ->  92,4% (qolgani tarjimasiz narsalar)
brauzer:
  · 4 til ham to'g'ri <html lang> va tarjima bilan ochiladi
  · 10 ta manzil yo'naltirishi, /xyz -> 404
  · hreflang × 5, canonical, sitemap 20 URL, robots
  · JSON-LD: Organization+WebSite+SoftwareApplication, FAQPage(8), Breadcrumb
  · kontrast: /uz/pricing va /ru/features — 0 xato (yorug' + tungi)
  · login dev prefill ishlaydi; email ishlab chiqarish bundle'ida YO'Q
```

`/[locale]/clients` va `/[locale]/clients/[id]` brauzerda
**sinalmagan** — ular login ortida, parol esa endi bor
(`webleaders.uz@gmail.com`), lekin jonli Firestore sinovi hali
qilinmagan.

---

## 12. Gidratsiya xatosi — TUNGI REJIMDA HAR SAHIFADA (2026-08-17)

Shikoyat «til almashtirsam xato chiqadi» edi. O'lchash ikkita
**alohida** xatoni ochdi va ikkinchisi jiddiyroq bo'lib chiqdi.

### 12a. Asosiy xato: `ThemeToggle` server bilan klientda BOSHQA
### narsa chizardi

```
useState(() => typeof window !== "undefined" &&
               document.documentElement.classList.contains("dark"))
```

Serverda `window` yo'q → `false` → **Moon** belgisi.
Klientda tungi rejim yoqiq → `true` → **Sun** belgisi.

Ikkitasi boshqa SVG, ya'ni **tuzilma** mos kelmasdi. Natijada:

> Hydration failed because the server rendered HTML didn't match
> the client.

React butun daraxtni klientda QAYTA chizardi. Ўlchangan oqibat:
DOM **ikkilanardi** — sahifada ikkita `<main>`, ikkita `header`,
ikkita JSON-LD blok.

`suppressHydrationWarning` buni YASHIRMAYDI: u faqat elementning
O'Z atributi/matni uchun, ichidagi tuzilma uchun emas. Tugmada u
turgan edi, lekin foyda bermagan.

**Qachondan beri:** tungi rejim yoqilgan har qanday sahifa
yuklanishida. Ilgari sezilmagan, chunki konsol tungi rejimda
tekshirilmagan.

**Yechim** (`src/components/ThemeToggle.tsx`): React holati
BUTUNLAY olib tashlandi. Ikkala belgi ham har doim chiziladi,
qaysi biri ko'rinishini CSS hal qiladi:

```tsx
<Moon className="h-4 w-4 dark:hidden" />
<Sun  className="hidden h-4 w-4 dark:block" />
```

Holat yagona haqiqiy manbada — `<html>` elementining sinfida.
Server va klient AYNAN bir xil HTML chiqaradi.

**Tasdiq:** tungi rejim + toza yuklash → 0 ta konsol xatosi;
`<main>` va `header` bittadan.

### 12b. Ikkinchi xato: til almashganda `<script>` qayta yaratiladi

Ildiz layout `[locale]` segmenti ichida. Til almashsa manzilning
birinchi bo'lagi o'zgaradi va React butun daraxtni qayta montaj
qiladi — layout'dagi tema skriptini **klientda yaratishga**
urinadi. Brauzer JS orqali qo'shilgan inline skriptni bajarmaydi,
shuning uchun React xato yozadi.

**Sinalgan va YIQILGAN ikki yo'l** (takrorlamang):

| Yo'l | Nega yiqildi |
|---|---|
| Skriptni klient komponentiga chiqarish | React `<script>` ni **gidratsiya qilmaydi** — har doim yangidan yaratadi. Natija: butun DOM ikkilandi |
| `next/script` `strategy="beforeInteractive"` | App-router'da u ham aynan o'sha `<script>` elementini chizadi (`next/dist/client/script.js`) — xato o'zgarmaydi |
| Cookie'dan o'qib `<html class>` ga qo'yish | `cookies()` layout'ni DINAMIK qiladi → 20 ta statik sahifa yo'qoladi |

**Qabul qilingan yechim:** til almashinuvi endi **to'liq sahifa
yuklashi** (`window.location.assign`), `router.push` emas —
`src/context/LanguageContext.tsx`.

Buning narxi YO'Q, chunki o'lchandi: yumshoq o'tishda ham
`<main>` va `<header>` DOM tugunlari YANGIDAN yaratilardi, ya'ni
komponent holati (yuklangan fayl, o'qilgan hisobot) `router.push`
da ham saqlanmasdi.

### 12c. Yo'l-yo'lakay: tema endi tizim sozlamasini ham biladi

Skript avval faqat `localStorage` ni o'qirdi. Endi: saqlangan
tanlov USTUN, u yo'q bo'lsa `prefers-color-scheme`. Ya'ni OS'da
tungi rejim yoqilgan odam birinchi kirishdayoq to'g'ri rangda
ko'radi.

---

## 13. Dizayn qatlami — material (2026-08-17)

Rang o'qlari, kontrast qiymatlari va atamalar TEGILMADI. Qo'shilgani —
**shrift, chuqurlik va o'lchov**.

| Nima | Qayerda | Izoh |
|---|---|---|
| **Inter** (o'zgaruvchan) | `layout.tsx` + `globals.css` | `latin` + `latin-ext` + `cyrillic` + `cyrillic-ext`. Ilgari har OS o'z shriftini chizardi |
| `--shadow-1/2/3` | `globals.css` | Uch pog'ona. Tungida soya ko'rinmaydi → yuqori qirrada `inset` yorug' chiziq |
| `--text-display`, `--text-title` | `globals.css` | `clamp()` bilan: telefonda 36px, katta ekranda 64px |
| `--radius-xl`, `--radius-2xl` | `globals.css` | FAQAT ochiq sahifalarning yirik sirtlari uchun |
| `.glass`, `.grid-bg`, `.lift`, `.sheen` | `globals.css` | Shapka, hero foni, karta ko'tarilishi |
| `.brand-gradient(-text)` | `globals.css` | Logotipning AYNAN ikki rangi: `--invoice` → `--cash` |
| `Card` da `elevation` propi | `ui/Card.tsx` | Quyidagi tuzoqqa qarang |
| `AppFrame` | `landing/Sections.tsx` | Hero animatsiyasi «dastur oynasi» ramkasida |

### Uchta tuzoq va ular qanday yopilgani

1. **`--font-inter` ni `:root` da ishlatib bo'lmaydi.** `next/font`
   sinfi `<body>` da (`<html>` da tema skripti bilan to'qnashardi).
   Maxsus xossa **e'lon qilingan joyda** hisoblanadi, ya'ni
   `:root { --ui-font: var(--font-inter), ... }` yozilsa u yerda
   `--font-inter` bo'sh bo'lib, BUTUN qiymat yaroqsiz bo'lardi.
   Shuning uchun oraliq o'zgaruvchi yo'q — ro'yxat `body` da
   to'g'ridan-to'g'ri yozilgan.

2. **`@theme inline` o'zgaruvchini `:root` ga CHIQARMAYDI.**
   `--font-sans` ni faqat o'sha yerda yozib qo'yish ishlamadi:
   `var(--font-sans)` bo'sh chiqdi.

3. **`globals.css` dagi sinf Tailwind utilitasidan KUCHLI.**
   U qatlamsiz (`@layer` siz), shuning uchun `.elev { box-shadow }`
   `shadow-2` yozilgan kartani ham 1-pog'onaga tushirardi
   (brauzerda o'lchangan). Balandlik shuning uchun `className`
   orqali emas, `Card` ning `elevation` propi orqali beriladi.

### Bu sessiyadagi o'lchov

```
kontrast (yorug' + tungi, /uz, /uz/pricing, /uz/features,
          /uz/guide, /uz/login):        203 element, 0 xato
eng past nisbat (tungi bosh sahifa):    5,44:1
gorizontal siljish (1280 va 375 px):    yo'q
til almashinuvi (tungi rejim):          0 ta konsol xatosi
`<main>` / `<header>` soni:             1 / 1  (ilgari 2 / 2)
```

**Diqqat: bu sessiyada SKRINSHOT olinmagan** — brauzer paneli
yopiq edi (`Browser pane is not displayed`), shuning uchun barcha
tekshiruv `getComputedStyle`, `getBoundingClientRect` va DOM
o'qish orqali qilingan. Rasm bilan ko'rish hali kerak.
