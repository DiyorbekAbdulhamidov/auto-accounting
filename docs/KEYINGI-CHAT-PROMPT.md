# KEYINGI CHAT UCHUN PROMPT
> Shu faylning MAZMUNINI yangi chatga nusxala. 2026-08-19 sessiyasi
> oxirida yozilgan. Bu yerda faqat FAYLLARDA YO'Q narsalar bor —
> qolgani `HANDOFF.md` da, takrorlanmaydi.

Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

---

## 0. BOSHLASH

```
node scripts/verify-parsers.cjs   ->  128/128
npx tsc --noEmit                  ->  toza
npx eslint src --max-warnings=0   ->  toza
npx next build                    ->  xatosiz, 41 marshrut
```

Bittasi yiqilsa — MENGA AYT, o'zing "tuzatib" ketma.
Chuqurroq kerak bo'lsa: `HANDOFF.md` (§18 eng yangisi), `MAHSULOT-QARORLARI.md`.

---

## 1. HOLAT (2026-08-19)

Domen **moslik.uz faol**, lekin sayt hali `test-project.webleaders.uz` da.
Firebase loyihasi: `auto-accounting-diyorbek-s` (ikkala muhit ham SHU bazaga yozadi).

**Bugun tuzatilgan va JONLI tekshirilgan 5 nuqson** (tafsilot: HANDOFF §18b):
`parse_failures` umuman yozilmasdi · bepul davrda jamoaga taklif bloklangan edi ·
akt ekranda va Excel'da har xil raqam ko'rsatardi · korxona o'chirilganda yetim
ma'lumot qolardi · lotin UI ichida tarjimasiz kirill matnlar.

**Yangi:** `/api/admin/plan` + admin ekranida «Rejani qo'yish» — 1-noyabrda
rejani qo'lda ko'tarish yo'li (`b80be4c`).

---

## 2. NAVBATDAGI ISH — tartib MUHIM

1. **DNS:** aHost'da moslik.uz → Vercel; Vercel'da domen; SSL
2. **`NEXT_PUBLIC_SITE_URL=https://moslik.uz`** → **QAYTA DEPLOY**
   (hozir test domenga ishora qilyapti; `NEXT_PUBLIC_*` qurishda singdiriladi)
3. **Firebase → Authentication → Settings → Authorized domains** ga moslik.uz.
   Unutilsa login JIMGINA ishlamaydi.
4. **test-project domenini yopish** (`Disallow: /` yoki o'chirish) — hozir
   qidiruvga ochiq va **superadmin paroli sahifa manbasida turibdi**
   (`NEXT_PUBLIC_DEMO_EMAIL/PASSWORD` qo'yilgan). Hakamlar ko'rgach: o'zgaruvchini
   olib tashlash + parolni almashtirish. **Bu ataylab, men ogohlantirdim.**
5. Telefon bilan kirishni **odam sinasin** — agent sinay olmaydi (pastda).
6. Oktabrgacha: o'zini o'zi band qilgan maqomi → Click Business (§4).

---

## 3. MENDAN JAVOB KUTAYOTGAN QARORLAR

- **Bepul davrda cheklov cheksiz qolsinmi?** Hozir sentabr–oktabrda har kim
  cheksiz korxona VA cheksiz a'zo qo'shadi. Ikki oqibat: (a) cheklov faqat
  YARATISHDA tekshiriladi, ya'ni o'sha oynada yig'ib olgan odam **mangu**
  saqlab qoladi va hech qachon to'lamaydi; (b) `clients/page.tsx` ish
  maydonidagi **hamma hisobotni to'liq** o'qiydi (har biri 900 KB gacha) —
  Spark kvotasi tez tugaydi. Taklif: korxona 20, a'zo 3 qilib cheklash.
- Ro'yxat so'rovini yengillashtirish (faqat kerakli maydon) — alohida ish.

---

## 4. TO'LOV — 2026-08-19 da izlab topilgan

Maqomsiz to'lov tizimini ulab **bo'lmaydi**. Lekin to'liq YaTT ham shart emas:
**«o'zini o'zi band qilgan»** yetadi (My.gov → Soliq guvohnomasi → Click Business,
**shartnomasiz**). Click mahsulot ro'yxatida saytga onlayn to'lov ham shu maqomga
ochiq. `Dasturiy ta'minot ... ishlab chiqish` 2026-dagi qisqargan ro'yxatda
(104→72) **qoldi**. Soliq: aylanmadan **1%** (1 mlrd gacha) + yiliga 1 BHM
ijtimoiy soliq + majburiy maxsus QR-kod.

⚠️ Reklama sahifasidan o'qilgan, shartnomadan emas — Click'dan **yozma tasdiq**
olinsin. Payme hujjatlarida o'zini o'zi band qilgan aniq yozilmagan.

---

## 5. BUZILMAYDIGAN QOIDALAR

- Bu **Next.js 16** — kod yozishdan OLDIN `node_modules/next/dist/docs/` ni o'qi.
- **Workflow / subagent — MEN so'ramagunimcha ISHLATMA.**
- `src/lib/` dagi kirill matnlar parser kalit so'zlari — TEGILMAYDI
  (`ИТОГО`, `Остаток на начало периода`, `ПАССИВ`).
- **Parserga (`auditFiles`/`analyzeIncome`) tegilmaydi.** Yangi mantiq undan
  KEYIN, alohida qadam bo'lib qo'shiladi — shunda 128 ta regress kuchda qoladi.
- «Акт сверки» — rasmiy hujjat shakli; ekran va Excel **bir xil raqam** bersin.
- **«Фарқ» = debet − kredit**, ikkala sverkada. Boshlang'ich qoldiq unga
  QO'SHILMAYDI (aktdagi «Якуний қолдиқ» dan tashqari).
- **Birlashtirish PUL YO'QOTMAYDI** — yig'indi o'zgarsa, bu ma'lumotni buzish.
- Raqamni "to'g'rilash" uchun qo'lda tuzatma qo'shilmaydi — sabab topiladi.
- **HISOB KALITI uch joyda AYNAN bir xil:** `firestore.rules` dagi `authKey()`,
  server (`apiAuth.ts`, `signup/route.ts`), klient (`AuthContext.tsx`).
- `t()` kaliti = KIRILL matnning O'ZI. **Lotin uchun lug'at SHART EMAS** —
  `translate()` avtomatik transliteratsiya qiladi. Ya'ni serverdan kelgan
  kirill xato xabarini ham `t()` dan o'tkazish yetadi. `ru`/`en` uchun esa
  lug'atga yozish kerak. **Dublikat kalit `tsc` ni yiqitadi.**
- Havola qo'lda yozilmaydi: `path(...)` / `clientPath(...)`.
- SEO matnlari (`src/lib/seo.ts`) `t()` dan O'TMAYDI. FAQ — `src/lib/faq.ts`.
- **Firestore'da saqlanadigan qiymat migratsiyasiz o'zgartirilmaydi.**
- Yangi UI qadam QO'SHMASIN; mavjud jadval bekitilmaydi (HANDOFF §14).
- Har o'zgarishdan keyin: `verify-parsers` → `tsc` → `eslint` → `build`.

---

## 6. TUZOQLAR — hammasi qimmatga tushgan

**Firestore:**
- `undefined` ni QABUL QILMAYDI. **Siyrak (sparse) massiv teshigi ham `undefined`** —
  `.map()` teshikni o'tkazib yuboradi, `Array.from` esa yo'q.
- **Massiv ichida massivni saqlamaydi** (`string[][]` → xato). Obyektga o'rash kerak.
- Bu ikkalasi `parse_failures` ni **yozilgan kunidan beri** o'ldirib turgan va
  xato `catch` da yutilgani uchun ko'rinmagan. Regressiya: `firestoreUnsafePath()`.
- Maydoni YO'Q hujjat `where('field','==',...)` ga TUSHMAYDI → mavjud
  kolleksiyaga ajratuvchi maydon qo'shish o'rniga YANGI kolleksiya ochiladi.
- Ota hujjat o'chsa **subkolleksiya o'chmaydi**; klient `companies/{id}/...`
  ga umuman yeta olmaydi (qoida yo'q) → kaskad SERVERDA (`DELETE /api/companies`).
- Qoidalarda mavjud bo'lmagan token kalitiga nuqta bilan murojaat butun qoidani
  RAD ETADI. Telefon tokenida `email` YO'Q → `request.auth.token.get('email','')`.
- `firebase-admin` **v14**: modulli kirish nuqtalari (`lib/app`, `lib/firestore`).
- Skript `.env` ni o'qisin (`.env.local` yo'q). **`FIREBASE_PRIVATE_KEY` qo'sh
  qo'shtirnoq bilan** — bittasini emas, HAMMASINI olib tashlash kerak.

**Next / Vercel:**
- `NEXT_PUBLIC_*` qurishda singdiriladi → qo'shgach QAYTA DEPLOY. Va u MAXFIY EMAS.
- **`next build` ni dev-server ishlab turganda ISHLATMA** — `.next/dev/types/`
  buziladi, natijada sahifalar 404 beradi va build SOXTA tip xatosi ko'rsatadi.
  Davosi: dev'ni to'xtat → `rm -rf .next` → qayta qur.
- `JSON.stringify(Infinity)` = **`null`**. `?? 1` kabi zaxira qiymat buni
  jimgina 1 ga aylantiradi (jamoa cheklovi shundan yiqilgan edi).
- Statik sahifada sana bo'yicha shart JSX ichiga yozilmaydi (gidratatsiya).

**Sinov:**
- **3000-portda MENING dev-serverim bo'lishi mumkin** — `.claude/launch.json`
  dagi `"ulanish"` mavjudiga ULANADI, `"dev-tekshiruv"` 3100 ni ishlatadi.
- Login ortidagi sahifalarni brauzerda ochish uchun sinov hisobi yaratiladi va
  **oxirida bazadan o'chiriladi** (superadmin paroli bilan KIRILMAYDI).
- **Jonli saytga fayl yuklash uchun kichik CSV yasa** (bank ko'chirmasi ~1.8 KB
  yetadi, shakl muhim, hajm emas) — 200 KB'lik xlsx'ni brauzerga uzatish qimmat.
  Fayl `input[type=file]` ga `DataTransfer` bilan qo'yiladi.
- React `type="text"` ATRIBUTINI qo'ymaydi → `input[type=text]` selektori
  ishlamaydi, `i.type==='text'` bo'yicha filtrlash kerak.
- Modal ichidagi tugmada `offsetParent` **null** (`position:fixed`) — «ko'rinadigan
  tugma» filtri ularni tashlab yuboradi.
- `confirm()` avtomatlashtirilgan brauzerda ishlamaydi → `window.confirm=()=>true`.
- **reCAPTCHA telefon bilan kirishni agent uchun to'sadi** — CAPTCHA yechilmaydi.
  Telefon yo'lini faqat ODAM sinay oladi. (Ayni paytda u xato ham ko'rsatmaydi,
  «Yuborilmoqda...» da qotib qoladi — timeout yo'q, bu haqiqiy nuqson.)
- Brauzer paneli yopiq bo'lsa **ekran surati olinmaydi**, `transition` va
  `IntersectionObserver` ham ishlamaydi va MAVJUD BO'LMAGAN nuqson «topiladi».
- Tema `data-theme` bilan emas, `<html class="dark">` bilan almashadi.
- TypeScript kutubxonani Node'dan chaqirish:
  `createJiti(__filename)(PROJ + '/src/lib/statementAudit.ts')`

**Qobiq (shell):**
- **Katta heredoc `\\` ni buzadi** — uzun matn uchun `Write` ishlat yoki python
  skriptini faylga yozib chaqir. (Bir necha marta vaqt yegan.)
- Bu mashinada LibreOffice ham, poppler ham YO'Q.
- Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`

---

## 7. ISH USLUBI

- **Ishonch bildirma — O'LCHA.** «Ishlashi kerak» qabul qilinmaydi.
- Xato topsang yashirma va jimgina tuzatib ham qo'yma — ochiq ayt, sababini
  ko'rsat, qaror mendan. Tuzatgandan keyin **tuzatishni orqaga qaytarib**,
  sinov haqiqatan yiqilishini tekshir.
- Bajarib bo'lmaydigan narsa chiqsa — sababi bilan ayt, qolganini oxirigacha qil.
- Katta ishni bo'laklab qil, HAR BO'LAKDAN KEYIN tekshiruvni yurgiz.
- Qisqa va aniq yoz. Ortiqcha uzr ham, maqtov ham kerak emas.

---

## BUGUNGI VAZIFA:
<shu yerga yoz>
