import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://cleopatratransfers.com';
  const locales = ['en', 'ar', 'ru', 'de'];
  const paths = ['', '/direct-rides', '/trip-files', '/about', '/contact', '/privacy', '/terms'];
  const entries: MetadataRoute.Sitemap = [];
  locales.forEach((locale) => {
    paths.forEach((p) => {
      entries.push({
        url: `${base}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: p === '' ? 1 : 0.7,
      });
    });
  });
  return entries;
}
