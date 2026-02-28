'use client';

import { useI18n } from '../../lib/i18n-context';
import { useFadeInUp, useStaggerIn } from '../../hooks/useAnime';
import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';

export default function DashboardPage(): React.JSX.Element {
  const { t } = useI18n();
  const titleRef = useFadeInUp<HTMLDivElement>({ duration: 500 });
  const cardsRef = useStaggerIn<HTMLDivElement>({ delay: 150, stagger: 120 });

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div ref={titleRef} className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.dashboard.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Powered by GPT-4o-mini · LangChain · NestJS
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-sm">✨</span>
              {t.dashboard.generatorTitle}
            </h2>
            <AiGenerator />
          </div>
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-sm">📝</span>
              {t.dashboard.summarizerTitle}
            </h2>
            <AiSummarizer />
          </div>
        </div>
      </div>
    </div>
  );
}
