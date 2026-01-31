/**
 * Focus Mode Hook
 * Toggles distraction-free writing mode that hides all UI chrome
 */
import { useState, useCallback, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface UseFocusModeReturn {
  /** Whether focus mode is currently active */
  isFocusMode: boolean;
  /** Toggle focus mode on/off */
  toggleFocusMode: () => void;
  /** Explicitly set focus mode state */
  setFocusMode: (enabled: boolean) => void;
}

export function useFocusMode(): UseFocusModeReturn {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const setFocusMode = useCallback((enabled: boolean) => {
    setIsFocusMode(enabled);
  }, []);

  // Register Cmd+Shift+F shortcut
  useHotkeys(
    'mod+shift+f',
    (e) => {
      e.preventDefault();
      toggleFocusMode();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
    },
    [toggleFocusMode]
  );

  // Also allow Escape to exit focus mode
  useHotkeys(
    'escape',
    () => {
      if (isFocusMode) {
        setIsFocusMode(false);
      }
    },
    {
      enableOnContentEditable: true,
      enabled: isFocusMode,
    },
    [isFocusMode]
  );

  // Apply/remove focus-mode class on body
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }

    return () => {
      document.body.classList.remove('focus-mode');
    };
  }, [isFocusMode]);

  return {
    isFocusMode,
    toggleFocusMode,
    setFocusMode,
  };
}
