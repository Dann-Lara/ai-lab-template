'use client';

import { useI18n } from '../../lib/i18n-context';
import { locales, type Locale } from '../../lib/i18n';

export function LanguageSwitcher(): React.JSX.Element {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-2">
      {locales.map((loc) => (
        <button key={loc} onClick={() => setLocale(loc as Locale)}
          className={`font-mono text-[9px] font-bold italic uppercase tracking-widest transition-all
            ${locale === loc
              ? 'text-sky-400 underline underline-offset-4 decoration-2'
              : 'text-slate-600 opacity-50 hover:opacity-100'
            }`}>
          {loc}
        </button>
      ))}
    </div>
  );
}
