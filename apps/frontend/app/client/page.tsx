'use client';

import { Navbar } from '../../components/ui/Navbar';
import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';

export default function ClientDashboard(): React.JSX.Element {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth(['client']);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600">
          <span className="w-4 h-4 border-2 border-slate-700 border-t-sky-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar variant="client" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-16">

        {/* Header */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-200/80 dark:border-slate-800/60 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.4em]">
              {t.dashboard.clientTitle}
            </p>
            <h1 className="headline text-5xl md:text-7xl text-white">
              {t.dashboard.welcomeBack},<br/>
              <span className="text-emerald-400">{user.name.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded
                               border border-emerald-400/30 bg-emerald-400/5 text-emerald-400">
                {user.role}
              </span>
              <span className="font-mono text-[10px] text-slate-600">{user.email}</span>
            </div>
          </div>

          <button onClick={logout}
            className="btn-ghost text-[10px] py-2 px-4 self-start md:self-auto border-slate-700 text-slate-500">
            {t.nav.logout} →
          </button>
        </div>

        {/* Welcome card */}
        <div className="mb-8 p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">🤖</span>
            <div>
              <p className="font-mono text-sm text-emerald-300 font-bold mb-1">AI Tools ready</p>
              <p className="font-mono text-[11px] text-slate-500 leading-relaxed">
                Use the tools below to generate text and summarize content with GPT-4o-mini, powered by LangChain.
              </p>
            </div>
          </div>
        </div>

        {/* AI Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 dark:bg-slate-900">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xs">✨</span>
              {t.dashboard.generatorTitle}
            </h3>
            <AiGenerator />
          </div>
          <div className="card p-6 dark:bg-slate-900">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">📝</span>
              {t.dashboard.summarizerTitle}
            </h3>
            <AiSummarizer />
          </div>
        </div>
      </div>
    </div>
  );
}
