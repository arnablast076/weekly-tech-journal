'use client';

import React, { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

// The source of truth is the `dark` class on <html>. The inline script in
// layout.tsx sets it before first paint; this component just mirrors it.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

// null on the server -> render a neutral placeholder, avoiding a hydration mismatch
const getServerSnapshot = (): Theme | null => null;

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const theme = useSyncExternalStore<Theme | null>(subscribe, getSnapshot, getServerSnapshot);

  // In development, React Strict Mode's remount resets <html> to the attributes
  // from JSX, clearing the class the inline script set. Re-apply it before paint.
  // (A no-op in production.)
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      const dark = saved
        ? saved === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', dark);
    } catch {
      /* storage unavailable: keep whatever is applied */
    }
  }, []);

  // Enable colour transitions only after first paint so page load doesn't animate.
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add('theme-ready'));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 shadow-2xs transition-all hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900 cursor-pointer ${className}`}
    >
      {theme === null ? (
        <span className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};
