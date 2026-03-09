'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '../../../lib/i18n-context';
import { useAuth } from '../../../hooks/useAuth';
import { DashboardLayout } from '../../../components/ui/DashboardLayout';

const ADMIN_ROLES = ['superadmin', 'admin'];

interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'client';
  isActive: boolean;
  createdAt: string;
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5',
  admin:      'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5',
  client:     'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40',
};

function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth(ADMIN_ROLES);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'client' as User['role'] });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; name: string; active: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { headers: getHeaders() });
      const data = await res.json() as User[];
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  async function handleToggle(id: string, isActive: boolean) {
    setActionLoading(id);
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive }),
      });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive } : u));
      setConfirmToggle(null);
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  }

  async function handleCreate() {
    setCreateError('');
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError(t.checklist.errorRequiredFields);
      return;
    }
    setActionLoading('create');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const d = await res.json() as { message?: string };
        setCreateError(d.message ?? t.common.error);
        return;
      }
      setCreateSuccess(t.users.userCreated);
      setCreateForm({ name: '', email: '', password: '', role: 'client' });
      setTimeout(() => { setCreateModal(false); setCreateSuccess(''); }, 1500);
      await load();
    } catch { setCreateError(t.common.error); }
    finally { setActionLoading(null); }
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    superadmin: users.filter((u) => u.role === 'superadmin').length,
    admin: users.filter((u) => u.role === 'admin').length,
    client: users.filter((u) => u.role === 'client').length,
  };

  if (authLoading || !user) return null;

  return (
    <DashboardLayout variant="admin" user={user} title={t.nav.users}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-16">

        {/* Header */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10
                        flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-3">
              AI Lab — Admin
            </p>
            <h1 className="headline text-5xl md:text-7xl text-slate-900 dark:text-white" suppressHydrationWarning>
              {t.users.title}
            </h1>
            <p className="font-mono text-[11px] text-slate-500 mt-2">
              {counts.total} usuarios · {counts.active} activos
            </p>
          </div>
          {user.role === 'superadmin' && (
            <button onClick={() => setCreateModal(true)}
              className="btn-primary flex items-center gap-2 py-3 px-6 self-start" suppressHydrationWarning>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t.users.createUser}
            </button>
          )}
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.users.superadmin, count: counts.superadmin, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: t.users.admin,      count: counts.admin,      color: 'text-sky-600 dark:text-sky-400' },
            { label: t.users.client,     count: counts.client,     color: 'text-slate-600 dark:text-slate-300' },
            { label: t.users.active,     count: counts.active,     color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`font-mono text-2xl font-bold ${color}`}>{count}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="search" className="input flex-1" placeholder={t.users.search}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input w-full sm:w-44" value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all" suppressHydrationWarning>{t.users.allRoles}</option>
            <option value="superadmin" suppressHydrationWarning>{t.users.superadmin}</option>
            <option value="admin" suppressHydrationWarning>{t.users.admin}</option>
            <option value="client" suppressHydrationWarning>{t.users.client}</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 font-mono text-[11px] text-slate-400">
            <Spinner /> {t.common.loading}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {[t.users.name, t.users.email, t.users.role, t.users.status, t.users.createdAt, t.users.actions, 'Detalle'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-[9px] uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center font-mono text-[11px] text-slate-400">
                      {t.users.noUsers}
                    </td>
                  </tr>
                ) : filtered.map((u) => (
                  <tr key={u.id}
                    className="border-b border-slate-100 dark:border-slate-800/60 last:border-0
                               hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-[12px] text-slate-800 dark:text-slate-200 font-medium">{u.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[11px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${ROLE_STYLES[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border
                        ${u.isActive
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/5'
                          : 'text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        }`} suppressHydrationWarning>
                        {u.isActive ? t.users.active : t.users.inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[10px] text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'superadmin' && user.role === 'superadmin' && (
                        <button
                          onClick={() => setConfirmToggle({ id: u.id, name: u.name, active: u.isActive })}
                          disabled={actionLoading === u.id}
                          className={`font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded border transition-all
                            ${u.isActive
                              ? 'border-amber-200 dark:border-amber-400/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10'
                              : 'border-emerald-200 dark:border-emerald-400/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10'
                            }`}>
                          {actionLoading === u.id ? <Spinner /> : (u.isActive ? t.users.deactivate : t.users.activate)}
                        </button>
                      )}
                    </td>
                    {/* ── Ver detalle link ── */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-mono text-[10px] uppercase tracking-widest
                                   text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300
                                   border border-sky-200 dark:border-sky-400/30 rounded px-2.5 py-1
                                   hover:bg-sky-50 dark:hover:bg-sky-400/10 transition-all
                                   flex items-center gap-1 whitespace-nowrap"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create user modal */}
      {createModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="headline text-2xl text-slate-900 dark:text-white" suppressHydrationWarning>
                {t.users.createUser}
              </h3>
              <button onClick={() => { setCreateModal(false); setCreateError(''); setCreateSuccess(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {createSuccess ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/15
                                flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12l5 5 11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400">{createSuccess}</p>
              </div>
            ) : (
              <>
                {createError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                                  font-mono text-[11px] text-red-600 dark:text-red-400">
                    {createError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="label" suppressHydrationWarning>{t.users.name} *</label>
                    <input type="text" className="input" value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.users.email} *</label>
                    <input type="email" className="input" value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.users.password} *</label>
                    <input type="password" className="input" value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" suppressHydrationWarning>{t.users.role}</label>
                    <select className="input" value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as User['role'] })}>
                      <option value="client" suppressHydrationWarning>{t.users.client}</option>
                      <option value="admin" suppressHydrationWarning>{t.users.admin}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => void handleCreate()} disabled={!!actionLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2" suppressHydrationWarning>
                    {actionLoading === 'create' ? <Spinner /> : t.users.create}
                  </button>
                  <button onClick={() => { setCreateModal(false); setCreateError(''); }}
                    className="btn-ghost flex-1" suppressHydrationWarning>
                    {t.users.cancel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm toggle modal */}
      {confirmToggle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm card p-6 space-y-4 shadow-2xl">
            <h3 className="headline text-xl text-slate-900 dark:text-white" suppressHydrationWarning>
              {confirmToggle.active ? t.users.deactivate : t.users.activate}
            </h3>
            <p className="font-mono text-[11px] text-slate-500">
              <span suppressHydrationWarning>{confirmToggle.active ? t.users.confirmDeactivate : 'Activar a'}</span>{' '}
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{confirmToggle.name}</span>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => void handleToggle(confirmToggle.id, !confirmToggle.active)}
                disabled={!!actionLoading}
                className={`flex-1 py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-widest transition-colors
                  ${confirmToggle.active
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}>
                {actionLoading ? <Spinner /> : confirmToggle.active ? t.users.deactivate : t.users.activate}
              </button>
              <button onClick={() => setConfirmToggle(null)} className="btn-ghost flex-1" suppressHydrationWarning>
                {t.users.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
