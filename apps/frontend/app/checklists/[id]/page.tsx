'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { Navbar } from '../../../components/ui/Navbar';
import { TaskCard } from '../../../components/checklists/TaskCard';
import { ProgressRing, BarChart } from '../../../components/checklists/ProgressRing';
import {
  IconChevronLeft, IconBrain, IconPlay, IconPause, IconTrash, IconSparkle,
} from '../../../components/checklists/Icons';
import { checklistsApi, type Checklist, type ProgressData } from '../../../lib/checklists';

const USER_ROLES = ['superadmin', 'admin', 'client'];

const STATUS_STYLES = {
  active:    'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5',
  paused:    'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5',
  completed: 'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
};

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function ChecklistDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params['id'] as string;
  const { user, loading: authLoading } = useAuth(USER_ROLES);

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [progress, setProgress]   = useState<ProgressData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError]           = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramMsg, setTelegramMsg]         = useState('');
  const [deleteModal, setDeleteModal]         = useState(false);
  const [actionLoading, setActionLoading]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard'>('tasks');

  const load = useCallback(async () => {
    if (!id) return;
    setLoadingData(true);
    try {
      const [cl, prog] = await Promise.all([
        checklistsApi.get(id),
        checklistsApi.getProgress(id),
      ]);
      setChecklist(cl);
      setProgress(prog);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally { setLoadingData(false); }
  }, [id, t.common.error]);

  useEffect(() => { void load(); }, [load]);

  async function handleItemAction(itemId: string, action: 'complete' | 'postpone' | 'skip') {
    if (!checklist) return;
    setActionLoading(itemId + action);
    try {
      await checklistsApi.patchItem(checklist.id, itemId, action);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally { setActionLoading(null); }
  }

  async function handleFeedback() {
    if (!checklist) return;
    setFeedbackLoading(true);
    try {
      await checklistsApi.generateFeedback(checklist.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally { setFeedbackLoading(false); }
  }

  async function handleSendToTelegram() {
    if (!checklist) return;
    setTelegramLoading(true);
    setTelegramMsg('');
    try {
      const res = await checklistsApi.sendToTelegram(checklist.id);
      setTelegramMsg(res.message);
    } catch (e) {
      setTelegramMsg(e instanceof Error ? e.message : 'Error al enviar');
    } finally { setTelegramLoading(false); }
  }

  async function handleStatusToggle() {
    if (!checklist) return;
    const next = checklist.status === 'active' ? 'paused' : 'active';
    try {
      await checklistsApi.patch(checklist.id, { status: next });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    }
  }

  async function handleDelete() {
    if (!checklist) return;
    await checklistsApi.delete(checklist.id);
    router.push('/checklists');
  }

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (!checklist) return null;

  const latestFeedback = checklist.feedbacks?.sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )[0];

  const pendingTasks   = checklist.items.filter((i) => i.status === 'pending');
  const completedTasks = checklist.items.filter((i) => i.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar variant={user?.role === 'client' ? 'client' : 'admin'} />

      {/* ── Same max-width as list page ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-20">

        {/* Back link */}
        <div className="pt-6 mb-6">
          <Link href="/checklists"
            className="font-mono text-[10px] text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                       transition-colors flex items-center gap-1.5 w-fit">
            <IconChevronLeft size={12} />
            <span suppressHydrationWarning>{t.checklist.myChecklists}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="pb-8 border-b border-slate-200 dark:border-slate-800/60 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded border ${STATUS_STYLES[checklist.status]}`}
                      suppressHydrationWarning>
                  {t.checklist[checklist.status]}
                </span>
                {checklist.category && (
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                    {checklist.category}
                  </span>
                )}
              </div>
              <h1 className="headline text-4xl md:text-6xl text-slate-900 dark:text-white leading-tight mb-2">
                {checklist.title}
              </h1>
              <p className="font-mono text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                {checklist.objective}
              </p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="font-mono text-[9px] text-slate-400">
                  {new Date(checklist.startDate).toLocaleDateString()} → {new Date(checklist.endDate).toLocaleDateString()}
                </span>
                <span className="font-mono text-[9px] text-slate-400">
                  {checklist.dailyTimeAvailable} {t.checklist.mins}/día
                </span>
              </div>
            </div>

            {/* Action buttons — clean row, no ghost toggle next to pause */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button onClick={handleStatusToggle}
                className="btn-ghost text-[10px] py-2 px-3 flex items-center gap-1.5">
                {checklist.status === 'active'
                  ? <><IconPause size={12} /><span suppressHydrationWarning>{t.checklist.pauseChecklist}</span></>
                  : <><IconPlay size={12} /><span suppressHydrationWarning>{t.checklist.resumeChecklist}</span></>
                }
              </button>
              <button onClick={() => setDeleteModal(true)}
                className="btn-ghost text-[10px] py-2 px-3 flex items-center gap-1.5
                           hover:border-red-300 dark:hover:border-red-400/30
                           hover:text-red-500 dark:hover:text-red-400 transition-colors">
                <IconTrash size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                          font-mono text-[11px] text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="opacity-60 hover:opacity-100 ml-4">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-slate-200 dark:border-slate-800">
          {(['tasks', 'dashboard'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`font-mono text-[10px] uppercase tracking-widest px-5 py-3
                          border-b-2 -mb-px transition-all
                          ${activeTab === tab
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}>
              {tab === 'tasks'
                ? <span suppressHydrationWarning>{t.checklist.tabTasks} ({pendingTasks.length})</span>
                : <span suppressHydrationWarning>{t.checklist.tabDashboard}</span>
              }
            </button>
          ))}
        </div>

        {/* ─── TASKS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {pendingTasks.length > 0 ? (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400 mb-4"
                   suppressHydrationWarning>
                  {t.checklist.pendingSection} ({pendingTasks.length})
                </p>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="relative">
                      {actionLoading?.startsWith(task.id!) && (
                        <div className="absolute inset-0 flex items-center justify-center
                                        bg-white/50 dark:bg-slate-950/50 rounded-xl z-10">
                          <Spinner />
                        </div>
                      )}
                      <TaskCard
                        task={task}
                        index={checklist.items.indexOf(task)}
                        onComplete={() => void handleItemAction(task.id!, 'complete')}
                        onPostpone={() => void handleItemAction(task.id!, 'postpone')}
                        onSkip={() => void handleItemAction(task.id!, 'skip')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15
                                flex items-center justify-center mx-auto mb-4
                                text-emerald-600 dark:text-emerald-400">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M4 14l6 6 14-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="headline text-3xl text-slate-900 dark:text-white mb-2">
                  ¡Todo completado!
                </p>
              </div>
            )}

            {completedTasks.length > 0 && (
              <details className="group">
                <summary className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400
                                    cursor-pointer hover:text-sky-500 dark:hover:text-sky-400
                                    transition-colors flex items-center gap-2 mb-4 list-none"
                         suppressHydrationWarning>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                       className="group-open:rotate-180 transition-transform shrink-0">
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {t.checklist.completedSection} ({completedTasks.length})
                </summary>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} index={checklist.items.indexOf(task)} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* ─── DASHBOARD TAB ─────────────────────────────────────────── */}
        {activeTab === 'dashboard' && progress && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t.checklist.tasksCompleted, value: progress.completed, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: t.checklist.tasksPending,   value: progress.pending,   color: 'text-sky-600 dark:text-sky-400' },
                { label: t.checklist.tasksSkipped,   value: progress.skipped,   color: 'text-slate-500' },
                { label: t.checklist.totalTime,      value: `${progress.completedMinutes}m`, color: 'text-amber-600 dark:text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4 text-center">
                  <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-1"
                     suppressHydrationWarning>{label}</p>
                </div>
              ))}
            </div>

            {/* Ring + chart */}
            <div className="card p-6 flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <ProgressRing
                  value={progress.completionRate} size={100} stroke={8}
                  color={progress.completionRate >= 80 ? '#34d399' : progress.completionRate >= 40 ? '#38bdf8' : '#f59e0b'}
                  label={t.checklist.completionRate}
                />
              </div>
              <div className="flex-1 w-full">
                <BarChart data={progress.dailyData} label={t.checklist.weeklyActivity} />
              </div>
            </div>

            {/* AI Feedback */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2"
                   suppressHydrationWarning>
                  <IconBrain size={12} />
                  {t.checklist.aiFeedback}
                </p>
                <button onClick={() => void handleFeedback()} disabled={feedbackLoading}
                  className="btn-ghost text-[10px] py-1.5 px-3 flex items-center gap-1.5"
                  suppressHydrationWarning>
                  {feedbackLoading
                    ? <Spinner />
                    : <><IconSparkle size={11} /> {t.checklist.generateFeedback}</>
                  }
                </button>
              </div>
              {latestFeedback ? (
                <div className="space-y-2">
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {latestFeedback.feedbackText}
                  </p>
                  <p className="font-mono text-[9px] text-slate-400">
                    {new Date(latestFeedback.generatedAt).toLocaleDateString()}
                    {latestFeedback.weekNumber ? ` · Semana ${latestFeedback.weekNumber}` : ''}
                  </p>
                </div>
              ) : (
                <p className="font-mono text-[11px] text-slate-400 italic" suppressHydrationWarning>
                  {t.checklist.noFeedback}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm card p-6 space-y-4 shadow-2xl">
            <h3 className="headline text-2xl text-slate-900 dark:text-white" suppressHydrationWarning>
              {t.checklist.deleteChecklist}
            </h3>
            <p className="font-mono text-[11px] text-slate-500" suppressHydrationWarning>
              {t.checklist.confirmDelete}
            </p>
            <div className="flex gap-2">
              <button onClick={() => void handleDelete()}
                className="flex-1 py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-widest
                           bg-red-500 hover:bg-red-600 text-white transition-colors" suppressHydrationWarning>
                {t.checklist.deleteChecklist}
              </button>
              <button onClick={() => setDeleteModal(false)} className="btn-ghost flex-1" suppressHydrationWarning>
                {t.checklist.cancel ?? 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
