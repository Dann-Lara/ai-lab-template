'use client';
import { Application, AppStatus } from './types';
import { AtsRing, IconDownload } from './icons';

export function AppCard({ app, onStatusChange, onGenerate, t }: {
  app: Application;
  onStatusChange: (id: string, status: AppStatus) => void;
  onGenerate: (app: Application) => void;
  t: { applications: Record<string, string> };
}) {
  const statusMap: Record<AppStatus, { label: string; color: string }> = {
    pending:    { label: t.applications.statusPending,   color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5' },
    in_process: { label: t.applications.statusInProcess, color: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5' },
    accepted:   { label: t.applications.statusAccepted,  color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5' },
    rejected:   { label: t.applications.statusRejected,  color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5' },
  };
  const meta = statusMap[app.status];
  return (
    <div className="card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        {app.atsScore !== undefined && <AtsRing score={app.atsScore} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200">{app.position}</p>
              <p className="font-mono text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">{app.company}</p>
            </div>
            <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="font-mono text-[10px] text-slate-400">
              {new Date(app.appliedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <select value={app.status} onChange={e => onStatusChange(app.id, e.target.value as AppStatus)}
              className="font-mono text-[10px] bg-transparent border border-slate-200 dark:border-slate-700
                         rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400
                         focus:outline-none focus:border-sky-400 transition-colors cursor-pointer">
              {(Object.keys(statusMap) as AppStatus[]).map(s => (
                <option key={s} value={s}>{statusMap[s].label}</option>
              ))}
            </select>
            <button onClick={() => onGenerate(app)}
              className="font-mono text-[10px] flex items-center gap-1.5 text-sky-600 dark:text-sky-400
                         border border-sky-200 dark:border-sky-400/30 rounded px-2 py-0.5
                         hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all">
              <IconDownload />
              {app.cvGenerated ? t.applications.regenerateCV : t.applications.generateCV}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
