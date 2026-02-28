'use client';

import { useEffect, useState } from 'react';

/**
 * Renders children only on the client (after hydration).
 * Use for components that rely on browser-only state (cookies, localStorage)
 * to prevent hydration mismatches.
 * 
 * fallback: what to show during SSR and first client render
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return <>{mounted ? children : fallback}</>;
}
