'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AuthUser } from './auth';

export type PermissionsMap = Record<string, boolean>;

interface PermissionsContextValue {
  permissions: PermissionsMap;
  ready: boolean;
  /** True when a real PermissionsProvider is mounted (not the default context) */
  _mounted: boolean;
  can: (key: string) => boolean;
  invalidate: () => void;
}

export const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: {},
  ready: false,
  _mounted: false,
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
  const [ready, setReady] = useState(false);

  const userId   = user.userId;
  const userRole = user.role;
  const fetchedFor = useRef('');

  function doFetch() {
    if (!userId) return;

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;

    console.log(`[Permissions] doFetch — userId=${userId} role=${userRole} token=${token ? 'ok' : 'MISSING'}`);

    if (!token) {
      console.warn('[Permissions] No token — setting ready with empty permissions');
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
        console.log(`[Permissions] API response status: ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PermissionsMap>;
      })
      .then((data) => {
        console.log('[Permissions] Received from API:', JSON.stringify(data));
        setPermissions(data);
        setReady(true);
      })
      .catch((err) => {
        console.error('[Permissions] Fetch failed:', err);
        const fallback =
          userRole === 'superadmin' || userRole === 'admin'
            ? { checklist: true, applications: true }
            : {};
        console.warn('[Permissions] Using fallback:', JSON.stringify(fallback));
        setPermissions(fallback);
        setReady(true);
      });
  }

  useEffect(() => {
    console.log(`[Permissions] useEffect — userId=${userId} fetchedFor=${fetchedFor.current}`);
    if (!userId) {
      setPermissions({});
      setReady(false);
      fetchedFor.current = '';
      return;
    }
    if (fetchedFor.current === userId) {
      console.log('[Permissions] Already fetched for this user, skipping');
      return;
    }
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  function can(key: string): boolean {
    const result = ready && permissions[key] === true;
    console.log(`[Permissions] can(${key}) → ${result} (ready=${ready}, value=${permissions[key]})`);
    return result;
  }

  function invalidate() {
    console.log('[Permissions] invalidate called — will refetch');
    fetchedFor.current = '';
    doFetch();
  }

  return (
    <PermissionsContext.Provider
      value={{ permissions, ready, _mounted: true, can, invalidate }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx._mounted) {
    console.warn('[Permissions] usePermissions() called outside PermissionsProvider — returning default context');
  }
  return ctx;
}

export function invalidatePermissionsCache(): void {
  // no-op shim
}
