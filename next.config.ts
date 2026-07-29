import type { NextConfig } from "next";

// Diqqat: bu yerda `outputFileTracingRoot` BO'LMASLIGI kerak.
// U monorepo uchun mo'ljallangan — loyiha papkasidan TASHQARIDAGI fayllarni
// trace'ga qo'shish uchun. Bu loyiha monorepo emas, standart qiymat to'g'ri.
// Uni `process.cwd()` ga qo'yish serverless build'da fayl tracing'ni buzib,
// `firebase-admin` funksiya bundle'iga tushmay qolishiga olib kelgan edi
// (barcha /api route'lari 500 bilan yiqilardi).
const nextConfig: NextConfig = {};

export default nextConfig;