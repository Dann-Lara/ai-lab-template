/**
 * PermissionsContext — Single source of truth for module permissions.
 *
 * Architecture:
 *   DashboardLayout (mounts provider, does ONE fetch)
 *     ├── Sidebar (reads context → filters nav items)
 *     └── Page content (reads context → gate access)
 *
 * This eliminates the race condition that occurred when DashboardLayout and
 * the page each called usePermissions() independently, causing two separate
 * fetch instances whose useState never shared state between them.
 *
 * Adding a new module:
 *   1. Add the key to MODULE_KEYS in apps/backend/.../user.entity.ts
 *   2. Add the nav item in Sidebar.tsx with permission: 'your-key'
 *   3. Call usePermissions().can('your-key') on the module page
 */
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AuthUser } from './auth';

export type PermissionsMap = Record<string, boolean>;

interface PermissionsContextValue {
  permissions: PermissionsMap;
  ready: boolean;
  can: (key: string) => boolean;
  invalidate: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: {},
  ready: false,
  can: () => false,
  invalidate: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
export function PermissionsProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [ready, setReady]             = useState(false);

  // Use a ref to avoid re-running the effect when only `user` object ref changes
  const userId   = user.userId;
  const userRole = user.role;

  // Track which userId we last fetched for — prevents double-fetch on strict mode
  const fetchedFor = useRef('');

  const doFetch = () => {
    if (!userId) return;

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;

    if (!token) {
      setPermissions({});
      setReady(true);
      return;
    }

    fetchedFor.current = userId;
    setReady(false);

    fetch('/api/users/me/permissions', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PermissionsMap>;
      })
      .then((data) => {
        setPermissions(data);
        setReady(true);
      })
      .catch(() => {
        // Network/auth error — privileged roles get optimistic access
        const fallback =
          userRole === 'superadmin' || userRole === 'admin'
            ? { checklist: true, applications: true }
            : {};
        setPermissions(fallback);
        setReady(true);
      });
  };

  useEffect(() => {
    if (!userId) {
      setPermissions({});
      setReady(false);
      fetchedFor.current = '';
      return;
    }
    // Only fetch if we haven't already fetched for this user
    if (fetchedFor.current === userId) return;
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  function can(key: string): boolean {
    if (!ready) return false;
    return permissions[key] === true;
  }

  /** Call after changing a user's permissions so the sidebar re-fetches */
  function invalidate() {
    fetchedFor.current = '';
    doFetch();
  }

  return (
    <PermissionsContext.Provider value={{ permissions, ready, can, invalidate }}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
/** Consume the permissions for the currently logged-in user */
export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}

/** For backwards compat — some pages call usePermissions(user). Keep working. */
export function usePermissionsCompat(_user: AuthUser | null): PermissionsContextValue {
  return useContext(PermissionsContext);
}

/** Kept for the user-detail page that calls this after toggling */
export function invalidatePermissionsCache(): void {
  // no-op in context model — use invalidate() from the context instead
}
