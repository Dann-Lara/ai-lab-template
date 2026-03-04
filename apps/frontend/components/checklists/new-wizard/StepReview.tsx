'use client';

import { useI18n } from '../../../lib/i18n-context';
import { TaskCard } from '../TaskCard';
import { IconSparkle, IconRefresh, IconCheck, IconPlus, IconX } from '../Icons';
import { totalDailyMinutes, type TaskDraft } from '../../../lib/checklists';

interface Props {
  tasks: TaskDraft[];
  setTasks: (tasks: TaskDraft[]) => void;
  rationale: string;
  dailyTimeAvailable: number;
  saving: boolean;
  error: string;
  setError: (v: string) => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: () => void;
  onRegen: () => void;
  onConfirm: () => void;
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function StepReview({
  tasks, setTasks, rationale, dailyTimeAvailable, saving,
  error, setError, onDragStart, onDragOver, onDrop, onRegen, onConfirm,
}: Props) {
  const { t } = useI18n();

  const dailyMin = totalDailyMinutes(tasks);
  const dailyPct = Math.min((dailyMin / (dailyTimeAvailable || 1)) * 100, 100);
  const dailyOver = dailyMin > dailyTimeAvailable;

  function addTask() {
    setTasks([...tasks, { order: tasks.length, description: '', frequency: 'daily', estimatedDuration: 15, hack: '' }]);
  }

  return (
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

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400"
               suppressHydrationWarning>{t.checklist.dailySummary}</p>
            <p className={`font-mono text-[11px] font-bold ${dailyOver ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {dailyMin}/{dailyTimeAvailable} {t.checklist.mins}
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

        <div className="card p-4 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Tareas</p>
          <p className="font-mono text-xl font-bold text-slate-800 dark:text-white">{tasks.length}</p>
        </div>

        <button onClick={onRegen}
          className="btn-ghost w-full py-3 flex items-center justify-center gap-2" suppressHydrationWarning>
          <IconRefresh size={13} />
          {t.checklist.regenerate}
        </button>

        <button onClick={onConfirm} disabled={saving || tasks.length === 0}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          {saving ? <Spinner /> : <><IconCheck size={13} /> <span suppressHydrationWarning>{t.checklist.confirmChecklist}</span></>}
        </button>
      </div>
    </div>
  );
}
