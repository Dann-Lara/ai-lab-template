'use client';
import { useState, useEffect, useRef } from 'react';
import { BaseCV, CvEvalResult, EMPTY_CV, getHeaders, isCVComplete } from './types';
import { PdfCVUploader } from './PdfCVUploader';
import { IconCheck, IconDownload, IconInfo, IconSave, IconSpark, IconWarning, Spinner } from './icons';

const MIN_SCORE = 85;

// ─── Hint row ─────────────────────────────────────────────────────────────────
function FieldHint({ aiHint, staticHint }: { aiHint?: string; staticHint: string }) {
  if (aiHint) {
    return (
      <p className="flex items-start gap-1.5 font-mono text-[9.5px] text-amber-600 dark:text-amber-400 leading-relaxed mt-1">
        <span className="shrink-0 mt-0.5 text-amber-500"><IconWarning /></span>
        {aiHint}
      </p>
    );
  }
  return (
    <p className="flex items-start gap-1.5 font-mono text-[9.5px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1">
      <span className="shrink-0 mt-0.5"><IconInfo /></span>
      {staticHint}
    </p>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score, summary, t }: { score: number; summary: string; t: Record<string, string> }) {
  const color = score >= MIN_SCORE ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  const textColor = score >= MIN_SCORE
    ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 60 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`font-mono text-[13px] font-bold tabular-nums ${textColor}`}>{score}/100</span>
        {score >= MIN_SCORE && (
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1
                           bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300
                           border border-emerald-200 dark:border-emerald-400/20">
            <IconCheck /> {t.cvEvalApprovedBadge}
          </span>
        )}
      </div>
      {summary && (
        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 italic">"{summary}"</p>
      )}
      {score < MIN_SCORE && (
        <p className="font-mono text-[9.5px] text-amber-600 dark:text-amber-400">
          {t.cvEvalNeedMore?.replace('{n}', String(MIN_SCORE - score))}
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  initialCV: BaseCV;
  onSaved: (cv: BaseCV) => void;
  t: { applications: Record<string, string> };
  lang: string;
}

export function BaseCVForm({ initialCV, onSaved, t, lang }: Props) {
  const ta = t.applications;

  // Sync with parent when initialCV changes (e.g. after loadBaseCV resolves)
  const [cv, setCV]           = useState<BaseCV>(initialCV);
  const prevInitial            = useRef(initialCV);
  useEffect(() => {
    if (prevInitial.current !== initialCV && initialCV.fullName !== prevInitial.current.fullName) {
      prevInitial.current = initialCV;
      setCV(initialCV);
    }
  }, [initialCV]);

  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult]   = useState<CvEvalResult | null>(null);
  // Track if hints came from PDF extraction (combined) vs manual evaluate
  const [hintsFromPdf, setHintsFromPdf] = useState(false);

  const cvComplete = isCVComplete(cv);
  const score      = evalResult?.score ?? null;
  const canSave    = score !== null && score >= MIN_SCORE;
  const fb         = evalResult?.fieldFeedback ?? {};

  function getHint(key: string): string | undefined {
    // contact is a combined key covering phone/location/linkedIn/fullName/email
    if (['phone', 'location', 'linkedIn', 'fullName', 'email'].includes(key)) return fb['contact'] || fb[key];
    return fb[key];
  }

  function updateField(key: keyof BaseCV, value: string) {
    setCV(p => ({ ...p, [key]: value }));
    // Editing invalidates score — keep hints from PDF visible until re-eval
    if (!hintsFromPdf) setEvalResult(null);
    else setEvalResult(prev => prev ? { ...prev, score: 0, approved: false } : null);
    setSaved(false);
  }

  // Called by evaluate button (manual) — fires with current cv state
  async function runEvaluate(cvOverride?: BaseCV) {
    const payload = cvOverride ?? cv;
    if (!payload.fullName || !payload.summary || !payload.experience) return;
    setEvalLoading(true);
    setHintsFromPdf(false);
    try {
      const res = await fetch('/api/applications/base-cv/evaluate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...payload, lang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as CvEvalResult;
      setEvalResult(data);
    } catch (e) {
      console.error('CV evaluation failed', e);
    } finally {
      setEvalLoading(false);
    }
  }

  // Called by PdfCVUploader after extraction (combined extract+eval)
  function handleExtracted(extracted: Partial<BaseCV>, fieldFeedback?: Record<string, string>) {
    const merged = { ...EMPTY_CV, ...extracted };
    setCV(merged);
    setSaved(false);
    setHintsFromPdf(true);

    if (fieldFeedback && Object.keys(fieldFeedback).length > 0) {
      // Backend returned combined hints — show them immediately, no extra AI call
      // Score is unknown at this point; set null so the user knows to evaluate
      setEvalResult({ score: 0, approved: false, summary: '', fieldFeedback });
    } else if (merged.fullName && merged.summary && merged.experience) {
      // No combined hints returned — trigger a standalone evaluate
      runEvaluate(merged);
    }
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch('/api/applications/base-cv', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...cv, cvScore: score }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      localStorage.setItem('ailab_base_cv', JSON.stringify(cv));
      setSaved(true);
      onSaved(cv);
    } catch (e) {
      console.error('Save base CV error', e);
    } finally {
      setSaving(false);
    }
  }

  function download() {
    const text = [
      cv.fullName, cv.email, cv.phone, cv.location, cv.linkedIn, '',
      'RESUMEN PROFESIONAL', cv.summary, '',
      'EXPERIENCIA', cv.experience, '',
      'EDUCACIÓN', cv.education, '',
      'HABILIDADES', cv.skills, '',
      'IDIOMAS', cv.languages, '',
      'CERTIFICACIONES', cv.certifications,
    ].join('\n');
    const a  = document.createElement('a');
    a.href   = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = (cv.fullName || 'cv-base').replace(/\s+/g, '-').toLowerCase() + '-cv-base.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Field definitions ─────────────────────────────────────────────────────
  const contactFields = [
    { key: 'fullName' as keyof BaseCV, label: ta.fieldFullName,  hint: ta.hintFullName  },
    { key: 'email'    as keyof BaseCV, label: ta.fieldEmail,     hint: ta.hintEmail     },
    { key: 'phone'    as keyof BaseCV, label: ta.fieldPhone,     hint: ta.hintPhone     },
    { key: 'location' as keyof BaseCV, label: ta.fieldLocation,  hint: ta.hintLocation  },
    { key: 'linkedIn' as keyof BaseCV, label: ta.fieldLinkedIn,  hint: ta.hintLinkedIn  },
  ];

  const textareaFields = [
    { key: 'summary'        as keyof BaseCV, label: ta.fieldSummary,        rows: 5,  hint: ta.hintSummary,        ph: ta.fieldSummaryPlaceholder        },
    { key: 'experience'     as keyof BaseCV, label: ta.fieldExperience,     rows: 10, hint: ta.hintExperience,     ph: ta.fieldExperiencePlaceholder     },
    { key: 'education'      as keyof BaseCV, label: ta.fieldEducation,      rows: 3,  hint: ta.hintEducation,      ph: ta.fieldEducationPlaceholder      },
    { key: 'skills'         as keyof BaseCV, label: ta.fieldSkills,         rows: 3,  hint: ta.hintSkills,         ph: ta.fieldSkillsPlaceholder         },
    { key: 'languages'      as keyof BaseCV, label: ta.fieldLanguages,      rows: 2,  hint: ta.hintLanguages,      ph: ta.fieldLanguagesPlaceholder      },
    { key: 'certifications' as keyof BaseCV, label: ta.fieldCertifications, rows: 2,  hint: ta.hintCertifications, ph: ta.fieldCertificationsPlaceholder },
  ];

  return (
    <div className="space-y-6">

      {/* ── PDF import ──────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
            {ta.importFromPDF}
          </h2>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full
                           bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400
                           border border-sky-200 dark:border-sky-400/20">IA</span>
        </div>
        <PdfCVUploader
          onExtracted={(cv, fb) => handleExtracted(cv, fb)}
          t={t}
        />
        {evalLoading && (
          <p className="mt-3 font-mono text-[10px] text-sky-500 flex items-center gap-1.5">
            <Spinner sm /> {ta.cvEvalRunning}
          </p>
        )}
        {hintsFromPdf && !evalLoading && (
          <p className="mt-3 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
            <IconInfo /> {ta.pdfExtractSuccess}
          </p>
        )}
      </div>

      {/* ── Manual form ─────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-8">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-1">
            {ta.baseCVTitle}
          </h2>
          <p className="font-mono text-[10px] text-slate-400">{ta.baseCVDesc}</p>
        </div>

        {/* Contact grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {contactFields.map(f => (
            <div key={f.key}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                {f.label}
              </label>
              <input
                value={cv[f.key]}
                onChange={e => updateField(f.key, e.target.value)}
                className="input-field"
              />
              <FieldHint aiHint={getHint(f.key)} staticHint={f.hint} />
            </div>
          ))}
        </div>

        {/* Textarea fields */}
        {textareaFields.map(f => (
          <div key={f.key}>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
              {f.label}
            </label>
            <textarea
              value={cv[f.key]}
              onChange={e => updateField(f.key, e.target.value)}
              rows={f.rows}
              placeholder={f.ph}
              className="input-field resize-y font-mono text-[11px] leading-relaxed"
            />
            <FieldHint aiHint={fb[f.key]} staticHint={f.hint} />
          </div>
        ))}

        {/* ── Evaluation panel ──────────────────────────────────────────────── */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4
                        bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                {ta.cvEvalTitle}
              </p>
              <p className="font-mono text-[9.5px] text-slate-400 mt-0.5">
                {ta.cvEvalDesc}
              </p>
            </div>
            {/* FIX: arrow function prevents SyntheticEvent being passed as cvOverride */}
            <button
              type="button"
              onClick={() => runEvaluate()}
              disabled={evalLoading || !cvComplete}
              className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 shrink-0
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {evalLoading
                ? <><Spinner sm /> {ta.cvEvalRunning}</>
                : <><IconSpark /> {ta.cvEvalBtn}</>}
            </button>
          </div>

          {/* Show score bar only when we have a real score from a full evaluation */}
          {evalResult && evalResult.score > 0 && (
            <ScoreBar score={evalResult.score} summary={evalResult.summary} t={ta} />
          )}

          {/* If hints came from PDF but no score yet, prompt to evaluate */}
          {hintsFromPdf && (!evalResult || evalResult.score === 0) && !evalLoading && (
            <p className="font-mono text-[9.5px] text-slate-400">
              {ta.cvEvalBeforeSave}
            </p>
          )}

          {/* No eval at all yet and no PDF hints */}
          {!hintsFromPdf && !evalResult && !evalLoading && (
            <p className="font-mono text-[9.5px] text-slate-400">{ta.cvEvalBeforeSave}</p>
          )}
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={save}
            disabled={saving || !canSave}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2
                       disabled:opacity-40 disabled:cursor-not-allowed">
            {saving
              ? <><Spinner sm /> {ta.savingBaseCV}</>
              : <><IconSave /> {ta.saveBaseCV}</>}
          </button>

          {saved && (
            <button type="button" onClick={download}
              className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2">
              <IconDownload /> {ta.downloadBaseCV}
            </button>
          )}

          {!canSave && (
            <span className="font-mono text-[10px] text-slate-400">
              {ta.cvEvalBeforeSave}
            </span>
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
