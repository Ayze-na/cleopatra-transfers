export async function generateReference(type: 'direct' | 'trip'): Promise<string> {
  const prefix = type === 'direct' ? 'CT-D-' : 'CT-T-';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
}

export function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EGP: '£E',
    EUR: '€',
  };
  return `${symbols[currency] || currency} ${amount}`;
}

export function getTranslation(translations: any, locale: string): string {
  if (!translations) return '';
  if (typeof translations === 'string') return translations;
  return translations[locale] || translations['en'] || '';
}
