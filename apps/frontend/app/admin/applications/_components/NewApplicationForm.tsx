'use client';
import { useState } from 'react';
import { getHeaders } from './types';
import { AtsRing, IconDownload, IconSave, IconSpark, IconCheck, Spinner } from './icons';

const IconEdit = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// ── ATS-clean PDF ─────────────────────────────────────────────────────────────
// @page margin:0 + body padding = no browser headers/footers (URL, title, date, pages)
// Section blocks use page-break-inside:avoid so headers don't orphan at page bottom
function printATS(cvText: string, lang: 'es' | 'en', position: string, company: string) {
  const win = window.open('', '_blank');
  if (!win) return;

  // Convert plain-text CV to section-aware HTML for proper page breaks
  // Each ALL-CAPS section header (CONTACT, SUMMARY, EXPERIENCE, etc.) starts a new <section>
  const sectionPattern = /^(CONTACT(?:O)?|SUMMARY|RESUMEN|EXPERIENCE|EXPERIENCIA|EDUCATION|EDUCACI[OÓ]N|SKILLS|HABILIDADES|LANGUAGES|IDIOMAS|CERTIFICATIONS|CERTIFICACIONES)$/m;

  const lines = cvText.split('\n');
  let html = '';
  let inSection = false;
  let sectionBuf = '';

  const flushSection = () => {
    if (sectionBuf.trim()) {
      html += `<div class="section"><pre>${sectionBuf.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`;
    }
    sectionBuf = '';
  };

  for (const line of lines) {
    if (sectionPattern.test(line.trim())) {
      flushSection();
      inSection = true;
      sectionBuf = line + '\n';
    } else if (!inSection) {
      // Contact/header block before first section marker
      sectionBuf += line + '\n';
    } else {
      sectionBuf += line + '\n';
    }
  }
  flushSection();

  win.document.write(`<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"/><title></title>
<style>
@page { margin: 0; size: Letter; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #000;
  background: #fff;
  padding: 0.75in;
}
pre {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
  color: #000;
}
.section {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: 0.15in;
}
</style></head><body>${html}</body></html>`);
  win.document.close();
  win.addEventListener('load', () => { win.focus(); win.print(); win.close(); });
}

const APPLIED_FROM_OPTIONS = [
  'LinkedIn','Indeed','Glassdoor','InfoJobs','OCC Mundial','Computrabajo','Sitio web de la empresa','Referido','Otro',
];

interface Props {
  cvComplete: boolean;
  onSaved: () => void;
  onGoToBaseCV: () => void;
  t: { applications: Record<string, string> };
  lang: string;
}

export function NewApplicationForm({ cvComplete, onSaved, onGoToBaseCV, t }: Props) {
  const ta = t.applications;

  const [form, setForm]     = useState({ company: '', position: '', jobOffer: '', appliedFrom: '' });
  const [generating, setGen] = useState(false);
  const [genError, setErr]   = useState('');
  const [atsScore, setScore] = useState<number | null>(null);

  // EN is generated first; ES is generated on demand after save
  const [cvEn, setCvEn]             = useState('');
  const [cvEs, setCvEs]             = useState('');
  const [editedEn, setEditedEn]     = useState(false);
  const [editedEs, setEditedEs]     = useState(false);
  const [activeTab, setTab]         = useState<'en' | 'es'>('en');

  // Track saved application ID so we can call translate-cv
  const [savedAppId, setSavedAppId] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  const hasResult = atsScore !== null;
  const isEdited  = editedEn || editedEs;

  async function generate() {
    if (!form.company || !form.position || !form.jobOffer) {
      setErr(ta.toastFormIncomplete); return;
    }
    setGen(true); setCvEn(''); setCvEs(''); setScore(null);
    setEditedEn(false); setEditedEs(false); setErr('');
    setSavedAppId(null);
    try {
      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ company: form.company, position: form.position, jobOffer: form.jobOffer }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string }).message ?? `HTTP ${res.status}`);
      const data = await res.json() as { atsScore: number; cvEs?: string; cvEn?: string; cvText?: string };
      setScore(data.atsScore ?? 0);
      setCvEn(data.cvEn ?? data.cvText ?? '');
      setCvEs(data.cvEs ?? ''); // empty unless backend returned it
      setTab('en');
    } catch (e) { setErr(e instanceof Error ? e.message : ta.toastGenerateError); }
    finally { setGen(false); }
  }

  async function save() {
    if (!cvEn) return;
    setSaving(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          ...form,
          atsScore: atsScore ?? 0,
          cvGenerated: true,
          generatedCvText: cvEn,
          generatedCvTextEn: cvEn,
          generatedCvTextEs: cvEs || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json() as { id: string };
      setSavedAppId(saved.id ?? null);
    } catch { setErr(ta.toastAppSaveError); }
    finally { setSaving(false); }
  }

  async function translateToSpanish() {
    if (!savedAppId) return;
    setTranslating(true); setTranslateError('');
    try {
      const res = await fetch(`/api/applications/${savedAppId}/translate-cv`, {
        method: 'POST', headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { cvEs: string };
      setCvEs(data.cvEs);
      setTab('es');
    } catch (e) {
      setTranslateError(e instanceof Error ? e.message : 'Error adaptando al español');
    } finally { setTranslating(false); }
  }

  function finish() {
    setForm({ company: '', position: '', jobOffer: '', appliedFrom: '' });
    setCvEn(''); setCvEs(''); setScore(null);
    setEditedEn(false); setEditedEs(false); setSavedAppId(null);
    onSaved();
  }

  // ── Gate ─────────────────────────────────────────────────────────────────
  if (!cvComplete) {
    return (
      <div className="card p-12 text-center space-y-4">
        <p className="font-mono text-[13px] font-semibold text-slate-700 dark:text-slate-300">{ta.cvRequiredTitle}</p>
        <p className="font-mono text-[11px] text-slate-400">{ta.cvRequiredDesc}</p>
        <button onClick={onGoToBaseCV} className="btn-primary text-[11px] py-2.5 px-6 mx-auto">{ta.goToBaseCV}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Input form ──────────────────────────────────────────────────── */}
      {!hasResult && (
        <div className="card p-6 space-y-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">{ta.newAppFormTitle}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(['company', 'position'] as const).map(key => (
              <div key={key}>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                  {ta['field' + key.charAt(0).toUpperCase() + key.slice(1)]}
                  <span className="text-rose-400 ml-1">{ta.fieldRequired}</span>
                </label>
                <input
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ta['field' + key.charAt(0).toUpperCase() + key.slice(1) + 'Placeholder']}
                  className="input-field"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
              {ta.fieldJobOffer} <span className="text-rose-400">{ta.fieldRequired}</span>
            </label>
            <textarea
              value={form.jobOffer}
              onChange={e => setForm(p => ({ ...p, jobOffer: e.target.value }))}
              rows={8}
              placeholder={ta.fieldJobOfferPlaceholder}
              className="input-field resize-y font-mono text-[11px]"
            />
            <p className="font-mono text-[9.5px] text-slate-400 mt-1">
              {ta.jobOfferHint ?? 'Pega la descripción completa — requisitos, responsabilidades y tech stack.'}
            </p>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
              {ta.appliedFromLabel ?? 'Origen de la postulación'}
            </label>
            <select value={form.appliedFrom} onChange={e => setForm(p => ({ ...p, appliedFrom: e.target.value }))}
              className="input-field font-mono text-[11px]">
              <option value="">{ta.appliedFromPlaceholder ?? 'Seleccioná de dónde aplicás...'}</option>
              {APPLIED_FROM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {genError && <p className="font-mono text-[10px] text-rose-500">{genError}</p>}

          <button onClick={generate} disabled={generating}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
            {generating ? <><Spinner sm />{ta.generatingCV}</> : <><IconSpark />{ta.generateATSBtn}</>}
          </button>

          {generating && (
            <div className="space-y-1.5 pt-1">
              {[
                ta.generatingStep1 ?? '1. Extrayendo palabras clave de la oferta...',
                ta.generatingStep2 ?? '2. Adaptando CV base al puesto...',
                ta.generatingStep3 ?? '3. Generando CV ATS en inglés...',
              ].map((step, i) => (
                <p key={i} className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <Spinner sm />{step}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Result ──────────────────────────────────────────────────────── */}
      {hasResult && (
        <div className="space-y-4">

          {/* Score + back */}
          <div className="flex items-center gap-4 flex-wrap">
            <AtsRing score={atsScore!} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{ta.atsScoreLabel}</p>
              <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                {atsScore! >= 85 ? ta.atsExcellent : atsScore! >= 70 ? ta.atsGood : ta.atsLow}
              </p>
            </div>
            <button onClick={() => { setScore(null); setCvEn(''); setCvEs(''); setSavedAppId(null); }}
              className="ml-auto btn-ghost text-[10px] py-1.5 px-3">
              {ta.editBack ?? '← Editar'}
            </button>
          </div>

          {/* Tabs — EN only at first, ES appears after translation */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button onClick={() => setTab('en')}
                className={`px-5 py-2 font-mono text-[10px] uppercase tracking-widest -mb-px border-b-2 transition-colors
                  ${activeTab === 'en'
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                English {editedEn && <IconEdit />}
              </button>
              {cvEs && (
                <button onClick={() => setTab('es')}
                  className={`px-5 py-2 font-mono text-[10px] uppercase tracking-widest -mb-px border-b-2 transition-colors
                    ${activeTab === 'es'
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  Español {editedEs && <IconEdit />}
                </button>
              )}
            </div>

            <div className="p-4">
              {activeTab === 'en' && (
                <textarea
                  value={cvEn}
                  onChange={e => { setCvEn(e.target.value); setEditedEn(true); }}
                  rows={28}
                  className="w-full font-mono text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed
                             bg-slate-50 dark:bg-slate-900 rounded-lg p-3
                             border border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400
                             resize-y transition-all"
                />
              )}
              {activeTab === 'es' && cvEs && (
                <textarea
                  value={cvEs}
                  onChange={e => { setCvEs(e.target.value); setEditedEs(true); }}
                  rows={28}
                  className="w-full font-mono text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed
                             bg-slate-50 dark:bg-slate-900 rounded-lg p-3
                             border border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400
                             resize-y transition-all"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap px-4 pb-4">
              <button onClick={() => printATS(cvEn, 'en', form.position, form.company)}
                disabled={!cvEn}
                className="btn-ghost text-[9.5px] py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40">
                <IconDownload /> {ta.pdfExportEn ?? 'PDF English'}
              </button>
              {cvEs && (
                <button onClick={() => printATS(cvEs, 'es', form.position, form.company)}
                  disabled={!cvEs}
                  className="btn-ghost text-[9.5px] py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40">
                  <IconDownload /> {ta.pdfExportEs ?? 'PDF Español'}
                </button>
              )}
              <p className="font-mono text-[9px] text-slate-400">
                {ta.atsCompliantNote ?? 'ATS-friendly · sin tablas ni columnas'}
              </p>
            </div>
          </div>

          {/* Human-edited badge */}
          {isEdited && (
            <div className="flex items-center gap-2 px-1">
              <IconEdit />
              <span className="font-mono text-[9.5px] text-amber-600 dark:text-amber-400">
                {ta.cvHumanEdited ?? 'Revisado por vos — se guardará tu versión'}
              </span>
            </div>
          )}

          {genError && <p className="font-mono text-[10px] text-rose-500">{genError}</p>}

          {/* Save + translate flow */}
          <div className="flex flex-wrap items-start gap-3">

            {/* Step 1: Save (EN required) */}
            {!savedAppId ? (
              <div className="flex flex-col gap-1">
                <button onClick={save} disabled={saving || !cvEn}
                  className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2 disabled:opacity-40">
                  {saving ? <><Spinner sm />{ta.savingBaseCV ?? 'Guardando...'}</> : <><IconSave />{ta.saveApplication}</>}
                </button>
                <p className="font-mono text-[9px] text-slate-400 pl-1">
                  {isEdited
                    ? (ta.saveAppHintEdited ?? 'Se guardará tu versión editada.')
                    : (ta.saveAppHint ?? 'Guardará el CV en inglés.')}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-400/5 border border-emerald-200 dark:border-emerald-400/20">
                <IconCheck />
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                  {ta.toastAppSaved ?? 'Postulación guardada'}
                </span>
              </div>
            )}

            {/* Step 2: Translate to Spanish (only available after save) */}
            {!cvEs && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={translateToSpanish}
                  disabled={translating || !savedAppId}
                  title={!savedAppId ? (ta.saveFirstHint ?? 'Guardá primero para habilitar esta opción') : undefined}
                  className={`text-[11px] py-2.5 px-5 flex items-center gap-2 rounded-lg border font-mono transition-all
                    ${savedAppId
                      ? 'border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-400/10'
                      : 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}>
                  {translating
                    ? <><Spinner sm />{ta.generatingES ?? 'Adaptando al español...'}</>
                    : <><IconGlobe />{ta.generateSpanishBtn ?? 'Adaptar al español'}</>}
                </button>
                <p className="font-mono text-[9px] text-slate-400 pl-1">
                  {savedAppId
                    ? (ta.generateSpanishHint ?? 'Adapta el CV en inglés al español (gratis)')
                    : (ta.saveFirstHint ?? 'Guardá primero para habilitar')}
                </p>
              </div>
            )}

            {/* Done button (available after save) */}
            {savedAppId && (
              <button onClick={finish}
                className="ml-auto btn-ghost text-[10px] py-2 px-4 flex items-center gap-1.5">
                {ta.doneBtn ?? 'Listo — ver postulaciones →'}
              </button>
            )}
          </div>

          {translateError && <p className="font-mono text-[10px] text-rose-500">{translateError}</p>}
        </div>
      )}
    </div>
  );
}
