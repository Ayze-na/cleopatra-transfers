'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const CURRENCIES = ['USD', 'EGP', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

const CURRENCY_STORE_KEY = 'ct_currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** True once hydrated on the client (avoids SSR/CSR mismatch). */
  mounted: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'USD',
  setCurrency: () => {},
  mounted: false,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(CURRENCY_STORE_KEY);
    if (stored && (CURRENCIES as readonly string[]).includes(stored)) {
      setCurrencyState(stored as Currency);
    }
  }, []);

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    window.localStorage.setItem(CURRENCY_STORE_KEY, next);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, mounted }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
