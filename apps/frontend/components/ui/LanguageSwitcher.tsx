'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '../../lib/i18n';

const LOCALE_LABELS: Record<Locale, string> = {
  en: '🇺🇸 EN',
  es: '🇲🇽 ES',
};

export function LanguageSwitcher(): React.JSX.Element {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale): void {
    // Strip current locale prefix if present, then add new one
    const segments = pathname.split('/');
    const hasLocale = locales.includes(segments[1] as Locale);
    const pathWithoutLocale = hasLocale ? '/' + segments.slice(2).join('/') : pathname;
    const newPath = next === 'es' ? pathWithoutLocale || '/' : `/${next}${pathWithoutLocale}`;
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
            locale === loc
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
