/**
 * System Theme Detection Hook
 * Phase 3: Style System Foundation
 *
 * Wraps Tauri's window theme API for detecting macOS light/dark mode.
 * Supports user override to lock to specific mode.
 * Falls back to CSS media query when Tauri API is unavailable (browser dev).
 */

import { useState, useEffect, useCallback } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'
type EffectiveTheme = 'light' | 'dark'

export interface UseSystemThemeReturn {
  /** The currently applied theme (resolved from system or override) */
  effectiveTheme: EffectiveTheme
  /** What macOS system settings report */
  systemTheme: EffectiveTheme
  /** User's preference: follow system, or lock to light/dark */
  userOverride: ThemeMode
  /** Set user's theme preference */
  setUserOverride: (mode: ThemeMode) => void
  /** Quick toggle between light and dark (ignores system) */
  toggleTheme: () => void
  /** Whether the Tauri API is available */
  isTauriAvailable: boolean
}

/**
 * Detect and respond to system theme changes with override support.
 *
 * Uses Tauri's window API when available, falls back to CSS media queries.
 * Updates document.documentElement.dataset.theme for CSS variable switching.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { effectiveTheme, toggleTheme, setUserOverride } = useSystemTheme()
 *
 *   return (
 *     <div>
 *       <p>Current theme: {effectiveTheme}</p>
 *       <button onClick={toggleTheme}>Toggle</button>
 *       <button onClick={() => setUserOverride('system')}>Follow System</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSystemTheme(): UseSystemThemeReturn {
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>('light')
  const [userOverride, setUserOverrideState] = useState<ThemeMode>('system')
  const [isTauriAvailable, setIsTauriAvailable] = useState(false)

  // Calculate effective theme from system and override
  const effectiveTheme: EffectiveTheme =
    userOverride === 'system' ? systemTheme : userOverride

  // Update document theme attribute when effective theme changes
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme
  }, [effectiveTheme])

  // Initialize theme detection
  useEffect(() => {
    let cleanup: (() => void) | null = null
    let mounted = true

    async function initTauriTheme() {
      try {
        // Dynamically import Tauri API (only works in Tauri environment)
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const appWindow = getCurrentWindow()

        if (!mounted) return

        setIsTauriAvailable(true)

        // Get initial theme
        const initialTheme = await appWindow.theme()
        if (mounted && initialTheme) {
          setSystemTheme(initialTheme)
        }

        // Subscribe to theme changes
        const unlisten = await appWindow.onThemeChanged(({ payload }) => {
          if (mounted) {
            setSystemTheme(payload)
          }
        })

        cleanup = unlisten
      } catch {
        // Tauri API not available, use CSS media query fallback
        if (!mounted) return

        console.debug(
          '[useSystemTheme] Tauri API not available, using media query fallback'
        )
        setIsTauriAvailable(false)

        // Check initial system preference via CSS media query
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
        setSystemTheme(darkModeQuery.matches ? 'dark' : 'light')

        // Listen for changes
        const handleChange = (e: MediaQueryListEvent) => {
          if (mounted) {
            setSystemTheme(e.matches ? 'dark' : 'light')
          }
        }

        darkModeQuery.addEventListener('change', handleChange)
        cleanup = () => darkModeQuery.removeEventListener('change', handleChange)
      }
    }

    initTauriTheme()

    return () => {
      mounted = false
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  // Set user override
  const setUserOverride = useCallback((mode: ThemeMode) => {
    setUserOverrideState(mode)
    // Note: Persistence will be handled by styleStore in a later phase
  }, [])

  // Quick toggle between light and dark
  const toggleTheme = useCallback(() => {
    setUserOverrideState((current) => {
      if (current === 'system') {
        // If following system, toggle to opposite of current system theme
        return systemTheme === 'dark' ? 'light' : 'dark'
      }
      // Otherwise toggle between light and dark
      return current === 'dark' ? 'light' : 'dark'
    })
  }, [systemTheme])

  return {
    effectiveTheme,
    systemTheme,
    userOverride,
    setUserOverride,
    toggleTheme,
    isTauriAvailable,
  }
}
