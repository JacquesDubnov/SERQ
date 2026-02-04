/**
 * BlockIndicatorToggle - Toggle button for the block indicator feature
 *
 * When enabled (default), shows the blue side line indicator on block hover.
 * When disabled, completely disables the feature to save processing power.
 */

import { forwardRef, useCallback, useEffect, useState } from "react"

// --- Block Indicator ---
import {
  isBlockIndicatorEnabled,
  setBlockIndicatorEnabled,
  subscribeToBlockIndicatorEnabled,
} from "@/extensions/block-indicator"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icon ---
import { BlockIndicatorIcon } from "@/components/tiptap-icons/block-indicator-icon"

export interface BlockIndicatorToggleProps extends Omit<ButtonProps, "type"> {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
}

/**
 * Toggle button for enabling/disabling the block indicator feature.
 */
export const BlockIndicatorToggle = forwardRef<
  HTMLButtonElement,
  BlockIndicatorToggleProps
>(({ text, onClick, children, ...buttonProps }, ref) => {
  const [enabled, setEnabled] = useState(() => isBlockIndicatorEnabled())

  useEffect(() => {
    const unsubscribe = subscribeToBlockIndicatorEnabled(setEnabled)
    return unsubscribe
  }, [])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      setBlockIndicatorEnabled(!enabled)
    },
    [enabled, onClick]
  )

  const label = enabled ? "Hide block indicator" : "Show block indicator"

  return (
    <Button
      type="button"
      data-style="ghost"
      data-active-state={enabled ? "on" : "off"}
      role="button"
      tabIndex={-1}
      aria-label={label}
      aria-pressed={enabled}
      tooltip={label}
      onClick={handleClick}
      {...buttonProps}
      ref={ref}
    >
      {children ?? (
        <>
          <BlockIndicatorIcon className="tiptap-button-icon" />
          {text && <span className="tiptap-button-text">{text}</span>}
        </>
      )}
    </Button>
  )
})

BlockIndicatorToggle.displayName = "BlockIndicatorToggle"
