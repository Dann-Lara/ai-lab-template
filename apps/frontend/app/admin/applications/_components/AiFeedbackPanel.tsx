'use client';
import { useState } from 'react';
import { Application, getHeaders } from './types';
import { AtsRing, IconSpark, Spinner } from './icons';

interface Stats {
  total: number; accepted: number; rejected: number;
  pending: number; avgAts: number; acceptRate: number;
}

interface Props {
  stats: Stats;
  apps: Application[];
  t: { applications: Record<string, string> };
}

export function AiFeedbackPanel({ stats, apps, t }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function loadFeedback() {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/feedback', {
        method: 'POST', headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { feedback: string };
      setFeedback(data.feedback || 'No se pudo generar feedback.');
    } catch { setFeedback('Error al conectar con la IA.'); }
    finally { setLoading(false); }
  }

  const appsWithAts = apps.filter(a => a.atsScore);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: t.applications.statTotal,       value: stats.total },
          { label: t.applications.statAccepted,    value: stats.accepted },
          { label: t.applications.statRejected,    value: stats.rejected },
          { label: t.applications.statSuccessRate, value: `${stats.acceptRate}%` },
        ]).map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="font-mono text-[24px] font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Avg ATS */}
      {appsWithAts.length > 0 && (
        <div className="card p-5 flex items-center gap-6">
          <AtsRing score={stats.avgAts} large />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
              {t.applications.avgATSLabel}
            </p>
            <p className="font-mono text-[10px] text-slate-500 mt-1">
              {t.applications.avgATSBased.replace('{n}', String(appsWithAts.length))}
            </p>
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {apps.length >= 2 ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
              {t.applications.feedbackTitle}
            </h3>
            <button onClick={loadFeedback} disabled={loading}
              className="btn-primary text-[10px] py-1.5 px-4 flex items-center gap-1.5">
              {loading ? <><Spinner sm /> {t.applications.feedbackGenerating}</> : <><IconSpark /> {t.applications.feedbackGenerate}</>}
            </button>
          </div>
          {feedback
            ? <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap
                              bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                {feedback}
              </pre>
            : <p className="font-mono text-[10px] text-slate-400">{t.applications.feedbackEmpty}</p>
          }
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="font-mono text-[11px] text-slate-400">{t.applications.needMoreApps}</p>
        </div>
      )}
    </div>
  );
}
