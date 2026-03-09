/**
 * usePermissions — Fetches real module permissions from the backend.
 *
 * GET /api/users/me/permissions returns the effective map for the logged-in user:
 *   - superadmin / admin → all keys = true (server-enforced)
 *   - client → stored permissions merged with defaults
 *
 * A module-level cache ensures only ONE fetch per user session even when
 * multiple components call this hook simultaneously (DashboardLayout + page).
 *
 * Adding a new module permission:
 *   1. Add the key to MODULE_KEYS in apps/backend/src/modules/users/user.entity.ts
 *   2. Add the nav item in Sidebar.tsx with permission: 'your-key'
 *   3. Call can('your-key') on the module page for the access gate
 *   → No other frontend changes needed.
 */
'use client';

import { useState, useEffect } from 'react';
import type { AuthUser } from '../lib/auth';

export type PermissionsMap = Record<string, boolean>;

// ── Module-level cache ────────────────────────────────────────────────────────
// Shared across all hook instances in the same page load.
// Keyed by userId so switching accounts gets a fresh fetch.
const cache: Map<string, { data: PermissionsMap; fetchedAt: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-flight promise deduplication — prevents parallel fetches for the same user
const inflight: Map<string, Promise<PermissionsMap>> = new Map();

async function fetchPermissions(userId: string): Promise<PermissionsMap> {
  // Return cached if fresh
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  // Deduplicate in-flight requests
  if (inflight.has(userId)) {
    return inflight.get(userId)!;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  if (!token) return {};

  const promise = fetch('/api/users/me/permissions', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<PermissionsMap>;
    })
    .then((data) => {
      cache.set(userId, { data, fetchedAt: Date.now() });
      inflight.delete(userId);
      return data;
    })
    .catch(() => {
      inflight.delete(userId);
      // Optimistic fallback: if fetch fails, check role from token cache
      return {} as PermissionsMap;
    });

  inflight.set(userId, promise);
  return promise;
}

/** Invalidate the cache for a user (call after toggling a permission) */
export function invalidatePermissionsCache(userId: string): void {
  cache.delete(userId);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export interface UsePermissionsReturn {
  permissions: PermissionsMap;
  /** True once the fetch has resolved */
  ready: boolean;
  /** Returns true if the user has access to this module */
  can: (key: string) => boolean;
}

export function usePermissions(user: AuthUser | null): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PermissionsMap>(() => {
    // Hydrate from cache synchronously on first render if available
    if (!user?.userId) return {};
    const cached = cache.get(user.userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;
    return {};
  });
  const [ready, setReady] = useState(() => {
    if (!user?.userId) return false;
    const cached = cache.get(user.userId);
    return !!(cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS);
  });

  const userId   = user?.userId ?? '';
  const userRole = user?.role   ?? '';

  useEffect(() => {
    if (!userId) {
      setPermissions({});
      setReady(false);
      return;
    }

    // Already have fresh data (from cache or synchronous init) → no fetch needed
    const cached = cache.get(userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setPermissions(cached.data);
      setReady(true);
      return;
    }

    fetchPermissions(userId).then((data) => {
      // If fetch failed (empty) and user is privileged, grant full access optimistically
      const resolved =
        Object.keys(data).length === 0 && (userRole === 'superadmin' || userRole === 'admin')
          ? { checklist: true, applications: true }
          : data;
      setPermissions(resolved);
      setReady(true);
    });
  }, [userId, userRole]);

  function can(key: string): boolean {
    // While loading, block access to avoid flash of content
    if (!ready) return false;
    return permissions[key] === true;
  }

  return { permissions, ready, can };
}
