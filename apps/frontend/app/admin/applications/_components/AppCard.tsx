'use client';
import { useState } from 'react';
import { Application, AppStatus, getHeaders } from './types';
import { AtsRing, IconDownload, IconSave, IconSpark, Spinner } from './icons';

// ── Local icons ───────────────────────────────────────────────────────────────
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconQuestion = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconLink = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

// ── ATS PDF — section-aware, no browser chrome ───────────────────────────────
// @page margin:0 + body padding removes URL/title/date/page-number browser headers.
// Each ALL-CAPS section is wrapped in a div with page-break-inside:avoid so
// section headers never orphan at the bottom of a page.
function printATS(cvText: string, lang: 'es' | 'en', position: string, company: string) {
  const win = window.open('', '_blank');
  if (!win) return;

  const sectionRx = /^(CONTACT(?:O)?|SUMMARY|RESUMEN|EXPERIENCE|EXPERIENCIA|EDUCATION|EDUCACI[OÓ]N|SKILLS|HABILIDADES|LANGUAGES|IDIOMAS|CERTIFICATIONS|CERTIFICACIONES)$/m;
  const lines = cvText.split('\n');
  let html = '';
  let buf = '';
  const flush = () => {
    if (buf.trim()) html += `<div class="s"><pre>${buf.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`;
    buf = '';
  };
  for (const line of lines) {
    if (sectionRx.test(line.trim())) { flush(); buf = line + '\n'; }
    else buf += line + '\n';
  }
  flush();

  win.document.write(`<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"/><title></title>
<style>
@page{margin:0;size:Letter}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.5;color:#000;background:#fff;padding:0.75in}
pre{font-family:Arial,Helvetica,sans-serif;font-size:11pt;white-space:pre-wrap;word-wrap:break-word;line-height:1.5}
.s{page-break-inside:avoid;break-inside:avoid;margin-bottom:0.15in}
</style></head><body>${html}</body></html>`);
  win.document.close();
  win.addEventListener('load', () => { win.focus(); win.print(); win.close(); });
}

const APPLIED_FROM_OPTIONS = [
  'LinkedIn', 'Indeed', 'Glassdoor', 'InfoJobs', 'OCC Mundial',
  'Computrabajo', 'Sitio web de la empresa', 'Referido', 'Otro',
];

export function AppCard({ app, userRole, onStatusChange, onDelete, onUpdate, t }: {
  app: Application;
  userRole: string;
  onStatusChange: (id: string, status: AppStatus) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  t: { applications: Record<string, string> };
}) {
  const ta = t.applications;

  const [expanded, setExpanded]     = useState(false);
  const [cvLang, setCvLang]         = useState<'es' | 'en'>('es');
  const [confirmDel, setConfirmDel] = useState(false);

  // Applied-from inline edit
  const [editingFrom, setEditingFrom]   = useState(false);
  const [appliedFrom, setAppliedFrom]   = useState(app.appliedFrom ?? '');

  // Interview Q&A panel
  const [showQA, setShowQA]           = useState(false);
  const [questions, setQuestions]     = useState(app.interviewQuestions ?? '');
  const [answers, setAnswers]         = useState(app.interviewAnswers ?? '');
  const [qaLoading, setQaLoading]     = useState(false);
  const [qaSaving, setQaSaving]       = useState(false);
  const [qaError, setQaError]         = useState('');

  const statusMap: Record<AppStatus, { label: string; color: string }> = {
    pending:    { label: ta.statusPending,   color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5' },
    in_process: { label: ta.statusInProcess, color: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5' },
    accepted:   { label: ta.statusAccepted,  color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5' },
    rejected:   { label: ta.statusRejected,  color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5' },
  };
  const meta  = statusMap[app.status];
  const hasCv = !!(app.cvGeneratedEs || app.cvGeneratedEn);

  async function saveAppliedFrom() {
    await fetch(`/api/applications/${app.id}`, {
      method: 'PATCH', headers: getHeaders(),
      body: JSON.stringify({ appliedFrom }),
    });
    onUpdate(app.id, { appliedFrom });
    setEditingFrom(false);
  }

  async function generateAnswers() {
    if (!questions.trim()) return;
    setQaLoading(true); setQaError('');
    try {
      const res = await fetch(`/api/applications/${app.id}/interview-qa`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ applicationId: app.id, questions, lang: 'es' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { answers: string };
      setAnswers(data.answers);
    } catch (e) { setQaError(e instanceof Error ? e.message : 'Error generando respuestas'); }
    finally { setQaLoading(false); }
  }

  async function saveQA() {
    setQaSaving(true);
    try {
      await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ interviewQuestions: questions, interviewAnswers: answers }),
      });
      onUpdate(app.id, { interviewQuestions: questions, interviewAnswers: answers });
    } catch { setQaError('Error guardando'); }
    finally { setQaSaving(false); }
  }

  return (
    <div className="card overflow-hidden hover:shadow-md transition-all duration-200">

      {/* ── Header ────────────────────────────────────────────────────────── */}
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

            {/* Applied-from row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <IconLink />
              {editingFrom ? (
                <>
                  <select value={appliedFrom} onChange={e => setAppliedFrom(e.target.value)}
                    className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200
                               dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-400
                               focus:outline-none focus:border-sky-400 transition-colors">
                    <option value="">{ta.appliedFromPlaceholder ?? 'Seleccioná origen...'}</option>
                    {APPLIED_FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input value={appliedFrom} onChange={e => setAppliedFrom(e.target.value)}
                    placeholder={ta.appliedFromCustom ?? 'o escribí uno...'}
                    className="font-mono text-[10px] border border-slate-200 dark:border-slate-700 rounded
                               px-1.5 py-0.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400
                               focus:outline-none focus:border-sky-400 w-32 transition-colors" />
                  <button onClick={saveAppliedFrom}
                    className="font-mono text-[9px] px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-600 text-white transition-colors">
                    {ta.save ?? 'Guardar'}
                  </button>
                  <button onClick={() => setEditingFrom(false)}
                    className="font-mono text-[9px] text-slate-400 hover:text-slate-600 transition-colors">
                    {ta.cancel ?? 'Cancelar'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditingFrom(true)}
                  className="font-mono text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {appliedFrom || (ta.appliedFromAdd ?? '+ Agregar origen')}
                </button>
              )}
            </div>

            {/* Actions row */}
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
                  {ta.viewCV ?? 'CV'}
                  <IconChevron open={expanded} />
                </button>
              )}

              {hasCv && (
                <button onClick={() => setShowQA(v => !v)}
                  className="font-mono text-[10px] flex items-center gap-1.5 text-violet-600 dark:text-violet-400
                             border border-violet-200 dark:border-violet-400/30 rounded px-2 py-0.5
                             hover:bg-violet-50 dark:hover:bg-violet-400/10 transition-all">
                  <IconQuestion />
                  {ta.interviewQA ?? 'Entrevista'}
                  <IconChevron open={showQA} />
                </button>
              )}

              {/* Delete */}
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)}
                  className="ml-auto font-mono text-[9.5px] flex items-center gap-1 text-slate-400
                             hover:text-rose-500 dark:hover:text-rose-400 transition-colors px-1.5 py-0.5 rounded">
                  <IconTrash /> {ta.deleteApp ?? 'Eliminar'}
                </button>
              ) : (
                <span className="ml-auto flex items-center gap-2">
                  <span className="font-mono text-[9.5px] text-rose-500">{ta.deleteConfirm ?? '¿Confirmar?'}</span>
                  <button onClick={() => onDelete(app.id)}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded
                               bg-rose-500 hover:bg-rose-600 text-white transition-colors">
                    {ta.deleteYes ?? 'Sí'}
                  </button>
                  <button onClick={() => setConfirmDel(false)}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded
                               border border-slate-200 dark:border-slate-700 text-slate-400
                               hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {ta.deleteNo ?? 'No'}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CV panel ──────────────────────────────────────────────────────── */}
      {expanded && hasCv && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          {/* Lang tabs — text only, no flags */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {(['es', 'en'] as const).map(lng => (
              <button key={lng} onClick={() => setCvLang(lng)}
                className={`px-5 py-1.5 font-mono text-[10px] uppercase tracking-widest -mb-px border-b-2 transition-colors
                  ${cvLang === lng
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                {lng === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>

          <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed
                          whitespace-pre-wrap bg-white dark:bg-slate-900 rounded-lg p-3
                          border border-slate-100 dark:border-slate-800 max-h-[400px] overflow-y-auto">
            {cvLang === 'es' ? (app.cvGeneratedEs ?? app.cvGeneratedEn ?? '') : (app.cvGeneratedEn ?? app.cvGeneratedEs ?? '')}
          </pre>

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => printATS(app.cvGeneratedEs ?? '', 'es', app.position, app.company)}
              disabled={!app.cvGeneratedEs}
              className="btn-ghost text-[9.5px] py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40">
              <IconDownload /> PDF Español
            </button>
            <button onClick={() => printATS(app.cvGeneratedEn ?? '', 'en', app.position, app.company)}
              disabled={!app.cvGeneratedEn}
              className="btn-ghost text-[9.5px] py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40">
              <IconDownload /> PDF English
            </button>
          </div>
        </div>
      )}

      {/* ── Interview Q&A panel ───────────────────────────────────────────── */}
      {showQA && hasCv && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4 bg-violet-50/30 dark:bg-violet-900/5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-400">
              {ta.interviewQATitle ?? 'Preguntas de entrevista'}
            </p>
            {userRole === 'superadmin' && (
              <span className="font-mono text-[8.5px] px-2 py-0.5 rounded-full
                               bg-violet-100 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400
                               border border-violet-200 dark:border-violet-400/20">
                + contexto técnico del sistema
              </span>
            )}
          </div>

          <div>
            <label className="block font-mono text-[9.5px] uppercase tracking-widest text-slate-400 mb-1.5">
              {ta.interviewQuestionsLabel ?? 'Preguntas (una por línea o numeradas)'}
            </label>
            <textarea
              value={questions}
              onChange={e => setQuestions(e.target.value)}
              rows={5}
              placeholder={ta.interviewQuestionsPlaceholder ?? '¿Por qué quieres trabajar aquí?\n¿Cuál es tu mayor fortaleza?\n¿Cómo manejás el trabajo bajo presión?'}
              className="w-full font-mono text-[10.5px] input-field resize-y"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={generateAnswers} disabled={qaLoading || !questions.trim()}
              className="btn-primary text-[10px] py-2 px-4 flex items-center gap-2 disabled:opacity-40">
              {qaLoading ? <><Spinner sm />{ta.generatingAnswers ?? 'Generando...'}</> : <><IconSpark />{ta.generateAnswers ?? 'Generar respuestas'}</>}
            </button>
            {qaError && <p className="font-mono text-[10px] text-rose-500">{qaError}</p>}
          </div>

          {answers && (
            <div className="space-y-2">
              <label className="block font-mono text-[9.5px] uppercase tracking-widest text-slate-400">
                {ta.interviewAnswersLabel ?? 'Respuestas sugeridas — editá antes de usar'}
              </label>
              <textarea
                value={answers}
                onChange={e => setAnswers(e.target.value)}
                rows={10}
                className="w-full font-mono text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed
                           bg-white dark:bg-slate-900 rounded-lg p-3
                           border border-slate-200 dark:border-slate-700
                           focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400
                           resize-y transition-all"
              />
              <button onClick={saveQA} disabled={qaSaving}
                className="btn-ghost text-[9.5px] py-1.5 px-4 flex items-center gap-2">
                {qaSaving ? <><Spinner sm />{ta.savingAnswers ?? 'Guardando...'}</> : <><IconSave />{ta.saveAnswers ?? 'Guardar preguntas y respuestas'}</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
