'use client';

import { useState } from 'react';
import { useI18n } from '../../lib/i18n-context';
import type { AiGenerateRequest, AiGenerateResponse } from '@ai-lab/shared';

export function AiGenerator(): React.JSX.Element {
  const { t } = useI18n();
  const [prompt, setPrompt]           = useState('');
  const [systemMessage, setSystemMsg] = useState('');
  const [temperature, setTemp]        = useState(0.7);
  const [result, setResult]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult('');
    try {
      const body: AiGenerateRequest = { prompt, systemMessage: systemMessage || undefined, temperature };
      const res = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as AiGenerateResponse;
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div>
        <label className="label">{t.ai.systemMessage}</label>
        <input type="text" value={systemMessage} onChange={(e) => setSystemMsg(e.target.value)}
          placeholder={t.ai.systemMessagePlaceholder} className="input" />
      </div>
      <div>
        <label className="label">{t.ai.prompt} *</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.ai.promptPlaceholder} rows={4} className="input resize-none" />
      </div>
      <div>
        <label className="label">
          {t.ai.temperature}: <span className="font-mono text-sky-600 dark:text-sky-400">{temperature}</span>
        </label>
        <input type="range" min="0" max="2" step="0.1" value={temperature}
          onChange={(e) => setTemp(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                     bg-slate-200 dark:bg-slate-700
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-sky-600 dark:[&::-webkit-slider-thumb]:bg-sky-500" />
      </div>
      <button type="submit" disabled={loading || !prompt.trim()} className="btn-primary w-full">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            {t.ai.generating}
          </span>
        ) : t.ai.generate}
      </button>
      {error && (
        <div className="flex gap-2 p-3 rounded-lg animate-fade-in
                        bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="font-mono text-[10px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {result && (
        <div className="p-4 rounded-lg animate-fade-in
                        bg-sky-50 dark:bg-sky-500/5
                        border border-sky-200 dark:border-sky-500/20">
          <p className="font-mono text-[9px] uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-2">
            {t.ai.result}
          </p>
          <p className="font-mono text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {result}
          </p>
        </div>
      )}
    </form>
  );
}
