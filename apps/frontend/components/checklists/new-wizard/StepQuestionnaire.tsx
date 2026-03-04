'use client';

import { useI18n } from '../../../lib/i18n-context';
import { TelegramHelpModal } from '../../ui/TelegramHelpModal';
import { IconSparkle, IconX } from '../Icons';
import { WEEKDAYS, type ChecklistParams } from '../../../lib/checklists';

const today = new Date().toISOString().split('T')[0]!;

function SectionTitle({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-sky-600 dark:text-sky-400 mb-4">
      {num} — {children}
    </p>
  );
}

interface Props {
  params: ChecklistParams;
  setParams: (p: ChecklistParams) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  reminderTime: string;
  setReminderTime: (v: string) => void;
  reminderDays: string[];
  setReminderDays: (v: string[]) => void;
  showTelegramHelp: boolean;
  setShowTelegramHelp: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  onGenerate: () => void;
}

export function StepQuestionnaire({
  params, setParams, reminderEnabled, setReminderEnabled,
  reminderTime, setReminderTime, reminderDays, setReminderDays,
  showTelegramHelp, setShowTelegramHelp, error, setError, onGenerate,
}: Props) {
  const { t } = useI18n();

  return (
    <>
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

          <button onClick={onGenerate}
            className="btn-primary w-full py-4 text-[12px] flex items-center justify-center gap-2">
            <IconSparkle size={14} />
            <span suppressHydrationWarning>{t.checklist.step2} →</span>
          </button>
        </div>
      </div>

      {showTelegramHelp && <TelegramHelpModal onClose={() => setShowTelegramHelp(false)} />}
    </>
  );
}
