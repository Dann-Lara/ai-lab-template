'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { usePermissions } from '../../hooks/usePermissions';
import type { AuthUser } from '../../lib/auth';

interface DashboardLayoutProps {
  variant: 'admin' | 'client';
  user: AuthUser;
  title?: string;
  children: ReactNode;
}

/**
 * Shell layout for admin/client panels.
 * Permissions are fetched from the backend (GET /api/users/me/permissions).
 * To add a new module: add the key to MODULE_KEYS in user.entity.ts (backend)
 * and add a nav item in Sidebar.tsx. No frontend config needed.
 */
export function DashboardLayout({ variant, user, title, children }: DashboardLayoutProps) {
  const { permissions, ready } = usePermissions(user);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar variant={variant} title={title} />

      {/* Slide-out Sidebar — only rendered once permissions are resolved */}
      <Sidebar
        variant={variant}
        user={user}
        userPermissions={ready ? permissions : {}}
      />

      {/* Main content — push down for fixed navbar height (h-14) */}
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
