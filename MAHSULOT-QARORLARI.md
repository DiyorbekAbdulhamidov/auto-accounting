# Mahsulot qarorlari — nom, atamalar, UI, bozor

Bu hujjat KOD emas, QAROR saqlaydi. `HANDOFF.md` texnik holatni yozadi,
bu esa «nima uchun shunday atadik / shunday chizdik» ni.

> **QABUL QILINGAN QARORLAR**
> - **Yo'nalish: A** (2026-08-13) — mahsulot BUXGALTER uchun sverka
>   vositasi. YATT/soliq moduli hozircha yozilmaydi.
> - **Nom: `Moslik`** (2026-08-16). Domen `moslik.uz`. Sabab quyida.
> - **Standart alifbo: o'zbek LOTIN** (2026-08-16). Kalit va manba
>   matn kirill holicha qoladi — o'zgargani faqat birinchi marta
>   kirgan odam nimani ko'rishi.
> - **UI 1, 2, 3-bosqichlar BAJARILDI** — 3-bo'limga qarang.

---

## 0. Avval bir nomuvofiqlik

Xotirada (2026-08-06) «YATT-birinchi strategiya» tasdiqlangan deb yozilgan:
`src/lib/solo/**`, `src/app/solo/**`, `taxRules.ts`, eslint chegarasi.
**Bu repoda bunday modul YO'Q** — `git log --all` bo'yicha hech qachon
commit qilinmagan. Ya'ni strategiya qabul qilingan, lekin kod yozilmagan
(yoki boshqa nusxada qolib ketgan).

Bu muhim, chunki quyidagi hamma savol («nom nima bo'lsin», «UI qanday
bo'lsin», «kimga kerak») shu ikki yo'ldan qaysi biri tanlanishiga bog'liq:

| | A yo'l — SVERKA vositasi | B yo'l — YATT uchun «buxgaltersiz» |
|---|---|---|
| Kim ishlatadi | Buxgalter (mijozlari bor) | Tadbirkorning O'ZI |
| Nima qiladi | Bank ↔ faktura solishtirish, akt sverki | Soliq hisobi, hisobot topshirish |
| Hozir tayyor | **~90%** (ishlaydi, sinovdan o'tgan) | **0%** (kod yo'q) |
| Bozor hajmi | Kichik, lekin to'laydi | Katta, lekin arzon to'laydi |

Hozirgi mahsulot — **A**. Xotiradagi strategiya — **B**. Ikkalasi bitta
nom ostida turishi mumkin, lekin bitta UI'da turolmaydi.

---

## 1. Nom

### «Korxona tovar-moddiy boyliklarini olish uchun yuborilgan pul
### mablag'larini hamda kelgan mahsulotlar hisob-varaqalarini tez aniqlash
### solishtirmasi» — bu NOM emas

Bu — **ta'rif**, va ta'rif sifatida to'g'ri: mahsulot aynan shuni qiladi.
Lekin nom sifatida yaramaydi, sabablari:

- 12 ta so'z, 96 ta belgi. Domenga, logotipga, gapga sig'maydi.
- Faqat CHIQIM tomonini tasvirlaydi («olish uchun yuborilgan pul»).
  Mahsulotda KIRIM sverkasi ham bor — nom uni qamramaydi.
- «tez aniqlash solishtirmasi» — hech kim bunday qidirmaydi.

**Lekin uni tashlamaslik kerak.** Bu — saytdagi tagline uchun tayyor matn
va Tashabbus arizasi uchun rasmiy ta'rif. Qisqartirilgan shakli:

> **Korxonaning bank chiqimi bilan kelgan fakturalarini bir daqiqada
> solishtiradi.**

### Nom bo'yicha allaqachon qabul qilingan qaror

Xotirada (2026-08-04): brend **«Buxgaltersiz»**, va u shu nom bilan
Tashabbus arizasiga (ID-000951, 300 000 000 so'm) kiritilib, moderatsiyaga
yuborilgan. Ariza yuborilgandan keyin tahrirlash yopiq.

**Demak nomni almashtirish bepul emas:** davlat hujjatida bir nom, saytda
boshqa nom bo'lib qoladi. Moderator «bu qaysi loyiha?» deb so'rashi mumkin.

### «Buxgaltersiz» nomining kuchli va zaif tomoni

| Kuchli | Zaif |
|---|---|
| Bitta so'zda va'da: buxgalter kerak emas | **Hozirgi mahsulot buxgalter UCHUN** — nom mijozni haydaydi |
| O'zbekcha, hech kimga tarjima kerak emas | «-siz» inkor: raqib emas, dushman qilib qo'yadi |
| B yo'liga (YATT) mukammal mos | A yo'liga (sverka) qarama-qarshi |

Ya'ni nomdagi muammo aslida nom muammosi emas — **mahsulot qaysi yo'ldan
ketishi hal qilinmaganligi**. Buxgalterga «buxgaltersiz» degan dasturni
sotib bo'lmaydi.

### Uchta yo'l

**1-yo'l — «Buxgaltersiz» qoladi, mahsulot B ga buriladi.**
Ariza bilan mos, brend kuchli. Lekin bugungi ishlaydigan sverka moduli
ikkinchi darajaga tushadi va YATT moduli noldan yoziladi.

**2-yo'l — nom neytral bo'ladi, ikkala yo'lni ham ko'taradi.**
Buxgalterga ham, tadbirkorga ham sotiladi. Tashabbus arizasiga esa
«loyiha nomi o'zgardi» deb izoh beriladi (moderator qaytarsa — o'zi
imkon bo'ladi).

`.uz` da bo'sh deb topilganlar (2026-08-04 whois): `moslik`, `tezhisob`,
`aniqhisob`, `tenglik`, `yakun`, `daftarim`, `buxcha`, `buxon`, `buxlab`,
`nolbux`, `oborot`, `buxsiz`.

Shulardan mahsulotga mazmunan mos uchtasi:

| Nom | Nega mos | Nega mos emas |
|---|---|---|
| **Moslik** | Mahsulotning butun ishi — mos kelish/kelmaslikni topish. «Mos keldi / mos kelmadi» — ilovaning asosiy javobi. Sof o'zbekcha, neytral, ikkala auditoriyaga ham yaraydi | Umumiy so'z, brend sifatida «egallash» qiyinroq |
| **Tenglik** | Qoldiq TENGLAMASI — mahsulotning texnik yadrosi aynan shu. Debet = kredit tengligi buxgalteriyaning o'zagi | «Tenglik» ijtimoiy ma'noga ham ega |
| **Yakun** | Buxgalterning eng og'ir kuni — yakun (oy yopish). «Yakun» — natija, hisobot | Kengroq, sverkani anglatmaydi |

**3-yo'l — hech narsa o'zgarmaydi**, «Buxgaltersiz» qoladi, mahsulot A da
qoladi. Eng arzon, lekin nom bilan mahsulot bir-biriga qarama-qarshi
turaveradi.

---

### ✅ QAROR (2026-08-16): nom — **Moslik**

2-yo'l tanlandi. Nomni tanlash foydalanuvchi tomonidan topshirilgan edi
(«shundan kelib chiqib nom qo'y o'zing»), manba esa yuqoridagi rasmiy
ta'rifning o'zi.

**Qanday chiqarildi.** Ta'rifning o'zagi — oxirgi so'z: «...tez aniqlash
**SOLISHTIRMASI**». Solishtirmaning NATIJASI bitta so'z bilan aytiladi:
mos keldi yoki mos kelmadi. Ilova ham aynan shu javobni beradi.

```
solishtirma  ->  mos kelish  ->  MOSLIK
```

**Nega boshqasi emas:**

| Nom | Nega rad etildi |
|---|---|
| «Buxgaltersiz» | Mahsulot buxgalter UCHUN. Nom unga qarshi va'da beradi — mijozni haydaydi |
| «Tezhisob» / «Aniqhisob» | «Hisob» butun buxgalteriyani va'da qiladi, mahsulot esa sverka qiladi. Ortiqcha va'da |
| «Tenglik» | Qidiruvda ijtimoiy ma'no bilan aralashadi |
| Ta'rifning o'zi | 12 so'z, 96 belgi — nom emas, ta'rif |

**«Moslik» nimasi bilan mos:** natijaning O'ZI; ikkala yo'nalishga ham
neytral (kirim ham, chiqim ham); YATT moduli qo'shilsa ham buzilmaydi;
sof o'zbekcha, 6 harf, tarjima talab qilmaydi.

**Rasmiy ta'rif tashlanmadi** — u `src/lib/brand.ts` da saqlanadi va
saytning podvalida to'liq holicha turadi (Tashabbus arizasi bilan
bog'lanish uchun).

> **Domen holati (2026-08-17 da rasmiy WHOIS'dan tekshirildi).**
> `cctld.uz/whois` javobi: **«moslik.uz домени мавжуд эмас»** —
> ya'ni hali BAND EMAS, olish mumkin. 2026-08-04 dagi holat
> o'zgarmagan. Uni olish keyingi ishlar ro'yxatining boshiga
> qo'yilsin: nom kodda, hujjatlarda va SEO qatlamida allaqachon
> ishlatilyapti (`NEXT_PUBLIC_SITE_URL` ning standart qiymati ham
> `https://moslik.uz`).

### Logotip

Belgi — **teng belgisining o'zi: ikkita chiziq**.
Yuqorigi `--cash` (pul), pastkisi `--invoice` (faktura), ikkalasi TENG
uzunlikda. Mahsulotning butun javobi shu.

Yangi rang O'YLAB TOPILMADI: ilovada «pul» va «faktura» allaqachon shu
ikki token bilan ko'rsatiladi va ular ikkala sverkada ham bir xil.
Logotip ham aynan shu ikki tushunchani anglatgani uchun mavjudi olindi.
Tunggi rejimda tokenlar o'zidan ochroq variantga o'tadi — logotip uchun
alohida tungi rang yozilmagan.

Fayllar: `src/components/Brand.tsx` (ilova ichida),
`src/app/icon.svg` (brauzer yorlig'i).

### Shior (2026-08-16 da almashtirildi)

**«Бухгалтер учун автоматик текширув тизими»**

Ilgari «Пул билан фактура мос келдими» edi. Muammo: u faqat BUGUNGI
modulni tasvirlardi. Ombor qoldig'i (Astatka), soliq xavfi yoki AI
tahlili qo'shilsa, shior yolg'onga aylanardi.

Yangi shior TOIFAni e'lon qiladi va shuning uchun eskirmaydi. Lekin
uning zaif tomoni bor va u qabul qilib olindi: **toifa shiori o'zi
«nima qilishini» aytmaydi.** Shu sababli `BRAND.promise` MAJBURIY
juftlik qilib qo'yilgan — sarlavha ostida doim shu turadi:

> Банк кўчирмаси билан фактура рўйхатини юкланг — тизим ҳар бир
> контрагент бўйича рақамларни солиштиради ва фарқ борларини
> ажратиб беради.

Ikkalasi `src/lib/brand.ts` da yonma-yon turadi — biri ikkinchisisiz
ishlatilmasin.

### Til manzilda (2026-08-17)

**`/uz` · `/uz-cyrl` · `/ru` · `/en`** — har doim prefiks bilan.

Sabab o'lchov bilan aniqlandi: 410 ta UI matndan 210 tasi tarjimasiz
edi (qamrov 48,8%), ya'ni rus tilida sahifaning yarmi o'zbekcha
chiqardi. Lekin asosiy muammo tarjimaning o'zi emas edi — **til
`localStorage` da turardi va Google uni umuman ko'rmasdi.** Ruscha
qidirgan buxgalter saytni hech qachon topa olmasdi.

Uchta qaror:

1. **Har doim prefiks** (`/` ham `/uz` ga yo'naltiriladi). Sanoat
   standarti; hreflang va canonical shundagina bir ma'noli bo'ladi.
2. **Kirill alohida manzil** (`/uz-cyrl`). Xavfi bor — bir xil matn
   ikki manzilda. Yagona himoya: `hreflang` da YOZUV ko'rsatiladi
   (`uz-Latn` / `uz-Cyrl`), aks holda Google bittasini tashlaydi.
3. **Kalit tuzilishiga TEGILMADI** — `t()` kaliti hali ham kirill
   matnning o'zi. O'zgargani faqat tilning qayerdan kelishi.

### Marshrut nomlari — inglizcha va vazifa bo'yicha

| Eski | Yangi | Nega |
|---|---|---|
| `/excel-audit` | `/clients` | Eskisi VOSITAni nomlagan (Excel), ishni emas |
| `/korxonalar` | `/clients` | O'zbekcha nom qidiruvda ko'rinmaydi |
| `/qollanma` | `/guide` | — |
| — | `/pricing` | «narx» mustaqil qidiruv so'rovi, alohida sahifa kerak |
| — | `/features` | — |

`/clients` (`/companies` emas): buxgalter uchun ular korxona emas,
MIJOZ. Ingliz tilida `/companies` esa «bizning kompaniyalarimiz»
deb tushuniladi.

### Alifbo — nega lotin standart bo'ldi

`DEFAULT_LANG = 'uz-latn'`. Bitta qator, kalitlarga tegilmadi.

1. Davlat rasmiy alifbosi — lotin.
2. Yosh foydalanuvchi lotinni bemalol, kirillni qiynalib o'qiydi;
   teskarisi kamroq to'sqinlik qiladi.
3. Brend, domen va marketing baribir lotin.
4. Tanlov `localStorage` da saqlanadi va **standartdan ustun turadi** —
   ya'ni kirill tanlagan odam uchun hech narsa o'zgarmaydi.

Manba matn va `t()` kaliti **kirill holicha qoladi** — transliteratsiya
avtomatik (`src/lib/i18n/translit.ts`).

---

## 2. Atamalar — «buxgalter bittada tushunadigan» qilish

Hozirgi UI'dagi eng katta muammo texnik emas, **lug'aviy**. Bitta narsa
uch xil atalgan, va foydalanuvchiga buxgalteriya ichki tili ko'rsatilgan.

### Aniqlangan chalkashliklar

| # | Muammo | Hozir |
|---|---|---|
| 1 | «Кредит» ikki xil narsani anglatadi | «Жами келган пул (**Кредит**)» va «Келган счет-ф (**Кредит**)» — biri pul, biri faktura |
| 2 | Debet/kredit umuman ko'rsatilgan | «Дебет (фактура)», «Кредит (тўлов)», «Қолдиқ (Сальдо)» |
| 3 | Ruscha atamalar tarjimasiz qolgan | «Нарастающий», «Ожидает подписи партнёра», «Аванс», «Сальдо» |
| 4 | Bitta tushuncha uch xil yozilgan | «счет-ф», «счёт-фактура», «Ҳисоб фактура», «Фактура» |
| 5 | Ikki sahifa teskari lug'at ishlatadi | Chiqimda «Келган» = faktura, kirimda «Келган» = pul |
| 6 | Bosh sahifa korporativ so'z | «Ички Бошқарув Тизими», «Иш Муҳитини Танланг», «Бухгалтерия Хизматлари Маркази» |
| 7 | Sahifa nomi yo'nalishni aytmaydi | «Кирим Сверкаси» bor, lekin juftligi shunchaki «Сверка» |

### Taklif qilinayotgan yagona lug'at

Qoida: **foydalanuvchiga PUL YO'NALISHI ko'rsatiladi, hisob raqami
atamasi emas.** Debet/kredit faqat «Ўқиш ҳисоботи» ichida qoladi —
u yerda buxgalter faylni tekshiradi, tili ham o'sha bo'lishi kerak.

| Tushuncha | Hozir | Bo'lsin |
|---|---|---|
| Hisobdan chiqqan pul | Дебет / Жами чиққан пул / Чиққан пул | **Тўланган пул** |
| Hisobga kelgan pul | Кредит / Жами келган пул | **Тушган пул** |
| Bizga yozilgan faktura | Кредит / Келган счет-ф / Кирим (Фактура) | **Келган фактура** |
| Biz yozgan faktura | Юборилган счёт-фактура | **Ёзилган фактура** |
| Farq | Фарқи / Қолдиқ (Сальдо) | **Фарқ** |
| Farq musbat | Қарз БИЗНИНГ фойдамизга | **Улар қарздор** |
| Farq manfiy | Қарз МИЖОЗ фойдасига / Аванс | **Биз қарздормиз** |
| Yig'indi bilan | Нарастающий | **Йил бошидан** |
| Imzo kutilmoqda | Ожидает подписи партнёра | **Имзо кутилмоқда** |
| Chiqim sahifasi | Сверка / Excel Audit | **Чиқим сверкаси** |
| Kirim sahifasi | Кирим Сверкаси | **Кирим сверкаси** |

Bitta juft so'z butun mahsulotni tushuntiradi:
**Тўланган пул ↔ Келган фактура** (chiqim),
**Тушган пул ↔ Ёзилган фактура** (kirim).

`src/lib/i18n/dictionary.ts` kalitlari kirill matnning O'ZI bo'lgani uchun
atamani almashtirish = kalitni almashtirish. Ya'ni o'zgartirish bitta joyda
emas, sahifalarda ham qilinadi — lekin `t()` o'ramlari saqlanadi.

**Tegilmaydi:** `src/lib/*.ts` ichidagi kirill matnlar. Ular UI emas,
parser kalit so'zlari (`ИТОГО`, `Остаток на начало периода`, `ПАССИВ`).
Tarjima qilinsa fayl o'qish buziladi.

---

## 3. UI ni qayta qurish — tartib

«Hammasini bir kunda 0 dan» qilib bo'lmaydi. Tartib shunday bo'lsin
(har bosqich o'zi yakka holda ham foyda beradi):

**1-bosqich — lug'at. ✅ BAJARILDI (2026-08-13).**
28 ta matn almashtirildi (4 sahifa + 2 Excel eksport), lug'atga 22 ta
yangi yozuv (ru/en) qo'shildi. Kod tuzilishiga tegilmadi.

Ikki joy ATAYLAB tegilmadi:
- **Акт сверки** bloki (`Дебет / Кредит / Сальдо`) — bu rasmiy ikki
  tomonlama hujjat shakli, ustunlari qonun bilan belgilangan. Etalon
  PDF bilan qatorma-qator mos kelishi shart.
- **«Ўқиш ҳисоботи»** ichidagi ogohlantirishlar — u yerda buxgalter
  faylni tekshiradi, tili ham bank tili bo'lishi kerak.

Bir tuzoq topildi va yopildi: `isOwnExportSheet()` dasturning O'Z Excel
hisobotini QAYTA yuklanganda sarlavha MATNi bo'yicha taniydi. Sarlavha
o'zgargani uchun bu himoya jimgina ishlamay qolishi mumkin edi (hisobot
manba deb o'qilib, summa ikkilanardi). Endi eski va yangi sarlavha
ikkalasi ham taniladi, ustiga harnessda sinov bor: eksport qilinadi va
qaytadan o'qiladi.

**2-bosqich — dizayn tizimi. ✅ BAJARILDI (2026-08-15).**
Rang tokenlari (kirim `#10B981`, chiqim `#4F46E5`), bitta shrift
shkalasi, `src/components/ui/` da 21 komponent.

Eng muhim qoida: **ikki rang o'qi aralashtirilmaydi.** Modul rangi
(`--accent`) faqat tugma/tab/fokus uchun; ma'lumot rangi
(`--cash`/`--invoice`/`--ok`/`--warn`/`--bad`) moduldan MUSTAQIL —
pul ikkala sverkada bir xil rangda bo'lishi shart.

**3-bosqich — bitta sahifa, ikki yo'nalish. ✅ BAJARILDI (2026-08-16).**
Korxonalar ro'yxati endi bitta (`/korxonalar`), yo'nalish esa korxona
sahifasidagi tab (`/korxonalar/[id]`). Kirim sverkasida ilgari korxona
tushunchasi umuman yo'q edi — u mustaqil sahifa bo'lib, o'z ko'rinishi
bilan turardi.

Ikki texnik qaror:
- **Ikkala komponent ham montajda qoladi**, ko'rinmagani `hidden` bilan
  yashiriladi. Aks holda tab almashtirilganda yuklangan fayl, o'qilgan
  hisobot va belgilangan qatorlar yo'qolardi.
- **`ModuleScope`** (`src/components/ui/Module.tsx`) — modulni
  `data-module` bilan birga KONTEKSTGA ham beradi. Sabab: `Modal`
  `<body>` ga portal orqali chiqadi, ya'ni sahifadagi `data-module`
  unga yetib bormaydi — kirim sverkasining «Акт сверки» oynasi ko'k
  tugma bilan ochilardi (brauzerda o'lchab tasdiqlangan).

**4-bosqich — natija ekrani. ❌ SINALDI VA RAD ETILDI (2026-08-18).**
Reja «avval javob, keyin jadval» edi. Yasaldi (`ResultPanel.tsx`:
«N ta kontragentda farq bor» + uch guruh + eng katta 5 farq),
o'lchandi va **olib tashlandi**.

Sabab: panel yangi ma'lumot bermadi. «Nechta kontragentda farq bor»
allaqachon `StatCard` va jadval tepasidagi qatorda bor edi — panel
faqat qatlam qo'shdi. Foydalanuvchi ikki marta rad etdi: avval jadval
yashirilgani uchun, keyin panelning o'zi uchun («chalg'ityapti»).

**To'g'ri qo'yilgan savol:** buxgalterga «farq bor» degan raqam emas,
**qaysi faktura yopilmagani** kerak. Ma'lumot allaqachon bor
(`aging.ts` FIFO bilan hisoblaydi), ekranda ochilmagan. Batafsil:
`docs/TAHLIL-2026-08-18.md`.

Saqlanib qolgan qoida: guruhlash farq ISHORASI bo'yicha emas,
`verdict()` toni bo'yicha (HANDOFF §14).

**5-bosqich — yuklash oqimi.** Hozir: fayl tanla → yukla → natija.
Kerak: fayl tashla → tizim nima topganini AYTADI (qaysi bank, qaysi davr,
qaysi korxona) → tasdiqla → natija. «Ўқиш ҳисоботи» keyin emas, oldin.

---

## 4. Bunday tizim kerakmi?

Halol javob: **sverka mahsuloti kerak, lekin u o'zi biznes emas.**

**Kerakligining dalili — taxmin emas, o'lchov:**
- Haqiqiy fayllarda tizim buxgalter O'TKAZIB YUBORGAN farqlarni topdi:
  `HUDUDGAZTA'MINOT` — 50 278 000 so'mlik faktura bor, to'lov yo'q;
  pochta — 227 503; `Zero Waste` — 1 366 176.
- Qo'lda 7 oylik sverka: bir necha kun. Tizimda: bir necha soniya.
  Sinovda 1,37 mlrd so'm aylanma, 152 o'tkazma, 159 faktura, 35 kontragent.
- Xato narxi yuqori: e-faktura va bank ma'lumoti nomos kelsa, bu QQS
  hisobotiga chiqadi.

**Lekin biznes bo'lishiga to'siq:**
1. **Bu oyiga bir marta kerak bo'ladigan ish.** Kuniga ochiladigan mahsulot
   emas — obuna sotish qiyin.
2. **To'laydigan odam — buxgalter, va u tejaydigan narsa o'z vaqti.**
   Buxgalter o'z vaqtini pulga aylantirmaydi (mijozdan oylik oladi),
   shuning uchun u tejagan kun uchun to'lashga odatlanmagan.
3. **Excel yuklash — vaqtinchalik yechim.** Bank formatlari o'zgaraveradi.
   Uzoq muddatda kerak: to'g'ridan-to'g'ri bank/soliq integratsiyasi
   (1C «Клиент-Банк», MT940, `camt.053`, didox/E-faktura API).

**Xulosa:** yig'ishtirib tashlanmaydi, lekin **sverkani mahsulot deb emas,
KIRISH ESHIGI deb qarash kerak.** U bepul bo'ladi va foydalanuvchini olib
keladi; pul esa u keltirgan ma'lumot ustidagi ishdan chiqadi (hisobot,
qarzdorlik nazorati, soliq).

Bu 2026 soliq islohoti bilan bitta yo'nalishga qaraydi: qat'iy soliq bekor
qilingan, YATT va o'zini o'zi band qilganlar uchun 1% aylanma solig'i
kiritilgan, 100 mln so'mgacha ozod. Ya'ni **hisob yuritishi kerak bo'lgan
odamlar soni keskin ko'paydi, ularning aksariyatida buxgalter yo'q.**

### Narx va cheklov

## AMALDAGI QAROR (2026-08-25, kechqurun): CHEKLOV YO'Q

**Hech qanday cheklov qo'yilmaydi.** Sverka soni, korxona soni,
foydalanuvchi soni — hammasi cheksiz va bepul. Sayt narx haqida
**hech narsa demaydi**: tariflar narx sahifasidan, JSON-LD dan, SEO
matnidan va ofertadan olib tashlandi.

Egasining o'z so'zi:

> «Hamma narsani tekin qil. Qachon pulli qilish — mening ishim.
> Qachon odamlar o'rgansa, auditoriya juda katta bo'lsa — shunda
> pulli qilamiz. Qolgan qoladi, qolmagan ketadi.»

**Muddat kodga YOZILMADI.** Suhbat «ro'yxatdan o'tgan kundan 6 oy»
dan boshlangan edi. Sanoq kodga qo'yilmadi, chunki u bir kuni O'ZI
ishlab ketadi va hech kim kutmagan paytda hisoblar qulflanadi — pulli
qilish qarori esa egasida bo'lishi kerak, kodda emas.

**Yoqish nuqtasi bitta:** `src/lib/plans.ts` dagi
`free: { sverkaPerMonth, members }`. Ularni `3` va `1` ga qaytarish
yetarli — quyida tasvirlangan butun mexanizm joyida turibdi va
`verify-parsers` bilan qoplangan. `PLANS.buxgalter` (9 999) va
`PLANS.byuro` (39 999) kodda qoldi, faqat ko'rsatilmaydi.

Regress endi «3 ta» ni emas, **cheklov yo'qligini** tekshiradi: soxta
Firestore bilan 50 ta har xil sverka qilinadi, bittasi ham rad
etilmasligi va sanoq hujjati yozilmasligi shart.

⚠️ `docs/pitch-deck.html` da hali eski narx turibdi — egasi ataylab
«tegma» dedi.

---

## TARIX: nega avval bunday qilingan edi

Quyidagisi endi AMALDA EMAS, lekin sabablari saqlanadi — pulli
qilinadigan kun kelganda qaytadan o'ylanmasin.

**2026-08-25 ertalab:** cheklov oylik SVERKA soniga qo'yilgan edi
(bepul: oyiga 3 ta, korxona cheksiz; Buxgalter 9 999 so'm/oy;
Byuro 39 999 so'm/oy, 5 foydalanuvchi; yillik to'lovda 2 oy bepul).

#### Nega korxona soni tashlandi

2026-08-14 dagi qaror «bepul 3 ta korxona» edi va u cheklov USHLAYDI deb
faraz qilgandi. Ushlamas ekan — buni tajribali buxgalter aytdi
(2026-08-25) va kod tasdiqladi:

> «Korxonani 3 ta qilsang hech kim pulini bermaydi — farqi yo'q, o'sha
> korxonada sverka qilaveradi.»

Dalil: «korxona» — shunchaki nom va STIR yozilgan yozuv. Sverka esa
YUKLANGAN FAYLDAN ishlaydi. 10 mijozli buxgalter bitta «Mijozlar» degan
korxona ochib, o'n mijozning ko'chirmasini navbatma-navbat o'sha yerda
tekshiraveradi va mahsulotning butun qiymatini bepul oladi. U faqat
mijoz bo'yicha tarixni yo'qotadi — buning uchun oyiga pul to'lanmaydi.

#### Nega «saqlangan hisobot» ham emas

Oraliq taklif «saqlangan hisobot sonini sanash» edi. U ham teshik:
natijani saqlamasdan **Excel yuklash** bilan olib ketish mumkin. Ya'ni
saqlash — qiymat yetkazilgan lahza EMAS.

#### Sanoq birligi: ko'chirma egasi × davr oyi

Qiymat TAHLIL lahzasida yetkaziladi va ikkala tomonda ham SERVERDA
bajariladi (`/api/upload-preview`, `/api/income-audit`) — brauzer
natijani o'zi hisoblay olmaydi, demak sanoqni aylanib o'tib bo'lmaydi.

Kalit bank ko'chirmasidan olinadi: **egasining STIRi (yoki hisob
raqami) + davr boshlangan oy**. Shundan uch natija:

- **qayta yuklash bepul** — buxgalter farqni ko'radi, mijozdan
  fakturani so'raydi, to'g'rilangan ro'yxatni qayta yuklaydi; ko'chirma
  o'sha, davr o'sha, kalit o'sha. 2026-08-14 dagi «sverka sanog'i
  ishonch tug'ilayotgan lahzada urib qo'yadi» degan e'tiroz shu bilan
  yopiladi;
- **kirim va chiqim bitta hisoblanadi** — ikkalasida ham egasi va davr
  bir xil. Aks holda «3 ta» aslida 1,5 ta bo'lardi;
- **bitta korxonaga yig'ish yordam bermaydi** — kalit korxona yozuvidan
  emas, fayldan.

Yiqilgan urinish joy yemaydi: sanoq tahlil muvaffaqiyatli tugagach
band qilinadi.

#### Nega OYIGA, umuman emas

1–3 mijozli buxgalter baribir pul to'lamaydi — uni bepulda ushlab
turgan ma'qul, u gapiradi. 4+ mijozli buxgalter esa HAR OY devorga
uriladi, ya'ni to'lov qarori bir marta emas, muntazam ko'tariladi.
«Umuman 3 ta» esa uch marta ishlatib g'oyib bo'ladigan odam yasaydi.

Kod: `src/lib/plans.ts`, `src/lib/sverkaQuota.ts`. Invariantlar
`scripts/verify-parsers.cjs` da qulflangan (kalit mantig'i uchun 8 ta
tekshiruv + xabardagi son bilan rejadagi son bir xilligi).

**Narx qayerdan olindi (2026-08-14):** dastlab 149 000 taklif qilingan edi —
u bozordan emas, taxminiy hisobdan chiqqan. Foydalanuvchi **tajribali
buxgalterdan so'radi** va 9 999 ni oldi. Bozordan kelgan dalil taxmindan
ustun, shuning uchun narx almashtirildi.

Past narxning strategik asosi: hozirgi eng katta xavf — mahsulotni hech
kim ishlatmasligi. 9 999 «ha» deyishni oson qiladi va haqiqiy foydalanuvchi
bilan birga **haqiqiy bank formatlarini** olib keladi. Format xotirasi
umumiy bo'lgani uchun har bir yangi foydalanuvchi mahsulotni hamma uchun
kuchaytiradi — ya'ni bu bosqichda hajm daromaddan qimmatroq.

**Pog'ona korxonaga emas, FOYDALANUVCHIga qo'yildi.** «Cheksiz korxona
bitta narxga» pog'onani butunlay yo'q qilardi: 3 mijozli buxgalter ham,
300 mijozli byuro ham bir xil to'lardi va o'sish faqat yangi odamdan
kelardi, mavjud mijozdan hech qachon.

**Nega sverka soni emas** — dastlab «1 korxona + 5 bepul sverka» taklif
qilingan edi, uchta sabab bilan rad etildi:

1. **Mahsulotning o'z ish siklini jazolaydi.** Buxgalter sverkani bir
   marta qilmaydi: yuklaydi → farq ko'radi → faylni to'g'rilaydi →
   qayta yuklaydi. Birinchi haqiqiy sinovda 5 tasi tugaydi, ya'ni cheklov
   aynan ishonch tug'ilayotgan lahzada uradi.
2. **1 korxona qiymatni ko'rsatmaydi.** Mahsulotning kuchi — 20 ta
   mijozni bitta ekranda ko'rish. Bitta korxona bilan bu his qilinmaydi.
3. **Uni to'g'ri sanash eng qimmat yechim.** Sverka sanog'i uchun
   hisoblagich hujjat, oylik nolga qaytarish va parallel so'rovlar
   poygasi kerak. Korxona soni — bitta `count()` so'rovi, poyga yo'q.

**Nega 3 ta bepul, 1 ta emas:** 3 ta bilan buxgalter eng chalkash
mijozlarini kiritadi, natijani ko'radi va ODATLANADI. To'lov odatdan
keyin keladi, undan oldin emas.

**Nega 149 000:** 20 korxonaga bo'linganda oyiga bitta mijoz uchun
~7 500 so'm.

**TEKSHIRILMAGAN taxminlar** — narxni qotirishdan oldin so'ralsin:
- «Buxgalter bitta mijozdan 500 000 – 1 500 000 so'm oladi» — bu taxmin,
  o'lchov emas. 5 ta haqiqiy buxgalterdan so'ralsin.
- Didox / azma.uz narxlari tekshirilmagan.
- Sverkaga oyiga qancha vaqt ketishi o'lchanmagan.

**To'lov hozir qabul qilinmaydi:** yuridik maqom va Payme/Click shartnomasi
yo'q. Shuning uchun to'g'ri tartib — bugun bepul oylik 3 sverka cheklovi
bilan chiqish, «Hozir to'lay olmayman, lekin kerak» tugmasi esa faqat
aloqa qoldirsin (`src/components/reconciliation/QuotaWall.tsx`). Kim bosgani —
bu haqiqiy talab o'lchovi, taxmin emas.

### To'lov qabul qilish — tekshirilgan faktlar (2026-08-14)

| Savol | Javob | Manba |
|---|---|---|
| O'zini o'zi band qilib Click bilan ishlash | **Mumkin.** Soliq'dan «o'zini o'zi band» guvohnomasi kerak, My.gov orqali, keyin Click SuperApp | [business.click.uz/ru/employed](https://business.click.uz/ru/employed) |
| Payme Business | O'zini o'zi band qilganlarni ham qabul qiladi | [b2b-partner.payme.uz](https://b2b-partner.payme.uz/) |
| **Saytdagi ekvayring** | Odatda **YaTT yoki MChJ** talab qilinadi — STIR va hisob raqami bilan | [vc.ru sharhi](https://vc.ru/dev/3069312-podklyuchenie-onlayn-oplaty-v-uzbekistane-payme-click-uzum) |
| Dasturiy ta'minot — ruxsat etilgan faoliyatmi | **Ha**, 2026 qisqartirishdan keyin ham qoldi (104 → 72 tur) | [gazeta.uz](https://www.gazeta.uz/oz/2025/03/27/self-employed/) |
| Aylanma solig'i | **1%**, yillik 1 mlrd so'mgacha (ilgari 4%) | [buxgalter.uz](https://buxgalter.uz/oz/publish/doc/text212722_sk-2026_yakka_tartibdagi_tadbirkorlar_va_uzini_uzi_band_qilgan_shahslar_uchun_aylanmadan_olinadigan_soliq_buyicha_uzgarishlar) |
| Kim to'laydi | **To'lov tashkiloti soliq agenti** — Click pul o'tkazayotganda o'zi ushlab qoladi va hisobotni o'zi topshiradi | o'sha yerda |
| Komissiya | 0,8–2%, aniq raqam **faqat shartnomada** | vc.ru |

**HAL QILINMAGAN — o'zingiz tasdiqlang:** 100 mln so'mgacha soliqdan
ozod qilish 2026 dan **bekor qilinganmi**? [kun.uz](https://kun.uz/news/2025/08/12/2026-yildan-boshlab-yatt-va-ozini-band-qilganlar-uchun-aylanma-soligi-1-foizgacha-pasaytiriladi)
va [spot.uz](https://www.spot.uz/oz/2025/08/13/self-absorbed) — bekor
qilingan deydi (1% birinchi so'mdan). `buxgalter.uz` esa PQ-247 ga tayanib
ozodlik qoldi deydi. **Ikki xil javob.** Aylanma uzoq vaqt 100 mln dan
past bo'ladi, ya'ni bu farq butun soliqni belgilaydi — soliq
inspeksiyasidan yozma tasdiq oling.

### Uzum — talablar va komissiya (2026-08-14 da tekshirilgan)

Hujjatlar ([merchants.uzumbank.uz](https://merchants.uzumbank.uz/uz/)):
STIR · **hisob raqami** · bank nomi va MFO · **davlat ro'yxatidan
o'tganlik guvohnomasi** · rahbar pasporti · rahbarni tayinlash buyrug'i
(*YaTT tashqari*) · logotip · telefon.

**«YaTT tashqari» ni to'g'ri o'qish:** u 4-BANDGA tegishli, ya'ni YaTT
qabul qilinadi, faqat unga tayinlov buyrug'i kerak emas (rahbari yo'q).
Ammo **«o'zini o'zi band qilgan» umuman tilga olinmagan**, ro'yxatda esa
hisob raqami va ro'yxatdan o'tganlik guvohnomasi bor — ikkalasi ham
o'zini o'zi bandda yo'q. Demak **Uzum uchun kamida YaTT kerak.**

| | Uzum | Click / Payme |
|---|---|---|
| Uzum kartasi | **0%** | — |
| Boshqa kartalar | **0,4%** | 0,8–2% |
| O'zini o'zi band | ❌ (YaTT kerak) | ✅ Click'da alohida yo'nalish bor |

Ulash yo'llari: API (sayt, ilova, Telegram-bot), QR (statik/dinamik/
FastPay), ilova ichida to'lov. API'da **kartani bog'lash bor** — obuna
uchun aynan shu kerak. Hujjatlar: `developer.uzumbank.uz`.
Aloqa: +998 78 777 07 99. Ulanish bepul.

**SO'RALMAGAN, LEKIN HAL QILUVCHI SAVOL:** har tranzaksiyada QAT'IY
(fiksirlangan) haq bormi? 9 999 so'mlik oylik to'lovda 0,4% — bu 40 so'm,
arzimas. Lekin har o'tkazmada 500 so'm qat'iy haq bo'lsa, u daromadning
5% ini yeydi. Bu raqam e'lon qilinmagan, faqat shartnomada. **Yillik
to'lov** ham so'ralsin: 12 ta o'tkazma o'rniga 1 tasi bo'lsa, qat'iy haq
12 barobar kamayadi.

### Amaliy xulosa — ikki bosqich

1. **Bugun:** o'zini o'zi band + Click (QR/havola). Hisob raqami shart
   emas, 1% solig'ini Click o'zi ushlaydi. Eng tez boshlash yo'li.
2. **Saytda «Obuna» tugmasi kerak bo'lganda:** YaTT ga o'tiladi.
   O'shanda Uzum ham ochiladi va u eng arzon — 0% / 0,4%.

---

## 5. Kirish va egalik (2026-08-14)

### Topilgan narsa

Tizimda **egalik tushunchasi umuman yo'q edi.** `companies` hujjatida faqat
`{name, inn, createdAt}` turardi, Firestore qoidasi esa yagona shartga
tayanardi: «email `allowed_users` da bormi». Ya'ni **ikkinchi foydalanuvchi
qo'shilishi bilan u birinchisining barcha mijozlarini va ularning pul
aylanmasini ko'rardi.**

Ikkinchi teshik server tomonda edi: `companyId` klientdan keladi, Admin SDK
esa Firestore qoidalarini chetlab o'tadi. Ya'ni istalgan foydalanuvchi
begona `companyId` yuborib, o'sha korxonaning kontragent toifalarini
o'qiy va o'zgartira olardi.

Bu xato emas — tizim bitta odam uchun yozilgan edi. Lekin ro'yxatdan
o'tishni ochish uchun bu **birinchi bloker**.

### Qabul qilingan model

**Ish maydoni (workspace) — birinchi kundan.** Shaxsiy akkaunt ham, byuro
ham bitta shakl: shaxsiy akkaunt bu bitta a'zoli ish maydoni. Shuning uchun
jamoa qo'shilganda ma'lumot modeli qayta qurilmaydi.

```
workspaces/{id}                 name, ownerEmail, plan
workspaces/{id}/members/{email} role, status
companies/{id}                  + workspaceId
sverka_reports/{id}             + workspaceId
allowed_users/{email}           + workspaceId   ← klient shu yerdan o'qiydi
```

Uch qaror:

1. **Ish maydoni identifikatori — emailning o'zi.** Barqaror, taxmin
   qilinadigan, migratsiyada qayta hisoblash oson.
2. **Ish maydoni `requireUser()` ichida ta'minlanadi.** Har API
   chaqiruvida tekshiriladi, yo'q bo'lsa yaratiladi. Agar bu har route'da
   takrorlanganda, bittasida unutilib ma'lumot egasiz yozilardi.
3. **`orderBy` olib tashlandi.** `where` bilan birga u Firestore'da qo'shma
   indeks talab qiladi — indeks yaratilmaguncha so'rov xato beradi.
   Korxonalar soni oz, tartiblash klientda.

### Format xotirasi — ataylab umumiy qoldi

`excel_formats` barcha ish maydonlari uchun bitta. Bu **kuchli tomon**:
qancha ko'p foydalanuvchi bo'lsa, shuncha ko'p bank shakli taniladi —
yangi foydalanuvchi birinchi kunidayoq boshqalar o'rgangan formatlardan
foydalanadi. Lekin unda `sampleFile` — fayl nomi saqlanardi, unda esa
mijoz firmasining nomi turadi. Endi faqat kengaytma saqlanadi (`.xls`).

Kontragent toifasi bo'yicha «boshqalar qanday belgilagan» maslahati ham
umumiy, lekin unda ostona bor: kamida `MIN_COMPANIES_FOR_HINT` ta mustaqil
korxona bir xil toifani tanlagan bo'lishi shart. Ya'ni bitta ish maydonining
qarorini undan chiqarib bo'lmaydi.

### Ro'yxatdan o'tish — BAJARILDI (2026-08-14)

Qaror: **o'zi ro'yxatdan o'tadi va darhol ishlaydi.** Tasdiqlash kutilmaydi.

Oqim: klient Firebase'da hisob ochadi → `/api/signup` ni o'z tokeni bilan
chaqiradi → route `allowed_users` va ish maydonini yaratadi.

`/api/signup` ATAYLAB `requireUser()` dan foydalanmaydi: u foydalanuvchi
`allowed_users` da bo'lishini talab qiladi, yangi kelgan odamda esa u
hali yo'q — tovuq-tuxum. Shuning uchun token o'sha yerda tekshiriladi.

Ikkinchi bosqich yiqilsa hisob yarim holatda qolmasligi uchun Firebase
hisobi o'chiriladi va odam qaytadan urinib ko'ra oladi.

**Login sahifasidan tayyor email va parol olib tashlandi** — ular sinov
uchun yozib qo'yilgan edi va ochiq mahsulotda turmasligi kerak.

### Cheklov QAYERDA tekshiriladi

Korxona qo'shish klientdan Firestore'ga to'g'ridan-to'g'ri yozilardi.
Endi u faqat `/api/companies` orqali o'tadi, `firestore.rules` da esa
klient uchun `create` YOPIQ.

Sabab: **Firestore qoidalari hujjatlarni SANAY OLMAYDI.** «3 tadan ko'p
bo'lmasin» degan shartni qoidada yozib bo'lmaydi, klient tomondagi
tekshiruv esa cheklov emas — uni har kim chetlab o'tadi.

---

---

## 6. Atamalar lug'ati — 5-nomuvofiqlik YOPILDI

2-bo'limdagi jadvalda «5) Ikki sahifa teskari lug'at ishlatadi» degan
muammo bor edi. U faqat so'zlarda emas, **RAQAM ISHORASIDA** ham
mavjud ekan — va bu jiddiyroq.

**Qaror (2026-08-16): farq = debet − kredit, ikkala sverkada.**

| Sverka | Hisob | Debet | Kredit | Farq |
|---|---|---|---|---|
| Chiqim | 6010, **passiv** | to'langan pul | kelgan faktura | to'lov − faktura |
| Kirim | 4010, **aktiv** | yozilgan faktura | tushgan pul | faktura − to'lov |

Ma'nosi ikkala tomonda bir xil bo'ladi va 2-bo'limdagi lug'atga aynan
mos tushadi: **musbat = «Улар қарздор» · manfiy = «Биз қарздормиз».**

Bu tanlov emas, **buxgalteriya qoidasi**: har qanday hisobda saldo =
debet − kredit. Tasdiq loyihaning o'z ichida bor edi — `aktSverki.ts`
(«Сальдо конечное», etalon PDF bilan qatorma-qator mos) doim
`faktura − to'lov` hisoblab kelgan, ekrandagi «Фарқ» esa unga teskari
turardi. Ya'ni bitta oynada ikkita qarama-qarshi ishora bor edi.

Rang esa ishoraga emas, **nima yetishmayotganiga** bog'lanadi:
`bad` — pul yetishmayapti (qarz), `warn` — qog'oz yetishmayapti
(faktura yozish yoki so'rash kerak).

---

## 7. Keyingi qadam

A yo'l tanlandi, nom qo'yildi, UI 3-bosqichgacha bajarildi. Qolgani:

1. **Jonli Firestore'da sinash** — ro'yxatdan o'tish, ish maydoni va
   3 korxona cheklovi hech qachon haqiqiy bazada ishlamagan.
2. **UI 4-bosqich** — natija ekrani: avval «nechta kontragentda farq
   bor va qancha», jadval keyin.
3. **UI 5-bosqich** — yuklash oqimi: tizim nima topganini OLDIN aytadi.
4. **Ekran tomonida test yo'q** — parser 58 ta tekshiruv bilan
   qoplangan, sahifalar nol.
5. **«Ko'proq kerak» tugmasi** — haqiqiy talab o'lchovi.

---

## 8. Raqobat — 2026-08-17 da tekshirilgan

### 8.1. «Bitimchi AI» — RAQIB EMAS

So'ralgan mahsulot topildi: **`bitimchi.uz`**, o'zini «Bitimchi AI»
deb ataydi.

| | |
|---|---|
| **Nima qiladi** | Elektron imzo bilan **shartnoma imzolash** platformasi: hujjatni yuklaysan → imzolovchilarni qo'shasan → yuborasan → arxivlanadi |
| **Kimga** | Kadrlar bo'limi, yuristlar, ta'lim muassasalari |
| **Kirish nuqtasi** | Telegram bot: `t.me/bitimchi_ai_bot` |
| **Narx** | E'lon qilinmagan. «30 kunlik bepul sinov, karta so'ralmaydi» |
| **Aloqa** | Faqat Telegram: `@Bitimchi_support` |
| **Sayt** | Lovable'da yig'ilgan (footer'da yozib qo'yilgan) |

**Bizga o'xshash narsa qilmayapti.** Saytida buxgalteriya, bank
ko'chirmasi, faktura yoki sverka haqida bitta so'z ham yo'q. «AI»
so'zi nomida, lekin sahifada AI aynan nima qilishi yozilmagan.

Nom o'xshashligi tasodif: *bitim* = shartnoma, ya'ni «bitimchi» =
shartnoma tuzuvchi. Bizniki *moslik* = solishtirish natijasi.

**Ular o'z toifasida ham yolg'iz emas:** `e-bitim.uz` va `DOCCO`
(`docco.uz`) aynan shu ishni qiladi va DOCCO E-IMZO bilan
shartnomalar reyestrini allaqachon beradi.

**Xulosa:** kuzatishga arzimaydi. Bir joyda kesishishi mumkin —
agar kelajakda «akt sverkini imzolash» kerak bo'lsa, ular
sherik bo'lishi mumkin, raqib emas.

### 8.2. HAQIQIY qo'shni o'yinchilar

Bular topildi va ular Bitimchi'dan **ancha muhimroq**:

| Kim | Nima qiladi | Nega muhim |
|---|---|---|
| **Didox.uz** | EDO operatori, **250 000+ korxona**. E-faktura yuborish BEPUL. Bank ko'chirmasini yuklash bor. SDK/API bor | Fakturaning MANBASI ularda. Sverkani funksiya sifatida qo'shsa — bir kunda |
| **Faktura.uz** | Birinchi rasmiy EDO operatori. **Ochiq REST API**: `api.faktura.uz/help` | Bizga fakturani Excel'siz olish yo'li — shu yerda |
| **Dibank.uz** | 1C yoki Didox ichidan **25+ bank** bilan to'g'ridan-to'g'ri almashuv | Bankning MANBASI ularda. Sverka yo'q — hujjat uzatish |
| **1UZ Buxgalteriya** | «Загрузить выписки банка» — 6 ta bank | Bizning Excel parserimizga eng yaqin narsa. Lekin bu buxgalteriya dasturining ichidagi funksiya |
| **Salom AI** (`salom-ai.uz`) | Kichik biznesga AI buxgalteriya maslahati | Boshqa toifa: maslahat, tekshiruv emas |

**Kontragent kesimida bank ↔ faktura sverkasini avtomatik qilib,
farqni ko'rsatadigan MUSTAQIL mahsulot topilmadi.** Ya'ni bo'sh
joy bor.

### 8.3. Loyiha yuradimi — halol javob

**Mahsulot sifatida — HA. Biznes sifatida — HALI EMAS,
va oyna tor.**

**Foydasiga (taxmin emas, o'lchov):**
- Tizim buxgalter O'TKAZIB YUBORGAN farqlarni topdi: HUDUDGAZ
  50 278 000, pochta 227 503, Zero Waste 1 366 176.
- Eng qiyin texnik qism tayyor: 6 ta bank formati, qoldiq
  tenglamasi, 171 ta tekshiruv, toifa himoyasi.
- 2026 dan o'zini o'zi band qilganlar ham e-faktura yozadi —
  hisob yuritishi kerak bo'lganlar soni o'sdi.
- Narx haqiqiy buxgalterdan olingan (9 999), taxminan emas —
  HOZIR QO'LLANMAYDI (mahsulot butunlay bepul), lekin dalil
  saqlanadi: pulli qilinadigan kun kelganda qaytadan so'ralmasin.

**Qarshi — muhimlik tartibida:**

1. **PLATFORMA XAVFI — eng jiddiysi.** Didox'da 250 000 korxona
   bor va faktura ularning ichidan chiqadi; Dibank esa 25 ta
   bank bilan ulangan. Ikkovi ham bizning yagona texnik
   ustunligimizni — «Excel'ni o'qiy olish» ni — bir kunda
   keraksiz qilib qo'yishi mumkin. Excel parseri **himoya
   devori emas, vaqtinchalik ko'prik**.
2. **Oyiga bir marta ochiladi.** Obuna sotish qiyin (4-bo'limda
   allaqachon yozilgan).
3. **Hech kim ishlatib ko'rmagan.** Jonli Firestore sinovi
   qilinmagan, bitta ham haqiqiy foydalanuvchi yo'q. Bu
   TEXNIK ish emas, mahsulotning eng katta noma'lumi.
4. **To'lov ulanmagan** — yuridik maqom kerak.

**Nima qilish kerak (tartib bilan):**

1. **10 ta haqiqiy buxgalterga bering.** Yangi funksiya emas.
   O'lchov: nechtasi IKKINCHI marta qaytadi. Shu raqamsiz
   qolgan hamma qaror taxmin.
2. **`api.faktura.uz` bilan gaplashing — hoziroq.** API ochiq va
   hujjatlashtirilgan. Faktura tomonini API'dan olsak,
   foydalanuvchi ikkita fayl o'rniga bittasini yuklaydi, biz
   esa platforma xavfini SHERIKLIKKA aylantiramiz.
3. **Pozitsiya: «hujjat aylanmasi» emas, TEKSHIRUV.** Didox
   hujjatni tashiydi, biz uni TEKSHIRAMIZ. Qoldiq tenglamasi,
   toifa himoyasi va farq ishorasi intizomi — birortasida yo'q.
   Nom ham shunga mos: `Moslik` = mos keldimi.

**Qaror nuqtasi:** 10 ta buxgalterdan 3 tasi ikkinchi oyda ham
ishlatsa — davom etiladi. Bittasi ham qaytmasa, muammo kodda
emas: sverka ular uchun og'riq emas ekan.
