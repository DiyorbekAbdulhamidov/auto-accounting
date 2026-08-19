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

### 2. UI ni qayta qurish — 4-bosqich QAYTA O'YLANADI, 5-bosqich QOLDI

- **1) lug'at** ✅ (2026-08-13)
- **2) dizayn tizimi** ✅ (2026-08-15) — `globals.css` tokenlari,
  `src/components/ui/` da 21 komponent
- **3) chiqim va kirim bitta sahifada** ✅ (2026-08-16) —
  `/korxonalar/[id]`, `ModuleScope` bilan rang tabga bog'landi
- **4) natija ekrani** ❌ — yasaldi va RAD ETILDI (14-bo'lim). Yig'ma
  panel ekranga qatlam qo'shdi, javob qo'shmadi. To'g'ri savol:
  «qaysi faktura yopilmagan» — `docs/TAHLIL-2026-08-18.md`, 3-bo'lim
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

**2026-08-18: skript UCH joyda buzilgan edi va HECH QACHON ishlamagan.**
Tuzatildi, keyin haqiqiy bazada ishlatildi:

1. `.env.local` ni o'qirdi — loyihada esa `.env` bor. «Muhit
   o'zgaruvchilari yo'q» deb chiqib ketardi. Endi ikkalasini ham
   sinaydi.
2. `admin.credential.cert` / `admin.firestore()` — eski API.
   O'rnatilgani **firebase-admin v14**, unda bu yo'q
   («Cannot read properties of undefined (reading 'cert')»). Modulli
   kirish nuqtalariga o'tkazildi (`lib/app`, `lib/firestore`).
3. `income_reports` va `opening_balances` ni sanamasdi — ular yangi,
   lekin «bo'sh bo'lishi kerak» degan taxminni TEKSHIRISH kerak: egasiz
   hujjat bo'lsa deploy'dan keyin jimgina yo'qoladi.

Ko'rish rejimi endi mavjud `workspaceId` qiymatlarini ham chiqaradi —
ega kimligini taxmin qilish emas, ma'lumotning o'zidan o'qish uchun.

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

---

## 14. Natija paneli — YASALDI VA OLIB TASHLANDI (2026-08-18)

Bu bo'lim bajarilgan ishni emas, **qaytarilgan qarorni** yozib qo'yadi.
Sabab: bir xil g'oya keyingi sessiyada yana taklif qilinishi mumkin.

### Nima qilindi

UI 4-bosqich rejasi bo'yicha (`MAHSULOT-QARORLARI` §3) ikkala sverka
uchun bitta `ResultPanel.tsx` yasaldi: tepada «N ta kontragentda farq
bor» + farq summasi, ostida uch guruh (pul yetishmayapti · hujjat
yetishmayapti · mos keldi), keyin eng katta 5 ta farq ro'yxati.

Panel brauzerda uch holatda o'lchandi (vaqtinchalik `/dev-preview`
sahifasi orqali, keyin o'chirildi):

```
kontrast (yorug' + tungi, 1280 va 375 px):  94 element, 0 xato
eng past nisbat:                            yorug' 4,96:1 · tungi 5,71:1
gorizontal siljish · konsol:                yo'q · toza
raqamlar (7 kontragent, 5 farq):            67 570 180,15 = qo'lda hisob
```

### Nega olib tashlandi

Ikki bosqichda rad etildi:

1. **Jadval yig'iladigan qilingandi** (`tableOpen`, standart yopiq).
   Javob: «murakkablashib ketyapti, tahlildan keyin jadval **darhol**
   ko'rinishi kerak». Yig'ish olib tashlandi.
2. **Panelning o'zi ham rad etildi:** «natija paneli chalg'ityapti».

Ikkalasi ham o'rinli va bitta sababga ega: **panel yangi ma'lumot
bermasdi, faqat mavjud raqamni boshqacha ko'rsatardi.** «Nechta
kontragentda farq bor» allaqachon uchta `StatCard` ostida va jadval
tepasidagi qatorda yozilgan edi. Ya'ni panel ekranga qatlam qo'shdi,
javob qo'shmadi.

### Nima saqlanib qoldi (g'oya sifatida)

Panelning o'zi kerak emas, lekin ichidagi bitta qoida **to'g'ri** edi va
kelajakda kerak bo'ladi:

> Kontragentlarni farq ISHORASI bo'yicha emas, `verdict()` qaytargan
> TON bo'yicha guruhlash kerak: `bad` = pul yetishmayapti,
> `warn` = hujjat yetishmayapti.

Sabab 8-bo'limda: chiqimda musbat farq `warn`, kirimda esa `bad`. Ishora
bo'yicha guruhlansa bitta komponent ikkita sverkada TESKARI natija
beradi. Bu brauzerda tasdiqlandi: bir xil 7 qator chiqimda 3/2, kirimda
2/3 bo'lib taqsimlandi.

### Xulosa — takrorlanmasin

- Yig'ma ko'rsatkichni ko'rsatish uchun **mavjud narsani yashirish shart
  emas**. Yashirish qadam qo'shadi, olmaydi.
- Bu foydalanuvchi ortiqcha qatlamni tez sezadi. Yangi UI taklif
  qilishdan oldin savol: **bu qadam qo'shyaptimi yoki olyaptimi?**
- Buxgalterga kerak bo'lgan narsa yig'indini chiroyli ko'rsatish emas —
  **qaysi hujjat yetishmayotganini aytish**. Tahlil:
  `docs/TAHLIL-2026-08-18.md`, 3-bo'lim, 1-o'rin.

Kod git tarixida qoladi (`ResultPanel.tsx`).

---

## 15. Kod nomlari inglizchaga o'tkazildi (2026-08-18)

Talab: kod nomlari standart inglizcha bo'lsin. **UI matnlari,
`t()` kalitlari va o'zbekcha izohlarga TEGILMADI** — ular
arxitektura qarori (2-bo'lim).

### O'zgargan fayl va papkalar

| Eski | Yangi |
|---|---|
| `src/components/sverka/` | `src/components/reconciliation/` |
| `ChiqimSverka.tsx` | `OutgoingReconciliation.tsx` |
| `KirimSverka.tsx` | `IncomingReconciliation.tsx` |
| `Natija.tsx` (bugun yaratilgan) | `ResultPanel.tsx` |
| `guide/SverkaAnimation.tsx` | `guide/ReconciliationAnimation.tsx` |
| `lib/aktSverki.ts` | `lib/reconciliationAct.ts` |

### O'zgargan identifikatorlar

`Yonalish`→`Direction`, `natijaRows`→`resultRows`,
`korxona*`→`company*`, `boshqa*`→`other*`, `aktParty`→`actParty`,
`buildAktWorkbook`→`buildReconciliationActWorkbook`,
`Akt{Payment,Invoice,Party,Options}`→`Act…`,
`Faktura{Layout,Row,Result}`→`Invoice…`, `isAktSverki`→`isReconciliationAct`,
`SverkaReport(Doc)`→`ReconciliationReport(Doc)`.
Lokal UI holat qiymatlari: `"KORXONA"/"BOSHQA"`→`"COMPANY"/"OTHER"`,
`"NO_FACTURA"`→`"NO_INVOICE"`, `"SVERKA"` tab→`"RECONCILIATION"`.

Yo'l-yo'lakay: `Tabs` ning `actions` propi endi hech qayerda
ishlatilmaydi (Excel tugmasi sarlavhaga ko'chdi) — o'chirildi.

### ATAYLAB TEGILMAGAN — sababi bilan

Bular **Firestore'da saqlanadi yoki tashqariga chiqadi**, ya'ni
nomni o'zgartirish migratsiyasiz ma'lumotni «yo'qolgandek»
qiladi — bu loyihaning eng qimmat xatosi (jimgina xato):

| Nima | Qayerda | Nega tegilmadi |
|---|---|---|
| `sverka_reports` kolleksiyasi | Firestore | Nomi o'zgarsa saqlangan hisobotlar topilmaydi |
| `Category`: `korxona`/`kommunal`/`byudjet`/`bank`/`xizmat` | Firestore hujjatlarida | Buxgalterning QO'LDA belgilagan toifasi yo'qoladi |
| `CategorySource`: `standart`/`seed`/`user` | Hisobot ichida | Yuqoridagi bilan bir juft |
| `FormatKind`: `BANK`/`FAKTURA`, format teglari (`AKT_SVERKI`, `SVODKA`, `TANILMADI`, `IPOTEKA_ASBT`…) | Format xotirasi (Firestore) + parser | O'rganilgan shakllar bog'lanishi uziladi |
| `ЧИҚИМ`/`CHIQIM`/`KIRIM` regexlari | `universalParser.ts` | Parser kalit so'zlari — bank faylining O'ZIDAGI matn |
| `Chiqim_sverka_*.xlsx`, `Akt_sverki_*.xlsx` fayl nomlari | Excel eksport | Buxgalter ko'radigan artefakt; ustiga `isOwnExportSheet()` o'z hisobotini SARLAVHA matni bo'yicha taniydi |
| `/korxonalar` eski manzili | `proxy.ts` | Tashqi havola, yo'naltirish uchun kerak |

Shularni ham inglizcha qilish kerak bo'lsa — **avval migratsiya
skripti** (`scripts/migrate-*.cjs`), keyin kod. Tartib 5a-bo'limdagi
bilan bir xil sababga ega.

### Tekshiruv holati (2026-08-18)

```
node scripts/verify-parsers.cjs   ->  58/58 ✔
npx tsc --noEmit                  ->  toza
npx eslint src --max-warnings=0   ->  toza
npx next build                    ->  xatosiz, 39 sahifa (marshrutlar o'zgarmadi)
```

---

## 16. Kirim saqlash · qoldiq · yopilmagan faktura · akt · portfel (2026-08-18)

Beshta ish ketma-ket bajarildi. Har biri o'lchov bilan yopilgan.

### 16a. Kirim sverkasi endi SAQLANADI (1-ish)

Ilgari sahifa yangilansa hamma narsa yo'qolardi (`companyId` propi ham
yo'q edi). Endi `income_reports` kolleksiyasi va `IncomingReconciliation`
da saqlash/tiklash bor.

**ALOHIDA kolleksiya — sabab muhim.** `sverka_reports` ga `kind`
maydoni qo'shilsa, eski hujjatlarda u YO'Q va Firestore
`where('kind','==','out')` so'roviga maydoni yo'q hujjatni
QO'SHMAYDI — chiqim tomonining butun tarixi jimgina yo'qolgandek
bo'lardi.

Hajm oldindan o'lchanadi (900 KB chegara): Firestore hujjati 1 MB dan
oshmaydi, uning o'z xatosi esa tushunarsiz. Ekranda «Сақланган
ҳисобот: <sana>» belgisi turadi — buxgalter eski raqamni yangi deb
o'qimasligi uchun.

Korxona o'chirilganda IKKALA kolleksiya ham tozalanadi.

### 16b. Kontragent bo'yicha boshlang'ich qoldiq (2-ish)

Yangi: `src/lib/openingBalance.ts`, `OpeningBalanceModal.tsx`,
`opening_balances` kolleksiyasi. Ikkala sverkada ham bor.

**Eng muhim qaror: qoldiq DAVR FARQIGA QO'SHILMAYDI.** «Фарқ» ustuni
shu davrda nima bo'lganini ko'rsatadi va shundayligicha qoladi —
68 ta tekshiruv shunga tayanadi. Qoldiq alohida ustunda turadi va
yakuniy qoldiqni beradi:

```
yakuniy qoldiq = boshlang'ich qoldiq + o'tgan davr + davr farqi
```

Ustunlar FAQAT qoldiq kiritilgan bo'lsa ko'rinadi — bo'sh ustun
jadvalni kengaytiradi, foyda bermaydi.

Akt sverkiga ham uzatiladi: kiritilgan bo'lsa qiymat, kiritilmagan
bo'lsa hujjat ostiga «сальдо начальное киритилмаган» izohi.

### 16c. «Qaysi faktura yopilmagan» (3-ish)

Yangi: `OpenInvoices.tsx`. Ikkala sverkada, qator ochilganda ENG
TEPADA turadi (oyma-oy kesimdan oldin).

Yangi hisob YO'Q — `aging.ts` allaqachon FIFO bilan hisoblardi, faqat
ekranga chiqmasdi. Chiqim tomonida to'lov va faktura bitta ro'yxatda
bo'lgani uchun moslashtiruvchi yozildi (`credit > 0` → faktura,
`debit > 0` → to'lov).

**Harness'ga invariant qo'shildi:**

```
sum(outstanding) − advance = kredit − debet
```

Ya'ni «shu fakturalar yopilmagan» ro'yxati jadvaldagi «Фарқ» bilan
AYNAN bir xil narsani aytadi. Haqiqiy faylda 35 ta kontragentda mos
keldi.

### 16d. Chiqim tomonida Akt sverki (4-ish)

`ActParty` maydonlari NEYTRAL nomga o'tkazildi: `debitDocs` /
`creditDocs` / `debitTotal` / `creditTotal`. Sabab: rollar ikki
sverkada TESKARI (kirimda faktura — debet, chiqimda to'lov — debet).
Maydon «invoices» deb atalganda chiqim tomonida unga TO'LOV
uzatilishi kerak bo'lardi — bu ertami-kechami xato.

Akt chiqishi o'zgarmadi — eksport qilib, qatorma-qator tekshirildi.

### 16e. Mijozlar ro'yxatida holat (5-ish)

Yangi ustun: «✓ ҳаммаси мос» yoki «N тасида фарқ», ostida oxirgi
sverka sanasi. Ma'lumot allaqachon yuklanadigan hisobot ichida
(`firmsData`), ya'ni qo'shimcha so'rov YO'Q.

«Nechtasida farq bor» ENG SO'NGGI hisobotdan olinadi, yig'indidan
emas — bitta kontragent ikkita hisobotda ikki marta sanalardi.

### 16f. Reja cheklovi va audit izi (6-ish, qisman)

- **Cheklovga yetganda** endi qizil xato emas, tushuntirish va
  «Кўпроқ керак» tugmasi. Bosilgani `plan_interest` ga yoziladi —
  bu TALAB O'LCHOVI, to'lov ulanmasidan oldin kerak.
- **Audit izi:** toifani kim va qachon o'zgartirgani allaqachon
  yozilardi (`updatedBy`/`updatedAt`), lekin ekranga chiqmasdi. Endi
  toifa tanlovining tooltip'ida ko'rinadi.

### Tekshiruv

```
verify-parsers   68/68 ✔   (yangi: davr kelishuvi 7, yopilmagan faktura 3)
tsc · eslint     toza
next build       xatosiz, 39 sahifa
kontrast         56 element, 0 xato · yorug' 4,96 · tungi 5,71
akt              eksport qilib qatorma-qator tekshirildi
```

### QOLGANI (6-ishdan)

| Ish | Holat |
|---|---|
| Hisobot tarixi (bazada bor, ekranda yo'q) | ✔ §17a |
| Kontragentlarni qo'lda birlashtirish | ✔ §17b |
| Ish maydoniga a'zo taklif qilish | ✔ §17c |
| Ekran testlari (test yuruvchisi ham yo'q) | ❌ |
| Parol tiklash | ❌ (ataylab — foydalanuvchi so'ramadi) |

### ⚠️ DEPLOY QILISHDAN OLDIN → ✅ BAJARILDI (§17d ga qara)

`firestore.rules` ga UCHTA yangi kolleksiya qo'shildi:
`income_reports`, `opening_balances`, `plan_interest`.
**Qoidalar deploy qilinmasa, saqlash ishlamaydi** (ruxsat rad etiladi):

```bash
firebase deploy --only firestore:rules
```

Bu safar migratsiya KERAK EMAS — uchala kolleksiya ham yangi, eski
ma'lumot yo'q.

---

## 17. Hisobot tarixi · birlashtirish · jamoa (2026-08-18, ikkinchi qism)

Uchta ish. Har biri o'lchov bilan yopilgan.

### 17a. Hisobot tarixi (1-ish)

Ilgari saqlangan hisobotlardan faqat ENG SO'NGGISI ochilardi va
eskilarini na ko'rish, na o'chirish mumkin edi.

Yangi: `src/lib/reportHistory.ts`, `ReportHistory.tsx`. Ikkala
sverkada ham, yopiq holda turadi.

**Qo'shimcha so'rov YO'Q.** Tiklash effekti allaqachon HAMMA hujjatni
yuklab olardi (`getDocs` + klientda saralash) va ichidan bittasini
tanlardi — qolgani tashlanardi. Endi o'sha snapshot ro'yxatga
aylanadi. Ya'ni tarix Firestore'dan bitta ham qo'shimcha o'qish
talab qilmaydi.

**O'chirish esa o'sishning o'zini to'xtatadi:** har «Сақлаш» YANGI
hujjat yaratadi (900 KB gacha), 20 marta saqlangan korxonada bu har
sahifa ochilishida o'nlab megabayt demakdir. `HISTORY_SOFT_LIMIT = 20`
dan oshsa ekranda ogohlantirish chiqadi.

**Yo'l-yo'lakay topilgan ikkita nuqson:**

1. Chiqim tomonida «Сақланган ҳисобот: <sana>» belgisi YO'Q edi —
   kirim tomonida bor edi. Ya'ni buxgalter saqlangan eski raqamni
   yangi deb o'qishi mumkin edi. Qo'shildi.
2. `firestore.rules` da hisobot `delete` faqat adminga ochiq edi,
   `clients/page.tsx` esa korxonani o'chirganda uning hisobotlarini
   `writeBatch` bilan o'chiradi. Batch bitta amal rad etilsa
   BUTUNLAY yiqiladi — **admin bo'lmagan foydalanuvchi korxonasini
   umuman o'chira olmasdi.** Qoida a'zoga ochildi.

### 17b. Kontragentlarni birlashtirish (2-ish)

Yangi: `src/lib/counterpartyMerge.ts`, `MergeModal.tsx`,
`/api/counterparty-merge`, `companies/{id}/counterparty_merges`.

Muammo — SOXTA FARQ. Bitta firma bankda «МЧЖ "ИМАНМАКС"», fakturada
«IMANMAX MCHJ» bo'lsa, tizim ikki kontragent ko'radi: birida faqat
to'lov, ikkinchisida faqat faktura. Ikkalasi ham katta farq
ko'rsatadi. Yig'indi to'g'ri bo'lgani uchun buni na «Итого», na
qoldiq tenglamasi sezadi.

**Parserga TEGILMADI.** Birlashtirish `auditFiles` / `analyzeIncome`
dan KEYIN, alohida qadam. Sabab: parser 93 ta regress tekshiruvi
bilan qoplangan. Birlashtirish esa faqat qatorlarni qo'shadi —
yig'indi o'zgarmaydi, ya'ni `totals` va `categoryTotals` shundayligicha
to'g'ri qoladi.

**Avtomatik EMAS.** Tizim faqat TAKLIF qiladi (bir xil STIR yoki bir
xil normal nom), qaror buxgalterniki. Ikki har xil firmani jimgina
bir qilib qo'yish soxta farqdan ham qimmatroq xato.

**Topilgan jimgina xato (o'z kodimda):** birlashgan qator toifasini
guruhning BIRINCHI uchragan qatoridan olardi. Ya'ni «kommunal» deb
belgilangan a'zo butun guruhni asosiy sverkadan chiqarib yuborishi
mumkin edi — bir bosishda millionlar jadvaldan yo'qolardi. Endi nom,
STIR va TOIFA har doim ASOSIY qatordan olinadi (`applyIdentity`),
tartibdan qat'i nazar. Harness'da tekshiriladi.

**Nom o'zagi (`normalizeName`)** — faqat TAKLIF uchun, ekranga
chiqmaydi. O'zbek kirilli (ў, қ, ғ, ҳ) ham kiradi. Lotin «x» ikki xil
o'qiladi: «ТЕХНО»/«TEXNO» (h) va «ИМАНМАКС»/«IMANMAX» (кс) — shuning
uchun h, ks va x uchalasi bitta belgiga keltiriladi.

**Ajratish faylni QAYTA YUKLASHNI talab qiladi** — birlashgan qatorda
oylik kesim allaqachon qo'shilib ketgan. Bu foydalanuvchiga aytiladi.

Yangi invariantlar (harness):

```
sum(totalDebit) va sum(totalCredit) O'ZGARMAYDI
bitta ham o'tkazma yo'qolmaydi (418 ta)
oylik kesim ham yig'iladi
toifa/nom/STIR ASOSIY qatordan
guruh yo'q bo'lsa massiv TEGILMAYDI (aynan o'sha havola)
```

### 17c. Ish maydoniga a'zo taklif qilish (3-ish)

Yangi: `/api/workspace/members`, `src/components/TeamModal.tsx`,
mijozlar sahifasida «Жамоа» tugmasi.

«Бюро» rejasi 5 foydalanuvchi va'da qiladi, lekin odam qo'shish yo'li
umuman yo'q edi — ya'ni o'sha rejani SOTIB BO'LMASDI. Ma'lumot modeli
(`workspaces/{id}/members/{email}`) 2026-08-13 dan beri tayyor turardi.

**Taklif PAROLSIZ:**

1. Ega email kiritadi.
2. `allowed_users/{email}` OLDINDAN yaratiladi, unga `workspaceId`
   yoziladi.
3. Odam odatdagidek ro'yxatdan o'tadi. Signup route
   `resolveWorkspaceId` ni chaqiradi, u TAYYOR `workspaceId` ni
   ko'radi va YANGI ish maydoni OCHMAYDI.

Ya'ni bir martalik havola, muddat, elektron xat — hech biri kerak
emas. Parol hech qachon ko'rilmaydi va yaratilmaydi.

**Chiqarish:** `members/{email}` o'chiriladi — Firestore qoidasi
(`isMember`) aynan shu hujjatga tayanadi, ruxsat DARHOL yopiladi.
Odamning `workspaceId` maydoni ham tozalanadi, aks holda u o'qiy
olmaydigan ish maydoniga ishora qilib osilib qolardi.

**Qat'iy shartlar:** faqat EGA boshqaradi; egani chiqarib bo'lmaydi;
boshqa ish maydonidagi odamni jimgina tortib olib bo'lmaydi (uning
o'z mijozlari ko'rinmay qolardi).

Signup route'ga bitta qo'shimcha: taklif qilingan odam kirganda
a'zolik maqomi «invited» dan «active» ga o'tadi. Ataylab shu yerda —
`resolveWorkspaceId` har so'rovda chaqiriladi, unga yozish qo'shilsa
har API chaqiruvi qo'shimcha yozuv qilardi.

### Tekshiruv (2026-08-18, ikkinchi qism)

```
verify-parsers   93/93 ✔   (yangi: birlashtirish 22 ta)
tsc · eslint     toza
next build       xatosiz, 41 marshrut (39 + 2 yangi API)
kontrast         44 element · yorug' 0 xato (eng past 4,84)
                              tungi  0 xato (eng past 5,53)
```

Kontrast vaqtinchalik `/[locale]/dev-preview` sahifasida o'lchandi va
sahifa o'chirildi (marshrut soni tasdiqlandi).

**TeamModal alohida o'lchanmadi** — u faqat mavjud va allaqachon
o'lchangan boshlang'ich elementlardan (Modal, Alert, Badge, Button,
Input) tuzilgan, o'z sinfi yo'q.

### 17d. Jonli qoidalar holati o'lchandi (2026-08-18)

Console'dagi HAQIQIY qoidalar olinib solishtirildi. Natija: jonli
qoidalar **2026-08-13 dan OLDINGI** versiya — ish maydoni egaligi
umuman yo'q. `isMember()`, `myWorkspace()`, `workspaces`,
`income_reports`, `opening_balances`, `plan_interest` — hech biri
jonli bazada yo'q.

Sababi ham topildi: `firebase-tools` tokeni **2023-yil avgustda**
muddati o'tgan (`expires at: 1692128489669`, refresh → 400). Ya'ni
CLI'dan deploy uzoq vaqtdan beri umuman bo'lmagan.

Shu sabab hozirgi holatda:
- har bir `allowed_users` foydalanuvchisi BARCHA korxona va chiqim
  hisobotini o'qiy oladi (egalik tekshirilmaydi);
- kirim sverkasini saqlash, boshlang'ich qoldiq, «Ko'proq kerak» —
  ruxsat rad etiladi («Missing or insufficient permissions»).

`.firebaserc` ham yo'q edi (CLI qaysi loyiha ekanini bilmasdi) —
yaratildi: `auto-accounting-diyorbek-s`.

**Migratsiya BAJARILDI** (2026-08-18, `--apply webleaders.uz@gmail.com`):
1 korxona + 2 chiqim hisoboti egasiz edi, uchalasiga `workspaceId`
qo'yildi. Qayta tekshiruv: egasiz hujjat **0**. Ikkala ish maydoni
hujjati va a'zolik yozuvi ham mavjud, ya'ni `isMember()` deploy'dan
keyin ishlaydi.

Tekshirilgan xavflar (ikkalasi ham TOZA):
- repo qoidasi `companies` `create` ni klientga yopadi — kod korxonani
  faqat `/api/companies` orqali yaratadi (reja cheklovi uchun shunday);
- klient `workspaces` ni to'g'ridan-to'g'ri o'qimaydi.

### ✅ DEPLOY BAJARILDI (2026-08-18)

Tartib to'liq bajarildi:

1. `.firebaserc` yaratildi (`auto-accounting-diyorbek-s`) — yo'q edi.
2. `firebase login --reauth` — token 2023-yildan buzuq edi.
3. `node scripts/migrate-workspaces.cjs --apply webleaders.uz@gmail.com`
   → 3 ta egasiz hujjatga `workspaceId` qo'yildi, qayta tekshiruvda
   egasiz **0**.
4. `firebase deploy --only firestore:rules` → `released rules`.
5. Birinchi deploy `Unused function: myWorkspace` deb ogohlantirdi —
   o'lik yordamchi olib tashlandi va qayta deploy qilindi, ogohlantirish
   YO'Q. Sabab izohda: egalik HUJJATNING O'ZIDAN tekshiriladi,
   foydalanuvchi hujjatidan emas.

Ya'ni jonli qoidalar endi repo fayliga TENG. Ish maydoni egaligi,
`income_reports`, `opening_balances`, `plan_interest`, `workspaces` va
hisobot `delete` — hammasi kuchda.

**Qolgan bloker faqat bitta:** jonli sinov. Kod endi ishlashi KERAK,
lekin bitta ham amal haqiqiy sessiyada o'tkazilmagan.

`counterparty_merges` uchun qoida KERAK EMAS — u `companies/{id}`
ostidagi subkolleksiya va faqat Admin SDK (API route) orqali
o'qiladi/yoziladi. Klient uchun umumiy `match /{document=**}` yopiq
qoidasi amal qiladi (toifalar bilan bir xil naqsh).


---

## 18. Ochilish rejasi: bepul davr · jurnal · SMS bilan kirish (2026-08-18)

Reja: **1 sentabrga to'liq tayyor**, 1 sentabr → 1 noyabr **bepul va
cheksiz**, faqat ro'yxatdan o'tish shart.

### 18a. Bepul davr — bitta konstanta

`src/lib/plans.ts`: `PROMO_UNTIL = '2026-11-01T00:00:00+05:00'`.
`limitsOf()` davr ichida `companies` va `members` ni `Infinity` qiladi.

**Nega reja maydoni EMAS:** har foydalanuvchiga rejani qo'yish uchun
admin paneli, keyin qaytarib olish uchun yana bir amal kerak bo'lardi.
Davr global — sana bitta joyda turadi va tugagach O'ZI tugaydi.

**Nega 2 OY, 1 emas:** buxgalter sverkani OYDA BIR MARTA qiladi. Bir
oylik davrda tsikl bir marta bajariladi — bu sinov, odat emas. O'lchov
savoli «ikkinchi oyda ham qaytadimi»; ikkinchi oy pulli bo'lsa,
«yordam bermagani uchun ketdi» bilan «pulli bo'lgani uchun ketdi» ni
ajratib bo'lmaydi.

**Davr tugaganda ma'lumot YASHIRILMAYDI** — tekshirildi: cheklov FAQAT
`/api/companies` POST da qo'llanadi, o'qishda filtr yo'q. 12 korxona
yuklagan buxgalter 1 noyabrdan keyin ham hammasini ko'radi, faqat
13-chisini qo'sha olmaydi.

Vaqt mintaqasi ataylab yozilgan: server UTC, Toshkent +05:00 —
ko'rsatilmasa davr besh soat oldin tugardi. Harness shu chegarani
tekshiradi.

**Narx sahifasiga ta'sir qilmadi:** `limitsOf()` faqat cheklovni
qo'llash uchun, marketing sahifalari `PLANS` ni to'g'ridan-to'g'ri
o'qiydi. ⚠️ Ya'ni narx sahifasida hali «3 та корхона» turadi —
e'londa «cheksiz» deyilsa, sahifa matnini ham yangilash kerak.

### 18b. Yiqilgan fayl jurnali (`parse_failures`)

Yangi: `src/lib/parseFailureLog.ts`, ikkala yuklash route'ida.

Muammo: fayl o'qilmasa foydalanuvchi xato ko'rib KETADI, biz esa
bilmaymiz. `excel_formats` faqat MUVAFFAQIYATLI o'rganilgan
shakllarni saqlaydi — tizim g'alabalarini eslaydi, mag'lubiyatlarini
yo'q. 10+ buxgalter, har biri o'z bankining shakli bilan: notanish
shakl deyarli aniq chiqadi.

Yoziladi FAQAT: varaq tanilmadi, yoki fayl tasdiqlanmadi, yoki bitta
ham kontragent chiqmadi. Muvaffaqiyatli yuklashda hech narsa
yozilmaydi — aks holda kolleksiya har yuklashda o'sardi.
Ogohlantirishning O'ZI sabab emas (davr mos kelmasligi —
foydalanuvchi xatosi, parser yiqilishi emas).

**SUMMALAR yozuvga tushmaydi** — harness alohida tekshiradi. Jurnalning
vazifasi «qaysi SHAKL tanilmadi», «qancha pul» emas. Yozuv ish
maydoniga bog'langan va faqat server o'qiydi, ya'ni yangi ma'lumot
oqimi yaratilmaydi (`sverka_reports` da allaqachon to'liq moliyaviy
tafsilot turadi).

`SheetReport` ga `sampleRows` qo'shildi: tanilmagan varaqning
dastlabki 5 qatori × 15 katagi. Bu «qaysi shakl» savoliga javob
beradigan YAGONA artefakt — usiz jurnal «yiqildi» deyishdan boshqa
hech narsa aytolmaydi. Qo'shimcha maydon, hech qanday raqamga
tegmaydi (105 → 115 tekshiruv o'tdi).

Qoidalar fayliga band QO'SHILMADI: klient bu kolleksiyaga tegmaydi.

### 18c. SMS (telefon) bilan kirish

**Parol tiklash BEKOR QILINDI** — SMS'da parol yo'q, demak «parolni
unutdim» holati ham yo'q.

**Nega bu kichik o'zgarish emas:** telefon autentifikatsiyasida
`request.auth.token.email` NULL bo'ladi. Ilgari qoidalar unga
to'g'ridan-to'g'ri tayanardi, ya'ni telefon bilan kirgan odamda
`isAllowed()` false qaytarib **butun ilova hamma narsani rad etardi**.

**Yechim — `authKey()`:** email bo'lsa email, bo'lmasa
`phone_number`. Qoida UCH joyda AYNAN bir xil bo'lishi shart va
bittadan manba oladi:

| Joy | Nima |
|---|---|
| `firestore.rules` | `authKey()` funksiyasi |
| server | `apiAuth.ts`, `signup/route.ts` → `accountKeyOf()` |
| klient | `AuthContext.tsx` → `accountKeyOf()` |

`accountKeyOf()` — `src/lib/workspace.ts` da. Biri farq qilsa server
bir hujjatni, qoidalar boshqasini tekshiradi va sababi ko'rinmaydi.

**Email USTUN:** bir hisobga ikkalasi bog'langan bo'lsa kalit
o'zgarmaydi va mavjud hujjatlar joyida qoladi. Shu sabab
`webleaders.uz@gmail.com` va `admin@gmail.com` ishlashda davom etadi.

**Uid'ga o'tilmadi** — u toza bo'lardi, lekin mavjud ma'lumotni
migratsiya qilishni talab qiladi. 13 kun ichida bunga kirishilmadi.

**Qoidalar DEPLOY QILINDI** (ikkala kalitni qabul qiladi). Tartib
muhim edi: qoidalar avval — shunda telefon foydalanuvchisi qulflanib
qolmaydi.

Boshqa o'zgarishlar:
- `AuthUser.email` endi IXTIYORIY, `accountKey` qo'shildi. Audit izi
  (`updatedBy`, `createdBy`, `addedBy`, `invitedBy`) `accountKey` ni
  yozadi. **Bu shart edi:** Firestore `undefined` qiymatga istisno
  tashlaydi, ya'ni telefon foydalanuvchisi toifani o'zgartirsa amal
  yiqilardi.
- `resolveWorkspaceId` va `defaultWorkspaceName` kalit bilan ishlaydi
  (telefonda `@` yo'q — raqam shundayligicha nom bo'ladi).
- Telefonda RO'YXATDAN O'TISH alohida amal EMAS: Firebase raqamni
  birinchi ko'rganda hisobni o'zi ochadi, shuning uchun kod
  tasdiqlangach har doim `/api/signup` chaqiriladi (idempotent).
- **Xato bo'lsa hisob O'CHIRILMAYDI** (email oqimidan farqi):
  telefon hisobi QAYTA KELGAN foydalanuvchiga tegishli bo'lishi
  mumkin, o'chirish uning butun ma'lumotini yo'q qilardi.
- Yiqilgan `RecaptchaVerifier` tozalanadi — aks holda keyingi urinish
  ham yiqilardi.
- `src/lib/phone.ts`: `toE164()` beshta yozuv shaklini bitta kalitga
  keltiradi. Bu MUHIM — raqam hisob kaliti, «+998901234567» va
  «998901234567» ikki xil hisob bo'lib qolsa odam ma'lumotini
  topolmaydi.

### ⚠️ SMS ISHLASHI UCHUN FIREBASE CONSOLE'DA QILINADIGAN ISHLAR

Kod tayyor, lekin bulardan biri qilinmasa SMS ketmaydi:

1. **Authentication → Sign-in method → Phone → yoqish.**
   Yoqilmasa xato: `auth/operation-not-allowed` — ekranda o'zbekcha
   izoh chiqadi va aynan shu joyni ko'rsatadi.
2. **Billing (Blaze).** Telefon autentifikatsiyasi odatda pulli reja
   talab qiladi.
3. **Test phone numbers** — Console'da sinov raqami qo'shilsa
   (masalan `+998901234567` / kod `123456`) butun oqimni HAQIQIY SMS
   yubormasdan tekshirib bo'ladi. **Sinovni shu bilan qiling** —
   begona raqamga kod jo'natish kerak emas.
4. **Authorized domains** — ishlab chiqarish domeni qo'shilsin.
   Unutilsa jonli saytda login JIMGINA ishlamaydi.
5. **+998 ga SMS yetib borishini** tasdiqlash. Yetib bormasa zaxira
   yo'l — mahalliy shlyuz (Eskiz.uz) + Firebase custom token, lekin
   u OTP oqimini o'zimiz yozishni talab qiladi.

### Tekshiruv (2026-08-18, uchinchi qism)

```
verify-parsers   124/124 ✔   (yangi: bepul davr 12, jurnal 10, telefon 9)
tsc · eslint     toza
next build       xatosiz, 41 marshrut
kirish sahifasi  brauzerda o'lchandi (u OCHIQ sahifa):
                 · telefon → kod → email zaxira o'tishlari ishlaydi
                 · yaroqsiz raqam klientda ushlanadi
                 · kontrast: yorug' 5,43 · tungi 6,29 · 0 xato
```

Sinov ATAYLAB SMS yubormasdan o'tkazildi — haqiqiy raqamga kod
jo'natish begona odamga xabar yuborish bo'lardi.

**Yo'l-yo'lakay tuzatilgan soxta signal:** `LoginForm.tsx` izohi
qurilmada `12345678` ni qidirishni aytardi, u esa polyfill ichidagi
`"0123456789"` matniga tushib SOXTA moslik beradi. Ishonchli belgi —
dev EMAIL: `grep -rl "webleaders.uz@gmail.com" .next/static` hech
narsa topmaydi (tasdiqlandi).


### 18d. Narx matni · superadmin telefoni · sessiya muddati (2026-08-18)

**Narx sahifasi.** Yangi `PromoBanner.tsx`. Reja KARTALARI o'zgarmadi —
ular doimiy haqiqatni ko'rsatadi (1 noyabrdan keyin nima bo'lishini),
e'lon esa hozir nima bo'layotganini aytadi. Ikkisi bir ekranda turadi,
shunda noyabrda hech kim «aldandim» demaydi. FAQ va bosh sahifadagi
qator ham yangilandi.

Gidratatsiya tuzog'i ataylab chetlab o'tildi: shart JSX ichida EMAS
(`promoActive() && <div>` yozilsa, 1 noyabrdan oldin qurilgan statik
sahifa serverda e'lonni chizadi, keyin ochilgan brauzer chizmaydi —
HANDOFF §12 dagi bilan bir xil xato). HTML har doim bir xil chiziladi,
qaror gidratatsiyadan KEYIN DOM'da qo'llanadi. Yon foydasi: davr
tugaganda e'lon o'zi yo'qoladi, qayta deploy kutilmaydi.

Tekshirildi: qurilgan statik HTML'da e'lon TO'RTTALA tilda ham bor
(`.next/server/app/{uz,uz-cyrl,ru,en}/pricing.html`).

**Superadmin telefoni.** `+998900104240` MAVJUD hisobga bog'landi
(`webleaders.uz@gmail.com`, uid `5ZdRolReWc…`), almashtirilmadi.

Sabab: email — hisob KALITI, unga 3 korxona va 3 hisobot bog'langan.
Kalit o'zgarsa hammasi yetim qolardi. Endi hisobda ikkala usul bor
(`phone, password`), `authKey()` esa emailni ustun ko'radi — ya'ni SMS
bilan kirilganda ham AYNAN o'sha ish maydoniga tushiladi.

Xavfsizlik to'ri: agar token ichida email negadir bo'lmasa, kalit
telefon bo'lib bo'sh ish maydoni ochiladi — ma'lumot O'CHMAYDI va
email+parol bilan qaytib kirsa bo'ladi. Ya'ni bu qadam qaytariladigan.

**Sessiya muddati.** Kodda `setPersistence` YO'Q, ya'ni Firebase
standarti amal qiladi: `browserLocalPersistence`. Demak bitta SMS
bilan kirgan odam **muddatsiz** kirgan bo'lib qoladi — ID token har
soatda o'zi yangilanadi, brauzer yopilsa ham saqlanadi. Sessiya faqat
shu hollarda tugaydi: «Чиқиш» bosilsa, brauzer ma'lumoti tozalansa,
hisob o'chirilsa/bloklansa yoki token bekor qilinsa.

Ya'ni buxgalter oyiga bir marta kirsa ham qayta SMS so'ralmaydi —
bu ochilish davri uchun to'g'ri xulq (har oyda SMS so'ralsa,
qaytish yo'lida ortiqcha to'siq bo'lardi va SMS puli ham ketardi).


### 18e. SMS mintaqa siyosati — Console'da UCHINCHI joy (2026-08-18)

Telefon provideri yoqilgan, sinov raqami qo'shilgan, `Save` kulrang
(saqlanmagan o'zgarish yo'q) — lekin ilova baribir
`auth/operation-not-allowed` berardi.

Sabab Firebase'ning O'ZIDAN so'rab aniqlandi. Klient SDK boradigan
endpoint'ga to'g'ridan-to'g'ri murojaat qilindi:

```
POST identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode
  { phoneNumber: "+998901234567" }        (Console'dagi SINOV raqami)
->
  OPERATION_NOT_ALLOWED : SMS unable to be sent until this region
                          enabled by the app developer.
```

Ya'ni provider EMAS, **SMS mintaqa siyosati** to'sayotgan edi:
Firebase qaysi davlatlarga SMS yuborilishini alohida ro'yxat bilan
cheklaydi va O'zbekiston ruxsat etilmagan.

**Joyi:** Authentication -> **Settings** -> SMS region policy.
`Sign-in method` yorlig'ida EMAS — shuning uchun topilmadi.

Bu usul umuman foydali: telefon oqimini brauzersiz, SMS yubormasdan
tekshirib bo'ladi (sinov raqami ishlatilsa hech kimga xabar ketmaydi).
Javoblar: `OPERATION_NOT_ALLOWED` — provider yoki mintaqa;
`MISSING_RECAPTCHA_TOKEN` — provider yoqilgan, brauzerda ishlaydi;
`sessionInfo` — hammasi joyida.

**Xato xabari tuzatildi:** `operation-not-allowed` IKKI sababdan keladi
va Firebase ikkalasiga ham bir xil kod beradi. Ilova endi ikkalasini
ham aytadi, aks holda foydalanuvchi noto'g'ri joyni qidiradi.


### 18f. Telefon tokenida `email` KALITI YO'Q — qoidalar rad etardi (2026-08-18)

SMS ishladi, kod qabul qilindi, `/api/signup` hujjatlarni yaratdi —
lekin foydalanuvchi «Missing or insufficient permissions» xatosini
oldi. Xato Firestore SDK'niki, ya'ni AUTENTIFIKATSIYADAN KEYINGI
o'qish rad etilardi.

**Sabab o'lchandi, taxmin qilinmadi.** Sinov raqami bilan haqiqiy
token olindi va ichi ochildi:

```
{ phone_number: "+998901234567",
  firebase: { sign_in_provider: "phone", identities: {phone:[...]} },
  sub, user_id, aud, iss, iat, exp }

'email' kaliti BORMI : false          <-- bo'sh satr EMAS, UMUMAN YO'Q
```

Qoidadagi `request.auth.token.email` mavjud bo'lmagan kalitga nuqta
bilan murojaat qiladi — Firestore qoidalarida bu XATO beradi va butun
qoida RAD ETADI. Klientdagi `email || phone` esa buni bemalol
o'tkazadi. Ya'ni men o'zim ogohlantirgan «uch joy bir xil bo'lsin»
qoidasi aynan shu yerda buzilgan edi: mantiq bir xil ko'rinardi,
lekin YO'Q KALIT holatida ikki tilda ikki xil ishlaydi.

**Tuzatish:** `request.auth.token.get('email', '')`. Standart qiymat
`''` (null emas) — shunda mantiq klientdagi `email || phone` bilan
AYNAN bir xil bo'ladi.

**Tekshirildi (haqiqiy token bilan, deploy'dan keyin):**

| Amal | Natija |
|---|---|
| Telefon: o'z `allowed_users` hujjatini o'qish | 200 RUXSAT |
| Telefon: begona hujjatni o'qish | 403 RAD |
| Telefon: o'z ish maydoni korxonalari | 200, 0 ta |
| Telefon: begona ish maydoni korxonalari | 403 RAD |
| Email: kalit EMAIL bo'lib qoldi | ✔ |
| Email: korxonalar | 200, 3 ta |
| Email: chiqim hisobotlari | 200, 3 ta |

Ya'ni tuzatish teshik ochmadi va email yo'li ham buzilmadi.

**YO'L-YO'LAKAY TASDIQLANDI:** parol bilan kirilgan tokenda
`phone_number` da'vosi ham bor edi (`sign_in_provider: password`).
Demak Firebase da'volarni HISOB YOZUVIDAN oladi, kirish usulidan emas.
Teskarisi ham amal qiladi: superadmin SMS bilan kirganda tokenda EMAIL
ham bo'ladi va `authKey()` uni ustun ko'rib o'sha ish maydoniga
tushiradi. Bu endi taxmin emas, o'lchangan.

### Brauzersiz tekshirish usuli (juda foydali chiqdi)

Identity Toolkit REST API klient SDK bilan aynan bir xil yo'ldan
boradi, ya'ni butun oqimni brauzersiz va SMS'siz sinash mumkin:

```
accounts:sendVerificationCode   -> sessionInfo (sinov raqamida SMS YO'Q)
accounts:signInWithPhoneNumber  -> idToken
firestore.googleapis.com/...    -> qoidalar HAQIQIY token bilan sinaladi
accounts:signInWithPassword     -> email yo'li regressiyasi
```

Skriptlar sessiya scratchpad'ida. Qoidalarga har tegilganda shuni
yurgizish kerak — 200/403 raqamlari «ishlashi kerak» degan gapdan
ancha ishonchli.


### 18g. Haqiqiy SMS uchun Blaze SHART (2026-08-18)

Sinov raqami bilan hammasi ishladi, haqiqiy raqam esa
`auth/billing-not-enabled` berdi. Bu xato EMAS: Spark (bepul) rejada
Firebase haqiqiy SMS umuman yubormaydi. Sinov raqamlari ishlayveradi —
ular SMS yubormaydi.

**Ya'ni 1 sentabr uchun kritik yo'lga YANA BITTA band qo'shildi:**
domen + hosting + **Blaze rejasi**. Blazesiz bitta ham haqiqiy
buxgalter tizimga kira olmaydi.

Ikkita amaliy xulosa:

1. **Ishlab chiqish uchun Blaze KERAK EMAS** — sinov raqamlari yetadi.
   O'z hisobingizga hozir email+parol bilan kiravering.
2. **Xarajat:** har SMS pullik. Sessiya muddatsiz bo'lgani uchun
   (§18d) taxminan «bitta foydalanuvchi × bitta qurilma = bitta SMS»,
   ya'ni oyma-oy takrorlanmaydi. Lekin Blaze yoqilganda Google Cloud'da
   BYUDJET OGOHLANTIRISHI qo'yilsin — telefon autentifikatsiyasi
   suiiste'molga ochiq va hisob kutilmaganda o'sishi mumkin.

Agar +998 uchun narx qimmat chiqsa, zaxira yo'l o'zgarmaydi: mahalliy
shlyuz (Eskiz.uz) + Firebase custom token. Lekin unda OTP oqimi —
kod yaratish, muddat, urinish cheklovi — bizning zimmamizda bo'ladi.

**Superadmin SMS bilan kirishi Blazesiz sinalmaydi**, lekin natija
allaqachon DALIL bilan ma'lum (§18f): parol tokenida `phone_number`
bor edi, demak da'volar hisob yozuvidan olinadi va SMS tokenida email
ham bo'ladi.


### 18h. Kirish yo'llari almashtirildi: EMAIL asosiy (2026-08-18)

Sabab amaliy: hakamlar/mijozlar tez orada tizimni ko'radi, SMS esa
Blaze'ga bog'liq (§18g). Email+parol hech qanday tashqi shartga
bog'liq emas.

- `useState<Step>("email")` — boshlang'ich qadam. Blaze yoqilgach
  teskarisiga o'tkazish uchun SHU BITTA qatorni o'zgartirish yetadi.
- Telefon yo'li olib tashlanmadi — pastdagi havolada qoldi.

**Oldindan to'ldirish endi sozlanadi.** Ilgari u faqat
`NODE_ENV === "development"` da ishlardi va deploy'da maydonlar bo'sh
chiqardi — ya'ni ko'rsatishda foyda bermasdi. Endi:

```
NEXT_PUBLIC_DEMO_EMAIL
NEXT_PUBLIC_DEMO_PASSWORD
```

Qo'yilmasa — dev rejimida eski sinov hisobiga qaytadi, ishlab
chiqarishda to'ldirish umuman bo'lmaydi. Tekshirildi: qurilgan
`.next` ichida hisob ma'lumoti YO'Q.

⚠️ **`NEXT_PUBLIC_` qiymati brauzerga yuboriladi va uni sahifa
manbasidan o'qish mumkin — ya'ni MAXFIY EMAS.** Shu sabab bu yerga
superadmin hisobi QO'YILMASIN: saytni ochgan har kim haqiqiy mijoz
ma'lumotiga to'liq kira olardi. Alohida ko'rsatuv hisobi kerak —
o'z ish maydoni va namuna ma'lumoti bilan.

Belgi matni ham o'zgardi: «Синов режими» emas, «Кўрсатув учун
маълумотлар олдиндан тўлдирилган — «Тизимга кириш»ни босинг».
