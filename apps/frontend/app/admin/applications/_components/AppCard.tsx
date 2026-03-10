'use client';
import { useState } from 'react';
import { Application, AppStatus } from './types';
import { AtsRing, IconDownload } from './icons';

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={`transition-transform ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

function printATS(cvText: string, lang: 'es' | 'en', position: string, company: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  const title = `CV_${lang.toUpperCase()}_${position.replace(/\s+/g,'_')}_${company.replace(/\s+/g,'_')}`;
  win.document.write(`<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"/><title>${title}</title>
<style>@page{margin:0.75in;size:Letter}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45;color:#000;background:#fff}
pre{font-family:Arial,Helvetica,sans-serif;font-size:11pt;white-space:pre-wrap;word-wrap:break-word;line-height:1.45}</style>
</head><body><pre>${cvText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
  win.document.close();
  win.addEventListener('load', () => { win.focus(); win.print(); win.close(); });
}

export function AppCard({ app, onStatusChange, onDelete, t }: {
  app: Application;
  onStatusChange: (id: string, status: AppStatus) => void;
  onDelete: (id: string) => void;
  t: { applications: Record<string, string> };
}) {
  const [expanded, setExpanded]   = useState(false);
  const [cvLang, setCvLang]       = useState<'es' | 'en'>('es');
  const [confirmDel, setConfirmDel] = useState(false);

  const statusMap: Record<AppStatus, { label: string; color: string }> = {
    pending:    { label: t.applications.statusPending,   color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5' },
    in_process: { label: t.applications.statusInProcess, color: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5' },
    accepted:   { label: t.applications.statusAccepted,  color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5' },
    rejected:   { label: t.applications.statusRejected,  color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5' },
  };
  const meta = statusMap[app.status];
  const hasCv = !!(app.cvGeneratedEs || app.cvGeneratedEn);

  return (
    <div className="card overflow-hidden hover:shadow-md transition-all duration-200">
      {/* ── Card header ─────────────────────────────────────────────────────── */}
      <div className="p-4">
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

            <div className="flex flex-wrap items-center gap-2 mt-2">
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

              {hasCv && (
                <button onClick={() => setExpanded(v => !v)}
                  className="font-mono text-[10px] flex items-center gap-1.5 text-sky-600 dark:text-sky-400
                             border border-sky-200 dark:border-sky-400/30 rounded px-2 py-0.5
                             hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all">
                  <IconDownload />
                  {t.applications.viewCV ?? 'Ver CV'}
                  <IconChevron open={expanded} />
                </button>
              )}

              {/* Delete */}
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)}
                  className="ml-auto font-mono text-[9.5px] flex items-center gap-1 text-slate-400
                             hover:text-rose-500 dark:hover:text-rose-400 transition-colors px-1.5 py-0.5 rounded">
                  <IconTrash /> {t.applications.deleteApp ?? 'Eliminar'}
                </button>
              ) : (
                <span className="ml-auto flex items-center gap-2">
                  <span className="font-mono text-[9.5px] text-rose-500">{t.applications.deleteConfirm ?? '¿Confirmar?'}</span>
                  <button onClick={() => onDelete(app.id)}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded
                               bg-rose-500 hover:bg-rose-600 text-white transition-colors">
                    {t.applications.deleteYes ?? 'Sí'}
                  </button>
                  <button onClick={() => setConfirmDel(false)}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded
                               border border-slate-200 dark:border-slate-700 text-slate-400
                               hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {t.applications.deleteNo ?? 'No'}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CV detail panel ──────────────────────────────────────────────────── */}
      {expanded && hasCv && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          {/* Lang tabs */}
          <div className="flex gap-0 border-b border-slate-200 dark:border-slate-700">
            {(['es','en'] as const).map(lng => (
              <button key={lng} onClick={() => setCvLang(lng)}
                className={`px-4 py-1.5 font-mono text-[9.5px] uppercase tracking-widest -mb-px border-b-2 transition-colors
                  ${cvLang === lng
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                {lng === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
              </button>
            ))}
          </div>

          <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed
                          whitespace-pre-wrap bg-white dark:bg-slate-900 rounded-lg p-3
                          border border-slate-100 dark:border-slate-800 max-h-[400px] overflow-y-auto">
            {cvLang === 'es' ? (app.cvGeneratedEs ?? app.cvGeneratedEn ?? '') : (app.cvGeneratedEn ?? app.cvGeneratedEs ?? '')}
          </pre>

          <div className="flex gap-2">
            <button onClick={() => printATS(app.cvGeneratedEs ?? '', 'es', app.position, app.company)}
              disabled={!app.cvGeneratedEs}
              className="btn-ghost text-[9.5px] py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40">
              <IconDownload /> PDF ES (ATS)
            </button>
            <button onClick={() => printATS(app.cvGeneratedEn ?? '', 'en', app.position, app.company)}
              disabled={!app.cvGeneratedEn}
              className="btn-ghost text-[9.5px] py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40">
              <IconDownload /> PDF EN (ATS)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
