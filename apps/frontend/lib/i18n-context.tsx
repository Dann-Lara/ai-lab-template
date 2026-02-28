'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  defaultLocale, getMessages, getStoredLocale, setStoredLocale,
  type Locale, type Messages,
} from './i18n';

interface I18nContextValue {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
}

// Read locale synchronously on module init (client-side only)
// This runs before the first render, so no language flash
function getInitialLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  return getStoredLocale();
}

const initialLocale = getInitialLocale();

const I18nContext = createContext<I18nContextValue>({
  locale: initialLocale,
  t: getMessages(initialLocale),
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Re-read on mount in case cookie changed between SSR and hydration
    const stored = getStoredLocale();
    if (stored !== locale) setLocaleState(stored);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setLocale(next: Locale): void {
    setStoredLocale(next);
    setLocaleState(next);
  }

  return (
    <I18nContext.Provider value={{ locale, t: getMessages(locale), setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
