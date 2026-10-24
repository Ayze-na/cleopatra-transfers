import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{locale: string}> }) {
  const { locale } = await params;
  return <HomeClient locale={locale} />;
}
