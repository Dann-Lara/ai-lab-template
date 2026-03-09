'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '../../lib/i18n-context';
import type { AuthUser } from '../../lib/auth';

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
  </svg>
);
const IconChecklist = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  permission?: string; // user-level permission key
}

interface SidebarProps {
  variant: 'admin' | 'client';
  user: AuthUser;
  userPermissions?: Record<string, boolean>;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ variant, user, userPermissions = {} }: SidebarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLUListElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'admin' || isSuperAdmin;

  const base = variant === 'admin' ? '/admin' : '/client';

  const NAV_ITEMS: NavItem[] = [
    { key: 'dashboard',     href: base,                  label: t.nav.dashboard,     icon: <IconDashboard /> },
    { key: 'users',         href: `${base}/users`,        label: t.nav.users,         icon: <IconUsers />,     adminOnly: true },
    { key: 'checklist',     href: '/checklists',          label: t.nav.checklist,     icon: <IconChecklist />, permission: 'checklist' },
    { key: 'applications',  href: `${base}/applications`, label: t.nav.applications ?? 'Postulaciones', icon: <IconBriefcase />, permission: 'applications' },
  ];

  useEffect(() => { setMounted(true); }, []);

  // Anime.js open animation
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function animate() {
      if (cancelled) return;
      const anime = (await import('animejs')).default;

      if (open) {
        // Sidebar slide in
        if (sidebarRef.current) {
          anime({ targets: sidebarRef.current, translateX: ['-100%', '0%'], duration: 380, easing: 'easeOutExpo' });
        }
        // Overlay fade in
        if (overlayRef.current) {
          overlayRef.current.style.display = 'block';
          anime({ targets: overlayRef.current, opacity: [0, 1], duration: 300, easing: 'easeOutQuad' });
        }
        // Stagger items
        if (itemsRef.current) {
          const children = Array.from(itemsRef.current.children) as HTMLElement[];
          children.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateX(-12px)'; });
          anime({
            targets: children,
            opacity: [0, 1],
            translateX: [-12, 0],
            duration: 340,
            easing: 'easeOutExpo',
            delay: anime.stagger(55, { start: 120 }),
          });
        }
      } else {
        // Sidebar slide out
        if (sidebarRef.current) {
          anime({ targets: sidebarRef.current, translateX: ['0%', '-100%'], duration: 320, easing: 'easeInExpo' });
        }
        // Overlay fade out
        if (overlayRef.current) {
          anime({
            targets: overlayRef.current,
            opacity: [1, 0],
            duration: 280,
            easing: 'easeInQuad',
            complete: () => { if (overlayRef.current) overlayRef.current.style.display = 'none'; },
          });
        }
      }
    }

    animate();
    return () => { cancelled = true; };
  }, [open, mounted]);

  function isActive(href: string) {
    if (href === base) return pathname === base;
    return pathname.startsWith(href);
  }

  function canAccess(item: NavItem) {
    if (item.adminOnly && !isAdmin) return false;
    // Privileged users (admin, superadmin) always have access to all modules
    if (isAdmin) return true;
    // For regular clients: check permission map explicitly
    // If the key is absent (permissions not yet loaded), deny — prevents flash
    if (item.permission) {
      return userPermissions[item.permission] === true;
    }
    return true;
  }

  const visibleItems = NAV_ITEMS.filter(canAccess);

  return (
    <>
      {/* Hamburger toggle — sits inside the fixed navbar bar (h-14) */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle sidebar"
        className="fixed top-0 left-0 z-[200] w-14 h-14 flex items-center justify-center
                   text-slate-500 dark:text-slate-400
                   hover:text-sky-600 dark:hover:text-sky-400
                   transition-colors duration-150"
      >
        {open ? <IconX /> : <IconMenu />}
      </button>

      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={() => setOpen(false)}
        style={{ display: 'none', opacity: 0, top: '3.5rem' }}
        className="fixed inset-x-0 bottom-0 z-[150] bg-slate-950/40 backdrop-blur-[2px]"
      />

      {/* Sidebar panel — starts below the fixed navbar (top-14 = 3.5rem) */}
      <aside
        ref={sidebarRef}
        style={{ transform: 'translateX(-100%)', height: 'calc(100vh - 3.5rem)' }}
        className="fixed top-14 left-0 z-[160] w-64
                   bg-white dark:bg-slate-950
                   border-r border-slate-200 dark:border-slate-800
                   flex flex-col shadow-2xl"
      >

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul ref={itemsRef} className="space-y-0.5">
            {visibleItems.map(item => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                              font-mono text-[11px] uppercase tracking-[0.2em]
                              transition-all duration-150 group
                              ${isActive(item.href)
                                ? 'bg-sky-50 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-400/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                              }`}
                >
                  <span className={`transition-colors ${isActive(item.href) ? 'text-sky-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive(item.href) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
            {user.name}
          </div>
          <div className="font-mono text-[9px] text-slate-300 dark:text-slate-600 truncate mt-0.5">
            {user.email}
          </div>
        </div>
      </aside>
    </>
  );
}
