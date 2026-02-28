'use client';

import { useState } from 'react';
import { useI18n } from '../../lib/i18n-context';
import type { AiGenerateRequest, AiGenerateResponse } from '@ai-lab/shared';

export function AiGenerator(): React.JSX.Element {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult('');
    try {
      const body: AiGenerateRequest = { prompt, systemMessage: systemMessage || undefined, temperature };
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as AiGenerateResponse;
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div>
        <label className="label">{t.ai.systemMessage}</label>
        <input type="text" value={systemMessage} onChange={(e) => setSystemMessage(e.target.value)}
          placeholder={t.ai.systemMessagePlaceholder} className="input" />
      </div>
      <div>
        <label className="label">{t.ai.prompt} *</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.ai.promptPlaceholder} rows={4} className="input resize-none" />
      </div>
      <div>
        <label className="label">
          {t.ai.temperature}: <span className="font-mono text-brand-600 dark:text-brand-400">{temperature}</span>
        </label>
        <input type="range" min="0" max="2" step="0.1" value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-brand-600 cursor-pointer" />
      </div>
      <button type="submit" disabled={loading || !prompt.trim()} className="btn-primary w-full">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t.ai.generating}
          </span>
        ) : t.ai.generate}
      </button>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                        text-red-700 dark:text-red-400 text-sm animate-fade-in">{error}</div>
      )}
      {result && (
        <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50 animate-fade-in">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-2 uppercase tracking-wide">{t.ai.result}</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </form>
  );
}
