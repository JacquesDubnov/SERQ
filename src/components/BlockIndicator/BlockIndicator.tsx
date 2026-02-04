/**
 * BlockIndicator - Animated indicator line for hovered blocks
 *
 * The indicator morphs between states:
 * 1. Side indicator line (default hover) - vertical line on left of block
 * 2. Full frame (Shift held) - border around entire block
 * 3. Drop indicator (during drag) - horizontal line at drop position
 *
 * Also renders: Ghost block, source overlay during drag
 */

import { useEffect, useState, useRef } from "react"
import {
  subscribeToBlockIndicator,
  finishAnimation,
  type BlockIndicatorState,
} from "@/extensions/block-indicator"

import "./BlockIndicator.css"

// Read CSS variable value, with fallback
function getCSSVar(name: string, fallback: number): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value ? parseFloat(value) : fallback
}

export const BlockIndicator: React.FC = () => {
  const [state, setState] = useState<BlockIndicatorState>({
    visible: false,
    top: 0,
    height: 0,
    blockLeft: 0,
    blockWidth: 0,
    shiftHeld: false,
    isLongPressing: false,
    isDragging: false,
    dropIndicatorTop: null,
    sourceOverlay: null,
    isAnimating: false,
    indicatorTransition: null,
    dropAnimation: 'none',
  })

  const hasEverShown = useRef(false)
  const lastPosition = useRef({ top: 0, height: 0, blockLeft: 0, blockWidth: 0 })

  // Source overlay animation
  const [sourceOverlayVisible, setSourceOverlayVisible] = useState(false)
  const sourceOverlayMounted = useRef(false)

  useEffect(() => {
    const unsubscribe = subscribeToBlockIndicator((newState) => {
      if (newState.visible) {
        hasEverShown.current = true
        lastPosition.current = {
          top: newState.top,
          height: newState.height,
          blockLeft: newState.blockLeft,
          blockWidth: newState.blockWidth,
        }
      }
      setState(newState)
    })

    return unsubscribe
  }, [])

  // Handle source overlay animation
  useEffect(() => {
    if (state.sourceOverlay && !sourceOverlayMounted.current) {
      sourceOverlayMounted.current = true
      setSourceOverlayVisible(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSourceOverlayVisible(true)
        })
      })
    } else if (!state.sourceOverlay && sourceOverlayMounted.current) {
      sourceOverlayMounted.current = false
      setSourceOverlayVisible(false)
    }
  }, [state.sourceOverlay])

  // Handle animation completion
  useEffect(() => {
    if (state.isAnimating) {
      const timer = setTimeout(() => {
        finishAnimation()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.isAnimating])

  const offset = getCSSVar("--block-indicator-offset", 16)

  // Calculate indicator style based on mode
  const isDragMode = state.isDragging && state.dropAnimation !== 'shrinking'

  let indicatorStyle: React.CSSProperties
  if (state.dropAnimation === 'shrinking') {
    // Horizontal line shrinking to a dot at top-left
    indicatorStyle = {
      position: "absolute",
      left: state.blockLeft - offset,
      top: state.top,
      height: 2,
      width: 2,  // Shrink to dot
    }
  } else if (state.dropAnimation === 'growing') {
    // Vertical line growing from dot - height comes from state (animates via CSS)
    indicatorStyle = {
      position: "absolute",
      left: state.blockLeft - offset,
      top: state.top,
      height: state.height,
      width: undefined,  // Back to default width (2px)
    }
  } else if (isDragMode) {
    indicatorStyle = {
      position: "absolute",
      left: state.blockLeft - offset,
      top: state.dropIndicatorTop ?? state.top,
      height: 2,
      width: state.blockWidth + offset * 2,
    }
  } else if (state.shiftHeld) {
    indicatorStyle = {
      position: "absolute",
      left: state.blockLeft - offset,
      top: state.top,
      height: state.height || 24,
      width: state.blockWidth + offset * 2,
    }
  } else {
    indicatorStyle = {
      position: "absolute",
      left: state.blockLeft - offset,
      top: state.top,
      height: state.height || 24,
      width: undefined,
    }
  }

  return (
    <>
      {/* Source overlay - covers original block, fades in to hide text */}
      {state.sourceOverlay && (
        <div
          className="block-source-overlay"
          style={{
            position: "absolute",
            left: state.sourceOverlay.left,
            top: state.sourceOverlay.top,
            width: state.sourceOverlay.width,
            height: state.sourceOverlay.height,
          }}
          data-visible={sourceOverlayVisible ? "true" : "false"}
        />
      )}

      {/* Unified indicator */}
      <div
        className="block-indicator-line"
        style={indicatorStyle}
        data-visible={state.visible ? "true" : "false"}
        data-animate={hasEverShown.current ? "true" : "false"}
        data-frame={state.shiftHeld ? "true" : "false"}
        data-horizontal={isDragMode ? "true" : "false"}
        data-long-pressing={state.isLongPressing ? "true" : "false"}
        data-shrinking={state.dropAnimation === 'shrinking' ? "true" : "false"}
        data-growing={state.dropAnimation === 'growing' ? "true" : "false"}
      />
    </>
  )
}
