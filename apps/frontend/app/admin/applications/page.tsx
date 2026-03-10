'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { DashboardLayout } from '../../../components/ui/DashboardLayout';
import { PermissionGate } from '../../../components/ui/PermissionGate';
import { useFadeInUp, useStaggerIn } from '../../../hooks/useAnime';

const ALLOWED_ROLES = ['superadmin', 'admin', 'client'];

// ─── Types ────────────────────────────────────────────────────────────────────
type AppStatus = 'pending' | 'accepted' | 'rejected' | 'in_process';
type Tab = 'list' | 'new' | 'base-cv' | 'dashboard';

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



// ─── Icons ────────────────────────────────────────────────────────────────────
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconUpload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconSpark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
  </svg>
);
const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const Spinner = ({ sm }: { sm?: boolean }) => (
  <span className={`${sm ? 'w-3 h-3 border-[1.5px]' : 'w-4 h-4 border-2'} border-current/30 border-t-current rounded-full animate-spin`} />
);

// ─── ATS Score Ring ───────────────────────────────────────────────────────────
function AtsRing({ score, large }: { score: number; large?: boolean }) {
  const color = score >= 80 ? '#34d399' : score >= 55 ? '#38bdf8' : '#f59e0b';
  const size = large ? 64 : 48;
  const r = large ? 27 : 20;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className={`absolute font-mono font-bold ${large ? 'text-[12px]' : 'text-[10px]'}`} style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

// ─── App Card ─────────────────────────────────────────────────────────────────
function AppCard({ app, onStatusChange, t }: {
  app: Application;
  onStatusChange: (id: string, status: AppStatus) => void;
  t: { applications: Record<string, string> };
}) {
  const statusMap: Record<AppStatus, { label: string; color: string }> = {
    pending:    { label: t.applications.statusPending,   color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5' },
    in_process: { label: t.applications.statusInProcess, color: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5' },
    accepted:   { label: t.applications.statusAccepted,  color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5' },
    rejected:   { label: t.applications.statusRejected,  color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5' },
  };
  const meta = statusMap[app.status];
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
              {(Object.keys(statusMap) as AppStatus[]).map(s => (
                <option key={s} value={s}>{statusMap[s].label}</option>
              ))}
            </select>
            <button className="font-mono text-[10px] flex items-center gap-1.5 text-sky-600 dark:text-sky-400
                               border border-sky-200 dark:border-sky-400/30 rounded px-2 py-0.5
                               hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all">
              <IconDownload />
              {app.cvGenerated ? t.applications.regenerateCV : t.applications.generateCV}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Uploader ─────────────────────────────────────────────────────────────
function PdfCVUploader({ onExtracted, t }: {
  onExtracted: (cv: Partial<BaseCV>) => void;
  t: { applications: Record<string, string> };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { setError(t.applications.pdfOnlyPDF); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t.applications.pdfTooLarge); return; }
    setError(''); setLoading(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
      });

      // All AI calls go through our Next.js API → NestJS backend (no CORS issues)
      const res = await fetch('/api/applications/extract-cv', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pdfBase64: base64 }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json() as Partial<BaseCV>;
      onExtracted(parsed);
    } catch (e) {
      setError(t.applications.pdfExtractError);
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
          <IconFile />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {t.applications.pdfUploaderTitle}
          </p>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
            {t.applications.pdfUploaderDesc}
          </p>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg
                     font-mono text-[10px] uppercase tracking-widest
                     bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><Spinner sm /> {t.applications.pdfExtracting}</> : <><IconUpload /> {t.applications.pdfUploadBtn}</>}
        </button>
      </div>
      {error && <p className="mt-3 font-mono text-[10px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ─── AI Feedback Panel ────────────────────────────────────────────────────────
function AiFeedbackPanel({ stats, apps, t }: {
  stats: { total: number; accepted: number; rejected: number; pending: number; avgAts: number; acceptRate: number };
  apps: Application[];
  t: { applications: Record<string, string> };
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadFeedback() {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/feedback', {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { feedback: string };
      setFeedback(data.feedback || 'No se pudo generar feedback.');
    } catch { setFeedback('Error al conectar con la IA.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
          {t.applications.feedbackTitle}
        </h3>
        <button onClick={loadFeedback} disabled={loading}
          className="btn-primary text-[10px] py-1.5 px-4 flex items-center gap-1.5">
          {loading ? <><Spinner sm /> {t.applications.feedbackGenerating}</> : <><IconSpark /> {t.applications.feedbackGenerate}</>}
        </button>
      </div>
      {feedback
        ? <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap
                          bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
            {feedback}
          </pre>
        : <p className="font-mono text-[10px] text-slate-400">{t.applications.feedbackEmpty}</p>
      }
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(ALLOWED_ROLES);


  const [tab, setTab] = useState<Tab>('base-cv');
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [baseCV, setBaseCV] = useState<BaseCV>(EMPTY_CV);
  const [cvSaving, setCvSaving] = useState(false);
  const [cvExtracted, setCvExtracted] = useState(false);
  const [cvSaved, setCvSaved] = useState(false);
  const [cvEvalLoading, setCvEvalLoading] = useState(false);
  const [cvScore, setCvScore] = useState<number | null>(null);
  const [cvEvalSummary, setCvEvalSummary] = useState('');
  const [cvFieldFeedback, setCvFieldFeedback] = useState<Record<string, string>>({});

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
    setAppsLoading(true);
    try {
      const res = await fetch('/api/applications', { headers: getHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json() as Application[];
      setApps(Array.isArray(data) ? data : []);
    } catch { setApps([]); }
    finally { setAppsLoading(false); }
  }, []);

  const loadBaseCV = useCallback(async () => {
    // Try backend first, fall back to localStorage cache
    try {
      const res = await fetch('/api/applications/base-cv', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json() as BaseCV;
        if (data && data.fullName !== undefined) {
          setBaseCV({ ...EMPTY_CV, ...data });
          // Keep localStorage in sync as offline cache
          localStorage.setItem('ailab_base_cv', JSON.stringify(data));
          return;
        }
      }
    } catch { /* fallback */ }
    // Offline fallback: read from localStorage
    try {
      const raw = localStorage.getItem('ailab_base_cv');
      if (raw) setBaseCV({ ...EMPTY_CV, ...JSON.parse(raw) as BaseCV });
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadApps();
      loadBaseCV();
    }
  }, [authLoading, user, loadApps, loadBaseCV]);

  async function evaluateCV(cvOverride?: BaseCV) {
    setCvEvalLoading(true);
    try {
      const res = await fetch('/api/applications/base-cv/evaluate', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify(cvOverride ?? baseCV),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { score: number; summary: string; fieldFeedback: Record<string, string>; approved: boolean };
      setCvScore(data.score);
      setCvEvalSummary(data.summary);
      setCvFieldFeedback(data.fieldFeedback ?? {});
      if (data.approved) showToast(t.applications.cvEvalApproved, 'ok');
      else showToast(t.applications.cvEvalNeedsWork, 'err');
    } catch {
      showToast(t.applications.toastCVSaveError, 'err');
    } finally {
      setCvEvalLoading(false);
    }
  }

  function downloadBaseCV() {
    const lines = [
      baseCV.fullName, baseCV.email, baseCV.phone,
      baseCV.location, baseCV.linkedIn, '',
      'RESUMEN PROFESIONAL', baseCV.summary, '',
      'EXPERIENCIA', baseCV.experience, '',
      'EDUCACIÓN', baseCV.education, '',
      'HABILIDADES', baseCV.skills, '',
      'IDIOMAS', baseCV.languages, '',
      'CERTIFICACIONES', baseCV.certifications,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (baseCV.fullName || 'cv-base').replace(/\s+/g, '-').toLowerCase() + '-cv-base.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function saveBaseCV() {
    setCvSaving(true);
    try {
      if (!cvScore || cvScore < 85) {
        showToast(t.applications.cvEvalRequired, 'err');
        return;
      }
      const res = await fetch('/api/applications/base-cv', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...baseCV, cvScore }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Cache locally for offline use
      localStorage.setItem('ailab_base_cv', JSON.stringify(baseCV));
      setCvExtracted(false);
      showToast(t.applications.toastCVSaved, 'ok');
      setCvSaved(true);
      // If CV is now complete, take the user to the postulations list
      if (isCVComplete(baseCV)) { setTab('list'); loadApps(); }
    } catch { showToast(t.applications.toastCVSaveError, 'err'); }
    finally { setCvSaving(false); }
  }

  function handlePdfExtracted(extracted: Partial<BaseCV>) {
    const merged = { ...EMPTY_CV, ...extracted };
    setBaseCV(merged);
    setCvExtracted(true);
    setCvScore(null); setCvFieldFeedback({}); setCvSaved(false);
    showToast(t.applications.toastPDFExtractOK, 'ok');
    // Auto-evaluate immediately after PDF extraction so user sees field feedback right away
    if (merged.fullName && merged.summary && merged.experience) {
      setTimeout(() => evaluateCV(merged), 300);
    }
  }

  async function updateStatus(id: string, status: AppStatus) {
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }),
      });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { showToast(t.applications.toastStatusError, 'err'); }
  }

  async function generateATSCv() {
    if (!newForm.company || !newForm.position || !newForm.jobOffer) {
      showToast(t.applications.toastFormIncomplete, 'err'); return;
    }
    setGenerating(true); setGeneratedCV(null); setAtsScore(null);
    try {
      // Backend loads the user's base CV from DB automatically
      const res = await fetch('/api/applications/generate-cv', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          company: newForm.company,
          position: newForm.position,
          jobOffer: newForm.jobOffer,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { atsScore: number; cvText: string };
      setAtsScore(data.atsScore ?? 70);
      setGeneratedCV(data.cvText ?? '');
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.applications.toastGenerateError, 'err');
    }
    finally { setGenerating(false); }
  }

  async function saveApplication() {
    if (!generatedCV || atsScore === null) return;
    try {
      await fetch('/api/applications', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ ...newForm, atsScore, cvGenerated: true, generatedCvText: generatedCV }),
      });
      showToast(t.applications.toastAppSaved, 'ok');
      setNewForm({ company: '', position: '', jobOffer: '' });
      setGeneratedCV(null); setAtsScore(null);
      setTab('list'); loadApps();
    } catch { showToast(t.applications.toastAppSaveError, 'err'); }
  }

  function exportPDF() {
    if (!generatedCV) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>CV ATS — ${newForm.position} @ ${newForm.company}</title>
<style>body{font-family:Arial,sans-serif;font-size:11pt;margin:2cm;color:#1a1a1a;line-height:1.5}pre{white-space:pre-wrap;font-family:inherit}@page{margin:2cm}</style>
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

  // ── Auth loading ────────────────────────────────────────────────────────────
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }

  const variant = (user.role === 'client' ? 'client' : 'admin') as 'admin' | 'client';

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout variant={variant} user={user} title={t.applications.pageTitle}>
      <PermissionGate module="applications">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-16">

        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-2">
            {t.applications.moduleLabel}
          </p>
          <h1 className="headline text-4xl md:text-5xl text-slate-900 dark:text-white">
            {t.applications.pageTitle}
          </h1>
          <p className="font-mono text-[11px] text-slate-400 mt-2">
            {t.applications.pageSubtitle}
          </p>
        </div>

        {/* CV Base warning banner */}
        {!cvComplete && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-400/30
                          bg-amber-50 dark:bg-amber-400/5 flex items-start gap-3">
            <span className="text-amber-500 shrink-0 mt-0.5"><IconWarning /></span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {t.applications.cvBaseIncompleteTitle}
              </p>
              <p className="font-mono text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                {t.applications.cvBaseIncompleteDesc}
              </p>
            </div>
            <button onClick={() => setTab('base-cv')}
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg
                         bg-amber-500 hover:bg-amber-600 text-white transition-colors whitespace-nowrap">
              {t.applications.cvBaseConfigureBtn}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {([
            { key: 'base-cv',   label: t.applications.tabBaseCV,   requiresCV: false },
            { key: 'list',      label: t.applications.tabList,      requiresCV: true  },
            { key: 'new',       label: t.applications.tabNew,       requiresCV: true  },
            { key: 'dashboard', label: t.applications.tabDashboard, requiresCV: true  },
          ] as { key: Tab; label: string; requiresCV: boolean }[]).map(tb => {
            const disabled = tb.requiresCV && !cvComplete;
            return (
              <button key={tb.key}
                onClick={() => !disabled && setTab(tb.key)}
                disabled={disabled}
                title={disabled ? t.applications.cvBaseIncomplete : undefined}
                className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest shrink-0 -mb-px border-b-2 transition-all
                  ${disabled
                    ? 'border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                    : tab === tb.key
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}>
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: LIST ────────────────────────────────────────────────────── */}
        {tab === 'list' && (
          appsLoading ? (
            <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <Spinner /> {t.applications.loadingApps}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="font-mono text-[12px] text-slate-400">{t.applications.noApps}</p>
              <button onClick={() => setTab(cvComplete ? 'new' : 'base-cv')}
                className="btn-primary text-[10px] py-2 px-4 mt-4">
                {cvComplete ? t.applications.createFirstApp : t.applications.configureCVFirst}
              </button>
            </div>
          ) : (
            <div ref={listRef} className="space-y-3">
              {apps.map(app => (
                <AppCard key={app.id} app={app} onStatusChange={updateStatus} t={t as { applications: Record<string, string> }} />
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
                <IconWarning />
              </div>
              <p className="font-mono text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                {t.applications.cvRequiredTitle}
              </p>
              <p className="font-mono text-[11px] text-slate-400 max-w-sm mx-auto">
                {t.applications.cvRequiredDesc}
              </p>
              <button onClick={() => setTab('base-cv')} className="btn-primary text-[11px] py-2.5 px-6 mx-auto">
                {t.applications.goToBaseCV}
              </button>
            </div>
          ) : !generatedCV ? (
            <div className="card p-6 space-y-5">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
                {t.applications.newAppFormTitle}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                    {t.applications.fieldCompany} {t.applications.fieldRequired}
                  </label>
                  <input value={newForm.company} onChange={e => setNewForm(p => ({ ...p, company: e.target.value }))}
                    placeholder={t.applications.fieldCompanyPlaceholder} className="input-field" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                    {t.applications.fieldPosition} {t.applications.fieldRequired}
                  </label>
                  <input value={newForm.position} onChange={e => setNewForm(p => ({ ...p, position: e.target.value }))}
                    placeholder={t.applications.fieldPositionPlaceholder} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1.5">
                  {t.applications.fieldJobOffer} {t.applications.fieldRequired}
                </label>
                <textarea value={newForm.jobOffer} onChange={e => setNewForm(p => ({ ...p, jobOffer: e.target.value }))}
                  rows={8} placeholder={t.applications.fieldJobOfferPlaceholder}
                  className="input-field resize-y font-mono text-[11px]" />
              </div>
              <button onClick={generateATSCv} disabled={generating}
                className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2">
                {generating
                  ? <><Spinner sm /> {t.applications.generatingCV}</>
                  : <><IconSpark /> {t.applications.generateATSBtn}</>
                }
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {atsScore !== null && (
                <div className="card p-5 flex items-center gap-5">
                  <AtsRing score={atsScore} large />
                  <div>
                    <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                      {t.applications.atsScoreLabel}: {atsScore}%
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {atsScore >= 80 ? t.applications.atsExcellent
                        : atsScore >= 55 ? t.applications.atsGood
                        : t.applications.atsLow}
                    </p>
                  </div>
                </div>
              )}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    {t.applications.generatedCVTitle}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={exportPDF}
                      className="font-mono text-[10px] flex items-center gap-1.5
                                 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5
                                 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      <IconDownload /> {t.applications.exportPDF}
                    </button>
                    <button onClick={() => setGeneratedCV(null)}
                      className="font-mono text-[10px] border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5
                                 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      {t.applications.editBack}
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
                <IconSave /> {t.applications.saveApplication}
              </button>
            </div>
          )
        )}

        {/* ── TAB: BASE CV ─────────────────────────────────────────────────── */}
        {tab === 'base-cv' && (
          <div className="space-y-6">

            {/* PDF Import */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">
                  {t.applications.importFromPDF}
                </h2>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full
                                 bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400
                                 border border-sky-200 dark:border-sky-400/20">IA</span>
              </div>
              <PdfCVUploader onExtracted={handlePdfExtracted} t={t as { applications: Record<string, string> }} />
              {cvExtracted && (
                <p className="mt-3 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <IconCheck /> {t.applications.pdfExtractSuccess}
                </p>
              )}
            </div>

            {/* Manual form */}
            <div className="card p-6 space-y-8">
              <div>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-1">
                  {t.applications.baseCVTitle}
                </h2>
                <p className="font-mono text-[10px] text-slate-400">{t.applications.baseCVDesc}</p>
              </div>

              {/* ── Contact fields ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {([
                  { key: 'fullName', label: t.applications.fieldFullName,   hint: t.applications.hintFullName },
                  { key: 'email',    label: t.applications.fieldEmail,       hint: t.applications.hintEmail },
                  { key: 'phone',    label: t.applications.fieldPhone,       hint: t.applications.hintPhone },
                  { key: 'location', label: t.applications.fieldLocation,    hint: t.applications.hintLocation },
                  { key: 'linkedIn', label: t.applications.fieldLinkedIn,    hint: t.applications.hintLinkedIn },
                ] as { key: string; label: string; hint: string }[]).map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400">{f.label}</label>
                    <input value={baseCV[f.key as keyof BaseCV]}
                      onChange={e => { setBaseCV(p => ({ ...p, [f.key]: e.target.value })); setCvScore(null); setCvFieldFeedback({}); setCvSaved(false); }}
                      className="input-field" />
                    {/* ATS hack tip */}
                    {!cvFieldFeedback[f.key === 'phone' || f.key === 'location' || f.key === 'linkedIn' ? 'contact' : f.key] ? (
                      <p className="font-mono text-[9.5px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        <svg className="inline w-3 h-3 mr-1 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{f.hint}
                      </p>
                    ) : (
                      <p className="font-mono text-[9.5px] text-amber-600 dark:text-amber-400 leading-relaxed">
                        <svg className="inline w-3 h-3 mr-1 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>{cvFieldFeedback[f.key === 'phone' || f.key === 'location' || f.key === 'linkedIn' ? 'contact' : f.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Long-form fields ── */}
              {([
                {
                  key: 'summary', label: t.applications.fieldSummary, rows: 5,
                  placeholder: t.applications.fieldSummaryPlaceholder,
                  hint: t.applications.hintSummary,
                },
                {
                  key: 'experience', label: t.applications.fieldExperience, rows: 10,
                  placeholder: t.applications.fieldExperiencePlaceholder,
                  hint: t.applications.hintExperience,
                },
                {
                  key: 'education', label: t.applications.fieldEducation, rows: 3,
                  placeholder: t.applications.fieldEducationPlaceholder,
                  hint: t.applications.hintEducation,
                },
                {
                  key: 'skills', label: t.applications.fieldSkills, rows: 3,
                  placeholder: t.applications.fieldSkillsPlaceholder,
                  hint: t.applications.hintSkills,
                },
                {
                  key: 'languages', label: t.applications.fieldLanguages, rows: 2,
                  placeholder: t.applications.fieldLanguagesPlaceholder,
                  hint: t.applications.hintLanguages,
                },
                {
                  key: 'certifications', label: t.applications.fieldCertifications, rows: 2,
                  placeholder: t.applications.fieldCertificationsPlaceholder,
                  hint: t.applications.hintCertifications,
                },
              ] as { key: string; label: string; rows: number; placeholder: string; hint: string }[]).map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400">{f.label}</label>
                  <textarea value={baseCV[f.key as keyof BaseCV]}
                    onChange={e => { setBaseCV(p => ({ ...p, [f.key]: e.target.value })); setCvScore(null); setCvFieldFeedback({}); setCvSaved(false); }}
                    rows={f.rows} placeholder={f.placeholder}
                    className="input-field resize-y font-mono text-[11px] leading-relaxed" />
                  {/* Show AI feedback if available, otherwise static ATS hint */}
                  {cvFieldFeedback[f.key] ? (
                    <p className="font-mono text-[9.5px] text-amber-600 dark:text-amber-400 leading-relaxed">
                      <svg className="inline w-3 h-3 mr-1 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>{cvFieldFeedback[f.key]}
                    </p>
                  ) : (
                    <p className="font-mono text-[9.5px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      <svg className="inline w-3 h-3 mr-1 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{f.hint}
                    </p>
                  )}
                </div>
              ))}

              {/* ── Evaluate + Score panel ── */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                      {t.applications.cvEvalTitle}
                    </p>
                    <p className="font-mono text-[9.5px] text-slate-400 mt-0.5">
                      {t.applications.cvEvalDesc}
                    </p>
                  </div>
                  <button
                    onClick={evaluateCV}
                    disabled={cvEvalLoading || !baseCV.fullName || !baseCV.summary || !baseCV.experience}
                    className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2 shrink-0
                               disabled:opacity-40 disabled:cursor-not-allowed">
                    {cvEvalLoading ? <><Spinner sm /> {t.applications.cvEvalRunning}</> : t.applications.cvEvalBtn}
                  </button>
                </div>

                {cvScore !== null && (
                  <div className="space-y-3">
                    {/* Score bar */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              cvScore >= 85 ? 'bg-emerald-500' : cvScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${cvScore}%` }}
                          />
                        </div>
                      </div>
                      <span className={`font-mono text-[13px] font-bold tabular-nums ${
                        cvScore >= 85 ? 'text-emerald-600 dark:text-emerald-400'
                        : cvScore >= 60 ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                      }`}>{cvScore}/100</span>
                      {cvScore >= 85 && (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-400/10
                                         text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/20">
                          ✓ {t.applications.cvEvalApprovedBadge}
                        </span>
                      )}
                    </div>
                    {/* Summary line */}
                    {cvEvalSummary && (
                      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 italic">
                        "{cvEvalSummary}"
                      </p>
                    )}
                    {/* Required score hint */}
                    {cvScore < 85 && (
                      <p className="font-mono text-[9.5px] text-amber-600 dark:text-amber-400">
                        {t.applications.cvEvalNeedMore.replace('{n}', String(85 - cvScore))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Save + Download buttons ── */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={saveBaseCV}
                  disabled={cvSaving || !cvScore || cvScore < 85}
                  className="btn-primary text-[11px] py-2.5 px-6 flex items-center gap-2
                             disabled:opacity-40 disabled:cursor-not-allowed">
                  {cvSaving
                    ? <><Spinner sm /> {t.applications.savingBaseCV}</>
                    : <><IconSave /> {t.applications.saveBaseCV}</>
                  }
                </button>
                {cvSaved && (
                  <button
                    onClick={downloadBaseCV}
                    className="btn-ghost text-[10px] py-2 px-4 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {t.applications.downloadBaseCV}
                  </button>
                )}
                {!cvScore && !cvSaved && (
                  <span className="font-mono text-[10px] text-slate-400">
                    {t.applications.cvEvalBeforeSave}
                  </span>
                )}
                {cvComplete && cvScore && cvScore >= 85 && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {t.applications.baseCVComplete}
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
                { label: t.applications.statTotal,       value: stats.total,           color: 'text-slate-800 dark:text-slate-200' },
                { label: t.applications.statAccepted,    value: stats.accepted,        color: 'text-emerald-600 dark:text-emerald-400' },
                { label: t.applications.statRejected,    value: stats.rejected,        color: 'text-red-600 dark:text-red-400' },
                { label: t.applications.statSuccessRate, value: `${stats.acceptRate}%`, color: 'text-sky-600 dark:text-sky-400' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={`headline text-4xl ${s.color}`}>{s.value}</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {stats.avgAts > 0 && (
              <div className="card p-5 flex items-center gap-5">
                <AtsRing score={stats.avgAts} large />
                <div>
                  <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                    {t.applications.avgATSLabel}: {stats.avgAts}%
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                    {t.applications.avgATSBased.replace('{n}', String(apps.filter(a => a.atsScore).length))}
                  </p>
                </div>
              </div>
            )}

            {stats.total >= 2
              ? <AiFeedbackPanel stats={stats} apps={apps} t={t as { applications: Record<string, string> }} />
              : (
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <p className="font-mono text-[11px] text-slate-400">{t.applications.needMoreApps}</p>
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
      </PermissionGate>
    </DashboardLayout>
  );
}

