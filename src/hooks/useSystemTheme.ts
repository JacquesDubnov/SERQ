/**
 * System Theme Detection Hook
 * Phase 3: Style System Foundation
 *
 * Wraps Tauri's window theme API for detecting macOS light/dark mode.
 * Uses styleStore.themeMode as the source of truth for user override.
 * Falls back to CSS media query when Tauri API is unavailable (browser dev).
 */

import { useState, useEffect } from 'react'
import { useStyleStore } from '../stores/styleStore'

type EffectiveTheme = 'light' | 'dark'

export interface UseSystemThemeReturn {
  /** The currently applied theme (resolved from system or override) */
  effectiveTheme: EffectiveTheme
  /** What macOS system settings report */
  systemTheme: EffectiveTheme
  /** Whether the Tauri API is available */
  isTauriAvailable: boolean
}

/**
 * Detect and respond to system theme changes with override support.
 *
 * Uses Tauri's window API when available, falls back to CSS media queries.
 * Syncs with styleStore.themeMode for user preference.
 */
export function useSystemTheme(): UseSystemThemeReturn {
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>('light')
  const [isTauriAvailable, setIsTauriAvailable] = useState(false)

  // Get themeMode from styleStore (this makes the hook reactive to store changes)
  const themeMode = useStyleStore((state) => state.themeMode)

  // Calculate effective theme from system and store's themeMode
  const effectiveTheme: EffectiveTheme =
    themeMode === 'system' ? systemTheme : themeMode

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

  return {
    effectiveTheme,
    systemTheme,
    isTauriAvailable,
  }
}
