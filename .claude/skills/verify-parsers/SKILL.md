---
name: verify-parsers
description: Sverka parserlarini haqiqiy bank fayllariga qarshi tekshirish. Har qanday o'zgarish `src/lib/statementAudit.ts`, `bankStatements.ts`, `incomeParser.ts`, `universalParser.ts`, `excelWorkbook.ts`, `formatMemory.ts`, `counterpartyCategory.ts`, `aging.ts` yoki `counterpartyMerge.ts` ga tegsa — SHU skill ishga tushirilsin. Yangi bank fayli kelganda ham shu.
---

# Parserlarni tekshirish

Bu loyihada raqam noto'g'ri chiqishi eng qimmat xato turi. Shuning uchun
har qanday parser o'zgarishidan keyin regress majburiy.

## Ishga tushirish

```bash
node scripts/verify-parsers.cjs
```

Fayllar boshqa papkada bo'lsa:

```bash
node scripts/verify-parsers.cjs "C:/boshqa/papka"
```

Chiqish kodi 0 — hammasi o'tdi, 1 — kamida bitta tekshiruv yiqilgan.

## Nimani tekshiradi

1. **«ИТОГО»** — har varaqda o'qilgan qatorlar yig'indisi faylning o'z
   yakuniy qatoriga teng bo'lishi shart.
2. **Qoldiq tenglamasi** — boshlang'ich qoldiq + kredit − debet = oxirgi
   qoldiq. «Итого»dan mustaqil. **Debet bilan kredit almashib ketsa
   «Итого» buni sezmaydi, bu esa sezadi** — Ipoteka/ASBT fayli aynan
   shu xatoni keltirgan edi.
3. **Toifalar** — kommunal/byudjet kesimlari yig'indisi umumiy JAMIga
   teng bo'lishi shart (toifalash pul yo'qotmasligi kerak).
4. **Davr kelishuvi** — bank ko'chirmasi va faktura ro'yxati bir xil
   davrni qamrashi kerak. 1 oylik ko'chirma + 7 oylik faktura haqiqiy
   fayllarda 3 258 650 804 so'mlik soxta farq bergan edi.
5. **Yopilmagan fakturalar** — FIFO qoldig'i jadvaldagi «Фарқ» bilan
   bir xil narsani aytishi shart: `sum(outstanding) − advance =
   kredit − debet`.
6. **Birlashtirish** — qatorlar qo'shilganda `sum(totalDebit)`,
   `sum(totalCredit)`, o'tkazmalar soni va oylik kesim
   O'ZGARMASLIGI shart. Shuningdek nom, STIR va TOIFA ASOSIY
   qatordan olinishi tekshiriladi: «kommunal» a'zo butun guruhni
   asosiy sverkadan chiqarib yuborishi mumkin edi.

## Qoidalar

- **Raqamni "to'g'rilash" uchun qo'lda tuzatma qo'shilmaydi.** Faqat
  sabab topiladi va manba bilan solishtiriladi.
- Yiqilgan tekshiruvni oq ro'yxatga qo'shishdan oldin **sababi
  isbotlanishi** shart. `KNOWN_GAP` da hozir ikkita yozuv bor va
  ikkalasi ham manba faylda qatorlar o'chirilganidan (isbotlangan).
- Yangi bank fayli kelsa: `ETALON` ga faylning o'z «Итого» raqamlarini
  qo'shing, keyin skriptni chopib ko'ring.

## Qo'shimcha tekshiruvlar

Parser kodiga tegilgan bo'lsa, bulardan keyin:

```bash
npx tsc --noEmit
npx eslint src/lib src/app
npx next build
```
