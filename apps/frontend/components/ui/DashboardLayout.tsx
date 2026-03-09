'use client';

import { ReactNode, useContext } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import {
  PermissionsProvider,
  PermissionsContext,
} from '../../lib/permissions-context';
import type { AuthUser } from '../../lib/auth';

interface DashboardLayoutProps {
  variant: 'admin' | 'client';
  user: AuthUser;
  title?: string;
  children: ReactNode;
}

function LayoutShell({ variant, user, title, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar variant={variant} title={title} />
      <Sidebar variant={variant} user={user} />
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}

/**
 * DashboardLayout — mounts PermissionsProvider if not already in the tree.
 * Pages that need permissions before DashboardLayout (like ApplicationsPage)
 * mount PermissionsProvider themselves; DashboardLayout detects this and skips
 * mounting a second one to avoid double-fetch.
 */
export function DashboardLayout({ variant, user, title, children }: DashboardLayoutProps) {
  const existingCtx = useContext(PermissionsContext);

  // If a PermissionsProvider is already in the tree (ready or has permissions),
  // just render the shell — don't mount a second provider.
  if (existingCtx._mounted) {
    return (
      <LayoutShell variant={variant} user={user} title={title}>
        {children}
      </LayoutShell>
    );
  }

  return (
    <PermissionsProvider user={user}>
      <LayoutShell variant={variant} user={user} title={title}>
        {children}
      </LayoutShell>
    </PermissionsProvider>
  );
}
