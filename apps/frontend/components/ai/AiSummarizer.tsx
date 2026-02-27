'use client';

import { useState } from 'react';

export function AiSummarizer(): React.JSX.Element {
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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Text to Summarize *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to summarize..."
          rows={6}
          className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
      >
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-600 mb-1 font-medium">Summary:</p>
          <p className="text-slate-800 text-sm leading-relaxed">{result}</p>
        </div>
      )}
    </form>
  );
}
