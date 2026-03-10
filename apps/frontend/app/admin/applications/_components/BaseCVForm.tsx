'use client';
import { useState, useEffect, useRef } from 'react';
import { BaseCV, CvEvalResult, EMPTY_CV, getHeaders, isCVComplete } from './types';
import { PdfCVUploader } from './PdfCVUploader';
import { IconCheck, IconDownload, IconInfo, IconSave, IconSpark, IconWarning, Spinner } from './icons';

const MIN_SCORE = 85;

// Which rubric key each CV field maps to
const FIELD_TO_RUBRIC: Record<keyof BaseCV, string> = {
  fullName: 'contact', email: 'contact', phone: 'contact', location: 'contact',
  linkedIn: 'linkedIn', summary: 'summary', experience: 'experience',
  education: 'education', skills: 'skills', languages: 'languages', certifications: 'certifications',
};

type FieldStatus = 'ok' | 'warn' | 'error' | 'pending';

function fieldStatusOf(rubricKey: string, fb: Record<string, string>, hasEval: boolean): FieldStatus {
  if (!hasEval) return 'pending';
  const hint = fb[rubricKey];
  if (hint === undefined || hint === '·') return 'pending'; // '·' = dirty marker
  if (hint === '') return 'ok';
  return hint.length < 60 ? 'warn' : 'error';
}

// ── Visual pieces ─────────────────────────────────────────────────────────────
const STATUS_DOT: Record<FieldStatus, string> = {
  ok: 'bg-emerald-500', warn: 'bg-amber-400', error: 'bg-rose-500', pending: 'bg-slate-300 dark:bg-slate-600',
};
const STATUS_RING: Record<FieldStatus, string> = {
  ok:      'ring-2 ring-emerald-400/50 border-emerald-300 dark:border-emerald-500/40',
  warn:    'ring-2 ring-amber-400/50 border-amber-300 dark:border-amber-400/40',
  error:   'ring-2 ring-rose-400/50 border-rose-300 dark:border-rose-400/40',
  pending: '',
};
const HINT_COLOR: Record<FieldStatus, string> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  error: 'text-rose-600 dark:text-rose-400',
  pending: 'text-slate-400 dark:text-slate-500',
};

function Dot({ status }: { status: FieldStatus }) {
  if (status === 'pending') return null;
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 mb-0.5 ${STATUS_DOT[status]}`} />;
}

function Hint({ status, aiHint, staticHint }: { status: FieldStatus; aiHint?: string; staticHint: string }) {
  const text = (aiHint && aiHint !== '·') ? aiHint : (status === 'ok' ? '' : staticHint);
  if (!text) return null;
  const Icon = status === 'ok' ? IconCheck : status === 'pending' ? IconInfo : IconWarning;
  return (
    <p className={`flex items-start gap-1.5 font-mono text-[9.5px] leading-relaxed mt-1 ${HINT_COLOR[status]}`}>
      <span className="shrink-0 mt-0.5"><Icon /></span>{text}
    </p>
  );
}

function UnlockBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="ml-2 font-mono text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded
                 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40
                 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 transition-colors">
      {label}
    </button>
  );
}

function ScoreBar({ score, summary, t }: { score: number; summary: string; t: Record<string, string> }) {
  const bar   = score >= MIN_SCORE ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  const color = score >= MIN_SCORE ? 'text-emerald-600 dark:text-emerald-400'
              : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`font-mono text-[14px] font-bold tabular-nums ${color}`}>{score}/100</span>
        {score >= MIN_SCORE && (
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap
                           bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300
                           border border-emerald-200 dark:border-emerald-400/20">
            <IconCheck /> {t.cvEvalApprovedBadge}
          </span>
        )}
      </div>
      {summary && <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 italic">"{summary}"</p>}
      {score < MIN_SCORE && (
        <p className="font-mono text-[9.5px] text-amber-600 dark:text-amber-400">
          {t.cvEvalNeedMore?.replace('{n}', String(MIN_SCORE - score))}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  initialCV: BaseCV;
  onSaved: (cv: BaseCV) => void;
  t: { applications: Record<string, string> };
  lang: string;
}

export function BaseCVForm({ initialCV, onSaved, t, lang }: Props) {
  const ta = t.applications;
  const [cv, setCV]     = useState<BaseCV>(initialCV);
  const prevInit        = useRef(initialCV);

  useEffect(() => {
    if (prevInit.current !== initialCV && initialCV.fullName !== prevInit.current.fullName) {
      prevInit.current = initialCV;
      setCV(initialCV);
    }
  }, [initialCV]);

  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult]   = useState<CvEvalResult | null>(null);
  const [unlocked, setUnlocked]       = useState<Set<keyof BaseCV>>(new Set());

  const hasEval    = evalResult !== null;
  const cvComplete = isCVComplete(cv);
  const score      = evalResult?.score ?? null;
  const canSave    = score !== null && score >= MIN_SCORE;
  const fb         = evalResult?.fieldFeedback ?? {};

  const statusOf  = (key: keyof BaseCV) => fieldStatusOf(FIELD_TO_RUBRIC[key], fb, hasEval);
  const isLocked  = (key: keyof BaseCV) => statusOf(key) === 'ok' && !unlocked.has(key);

  function unlock(...keys: (keyof BaseCV)[]) {
    setUnlocked(prev => { const s = new Set(prev); keys.forEach(k => s.add(k)); return s; });
  }

  function updateField(key: keyof BaseCV, value: string) {
    setCV(p => ({ ...p, [key]: value }));
    setSaved(false);
    // Mark this rubric bucket as dirty so re-eval includes it
    const rk = FIELD_TO_RUBRIC[key];
    if (fb[rk] === '') {
      setEvalResult(prev => prev ? { ...prev, fieldFeedback: { ...prev.fieldFeedback, [rk]: '·' } } : prev);
    }
  }

  function getApprovedFields(): string[] {
    if (!evalResult) return [];
    return Object.entries(fb).filter(([, v]) => v === '').map(([k]) => k);
  }

  async function runEvaluate(cvOverride?: BaseCV) {
    const payload = cvOverride ?? cv;
    if (!payload.fullName || !payload.summary || !payload.experience) return;
    setEvalLoading(true);
    setUnlocked(new Set());
    try {
      const approvedFields = cvOverride ? [] : getApprovedFields();
      const res = await fetch('/api/applications/base-cv/evaluate', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ ...payload, lang, approvedFields }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvalResult(await res.json() as CvEvalResult);
    } catch (e) { console.error('CV evaluation failed', e); }
    finally { setEvalLoading(false); }
  }

  function handleExtracted(extracted: Partial<BaseCV>, fieldFeedback?: Record<string, string>) {
    const merged = { ...EMPTY_CV, ...extracted };
    setCV(merged); setSaved(false); setUnlocked(new Set());
    if (fieldFeedback && Object.keys(fieldFeedback).length > 0) {
      setEvalResult({ score: 0, approved: false, summary: '', fieldFeedback });
    } else if (merged.fullName && merged.summary && merged.experience) {
      runEvaluate(merged);
    }
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch('/api/applications/base-cv', {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ ...cv, cvScore: score }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      localStorage.setItem('ailab_base_cv', JSON.stringify(cv));
      setSaved(true); onSaved(cv);
    } catch (e) { console.error('Save base CV error', e); }
    finally { setSaving(false); }
  }

  function download() {
    const text = [
      cv.fullName, cv.email, cv.phone, cv.location, cv.linkedIn, '',
      'RESUMEN PROFESIONAL', cv.summary, '', 'EXPERIENCIA', cv.experience, '',
      'EDUCACIÓN', cv.education, '', 'HABILIDADES', cv.skills, '',
      'IDIOMAS', cv.languages, '', 'CERTIFICACIONES', cv.certifications,
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = (cv.fullName || 'cv-base').replace(/\s+/g, '-').toLowerCase() + '-cv-base.txt';
    a.click(); URL.revokeObjectURL(a.href);
  }

  // ── Field defs ──────────────────────────────────────────────────────────────
  const contactFields = [
    { key: 'fullName' as keyof BaseCV, label: ta.fieldFullName, hint: ta.hintFullName },
    { key: 'email'    as keyof BaseCV, label: ta.fieldEmail,    hint: ta.hintEmail    },
    { key: 'phone'    as keyof BaseCV, label: ta.fieldPhone,    hint: ta.hintPhone    },
    { key: 'location' as keyof BaseCV, label: ta.fieldLocation, hint: ta.hintLocation },
    { key: 'linkedIn' as keyof BaseCV, label: ta.fieldLinkedIn, hint: ta.hintLinkedIn },
  ];
  const textareaFields = [
    { key: 'summary'        as keyof BaseCV, rows: 5,  label: ta.fieldSummary,        hint: ta.hintSummary,        ph: ta.fieldSummaryPlaceholder        },
    { key: 'experience'     as keyof BaseCV, rows: 10, label: ta.fieldExperience,     hint: ta.hintExperience,     ph: ta.fieldExperiencePlaceholder     },
    { key: 'education'      as keyof BaseCV, rows: 3,  label: ta.fieldEducation,      hint: ta.hintEducation,      ph: ta.fieldEducationPlaceholder      },
    { key: 'skills'         as keyof BaseCV, rows: 3,  label: ta.fieldSkills,         hint: ta.hintSkills,         ph: ta.fieldSkillsPlaceholder         },
    { key: 'languages'      as keyof BaseCV, rows: 2,  label: ta.fieldLanguages,      hint: ta.hintLanguages,      ph: ta.fieldLanguagesPlaceholder      },
    { key: 'certifications' as keyof BaseCV, rows: 2,  label: ta.fieldCertifications, hint: ta.hintCertifications, ph: ta.fieldCertificationsPlaceholder },
  ];

  const approvedCount = getApprovedFields().length;
  const unlockLabel   = ta.fieldUnlock ?? 'Editar';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* PDF import */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">{ta.importFromPDF}</h2>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full
                           bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400
                           border border-sky-200 dark:border-sky-400/20">IA</span>
        </div>
        <PdfCVUploader onExtracted={(cv, fb) => handleExtracted(cv, fb)} t={t} />
        {evalLoading && (
          <p className="mt-3 font-mono text-[10px] text-sky-500 flex items-center gap-1.5">
            <Spinner sm /> {ta.cvEvalRunning}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="card p-6 space-y-8">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-1">{ta.baseCVTitle}</h2>
          <p className="font-mono text-[10px] text-slate-400">{ta.baseCVDesc}</p>
        </div>

        {/* Contact group — share single rubric key 'contact' */}
        <div className="space-y-2">
          {/* Group header when contact is approved */}
          {hasEval && statusOf('fullName') === 'ok' && (
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {ta.fieldGroupContact ?? 'Contacto'} — {ta.fieldGroupOk ?? 'Todo completo'}
              </span>
              <UnlockBtn
                onClick={() => unlock('fullName','email','phone','location')}
                label={unlockLabel}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {contactFields.map(f => {
              const st = statusOf(f.key);
              const lk = isLocked(f.key);
              return (
                <div key={f.key}>
                  <label className="flex items-center font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                    {f.label}<Dot status={st} />
                    {lk && f.key !== 'fullName' && f.key !== 'email' && (
                      <UnlockBtn onClick={() => unlock(f.key)} label={unlockLabel} />
                    )}
                  </label>
                  <input
                    value={cv[f.key]}
                    onChange={e => updateField(f.key, e.target.value)}
                    disabled={lk}
                    className={`input-field transition-all ${STATUS_RING[st]} ${lk ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40' : ''}`}
                  />
                  <Hint status={st} aiHint={fb[FIELD_TO_RUBRIC[f.key]]} staticHint={f.hint} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Textarea fields */}
        {textareaFields.map(f => {
          const st = statusOf(f.key);
          const lk = isLocked(f.key);
          return (
            <div key={f.key}>
              <label className="flex items-center font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                {f.label}<Dot status={st} />
                {lk && <UnlockBtn onClick={() => unlock(f.key)} label={unlockLabel} />}
              </label>
              <textarea
                value={cv[f.key]}
                onChange={e => updateField(f.key, e.target.value)}
                disabled={lk}
                rows={lk ? Math.min(f.rows, 3) : f.rows}
                placeholder={lk ? '' : f.ph}
                className={`input-field resize-y font-mono text-[11px] leading-relaxed transition-all
                            ${STATUS_RING[st]} ${lk ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40' : ''}`}
              />
              <Hint status={st} aiHint={fb[FIELD_TO_RUBRIC[f.key]]} staticHint={f.hint} />
            </div>
          );
        })}

        {/* Evaluation panel */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4
                        bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{ta.cvEvalTitle}</p>
              <p className="font-mono text-[9.5px] text-slate-400 mt-0.5">{ta.cvEvalDesc}</p>
            </div>
            <button type="button" onClick={() => runEvaluate()} disabled={evalLoading || !cvComplete}
              className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 shrink-0
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {evalLoading ? <><Spinner sm /> {ta.cvEvalRunning}</> : <><IconSpark /> {ta.cvEvalBtn}</>}
            </button>
          </div>

          {score !== null && score > 0 && (
            <ScoreBar score={score} summary={evalResult?.summary ?? ''} t={ta} />
          )}

          {!hasEval && !evalLoading && (
            <p className="font-mono text-[9.5px] text-slate-400">{ta.cvEvalBeforeSave}</p>
          )}

          {/* Legend */}
          {hasEval && (
            <div className="flex items-center gap-4 pt-1 flex-wrap">
              {([
                ['bg-emerald-500', ta.legendOk    ?? 'Completo'],
                ['bg-amber-400',   ta.legendWarn  ?? 'Mejorar' ],
                ['bg-rose-500',    ta.legendError ?? 'Falta'   ],
              ] as [string, string][]).map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${c}`} /> {l}
                </span>
              ))}
              {approvedCount > 0 && (
                <span className="ml-auto font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                  {approvedCount}/8 {ta.legendFieldsOk ?? 'aprobados'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button type="button" onClick={save} disabled={saving || !canSave}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2
                       disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? <><Spinner sm /> {ta.savingBaseCV}</> : <><IconSave /> {ta.saveBaseCV}</>}
          </button>
          {saved && (
            <button type="button" onClick={download} className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2">
              <IconDownload /> {ta.downloadBaseCV}
            </button>
          )}
          {!canSave && !saving && (
            <span className="font-mono text-[10px] text-slate-400">{ta.cvEvalBeforeSave}</span>
          )}
          {saved && (
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {ta.baseCVComplete}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
