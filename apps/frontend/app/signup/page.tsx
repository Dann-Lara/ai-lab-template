'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../lib/i18n-context';
import { signup } from '../../lib/auth';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars',    ok: password.length >= 8 },
    { label: 'Uppercase',   ok: /[A-Z]/.test(password) },
    { label: 'Lowercase',   ok: /[a-z]/.test(password) },
    { label: 'Number',      ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-sky-500', 'bg-emerald-500'];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300
            ${i < score ? colors[score] : 'bg-slate-800'}`} />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(({ label, ok }) => (
          <span key={label} className={`font-mono text-[9px] uppercase tracking-wider transition-colors
            ${ok ? 'text-emerald-500' : 'text-slate-700'}`}>
            {ok ? '✓' : '○'} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage(): React.JSX.Element {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);

  const passwordsMatch = confirm === '' || password === confirm;
  const isValid = name.trim() && email.trim() && password.length >= 8 &&
    /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) &&
    password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await signup(name, email, password);
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center animate-fade-in space-y-4">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="headline text-4xl text-white">{t.auth.successSignup}</h2>
          <p className="font-mono text-[11px] text-slate-500">{t.auth.loggingIn}</p>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <Link href="/" className="relative font-mono text-[11px] text-sky-400 border border-sky-400/20
                                   bg-sky-400/5 px-3 py-1.5 rounded w-fit hover:bg-sky-400/10 transition-colors">
          ← AI Lab
        </Link>

        <div className="relative">
          <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.4em] mb-6 opacity-60">
            Auth / Signup
          </p>
          <h1 className="headline text-8xl text-white leading-none mb-6">
            {t.auth.signupTitle}
          </h1>
          <p className="font-mono text-[12px] text-slate-500 leading-relaxed max-w-xs">
            {t.auth.signupSub}
          </p>
          {/* Role info */}
          <div className="mt-10 p-4 border border-slate-800 rounded-xl bg-slate-900/40 space-y-3 max-w-xs">
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">Account types</p>
            {[
              { role: 'client',     desc: 'Signup (you)', color: 'text-emerald-400', dot: 'bg-emerald-400' },
              { role: 'admin',      desc: 'By superadmin', color: 'text-sky-400',     dot: 'bg-sky-400' },
              { role: 'superadmin', desc: 'Auto-created',  color: 'text-yellow-400',  dot: 'bg-yellow-400' },
            ].map(({ role, desc, color, dot }) => (
              <div key={role} className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className={`font-mono text-[10px] uppercase tracking-wider ${color}`}>{role}</span>
                <span className="font-mono text-[9px] text-slate-600">— {desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative font-mono text-[9px] text-slate-700 uppercase tracking-widest">
          AI Lab © {new Date().getFullYear()}
        </div>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 border-l border-slate-800/50">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block font-mono text-[11px] text-sky-400 mb-10
                                     hover:text-sky-300 transition-colors">
            ← AI Lab
          </Link>

          <div className="mb-10">
            <h2 className="headline text-4xl text-white mb-2">{t.auth.signupTitle}</h2>
            <p className="font-mono text-[11px] text-slate-500">{t.auth.signupSub}</p>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
            <div>
              <label className="label">{t.auth.name}</label>
              <input type="text" autoComplete="name" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe" required className="input" />
            </div>

            <div>
              <label className="label">{t.auth.email}</label>
              <input type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input" />
            </div>

            <div>
              <label className="label">{t.auth.password}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400 transition-colors p-1">
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            <div>
              <label className="label">{t.auth.confirmPassword}</label>
              <input type={showPass ? 'text' : 'password'} autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" required
                className={`input ${!passwordsMatch && confirm ? 'border-red-500/50 focus:ring-red-500' : ''}`} />
              {!passwordsMatch && confirm && (
                <p className="font-mono text-[10px] text-red-400 mt-1.5">Passwords don't match</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" className="text-red-400 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="font-mono text-[10px] text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !isValid} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t.auth.signingUp}
                </span>
              ) : t.auth.signupBtn}
            </button>
          </form>

          <p className="mt-8 text-center font-mono text-[10px] text-slate-600">
            {t.auth.haveAccount}{' '}
            <Link href="/login" className="text-sky-500 hover:text-sky-400 transition-colors underline underline-offset-4">
              {t.nav.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
