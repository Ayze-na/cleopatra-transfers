import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const t = await getTranslations('about');
  return (
    <main className="min-h-screen bg-pharaoh-bg py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-cinzel text-gold mb-8 text-center">{t('title')}</h1>
        <div className="space-y-6 text-pharaoh-ivory/80 leading-relaxed">
          <p>{t('para1')}</p>
          <p>{t('para2')}</p>
          <p>{t('para3')}</p>
        </div>
      </div>
    </main>
  );
}
