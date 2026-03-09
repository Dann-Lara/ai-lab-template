'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../lib/auth';

// ─── Module registry ──────────────────────────────────────────────────────────
// To add a new module: add one line here + a nav item in Sidebar.tsx.
// No other files need changing.
export const MODULE_PERMISSION_KEYS: Record<string, boolean> = {
  checklist:    true,
  applications: true,
  // analytics: false,
};

export type PermissionsMap = Record<string, boolean>;

// ─── localStorage helpers ─────────────────────────────────────────────────────
function storageKey(userId: string) {
  return `ailab_perms_${userId}`;
}

function readFromStorage(userId: string): PermissionsMap {
  if (typeof window === 'undefined') return { ...MODULE_PERMISSION_KEYS };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...MODULE_PERMISSION_KEYS };
    return { ...MODULE_PERMISSION_KEYS, ...(JSON.parse(raw) as PermissionsMap) };
  } catch {
    return { ...MODULE_PERMISSION_KEYS };
  }
}

export function writeToStorage(userId: string, perms: PermissionsMap): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(perms));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface UsePermissionsReturn {
  permissions: PermissionsMap;
  ready: boolean;
  can: (key: string) => boolean;
  toggle: (key: string, value: boolean) => void;
}

export function usePermissions(user: AuthUser | null): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionsMap>({ ...MODULE_PERMISSION_KEYS });
  const [ready, setReady] = useState(false);

  // Derive stable primitives — these are the ONLY things the effect depends on.
  // Never put the `user` object itself in deps: object identity changes on every
  // render even if the values are identical, causing an infinite setState loop.
  const userId       = user?.userId ?? '';
  const isPrivileged = user?.role === 'superadmin' || user?.role === 'admin';

  useEffect(() => {
    if (!userId) {
      setReady(false);
      return;
    }
    if (isPrivileged) {
      // Admins/superadmins always have full access — no localStorage needed
      setPermissions(
        Object.fromEntries(Object.keys(MODULE_PERMISSION_KEYS).map(k => [k, true])),
      );
    } else {
      setPermissions(readFromStorage(userId));
    }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isPrivileged]); // ← primitives only, never the object

  const can = useCallback(
    (key: string): boolean => {
      if (isPrivileged) return true;
      if (!(key in MODULE_PERMISSION_KEYS)) return false;
      return permissions[key] === true;
    },
    [permissions, isPrivileged],
  );

  const toggle = useCallback(
    (key: string, value: boolean) => {
      if (!userId) return;
      setPermissions(prev => {
        const updated = { ...prev, [key]: value };
        writeToStorage(userId, updated);
        return updated;
      });
    },
    [userId],
  );

  return { permissions, ready, can, toggle };
}
