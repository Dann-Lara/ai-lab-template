import Link from 'next/link';

export default function Home(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-3xl mx-auto text-center px-6">
        <h1 className="text-5xl font-bold mb-4">🚀 AI Lab Template</h1>
        <p className="text-xl text-slate-300 mb-8">
          Next.js · NestJS · LangChain · n8n · Turborepo
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
          >
            Open Dashboard
          </Link>
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
          >
            API Docs (Swagger)
          </a>
          <a
            href="http://localhost:5678"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-semibold transition-colors"
          >
            n8n Workflows
          </a>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 text-sm text-slate-400">
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">🤖</div>
            <div>AI Generation</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <div>Automations</div>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">🔒</div>
            <div>Auth & Security</div>
          </div>
        </div>
      </div>
    </div>
  );
}
