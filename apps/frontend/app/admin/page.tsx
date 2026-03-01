'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/ui/Navbar';
import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';
import { checklistsApi, type Checklist } from '../../lib/checklists';

const ADMIN_ROLES = ['superadmin', 'admin'];

type SvcKey = 'svcFrontend'|'svcBackend'|'svcDatabase'|'svcCache'|'svcAutomation'|'svcApiDocs';
const SERVICES: { labelKey: SvcKey; value: string; port: string }[] = [
  { labelKey: 'svcFrontend',   value: 'Next.js 14',    port: '3000' },
  { labelKey: 'svcBackend',    value: 'NestJS',        port: '3001' },
  { labelKey: 'svcDatabase',   value: 'PostgreSQL 16', port: '5432' },
  { labelKey: 'svcCache',      value: 'Redis',         port: '6379' },
  { labelKey: 'svcAutomation', value: 'n8n',           port: '5678' },
  { labelKey: 'svcApiDocs',    value: 'Swagger',       port: '3001/api/docs' },
];

function ChecklistProgressCard({ checklist }: { checklist: Checklist }) {
  const completed = checklist.items.filter((i) => i.status === 'completed').length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const STATUS_COLOR: Record<string, string> = {
    active:    'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5',
    paused:    'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5',
    completed: 'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
  };

  return (
    <Link href={`/checklists/${checklist.id}`}
      className="card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 block">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">
            {checklist.title}
          </p>
          {checklist.category && (
            <p className="font-mono text-[9px] text-slate-400 uppercase mt-0.5">{checklist.category}</p>
          )}
        </div>
        <span className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${STATUS_COLOR[checklist.status] ?? ''}`}>
          {checklist.status}
        </span>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] text-slate-400">{completed}/{total}</span>
        <span className="font-mono text-[9px] font-bold text-sky-600 dark:text-sky-400">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
             style={{
               width: `${pct}%`,
               backgroundColor: pct >= 80 ? '#34d399' : pct >= 40 ? '#38bdf8' : '#f59e0b',
             }} />
      </div>
    </Link>
  );
}

export default function AdminDashboard(): React.JSX.Element {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth(ADMIN_ROLES);
  const [activeTab, setActiveTab] = useState<'ai' | 'system'>('ai');
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    if (!loading && user) {
      checklistsApi.list().then(setChecklists).catch(() => {});
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const roleColor = user.role === 'superadmin'
    ? 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5'
    : 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5';

  const activeChecklists   = checklists.filter((c) => c.status === 'active');
  const allItems           = checklists.flatMap((c) => c.items ?? []);
  const completedItems     = allItems.filter((i) => i.status === 'completed').length;
  const globalPct          = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar variant="admin" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-16">

        {/* Header */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10
                        flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em]"
               suppressHydrationWarning>{t.dashboard.adminTitle}</p>
            <h1 className="headline text-5xl md:text-7xl text-slate-900 dark:text-white">
              <span suppressHydrationWarning>{t.dashboard.welcomeBack}</span>,<br/>
              <span className="text-sky-600 dark:text-sky-400">{user.name.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded border ${roleColor}`}>
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

        {/* Quick nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Link href="/checklists"
            className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
                       flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-400/10
                            border border-sky-200 dark:border-sky-400/20
                            flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4.5 4.5 7.5-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200"
                 suppressHydrationWarning>{t.checklist.myChecklists}</p>
              <p className="font-mono text-[9px] text-slate-400 mt-0.5">
                {checklists.length} total · {activeChecklists.length} activos
              </p>
            </div>
            <span className="ml-auto font-mono text-[10px] text-slate-300 dark:text-slate-700
                             group-hover:text-sky-400 transition-colors">→</span>
          </Link>

          {(user.role === 'superadmin' || user.role === 'admin') && (
            <Link href="/admin/users"
              className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
                         flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-400/10
                              border border-violet-200 dark:border-violet-400/20
                              flex items-center justify-center text-violet-500 dark:text-violet-400 shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200"
                   suppressHydrationWarning>{t.users.title}</p>
                <p className="font-mono text-[9px] text-slate-400 mt-0.5" suppressHydrationWarning>
                  {t.users.createUser}
                </p>
              </div>
              <span className="ml-auto font-mono text-[10px] text-slate-300 dark:text-slate-700
                               group-hover:text-violet-400 transition-colors">→</span>
            </Link>
          )}

          <Link href="/admin/profile"
            className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
                       flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60
                            border border-slate-200 dark:border-slate-700
                            flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 3l1.5 1.5M14.5 3L13 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200"
                 suppressHydrationWarning>{t.dashboard.myProfile}</p>
              <p className="font-mono text-[9px] text-slate-400 mt-0.5"
                 suppressHydrationWarning>{t.dashboard.profileSub}</p>
            </div>
            <span className="ml-auto font-mono text-[10px] text-slate-300 dark:text-slate-700
                             group-hover:text-slate-500 transition-colors">→</span>
          </Link>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-400/10
                            border border-emerald-200 dark:border-emerald-400/20
                            flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 14l4-4 3 3 5-7 4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                {globalPct}% {t.dashboard.overallProgress}
              </p>
              <p className="font-mono text-[9px] text-slate-400 mt-0.5">
                {completedItems}/{allItems.length} tareas
              </p>
            </div>
          </div>
        </div>

        {/* Checklist progress section */}
        {checklists.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400"
                 suppressHydrationWarning>{t.dashboard.checklistProgress}</p>
              <Link href="/checklists"
                className="font-mono text-[9px] text-sky-500 dark:text-sky-400 hover:underline"
                suppressHydrationWarning>{t.dashboard.viewAll} →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {checklists.slice(0, 6).map((cl) => (
                <ChecklistProgressCard key={cl.id} checklist={cl} />
              ))}
            </div>
          </div>
        )}

        {/* AI Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200 dark:border-slate-800">
          {(['ai', 'system'] as const).map((id) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`font-mono text-[10px] uppercase tracking-widest px-5 py-3 border-b-2 -mb-px transition-all
                ${activeTab === id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`} suppressHydrationWarning>
              {id === 'ai' ? t.dashboard.aiTools : t.dashboard.systemInfo}
            </button>
          ))}
        </div>

        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator */}
            <div className="card p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded border border-sky-200 dark:border-sky-500/20
                                  bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center
                                  text-sky-600 dark:text-sky-400">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1.5L8 5.5l4 1-4 1-1 4-1-4-4-1 4-1 1-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-400"
                      suppressHydrationWarning>{t.dashboard.generatorTitle}</h3>
                </div>
                <p className="font-mono text-[11px] text-slate-500 leading-relaxed"
                   suppressHydrationWarning>{t.dashboard.generatorDesc}</p>
                <details className="mt-2 group">
                  <summary className="font-mono text-[9px] text-sky-500 dark:text-sky-400 cursor-pointer
                                      hover:text-sky-600 dark:hover:text-sky-300 transition-colors list-none
                                      flex items-center gap-1">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                         className="group-open:rotate-180 transition-transform">
                      <path d="M1.5 3l2.5 2.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span suppressHydrationWarning>{t.dashboard.howToUse}</span>
                  </summary>
                  <p className="font-mono text-[10px] text-slate-400 leading-relaxed mt-2 pl-3
                                border-l-2 border-sky-200 dark:border-sky-400/20"
                     suppressHydrationWarning>{t.dashboard.generatorUsage}</p>
                </details>
              </div>
              <AiGenerator />
            </div>

            {/* Summarizer */}
            <div className="card p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded border border-emerald-200 dark:border-emerald-500/20
                                  bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center
                                  text-emerald-600 dark:text-emerald-400">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M2 4h10M2 7h7M2 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-400"
                      suppressHydrationWarning>{t.dashboard.summarizerTitle}</h3>
                </div>
                <p className="font-mono text-[11px] text-slate-500 leading-relaxed"
                   suppressHydrationWarning>{t.dashboard.summarizerDesc}</p>
              </div>
              <AiSummarizer />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map(({ labelKey, value, port }) => (
              <div key={labelKey}
                className="flex items-center justify-between p-4 rounded-xl border
                           border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40
                           hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400" suppressHydrationWarning>{t.dashboard[labelKey]}</p>
                  <p className="font-mono text-sm text-slate-700 dark:text-slate-300 mt-0.5">{value}</p>
                </div>
                <a href={`http://localhost:${port}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[10px] text-slate-400 group-hover:text-sky-500 transition-colors">
                  :{port} ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
