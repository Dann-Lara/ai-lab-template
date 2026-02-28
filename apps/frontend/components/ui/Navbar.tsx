'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '../../lib/i18n-context';
import { useTheme } from './ThemeProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { clearTokens, getStoredUser, type AuthUser } from '../../lib/auth';

// ── Types ──────────────────────────────────────────────────────
interface NavItem { href: string; labelKey: keyof ReturnType<typeof useI18n>['t']['nav'] }

// ── Public nav links ───────────────────────────────────────────
const PUBLIC_NAV: NavItem[] = [
  { href: '/#features', labelKey: 'features' },
  { href: '/#stack',    labelKey: 'stack' },
  { href: '/#docs',     labelKey: 'docs' },
];

// ── Component ──────────────────────────────────────────────────
export function Navbar({ variant = 'public' }: { variant?: 'public' | 'admin' | 'client' }): React.JSX.Element {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function handleLogout() {
    clearTokens();
    router.push('/login');
  }

  const isDashboard = variant === 'admin' || variant === 'client';
  const roleLabel = variant === 'admin' ? t.nav.adminPanel : variant === 'client' ? t.nav.clientPanel : null;

  return (
    <>
      {/* ── Main Navbar ──────────────────────────────────────── */}
      <nav className={`fixed w-full z-[100] transition-all duration-500
        ${scrolled || isDashboard
          ? 'border-b border-slate-800 bg-slate-950/95 backdrop-blur-md'
          : 'bg-transparent border-b border-transparent'
        }`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href={user ? (variant === 'client' ? '/client' : '/admin') : '/'} 
            className="flex items-center gap-3 group">
            <span className="font-mono text-xs text-sky-400 bg-sky-400/10 border border-sky-400/20 
                             px-2 py-1 rounded group-hover:bg-sky-400/20 transition-colors">
              &gt;_ AI.Lab
            </span>
            {roleLabel && (
              <span className="hidden sm:block text-[9px] font-mono uppercase tracking-[0.3em] 
                               text-slate-500 border-l border-slate-700 pl-3">
                {roleLabel}
              </span>
            )}
          </Link>

          {/* Desktop right */}
          <div className="flex items-center gap-2 md:gap-6">

            {/* Public nav links */}
            {!isDashboard && (
              <ul className="hidden lg:flex items-center gap-6">
                {PUBLIC_NAV.map(({ href, labelKey }) => (
                  <li key={href}>
                    <Link href={href}
                      className={`text-[10px] font-mono uppercase tracking-[0.3em] transition-all
                        border-b border-transparent pb-0.5
                        ${pathname === href
                          ? 'text-sky-400 border-sky-400'
                          : 'text-slate-400 hover:text-sky-400 hover:border-sky-400'
                        }`}>
                      {t.nav[labelKey] as string}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Dashboard nav */}
            {isDashboard && (
              <ul className="hidden md:flex items-center gap-4">
                <li>
                  <Link href={variant === 'admin' ? '/admin' : '/client'}
                    className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 
                               hover:text-sky-400 transition-colors">
                    {t.nav.dashboard}
                  </Link>
                </li>
                {variant === 'admin' && (
                  <li>
                    <Link href="/admin/users"
                      className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 
                                 hover:text-sky-400 transition-colors">
                      {t.nav.users}
                    </Link>
                  </li>
                )}
              </ul>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3 md:pl-6">
              <LanguageSwitcher />

              {/* Theme toggle */}
              <button onClick={toggleTheme} aria-label="Toggle theme"
                className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-all">
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>

              {/* Auth buttons */}
              {!isDashboard && !user && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login" className="btn-ghost text-[10px] py-1.5 px-3">
                    {t.nav.login}
                  </Link>
                  <Link href="/signup" className="btn-primary text-[10px] py-1.5 px-3">
                    {t.nav.signup}
                  </Link>
                </div>
              )}

              {isDashboard && user && (
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500 hidden md:block">
                    {user.email}
                  </span>
                  <button onClick={handleLogout} className="btn-ghost text-[10px] py-1.5 px-3">
                    {t.nav.logout}
                  </button>
                </div>
              )}

              {/* Hamburger */}
              <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
                className="lg:hidden p-2 text-slate-400 hover:text-sky-400 transition-colors ml-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ──────────────────────────────────────── */}
      <div className={`fixed inset-0 z-[150] flex flex-col bg-slate-950/98 backdrop-blur-xl
                       transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]
                       ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Mobile header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
          <span className="font-mono text-xs text-sky-400">Menu<span className="text-slate-600">.sys</span></span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
            className="p-2 text-slate-400 hover:text-sky-400 hover:rotate-90 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Mobile links */}
        <div className="flex-1 flex flex-col justify-center px-10">
          <ul className="space-y-2">
            {!isDashboard && PUBLIC_NAV.map(({ href, labelKey }, i) => (
              <li key={href}>
                <Link href={href} onClick={() => setMenuOpen(false)}
                  className="group flex items-end gap-4 py-3">
                  <span className="font-mono text-[10px] text-sky-400 opacity-30 group-hover:opacity-100 transition-opacity mb-1">
                    0{i + 1}
                  </span>
                  <span className="headline text-5xl text-slate-100 group-hover:text-sky-400 group-hover:italic transition-all">
                    {t.nav[labelKey] as string}
                  </span>
                </Link>
              </li>
            ))}
            {!isDashboard && (
              <>
                <li className="pt-6 flex flex-col gap-3">
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="btn-ghost w-full text-center">{t.nav.login}</Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)}
                    className="btn-primary w-full text-center">{t.nav.signup}</Link>
                </li>
              </>
            )}
            {isDashboard && (
              <>
                <li>
                  <Link href={variant === 'admin' ? '/admin' : '/client'} onClick={() => setMenuOpen(false)}
                    className="group flex items-end gap-4 py-3">
                    <span className="font-mono text-[10px] text-sky-400 opacity-30 group-hover:opacity-100 transition-opacity mb-1">01</span>
                    <span className="headline text-5xl text-slate-100 group-hover:text-sky-400 group-hover:italic transition-all">{t.nav.dashboard}</span>
                  </Link>
                </li>
                {variant === 'admin' && (
                  <li>
                    <Link href="/admin/users" onClick={() => setMenuOpen(false)}
                      className="group flex items-end gap-4 py-3">
                      <span className="font-mono text-[10px] text-sky-400 opacity-30 group-hover:opacity-100 transition-opacity mb-1">02</span>
                      <span className="headline text-5xl text-slate-100 group-hover:text-sky-400 group-hover:italic transition-all">{t.nav.users}</span>
                    </Link>
                  </li>
                )}
                <li className="pt-6">
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="btn-ghost w-full text-center">{t.nav.logout}</button>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Mobile footer */}
        <div className="px-10 pb-10 pt-6 border-t border-slate-800 flex justify-between items-end">
          <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 leading-relaxed">
            AI Lab<br/><span className="text-sky-600">Template</span>
          </div>
          <div className="font-mono text-[9px] text-sky-600 uppercase tracking-widest">
            {new Date().getFullYear()} ©
          </div>
        </div>
      </div>
    </>
  );
}
