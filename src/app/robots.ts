import type { MetadataRoute } from 'next';
import { LOCALES } from '@/lib/i18n';
import { PATHS } from '@/lib/routes';
import { SITE_URL } from '@/lib/seo';

/**
 * Qidiruv robotlari uchun qoida.
 *
 * Kirish ortidagi sahifalar ikki qatlamda yopiladi: bu yerda
 * `disallow` bilan (robot umuman kirmasin) va sahifaning o'zida
 * `noindex` bilan (`lib/pageMeta.ts`). Ikkisi ham kerak — `disallow`
 * indekslashni to'xtatmaydi, faqat o'qishni; boshqa saytdan havola
 * bo'lsa manzil baribir indeksga tushishi mumkin.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = LOCALES.flatMap((l) => [
    `/${l}${PATHS.clients}/`,
    `/${l}${PATHS.adminUsers}`,
  ]);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...privatePaths, '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
