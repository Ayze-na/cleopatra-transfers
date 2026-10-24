import { getTranslations } from 'next-intl/server';
import { getPrivacyDocument } from '@/lib/site-documents';

export const dynamic = 'force-dynamic';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('privacy');
  const document = await getPrivacyDocument(locale);

  return (
    <main className="min-h-screen bg-pharaoh-bg py-20 px-4">
      <div className="max-w-4xl mx-auto text-pharaoh-ivory/80">
        <h1 className="text-4xl font-cinzel text-gold mb-8">{t('title')}</h1>
        <div className="space-y-4 leading-relaxed">
          {document ? (
            <div className="whitespace-pre-wrap text-pharaoh-ivory/80">{document}</div>
          ) : (
            <>
              <p>{t('empty')}</p>
              <p>{t('passportNote')}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
