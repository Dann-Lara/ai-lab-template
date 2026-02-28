'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getAccessToken, clearTokens, getDashboardPath, type AuthUser } from '../lib/auth';

export function useAuth(requiredRoles?: string[]) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Serialize requiredRoles to a stable string so it never changes reference
  const rolesKey = requiredRoles?.join(',') ?? '';
  // Use a ref to prevent running the auth check more than once
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const token = getAccessToken();
    const stored = getStoredUser();

    if (!token || !stored) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    if (rolesKey && !rolesKey.split(',').includes(stored.role)) {
      setLoading(false);
      router.replace(getDashboardPath(stored.role));
      return;
    }

    setUser(stored);
    setLoading(false);
  }, [router, rolesKey]); // rolesKey is a stable string, not an array

  function logout() {
    clearTokens();
    router.replace('/login');
  }

  return { user, loading, logout };
}
