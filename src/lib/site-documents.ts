import { createClient } from '@/lib/supabase/server';

async function fetchDoc(key: string, locale: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) return '';

  const raw = data.value as unknown;
  const doc = (raw ?? {}) as Record<string, string>;
  const value = doc[locale] ?? doc['en'] ?? '';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export async function getTermsDocument(locale: string) {
  return fetchDoc('terms_document', locale);
}

export async function getPrivacyDocument(locale: string) {
  return fetchDoc('privacy_document', locale);
}
