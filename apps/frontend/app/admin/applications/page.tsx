'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../../../lib/i18n-context';
import { useAuth } from '../../../../hooks/useAuth';
import { DashboardLayout } from '../../../../components/ui/DashboardLayout';
import { useFadeInUp, useStaggerIn } from '../../../../hooks/useAnime';

const ALLOWED_ROLES = ['superadmin', 'admin', 'client'];

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = 'pending' | 'accepted' | 'rejected' | 'in_process';

interface BaseCV {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  summary: string;
  experience: string;   // free text block
  education: string;
  skills: string;
  languages: string;
  certifications: string;
}

interface Application {
  id: string;
  company: string;
  position: string;
  appliedAt: string;
  status: AppStatus;
  jobOffer: string;      // raw job offer text
  atsScore?: number;     // % match
  cvGenerated?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const STATUS_META: Record<AppStatus, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',    color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5' },
  in_process: { label: 'En proceso',  color: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5' },
  accepted:   { label: 'Aceptado',    color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5' },
  rejected:   { label: 'Rechazado',   color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5' },
};

const EMPTY_CV: BaseCV = {
  fullName: '', email: '', phone: '', location: '', linkedIn: '',
  summary: '', experience: '', education: '', skills: '', languages: '', certifications: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** ATS score ring */
function AtsRing({ score }: { score: number }) {
  const color = score >= 80 ? '#34d399' : score >= 55 ? '#38bdf8' : '#f59e0b';
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
        <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * 125.6} 125.6`} strokeLinecap="round" />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

/** Application row card */
function AppCard({
  app,
  onStatusChange,
  onGenerateCV,
}: {
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

            {/* Status changer */}
            <select
              value={app.status}
              onChange={e => onStatusChange(app.id, e.target.value as AppStatus)}
              className="font-mono text-[10px] bg-transparent border border-slate-200 dark:border-slate-700
                         rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400
                         focus:outline-none focus:border-sky-400 transition-colors cursor-pointer"
            >
              {(Object.keys(STATUS_META) as AppStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>

            {/* Generate / re-generate CV */}
            <button
              onClick={() => onGenerateCV(app)}
              className="font-mono text-[10px] flex items-center gap-1.5
                         text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300
                         border border-sky-200 dark:border-sky-400/30 rounded px-2 py-0.5
                         hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              {app.cvGenerated ? 'Re-generar CV ATS' : 'Generar CV ATS'}
            </button>
          </div>
        </div>
      </div>
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

  // Base CV state
  const [baseCV, setBaseCV] = useState<BaseCV>(EMPTY_CV);
  const [cvSaving, setCvSaving] = useState(false);

  // New application form
  const [newForm, setNewForm] = useState({ company: '', position: '', jobOffer: '' });
  const [generating, setGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  // Re-generate (for existing app)
  const [regenApp, setRegenApp] = useState<Application | null>(null);

  const headerRef = useFadeInUp<HTMLDivElement>({ delay: 0, duration: 500 });
  const listRef = useStaggerIn<HTMLDivElement>({ delay: 50, stagger: 70 });

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Load applications
  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', { headers: getHeaders() });
      const data = await res.json() as Application[];
      setApps(Array.isArray(data) ? data : []);
    } catch { setApps([]); }
    finally { setLoading(false); }
  }, []);

  // Load saved base CV
  const loadBaseCV = useCallback(async () => {
    try {
      const res = await fetch('/api/applications/base-cv', { headers: getHeaders() });
      if (res.ok) setBaseCV(await res.json() as BaseCV);
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    if (!authLoading && user) { loadApps(); loadBaseCV(); }
  }, [authLoading, user, loadApps, loadBaseCV]);

  // Save base CV
  async function saveBaseCV() {
    setCvSaving(true);
    try {
      await fetch('/api/applications/base-cv', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(baseCV),
      });
      showToast('CV base guardado correctamente', 'ok');
    } catch { showToast('Error al guardar CV base', 'err'); }
    finally { setCvSaving(false); }
  }

  // Update status
  async function updateStatus(id: string, status: AppStatus) {
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { showToast('Error al actualizar estado', 'err'); }
  }

  // Generate ATS CV via Claude API
  async function generateATSCv(company: string, position: string, jobOffer: string) {
    setGenerating(true);
    setGeneratedCV(null);
    setAtsScore(null);
    try {
      const prompt = `
Eres un experto en optimización de CVs para sistemas ATS (Applicant Tracking Systems).

## CV BASE DEL CANDIDATO:
Nombre: ${baseCV.fullName}
Email: ${baseCV.email}
Teléfono: ${baseCV.phone}
Ubicación: ${baseCV.location}
LinkedIn: ${baseCV.linkedIn}

RESUMEN PROFESIONAL:
${baseCV.summary}

EXPERIENCIA LABORAL:
${baseCV.experience}

EDUCACIÓN:
${baseCV.education}

HABILIDADES:
${baseCV.skills}

IDIOMAS:
${baseCV.languages}

CERTIFICACIONES:
${baseCV.certifications}

## OFERTA DE TRABAJO / POSTULACIÓN:
Empresa: ${company}
Puesto: ${position}

Descripción de la oferta:
${jobOffer}

## TAREA:
1. Analiza las palabras clave, habilidades y requisitos de la oferta.
2. Crea un CV 100% optimizado para ATS que:
   - Incorpore las palabras clave exactas de la oferta.
   - Reordene y enfatice la experiencia relevante.
   - Adapte el resumen profesional al puesto.
   - Mantenga toda la información real del candidato (sin inventar datos).
   - Use formato limpio, sin tablas ni columnas complejas.
3. Calcula un ATS Match Score estimado (0-100) basado en qué tan bien el CV base encaja con la oferta.

## FORMATO DE RESPUESTA (JSON estricto):
{
  "atsScore": <número 0-100>,
  "cvText": "<CV completo optimizado en texto plano, con secciones separadas por \\n\\n>"
}

Solo responde con el JSON, sin explicaciones adicionales.
      `.trim();

      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt, company, position, jobOffer }),
      });
      const data = await res.json() as { atsScore: number; cvText: string };
      setAtsScore(data.atsScore);
      setGeneratedCV(data.cvText);
    } catch { showToast('Error al generar CV ATS', 'err'); }
    finally { setGenerating(false); }
  }

  // Submit new application
  async function submitNewApp() {
    if (!newForm.company || !newForm.position || !newForm.jobOffer) {
      showToast('Completa todos los campos', 'err'); return;
    }
    await generateATSCv(newForm.company, newForm.position, newForm.jobOffer);
  }

  // Save application after CV generated
  async function saveApplication() {
    if (!generatedCV || atsScore === null) return;
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...newForm,
          atsScore,
          cvGenerated: true,
          generatedCvText: generatedCV,
        }),
      });
      showToast('Postulación guardada', 'ok');
      setNewForm({ company: '', position: '', jobOffer: '' });
      setGeneratedCV(null);
      setAtsScore(null);
      setTab('list');
      loadApps();
    } catch { showToast('Error al guardar postulación', 'err'); }
  }

  // Export generated CV as PDF via browser print
  function exportPDF() {
    if (!generatedCV) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>CV ATS — ${newForm.position} @ ${newForm.company}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; margin: 2cm; color: #1a1a1a; line-height: 1.5; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: 11pt; }
        h1 { font-size: 16pt; margin-bottom: 4px; }
        @page { margin: 2cm; }
      </style>
    </head><body><pre>${generatedCV.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  // AI dashboard feedback
  const stats = {
    total: apps.length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    pending: apps.filter(a => a.status === 'pending' || a.status === 'in_process').length,
    avgAts: apps.length ? Math.round(apps.filter(a => a.atsScore).reduce((s, a) => s + (a.atsScore ?? 0), 0) / apps.filter(a => a.atsScore).length || 0) : 0,
    acceptRate: apps.length ? Math.round((apps.filter(a => a.status === 'accepted').length / apps.length) * 100) : 0,
  };

  // ── Guard ───────────────────────────────────────────────────────────────────
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

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-slate-200 dark:border-slate-800">
          {([
            { key: 'list',     label: 'Listado' },
            { key: 'new',      label: '+ Nueva postulación' },
            { key: 'base-cv',  label: 'CV Base' },
            { key: 'dashboard', label: 'Dashboard IA' },
          ] as { key: Tab; label: string }[]).map(tab_ => (
            <button
              key={tab_.key}
              onClick={() => setTab(tab_.key)}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest -mb-px border-b-2 transition-all
                ${tab === tab_.key
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              {tab_.label}
            </button>
          ))}
        </div>

        {/* ── TAB: LIST ──────────────────────────────────────────────────────── */}
        {tab === 'list' && (
          loading ? (
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
              Cargando postulaciones...
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="font-mono text-[12px] text-slate-400">No hay postulaciones aún.</p>
              <button onClick={() => setTab('new')} className="btn-primary text-[10px] py-2 px-4 mt-4">
                + Crear primera postulación
              </button>
            </div>
          ) : (
            <div ref={listRef} className="space-y-3">
              {apps.map(app => (
                <AppCard key={app.id} app={app} onStatusChange={updateStatus} onGenerateCV={setRegenApp} />
              ))}
            </div>
          )
        )}

        {/* ── TAB: NEW APPLICATION ───────────────────────────────────────────── */}
        {tab === 'new' && (
          <div className="space-y-6">
            {/* Step 1: Job info */}
            {!generatedCV && (
              <div className="card p-6 space-y-5">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
                  1 — Datos de la postulación
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Empresa *</label>
                    <input
                      value={newForm.company}
                      onChange={e => setNewForm(p => ({ ...p, company: e.target.value }))}
                      placeholder="Google, Meta, Startup MX..."
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">Puesto *</label>
                    <input
                      value={newForm.position}
                      onChange={e => setNewForm(p => ({ ...p, position: e.target.value }))}
                      placeholder="Senior Frontend Developer..."
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                    Texto de la oferta / postulación *
                  </label>
                  <textarea
                    value={newForm.jobOffer}
                    onChange={e => setNewForm(p => ({ ...p, jobOffer: e.target.value }))}
                    rows={8}
                    placeholder="Pega aquí la descripción completa de la oferta de trabajo..."
                    className="input-field w-full resize-y font-mono text-[11px]"
                  />
                </div>

                {!baseCV.fullName && (
                  <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-400/30
                                  bg-amber-50 dark:bg-amber-400/5
                                  font-mono text-[10px] text-amber-700 dark:text-amber-400">
                    ⚠ Primero configura tu CV base en la pestaña "CV Base" para mejores resultados.
                  </div>
                )}

                <button
                  onClick={submitNewApp}
                  disabled={generating}
                  className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generando CV ATS con IA...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Generar CV 100% ATS con IA
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Generated CV */}
            {generatedCV && atsScore !== null && (
              <div className="space-y-4">
                {/* Score banner */}
                <div className="card p-5 flex items-center gap-5">
                  <AtsRing score={atsScore} />
                  <div>
                    <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                      ATS Match Score: {atsScore}%
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {atsScore >= 80 ? '🟢 Excelente — tu CV está muy alineado con la oferta.'
                       : atsScore >= 55 ? '🟡 Bueno — considera agregar más palabras clave.'
                       : '🔴 Bajo — revisa los requisitos y actualiza tu CV base.'}
                    </p>
                  </div>
                </div>

                {/* CV preview */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">CV Generado</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={exportPDF}
                        className="font-mono text-[10px] flex items-center gap-1.5
                                   border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5
                                   text-slate-500 dark:text-slate-400
                                   hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Exportar PDF
                      </button>
                      <button
                        onClick={() => setGeneratedCV(null)}
                        className="font-mono text-[10px] border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5
                                   text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        ← Editar oferta
                      </button>
                    </div>
                  </div>
                  <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap
                                  bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto
                                  leading-relaxed border border-slate-100 dark:border-slate-800">
                    {generatedCV}
                  </pre>
                </div>

                {/* Save */}
                <button
                  onClick={saveApplication}
                  className="btn-primary text-[11px] py-2.5 px-6 w-full sm:w-auto flex items-center gap-2"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Guardar postulación
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: BASE CV ───────────────────────────────────────────────────── */}
        {tab === 'base-cv' && (
          <div className="card p-6 space-y-6">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-1">CV Base Global</h2>
              <p className="font-mono text-[10px] text-slate-400">
                Este CV se usa como fuente para generar CVs 100% ATS adaptados a cada oferta.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'fullName', label: 'Nombre completo' },
                { key: 'email', label: 'Email profesional' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'location', label: 'Ubicación' },
                { key: 'linkedIn', label: 'LinkedIn URL' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">{f.label}</label>
                  <input
                    value={baseCV[f.key as keyof BaseCV]}
                    onChange={e => setBaseCV(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              ))}
            </div>

            {[
              { key: 'summary',        label: 'Resumen profesional', rows: 4, placeholder: 'Profesional con X años de experiencia en...' },
              { key: 'experience',     label: 'Experiencia laboral', rows: 8, placeholder: 'Empresa — Puesto (Año-Año)\n• Logro cuantificable...' },
              { key: 'education',      label: 'Educación', rows: 4, placeholder: 'Universidad — Carrera (Año)' },
              { key: 'skills',         label: 'Habilidades técnicas', rows: 3, placeholder: 'React, TypeScript, Node.js, PostgreSQL...' },
              { key: 'languages',      label: 'Idiomas', rows: 2, placeholder: 'Español (nativo), Inglés (B2/C1)...' },
              { key: 'certifications', label: 'Certificaciones', rows: 2, placeholder: 'AWS Solutions Architect — 2024' },
            ].map(f => (
              <div key={f.key}>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">{f.label}</label>
                <textarea
                  value={baseCV[f.key as keyof BaseCV]}
                  onChange={e => setBaseCV(p => ({ ...p, [f.key]: e.target.value }))}
                  rows={f.rows}
                  placeholder={f.placeholder}
                  className="input-field w-full resize-y font-mono text-[11px]"
                />
              </div>
            ))}

            <button
              onClick={saveBaseCV}
              disabled={cvSaving}
              className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2"
            >
              {cvSaving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                </svg> Guardar CV Base</>
              )}
            </button>
          </div>
        )}

        {/* ── TAB: DASHBOARD IA ──────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total postulaciones', value: stats.total, color: 'text-slate-800 dark:text-slate-200' },
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

            {/* ATS score stat */}
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

            {/* AI Feedback */}
            {stats.total >= 2 && (
              <AiFeedbackPanel stats={stats} apps={apps} />
            )}

            {stats.total < 2 && (
              <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <p className="font-mono text-[11px] text-slate-400">
                  Agrega al menos 2 postulaciones para ver el análisis de IA.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[300] px-4 py-3 rounded-lg shadow-lg
                         font-mono text-[11px] border transition-all
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

// ─── AI Feedback Panel (calls Claude API) ─────────────────────────────────────
function AiFeedbackPanel({ stats, apps }: { stats: ReturnType<typeof computeStats>; apps: Application[] }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadFeedback() {
    setLoading(true);
    try {
      const summary = `
Total postulaciones: ${stats.total}
Aceptadas: ${stats.accepted}
Rechazadas: ${stats.rejected}
En proceso: ${stats.pending}
Tasa de éxito: ${stats.acceptRate}%
ATS Score promedio: ${stats.avgAts}%
Empresas postuladas: ${apps.map(a => a.company).join(', ')}
      `.trim();

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Eres un coach de carrera experto. Basándote en estos datos de postulaciones de un candidato, proporciona un feedback constructivo, métricas clave y 3-5 recomendaciones específicas para mejorar su proceso de búsqueda de empleo.\n\n${summary}\n\nResponde en español, de forma concisa y accionable. Usa bullet points para las recomendaciones.`,
          }],
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
        <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
          Feedback & Análisis IA
        </h3>
        <button
          onClick={loadFeedback}
          disabled={loading}
          className="btn-primary text-[10px] py-1.5 px-4 flex items-center gap-1.5"
        >
          {loading ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando...</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg> Generar análisis</>
          )}
        </button>
      </div>
      {feedback ? (
        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap
                        bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
          {feedback}
        </div>
      ) : (
        <p className="font-mono text-[10px] text-slate-400">
          Presiona "Generar análisis" para obtener feedback personalizado de IA sobre tu proceso de postulación.
        </p>
      )}
    </div>
  );
}

// Helper to satisfy TypeScript in AiFeedbackPanel
function computeStats(apps: Application[]) {
  return {
    total: apps.length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    pending: apps.filter(a => a.status === 'pending' || a.status === 'in_process').length,
    avgAts: apps.length ? Math.round(apps.filter(a => a.atsScore).reduce((s, a) => s + (a.atsScore ?? 0), 0) / (apps.filter(a => a.atsScore).length || 1)) : 0,
    acceptRate: apps.length ? Math.round((apps.filter(a => a.status === 'accepted').length / apps.length) * 100) : 0,
  };
}
