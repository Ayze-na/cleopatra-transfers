import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import CustomCursor from '@/components/CustomCursor';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen">
        <CustomCursor />
        <Header locale={locale} />
        <main className="pt-16">
          {children}
        </main>
        <Footer locale={locale} />
        <FloatingWhatsApp />
      </div>
    </NextIntlClientProvider>
  );
}
