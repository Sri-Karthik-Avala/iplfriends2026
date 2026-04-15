// src/lib/theme.ts
//
// Shared theme utilities. The FOUC-prevention inline script below runs in
// <head> before first paint to set <html data-theme>. It must be string-safe
// and self-contained (no imports, no ES modules) because it gets injected as
// an IIFE via <script dangerouslySetInnerHTML>.

export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'ipl-theme';
export const THEME_EVENT = 'ipl-theme-changed';

// String form that gets inlined into layout.tsx. Uses only vanilla DOM + try/catch.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function getResolvedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  // When matchMedia is unavailable (very old browsers / JSDOM), default to
  // 'dark' so we stay consistent with themeInitScript's catch-all fallback.
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  return prefersDark ? 'dark' : 'light';
}

export function setTheme(next: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {}
  document.documentElement.setAttribute('data-theme', next);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
}

export function toggleTheme(): Theme {
  const current = getResolvedTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function subscribeToTheme(cb: (t: Theme) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<Theme>;
    cb(ce.detail);
  };
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}
