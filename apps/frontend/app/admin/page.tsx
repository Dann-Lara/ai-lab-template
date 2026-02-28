'use client';

import { useState } from 'react';
import { Navbar } from '../../components/ui/Navbar';
import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-xl border transition-all
      ${accent
        ? 'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/50'
        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
      }`}>
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-600 mb-3">{label}</p>
      <p className={`font-mono text-3xl font-bold ${accent ? 'text-sky-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard(): React.JSX.Element {
  const { t } = useI18n();
  const { user, loading, logout } = useAuth(['superadmin', 'admin']);
  const [activeTab, setActiveTab] = useState<'ai' | 'system'>('ai');

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

  const ROLE_COLOR = user.role === 'superadmin' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'
                                                 : 'text-sky-400 border-sky-400/30 bg-sky-400/5';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar variant="admin" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-16">

        {/* Header */}
        <div className="py-10 border-b border-slate-800/60 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-slate-600 uppercase tracking-[0.4em]">
              {t.dashboard.adminTitle}
            </p>
            <h1 className="headline text-5xl md:text-7xl text-white">
              {t.dashboard.welcomeBack},<br/>
              <span className="text-sky-400">{user.name.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-3 pt-1">
              <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded border ${ROLE_COLOR}`}>
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Role"         value={user.role}           accent />
          <StatCard label="Backend"      value="Online"   sub="localhost:3001" />
          <StatCard label="Database"     value="Connected" sub="PostgreSQL" />
          <StatCard label="AI Service"   value="Ready"    sub="GPT-4o-mini" />
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 border-b border-slate-800">
          {[
            { id: 'ai',     label: 'AI Tools' },
            { id: 'system', label: 'System Info' },
          ].map(({ id, label }) => (
            <button key={id}
              onClick={() => setActiveTab(id as 'ai' | 'system')}
              className={`font-mono text-[10px] uppercase tracking-widest px-5 py-3 border-b-2 -mb-px transition-all
                ${activeTab === id
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-600 hover:text-slate-400'
                }`}>
              {label}
            </button>
          ))}
        </div>

        {/* AI Tools tab */}
        {activeTab === 'ai' && (
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
        )}

        {/* System tab */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Frontend',   value: 'Next.js 14',    port: '3000' },
              { label: 'Backend',    value: 'NestJS',        port: '3001' },
              { label: 'Database',   value: 'PostgreSQL 16', port: '5432' },
              { label: 'Cache',      value: 'Redis',         port: '6379' },
              { label: 'Automation', value: 'n8n',           port: '5678' },
              { label: 'API Docs',   value: 'Swagger',       port: '3001/api/docs' },
            ].map(({ label, value, port }) => (
              <div key={label}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-800
                           bg-slate-900/40 hover:border-slate-700 transition-all group">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">{label}</p>
                  <p className="font-mono text-sm text-slate-300 mt-0.5">{value}</p>
                </div>
                <a href={`http://localhost:${port}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[10px] text-slate-700 group-hover:text-sky-500 transition-colors">
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
