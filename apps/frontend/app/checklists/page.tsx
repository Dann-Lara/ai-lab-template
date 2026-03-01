'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from '../../components/ui/Navbar';
import { checklistsApi, type Checklist, type ChecklistStatus } from '../../lib/checklists';

const USER_ROLES = ['superadmin', 'admin', 'client'];

const STATUS_BADGE: Record<ChecklistStatus, string> = {
  active:    'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5',
  paused:    'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5',
  completed: 'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
};

const DIFF_LABEL: Record<string, string> = {
  low: '▪ low', medium: '▪▪ mid', high: '▪▪▪ high'
};

function ChecklistCard({ checklist, onDelete }: { checklist: Checklist; onDelete: () => void }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);
  const completed = checklist.items.filter((i) => i.status === 'completed').length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="group card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_BADGE[checklist.status]}`}
                  suppressHydrationWarning>
              {t.checklist[checklist.status]}
            </span>
            {checklist.category && (
              <span className="font-mono text-[9px] text-slate-400 uppercase">{checklist.category}</span>
            )}
            <span className="font-mono text-[9px] text-slate-400 ml-auto">
              {DIFF_LABEL[checklist.difficulty] ?? checklist.difficulty}
            </span>
          </div>
          <h3 className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">
            {checklist.title}
          </h3>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[9px] text-slate-400">{completed}/{total} tareas</span>
          <span className="font-mono text-[9px] font-bold text-sky-600 dark:text-sky-400">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] text-slate-400">
          {new Date(checklist.startDate).toLocaleDateString()} → {new Date(checklist.endDate).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-1.5">
          {!confirmDel ? (
            <>
              <Link href={`/checklists/${checklist.id}`}
                className="font-mono text-[9px] text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                           transition-colors px-2 py-1 rounded border border-transparent
                           hover:border-sky-300 dark:hover:border-sky-400/30
                           hover:bg-sky-50 dark:hover:bg-sky-400/10">
                Ver →
              </Link>
              <button onClick={() => setConfirmDel(true)}
                className="font-mono text-[9px] text-slate-400 hover:text-red-500 dark:hover:text-red-400
                           transition-colors px-2 py-1 rounded border border-transparent
                           hover:border-red-200 dark:hover:border-red-400/30
                           hover:bg-red-50 dark:hover:bg-red-400/5">
                🗑
              </button>
            </>
          ) : (
            <>
              <button onClick={onDelete}
                className="font-mono text-[9px] text-red-600 dark:text-red-400 px-2 py-1 rounded
                           border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5">
                Confirmar
              </button>
              <button onClick={() => setConfirmDel(false)}
                className="font-mono text-[9px] text-slate-400 px-2 py-1 rounded
                           border border-slate-200 dark:border-slate-700">
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChecklistsListPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(USER_ROLES);

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChecklistStatus | 'all'>('all');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    checklistsApi.list()
      .then((data) => { setChecklists(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authLoading]);

  // Stagger animation on load
  useEffect(() => {
    if (loading || !listRef.current) return;
    const cards = listRef.current.querySelectorAll('.checklist-card');
    if (!cards.length) return;
    (async () => {
      const anime = (await import('animejs')).default;
      anime({
        targets: Array.from(cards),
        opacity: [0, 1], translateY: [20, 0],
        delay: anime.stagger(60),
        duration: 500, easing: 'easeOutExpo',
      });
    })();
  }, [loading, checklists.length]);

  async function handleDelete(id: string) {
    await checklistsApi.delete(id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = filter === 'all' ? checklists : checklists.filter((c) => c.status === filter);
  const activeCount = checklists.filter((c) => c.status === 'active').length;

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar variant={user.role === 'client' ? 'client' : 'admin'} />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-16">

        {/* Header */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10
                        flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-3">
              AI Lab — Productividad
            </p>
            <h1 className="headline text-5xl md:text-7xl text-slate-900 dark:text-white" suppressHydrationWarning>
              {t.checklist.myChecklists}
            </h1>
            {activeCount > 0 && (
              <p className="font-mono text-[11px] text-slate-500 mt-2">
                {activeCount} checklist{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link href="/checklists/new" className="btn-primary flex items-center gap-2 py-3 px-6 self-start"
                suppressHydrationWarning>
            ✨ {t.checklist.newChecklist}
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200 dark:border-slate-800">
          {(['all', 'active', 'paused', 'completed'] as const).map((f) => {
            const labels = { all: 'Todos', active: t.checklist.active, paused: t.checklist.paused, completed: t.checklist.completed };
            const cnt = f === 'all' ? checklists.length : checklists.filter((c) => c.status === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`font-mono text-[10px] uppercase tracking-widest px-4 py-3
                            border-b-2 -mb-px transition-all
                            ${filter === f
                              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}>
                {labels[f]} {cnt > 0 && <span className="opacity-60 ml-1">({cnt})</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {t.common.loading}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800
                            flex items-center justify-center text-3xl text-slate-300 dark:text-slate-700">
              ✓
            </div>
            <div className="text-center">
              <p className="headline text-3xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>
                {t.checklist.noChecklists}
              </p>
              <p className="font-mono text-[11px] text-slate-400 mb-6" suppressHydrationWarning>
                {t.checklist.createFirst}
              </p>
              <Link href="/checklists/new" className="btn-primary" suppressHydrationWarning>
                ✨ {t.checklist.newChecklist}
              </Link>
            </div>
          </div>
        ) : (
          <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((cl) => (
              <div key={cl.id} className="checklist-card" style={{ opacity: 0 }}>
                <ChecklistCard checklist={cl} onDelete={() => void handleDelete(cl.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
