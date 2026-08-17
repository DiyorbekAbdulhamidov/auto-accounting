import type { NextConfig } from "next";

// Diqqat: bu yerda `outputFileTracingRoot` BO'LMASLIGI kerak.
// U monorepo uchun mo'ljallangan — loyiha papkasidan TASHQARIDAGI fayllarni
// trace'ga qo'shish uchun. Bu loyiha monorepo emas, standart qiymat to'g'ri.
// Uni `process.cwd()` ga qo'yish serverless build'da fayl tracing'ni buzib,
// `firebase-admin` funksiya bundle'iga tushmay qolishiga olib kelgan edi
// (barcha /api route'lari 500 bilan yiqilardi).
//
// ESKI MARSHRUTLAR bu yerda EMAS, `src/proxy.ts` da.
// Sabab: yo'naltirish manzili TILGA bog'liq (`/korxonalar` -> `/uz/clients`
// yoki `/ru/clients`), konfiguratsiya esa foydalanuvchi tilini bilmaydi.
const nextConfig: NextConfig = {};

export default nextConfig;
