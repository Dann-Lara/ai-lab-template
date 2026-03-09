/**
 * usePermissions — Dynamic module permission management
 *
 * Permissions are stored in localStorage under `ailab_perms_<userId>`.
 * Each key maps to a boolean (true = allowed, false = blocked).
 *
 * Adding a new module permission:
 *  1. Add the key to MODULE_PERMISSION_KEYS (defines the default)
 *  2. Register the nav item in Sidebar.tsx with `permission: 'your-key'`
 *  3. Check `perms['your-key']` on the module's page
 *
 * That's it. No hardcoded lists anywhere else.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../lib/auth';

// ─── Module registry ─────────────────────────────────────────────────────────
// Define every permission key and its default value here.
// Admins/superadmins always get `true` regardless of this map.
export const MODULE_PERMISSION_KEYS: Record<string, boolean> = {
  checklist:    true,   // Access to Checklists module
  applications: true,   // Access to Applications / CV-ATS module
  // Future modules: just add a line here
  // analytics: false,
  // integrations: true,
};

export type PermissionKey = keyof typeof MODULE_PERMISSION_KEYS;

export type PermissionsMap = Record<string, boolean>;

// ─── Storage helpers ──────────────────────────────────────────────────────────
function storageKey(userId: string) {
  return `ailab_perms_${userId}`;
}

function readFromStorage(userId: string): PermissionsMap {
  if (typeof window === 'undefined') return { ...MODULE_PERMISSION_KEYS };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...MODULE_PERMISSION_KEYS };
    // Merge: stored values override defaults, new keys from MODULE_PERMISSION_KEYS fill in
    return { ...MODULE_PERMISSION_KEYS, ...JSON.parse(raw) as PermissionsMap };
  } catch {
    return { ...MODULE_PERMISSION_KEYS };
  }
}

function writeToStorage(userId: string, perms: PermissionsMap) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(perms));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface UsePermissionsReturn {
  /** Full permissions map — always defined after loading */
  permissions: PermissionsMap;
  /** True once permissions have been read from storage */
  ready: boolean;
  /** Check if the current user can access a module */
  can: (key: string) => boolean;
  /** Toggle a single permission (admin/superadmin only) */
  toggle: (key: string, value: boolean) => void;
  /** Replace the full permissions map */
  setAll: (perms: PermissionsMap) => void;
}

export function usePermissions(user: AuthUser | null): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionsMap>({ ...MODULE_PERMISSION_KEYS });
  const [ready, setReady] = useState(false);

  const isPrivileged = user?.role === 'superadmin' || user?.role === 'admin';
  const userId = user?.userId ?? '';

  // Load on mount / user change
  useEffect(() => {
    if (!user) { setReady(false); return; }

    if (isPrivileged) {
      // Admins and superadmins have all permissions
      const all = Object.fromEntries(Object.keys(MODULE_PERMISSION_KEYS).map(k => [k, true]));
      setPermissions(all);
    } else {
      setPermissions(readFromStorage(userId));
    }
    setReady(true);
  }, [userId, isPrivileged, user]);

  /** True if the user can access this module */
  const can = useCallback(
    (key: string): boolean => {
      if (isPrivileged) return true;
      // If the key isn't in MODULE_PERMISSION_KEYS, deny by default for safety
      if (!(key in MODULE_PERMISSION_KEYS)) return false;
      return permissions[key] !== false;
    },
    [permissions, isPrivileged],
  );

  /** Update a single permission (writes to localStorage) */
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

  /** Replace the entire permissions map (useful for bulk update from an API) */
  const setAll = useCallback(
    (perms: PermissionsMap) => {
      if (!userId) return;
      const merged = { ...MODULE_PERMISSION_KEYS, ...perms };
      writeToStorage(userId, merged);
      setPermissions(merged);
    },
    [userId],
  );

  return { permissions, ready, can, toggle, setAll };
}
