'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../lib/i18n-context';
import { login, saveTokens, getAccessToken, getStoredUser, getDashboardPath } from '../../lib/auth';

export default function LoginPage(): React.JSX.Element {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const user  = getStoredUser();
    if (token && user) router.replace(getDashboardPath(user.role));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true); setError('');
    try {
      const tokens = await login(email, password);
      saveTokens(tokens);
      router.replace(getDashboardPath(tokens.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally { setLoading(false); }
  }

  const EyeOpen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOff = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden
                      bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#0284c7 1px, transparent 1px), linear-gradient(90deg, #0284c7 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px]
                        bg-sky-400/5 dark:bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />

        <Link href="/" className="relative font-mono text-[11px] text-sky-600 dark:text-sky-400
                                   border border-sky-400/30 bg-sky-50 dark:bg-sky-400/5
                                   px-3 py-1.5 rounded w-fit hover:bg-sky-100 dark:hover:bg-sky-400/10 transition-colors">
          ← AI Lab
        </Link>

        <div className="relative">
          <p className="font-mono text-[10px] text-sky-500 dark:text-sky-400 uppercase tracking-[0.4em] mb-6 opacity-60">
            Auth / Login
          </p>
          <h1 className="headline text-8xl text-slate-900 dark:text-white leading-none mb-6" suppressHydrationWarning>
            {t.auth.loginTitle}
          </h1>
          <p className="font-mono text-[12px] text-slate-500 leading-relaxed max-w-xs" suppressHydrationWarning>
            {t.auth.loginSub}
          </p>
        </div>

        <div className="relative font-mono text-[9px] text-slate-400 dark:text-slate-700 uppercase tracking-widest">
          AI Lab © {new Date().getFullYear()}
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block font-mono text-[11px] text-sky-600 dark:text-sky-400 mb-10
                                     hover:text-sky-500 transition-colors">
            ← AI Lab
          </Link>

          <div className="mb-10">
            <h2 className="headline text-4xl text-slate-900 dark:text-white mb-2" suppressHydrationWarning>{t.auth.loginTitle}</h2>
            <p className="font-mono text-[11px] text-slate-500" suppressHydrationWarning>{t.auth.loginSub}</p>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
            <div>
              <label className="label">{t.auth.email}</label>
              <input type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input" />
            </div>

            <div>
              <label className="label">{t.auth.password}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500
                             dark:hover:text-sky-400 transition-colors p-1">
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg
                              bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" className="text-red-500 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="font-mono text-[10px] text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t.auth.loggingIn}
                </span>
              ) : t.auth.loginBtn}
            </button>
          </form>

          <div className="mt-8 space-y-4 text-center">
            <p className="font-mono text-[10px] text-slate-500">
              {t.auth.noAccount}{' '}
              <Link href="/signup" className="text-sky-600 dark:text-sky-500 hover:text-sky-500 dark:hover:text-sky-400
                                              transition-colors underline underline-offset-4">
                {t.nav.signup}
              </Link>
            </p>
            <div className="h-px bg-slate-200 dark:bg-slate-800" />
            {/* Dev hint */}
            <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mb-2">Superadmin (dev)</p>
              <button type="button"
                onClick={() => { setEmail('superadmin@ailab.dev'); setPassword('SuperAdmin123!'); }}
                className="font-mono text-[10px] text-sky-600 dark:text-sky-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                superadmin@ailab.dev → click to fill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
