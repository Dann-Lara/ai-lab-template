'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/ui/DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useI18n } from '../../../lib/i18n-context';
import Link from 'next/link';
import { TelegramHelpModal } from '../../../components/ui/TelegramHelpModal';

const ADMIN_ROLES = ['superadmin', 'admin'];

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminProfilePage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth(ADMIN_ROLES);

  const [name, setName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/users/me', { headers: getHeaders() })
      .then((r) => r.json())
      .then((d: { name?: string; telegramChatId?: string }) => {
        setName(d.name ?? user.name ?? '');
        setTelegramChatId(d.telegramChatId ?? '');
      })
      .catch(() => { setName(user.name ?? ''); });
  }, [user]);

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ name: name.trim(), telegramChatId: telegramChatId.trim() }),
      });
      if (!res.ok) throw new Error(t.common.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) return null;

  const roleColor = user.role === 'superadmin'
    ? 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5'
    : 'text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-400/30 bg-sky-50 dark:bg-sky-400/5';

  return (
    <DashboardLayout variant="admin" user={user} title={t.nav.profile}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-16">

        {/* ── Header ── */}
        <div className="py-10 border-b border-slate-200 dark:border-slate-800/60 mb-10">
          <Link
            href="/admin"
            className="font-mono text-[10px] text-slate-400 hover:text-sky-500 dark:hover:text-sky-400
                       transition-colors flex items-center gap-1.5 w-fit mb-4"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.profile.section}
          </Link>
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.4em] mb-3"
             suppressHydrationWarning>{t.profile.title}</p>
          <h1 className="headline text-5xl md:text-6xl text-slate-900 dark:text-white"
              suppressHydrationWarning>{t.profile.subtitle}</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded border ${roleColor}`}>
              {user.role}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{user.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Personal info ── */}
          <div className="card p-6 space-y-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400"
               suppressHydrationWarning>{t.profile.personalInfo}</p>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20
                              font-mono text-[11px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {saved && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20
                              font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.profile.saveSuccess}
              </div>
            )}

            <div>
              <label className="label" suppressHydrationWarning>{t.profile.fullName}</label>
              <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label" suppressHydrationWarning>{t.profile.emailLabel}</label>
              <input type="email" className="input opacity-60" value={user.email} disabled />
              <p className="font-mono text-[9px] text-slate-400 mt-1" suppressHydrationWarning>
                {t.profile.emailReadonly}
              </p>
            </div>
            <div>
              <label className="label" suppressHydrationWarning>{t.profile.roleLabel}</label>
              <div className={`inline-flex px-3 py-1.5 rounded border font-mono text-[10px] uppercase tracking-wider ${roleColor}`}>
                {user.role}
              </div>
            </div>
            <button onClick={() => void handleSave()} disabled={saving}
              className="btn-primary flex items-center gap-2 w-full justify-center">
              {saving ? <Spinner /> : t.profile.saveChanges}
            </button>
          </div>

          {/* ── Telegram ── */}
          <div className="space-y-5">
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-400/10
                                border border-sky-200 dark:border-sky-400/20
                                flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                          fill="#229ED9" opacity="0.15"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                          stroke="#229ED9" strokeWidth="1.5"/>
                    <path d="M6 12l2.5 2.5L18 8" stroke="#229ED9" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                     suppressHydrationWarning>{t.profile.telegramTitle}</p>
                  <p className="font-mono text-[9px] text-slate-400" suppressHydrationWarning>
                    {telegramChatId ? t.profile.telegramConnected : t.profile.telegramDisconnected}
                  </p>
                </div>
                <div className="ml-auto">
                  {telegramChatId ? (
                    <span className="font-mono text-[9px] px-2 py-1 rounded border
                                     text-emerald-600 dark:text-emerald-400
                                     border-emerald-200 dark:border-emerald-400/30
                                     bg-emerald-50 dark:bg-emerald-400/5"
                          suppressHydrationWarning>{t.profile.telegramActive}</span>
                  ) : (
                    <span className="font-mono text-[9px] px-2 py-1 rounded border
                                     text-slate-400 border-slate-200 dark:border-slate-700"
                          suppressHydrationWarning>{t.profile.telegramInactive}</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label" suppressHydrationWarning>{t.profile.telegramChatIdLabel}</label>
                  <button
                    onClick={() => setShowTelegramHelp(true)}
                    className="font-mono text-[9px] text-sky-500 dark:text-sky-400
                               hover:text-sky-600 dark:hover:text-sky-300 transition-colors
                               flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M7 6.5v3M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <span suppressHydrationWarning>{t.profile.telegramHowTo}</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="input font-mono"
                  placeholder={t.profile.telegramChatIdPlaceholder}
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
                <p className="font-mono text-[9px] text-slate-400 mt-1.5" suppressHydrationWarning>
                  {t.profile.telegramChatIdHint}
                </p>
              </div>

              <button onClick={() => void handleSave()} disabled={saving}
                className="w-full btn-ghost text-[10px] flex items-center justify-center gap-2">
                {saving ? <Spinner /> : t.profile.saveTelegramId}
              </button>
            </div>

            {/* Superadmin system alerts */}
            {user.role === 'superadmin' && (
              <div className="card p-5 border-yellow-200 dark:border-yellow-400/20
                              bg-yellow-50/50 dark:bg-yellow-400/5">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                       className="shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400">
                    <path d="M8 2L14 13H2L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                    <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-yellow-700 dark:text-yellow-400 mb-1"
                       suppressHydrationWarning>{t.profile.systemAlertsTitle}</p>
                    <p className="font-mono text-[10px] text-slate-500 leading-relaxed"
                       suppressHydrationWarning>{t.profile.systemAlertsDesc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="card p-5 space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400"
                 suppressHydrationWarning>{t.profile.activitySection}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-mono text-[9px] text-slate-400" suppressHydrationWarning>{t.profile.emailField}</p>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-slate-400" suppressHydrationWarning>{t.profile.roleField}</p>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{user.role}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-slate-400" suppressHydrationWarning>{t.profile.accountStatus}</p>
                  <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
                     suppressHydrationWarning>{t.profile.accountActive}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-slate-400">Telegram</p>
                  <p className={`font-mono text-[11px] ${telegramChatId ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
                     suppressHydrationWarning>
                    {telegramChatId ? t.profile.telegramConnectedStatus : t.profile.telegramNotConfigured}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTelegramHelp && <TelegramHelpModal onClose={() => setShowTelegramHelp(false)} />}
    </DashboardLayout>
  );
}
