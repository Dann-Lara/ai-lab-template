'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Navbar(): React.JSX.Element {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700
                        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/"
            className="text-lg font-bold text-brand-600 dark:text-brand-400 hover:opacity-80 transition-opacity">
            ⚡ AI Lab
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href="/">{t('home')}</NavLink>
            <NavLink href="/dashboard">{t('dashboard')}</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Link href={href}
      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900
                 dark:text-slate-400 dark:hover:text-slate-100
                 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800
                 transition-all duration-150">
      {children}
    </Link>
  );
}
