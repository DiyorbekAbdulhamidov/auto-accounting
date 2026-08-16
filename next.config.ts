import type { NextConfig } from "next";

// Diqqat: bu yerda `outputFileTracingRoot` BO'LMASLIGI kerak.
// U monorepo uchun mo'ljallangan — loyiha papkasidan TASHQARIDAGI fayllarni
// trace'ga qo'shish uchun. Bu loyiha monorepo emas, standart qiymat to'g'ri.
// Uni `process.cwd()` ga qo'yish serverless build'da fayl tracing'ni buzib,
// `firebase-admin` funksiya bundle'iga tushmay qolishiga olib kelgan edi
// (barcha /api route'lari 500 bilan yiqilardi).
const nextConfig: NextConfig = {
  // ESKI MARSHRUTLAR.
  //
  // `/excel-audit` va `/income-audit` — ikki alohida sverka sahifasi edi.
  // Endi ikkalasi bitta korxona sahifasining tabi (`/korxonalar/[id]`).
  // Eski manzil saqlangan xatcho'p yoki ochiq qolgan yorliqdan kelishi
  // mumkin, shuning uchun 404 emas — yo'naltirish.
  //
  // `permanent: false` (307) ATAYLAB: manzillar hali ommага chiqmagan va
  // 308 brauzerda doimiy keshlanadi — keyin fikr o'zgarsa qaytarib
  // bo'lmasdi.
  async redirects() {
    return [
      { source: "/excel-audit", destination: "/korxonalar", permanent: false },
      {
        source: "/excel-audit/companies/:id",
        destination: "/korxonalar/:id",
        permanent: false,
      },
      { source: "/excel-audit/:path*", destination: "/korxonalar", permanent: false },
      { source: "/income-audit", destination: "/korxonalar", permanent: false },
    ];
  },
};

export default nextConfig;
