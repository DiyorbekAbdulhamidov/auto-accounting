# Moslik

Buxgalter uchun **bank ko'chirmasi ↔ faktura** sverkasi.

Excel/CSV fayllarni yuklaysiz — tizim har bir kontragent bo'yicha
raqamlarni solishtiradi va farqi borlarini ajratib beradi. Akt sverki,
qarzdorlik yoshi (FIFO), Excel hisobot.

Jonli: [www.moslik.uz](https://www.moslik.uz)

## Ishga tushirish

```bash
npm install
npm run dev
```

`.env` kerak (Firebase klient + admin kalitlari). U repozitoriyda yo'q.

## Tekshiruv — har o'zgarishdan keyin shu tartibda

```bash
node scripts/verify-parsers.cjs
node scripts/check-contrast.cjs
npx tsc --noEmit
npx eslint src --max-warnings=0
npx next build
```

`verify-parsers` — parserlarni **haqiqiy bank fayllariga** qarshi
tekshiradi (Итого qatori, qoldiq tenglamasi, toifalar yig'indisi,
reja cheklovining kaliti). U yiqilsa, o'zgarish qabul qilinmaydi.

`next build` ni dev-server ishlab turganda yurgizmang — `.next` umumiy.

## Tuzilishi

| Yo'l | Nima |
|---|---|
| `src/lib/statementAudit.ts` | Chiqim sverkasi parseri (bank ko'chirmasi ↔ olingan faktura) |
| `src/lib/incomeParser.ts` | Kirim sverkasi parseri (bank kirimi ↔ yuborilgan faktura) |
| `src/lib/bankStatements.ts` | Bank shakllari — ustun shapka bo'yicha topiladi, indeks bo'yicha emas |
| `src/lib/plans.ts`, `sverkaQuota.ts` | Rejalar va oylik sverka cheklovi |
| `src/components/ui/` | Dizayn tizimi (sinflar `styles.ts` da, ranglar `globals.css` da) |
| `src/lib/i18n/dictionary.ts` | To'rt til. Kalit — kirill matnning O'ZI |
| `scripts/` | Tekshiruv harnesslari |

## Hujjatlar

- **`docs/KEYINGI-CHAT-PROMPT.md`** — joriy holat, navbatdagi ish,
  qoidalar va tuzoqlar. **Ishni shundan boshlang.**
- `HANDOFF.md` — texnik ma'lumotnoma: parserlar, bank formatlari,
  deploy tartibi.
- `MAHSULOT-QARORLARI.md` — nima uchun shunday qilingan: nom, atamalar,
  narx, bozor.
- `docs/TAHLIL-2026-08-18.md` — o'sha kungi holat surati (tarixiy).
