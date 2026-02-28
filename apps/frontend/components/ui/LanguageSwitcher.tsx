'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { locales, type Locale } from '../../lib/i18n';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇲🇽',
};

export function LanguageSwitcher(): React.JSX.Element {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: Locale): void {
    // With localePrefix:'never', next-intl stores locale in cookie NEXT_LOCALE
    // Setting the cookie and refreshing is the correct approach
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    startTransition(() => {
      router.replace(pathname);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={isPending}
          aria-label={`Switch to ${loc.toUpperCase()}`}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md
                      transition-all duration-150 disabled:opacity-50 ${
            locale === loc
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span>{LOCALE_FLAGS[loc]}</span>
          <span>{LOCALE_LABELS[loc]}</span>
        </button>
      ))}
    </div>
  );
}
