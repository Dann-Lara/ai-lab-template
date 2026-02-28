'use client';

import Link from 'next/link';
import { useI18n } from '../lib/i18n-context';
import { useFadeInUp, useStaggerIn } from '../hooks/useAnime';

export default function Home(): React.JSX.Element {
  const { t } = useI18n();
  const heroRef = useFadeInUp<HTMLDivElement>({ duration: 700 });
  const featuresRef = useStaggerIn<HTMLDivElement>({ delay: 300, stagger: 100 });

  const features = [
    { icon: '🤖', label: t.home.featureAi },
    { icon: '⚡', label: t.home.featureAutomations },
    { icon: '🔒', label: t.home.featureSecurity },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center
                    bg-gradient-to-b from-brand-950 via-brand-900 to-slate-900 text-white px-4">
      <div ref={heroRef} className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full
                        bg-brand-800/60 border border-brand-700/50 text-brand-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          v1.0 — Ready to build
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r
                       from-white via-blue-200 to-brand-400 bg-clip-text text-transparent">
          {t.home.title}
        </h1>
        <p className="text-lg text-slate-400 mb-10">{t.home.subtitle}</p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard"
            className="btn-primary text-base px-6 py-3 shadow-lg shadow-brand-900/50
                       hover:shadow-brand-800/60 hover:-translate-y-0.5 transition-all">
            {t.home.openDashboard} →
          </Link>
          <a href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer"
            className="px-6 py-3 text-base font-medium rounded-lg bg-slate-800 hover:bg-slate-700
                       text-slate-200 border border-slate-700 transition-all">
            {t.home.apiDocs}
          </a>
          <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer"
            className="px-6 py-3 text-base font-medium rounded-lg bg-orange-900/40 hover:bg-orange-800/50
                       text-orange-300 border border-orange-800/50 transition-all">
            {t.home.n8nWorkflows}
          </a>
        </div>
      </div>

      <div ref={featuresRef} className="flex flex-wrap gap-4 mt-16 justify-center">
        {features.map((f) => (
          <div key={f.label}
            className="px-6 py-4 rounded-xl bg-slate-800/50 border border-slate-700/50
                       text-center hover:border-brand-600/50 hover:bg-slate-800/80
                       transition-all duration-200 cursor-default">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="text-sm text-slate-400">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
