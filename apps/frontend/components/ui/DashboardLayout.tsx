'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type { AuthUser } from '../../lib/auth';

interface DashboardLayoutProps {
  variant: 'admin' | 'client';
  user: AuthUser;
  title?: string;
  userPermissions?: Record<string, boolean>;
  children: ReactNode;
}

/**
 * Shell layout for admin/client panels.
 * Renders Navbar (slim, top) + Sidebar (slide-out, hamburger) + content area.
 */
export function DashboardLayout({ variant, user, title, userPermissions, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar variant={variant} title={title} />

      {/* Slide-out Sidebar */}
      <Sidebar variant={variant} user={user} userPermissions={userPermissions} />

      {/* Main content — push down for fixed navbar height (h-14) */}
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
