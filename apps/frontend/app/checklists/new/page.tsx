'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { Navbar } from '../../../components/ui/Navbar';
import { StepIndicator } from '../../../components/checklists/StepIndicator';
import { IconChevronLeft } from '../../../components/checklists/Icons';
import { checklistsApi, type ChecklistParams, type TaskDraft } from '../../../lib/checklists';
import { StepQuestionnaire } from '../../../components/checklists/new-wizard/StepQuestionnaire';
import { StepGenerating } from '../../../components/checklists/new-wizard/StepGenerating';
import { StepReview } from '../../../components/checklists/new-wizard/StepReview';
import { StepDone } from '../../../components/checklists/new-wizard/StepDone';
import { RegenModal } from '../../../components/checklists/new-wizard/RegenModal';

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
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);

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

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-20 pb-20">
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
          {step === 0 && (
            <StepQuestionnaire
              params={params} setParams={setParams}
              reminderEnabled={reminderEnabled} setReminderEnabled={setReminderEnabled}
              reminderTime={reminderTime} setReminderTime={setReminderTime}
              reminderDays={reminderDays} setReminderDays={setReminderDays}
              showTelegramHelp={showTelegramHelp} setShowTelegramHelp={setShowTelegramHelp}
              error={error} setError={setError}
              onGenerate={() => void handleGenerate()}
            />
          )}
          {step === 1 && <StepGenerating />}
          {step === 2 && (
            <StepReview
              tasks={tasks} setTasks={setTasks}
              rationale={rationale}
              dailyTimeAvailable={params.dailyTimeAvailable}
              saving={saving} error={error} setError={setError}
              onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
              onRegen={() => setRegenModal(true)}
              onConfirm={() => void handleConfirm()}
            />
          )}
          {step === 3 && <StepDone />}
        </div>
      </div>

      <RegenModal
        open={regenModal}
        feedback={regenFeedback}
        loading={regenLoading}
        onFeedbackChange={setRegenFeedback}
        onRegen={() => void handleRegen()}
        onClose={() => setRegenModal(false)}
      />
    </div>
  );
}
