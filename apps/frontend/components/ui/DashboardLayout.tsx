'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { PermissionsProvider } from '../../lib/permissions-context';
import type { AuthUser } from '../../lib/auth';

interface DashboardLayoutProps {
  variant: 'admin' | 'client';
  user: AuthUser;
  title?: string;
  children: ReactNode;
}

/**
 * DashboardLayout — always mounts PermissionsProvider.
 * Sidebar and children (via PermissionGate) consume the context.
 * Pages must NOT call usePermissions() at their top level —
 * only components rendered inside this layout's children can do so.
 */
export function DashboardLayout({ variant, user, title, children }: DashboardLayoutProps) {
  return (
    <PermissionsProvider user={user}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Navbar variant={variant} title={title} />
        <Sidebar variant={variant} user={user} />
        <main className="pt-14">
          {children}
        </main>
      </div>
    </PermissionsProvider>
  );
}
