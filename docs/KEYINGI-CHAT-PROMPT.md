Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi.
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

---

## 0. BOSHLASH

```
node scripts/verify-parsers.cjs   →  151/151
node scripts/check-contrast.cjs   →  70/70 (35 yorug' + 35 tungi)
npx tsc --noEmit                  →  toza
npx eslint src --max-warnings=0   →  toza
npx next build                    →  xatosiz
```

Bittasi yiqilsa — **MENGA AYT**, o'zing "tuzatib" ketma.
Chuqurroq: `HANDOFF.md` (texnik ma'lumotnoma), `MAHSULOT-QARORLARI.md`
(nima uchun shunday qilingan), `AGENTS.md`.

---

## 1. HOLAT (2026-08-25)

Oxirgi kommit `dad6cf8`, `origin/master` bilan teng — jonli `moslik.uz`
da o'sha versiya turibdi. **Undan keyin 35 ta fayl o'zgargan
(28 tuzatilgan + 7 yangi), kommit qilinmagan.**

### Kommit qilingani (jonli)

Dizayn tizimi «hisob qog'ozi» (Golos Text + Literata + IBM Plex Mono,
iliq palitra, radius 2–8px), shaxsiy ma'lumot saytdan olib tashlangan,
`/clients` ish stoli ikkala yo'nalishni ko'rsatadi, marshrutlar
birlashtirilgan, sitemap Search Console'ga yuborilgan (32 URL, «Успешно»).

### Kommit qilinmagani (mahalliy)

**Tarif modeli almashtirildi.** Bepul reja endi **oyiga 3 ta sverka**,
korxona soni cheklanmaydi. Sanoq birligi — **ko'chirma egasi (STIR yoki
hisob raqami) × davr oyi**. Sabab: eski «3 ta korxona» cheklovi
ushlamasdi (hammasini bitta korxonaga yig'ib bepul ishlash mumkin edi),
«saqlangan hisobot» ham ushlamasdi (Excel yuklab olib ketiladi).
Kod: `src/lib/plans.ts`, `src/lib/sverkaQuota.ts`, ikkala tahlil
marshruti, `QuotaWall.tsx`. To'liq sabab —
`MAHSULOT-QARORLARI.md` → «Narx va cheklov (2026-08-25 da QAYTA KO'RILDI)».

**404 va xato sahifasi qo'shildi:** `[locale]/not-found.tsx`,
`[locale]/error.tsx`, `global-error.tsx` va `[locale]/[...rest]/page.tsx`.
Oxirgisi shart: mos kelmagan manzil ILDIZDAGI `not-found` ni qidiradi,
ildiz maket esa `[locale]/layout.tsx`.

**Dizayn tizimidagi UCH ta jimgina xato tuzatildi** (hammasi bir oila —
umumiy sinf qatoriga qattiq yozilgan qiymatni chaqiruvchi bekor qila
olmasdi):
- `fieldClasses` dagi `w-full` → `<Select className="w-auto">` va
  `<Input className="w-44">` to'liq kenglikda chiqardi;
- `tableCls.th` dagi `text-left` → `<Th align="center">` ishlamasdi;
- `Button` `iconOnly` da bolasini tashlardi → o'chirish tugmasi jadvalda
  BO'SH kvadrat bo'lib turardi.

**Brauzer dialoglari ketdi:** uchta `confirm()` o'rniga `ConfirmDialog`.
`Modal` ga fokus qulfi, ichki aylanish va **stek** qo'shildi (modal
ustiga modal ochilganda Escape faqat tepadagisini yopadi).
`FileDrop` endi haqiqatan fayl tashlashni qabul qiladi.

---

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

1. **Kommit + deploy** — 35 fayl. Kommitdan oldin `git status` ni QAYTA
   o'qi (egasi parallel kommit qilgan bo'lishi mumkin).
   Firestore qoidalarini deploy qilish **shart emas**: yangi
   `sverka_usage` kolleksiyasini umumiy «qolgani yopiq» qoidasi shundoq
   ham klientdan yopadi, serverda esa admin SDK ishlaydi.
2. **Kirim sverkasining ichki qismlari** — tuzilishi hali ko'rilmagan
   (chiqim tomoni 2026-08-25 da ko'rildi). `OpenInvoices`, filtr
   qatorining o'ralishi ham shu yerda.
3. **To'lov yo'li** — 1-noyabrgacha kerak. Hozir hamma hisob bepul
   rejada, saytning o'z matni ham shuni aytadi.
4. **Firebase Blaze** ($9,09 qarz) — SMS bilan kirish umuman ishlamaydi.
5. Search Console: bosh sahifa uchun «Запросить индексирование».

**Egasi «tursin» degani (tegilmaydi):** `Hamkorbank` belgisi,
`counterpartyCategory.ts` dagi STIR→nom jadvali, `docs/pitch-deck.html`,
kirish sahifasidagi demo email/parol (hakamlar tekshirishi uchun),
`test-project.webleaders.uz`, qo'llanmadagi namuna ekranlar
(hozirgisi yetadi — ular jonli komponentlardan yasalgan, PNG emas).

---

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
