'use client';

import { Navbar } from '../../components/ui/Navbar';
import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';

// Static outside component — prevents infinite loop from new array ref
const CLIENT_ROLES = ['client'];

export default function ClientDashboard(): React.JSX.Element {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth(CLIENT_ROLES);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
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
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10
                        flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em]"
               suppressHydrationWarning>{t.dashboard.clientTitle}</p>
            <h1 className="headline text-5xl md:text-7xl text-slate-900 dark:text-white">
              <span suppressHydrationWarning>{t.dashboard.welcomeBack}</span>,<br/>
              <span className="text-emerald-600 dark:text-emerald-400">{user.name.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded border
                               text-emerald-700 dark:text-emerald-400
                               border-emerald-200 dark:border-emerald-400/30
                               bg-emerald-50 dark:bg-emerald-400/5">
                {user.role}
              </span>
              <span className="font-mono text-[10px] text-slate-400">{user.email}</span>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost text-[10px] py-2 px-4 self-start md:self-auto"
                  suppressHydrationWarning>
            {t.nav.logout} →
          </button>
        </div>

        {/* Welcome info */}
        <div className="mb-8 p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/20
                        bg-emerald-50 dark:bg-emerald-500/5">
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">🤖</span>
            <div>
              <p className="font-mono text-sm text-emerald-700 dark:text-emerald-300 font-bold mb-1">
                AI Tools ready
              </p>
              <p className="font-mono text-[11px] text-slate-500 leading-relaxed">
                Generate text and summarize content with GPT-4o-mini, powered by LangChain.
              </p>
            </div>
          </div>
        </div>

        {/* AI Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-sky-200 dark:border-sky-500/20
                               bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center
                               text-sky-600 dark:text-sky-400 text-xs">✨</span>
              <span suppressHydrationWarning>{t.dashboard.generatorTitle}</span>
            </h3>
            <AiGenerator />
          </div>
          <div className="card p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <span className="w-5 h-5 rounded border border-emerald-200 dark:border-emerald-500/20
                               bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center
                               text-emerald-600 dark:text-emerald-400 text-xs">📝</span>
              <span suppressHydrationWarning>{t.dashboard.summarizerTitle}</span>
            </h3>
            <AiSummarizer />
          </div>
        </div>
      </div>
    </div>
  );
}
