'use client';

import { useState } from 'react';
import { Navbar } from '../../components/ui/Navbar';
import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';

// Static outside component to prevent new array ref on every render → infinite loop
const ADMIN_ROLES = ['superadmin', 'admin'];

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className={`p-5 rounded-xl border transition-all ${
      accent
        ? 'border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/5'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
    }`}>
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400 mb-3">{label}</p>
      <p className={`font-mono text-3xl font-bold ${accent ? 'text-sky-600 dark:text-sky-400' : 'text-slate-800 dark:text-white'}`}>
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard(): React.JSX.Element {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth(ADMIN_ROLES);
  const [activeTab, setActiveTab] = useState<'ai' | 'system'>('ai');

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

  const roleColor = user.role === 'superadmin'
    ? 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5'
    : 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5';

  const SERVICES = [
    { label: 'Frontend',   value: 'Next.js 14',    port: '3000' },
    { label: 'Backend',    value: 'NestJS',        port: '3001' },
    { label: 'Database',   value: 'PostgreSQL 16', port: '5432' },
    { label: 'Cache',      value: 'Redis',         port: '6379' },
    { label: 'Automation', value: 'n8n',           port: '5678' },
    { label: 'API Docs',   value: 'Swagger',       port: '3001/api/docs' },
  ];

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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Role"       value={user.role} accent />
          <StatCard label="Backend"    value="Online"    sub="localhost:3001" />
          <StatCard label="Database"   value="Connected" sub="PostgreSQL" />
          <StatCard label="AI Service" value="Ready"     sub="GPT-4o-mini" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200 dark:border-slate-800">
          {(['ai', 'system'] as const).map((id) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`font-mono text-[10px] uppercase tracking-widest px-5 py-3 border-b-2 -mb-px transition-all
                ${activeTab === id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}>
              {id === 'ai' ? 'AI Tools' : 'System Info'}
            </button>
          ))}
        </div>

        {activeTab === 'ai' && (
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
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map(({ label, value, port }) => (
              <div key={label}
                className="flex items-center justify-between p-4 rounded-xl border
                           border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40
                           hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">{label}</p>
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
