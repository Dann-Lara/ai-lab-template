'use client';

import { useI18n } from '../../lib/i18n-context';
import { locales, type Locale } from '../../lib/i18n';

const LABELS: Record<Locale, string> = { es: '🇲🇽 ES', en: '🇺🇸 EN' };

export function LanguageSwitcher(): React.JSX.Element {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
            locale === loc
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
