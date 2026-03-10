'use client';
import { useRef, useState } from 'react';
import { BaseCV, getHeaders } from './types';
import { IconFile, IconUpload, Spinner } from './icons';

interface Props {
  onExtracted: (cv: Partial<BaseCV>, fieldFeedback?: Record<string, string>) => void;
  t: { applications: Record<string, string> };
}

export function PdfCVUploader({ onExtracted, t }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setError(t.applications.pdfOnlyPDF); return; }
    if (file.size > 5 * 1024 * 1024)    { setError(t.applications.pdfTooLarge); return; }
    setError(''); setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/applications/extract-cv', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ pdfBase64: base64 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json() as Partial<BaseCV> & { fieldFeedback?: Record<string, string> };
      const { fieldFeedback, ...cvFields } = parsed;
      onExtracted(cvFields, fieldFeedback);
    } catch (e) {
      setError(t.applications.pdfExtractError);
      console.error(e);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5
                    hover:border-sky-300 dark:hover:border-sky-500/40 transition-colors">
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-400/10
                        border border-sky-200 dark:border-sky-400/20
                        flex items-center justify-center shrink-0 text-sky-500">
          <IconFile />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {t.applications.pdfUploaderTitle}
          </p>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
            {t.applications.pdfUploaderDesc}
          </p>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg
                     font-mono text-[10px] uppercase tracking-widest
                     bg-sky-500 hover:bg-sky-600 text-white
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading
            ? <><Spinner sm /> {t.applications.pdfExtracting}</>
            : <><IconUpload /> {t.applications.pdfUploadBtn}</>}
        </button>
      </div>
      {error && <p className="mt-3 font-mono text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
