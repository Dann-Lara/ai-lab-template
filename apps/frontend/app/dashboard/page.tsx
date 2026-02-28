import { AiGenerator } from '../../components/ai/AiGenerator';
import { AiSummarizer } from '../../components/ai/AiSummarizer';

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">AI Lab Dashboard</h1>
      </header>
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">✨ Text Generator</h2>
          <AiGenerator />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">📝 Text Summarizer</h2>
          <AiSummarizer />
        </div>
      </div>
    </div>
  );
}
