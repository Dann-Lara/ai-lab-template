'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n-context';
import { useAuth } from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { ProgressRing, BarChart } from '../../components/checklists/ProgressRing';
import { checklistsApi, type Checklist, type ChecklistStatus, type ProgressData } from '../../lib/checklists';

const USER_ROLES = ['superadmin', 'admin', 'client'];

const STATUS_BADGE: Record<ChecklistStatus, string> = {
  active:    'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5',
  paused:    'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5',
  completed: 'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
};

const DIFF_LABEL: Record<string, string> = {
  low: '▪ low', medium: '▪▪ mid', high: '▪▪▪ high',
};

function ChecklistCard({ checklist, onDelete }: { checklist: Checklist; onDelete: () => void }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState('');
  const completed = checklist.items.filter((i) => i.status === 'completed').length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleSendToTelegram() {
    if (!checklist.telegramChatId) { setTelegramMsg(t.checklist.telegramNoId); return; }
    setTelegramLoading(true);
    setTelegramMsg('');
    try {
      const res = await checklistsApi.sendToTelegram(checklist.id);
      setTelegramMsg(res.message || t.checklist.telegramSuccess);
    } catch (e) {
      setTelegramMsg(e instanceof Error ? e.message : t.checklist.telegramError);
    } finally { setTelegramLoading(false); }
  }

  return (
    <div className="card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
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
          <span className="font-mono text-[9px] text-slate-400">{completed}/{total} {t.checklist.tasksCount}</span>
          <span className="font-mono text-[9px] font-bold text-sky-600 dark:text-sky-400">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full transition-all duration-700"
               style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Telegram feedback */}
      {telegramMsg && (
        <div className={`mt-2 font-mono text-[9px] px-2 py-1.5 rounded border
          ${telegramMsg === t.checklist.telegramNoId || telegramMsg === t.checklist.telegramError
            ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5'
            : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5'
          }`}>
          {telegramMsg}
        </div>
      )}

      {/* Dates + actions */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] text-slate-400">
          {new Date(checklist.startDate).toLocaleDateString()} → {new Date(checklist.endDate).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-1.5">
          {!confirmDel ? (
            <>
              {checklist.telegramChatId && (
                <button onClick={() => void handleSendToTelegram()} disabled={telegramLoading}
                  title={t.checklist.sendToTelegramTitle}
                  className="w-7 h-7 rounded border border-transparent
                             text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                             hover:border-sky-300 dark:hover:border-sky-400/30
                             hover:bg-sky-50 dark:hover:bg-sky-400/10
                             flex items-center justify-center transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed">
                  {telegramLoading ? (
                    <svg className="animate-spin" width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              )}
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
                           hover:bg-red-50 dark:hover:bg-red-400/5 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4"
                        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={onDelete}
                className="font-mono text-[9px] text-red-600 dark:text-red-400 px-2 py-1 rounded
                           border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5" suppressHydrationWarning>
                {t.common.confirm}
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

function GlobalDashboard({ checklists }: { checklists: Checklist[] }) {
  const { t } = useI18n();
  const [progresses, setProgresses] = useState<Record<string, ProgressData>>({});

  useEffect(() => {
    if (!checklists.length) return;
    checklists.forEach((cl) => {
      checklistsApi.getProgress(cl.id)
        .then((p) => setProgresses((prev) => ({ ...prev, [cl.id]: p })))
        .catch(() => {});
    });
  }, [checklists]);

  const allItems = checklists.flatMap((cl) => cl.items ?? []);
  const totalTasks = allItems.length;
  const completedTasks = allItems.filter((i) => i.status === 'completed').length;
  const pendingTasks = allItems.filter((i) => i.status === 'pending').length;
  const globalPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeCount   = checklists.filter((c) => c.status === 'active').length;
  const pausedCount   = checklists.filter((c) => c.status === 'paused').length;
  const completedCount = checklists.filter((c) => c.status === 'completed').length;

  if (!checklists.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800
                        flex items-center justify-center text-slate-300 dark:text-slate-700">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 14l6 6 14-14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="font-mono text-[11px] text-slate-400" suppressHydrationWarning>{t.dashboard.noChecklistsYet}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Checklists', value: checklists.length, color: 'text-slate-800 dark:text-white' },
          { label: t.checklist.active,    value: activeCount,    color: 'text-emerald-600 dark:text-emerald-400' },
          { label: t.checklist.paused,    value: pausedCount,    color: 'text-amber-600 dark:text-amber-400' },
          { label: t.checklist.completed, value: completedCount, color: 'text-sky-600 dark:text-sky-400' },
          { label: t.checklist.tasksCompleted, value: completedTasks, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: t.checklist.tasksPending,   value: pendingTasks,   color: 'text-sky-600 dark:text-sky-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Global progress ring */}
      <div className="card p-6 flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            value={globalPct} size={110} stroke={9}
            color={globalPct >= 80 ? '#34d399' : globalPct >= 40 ? '#38bdf8' : '#f59e0b'}
            label={t.dashboard.overallProgress}
          />
        </div>
        {/* Per-checklist mini bars */}
        <div className="flex-1 w-full space-y-3">
          {checklists.map((cl) => {
            const p = progresses[cl.id];
            const pct = p ? p.completionRate : Math.round(
              (cl.items.filter((i) => i.status === 'completed').length / Math.max(cl.items.length, 1)) * 100
            );
            return (
              <div key={cl.id}>
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/checklists/${cl.id}`}
                    className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[70%]
                               hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    {cl.title}
                  </Link>
                  <span className="font-mono text-[9px] text-slate-400 shrink-0 ml-2">{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                       style={{
                         width: `${pct}%`,
                         backgroundColor: pct >= 80 ? '#34d399' : pct >= 40 ? '#38bdf8' : '#f59e0b',
                       }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TabType = 'all' | 'active' | 'paused' | 'completed' | 'global';

export default function ChecklistsListPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth(USER_ROLES);

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await checklistsApi.list();
      setChecklists(data);
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  // Stagger animation when tab switches to list
  useEffect(() => {
    if (loading || activeTab === 'global' || !listRef.current) return;
    const cards = listRef.current.querySelectorAll('.checklist-card');
    if (!cards.length) return;
    (async () => {
      const anime = (await import('animejs')).default;
      anime({
        targets: Array.from(cards),
        opacity: [0, 1], translateY: [16, 0],
        delay: anime.stagger(50),
        duration: 400, easing: 'easeOutExpo',
      });
    })();
  }, [loading, activeTab, checklists.length]);

  async function handleDelete(id: string) {
    await checklistsApi.delete(id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }

  // Computed per-tab counts — always from full checklists array
  const counts: Record<TabType, number> = {
    all:       checklists.length,
    active:    checklists.filter((c) => c.status === 'active').length,
    paused:    checklists.filter((c) => c.status === 'paused').length,
    completed: checklists.filter((c) => c.status === 'completed').length,
    global:    checklists.length,
  };

  // Filtered list — only for non-global tabs
  const filtered = activeTab === 'all' || activeTab === 'global'
    ? checklists
    : checklists.filter((c) => c.status === activeTab);

  if (authLoading || !user) return null;

  return (
    <DashboardLayout variant={user.role === 'client' ? 'client' : 'admin'} user={user} title={t.nav.checklist}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-16">

        {/* Header */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10
                        flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-3" suppressHydrationWarning>
              {t.checklist.headerSubtitle}
            </p>
            <h1 className="headline text-5xl md:text-7xl text-slate-900 dark:text-white" suppressHydrationWarning>
              {t.checklist.myChecklists}
            </h1>
            {counts.active > 0 && (
              <p className="font-mono text-[11px] text-slate-500 mt-2">
                {counts.active} checklist{counts.active !== 1 ? 's' : ''} {t.checklist.active.toLowerCase()}
                {counts.active !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link href="/checklists/new"
            className="btn-primary flex items-center gap-2 py-3 px-6 self-start" suppressHydrationWarning>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L8 5.5l4 1-4 1-1 4-1-4-4-1 4-1 1-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            {t.checklist.newChecklist}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {([
            { key: 'all',       label: t.checklist.tabAll },
            { key: 'active',    label: t.checklist.active },
            { key: 'paused',    label: t.checklist.paused },
            { key: 'completed', label: t.checklist.completed },
            { key: 'global',    label: t.checklist.globalDashboard },
          ] as { key: TabType; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap
                          border-b-2 -mb-px transition-all shrink-0
                          ${activeTab === key
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}>
              {label}
              {key !== 'global' && counts[key] > 0 && (
                <span className="opacity-60 ml-1">({counts[key]})</span>
              )}
            </button>
          ))}
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
        ) : activeTab === 'global' ? (
          <GlobalDashboard checklists={checklists} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800
                            flex items-center justify-center text-slate-200 dark:text-slate-800">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 16l7 7 13-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="headline text-3xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>
                {t.checklist.noChecklists}
              </p>
              <p className="font-mono text-[11px] text-slate-400 mb-6" suppressHydrationWarning>
                {t.checklist.createFirst}
              </p>
              <Link href="/checklists/new" className="btn-primary" suppressHydrationWarning>
                {t.checklist.newChecklist}
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
    </DashboardLayout>
  );
}
