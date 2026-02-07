/**
 * BlockIndicator - Animated indicator line for hovered blocks
 *
 * The indicator morphs between states:
 * 1. Side indicator line (default hover) - vertical line on left of block
 * 2. Full frame (Command held) - border around entire block for hover
 * 3. Drop indicator (during drag) - horizontal line at drop position
 * 4. Selection frames (Command+click) - static frames around selected blocks
 *
 * Also renders: Ghost block, source overlay during drag
 */

import { useEffect, useState, useRef, useMemo } from "react"
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
    commandHeld: false,
    isLongPressing: false,
    isDragging: false,
    dropIndicatorTop: null,
    isAnimating: false,
    indicatorTransition: null,
    dropAnimation: 'none',
    selectedBlocks: [],
    lastSelectedPos: null,
    paginationEnabled: false,
    horizontalDropSide: null,
    horizontalDropBlockPos: null,
    horizontalDropRect: null,
    horizontalDropColumnIndex: null,
    horizontalDropGapX: null,
  })

  const hasEverShown = useRef(false)
  const lastPosition = useRef({ top: 0, height: 0, blockLeft: 0, blockWidth: 0 })

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

  // Group contiguous selected blocks into single frames
  // Blocks are contiguous if they're visually adjacent (bottom meets top)
  // In pagination mode, blocks on different pages are never merged
  const groupedSelections = useMemo(() => {
    if (state.selectedBlocks.length === 0) return []

    // Sort by page first, then by top within page
    const sorted = [...state.selectedBlocks].sort((a, b) => {
      if (state.paginationEnabled && a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber
      }
      return a.top - b.top
    })

    const groups: Array<{
      top: number
      height: number
      blockLeft: number
      blockWidth: number
      key: string
      pageNumber: number
    }> = []

    let currentGroup = {
      top: sorted[0].top,
      bottom: sorted[0].top + sorted[0].height,
      blockLeft: sorted[0].blockLeft,
      blockRight: sorted[0].blockLeft + sorted[0].blockWidth,
      positions: [sorted[0].pos],
      pageNumber: sorted[0].pageNumber ?? 1,
    }

    for (let i = 1; i < sorted.length; i++) {
      const block = sorted[i]
      const blockBottom = block.top + block.height
      const blockPage = block.pageNumber ?? 1

      // Don't merge across pages in pagination mode
      const samePage = !state.paginationEnabled || blockPage === currentGroup.pageNumber

      // Check if this block is contiguous with current group
      // Allow gap up to 24px for block margins/padding
      const gap = block.top - currentGroup.bottom
      const isContiguous = gap <= 24 && samePage

      if (isContiguous) {
        // Extend current group
        currentGroup.bottom = Math.max(currentGroup.bottom, blockBottom)
        currentGroup.blockLeft = Math.min(currentGroup.blockLeft, block.blockLeft)
        currentGroup.blockRight = Math.max(currentGroup.blockRight, block.blockLeft + block.blockWidth)
        currentGroup.positions.push(block.pos)
      } else {
        // Start new group - save current one first
        groups.push({
          top: currentGroup.top,
          height: currentGroup.bottom - currentGroup.top,
          blockLeft: currentGroup.blockLeft,
          blockWidth: currentGroup.blockRight - currentGroup.blockLeft,
          key: currentGroup.positions.join('-'),
          pageNumber: currentGroup.pageNumber,
        })

        currentGroup = {
          top: block.top,
          bottom: blockBottom,
          blockLeft: block.blockLeft,
          blockRight: block.blockLeft + block.blockWidth,
          positions: [block.pos],
          pageNumber: blockPage,
        }
      }
    }

    // Don't forget the last group
    groups.push({
      top: currentGroup.top,
      height: currentGroup.bottom - currentGroup.top,
      blockLeft: currentGroup.blockLeft,
      blockWidth: currentGroup.blockRight - currentGroup.blockLeft,
      key: currentGroup.positions.join('-'),
      pageNumber: currentGroup.pageNumber,
    })

    return groups
  }, [state.selectedBlocks, state.paginationEnabled])

  // Calculate indicator style based on mode.
  // All state.* position values are in content space (via offsetTop/offsetLeft chain).
  // CSS absolute positioning inside .editor-content-wrapper uses the same space.
  // No zoom conversion needed -- CSS zoom scales everything uniformly.
  const isDragMode = state.isDragging && state.dropAnimation !== 'shrinking'
  const v = (px: number) => px

  let indicatorStyle: React.CSSProperties
  if (state.dropAnimation === 'shrinking') {
    indicatorStyle = {
      position: "absolute",
      left: v(state.blockLeft) - offset,
      top: v(state.top),
      height: 2,
      width: 2,
    }
  } else if (state.dropAnimation === 'growing') {
    indicatorStyle = {
      position: "absolute",
      left: v(state.blockLeft) - offset,
      top: v(state.top),
      height: v(state.height),
      width: undefined,
    }
  } else if (isDragMode) {
    indicatorStyle = {
      position: "absolute",
      left: v(state.blockLeft) - offset,
      top: v(state.dropIndicatorTop ?? state.top),
      height: 2,
      width: v(state.blockWidth) + offset * 2,
    }
  } else if (state.commandHeld) {
    indicatorStyle = {
      position: "absolute",
      left: v(state.blockLeft) - offset,
      top: v(state.top),
      height: v(state.height) || 24,
      width: v(state.blockWidth) + offset * 2,
    }
  } else {
    indicatorStyle = {
      position: "absolute",
      left: v(state.blockLeft) - offset,
      top: v(state.top),
      height: v(state.height) || 24,
      width: undefined,
    }
  }

  // Check if current block is in selection (to avoid double-rendering)
  const currentBlockInSelection = state.selectedBlocks.some(
    (block) =>
      block.top === state.top &&
      block.height === state.height &&
      block.blockLeft === state.blockLeft
  )

  return (
    <>
      {/* Selection indicators - one per contiguous group (NO animation) */}
      {groupedSelections.map((group) => (
        <div
          key={group.key}
          className="block-indicator-line"
          style={{
            position: "absolute",
            left: v(group.blockLeft) - offset,
            top: v(group.top),
            height: v(group.height),
            width: v(group.blockWidth) + offset * 2,
          }}
          data-visible="true"
          data-frame="true"
          data-selected="true"
        />
      ))}

      {/* Hover indicator (when current block is not selected) -- hide when horizontal drop active */}
      {!currentBlockInSelection && !state.horizontalDropSide && (
        <div
          className="block-indicator-line"
          style={indicatorStyle}
          data-visible={state.visible ? "true" : "false"}
          data-animate={hasEverShown.current ? "true" : "false"}
          data-frame={state.commandHeld ? "true" : "false"}
          data-horizontal={isDragMode ? "true" : "false"}
          data-long-pressing={state.isLongPressing ? "true" : "false"}
          data-shrinking={state.dropAnimation === 'shrinking' ? "true" : "false"}
          data-growing={state.dropAnimation === 'growing' ? "true" : "false"}
        />
      )}

      {/* Vertical drop indicator for column creation (during drag with horizontal drop active) */}
      {state.isDragging && state.horizontalDropSide && state.horizontalDropRect && (
        <div
          className="block-drop-indicator-vertical"
          style={{
            position: "absolute",
            left: state.horizontalDropGapX != null
              ? v(state.horizontalDropGapX)
              : state.horizontalDropSide === 'left'
                ? v(state.horizontalDropRect.left) - offset - 2
                : v(state.horizontalDropRect.left + state.horizontalDropRect.width) + offset,
            top: v(state.horizontalDropRect.top),
            width: 3,
            height: v(state.horizontalDropRect.height),
          }}
          data-visible="true"
        />
      )}
    </>
  )
}
