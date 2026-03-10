'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { useFadeInUp } from '../../../hooks/useAnime';
import { DashboardLayout } from '../../../components/ui/DashboardLayout';
import { PermissionGate } from '../../../components/ui/PermissionGate';
import { AppCard }            from './_components/AppCard';
import { BaseCVForm }         from './_components/BaseCVForm';
import { NewApplicationForm } from './_components/NewApplicationForm';
import { AiFeedbackPanel }    from './_components/AiFeedbackPanel';
import { Spinner }            from './_components/icons';
import { Application, AppStatus, BaseCV, EMPTY_CV, getHeaders, isCVComplete, Tab } from './_components/types';

const ALLOWED_ROLES = ['superadmin', 'admin', 'client'];

function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl shadow-xl font-mono text-[11px]
                     ${type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {msg}
    </div>
  );
}

export default function ApplicationsPage() {
  const { t, locale }  = useI18n();
  const { user, loading: authLoading } = useAuth(ALLOWED_ROLES);

  const [tab, setTab]         = useState<Tab>('base-cv');
  const [apps, setApps]       = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [baseCV, setBaseCV]   = useState<BaseCV>(EMPTY_CV);
  const [toast, setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const headerRef  = useFadeInUp<HTMLDivElement>({ delay: 0, duration: 500 });
  const cvComplete = isCVComplete(baseCV);

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const loadApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res  = await fetch('/api/applications', { headers: getHeaders() });
      const data = await res.json() as Application[];
      setApps(Array.isArray(data) ? data : []);
    } catch { setApps([]); }
    finally { setAppsLoading(false); }
  }, []);

  const loadBaseCV = useCallback(async () => {
    try {
      const res = await fetch('/api/applications/base-cv', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json() as BaseCV;
        if (data?.fullName !== undefined) {
          setBaseCV({ ...EMPTY_CV, ...data });
          localStorage.setItem('ailab_base_cv', JSON.stringify(data));
          return;
        }
      }
    } catch { /* fallback */ }
    try {
      const raw = localStorage.getItem('ailab_base_cv');
      if (raw) setBaseCV({ ...EMPTY_CV, ...JSON.parse(raw) as BaseCV });
    } catch { /* defaults */ }
  }, []);

  useEffect(() => {
    if (!authLoading && user) { loadApps(); loadBaseCV(); }
  }, [authLoading, user, loadApps, loadBaseCV]);

  async function updateStatus(id: string, status: AppStatus) {
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }),
      });
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch { showToast(t.applications.toastStatusError, 'err'); }
  }

  async function deleteApp(id: string) {
    try {
      await fetch(`/api/applications/${id}`, { method: 'DELETE', headers: getHeaders() });
      setApps(prev => prev.filter(a => a.id !== id));
      showToast(t.applications.toastAppDeleted ?? 'Postulación eliminada', 'ok');
    } catch { showToast(t.applications.toastStatusError, 'err'); }
  }

  function updateApp(id: string, patch: Partial<import('./_components/types').Application>) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }

  const accepted   = apps.filter(a => a.status === 'accepted').length;
  const rejected   = apps.filter(a => a.status === 'rejected').length;
  const pending    = apps.filter(a => a.status === 'pending').length;
  const withAts    = apps.filter(a => a.atsScore);
  const avgAts     = withAts.length ? Math.round(withAts.reduce((s,a) => s+(a.atsScore??0),0)/withAts.length) : 0;
  const acceptRate = apps.length ? Math.round((accepted/apps.length)*100) : 0;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }

  const variant = (user.role === 'client' ? 'client' : 'admin') as 'admin' | 'client';
  const TABS = [
    { key: 'base-cv'   as Tab, label: t.applications.tabBaseCV,   requiresCV: false },
    { key: 'list'      as Tab, label: t.applications.tabList,      requiresCV: true  },
    { key: 'new'       as Tab, label: t.applications.tabNew,       requiresCV: true  },
    { key: 'dashboard' as Tab, label: t.applications.tabDashboard, requiresCV: true  },
  ];

  return (
    <DashboardLayout variant={variant} user={user} title={t.applications.pageTitle}>
      <PermissionGate module="applications">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-16">

          {/* Header */}
          <div ref={headerRef} className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-2">
              {t.applications.moduleLabel}
            </p>
            <h1 className="font-mono text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.applications.pageTitle}
            </h1>
            <p className="font-mono text-[12px] text-slate-400 mt-3">{t.applications.pageSubtitle}</p>
          </div>

          {/* CV incomplete warning */}
          {!cvComplete && tab !== 'base-cv' && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/5">
              <div className="flex-1">
                <p className="font-mono text-[11px] font-semibold text-amber-800 dark:text-amber-300">{t.applications.cvBaseIncompleteTitle}</p>
                <p className="font-mono text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">{t.applications.cvBaseIncompleteDesc}</p>
              </div>
              <button onClick={() => setTab('base-cv')}
                className="shrink-0 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors whitespace-nowrap">
                {t.applications.cvBaseConfigureBtn}
              </button>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex items-center gap-0 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            {TABS.map(tb => {
              const disabled = tb.requiresCV && !cvComplete;
              return (
                <button key={tb.key} onClick={() => !disabled && setTab(tb.key)} disabled={disabled}
                  title={disabled ? t.applications.cvBaseIncompleteTitle : undefined}
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

          {/* ── BASE CV tab ─────────────────────────────────────────────── */}
          {tab === 'base-cv' && (
            <BaseCVForm
              initialCV={baseCV}
              lang={locale}
              onSaved={saved => {
                setBaseCV(saved);
                showToast(t.applications.toastCVSaved, 'ok');
                if (isCVComplete(saved)) { setTab('list'); loadApps(); }
              }}
              t={t as { applications: Record<string, string> }}
            />
          )}

          {/* ── LIST tab ───────────────────────────────────────────────── */}
          {tab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-slate-400">{apps.length} {t.applications.statTotal.toLowerCase()}</span>
                <button onClick={() => setTab('new')} className="btn-primary text-[11px] py-2 px-4">{t.applications.tabNew}</button>
              </div>
              {appsLoading ? (
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400"><Spinner /> {t.applications.loadingApps}</div>
              ) : apps.length === 0 ? (
                <div className="card p-8 text-center space-y-3">
                  <p className="font-mono text-[13px] text-slate-500">{t.applications.noApps}</p>
                  <button onClick={() => setTab('new')} className="btn-primary text-[11px] py-2.5 px-6 mx-auto">
                    {cvComplete ? t.applications.createFirstApp : t.applications.configureCVFirst}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apps.map(app => (
                    <AppCard key={app.id} app={app}
                      userRole={user.role}
                      onStatusChange={updateStatus}
                      onDelete={deleteApp}
                      onUpdate={updateApp}
                      t={t as { applications: Record<string, string> }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NEW tab ────────────────────────────────────────────────── */}
          {tab === 'new' && (
            <NewApplicationForm
              cvComplete={cvComplete}
              lang={locale}
              onSaved={() => { showToast(t.applications.toastAppSaved, 'ok'); setTab('list'); loadApps(); }}
              onGoToBaseCV={() => setTab('base-cv')}
              t={t as { applications: Record<string, string> }}
            />
          )}

          {/* ── DASHBOARD tab ──────────────────────────────────────────── */}
          {tab === 'dashboard' && (
            <AiFeedbackPanel
              stats={{ total: apps.length, accepted, rejected, pending, avgAts, acceptRate }}
              apps={apps}
              t={t as { applications: Record<string, string> }}
            />
          )}

        </div>
      </PermissionGate>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </DashboardLayout>
  );
}
