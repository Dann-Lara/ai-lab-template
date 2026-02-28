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

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  t: getMessages(defaultLocale),
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== defaultLocale) setLocaleState(stored);
  }, []);

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
