'use client';

import { useState } from 'react';
import { useI18n } from '../../lib/i18n-context';

export function AiSummarizer(): React.JSX.Element {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { result: string };
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
        <label className="label">{t.ai.textToSummarize} *</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t.ai.textToSummarizePlaceholder} rows={6} className="input resize-none" />
      </div>
      <button type="submit" disabled={loading || !text.trim()}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50
                   disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-150
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t.ai.summarizing}
          </span>
        ) : t.ai.summarize}
      </button>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                        text-red-700 dark:text-red-400 text-sm animate-fade-in">{error}</div>
      )}
      {result && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 animate-fade-in">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">{t.ai.summary}</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">{result}</p>
        </div>
      )}
    </form>
  );
}
