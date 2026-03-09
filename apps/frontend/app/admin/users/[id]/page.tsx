'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../../../lib/i18n-context';
import { useAuth } from '../../../../hooks/useAuth';
import { DashboardLayout } from '../../../../components/ui/DashboardLayout';
import { useFadeInUp, useStaggerIn } from '../../../../hooks/useAnime';
import { usePermissions, MODULE_PERMISSION_KEYS } from '../../../../hooks/usePermissions';

const ADMIN_ROLES = ['superadmin', 'admin'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'client';
  isActive: boolean;
  createdAt: string;
  permissions: {
    checklist: boolean;
    applications: boolean;
  };
}

// ─── Permission modules config ────────────────────────────────────────────────
const PERMISSION_MODULES = [
  {
    key: 'checklist',
    label: 'Checklists',
    description: 'Acceso al módulo de checklists con IA',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    key: 'applications',
    label: 'Postulaciones & CV ATS',
    description: 'Acceso al módulo de postulaciones con generación de CV optimizado por IA',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="12.01"/>
      </svg>
    ),
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// Permissions managed via usePermissions hook (see hooks/usePermissions.ts)

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5',
  admin: 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
  client: 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40',
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({
  enabled,
  onChange,
  loading,
}: { enabled: boolean; onChange: (v: boolean) => void; loading?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full
                  border-2 border-transparent
                  transition-colors duration-200 ease-in-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
                  ${enabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}
                  ${loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md
                    ring-0 transition-transform duration-200 ease-in-out
                    ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const { t } = useI18n();
  const { user: authUser, loading: authLoading } = useAuth(ADMIN_ROLES);
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const isSuperAdmin = authUser?.role === 'superadmin';

  const headerRef = useFadeInUp<HTMLDivElement>({ delay: 0, duration: 500 });
  const cardsRef = useStaggerIn<HTMLDivElement>({ delay: 100, stagger: 80 });

  // Build a fake AuthUser for usePermissions — we need to read the target user's perms
  // usePermissions reads from localStorage keyed by userId
  const targetFakeUser = userId ? { userId, email: '', name: '', role: 'client' as const } : null;
  const { permissions: targetPerms, toggle: togglePerm, ready: permsReady } = usePermissions(targetFakeUser);

  // Load user detail
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { headers: getHeaders() });
      const data = await res.json() as UserDetail;
      // permissions will be injected from usePermissions below
      data.permissions = {};
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && authUser) load();
  }, [authLoading, authUser, load]);

  // Show toast helper
  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Toggle permission via usePermissions hook (persisted to localStorage)
  function togglePermission(permKey: string, current: boolean) {
    if (!isSuperAdmin || !detail) return;
    setPermLoading(permKey);
    try {
      togglePerm(permKey, !current);
      showToast(
        `${permKey === 'checklist' ? 'Checklists' : 'Postulaciones'} ${!current ? 'habilitado' : 'deshabilitado'}`,
        'ok'
      );
    } catch {
      showToast('Error al actualizar permiso', 'err');
    } finally {
      setPermLoading(null);
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-5 h-5 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout variant="admin" user={authUser} title={t.nav.users}>
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">

        {/* Back */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest
                     text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-8"
        >
          ← {t.nav.users}
        </Link>

        {loading ? (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
            Cargando usuario...
          </div>
        ) : !detail ? (
          <p className="font-mono text-[11px] text-red-500">Usuario no encontrado.</p>
        ) : (
          <>
            {/* User header card */}
            <div ref={headerRef} className="card p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-400/20
                                  border-2 border-sky-200 dark:border-sky-400/30
                                  flex items-center justify-center
                                  font-mono text-xl font-bold text-sky-600 dark:text-sky-400">
                    {detail.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="headline text-2xl text-slate-900 dark:text-white">{detail.name}</h1>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{detail.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_STYLES[detail.role] ?? ''}`}>
                        {detail.role}
                      </span>
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border
                        ${detail.isActive
                          ? 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5'
                          : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5'
                        }`}>
                        {detail.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  <span className="text-slate-300 dark:text-slate-600 block text-[9px] uppercase tracking-widest mb-1">Miembro desde</span>
                  {new Date(detail.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Permissions section */}
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Permisos de módulos
              </h2>
              {!isSuperAdmin && (
                <span className="font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  Solo superadmin puede modificar
                </span>
              )}
            </div>

            <div ref={cardsRef} className="grid gap-4 sm:grid-cols-2">
              {PERMISSION_MODULES.map(mod => {
                const enabled = permsReady ? (targetPerms[mod.key] === true) : true;
                return (
                  <div key={mod.key}
                    className={`card p-5 transition-all duration-200
                      ${enabled ? '' : 'opacity-60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 ${enabled ? 'text-sky-500' : 'text-slate-400'}`}>
                          {mod.icon}
                        </span>
                        <div>
                          <p className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                            {mod.label}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 mt-1 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={enabled}
                        onChange={() => togglePermission(mod.key, enabled)}
                        loading={permLoading === mod.key || !isSuperAdmin}
                      />
                    </div>

                    <div className={`mt-3 pt-3 border-t border-slate-100 dark:border-slate-800
                                    font-mono text-[9px] uppercase tracking-widest
                                    ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {enabled ? '● Habilitado' : '○ Deshabilitado'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
