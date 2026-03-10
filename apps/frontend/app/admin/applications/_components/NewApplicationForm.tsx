'use client';
import { useState } from 'react';
import { getHeaders } from './types';
import { AtsRing, IconDownload, IconSave, IconSpark, IconCheck, Spinner } from './icons';

interface Props {
  cvComplete: boolean;
  onSaved: () => void;
  onGoToBaseCV: () => void;
  t: { applications: Record<string, string> };
  lang: string;
}

// ── Language flag icons (SVG, no emojis) ────────────────────────────────────
const IconFlagES = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
    <rect width="16" height="12" rx="1.5" fill="#AA151B"/>
    <rect y="2.5" width="16" height="7" fill="#F1BF00"/>
    <rect y="2.5" width="16" height="1.2" fill="#AA151B"/>
    <rect y="8.3" width="16" height="1.2" fill="#AA151B"/>
  </svg>
);
const IconFlagEN = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
    <rect width="16" height="12" rx="1.5" fill="#012169"/>
    {/* Union Jack simplified */}
    <line x1="0" y1="0" x2="16" y2="12" stroke="white" strokeWidth="2.5"/>
    <line x1="16" y1="0" x2="0" y2="12" stroke="white" strokeWidth="2.5"/>
    <line x1="8" y1="0" x2="8" y2="12" stroke="white" strokeWidth="3.5"/>
    <line x1="0" y1="6" x2="16" y2="6" stroke="white" strokeWidth="3.5"/>
    <line x1="0" y1="0" x2="16" y2="12" stroke="#C8102E" strokeWidth="1.5"/>
    <line x1="16" y1="0" x2="0" y2="12" stroke="#C8102E" strokeWidth="1.5"/>
    <line x1="8" y1="0" x2="8" y2="12" stroke="#C8102E" strokeWidth="2"/>
    <line x1="0" y1="6" x2="16" y2="6" stroke="#C8102E" strokeWidth="2"/>
  </svg>
);

// ── Edit badge ────────────────────────────────────────────────────────────────
const IconEdit = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ── ATS-clean PDF generator ───────────────────────────────────────────────────
// Single-column plain text, Arial font, 0.75in margins — passes Taleo/Workday/Greenhouse
function printATS(cvText: string, lng: 'es' | 'en', position: string, company: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  const title = `CV_${lng.toUpperCase()}_${position.replace(/\s+/g,'_')}_${company.replace(/\s+/g,'_')}`;
  win.document.write(`<!DOCTYPE html>
<html lang="${lng}"><head><meta charset="UTF-8"/><title>${title}</title>
<style>
@page{margin:0.75in;size:Letter}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45;color:#000;background:#fff}
pre{font-family:Arial,Helvetica,sans-serif;font-size:11pt;white-space:pre-wrap;word-wrap:break-word;line-height:1.45;color:#000}
@media print{body{margin:0}}
</style></head><body>
<pre>${cvText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
</body></html>`);
  win.document.close();
  win.addEventListener('load', () => { win.focus(); win.print(); win.close(); });
}

export function NewApplicationForm({ cvComplete, onSaved, onGoToBaseCV, t }: Props) {
  const ta = t.applications;

  const [form, setForm]       = useState({ company: '', position: '', jobOffer: '' });
  const [generating, setGen]  = useState(false);
  const [genError, setErr]    = useState('');
  const [atsScore, setScore]  = useState<number | null>(null);

  // Editable CV text — user may modify after generation
  const [cvEs, setCvEs]       = useState('');
  const [cvEn, setCvEn]       = useState('');
  const [editedEs, setEditedEs] = useState(false); // dirty flag
  const [editedEn, setEditedEn] = useState(false);

  const [activeTab, setTab]   = useState<'es' | 'en'>('es');
  const [saving, setSaving]   = useState(false);

  const hasResult = atsScore !== null;
  const isEdited  = editedEs || editedEn;

  async function generate() {
    if (!form.company || !form.position || !form.jobOffer) {
      setErr(ta.toastFormIncomplete); return;
    }
    setGen(true); setCvEs(''); setCvEn(''); setScore(null);
    setEditedEs(false); setEditedEn(false); setErr('');
    try {
      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string }).message ?? `HTTP ${res.status}`);
      const data = await res.json() as { atsScore: number; cvEs?: string; cvEn?: string; cvText?: string };
      setScore(data.atsScore ?? 0);
      setCvEs(data.cvEs ?? data.cvText ?? '');
      setCvEn(data.cvEn ?? data.cvText ?? '');
    } catch (e) { setErr(e instanceof Error ? e.message : ta.toastGenerateError); }
    finally { setGen(false); }
  }

  async function save() {
    if (!cvEs && !cvEn) return;
    setSaving(true);
    try {
      await fetch('/api/applications', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          ...form,
          atsScore: atsScore ?? 0,
          cvGenerated: true,
          generatedCvText: cvEs || cvEn,
          generatedCvTextEs: cvEs,
          generatedCvTextEn: cvEn,
        }),
      });
      setForm({ company: '', position: '', jobOffer: '' });
      setCvEs(''); setCvEn(''); setScore(null);
      setEditedEs(false); setEditedEn(false);
      onSaved();
    } catch { setErr(ta.toastAppSaveError); }
    finally { setSaving(false); }
  }

  // ── Gate: CV base not ready ──────────────────────────────────────────────
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

      {/* ── Input form ─────────────────────────────────────────────────────── */}
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

          {genError && <p className="font-mono text-[10px] text-rose-500">{genError}</p>}

          <button onClick={generate} disabled={generating}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
            {generating ? <><Spinner sm />{ta.generatingCV}</> : <><IconSpark />{ta.generateATSBtn}</>}
          </button>

          {generating && (
            <div className="space-y-1.5 pt-1">
              {[
                ta.generatingStep1 ?? '1. Extrayendo palabras clave de la oferta...',
                ta.generatingStep2 ?? '2. Adaptando CV base al puesto sin inventar datos...',
                ta.generatingStep3 ?? '3. Generando versión en español e inglés...',
              ].map((step, i) => (
                <p key={i} className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <Spinner sm />{step}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Result: dual editable CVs ────────────────────────────────────── */}
      {hasResult && (
        <div className="space-y-4">

          {/* Score header */}
          <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <AtsRing score={atsScore!} large />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{ta.atsScoreLabel}</p>
                <p className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {form.position} @ {form.company}
                </p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                  {atsScore! >= 90 ? ta.atsExcellent : atsScore! >= 70 ? ta.atsGood : ta.atsLow}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isEdited && (
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider
                                 text-emerald-600 dark:text-emerald-400 border border-emerald-300
                                 dark:border-emerald-500/40 rounded px-2 py-1">
                  <IconCheck />{ta.cvHumanEdited ?? 'Revisado por ti'}
                </span>
              )}
              <button
                onClick={() => { setCvEs(''); setCvEn(''); setScore(null); setEditedEs(false); setEditedEn(false); }}
                className="btn-ghost text-[10px] py-2 px-4">
                {ta.editBack ?? 'Volver a editar oferta'}
              </button>
            </div>
          </div>

          {/* Dual CV editor */}
          <div className="card p-0 overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {(['es', 'en'] as const).map(lng => {
                const edited = lng === 'es' ? editedEs : editedEn;
                return (
                  <button key={lng} onClick={() => setTab(lng)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3
                                font-mono text-[10px] uppercase tracking-widest transition-colors -mb-px border-b-2
                                ${activeTab === lng
                                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-slate-50 dark:bg-slate-900/50'
                                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                    {lng === 'es' ? <IconFlagES /> : <IconFlagEN />}
                    {lng === 'es' ? 'Español' : 'English'}
                    {edited && (
                      <span className="flex items-center gap-0.5 text-emerald-500">
                        <IconEdit />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Editable CV textarea */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9.5px] text-slate-400">
                  {ta.cvEditHint ?? 'Podés editar el CV directamente. El PDF y el guardado usarán esta versión.'}
                </p>
                {(activeTab === 'es' ? editedEs : editedEn) && (
                  <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                    <IconEdit />{ta.cvEdited ?? 'Editado'}
                  </span>
                )}
              </div>

              {activeTab === 'es' ? (
                <textarea
                  value={cvEs}
                  onChange={e => { setCvEs(e.target.value); setEditedEs(true); }}
                  rows={28}
                  spellCheck={false}
                  className="w-full font-mono text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed
                             bg-slate-50 dark:bg-slate-900 rounded-lg p-4
                             border border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400
                             resize-y transition-all"
                />
              ) : (
                <textarea
                  value={cvEn}
                  onChange={e => { setCvEn(e.target.value); setEditedEn(true); }}
                  rows={28}
                  spellCheck={false}
                  className="w-full font-mono text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed
                             bg-slate-50 dark:bg-slate-900 rounded-lg p-4
                             border border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400
                             resize-y transition-all"
                />
              )}

              {/* PDF export — uses the edited content */}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <button
                  onClick={() => printATS(cvEs, 'es', form.position, form.company)}
                  disabled={!cvEs}
                  className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 disabled:opacity-40">
                  <IconDownload />
                  <IconFlagES />
                  {ta.pdfExportEs ?? 'PDF Español (ATS)'}
                </button>
                <button
                  onClick={() => printATS(cvEn, 'en', form.position, form.company)}
                  disabled={!cvEn}
                  className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 disabled:opacity-40">
                  <IconDownload />
                  <IconFlagEN />
                  {ta.pdfExportEn ?? 'PDF English (ATS)'}
                </button>
                <span className="ml-auto font-mono text-[9px] text-slate-400">
                  {ta.atsCompliantNote ?? 'Sin tablas, columnas ni gráficos — ATS-friendly'}
                </span>
              </div>
            </div>
          </div>

          {/* Save action */}
          {genError && <p className="font-mono text-[10px] text-rose-500">{genError}</p>}
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={save} disabled={saving}
              className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
              {saving ? <><Spinner sm />{ta.savingBaseCV}</> : <><IconSave />{ta.saveApplication}</>}
            </button>
            <p className="font-mono text-[9.5px] text-slate-400">
              {isEdited
                ? (ta.saveAppHintEdited ?? 'Se guardará tu versión editada.')
                : (ta.saveAppHint ?? 'Guarda la postulación con ambas versiones del CV.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
