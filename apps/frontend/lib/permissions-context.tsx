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

export const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: {},
  ready: false,
  can: () => false,
  invalidate: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
export function PermissionsProvider({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [ready, setReady] = useState(false);

  const userId   = user.userId;
  const userRole = user.role;
  const fetchedFor = useRef('');

  console.log(`[PermissionsProvider] render — userId=${userId} role=${userRole}`);

  function doFetch() {
    if (!userId) {
      console.warn('[PermissionsProvider] doFetch called with no userId — skipping');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
    console.log(`[PermissionsProvider] doFetch — token=${token ? 'ok' : 'MISSING'}`);

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
        console.log(`[PermissionsProvider] response status=${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PermissionsMap>;
      })
      .then((data) => {
        console.log('[PermissionsProvider] permissions received:', JSON.stringify(data));
        setPermissions(data);
        setReady(true);
      })
      .catch((err) => {
        console.error('[PermissionsProvider] fetch failed:', err);
        const fallback = (userRole === 'superadmin' || userRole === 'admin')
          ? { checklist: true, applications: true }
          : {};
        console.warn('[PermissionsProvider] using fallback:', JSON.stringify(fallback));
        setPermissions(fallback);
        setReady(true);
      });
  }

  useEffect(() => {
    console.log(`[PermissionsProvider] useEffect — userId=${userId} fetchedFor=${fetchedFor.current}`);
    if (!userId) {
      setPermissions({});
      setReady(false);
      fetchedFor.current = '';
      return;
    }
    if (fetchedFor.current === userId) {
      console.log('[PermissionsProvider] already fetched for this user, skipping');
      return;
    }
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  function can(key: string): boolean {
    const result = ready && permissions[key] === true;
    console.log(`[PermissionsProvider] can(${key}) → ${result} (ready=${ready} stored=${permissions[key]})`);
    return result;
  }

  function invalidate() {
    console.log('[PermissionsProvider] invalidate — will refetch');
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
export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}

/** Backwards compat shim */
export function invalidatePermissionsCache(): void { /* no-op */ }
