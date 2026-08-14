# Mahsulot qarorlari — nom, atamalar, UI, bozor

Bu hujjat KOD emas, QAROR saqlaydi. `HANDOFF.md` texnik holatni yozadi,
bu esa «nima uchun shunday atadik / shunday chizdik» ni.

> **QABUL QILINGAN QARORLAR (2026-08-13)**
> - **Yo'nalish: A** — mahsulot BUXGALTER uchun sverka vositasi.
>   YATT/soliq moduli hozircha yozilmaydi.
> - **Nom: kutiladi.** Shuning uchun UI atamalari brenddan MUSTAQIL
>   qilib to'g'rlandi — nom keyin qanday bo'lishidan qat'i nazar
>   ular o'zgarmaydi.
> - **1-bosqich (lug'at) BAJARILDI** — 3-bo'limga qarang.

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

**Tavsiyam: `Moslik`** (domen `moslik.uz`, tagline yuqorida). Sabab: u
mahsulot NIMA QILISHINI aytadi, kimga qarshi ekanini emas; ikkala yo'lda
ham ishlaydi; qisqa va o'zbekcha.

**3-yo'l — hech narsa o'zgarmaydi**, «Buxgaltersiz» qoladi, mahsulot A da
qoladi. Eng arzon, lekin nom bilan mahsulot bir-biriga qarama-qarshi
turaveradi.

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

**2-bosqich — dizayn tizimi.** Hozir har sahifa o'z rangi va o'z
oralig'i bilan yozilgan. Kerak bo'ladi: rang tokenlari (kirim `#10B981`,
chiqim `#4F46E5` — logotipdagi ranglar), bitta shrift shkalasi, bitta
kartochka/jadval/tugma komponenti. `globals.css` + `src/components/ui/`.

**3-bosqich — bitta sahifa, ikki yo'nalish.** Hozir chiqim va kirim
alohida sahifa, alohida lug'at, alohida eksport. Buxgalter uchun bu bitta
ish: «shu korxonani solishtir». Yo'nalish — sahifa emas, tab.

**4-bosqich — natija ekranini qayta chizish.** Hozir birinchi ko'rinadigan
narsa — 20 ustunli jadval. Ko'rinishi kerak bo'lgan narsa: **nechta
kontragentda farq bor va u qancha**. Jadval — ikkinchi ekranda.

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

### Narx va cheklov (2026-08-14 da qabul qilingan)

**Cheklov SVERKA soniga emas, KORXONA soniga qo'yiladi. Sverka har doim
cheksiz.**

| Reja | Narx | Korxona | Foydalanuvchi |
|---|---|---|---|
| **Bepul** | 0 | **3 ta** | 1 |
| **Buxgalter** | **9 999 so'm/oy** | Cheksiz | 1 |
| **Byuro** | **39 999 so'm/oy** | Cheksiz | 5 |

Yillik to'lovda 2 oy bepul.

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
yo'q. Shuning uchun to'g'ri tartib — bugun bepul 3 korxona cheklovi bilan
chiqish, «Ko'proq kerak» tugmasi esa faqat aloqa qoldirsin. Kim bosgani —
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

## 6. Keyingi qadam

Hammasi bitta savolga tayanadi: **A yo'lmi, B yo'lmi, ikkalasimi.**
Nom ham, UI ham, narx ham shundan keyin bir ma'noli bo'ladi.
