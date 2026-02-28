'use client';

import { useState } from 'react';
import { useI18n } from '../../lib/i18n-context';

export function AiSummarizer(): React.JSX.Element {
  const { t } = useI18n();
  const [text, setText]       = useState('');
  const [result, setResult]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { result: string };
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div>
        <label className="label">{t.ai.textToSummarize} *</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t.ai.textToSummarizePlaceholder} rows={6} className="input resize-none" />
      </div>
      <button type="submit" disabled={loading || !text.trim()}
        className="w-full py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest
                   text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all
                   focus:outline-none focus:ring-2 focus:ring-emerald-400
                   focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            {t.ai.summarizing}
          </span>
        ) : t.ai.summarize}
      </button>
      {error && (
        <div className="p-3 rounded-lg animate-fade-in
                        bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p className="font-mono text-[10px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {result && (
        <div className="p-4 rounded-lg animate-fade-in
                        bg-emerald-50 dark:bg-emerald-500/5
                        border border-emerald-200 dark:border-emerald-500/20">
          <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            {t.ai.summary}
          </p>
          <p className="font-mono text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {result}
          </p>
        </div>
      )}
    </form>
  );
}
