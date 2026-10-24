'use client';

import DirectRideWizard from '@/components/forms/DirectRideWizard';
import { useTranslations } from 'next-intl';

export default function DirectRidesPage() {
  const t = useTranslations('directRides');
  return (
    <main className="min-h-screen bg-pharaoh-bg py-20 px-4">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-cinzel text-gold mb-4">{t('title')}</h1>
        <p className="text-pharaoh-ivory text-lg">{t('subtitle')}</p>
      </div>
      <DirectRideWizard />
    </main>
  );
}


