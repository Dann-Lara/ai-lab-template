'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { DashboardLayout } from '../../../components/ui/DashboardLayout';
import { useFadeInUp, useStaggerIn } from '../../../hooks/useAnime';

const ALLOWED_ROLES = ['superadmin', 'admin', 'client'];

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = 'pending' | 'accepted' | 'rejected' | 'in_process';

interface BaseCV {
  fullName: string; email: string; phone: string; location: string; linkedIn: string;
  summary: string; experience: string; education: string; skills: string;
  languages: string; certifications: string;
}

interface Application {
  id: string; company: string; position: string; appliedAt: string;
  status: AppStatus; jobOffer: string; atsScore?: number; cvGenerated?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const EMPTY_CV: BaseCV = {
  fullName: '', email: '', phone: '', location: '', linkedIn: '',
  summary: '', experience: '', education: '', skills: '', languages: '', certifications: '',
};

function isCVComplete(cv: BaseCV) {
  return !!(cv.fullName && cv.email && (cv.experience || cv.summary));
}

const STATUS_META: Record<AppStatus, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5' },
  in_process: { label: 'En proceso',  color: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5' },
  accepted:   { label: 'Aceptado',    color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5' },
  rejected:   { label: 'Rechazado',   color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5' },
};

// ─── ATS Score ring ───────────────────────────────────────────────────────────
function AtsRing({ score }: { score: number }) {
  const color = score >= 80 ? '#34d399' : score >= 55 ? '#38bdf8' : '#f59e0b';
  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
        <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * 125.6} 125.6`} strokeLinecap="round" />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

// ─── App card ─────────────────────────────────────────────────────────────────
function AppCard({ app, onStatusChange, onGenerateCV }: {
  app: Application;
  onStatusChange: (id: string, status: AppStatus) => void;
  onGenerateCV: (app: Application) => void;
}) {
  const meta = STATUS_META[app.status];
  return (
    <div className="card p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        {app.atsScore !== undefined && <AtsRing score={app.atsScore} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-200">{app.position}</p>
              <p className="font-mono text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">{app.company}</p>
            </div>
            <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="font-mono text-[10px] text-slate-400">
              {new Date(app.appliedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <select value={app.status} onChange={e => onStatusChange(app.id, e.target.value as AppStatus)}
              className="font-mono text-[10px] bg-transparent border border-slate-200 dark:border-slate-700
                         rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400
                         focus:outline-none focus:border-sky-400 transition-colors cursor-pointer">
              {(Object.keys(STATUS_META) as AppStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
            <button onClick={() => onGenerateCV(app)}
              className="font-mono text-[10px] flex items-center gap-1.5 text-sky-600 dark:text-sky-400
                         border border-sky-200 dark:border-sky-400/30 rounded px-2 py-0.5
                         hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all">
              ↓ {app.cvGenerated ? 'Re-generar CV ATS' : 'Generar CV ATS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Upload + AI extraction ───────────────────────────────────────────────
function PdfCVUploader({ onExtracted }: { onExtracted: (cv: Partial<BaseCV>) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setError('Solo se aceptan archivos PDF.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('El PDF no debe superar 5 MB.'); return; }
    setError(''); setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              {
                type: 'text',
                text: `Extrae la información del CV en este PDF y devuelve un JSON con exactamente estas claves (texto plano, sin markdown):
{"fullName":"nombre completo","email":"email","phone":"teléfono","location":"ciudad, país","linkedIn":"URL LinkedIn o vacío","summary":"resumen profesional completo","experience":"toda la experiencia laboral con empresa puesto fechas y logros","education":"educación con institución carrera y año","skills":"habilidades separadas por comas","languages":"idiomas con nivel","certifications":"certificaciones o vacío"}
Solo responde con el JSON puro sin explicaciones ni backticks.`,
              },
            ],
          }],
        }),
      });

      const data = await res.json();
      const text = (data.content ?? [])
        .map((b: { type: string; text?: string }) => b.type === 'text' ? b.text ?? '' : '')
        .join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as Partial<BaseCV>;
      onExtracted(parsed);
    } catch (e) {
      setError('No se pudo extraer el CV del PDF. Intenta con otro archivo.');
      console.error(e);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5
                    hover:border-sky-300 dark:hover:border-sky-500/40 transition-colors group">
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-400/10
                        border border-sky-200 dark:border-sky-400/20
                        flex items-center justify-center shrink-0 text-sky-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Cargar CV actual (PDF)
          </p>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
            La IA extrae automáticamente todos tus datos del PDF y rellena el formulario
          </p>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg
                     font-mono text-[10px] uppercase tracking-widest
                     bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Extrayendo...</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg> Subir PDF</>
          )}
        </button>
      </div>
      {error && <p className="mt-3 font-mono text-[10px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ─── AI Feedback Panel ────────────────────────────────────────────────────────
function AiFeedbackPanel({ stats, apps }: {
  stats: { total: number; accepted: number; rejected: number; pending: number; avgAts: number; acceptRate: number };
  apps: Application[];
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadFeedback() {
    setLoading(true);
    try {
      const summary = `Total: ${stats.total}, Aceptadas: ${stats.accepted}, Rechazadas: ${stats.rejected}, En proceso: ${stats.pending}, Tasa éxito: ${stats.acceptRate}%, ATS promedio: ${stats.avgAts}%, Empresas: ${apps.map(a => a.company).join(', ')}`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: `Eres un coach de carrera experto. Con estos datos de postulaciones, da feedback constructivo con métricas y 3-5 recomendaciones accionables en español. Sé conciso.\n\n${summary}` }],
        }),
      });
      const data = await res.json();
      const text = (data.content ?? []).map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('');
      setFeedback(text || 'No se pudo generar feedback.');
    } catch { setFeedback('Error al conectar con la IA.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Feedback & Análisis IA</h3>
        <button onClick={loadFeedback} disabled={loading}
          className="btn-primary text-[10px] py-1.5 px-4 flex items-center gap-1.5">
          {loading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando...</> : '⚡ Generar análisis'}
        </button>
      </div>
      {feedback
        ? <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800">{feedback}</pre>
        : <p className="font-mono text-[10px] text-slate-400">Presiona "Generar análisis" para obtener feedback personalizado.</p>
      }
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'list' | 'new' | 'base-cv' | 'dashboard';

export default function ApplicationsPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth(ALLOWED_ROLES);

  const [tab, setTab] = useState<Tab>('list');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [baseCV, setBaseCV] = useState<BaseCV>(EMPTY_CV);
  const [cvSaving, setCvSaving] = useState(false);
  const [cvExtracted, setCvExtracted] = useState(false);

  const [newForm, setNewForm] = useState({ company: '', position: '', jobOffer: '' });
  const [generating, setGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  const headerRef = useFadeInUp<HTMLDivElement>({ delay: 0, duration: 500 });
  const listRef = useStaggerIn<HTMLDivElement>({ delay: 50, stagger: 70 });

  const cvComplete = isCVComplete(baseCV);

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', { headers: getHeaders() });
      const data = await res.json() as Application[];
      setApps(Array.isArray(data) ? data : []);
    } catch { setApps([]); }
    finally { setLoading(false); }
  }, []);

  const loadBaseCV = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('ailab_base_cv');
      if (raw) setBaseCV({ ...EMPTY_CV, ...JSON.parse(raw) as BaseCV });
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    if (!authLoading && user) { loadApps(); loadBaseCV(); }
  }, [authLoading, user, loadApps, loadBaseCV]);

  async function saveBaseCV() {
    setCvSaving(true);
    try {
      localStorage.setItem('ailab_base_cv', JSON.stringify(baseCV));
      fetch('/api/applications/base-cv', {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(baseCV),
      }).catch(() => {});
      setCvExtracted(false);
      showToast('CV base guardado correctamente', 'ok');
    } catch { showToast('Error al guardar CV base', 'err'); }
    finally { setCvSaving(false); }
  }

  function handlePdfExtracted(extracted: Partial<BaseCV>) {
    setBaseCV(prev => ({ ...prev, ...extracted }));
    setCvExtracted(true);
    showToast('¡CV extraído con éxito! Revisa los campos y guarda.', 'ok');
  }

  async function updateStatus(id: string, status: AppStatus) {
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }),
      });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { showToast('Error al actualizar estado', 'err'); }
  }

  async function generateATSCv(company: string, position: string, jobOffer: string) {
    setGenerating(true); setGeneratedCV(null); setAtsScore(null);
    try {
      const prompt = `Eres experto en CVs ATS. Crea un CV 100% optimizado para esta oferta usando los datos del candidato.

CV BASE:
Nombre: ${baseCV.fullName} | Email: ${baseCV.email} | Tel: ${baseCV.phone} | Ubicación: ${baseCV.location}
LinkedIn: ${baseCV.linkedIn}
RESUMEN: ${baseCV.summary}
EXPERIENCIA: ${baseCV.experience}
EDUCACIÓN: ${baseCV.education}
HABILIDADES: ${baseCV.skills}
IDIOMAS: ${baseCV.languages}
CERTIFICACIONES: ${baseCV.certifications}

OFERTA: ${company} — ${position}
${jobOffer}

INSTRUCCIONES: Incorpora palabras clave exactas. Reordena experiencia relevante. Adapta el resumen. NO inventes datos. Formato limpio para ATS sin tablas.
Calcula ATS Match Score (0-100).

RESPONDE SOLO con este JSON: {"atsScore":<número>,"cvText":"<CV completo, secciones separadas por \\n\\n>"}`;

      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ prompt, company, position, jobOffer }),
      });
      const data = await res.json() as { atsScore: number; cvText: string };
      setAtsScore(data.atsScore);
      setGeneratedCV(data.cvText);
    } catch { showToast('Error al generar CV ATS', 'err'); }
    finally { setGenerating(false); }
  }

  async function submitNewApp() {
    if (!newForm.company || !newForm.position || !newForm.jobOffer) {
      showToast('Completa todos los campos', 'err'); return;
    }
    await generateATSCv(newForm.company, newForm.position, newForm.jobOffer);
  }

  async function saveApplication() {
    if (!generatedCV || atsScore === null) return;
    try {
      await fetch('/api/applications', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ ...newForm, atsScore, cvGenerated: true, generatedCvText: generatedCV }),
      });
      showToast('Postulación guardada', 'ok');
      setNewForm({ company: '', position: '', jobOffer: '' });
      setGeneratedCV(null); setAtsScore(null);
      setTab('list'); loadApps();
    } catch { showToast('Error al guardar postulación', 'err'); }
  }

  function exportPDF() {
    if (!generatedCV) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>CV ATS — ${newForm.position} @ ${newForm.company}</title>
<style>body{font-family:Arial,sans-serif;font-size:11pt;margin:2cm;color:#1a1a1a;line-height:1.5}pre{white-space:pre-wrap;font-family:inherit;font-size:11pt}@page{margin:2cm}</style>
</head><body><pre>${generatedCV.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  const stats = {
    total: apps.length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    pending: apps.filter(a => a.status === 'pending' || a.status === 'in_process').length,
    avgAts: apps.filter(a => a.atsScore).length
      ? Math.round(apps.filter(a => a.atsScore).reduce((s, a) => s + (a.atsScore ?? 0), 0) / apps.filter(a => a.atsScore).length)
      : 0,
    acceptRate: apps.length ? Math.round((apps.filter(a => a.status === 'accepted').length / apps.length) * 100) : 0,
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-5 h-5 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const variant = (user.role === 'client' ? 'client' : 'admin') as 'admin' | 'client';

  return (
    <DashboardLayout variant={variant} user={user} title="Postulaciones">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">

        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-2">Módulo</p>
          <h1 className="headline text-4xl md:text-5xl text-slate-900 dark:text-white">Postulaciones</h1>
          <p className="font-mono text-[11px] text-slate-400 mt-2">
            Gestiona tus postulaciones y genera CVs optimizados para ATS con IA.
          </p>
        </div>

        {/* CV Base warning banner */}
        {!cvComplete && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-400/30
                          bg-amber-50 dark:bg-amber-400/5 flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="text-amber-500 shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div className="flex-1">
              <p className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">CV Base incompleto</p>
              <p className="font-mono text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                Configura tu CV Base antes de crear postulaciones. Puedes subir tu CV en PDF y la IA extraerá los datos automáticamente.
              </p>
            </div>
            <button onClick={() => setTab('base-cv')}
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg
                         bg-amber-500 hover:bg-amber-600 text-white transition-colors">
              Configurar →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {([
            { key: 'list',      label: 'Listado' },
            { key: 'new',       label: '+ Nueva postulación' },
            { key: 'base-cv',   label: 'CV Base' },
            { key: 'dashboard', label: 'Dashboard IA' },
          ] as { key: Tab; label: string }[]).map(t_ => (
            <button key={t_.key} onClick={() => setTab(t_.key)}
              className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest shrink-0 -mb-px border-b-2 transition-all
                ${tab === t_.key
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}>
              {t_.label}
            </button>
          ))}
        </div>

        {/* ── TAB: LIST ────────────────────────────────────────────────────── */}
        {tab === 'list' && (
          loading ? (
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
              Cargando postulaciones...
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="font-mono text-[12px] text-slate-400">No hay postulaciones aún.</p>
              <button onClick={() => setTab(cvComplete ? 'new' : 'base-cv')}
                className="btn-primary text-[10px] py-2 px-4 mt-4">
                {cvComplete ? '+ Crear primera postulación' : 'Configurar CV Base primero'}
              </button>
            </div>
          ) : (
            <div ref={listRef} className="space-y-3">
              {apps.map(app => (
                <AppCard key={app.id} app={app} onStatusChange={updateStatus} onGenerateCV={() => {}} />
              ))}
            </div>
          )
        )}

        {/* ── TAB: NEW APPLICATION ─────────────────────────────────────────── */}
        {tab === 'new' && (
          !cvComplete ? (
            <div className="card p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-400/10
                              border border-amber-200 dark:border-amber-400/30
                              flex items-center justify-center mx-auto text-amber-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="font-mono text-[13px] font-semibold text-slate-700 dark:text-slate-300">CV Base requerido</p>
              <p className="font-mono text-[11px] text-slate-400 max-w-sm mx-auto">
                Completa tu CV Base antes de crear una postulación. La IA lo usará para generar un CV 100% ATS adaptado a cada oferta.
              </p>
              <button onClick={() => setTab('base-cv')} className="btn-primary text-[11px] py-2.5 px-6 mx-auto">
                Ir a CV Base →
              </button>
            </div>
          ) : !generatedCV ? (
            <div className="card p-6 space-y-5">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Datos de la postulación</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Empresa *</label>
                  <input value={newForm.company} onChange={e => setNewForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="Google, Meta, Startup MX..." className="input-field" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Puesto *</label>
                  <input value={newForm.position} onChange={e => setNewForm(p => ({ ...p, position: e.target.value }))}
                    placeholder="Senior Frontend Developer..." className="input-field" />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                  Texto de la oferta / postulación *
                </label>
                <textarea value={newForm.jobOffer} onChange={e => setNewForm(p => ({ ...p, jobOffer: e.target.value }))}
                  rows={8} placeholder="Pega aquí la descripción completa de la oferta de trabajo..."
                  className="input-field resize-y font-mono text-[11px]" />
              </div>
              <button onClick={submitNewApp} disabled={generating}
                className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
                {generating
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando CV ATS con IA...</>
                  : <>⚡ Generar CV 100% ATS con IA</>
                }
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {atsScore !== null && (
                <div className="card p-5 flex items-center gap-5">
                  <AtsRing score={atsScore} />
                  <div>
                    <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                      ATS Match Score: {atsScore}%
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {atsScore >= 80 ? '🟢 Excelente — muy alineado con la oferta.'
                        : atsScore >= 55 ? '🟡 Bueno — considera agregar más palabras clave.'
                        : '🔴 Bajo — actualiza tu CV base con más detalles relevantes.'}
                    </p>
                  </div>
                </div>
              )}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">CV Generado</h3>
                  <div className="flex gap-2">
                    <button onClick={exportPDF}
                      className="font-mono text-[10px] flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5
                                 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      ↓ PDF
                    </button>
                    <button onClick={() => setGeneratedCV(null)}
                      className="font-mono text-[10px] border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5
                                 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      ← Editar
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap
                                bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto
                                leading-relaxed border border-slate-100 dark:border-slate-800">
                  {generatedCV}
                </pre>
              </div>
              <button onClick={saveApplication} className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
                💾 Guardar postulación
              </button>
            </div>
          )
        )}

        {/* ── TAB: BASE CV ─────────────────────────────────────────────────── */}
        {tab === 'base-cv' && (
          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Importar desde PDF</h2>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full
                                 bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400
                                 border border-sky-200 dark:border-sky-400/20">IA</span>
              </div>
              <PdfCVUploader onExtracted={handlePdfExtracted} />
              {cvExtracted && (
                <p className="mt-3 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  ✓ Datos extraídos — revisa los campos abajo y guarda.
                </p>
              )}
            </div>

            <div className="card p-6 space-y-6">
              <div>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-1">CV Base Global</h2>
                <p className="font-mono text-[10px] text-slate-400">
                  Fuente para generar CVs 100% ATS. Los campos con * son requeridos para crear postulaciones.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'fullName', label: 'Nombre completo *' },
                  { key: 'email',    label: 'Email profesional *' },
                  { key: 'phone',    label: 'Teléfono' },
                  { key: 'location', label: 'Ubicación' },
                  { key: 'linkedIn', label: 'LinkedIn URL' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">{f.label}</label>
                    <input value={baseCV[f.key as keyof BaseCV]}
                      onChange={e => setBaseCV(p => ({ ...p, [f.key]: e.target.value }))}
                      className="input-field" />
                  </div>
                ))}
              </div>
              {[
                { key: 'summary',        label: 'Resumen profesional *', rows: 4, placeholder: 'Profesional con X años de experiencia en...' },
                { key: 'experience',     label: 'Experiencia laboral *',  rows: 8, placeholder: 'Empresa — Puesto (Año-Año)\n• Logro cuantificable...' },
                { key: 'education',      label: 'Educación',              rows: 3, placeholder: 'Universidad — Carrera (Año)' },
                { key: 'skills',         label: 'Habilidades técnicas',   rows: 3, placeholder: 'React, TypeScript, Node.js...' },
                { key: 'languages',      label: 'Idiomas',                rows: 2, placeholder: 'Español (nativo), Inglés (B2)' },
                { key: 'certifications', label: 'Certificaciones',        rows: 2, placeholder: 'AWS Solutions Architect — 2024' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">{f.label}</label>
                  <textarea value={baseCV[f.key as keyof BaseCV]}
                    onChange={e => setBaseCV(p => ({ ...p, [f.key]: e.target.value }))}
                    rows={f.rows} placeholder={f.placeholder}
                    className="input-field resize-y font-mono text-[11px]" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button onClick={saveBaseCV} disabled={cvSaving}
                  className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
                  {cvSaving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : '💾 Guardar CV Base'}
                </button>
                {cvComplete && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CV Base completo
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: DASHBOARD IA ────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats.total, color: 'text-slate-800 dark:text-slate-200' },
                { label: 'Aceptadas', value: stats.accepted, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Rechazadas', value: stats.rejected, color: 'text-red-600 dark:text-red-400' },
                { label: 'Tasa de éxito', value: `${stats.acceptRate}%`, color: 'text-sky-600 dark:text-sky-400' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={`headline text-4xl ${s.color}`}>{s.value}</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {stats.avgAts > 0 && (
              <div className="card p-5 flex items-center gap-5">
                <AtsRing score={stats.avgAts} />
                <div>
                  <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                    ATS Score promedio: {stats.avgAts}%
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                    Basado en {apps.filter(a => a.atsScore).length} postulaciones con CV generado.
                  </p>
                </div>
              </div>
            )}
            {stats.total >= 2
              ? <AiFeedbackPanel stats={stats} apps={apps} />
              : (
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <p className="font-mono text-[11px] text-slate-400">
                    Agrega al menos 2 postulaciones para ver el análisis de IA.
                  </p>
                </div>
              )
            }
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] px-4 py-3 rounded-lg shadow-lg font-mono text-[11px] border
                         ${toast.type === 'ok'
                           ? 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30'
                           : 'bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30'
                         }`}>
          {toast.msg}
        </div>
      )}
    </DashboardLayout>
  );
}
