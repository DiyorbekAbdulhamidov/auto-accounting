Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi.
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

---

## 0. BOSHLASH

```
node scripts/verify-parsers.cjs   →  142/142
node scripts/check-contrast.cjs   →  70/70
npx tsc --noEmit                  →  toza
npx eslint src --max-warnings=0   →  toza
npx next build                    →  xatosiz
```

Bittasi yiqilsa — **MENGA AYT**, o'zing "tuzatib" ketma.
Chuqurroq: `HANDOFF.md`, `MAHSULOT-QARORLARI.md`, `AGENTS.md`.

---

## 1. HOLAT (2026-08-24)

**33 ta fayl o'zgargan, HECH BIRI kommit qilinmagan.** `origin/master` = `8b50b8f`.
Jonli `moslik.uz` da hali ESKI versiya turibdi — butun dizayn ishi faqat mahalliy.

Ikki sessiya davomida qilingan ish:

**Shaxsiy ma'lumot saytdan olib tashlangan** — karta raqami, F.I.Sh., ma'lumotnoma
№, shaxsiy telefon/pochta, faoliyat manzili. Ochiq turgani: `Moslik`, `moslik.uz`,
`@webleaderscontactbot`. To'lov endi bot orqali (karta ekranga chiqmaydi).
`public/presentation.html` → `docs/presentation-2025.html` ko'chirilgan (ichida
uch kishining ismi bor edi, ochiq URL'da turardi).

**Namuna firma nomlari shartli:** SAMO SAVDO · NAVRO'Z MEBEL · ORIENT TEXNIKA ·
BARKAMOL QURILISH · ZAMIN LOGISTIKA · NUR PLASTIK · `ZIYO SAVDO.xls`.
Kommunal ohangdagi nom ISHLATILMAYDI (egasi rad etdi).

**Dizayn tizimi — «hisob qog'ozi»:**
* Shrift: Inter → **Golos Text** (interfeys) + **Literata** (`.text-display`,
  `.text-title`) + **IBM Plex Mono** (faqat `.tabular` — RAQAM).
* Palitra: sovuq slate → iliq qog'oz (`--page #f4f2ed`, `--surface #fffdfa`,
  `--ink #17150f`); tunda iliq qora.
* Radius 6–24px → **2–8px**. Soya 1-pog'onada deyarli yo'q.
* Fon — SHAKL emas, MATERIAL: `.paper` (qog'oz donadorligi + yorug'lik) +
  `.brand-field`. To'r, varaq chiziqlari va ulkan brend belgisi SINALDI va
  RAD ETILDI («fonga narsa qo'yilgan» — egasi uchalasini ham rad etdi).
* `SumStrip`/`SumCell` — uch-to'rt ko'rsatkich uchun `StatCard` EMAS.
* Yuklanish — aylanma emas, `Skeleton`/`TableSkeleton`/`progress-track`.
* Tema — uch holat (qurilma/yorug'/tungi), ro'yxatdan tanlanadi, jonli kuzatiladi.
* ТСС — `<details>`, 200ms pastga tushib ochiladi. `FaqItem` uchta joyda bitta.
* Imkoniyatlar — **bento varaq** (`gap-px` + `bg-line`), ikkita katakda jonli
  ko'rgazma. Rо'yxat ham, ikonkali karta ham RAD ETILGAN.
* «Qo'lda / Moslik» — qator bo'yicha yuzma-yuz jadval. Yo'l xaritasi — vaqt chizig'i.
* Navbar qayta yozilgan; **telefonda havolalar umuman yo'q edi** — tuzatilgan.
* Kirish sahifasi — bitta markazlashgan forma (ikkiga bo'lingan ekran RAD ETILGAN).

**Ish stoli (`/clients`):** `/api/reports/summary` endi IKKALA kolleksiyani
(`SVERKA_REPORTS` + `INCOME_REPORTS`) parallel o'qiydi. Tepada yo'nalish
tugmasi (Чиқим/Кирим) — uchala son ham bitta manbadan. Jadvalda «Кирим фарқи»
ustuni va so'z bilan HOLAT (`Биз қарздормиз` / `Фактура олиш керак` /
`Бизга қарздор` / `Аванс тушган` / `Ҳаммаси мос`). Jadvalning o'ziga TEGILMAGAN.

**Qo'llanma:** namuna ekranlar jonli mahsulotdan ko'chirilgan (o'qish hisoboti
endi JADVAL, natija jadvali haqiqiy ustunlar bilan), qizil belgilar joyida.

---

## 2. XAVFSIZLIK — SESSIYADA YUZ BERGAN HODISA

Egasi qo'llanmaga **haqiqiy ekran suratlarini** so'radi. Brauzer asbobi rasmni
faylga saqlab bera olmaydi, shuning uchun ekranni Windows orqali olishga
urinildi — va **surat Chrome emas, Telegram oynasini oldi**: begona odamlarning
ismi va telefon raqamlari tushdi. Rasm darhol o'chirildi, skriptlar ham
o'chirildi.

**QOIDA: ish stoli/ekranni suratga olish TAQIQLANADI.** Chrome fokusda ekani
kafolatlanmaydi. Rasm kerak bo'lsa — egasi o'zi olib beradi.

---

## 3. NAVBATDAGI ISH

1. **Kommit + deploy** — 33 fayl. Kommitdan oldin `git status` ni QAYTA o'qi
   (egasi parallel kommit qilgan bo'lishi mumkin).
2. **Vercel'dan `NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD` ni
   o'chirish + parolni almashtirish.** Login prefill ATAYLAB qoldirilgan —
   hakamlar tekshirishi uchun. Egasi qachon olib tashlashni o'zi biladi.
3. **test-project.webleaders.uz ni yopish.**
4. **Firebase Blaze**: $9,09 qarz → Reopen → telefon bilan kirish o'zi ishlaydi.
   Hozir SMS UMUMAN ishlamaydi.
5. Search Console: sitemap + indekslash so'rovi.
6. UI'da qolgani: ish ekranlarining ICHKI qismlari (modallar, hisobot tarixi,
   `OpenInvoices`, filtr paneli) — yangi shrift/rang/burchakni olgan, lekin
   tuzilishi ko'rilmagan. Admin sahifasi ataylab tegilmagan.

**Egasi «tursin» degan uchta narsa (tegilmaydi):** `Hamkorbank` belgisi,
`counterpartyCategory.ts` dagi STIR→nom jadvali, `docs/pitch-deck.html`.

---

## 4. BUZILMAYDIGAN QOIDALAR

* Bu **Next.js 16** — kod yozishdan OLDIN `node_modules/next/dist/docs/` ni o'qi.
* **Workflow / subagent — MEN so'ramagunimcha ISHLATMA.**
* **Ekran/ish stolini suratga OLMA** (2-bo'limga qara).
* `src/lib/` dagi kirill matnlar parser kalitlari — TEGILMAYDI (`ИТОГО`, `ПАССИВ`).
* Parserga (`auditFiles`/`analyzeIncome`) tegilmaydi.
* «Акт сверки» — ekran va Excel bir xil raqam bersin.
* «Фарқ» = debet − kredit, ikkala sverkada.
* Birlashtirish PUL YO'QOTMAYDI.
* Raqamni "to'g'rilash" uchun qo'lda tuzatma qo'shilmaydi — sabab topiladi.
* **HISOB KALITI** uch joyda AYNAN bir xil: `firestore.rules` `authKey()`,
  server (`apiAuth.ts`, `signup/route.ts`), klient (`AuthContext.tsx`).
* `t()` kaliti = KIRILL matnning O'ZI. Dublikat kalit `tsc` ni yiqitadi.
* Huquqiy matnlar (`legal.ts`) va SEO (`seo.ts`) `t()` dan O'TMAYDI.
* Havola qo'lda yozilmaydi: `path(...)` / `clientPath(...)`.
* **`.tabular` FAQAT RAQAM uchun.** Ichida `word-spacing: -0.22em` bor — so'z
  qo'yilsa oralig'i yo'qoladi («1,37 mlrd» → «1,37mlrd» bo'lgan).
* Yangi UI qadam QO'SHMASIN; mavjud jadval bekitilmaydi.
* Rang tokeni o'zgarsa — `node scripts/check-contrast.cjs`.
* Har o'zgarishdan keyin: `verify-parsers` → `check-contrast` → `tsc` →
  `eslint` → `build`.

---

## 5. TUZOQLAR

**Next / Vercel:**
* `next build` ni dev-server ishlab turganda ISHLATMA — `.next` umumiy.
  Davosi: dev'ni to'xtat → `.next` ni o'chir → qayta qur → dev'ni qayta yur.
* **Turbopack keshi buziladi.** Dev-server `Internal Server Error` +
  `JSON.parse` xatosi bersa, kodda ayb yo'q: `.next` VA
  `node_modules/.cache` ni o'chirib qayta yur (2026-08-24 da yuz bergan,
  o'sha payt `next build` bemalol o'tayotgan edi).
* `NEXT_PUBLIC_*` qurishda singdiriladi → qo'shgach QAYTA DEPLOY.
* `@theme inline` dagi o'zgaruvchi `:root` ga CHIQMAYDI — CSS qoidasida
  `var(--font-serif)` bo'sh bo'lib qoladi. To'g'ridan-to'g'ri
  `var(--font-literata)` yozilgan.
* CSS o'zgarishi dev-serverda ba'zan yetib bormaydi — `globals.css` ga bo'sh
  qator qo'shib "turtki" berilади, keyin sahifa yangilanadi.

**Firestore / skript:**
* `.env` qiymatlari QO'SHTIRNOQ ichida — skript o'qiganda ularni olib tashla,
  aks holda admin SDK boshqa loyihaga ulanadi va **jimgina** «topilmadi» deydi.
* `FIREBASE_PRIVATE_KEY` da `\n` haqiqiy qatorga aylantiriladi.
* `firebase-admin` v14: modulli kirish (`lib/app`, `lib/firestore`, `lib/auth`).

**Sinov (login ortidagi ekran):**
* Sinov hisobi yaratiladi va oxirida bazadan O'CHIRILADI (superadmin paroli
  bilan KIRILMAYDI). Tozalash skripti: auth user + `allowed_users` +
  `workspaces` + `workspaceId` bo'yicha hujjatlar.
* Ro'yxatdan o'tish ~10 soniya oladi — darhol tekshirsang «bo'lmadi» deb
  ko'rinadi, aslida bo'lgan bo'ladi.
* Fayl yuklash: `fetch` bilan blob olib, `DataTransfer` orqali
  `input.files` ga qo'yiladi. Vaqtinchalik fayl `public/` ga qo'yilib, oxirida
  O'CHIRILADI.
* **Sinov faylidagi haqiqiy nomlar anonimlashtiriladi** — nom va STIR IKKALA
  faylda bir xil qoida bilan almashtirilsa, sverka baribir mos keladi.
* Element qidirganda `id` ishlat (`#company-name`, `#company-inn`).
  `confirm()` ishlamaydi → `window.confirm=()=>true`.
* Brauzer paneli yopiq bo'lsa **ekran surati olinmaydi** va mavjud bo'lmagan
  nuqson «topiladi». Claude-in-Chrome kengaytmasi orqali ko'rish ishlaydi.

**Qobiq:**
* Konsol kirillni chiqara olmaydi → faylga yoz, `cat` bilan o'qi.
* Katta heredoc `\\` ni buzadi — python skriptini `Write` bilan faylga yoz.
* `openpyxl` bu bank fayllarini odatiy rejimda ocha olmaydi
  (`ColumnDimension ... 'level'`) — `read_only=True` bilan faqat QIYMAT o'qiladi.
* Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`

---

## 6. ISH USLUBI

* **Ishonch bildirma — O'LCHA.** «Ishlashi kerak» qabul qilinmaydi.
* Xato topsang yashirma va jimgina tuzatib ham qo'yma — ochiq ayt, sababini
  ko'rsat, qaror mendan.
* Bajarib bo'lmaydigan narsa chiqsa — sababi bilan ayt, qolganini oxirigacha qil.
* Katta ishni bo'laklab qil, HAR BO'LAKDAN KEYIN tekshiruvni yurgiz.
* Qisqa va aniq yoz. Ortiqcha uzr ham, maqtov ham kerak emas.

---

**BUGUNGI VAZIFA:**
