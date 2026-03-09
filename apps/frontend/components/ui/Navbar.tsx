'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../lib/i18n-context';
import { useTheme } from './ThemeProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { clearTokens, getStoredUser, type AuthUser } from '../../lib/auth';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface NavbarProps {
  variant?: 'public' | 'admin' | 'client';
  /** Panel title shown center/left after logo — e.g. "Dashboard", "Usuarios" */
  title?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Navbar({ variant = 'public', title }: NavbarProps): React.JSX.Element {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDash = variant === 'admin' || variant === 'client';
  const profileHref = variant === 'admin' ? '/admin/profile' : '/client/profile';

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleLogout() { clearTokens(); router.push('/login'); }

  // ── Public navbar (unchanged) ──────────────────────────────────────────────
  if (!isDash) {
    return (
      <nav className={`fixed w-full z-[100] transition-all duration-300
        ${scrolled
          ? 'border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent border-b border-transparent'
        }`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-mono text-xs text-sky-600 dark:text-sky-400
                             bg-sky-50 dark:bg-sky-400/10 border border-sky-200 dark:border-sky-400/20
                             px-2 py-1 rounded group-hover:bg-sky-100 dark:group-hover:bg-sky-400/20 transition-colors">
              &gt;_ AI.Lab
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {mounted && <LanguageSwitcher />}
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400
                         hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all">
              {mounted && theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            {mounted && !user && (
              <div className="flex items-center gap-1.5">
                <Link href="/login" className="btn-ghost text-[10px] py-1.5 px-3">{t.nav.login}</Link>
                <Link href="/signup" className="btn-primary text-[10px] py-1.5 px-3">{t.nav.signup}</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // ── Dashboard navbar (simplified) ─────────────────────────────────────────
  return (
    <nav className="fixed w-full z-[100]
                    border-b border-slate-200 dark:border-slate-800
                    bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm dark:shadow-none">
      <div className="h-14 px-4 flex items-center justify-between">

        {/* Left — space for sidebar hamburger + title */}
        <div className="flex items-center gap-3 pl-12">
          {mounted && title && (
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              {title}
            </span>
          )}
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-1.5">
          {/* Language switcher */}
          {mounted && <LanguageSwitcher />}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400
                       hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all"
          >
            {mounted && theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          {/* Username → profile */}
          {mounted && user && (
            <Link
              href={profileHref}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                         font-mono text-[10px] text-slate-600 dark:text-slate-300
                         hover:bg-slate-100 dark:hover:bg-slate-800
                         hover:text-sky-600 dark:hover:text-sky-400
                         transition-all duration-150 group"
            >
              {/* Avatar circle */}
              <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-400/20
                               border border-sky-200 dark:border-sky-400/30
                               flex items-center justify-center
                               font-mono text-[9px] font-bold text-sky-600 dark:text-sky-400
                               group-hover:bg-sky-200 dark:group-hover:bg-sky-400/30 transition-colors">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span>{user.name}</span>
            </Link>
          )}

          {/* Logout */}
          {mounted && user && (
            <button
              onClick={handleLogout}
              aria-label={t.nav.logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         font-mono text-[10px] text-slate-400
                         hover:bg-red-50 dark:hover:bg-red-400/10
                         hover:text-red-600 dark:hover:text-red-400
                         border border-transparent hover:border-red-200 dark:hover:border-red-400/30
                         transition-all duration-150"
            >
              <IconLogout />
              <span className="hidden sm:block">{t.nav.logout}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
