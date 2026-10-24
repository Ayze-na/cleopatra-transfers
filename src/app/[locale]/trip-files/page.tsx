'use client';

import TripFileBuilder from '@/components/forms/TripFileBuilder';
import { useTranslations } from 'next-intl';

export default function TripFilesPage() {
  const t = useTranslations('tripFiles');
  return (
    <main className="min-h-screen bg-pharaoh-bg py-20 px-4">
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-cinzel text-gold mb-4">{t('title')}</h1>
        <p className="text-pharaoh-ivory text-lg">{t('subtitle')}</p>
      </div>
      <TripFileBuilder />
    </main>
  );
}


