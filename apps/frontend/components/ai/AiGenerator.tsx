'use client';

import { useState } from 'react';

import type { AiGenerateRequest, AiGenerateResponse } from '@ai-lab/shared';

export function AiGenerator(): React.JSX.Element {
  const [prompt, setPrompt] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResult('');

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">System Message (optional)</label>
        <input
          type="text"
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="You are a helpful assistant..."
          className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Prompt *</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write your prompt here..."
          rows={4}
          className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Temperature: {temperature}
        </label>
        <input
          type="range"
          min="0" max="2" step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span> Generating...
          </span>
        ) : 'Generate'}
      </button>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {result && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-500 mb-1">Result:</p>
          <p className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">{result}</p>
        </div>
      )}
    </form>
  );
}
