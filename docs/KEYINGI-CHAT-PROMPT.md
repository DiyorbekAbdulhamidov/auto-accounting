Loyiha: `C:\Users\hp\Desktop\Work\webleaders\startups\accounting-automation`
Mahsulot: **Moslik** — buxgalter uchun bank ko'chirmasi ↔ faktura sverkasi.
Men o'zbekcha (lotin) yozaman. UI matnlari va `t()` kalitlari — kirill o'zbekcha.

---

## 0. BOSHLASH

```
node scripts/verify-parsers.cjs   →  142/142
npx tsc --noEmit                  →  toza
npx eslint src --max-warnings=0   →  toza
npx next build                    →  xatosiz
```

Bittasi yiqilsa — **MENGA AYT**, o'zing "tuzatib" ketma.
Chuqurroq kerak bo'lsa: `HANDOFF.md`, `MAHSULOT-QARORLARI.md`.

---

## 1. HOLAT (2026-08-20)

**Domen `moslik.uz` to'liq ishlaydi** — canonical, hreflang, `robots.txt`, `sitemap.xml` (8 sahifa × 4 til) hammasi to'g'ri, o'lchangan. Google Search Console'da domen tasdiqlangan, lekin **hali indekslanmagan** (0 klik). Bu normal: domen yangi, havola yo'q. Sitemap `robots.txt` da e'lon qilingan, ya'ni o'zi ham topiladi — qo'lda yuborilsa 2–7 kun, yuborilmasa 2–8 hafta.

**Kommit qilinmagan 7 fayl bor** (`origin/master` = `d59cbb5`):
`opengraph-image.tsx` (yangi) · `PaymentBox` · `TeamModal` · `dictionary` · `legal` · `pageMeta` · `proxy`.
Jonli saytda hali **yo'q**: `og:image`, to'lov qutisidagi hisob raqami, «1/1» matni, ofertaning to'lov bandi.

**Bugun qo'shilgani:** `/offer` `/refund` `/contact` (4 tilda, footerda) · parol tiklash · telefon bilan taklif · SMS 20 s chegarasi · qo'lda to'lov qutisi.

---

## 2. PUL — eng chalkash joy, ANIQ o'lchangan

**Maqom:** o'zini o'zi band qilgan shaxs, 19.08.2026, ma'lumotnoma № 0014260301, faoliyat «Дастурий таъминот ишлаб чиқиш» (ПФ-50, 2-ilova, 32-band).

**Click:** o'zini o'zi band yo'li = **hamyon + QR + hisob chiqarish**, shartnomasiz, **E-IMZO kerak emas**. Lekin `merchant_id`/`service_id` **berilmaydi** — u «Yetkazib beruvchi»ga, ya'ni **saytga to'lov tugmasi ULANMAYDI** (dalil: click.uz/uz/offer-self-employed, 1.2 / 1.7.2 / 1.7.9).

**Payme, Uzum, Freedom Pay:** hammasi yuridik shaxs + **raschyot schyot** talab qiladi (Freedom Pay shartnomasida ochiq yozilgan). Ya'ni saytga API uchun yagona yo'l — **YATT**. Soliq bir xil qoladi (1% aylanma), faqat rasmiylashtirish.

**Hozirgi to'lov yo'li (ishlaydi):** cheklovga yetgan foydalanuvchiga karta `9860 0101 2959 4213` (DIYORBEK ABDULHAMIDOV) + `@webleaderscontactbot` ko'rsatiladi, ekranda hisob kaliti ham turadi va bitta bosishda nusxalanadi. Reja **qo'lda** ochiladi: `/api/admin/plan`.
«Avtomat ochiladi» deb **YOZILMAYDI** — avtomatika yo'q, matn muddat aytadi.

---

## 3. FIREBASE — Blaze YOQILMAGAN

To'rttala billing hisobi ham **Closed**. `014BB3-…` yopiq, Visa •••• 4134 **rad etilgan**. `012A35-…` da **$9,09 qarz** — 2026 mart–mayda Torontodagi E2 VM (191 soat) uchun; bepul mintaqa `us-central1` bo'lganda $0 bo'lardi.

Oqibati: **telefon bilan kirish umuman ishlamaydi** — 2024-sentabrdan Firebase SMS'i Blaze talab qiladi. O'lchangan: bu loyihadan **bitta ham SMS ketmagan**. Auth'dagi `+998901234567` — sinov raqami.

Yo'l: xalqaro karta → $9,09 → Reopen → Blaze. Kod tayyor, SMS o'zi ishlab ketadi.
Arzon muqobil (ochilishdan keyin): **Telegram Login Widget** — $0, VM kerak emas, `createCustomToken()` + `signInWithCustomToken()`. Lekin hisob kaliti uchinchi tur bo'ladi (`authKey()` uchala joyda o'zgaradi) — shoshib qilinmaydi.

---

## 4. NAVBATDAGI ISH

1. **Commit + deploy** — 7 fayl.
2. **Demo parolni olib tashlash** — `NEXT_PUBLIC_DEMO_EMAIL/PASSWORD` Vercel'da, asosiy domenda **superadmin** oldindan to'ldirilgan turibdi. Hakamlar ko'rgach: o'zgaruvchini o'chirish **va parolni almashtirish**. (Ataylab, men ogohlantirganman.)
3. **test-project.webleaders.uz ni yopish** — canonical to'g'ri, lekin ochiq.
4. **Click SuperApp** → Click Business → ro'yxat (ma'lumotnoma bilan, bugun bo'ladi).
5. Karta → Blaze → SMS.
6. Search Console: sitemap + indekslash so'rovi (5 daqiqa, shoshilinch emas).

**Ochilish 1-sentabr.** Google'dan mijoz kelmaydi — Telegram guruhlari va tanishlardan keladi.

---

## 5. MENDAN JAVOB KUTAYOTGAN QARORLAR

* **Podoxod (INPS) moduli** — shakl yuklanadi, chiroyli ko'rinadi, bitta tugma narastayushchiyni to'ldiradi. Qaror: **men aytgandek quriladi**, qonunni o'zim kuzataman. **1-sentabrdan keyin.** Modulga shakl versiyasi (yil/tahrir) yoziladi. Boshlash uchun **ikki oyning shabloni** kerak.
* YATT ga o'tish — qachon.

---

## 6. BUZILMAYDIGAN QOIDALAR

* Bu **Next.js 16** — kod yozishdan OLDIN `node_modules/next/dist/docs/` ni o'qi.
* **Workflow / subagent — MEN so'ramagunimcha ISHLATMA.**
* `src/lib/` dagi kirill matnlar parser kalitlari — TEGILMAYDI (`ИТОГО`, `ПАССИВ`).
* Parserga (`auditFiles`/`analyzeIncome`) tegilmaydi. Yangi mantiq undan KEYIN, alohida qadam.
* «Акт сверки» — rasmiy hujjat: ekran va Excel bir xil raqam bersin.
* «Фарқ» = debet − kredit, ikkala sverkada. Boshlang'ich qoldiq qo'shilmaydi.
* Birlashtirish PUL YO'QOTMAYDI — yig'indi o'zgarsa, bu ma'lumotni buzish.
* Raqamni "to'g'rilash" uchun qo'lda tuzatma qo'shilmaydi — sabab topiladi.
* **HISOB KALITI** uch joyda AYNAN bir xil: `firestore.rules` `authKey()`, server (`apiAuth.ts`, `signup/route.ts`), klient (`AuthContext.tsx`). Qo'lda yozilgan matndan kalit — `inviteKeyOf()` (`workspace.ts`), u `accountKeyOf()` bilan teng natija berishi shart.
* `t()` kaliti = KIRILL matnning O'ZI. Lotin avtomatik, `ru`/`en` uchun lug'atga yoziladi. Dublikat kalit `tsc` ni yiqitadi.
* **Huquqiy matnlar (`legal.ts`) `t()` dan O'TMAYDI** — har til uchun alohida yoziladi (`seo.ts` bilan bir xil usul), lotin esa kirilldan `translate()` bilan olinadi.
* Havola qo'lda yozilmaydi: `path(...)` / `clientPath(...)`.
* SEO matnlari (`seo.ts`) `t()` dan o'tmaydi. FAQ — `faq.ts`.
* Firestore'da saqlanadigan qiymat migratsiyasiz o'zgartirilmaydi.
* Yangi UI qadam QO'SHMASIN; mavjud jadval bekitilmaydi.
* **JShShIR saytga chiqmaydi** — arizada beriladi.
* Har o'zgarishdan keyin: `verify-parsers` → `tsc` → `eslint` → `build`.

---

## 7. TUZOQLAR — hammasi qimmatga tushgan

**Firestore:**
* `undefined` ni QABUL QILMAYDI (siyrak massiv teshigi ham). Massiv ichida massiv ham yo'q — obyektga o'ra. Regressiya: `firestoreUnsafePath()`.
* Maydoni YO'Q hujjat `where('field','==',...)` ga TUSHMAYDI → yangi kolleksiya och.
* Ota hujjat o'chsa subkolleksiya o'chmaydi → kaskad SERVERDA.
* Qoidalarda mavjud bo'lmagan token kalitiga nuqta bilan murojaat butun qoidani RAD ETADI: `request.auth.token.get('email','')`.
* `firebase-admin` v14: modulli kirish (`lib/app`, `lib/firestore`).
* Klient SDK'da `select()` YO'Q — proyeksiya faqat admin SDK'da (`/api/reports/summary` shundan tug'ilgan: 146 KB → 0,5 KB).

**Next / Vercel:**
* `NEXT_PUBLIC_*` qurishda singdiriladi → qo'shgach QAYTA DEPLOY. Va u MAXFIY EMAS.
* **`next build` ni dev-server ishlab turganda ISHLATMA** — `.next` umumiy, dev-server 404 bera boshlaydi. Davosi: dev'ni to'xtat → `rm -rf .next` → qayta qur. (2026-08-20 da yana bosildi.)
* Bitta papka uchun **ikkinchi dev-server ishga tushmaydi** — 3100 jim o'ladi. `.claude/launch.json` dagi `"ulanish"` mavjudiga ulanadi.
* `JSON.stringify(Infinity)` = `null`. `?? 1` kabi zaxira uni jimgina 1 ga aylantiradi.
* Statik sahifada sana bo'yicha shart JSX ichiga yozilmaydi (gidratatsiya).

**Sinov:**
* Login ortidagi ekranni tekshirish uchun **sinov hisobi** yaratiladi va oxirida bazadan o'chiriladi (superadmin paroli bilan KIRILMAYDI). Namuna: hisob → 3 korxona → 4-chisida devor → tozalash.
* React `type="text"` ATRIBUTINI qo'ymaydi. Modal tugmasida `offsetParent` null. `confirm()` ishlamaydi → `window.confirm=()=>true`.
* Element qidirganda **placeholder bo'yicha izlama** — qidiruv maydoni bilan chalkashadi. `id` ishlat (`#company-name`, `#company-inn`).
* Brauzer paneli **yopiq bo'lsa ekran surati olinmaydi** va MAVJUD BO'LMAGAN nuqson «topiladi».
* reCAPTCHA telefon yo'lini agent uchun to'sadi — faqat ODAM sinaydi.
* Tema `data-theme` bilan emas, `<html class="dark">` bilan almashadi.

**Qobiq:**
* Katta heredoc `\\` ni BUZADI — python skriptini `Write` bilan faylga yoz, keyin chaqir.
* Bu mashinada LibreOffice ham, poppler ham YO'Q. PDF matni — **pypdf** (bor). Konsol kirillni chiqara olmaydi → faylga yoz, `cat` bilan o'qi.
* `.env` ni skript o'zi o'qiydi (`.env.local` yo'q). `FIREBASE_PRIVATE_KEY` da qo'shtirnoqlarning HAMMASI olib tashlanadi va `\n` haqiqiy qatorga aylantiriladi.
* Etalon fayllar: `C:/Users/hp/Downloads/Telegram Desktop/`

**Git:**
* Men commit qilishdan oldin `git status` ni QAYTA o'qi — u parallel commit qilib qo'ygan bo'lishi mumkin. «Push o'tmabdi» deyishdan oldin `origin/master` ni tekshir.

---

## 8. ISH USLUBI

* **Ishonch bildirma — O'LCHA.** «Ishlashi kerak» qabul qilinmaydi. Bir sessiyada uch marta noto'g'ri da'vo qilinib, keyin o'lchov ularni rad etgan (Blaze «yoqilgan» emas edi; push «o'tmagan» emas edi; E-IMZO «kerak» emas edi). Ikkilamchi manba (maqola, reklama sahifasi) — dalil EMAS; shartnoma yoki API javobi — dalil.
* Xato topsang yashirma va jimgina tuzatib ham qo'yma — ochiq ayt, sababini ko'rsat, qaror mendan. Tuzatgandan keyin tuzatishni orqaga qaytarib, sinov haqiqatan yiqilishini tekshir.
* Bajarib bo'lmaydigan narsa chiqsa — sababi bilan ayt, qolganini oxirigacha qil.
* Katta ishni bo'laklab qil, HAR BO'LAKDAN KEYIN tekshiruvni yurgiz.
* Qisqa va aniq yoz. Ortiqcha uzr ham, maqtov ham kerak emas.

---

**BUGUNGI VAZIFA:**
