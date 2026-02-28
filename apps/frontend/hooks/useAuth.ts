'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getAccessToken, clearTokens, getDashboardPath, type AuthUser } from '../lib/auth';

export function useAuth(requiredRoles?: string[]) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();

    if (!token || !stored) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    if (requiredRoles && !requiredRoles.includes(stored.role)) {
      setLoading(false);
      router.replace(getDashboardPath(stored.role));
      return;
    }

    setUser(stored);
    setLoading(false);
  }, [router, requiredRoles]);

  function logout() {
    clearTokens();
    router.replace('/login');
  }

  return { user, loading, logout };
}
