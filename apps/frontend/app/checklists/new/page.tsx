'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { Navbar } from '../../../components/ui/Navbar';
import { StepIndicator } from '../../../components/checklists/StepIndicator';
import { TaskCard } from '../../../components/checklists/TaskCard';
import {
  IconChevronLeft, IconSparkle, IconRefresh, IconCheck, IconPlus, IconX,
} from '../../../components/checklists/Icons';
import { TelegramHelpModal } from '../../../components/ui/TelegramHelpModal';
import { checklistsApi, totalDailyMinutes, WEEKDAYS, type ChecklistParams, type TaskDraft } from '../../../lib/checklists';

const USER_ROLES = ['superadmin', 'admin', 'client'];
const today = new Date().toISOString().split('T')[0]!;

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function SectionTitle({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-sky-600 dark:text-sky-400 mb-4">
      {num} — {children}
    </p>
  );
}

export default function NewChecklistPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading } = useAuth(USER_ROLES);

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [params, setParams] = useState<ChecklistParams>({
    title: '', objective: '', category: '',
    startDate: today, endDate: '',
    difficulty: 'medium', dailyTimeAvailable: 30,
    style: 'mixed', language: 'es', isRecurring: false,
  });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderDays, setReminderDays] = useState<string[]>(['monday', 'wednesday', 'friday']);

  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [rationale, setRationale] = useState('');
  const [regenModal, setRegenModal] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  async function animateStep(fn: () => void) {
    if (!contentRef.current) { fn(); return; }
    const anime = (await import('animejs')).default;
    anime({
      targets: contentRef.current,
      opacity: [1, 0], translateY: [0, -10],
      duration: 200, easing: 'easeInQuad',
      complete: () => {
        fn();
        anime({ targets: contentRef.current, opacity: [0, 1], translateY: [12, 0], duration: 320, easing: 'easeOutExpo' });
      },
    });
  }

  function validateForm(): string {
    if (!params.title.trim()) return `${t.checklist.titleLabel} requerido`;
    if (params.title.length > 100) return 'Título: máx 100 caracteres';
    if (!params.objective.trim()) return `${t.checklist.objectiveLabel} requerido`;
    if (!params.endDate) return `${t.checklist.endDateLabel} requerido`;
    if (params.endDate <= params.startDate) return 'La fecha límite debe ser posterior al inicio';
    if (params.dailyTimeAvailable < 1 || params.dailyTimeAvailable > 1440) return 'Tiempo: 1–1440 min';
    return '';
  }

  async function handleGenerate() {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError('');
    const finalParams: ChecklistParams = {
      ...params,
      reminderPreferences: reminderEnabled
        ? { time: reminderTime, days: reminderDays, frequency: 'custom' }
        : undefined,
    };
    await animateStep(() => setStep(1));
    try {
      const data = await checklistsApi.generateDraft(finalParams);
      setTasks(data.suggestedItems);
      setRationale(data.rationale ?? '');
      await animateStep(() => setStep(2));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
      await animateStep(() => setStep(0));
    }
  }

  async function handleRegen() {
    if (!regenFeedback.trim()) return;
    setRegenLoading(true);
    try {
      const data = await checklistsApi.regenerateDraft(params, regenFeedback);
      setTasks(data.suggestedItems);
      setRationale(data.rationale ?? '');
      setRegenModal(false);
      setRegenFeedback('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally { setRegenLoading(false); }
  }

  async function handleConfirm() {
    if (tasks.find((task) => !task.description.trim())) { setError(t.checklist.errorEmptyTask); return; }
    setSaving(true); setError('');
    try {
      const saved = await checklistsApi.confirm(params, tasks);
      await animateStep(() => setStep(3));
      setTimeout(() => router.push(`/checklists/${saved.id}`), 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally { setSaving(false); }
  }

  function addTask() {
    setTasks([...tasks, { order: tasks.length, description: '', frequency: 'daily', estimatedDuration: 15, hack: '' }]);
  }

  function onDragStart(idx: number) { dragIdx.current = idx; }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); dragOverIdx.current = idx; }
  function onDrop() {
    if (dragIdx.current === null || dragOverIdx.current === null || dragIdx.current === dragOverIdx.current) {
      dragIdx.current = null; return;
    }
    const next = [...tasks];
    const [moved] = next.splice(dragIdx.current, 1);
    if (moved) next.splice(dragOverIdx.current, 0, moved);
    setTasks(next.map((t, i) => ({ ...t, order: i })));
    dragIdx.current = null; dragOverIdx.current = null;
  }

  const dailyMin = totalDailyMinutes(tasks);
  const dailyPct = Math.min((dailyMin / (params.dailyTimeAvailable || 1)) * 100, 100);
  const dailyOver = dailyMin > params.dailyTimeAvailable;

  const STEPS = [t.checklist.step1, t.checklist.step2, t.checklist.step3, t.checklist.step4];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar variant={user.role === 'client' ? 'client' : 'admin'} />

      {/* ── Same max-width as list page ── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-20">

        {/* Header — mirrors list page style */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10
                        flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={() => router.back()}
              className="font-mono text-[10px] text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                         transition-colors mb-4 flex items-center gap-1.5">
              <IconChevronLeft size={12} />
              {t.checklist.myChecklists}
            </button>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-3">
              AI Lab — Productividad
            </p>
            <h1 className="headline text-5xl md:text-7xl text-slate-900 dark:text-white" suppressHydrationWarning>
              {t.checklist.newChecklist}
            </h1>
          </div>
        </div>

        <StepIndicator steps={STEPS} current={Math.min(step, 3)} />

        <div ref={contentRef}>

          {/* ─── STEP 0: Questionnaire ───────────────────────────────── */}
          {step === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT column */}
              <div className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                                  font-mono text-[11px] text-red-600 dark:text-red-400 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}><IconX size={12} /></button>
                  </div>
                )}

                <section className="card p-6 space-y-5">
                  <SectionTitle num="01"><span suppressHydrationWarning>{t.checklist.sectionCore}</span></SectionTitle>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.checklist.titleLabel} *</label>
                    <input type="text" maxLength={100} className="input"
                      placeholder={t.checklist.titlePlaceholder} value={params.title}
                      onChange={(e) => setParams({ ...params, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.checklist.objectiveLabel} *</label>
                    <textarea rows={3} maxLength={500} className="input resize-none"
                      placeholder={t.checklist.objectivePlaceholder} value={params.objective}
                      onChange={(e) => setParams({ ...params, objective: e.target.value })} />
                    <p className="font-mono text-[9px] text-slate-400 mt-1 text-right">{params.objective.length}/500</p>
                  </div>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.checklist.categoryLabel}</label>
                    <input type="text" maxLength={50} className="input"
                      placeholder={t.checklist.categoryPlaceholder} value={params.category ?? ''}
                      onChange={(e) => setParams({ ...params, category: e.target.value })} />
                  </div>
                </section>

                <section className="card p-6 space-y-5">
                  <SectionTitle num="02">Tiempo</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label" suppressHydrationWarning>{t.checklist.startDateLabel} *</label>
                      <input type="date" className="input" min={today} value={params.startDate}
                        onChange={(e) => setParams({ ...params, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="label" suppressHydrationWarning>{t.checklist.endDateLabel} *</label>
                      <input type="date" className="input" min={params.startDate} value={params.endDate}
                        onChange={(e) => setParams({ ...params, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label" suppressHydrationWarning>{t.checklist.difficultyLabel} *</label>
                      <select className="input" value={params.difficulty}
                        onChange={(e) => setParams({ ...params, difficulty: e.target.value as 'low'|'medium'|'high' })}>
                        <option value="low">{t.checklist.diffLow}</option>
                        <option value="medium">{t.checklist.diffMedium}</option>
                        <option value="high">{t.checklist.diffHigh}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" suppressHydrationWarning>{t.checklist.dailyTimeLabel} *</label>
                      <input type="number" min={1} max={1440} className="input"
                        placeholder={t.checklist.dailyTimePlaceholder}
                        value={params.dailyTimeAvailable}
                        onChange={(e) => setParams({ ...params, dailyTimeAvailable: parseInt(e.target.value) || 30 })} />
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT column */}
              <div className="space-y-6">
                <section className="card p-6 space-y-5">
                  <SectionTitle num="03"><span suppressHydrationWarning>{t.checklist.sectionStyle}</span></SectionTitle>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.checklist.styleLabel} *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['micro-habits','concrete-tasks','mixed'] as const).map((s) => {
                        const label = s === 'micro-habits' ? t.checklist.styleMicro
                          : s === 'concrete-tasks' ? t.checklist.styleConcrete : t.checklist.styleMixed;
                        return (
                          <button key={s} type="button" onClick={() => setParams({ ...params, style: s })}
                            className={`p-3 rounded-lg border font-mono text-[10px] uppercase tracking-wider transition-all
                              ${params.style === s
                                ? 'border-sky-400 bg-sky-50 dark:bg-sky-400/10 text-sky-700 dark:text-sky-400'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-sky-300 dark:hover:border-sky-400/30'
                              }`}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.checklist.goalMetricLabel}</label>
                    <input type="text" maxLength={200} className="input"
                      placeholder={t.checklist.goalMetricPlaceholder} value={params.goalMetric ?? ''}
                      onChange={(e) => setParams({ ...params, goalMetric: e.target.value })} />
                  </div>
                </section>

                <section className="card p-6 space-y-5">
                  <SectionTitle num="04"><span suppressHydrationWarning>{t.checklist.sectionReminders}</span></SectionTitle>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setReminderEnabled(!reminderEnabled)}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200
                        ${reminderEnabled ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
                        ${reminderEnabled ? 'left-5' : 'left-0.5'}`} />
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      Activar recordatorios
                    </span>
                  </label>

                  {reminderEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="label" suppressHydrationWarning>{t.checklist.reminderTimeLabel}</label>
                        <input type="time" className="input w-40" value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)} />
                      </div>
                      <div>
                        <label className="label" suppressHydrationWarning>{t.checklist.reminderDaysLabel}</label>
                        <div className="flex flex-wrap gap-2">
                          {WEEKDAYS.map((day) => (
                            <button key={day} type="button"
                              onClick={() => setReminderDays(
                                reminderDays.includes(day)
                                  ? reminderDays.filter((d) => d !== day)
                                  : [...reminderDays, day]
                              )}
                              className={`px-3 py-1 rounded border font-mono text-[9px] uppercase tracking-wider transition-all
                                ${reminderDays.includes(day)
                                  ? 'border-sky-400 bg-sky-50 dark:bg-sky-400/10 text-sky-700 dark:text-sky-400'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-400'
                                }`}>
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label" suppressHydrationWarning>{t.checklist.telegramLabel}</label>
                          <button type="button" onClick={() => setShowTelegramHelp(true)}
                            className="font-mono text-[9px] text-sky-500 dark:text-sky-400
                                       hover:text-sky-600 dark:hover:text-sky-300 transition-colors
                                       flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                              <path d="M7 6.5v3M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                            ¿Cómo obtenerlo?
                          </button>
                        </div>
                        <input type="text" className="input font-mono" placeholder={t.checklist.telegramPlaceholder}
                          value={params.telegramChatId ?? ''}
                          onChange={(e) => setParams({ ...params, telegramChatId: e.target.value })} />
                      </div>
                    </div>
                  )}
                </section>

                <button onClick={() => void handleGenerate()}
                  className="btn-primary w-full py-4 text-[12px] flex items-center justify-center gap-2">
                  <IconSparkle size={14} />
                  <span suppressHydrationWarning>{t.checklist.step2} →</span>
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 1: Generating ──────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-28 gap-8">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border border-sky-400/20 animate-ping" />
                <div className="absolute inset-3 rounded-full border border-sky-400/40 animate-ping [animation-delay:0.4s]" />
                <div className="absolute inset-0 flex items-center justify-center
                                text-sky-500 dark:text-sky-400">
                  <IconBrainLarge />
                </div>
              </div>
              <div className="text-center">
                <p className="headline text-3xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>
                  {t.checklist.generating}
                </p>
                <p className="font-mono text-[11px] text-slate-500" suppressHydrationWarning>
                  {t.checklist.generatingMsg}
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Review ──────────────────────────────────────── */}
          {step === 2 && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
              {/* Main: task list */}
              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                                  font-mono text-[11px] text-red-600 dark:text-red-400 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}><IconX size={12} /></button>
                  </div>
                )}

                {tasks.map((task, idx) => (
                  <div key={idx}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={onDrop}>
                    <TaskCard
                      task={task} index={idx} editable
                      onUpdate={(updated) => setTasks(tasks.map((t, i) => i === idx ? updated : t))}
                      onDelete={() => setTasks(tasks.filter((_, i) => i !== idx))}
                    />
                  </div>
                ))}

                <button onClick={addTask}
                  className="w-full py-3 rounded-xl border-2 border-dashed
                             border-slate-200 dark:border-slate-800
                             text-slate-400 hover:border-sky-400 dark:hover:border-sky-400/50
                             hover:text-sky-500 dark:hover:text-sky-400
                             font-mono text-[11px] uppercase tracking-widest transition-all
                             flex items-center justify-center gap-2">
                  <IconPlus size={12} />
                  <span suppressHydrationWarning>{t.checklist.addTask}</span>
                </button>
              </div>

              {/* Sidebar: summary + actions */}
              <div className="space-y-4">
                {rationale && (
                  <div className="card p-4">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-2 flex items-center gap-1.5">
                      <IconSparkle size={10} />
                      <span suppressHydrationWarning>{t.checklist.rationale}</span>
                    </p>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rationale}
                    </p>
                  </div>
                )}

                {/* Daily time */}
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400"
                       suppressHydrationWarning>{t.checklist.dailySummary}</p>
                    <p className={`font-mono text-[11px] font-bold ${dailyOver ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {dailyMin}/{params.dailyTimeAvailable} {t.checklist.mins}
                    </p>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${dailyOver ? 'bg-red-400' : 'bg-sky-500'}`}
                      style={{ width: `${dailyPct}%` }} />
                  </div>
                  {dailyOver && (
                    <p className="font-mono text-[9px] text-red-400 mt-1.5" suppressHydrationWarning>
                      {t.checklist.dailyExceeded}
                    </p>
                  )}
                </div>

                {/* Task count */}
                <div className="card p-4 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Tareas</p>
                  <p className="font-mono text-xl font-bold text-slate-800 dark:text-white">{tasks.length}</p>
                </div>

                <button onClick={() => setRegenModal(true)}
                  className="btn-ghost w-full py-3 flex items-center justify-center gap-2" suppressHydrationWarning>
                  <IconRefresh size={13} />
                  {t.checklist.regenerate}
                </button>

                <button onClick={() => void handleConfirm()} disabled={saving || tasks.length === 0}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {saving ? <Spinner /> : <><IconCheck size={13} /> <span suppressHydrationWarning>{t.checklist.confirmChecklist}</span></>}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Done ────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-28 gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15
                              border-2 border-emerald-300 dark:border-emerald-500/40
                              flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <IconCheck size={36} />
              </div>
              <div>
                <h2 className="headline text-4xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>
                  {t.checklist.saveSuccess}
                </h2>
                <p className="font-mono text-[11px] text-slate-500">Redirigiendo...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Regen modal ─────────────────────────────────────────────── */}
      {regenModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="headline text-2xl text-slate-900 dark:text-white" suppressHydrationWarning>
                {t.checklist.regenerateTitle}
              </h3>
              <button onClick={() => setRegenModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <IconX size={18} />
              </button>
            </div>
            <div>
              <label className="label" suppressHydrationWarning>{t.checklist.feedbackLabel}</label>
              <textarea rows={4} className="input resize-none"
                placeholder={t.checklist.feedbackPlaceholder}
                value={regenFeedback}
                onChange={(e) => setRegenFeedback(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => void handleRegen()} disabled={regenLoading || !regenFeedback.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {regenLoading ? <Spinner /> : <><IconRefresh size={13} /> <span suppressHydrationWarning>{t.checklist.regenerate}</span></>}
              </button>
              <button onClick={() => setRegenModal(false)} className="btn-ghost flex-1 flex items-center justify-center gap-1.5">
                <IconX size={12} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      {showTelegramHelp && <TelegramHelpModal onClose={() => setShowTelegramHelp(false)} />}
  );
}

function IconBrainLarge() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M14 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 14c-1.5-4.8 1.5-8 5.5-8 2 0 3.8.8 4.5 2M23 14c1.5-4.8-1.5-8-5.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 26c-1.5 4.8 1.5 8 5.5 8h9c4 0 7-3.2 5.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 20c-1.5-3 0-7.5 4.5-9M34 20c1.5-3 0-7.5-4.5-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
