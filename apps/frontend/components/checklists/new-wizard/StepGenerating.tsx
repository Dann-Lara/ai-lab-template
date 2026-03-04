'use client';

import { useI18n } from '../../../lib/i18n-context';

function IconBrainLarge() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M14 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 14c-1.5-4.8 1.5-8 5.5-8 2 0 3.8.8 4.5 2M23 14c1.5-4.8-1.5-8-5.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 26c-1.5 4.8 1.5 8 5.5 8h9c4 0 7-3.2 5.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 20c-1.5-3 0-7.5 4.5-9M34 20c1.5-3 0-7.5-4.5-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function StepGenerating() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-8">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border border-sky-400/20 animate-ping" />
        <div className="absolute inset-3 rounded-full border border-sky-400/40 animate-ping [animation-delay:0.4s]" />
        <div className="absolute inset-0 flex items-center justify-center text-sky-500 dark:text-sky-400">
          <IconBrainLarge />
        </div>
      </div>
      <div className="text-center">
        <p className="headline text-3xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>
          {t.checklist.generating}
        </p>
        <p className="font-mono text-[11px] text-slate-500" suppressHydrationWarning>
          {t.checklist.generatingMsg}
        </p>
      </div>
    </div>
  );
}
