'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

// Inline script injected into <head> to set theme BEFORE React hydrates
// Prevents flash of wrong theme on page load
const THEME_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('ailab_theme');
    if (!t) { t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) {}
})();
`;

export function ThemeScript(): React.JSX.Element {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  // Default to 'dark' — the inline script will already have set the correct class
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Read actual theme after hydration
    const stored = localStorage.getItem('ailab_theme') as Theme | null;
    const system: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolved = stored ?? system;
    setTheme(resolved);
    // Ensure class is correct (in case SSR/hydration mismatch)
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('ailab_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
