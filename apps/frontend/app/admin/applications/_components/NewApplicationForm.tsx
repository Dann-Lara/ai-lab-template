'use client';
import { useState } from 'react';
import { getHeaders } from './types';
import { AtsRing, IconDownload, IconSave, IconSpark, Spinner } from './icons';

interface Props {
  cvComplete: boolean;
  onSaved: () => void;
  onGoToBaseCV: () => void;
  t: { applications: Record<string, string> };
  lang: string;
}

// ── ATS-clean PDF generator ───────────────────────────────────────────────────
// Uses window.print() with a stylesheet that passes Taleo / Workday / Greenhouse
function printATS(cvText: string, lang: 'es' | 'en', position: string, company: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  // ATS compliance requirements in the PDF:
  // - Single column, no tables
  // - Standard serif/sans-serif font only
  // - No background colors, no icons
  // - Left-align everything
  // - Margins >= 0.5in
  // - Font size >= 10pt
  // - No headers/footers in print
  const title = `CV_${lang.toUpperCase()}_${position.replace(/\s+/g,'_')}_${company.replace(/\s+/g,'_')}`;
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  @page { margin: 0.75in; size: Letter; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #000000;
    background: #ffffff;
    max-width: 100%;
  }
  /* ATS parsers read plain text — no special formatting needed */
  pre {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.45;
    color: #000000;
  }
  /* Print: remove browser UI, no URL/date in margins */
  @media print {
    body { margin: 0; }
    @page { margin: 0.75in; }
  }
</style>
</head>
<body>
<pre>${cvText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
  win.addEventListener('load', () => { win.focus(); win.print(); win.close(); });
}

export function NewApplicationForm({ cvComplete, onSaved, onGoToBaseCV, t }: Props) {
  const ta = t.applications;

  const [form, setForm]         = useState({ company: '', position: '', jobOffer: '' });
  const [generating, setGen]    = useState(false);
  const [genError, setGenError] = useState('');
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [cvEs, setCvEs]         = useState<string | null>(null);
  const [cvEn, setCvEn]         = useState<string | null>(null);
  const [activeTab, setTab]     = useState<'es' | 'en'>('es');
  const [saving, setSaving]     = useState(false);

  const hasResult = cvEs !== null || cvEn !== null;

  async function generate() {
    if (!form.company || !form.position || !form.jobOffer) {
      setGenError(ta.toastFormIncomplete); return;
    }
    setGen(true); setCvEs(null); setCvEn(null); setAtsScore(null); setGenError('');
    try {
      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { atsScore: number; cvEs?: string; cvEn?: string; cvText?: string };
      setAtsScore(data.atsScore ?? 0);
      setCvEs(data.cvEs ?? data.cvText ?? '');
      setCvEn(data.cvEn ?? data.cvText ?? '');
    } catch (e) {
      setGenError(e instanceof Error ? e.message : ta.toastGenerateError);
    } finally { setGen(false); }
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
          generatedCvText: cvEs ?? cvEn,
          generatedCvTextEs: cvEs,
          generatedCvTextEn: cvEn,
        }),
      });
      setForm({ company: '', position: '', jobOffer: '' });
      setCvEs(null); setCvEn(null); setAtsScore(null);
      onSaved();
    } catch { setGenError(ta.toastAppSaveError); }
    finally { setSaving(false); }
  }

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

      {/* ── Form ──────────────────────────────────────────────────────────────── */}
      {!hasResult && (
        <div className="card p-6 space-y-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">{ta.newAppFormTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(['company','position'] as const).map(key => (
              <div key={key}>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                  {ta['field' + key.charAt(0).toUpperCase() + key.slice(1)]}
                  <span className="text-rose-400 ml-1">{ta.fieldRequired}</span>
                </label>
                <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ta['field' + key.charAt(0).toUpperCase() + key.slice(1) + 'Placeholder']}
                  className="input-field" />
              </div>
            ))}
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
              {ta.fieldJobOffer} <span className="text-rose-400">{ta.fieldRequired}</span>
            </label>
            <textarea value={form.jobOffer} onChange={e => setForm(p => ({ ...p, jobOffer: e.target.value }))}
              rows={8} placeholder={ta.fieldJobOfferPlaceholder}
              className="input-field resize-y font-mono text-[11px]" />
            <p className="font-mono text-[9.5px] text-slate-400 mt-1">{ta.jobOfferHint ?? 'Pega la descripción completa de la oferta incluyendo requisitos y responsabilidades.'}</p>
          </div>

          {genError && (
            <p className="font-mono text-[10px] text-rose-500">{genError}</p>
          )}

          <button onClick={generate} disabled={generating}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
            {generating ? <><Spinner sm /> {ta.generatingCV}</> : <><IconSpark /> {ta.generateATSBtn}</>}
          </button>

          {generating && (
            <div className="font-mono text-[10px] text-slate-400 space-y-1 pt-1">
              <p>{ta.generatingStep1 ?? '1. Extrayendo palabras clave de la oferta...'}</p>
              <p>{ta.generatingStep2 ?? '2. Adaptando CV base al puesto...'}</p>
              <p>{ta.generatingStep3 ?? '3. Generando versiones en español e inglés...'}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Result ────────────────────────────────────────────────────────────── */}
      {hasResult && atsScore !== null && (
        <div className="space-y-4">

          {/* Score + header */}
          <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <AtsRing score={atsScore} large />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{ta.atsScoreLabel}</p>
                <p className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {form.position} @ {form.company}
                </p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                  {atsScore >= 90 ? (ta.atsExcellent ?? 'Excelente match ATS')
                  : atsScore >= 70 ? (ta.atsGood ?? 'Buen match ATS')
                  : (ta.atsLow ?? 'Match ATS bajo')}
                </p>
              </div>
            </div>
            <button onClick={() => { setCvEs(null); setCvEn(null); setAtsScore(null); }}
              className="btn-ghost text-[10px] py-2 px-4">{ta.editBack ?? 'Volver a editar'}</button>
          </div>

          {/* Dual CV tabs */}
          <div className="card p-0 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {(['es','en'] as const).map(lng => (
                <button key={lng} onClick={() => setTab(lng)}
                  className={`flex-1 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors
                    ${activeTab === lng
                      ? 'bg-slate-50 dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-b-2 border-sky-500'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  {lng === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
                </button>
              ))}
            </div>

            {/* CV preview */}
            <div className="p-5">
              <pre className="font-mono text-[10.5px] text-slate-700 dark:text-slate-300 leading-relaxed
                              whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 rounded-lg p-4
                              border border-slate-100 dark:border-slate-800
                              max-h-[520px] overflow-y-auto">
                {activeTab === 'es' ? cvEs : cvEn}
              </pre>

              {/* PDF buttons */}
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button onClick={() => printATS(cvEs ?? '', 'es', form.position, form.company)}
                  disabled={!cvEs}
                  className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 disabled:opacity-40">
                  <IconDownload /> PDF Español (ATS)
                </button>
                <button onClick={() => printATS(cvEn ?? '', 'en', form.position, form.company)}
                  disabled={!cvEn}
                  className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 disabled:opacity-40">
                  <IconDownload /> PDF English (ATS)
                </button>
                <span className="font-mono text-[9px] text-slate-400 ml-auto">
                  {ta.atsCompliantNote ?? 'Formato ATS-compatible (sin tablas, columnas ni gráficos)'}
                </span>
              </div>
            </div>
          </div>

          {/* Save */}
          {genError && <p className="font-mono text-[10px] text-rose-500">{genError}</p>}
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
              {saving ? <><Spinner sm /> {ta.savingBaseCV}</> : <><IconSave /> {ta.saveApplication}</>}
            </button>
            <p className="font-mono text-[9.5px] text-slate-400">
              {ta.saveAppHint ?? 'Guarda la postulación y ambas versiones del CV.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
