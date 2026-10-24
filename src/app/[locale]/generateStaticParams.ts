import {notFound} from 'next/navigation';

const locales = ['en', 'ar', 'ru', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}
