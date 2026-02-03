/**
 * useSystemTheme - System theme detection with override support
 *
 * Detects macOS light/dark mode via Tauri window API.
 * Falls back to matchMedia if Tauri is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

interface UseSystemThemeReturn {
  effectiveTheme: EffectiveTheme;
  systemTheme: EffectiveTheme;
  userOverride: ThemeMode;
  setUserOverride: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Detect system theme using matchMedia (browser fallback)
 */
function detectSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useSystemTheme(): UseSystemThemeReturn {
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(detectSystemTheme);
  const [userOverride, setUserOverride] = useState<ThemeMode>('system');

  // Calculate effective theme
  const effectiveTheme: EffectiveTheme =
    userOverride === 'system' ? systemTheme : userOverride;

  // Update data-theme attribute on document
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
  }, [effectiveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    // Try Tauri API first
    const tryTauriTheme = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const window = getCurrentWindow();

        // Get initial theme
        const theme = await window.theme();
        if (theme) {
          setSystemTheme(theme as EffectiveTheme);
        }

        // Subscribe to theme changes
        const unlisten = await window.onThemeChanged(({ payload }) => {
          setSystemTheme(payload as EffectiveTheme);
        });

        return unlisten;
      } catch {
        // Tauri not available, use matchMedia fallback
        console.log('[useSystemTheme] Tauri not available, using matchMedia fallback');
        return null;
      }
    };

    let tauriUnlisten: (() => void) | null = null;

    tryTauriTheme().then((unlisten) => {
      tauriUnlisten = unlisten;
    });

    // Also listen to matchMedia as fallback
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      if (tauriUnlisten) {
        tauriUnlisten();
      }
    };
  }, []);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    setUserOverride((current) => {
      if (current === 'system') {
        return systemTheme === 'dark' ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [systemTheme]);

  return {
    effectiveTheme,
    systemTheme,
    userOverride,
    setUserOverride,
    toggleTheme,
  };
}
