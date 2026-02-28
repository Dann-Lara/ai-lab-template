'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getAccessToken, getDashboardPath } from '../../lib/auth';

// Smart redirect: /dashboard → /admin or /client based on role
export default function DashboardRedirect(): null {
  const router = useRouter();
  useEffect(() => {
    const token = getAccessToken();
    const user  = getStoredUser();
    if (token && user) {
      router.replace(getDashboardPath(user.role));
    } else {
      router.replace('/login');
    }
  }, [router]);
  return null;
}
