'use client';
import { useState } from 'react';
import type { TaskDraft, TaskFrequency } from '../../lib/checklists';
import { useI18n } from '../../lib/i18n-context';

const FREQ_COLORS: Record<TaskFrequency, string> = {
  once:   'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-400/30 bg-purple-50 dark:bg-purple-400/5',
  daily:  'text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
  weekly: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5',
  custom: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5',
};

interface Props {
  task: TaskDraft;
  index: number;
  editable?: boolean;
  dragging?: boolean;
  onUpdate?: (updated: TaskDraft) => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onPostpone?: () => void;
  onSkip?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function TaskCard({
  task, index, editable, dragging, onUpdate, onDelete,
  onComplete, onPostpone, onSkip, dragHandleProps,
}: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [hackOpen, setHackOpen] = useState(false);
  const [draft, setDraft] = useState(task);

  const freqLabel: Record<TaskFrequency, string> = {
    once: t.checklist.freqOnce, daily: t.checklist.freqDaily,
    weekly: t.checklist.freqWeekly, custom: t.checklist.freqCustom,
  };

  function saveEdit() {
    onUpdate?.(draft);
    setEditing(false);
  }

  const statusColor =
    task.status === 'completed' ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
    : task.status === 'skipped' ? 'border-slate-200 dark:border-slate-700 opacity-50'
    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40';

  return (
    <div className={`relative rounded-xl border transition-all duration-200 group
      ${dragging ? 'shadow-2xl scale-[1.02] rotate-1 z-50 opacity-90' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}
      ${statusColor}`}>

      {/* Drag handle */}
      {editable && (
        <div {...dragHandleProps}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center
                     cursor-grab active:cursor-grabbing rounded-l-xl
                     text-slate-300 dark:text-slate-700 hover:text-slate-400 dark:hover:text-slate-500
                     hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="13" r="1.5" fill="currentColor"/>
          </svg>
        </div>
      )}

      <div className={`p-4 ${editable ? 'pl-10' : 'pl-4'}`}>
        {!editing ? (
          <>
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-mono text-[9px] text-slate-400 shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className={`font-mono text-[12px] leading-relaxed flex-1
                  ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {task.description}
                </p>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {task.status === 'pending' && onComplete && (
                  <>
                    <button onClick={onComplete} title={t.checklist.markComplete}
                      className="w-7 h-7 rounded-md border border-emerald-200 dark:border-emerald-500/30
                                 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
                                 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {onPostpone && (
                      <button onClick={onPostpone} title={t.checklist.postponeTask}
                        className="w-7 h-7 rounded-md border border-amber-200 dark:border-amber-500/30
                                   bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400
                                   hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all flex items-center justify-center">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M5.5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </>
                )}
                {editable && onUpdate && (
                  <button onClick={() => setEditing(true)} title={t.checklist.editTask}
                    className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700
                               text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                               hover:border-sky-300 dark:hover:border-sky-400/40
                               hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all flex items-center justify-center">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 10l2.5-.5 6-6-2-2-6 6L1 10z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                {editable && onDelete && (
                  <button onClick={onDelete} title={t.checklist.deleteTask}
                    className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700
                               text-slate-400 hover:text-red-500 dark:hover:text-red-400
                               hover:border-red-200 dark:hover:border-red-400/30
                               hover:bg-red-50 dark:hover:bg-red-400/5 transition-all flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${FREQ_COLORS[task.frequency]}`}>
                {freqLabel[task.frequency]}
                {task.frequency === 'custom' && task.customFrequencyDays ? ` /${task.customFrequencyDays}d` : ''}
              </span>
              <span className="font-mono text-[9px] text-slate-400 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M5 2.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                {task.estimatedDuration} {t.checklist.mins}
              </span>
              {/* Hack toggle */}
              <button
                onClick={() => setHackOpen(!hackOpen)}
                className="font-mono text-[9px] text-sky-500 dark:text-sky-400 flex items-center gap-1
                           hover:text-sky-600 dark:hover:text-sky-300 transition-colors ml-auto">
                💡 {t.checklist.hackLabel}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                  className={`transition-transform ${hackOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Hack panel */}
            {hackOpen && (
              <div className="mt-3 px-3 py-2.5 rounded-lg
                              bg-sky-50 dark:bg-sky-400/5
                              border border-sky-200 dark:border-sky-400/20 animate-fade-in">
                <p className="font-mono text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
                  {task.hack}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Edit form */
          <div className="space-y-3">
            <div>
              <label className="label">{t.checklist.taskDescription}</label>
              <textarea rows={2} className="input resize-none text-sm"
                value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.checklist.taskFrequency}</label>
                <select className="input" value={draft.frequency}
                  onChange={(e) => setDraft({ ...draft, frequency: e.target.value as TaskFrequency })}>
                  <option value="once">{t.checklist.freqOnce}</option>
                  <option value="daily">{t.checklist.freqDaily}</option>
                  <option value="weekly">{t.checklist.freqWeekly}</option>
                  <option value="custom">{t.checklist.freqCustom}</option>
                </select>
              </div>
              <div>
                <label className="label">{t.checklist.taskDuration}</label>
                <input type="number" min={1} max={480} className="input"
                  value={draft.estimatedDuration}
                  onChange={(e) => setDraft({ ...draft, estimatedDuration: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            {draft.frequency === 'custom' && (
              <div>
                <label className="label">{t.checklist.customDays}</label>
                <input type="number" min={1} className="input"
                  value={draft.customFrequencyDays ?? 2}
                  onChange={(e) => setDraft({ ...draft, customFrequencyDays: parseInt(e.target.value) || 1 })} />
              </div>
            )}
            <div>
              <label className="label">{t.checklist.taskHack}</label>
              <input type="text" maxLength={200} className="input"
                value={draft.hack} onChange={(e) => setDraft({ ...draft, hack: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="btn-primary text-[10px] py-1.5 px-4 flex-1">✓</button>
              <button onClick={() => { setDraft(task); setEditing(false); }}
                className="btn-ghost text-[10px] py-1.5 px-4">✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
