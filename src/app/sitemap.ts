import type { MetadataRoute } from 'next';
import { LOCALES, LOCALE_HREFLANG, DEFAULT_LOCALE } from '@/lib/i18n';
import { PATHS, PUBLIC_PATHS } from '@/lib/routes';
import { SITE_URL } from '@/lib/seo';

/**
 * SAYT XARITASI — 4 til × 5 ochiq sahifa = 20 manzil.
 *
 * Har yozuvda `alternates.languages` bor: Google bir sahifaning
 * to'rt tilli variantini shu orqali bog'laydi. Usiz u ularni
 * mustaqil (va bir-biriga o'xshash) sahifalar deb hisoblardi.
 *
 * Kirish ortidagi sahifalar (`clients`, `admin`) bu yerga UMUMAN
 * tushmaydi — ular mijoz ma'lumoti.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const key of PUBLIC_PATHS) {
    const languages: Record<string, string> = {};
    for (const l of LOCALES) languages[LOCALE_HREFLANG[l]] = `${SITE_URL}/${l}${PATHS[key]}`;
    languages['x-default'] = `${SITE_URL}/${DEFAULT_LOCALE}${PATHS[key]}`;

    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${PATHS[key]}`,
        // Bosh sahifa eng muhimi, login eng kami
        priority: key === 'home' ? 1 : key === 'login' ? 0.3 : 0.8,
        changeFrequency: key === 'home' ? 'weekly' : 'monthly',
        alternates: { languages },
      });
    }
  }

  return entries;
}
