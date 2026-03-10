'use client';
import { useState } from 'react';
import { Application, BaseCV, getHeaders } from './types';
import { AtsRing, IconSave, IconSpark, Spinner } from './icons';

interface Props {
  baseCV: BaseCV;
  cvComplete: boolean;
  onSaved: () => void;
  onGoToBaseCV: () => void;
  t: { applications: Record<string, string> };
}

export function NewApplicationForm({ baseCV: _baseCV, cvComplete, onSaved, onGoToBaseCV, t }: Props) {
  const [form, setForm]           = useState({ company: '', position: '', jobOffer: '' });
  const [generating, setGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string | null>(null);
  const [atsScore, setAtsScore]   = useState<number | null>(null);
  const [saving, setSaving]       = useState(false);

  function showError(msg: string) {
    // simple inline error — could be wired to parent toast
    alert(msg);
  }

  async function generate() {
    if (!form.company || !form.position || !form.jobOffer) {
      showError(t.applications.toastFormIncomplete); return;
    }
    setGenerating(true); setGeneratedCV(null); setAtsScore(null);
    try {
      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { atsScore: number; cvText: string };
      setAtsScore(data.atsScore ?? 70);
      setGeneratedCV(data.cvText ?? '');
    } catch (e) {
      showError(e instanceof Error ? e.message : t.applications.toastGenerateError);
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!generatedCV || atsScore === null) return;
    setSaving(true);
    try {
      await fetch('/api/applications', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ ...form, atsScore, cvGenerated: true, generatedCvText: generatedCV }),
      });
      setForm({ company: '', position: '', jobOffer: '' });
      setGeneratedCV(null); setAtsScore(null);
      onSaved();
    } catch {
      showError(t.applications.toastAppSaveError);
    } finally {
      setSaving(false);
    }
  }

  function exportPDF() {
    if (!generatedCV) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>CV ATS — ${form.position} @ ${form.company}</title>
<style>body{font-family:Arial,sans-serif;font-size:11pt;margin:2cm;color:#1a1a1a;line-height:1.5}pre{white-space:pre-wrap;font-family:inherit}@page{margin:2cm}</style>
</head><body><pre>${generatedCV.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close();
    win.print();
  }

  if (!cvComplete) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="font-mono text-[13px] font-semibold text-slate-700 dark:text-slate-300">
          {t.applications.cvRequiredTitle}
        </p>
        <p className="font-mono text-[11px] text-slate-400">{t.applications.cvRequiredDesc}</p>
        <button onClick={onGoToBaseCV} className="btn-primary text-[11px] py-2.5 px-6 mx-auto">
          {t.applications.goToBaseCV}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Form */}
      {!generatedCV && (
        <div className="card p-6 space-y-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
            {t.applications.newAppFormTitle}
          </h2>
          {([
            { key: 'company',  label: t.applications.fieldCompany,  ph: t.applications.fieldCompanyPlaceholder,  type: 'input' },
            { key: 'position', label: t.applications.fieldPosition,  ph: t.applications.fieldPositionPlaceholder, type: 'input' },
            { key: 'jobOffer', label: t.applications.fieldJobOffer,  ph: t.applications.fieldJobOfferPlaceholder, type: 'textarea' },
          ] as { key: 'company'|'position'|'jobOffer'; label: string; ph: string; type: string }[]).map(f => (
            <div key={f.key}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                {f.label} <span className="text-rose-400">{t.applications.fieldRequired}</span>
              </label>
              {f.type === 'textarea'
                ? <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    rows={6} placeholder={f.ph} className="input-field resize-y font-mono text-[11px]" />
                : <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph} className="input-field" />
              }
            </div>
          ))}
          <button onClick={generate} disabled={generating}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
            {generating ? <><Spinner sm /> {t.applications.generatingCV}</> : <><IconSpark /> {t.applications.generateATSBtn}</>}
          </button>
        </div>
      )}

      {/* Generated CV */}
      {generatedCV && atsScore !== null && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <AtsRing score={atsScore} large />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  {t.applications.atsScoreLabel}
                </p>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {atsScore >= 80 ? t.applications.atsExcellent
                  : atsScore >= 55 ? t.applications.atsGood
                  : t.applications.atsLow}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGeneratedCV(null)} className="btn-ghost text-[10px] py-2 px-3">
                {t.applications.editBack}
              </button>
              <button onClick={exportPDF} className="btn-ghost text-[10px] py-2 px-3">
                {t.applications.exportPDF}
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">
              {t.applications.generatedCVTitle}
            </p>
            <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap
                            bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800
                            max-h-[500px] overflow-y-auto">
              {generatedCV}
            </pre>
          </div>
          <button onClick={save} disabled={saving}
            className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
            {saving ? <><Spinner sm /> {t.applications.savingBaseCV}</> : <><IconSave /> {t.applications.saveApplication}</>}
          </button>
        </div>
      )}
    </div>
  );
}
