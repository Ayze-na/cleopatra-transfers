'use client';

import { CURRENCIES, useCurrency } from '@/lib/currency/CurrencyContext';

export default function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, mounted } = useCurrency();
  const safeCurrency = mounted ? currency : 'USD';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-pharaoh-bg/40 p-1 ${
        compact ? '' : 'text-sm'
      }`}
      role="group"
    >
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={safeCurrency === code}
          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
            safeCurrency === code
              ? 'bg-gold text-black'
              : 'text-pharaoh-ivory/70 hover:text-gold'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
