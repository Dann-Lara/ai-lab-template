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


  function doFetch() {
    if (!userId) {
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;

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
      .catch((err) => {
        const fallback = (userRole === 'superadmin' || userRole === 'admin')
          ? { checklist: true, applications: true }
          : {};
        setPermissions(fallback);
        setReady(true);
      });
  }

  useEffect(() => {
    if (!userId) {
      setPermissions({});
      setReady(false);
      fetchedFor.current = '';
      return;
    }
    if (fetchedFor.current === userId) {
      return;
    }
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  function can(key: string): boolean {
    const result = ready && permissions[key] === true;
    return result;
  }

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
export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}

/** Backwards compat shim */
export function invalidatePermissionsCache(): void { /* no-op */ }
