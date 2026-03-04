'use client';

import { useI18n } from '../../../lib/i18n-context';
import { IconRefresh, IconX } from '../Icons';

interface Props {
  open: boolean;
  feedback: string;
  loading: boolean;
  onFeedbackChange: (v: string) => void;
  onRegen: () => void;
  onClose: () => void;
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function RegenModal({ open, feedback, loading, onFeedbackChange, onRegen, onClose }: Props) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md card p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="headline text-2xl text-slate-900 dark:text-white" suppressHydrationWarning>
            {t.checklist.regenerateTitle}
          </h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <IconX size={18} />
          </button>
        </div>
        <div>
          <label className="label" suppressHydrationWarning>{t.checklist.feedbackLabel}</label>
          <textarea rows={4} className="input resize-none"
            placeholder={t.checklist.feedbackPlaceholder}
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onRegen} disabled={loading || !feedback.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner /> : <><IconRefresh size={13} /> <span suppressHydrationWarning>{t.checklist.regenerate}</span></>}
          </button>
          <button onClick={onClose} className="btn-ghost flex-1 flex items-center justify-center gap-1.5">
            <IconX size={12} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
