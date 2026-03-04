'use client';

import { useI18n } from '../../../lib/i18n-context';
import { IconCheck } from '../Icons';

export function StepDone() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15
                      border-2 border-emerald-300 dark:border-emerald-500/40
                      flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        <IconCheck size={36} />
      </div>
      <div>
        <h2 className="headline text-4xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>
          {t.checklist.saveSuccess}
        </h2>
        <p className="font-mono text-[11px] text-slate-500">Redirigiendo...</p>
      </div>
    </div>
  );
}
