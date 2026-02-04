/**
 * Block Indicator Extension
 *
 * Tracks which block is hovered and exposes its rect for the React component.
 * Handles block drag-and-drop with long-press activation.
 *
 * IMPORTANT: All animations MUST go through React state -> React render -> CSS transitions.
 * Do NOT try to animate via:
 * - Direct DOM manipulation (ProseMirror re-renders wipe it)
 * - Vanilla JS createElement with inline styles (doesn't animate)
 * - Event handlers that bypass React state
 *
 * The pattern that works:
 * 1. Update module-level state (currentState)
 * 2. Call notifyListeners()
 * 3. React component re-renders with new state
 * 4. CSS transitions handle the animation
 */

console.log('[BlockIndicator] MODULE LOADED')

import { Extension } from "@tiptap/core"
import type { Node as PMNode } from "@tiptap/pm/model"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"

export interface BlockIndicatorState {
  /** Whether indicator should be visible */
  visible: boolean
  /** Position relative to editor container */
  top: number
  height: number
  /** Left edge of the block (for offset calculation) */
  blockLeft: number
  /** Width of the block */
  blockWidth: number
  /** Whether shift is held (shows full frame instead of left line) */
  shiftHeld: boolean
  /** Long press state */
  isLongPressing: boolean
  /** Drag state */
  isDragging: boolean
  /** Drop indicator Y position (relative to editor container) */
  dropIndicatorTop: number | null
  /** Source block overlay (for fade out effect) - React renders this */
  sourceOverlay: {
    left: number
    top: number
    width: number
    height: number
  } | null
  /** Animation state after drop */
  isAnimating: boolean
  /** Indicator should animate from source to landing position after drop */
  indicatorTransition: {
    fromTop: number
    fromHeight: number
    toTop: number
    toHeight: number
  } | null
  /** Animation stage after drop: 'none' | 'shrinking' | 'growing' */
  dropAnimation: 'none' | 'shrinking' | 'growing'
}

export const blockIndicatorKey = new PluginKey<{ isDragging: boolean }>("blockIndicator")

// Module-level state for React subscription
let currentState: BlockIndicatorState = {
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
}
let listeners: ((state: BlockIndicatorState) => void)[] = []

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentState }))
}

export function subscribeToBlockIndicator(
  callback: (state: BlockIndicatorState) => void
): () => void {
  listeners.push(callback)
  callback({ ...currentState })
  return () => {
    listeners = listeners.filter((fn) => fn !== callback)
  }
}

// Store block positions before transaction for FLIP animation
let preDropPositions: Map<number, DOMRect> = new Map()
let dropTargetIndex: number = 0
let movedBlockPos: number | null = null

export function getPreDropPositions() {
  return preDropPositions
}

export function getDropInfo() {
  return { dropTargetIndex, movedBlockPos }
}

export function clearDropInfo() {
  preDropPositions.clear()
  movedBlockPos = null
}

function createBlockIndicatorPlugin() {
  let currentBlockPos: number | null = null
  let shiftHeld = false

  // Long press state
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  let longPressStartPos: { x: number; y: number } | null = null
  const LONG_PRESS_DURATION = 400 // ms
  const LONG_PRESS_MOVE_THRESHOLD = 10 // px - cancel if moved more than this

  // Drag state
  let isDragging = false
  let dragSourcePos: number | null = null
  let dragSourceNode: PMNode | null = null
  let dropTargetPos: number | null = null

  const resetState = () => {
    currentState = {
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
    }
  }

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    longPressStartPos = null
    if (currentState.isLongPressing) {
      currentState = { ...currentState, isLongPressing: false }
      notifyListeners()
    }
  }

  const hide = () => {
    currentBlockPos = null
    cancelLongPress()
    if (isDragging) {
      cancelDrag()
    }
    resetState()
    notifyListeners()
  }

  // Overlay to block interaction during drag
  let dragOverlay: HTMLDivElement | null = null

  const startDrag = (
    pos: number,
    node: PMNode,
    _dom: HTMLElement,
    _clientX: number,
    _clientY: number,
    editorRect: DOMRect,
    editorView: any
  ) => {
    console.log('[BlockIndicator] startDrag called!')

    // Get fresh DOM reference (the captured one might be stale)
    const freshDom = editorView.nodeDOM(pos)
    if (!(freshDom instanceof HTMLElement)) {
      console.log('[BlockIndicator] ERROR: Could not get fresh DOM for pos:', pos)
      return
    }
    const dom = freshDom

    isDragging = true
    dragSourcePos = pos
    dragSourceNode = node
    dropTargetPos = pos

    const blockRect = dom.getBoundingClientRect()

    // Source overlay position (relative to editor container for React)
    const sourceOverlayRect = {
      left: blockRect.left - editorRect.left,
      top: blockRect.top - editorRect.top,
      width: blockRect.width,
      height: blockRect.height,
    }

    currentState = {
      ...currentState,
      visible: true,  // Keep indicator visible during drag (becomes drop indicator)
      isLongPressing: false,
      isDragging: true,
      dropIndicatorTop: blockRect.top - editorRect.top,
      sourceOverlay: sourceOverlayRect,
    }
    notifyListeners()

    // Add body class for cursor
    document.body.classList.add("block-dragging")
    console.log('[BlockIndicator] Drag started')
  }

  const cancelDrag = () => {
    // Remove interaction overlay
    if (dragOverlay) {
      dragOverlay.remove()
      dragOverlay = null
    }

    isDragging = false
    dragSourcePos = null
    dragSourceNode = null
    dropTargetPos = null

    currentState = {
      ...currentState,
      isDragging: false,
      dropIndicatorTop: null,
      sourceOverlay: null,
    }
    notifyListeners()

    document.body.classList.remove("block-dragging")
  }

  const setShiftHeld = (held: boolean) => {
    if (shiftHeld !== held) {
      shiftHeld = held
      currentState = { ...currentState, shiftHeld: held }
      notifyListeners()
    }
  }

  return new Plugin({
    key: blockIndicatorKey,

    state: {
      init: () => ({ isDragging: false }),
      apply: (tr, prev) => {
        const meta = tr.getMeta(blockIndicatorKey)
        if (meta !== undefined) return meta
        return prev
      },
    },

    view: (editorView) => {
      const updateBlockRect = () => {
        if (currentBlockPos === null || isDragging) return

        try {
          const dom = editorView.nodeDOM(currentBlockPos)
          if (dom instanceof HTMLElement) {
            const editorRect = editorView.dom.getBoundingClientRect()
            const blockRect = dom.getBoundingClientRect()

            const top = blockRect.top - editorRect.top
            const height = blockRect.height
            const blockLeft = blockRect.left - editorRect.left
            const blockWidth = blockRect.width

            if (
              currentState.top !== top ||
              currentState.height !== height
            ) {
              currentState = { ...currentState, visible: true, top, height, blockLeft, blockWidth }
              notifyListeners()
            }
          }
        } catch {
          // Position invalid
        }
      }

      const findDropPosition = (clientY: number): { pos: number; top: number; index: number } | null => {
        const { doc } = editorView.state
        const editorRect = editorView.dom.getBoundingClientRect()

        // Collect all block boundaries (gaps between blocks)
        const gaps: { pos: number; top: number; index: number }[] = []
        let blockIndex = 0
        let lastBottom = 0

        doc.forEach((_node, offset) => {
          const dom = editorView.nodeDOM(offset)
          if (!(dom instanceof HTMLElement)) return

          const rect = dom.getBoundingClientRect()
          const blockTop = rect.top - editorRect.top
          const blockBottom = blockTop + rect.height

          // Gap before this block (use midpoint between last bottom and this top)
          const gapTop = blockIndex === 0 ? blockTop : (lastBottom + blockTop) / 2
          gaps.push({ pos: offset, top: gapTop, index: blockIndex })

          lastBottom = blockBottom
          blockIndex++
        })

        // Add gap after last block
        if (blockIndex > 0) {
          gaps.push({ pos: doc.content.size, top: lastBottom, index: blockIndex })
        }

        // Find closest gap to cursor
        let closest = gaps[0]
        let closestDistance = Infinity

        for (const gap of gaps) {
          const dist = Math.abs(clientY - (gap.top + editorRect.top))
          if (dist < closestDistance) {
            closestDistance = dist
            closest = gap
          }
        }

        return closest || null
      }

      const executeMove = () => {
        if (!dragSourceNode || dragSourcePos === null || dropTargetPos === null) return
        if (dropTargetPos === dragSourcePos || dropTargetPos === dragSourcePos + dragSourceNode.nodeSize) {
          return // No actual move
        }

        // Capture values before they get cleared
        const sourceNodeSize = dragSourceNode.nodeSize
        const sourcePos = dragSourcePos

        const { state } = editorView
        let tr = state.tr

        // Delete source node
        tr = tr.delete(sourcePos, sourcePos + sourceNodeSize)

        // Adjust target position
        let adjustedPos = dropTargetPos
        if (dropTargetPos > sourcePos) {
          adjustedPos = dropTargetPos - sourceNodeSize
        }

        // Insert at new position
        tr = tr.insert(adjustedPos, dragSourceNode)

        // Place cursor at start of moved block (not select entire block)
        const $pos = tr.doc.resolve(adjustedPos + 1)
        tr = tr.setSelection(TextSelection.near($pos))

        // Mark transaction
        tr = tr.setMeta(blockIndicatorKey, { isDragging: false, justMoved: adjustedPos })

        // Set animating state
        currentState = {
          ...currentState,
          isDragging: false,
          sourceOverlay: null,
          isAnimating: true,
        }
        notifyListeners()

        editorView.dispatch(tr)

        // Animate indicator: horizontal shrinks to dot, then vertical grows
        requestAnimationFrame(() => {
          const editorRect = editorView.dom.getBoundingClientRect()
          const landedDom = editorView.nodeDOM(adjustedPos)
          const landedRect = landedDom instanceof HTMLElement
            ? landedDom.getBoundingClientRect()
            : null

          const finalHeight = landedRect ? landedRect.height : 24

          // Hide caret during animation
          document.body.classList.add("block-animating")

          // Start shrinking animation - keep horizontal mode, will shrink width
          currentState = {
            ...currentState,
            visible: true,
            isDragging: true,  // Keep horizontal mode for shrinking
            shiftHeld: false,
            top: landedRect ? landedRect.top - editorRect.top : 0,
            height: 2,  // Horizontal line height
            blockLeft: landedRect ? landedRect.left - editorRect.left : 0,
            blockWidth: landedRect ? landedRect.width : 0,
            dropAnimation: 'shrinking',
          }
          notifyListeners()

          // After shrink animation completes, immediately start growing
          setTimeout(() => {
            // Switch to vertical mode, start at dot height (2px)
            currentState = {
              ...currentState,
              isDragging: false,
              height: 2,  // Start from dot
              dropAnimation: 'growing',
            }
            notifyListeners()

            // Next frame: set final height - CSS will animate the growth
            requestAnimationFrame(() => {
              currentState = {
                ...currentState,
                height: finalHeight,
              }
              notifyListeners()

              // After grow animation, return to normal state
              setTimeout(() => {
                currentState = {
                  ...currentState,
                  dropAnimation: 'none',
                }
                notifyListeners()

                // Animation complete
                document.body.classList.remove("block-animating")
              }, 400)
            })
          }, 300)
        })
      }

      const handleMouseMove = (event: MouseEvent) => {
        const target = event.target
        if (!(target instanceof HTMLElement)) return

        // Check if long press should be cancelled due to movement
        if (longPressStartPos) {
          const dx = event.clientX - longPressStartPos.x
          const dy = event.clientY - longPressStartPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance > LONG_PRESS_MOVE_THRESHOLD) {
            cancelLongPress()
          }
        }

        // Handle drag mode - update drop indicator position
        if (isDragging) {
          // Prevent any selection during drag
          event.preventDefault()
          event.stopPropagation()
          window.getSelection()?.removeAllRanges()

          const dropInfo = findDropPosition(event.clientY)
          if (dropInfo) {
            dropTargetPos = dropInfo.pos
            dropTargetIndex = dropInfo.index
          }

          // Track which block the cursor is over for indicator width
          const coords = editorView.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })

          if (coords) {
            const $pos = editorView.state.doc.resolve(coords.pos)
            let blockPos: number | null = null

            for (let d = $pos.depth; d >= 1; d--) {
              if (d === 1) {
                blockPos = $pos.before(d)
                break
              }
            }

            if (blockPos !== null) {
              try {
                const dom = editorView.nodeDOM(blockPos)
                if (dom instanceof HTMLElement) {
                  const editorRect = editorView.dom.getBoundingClientRect()
                  const blockRect = dom.getBoundingClientRect()

                  currentState = {
                    ...currentState,
                    visible: true,
                    top: dropInfo?.top ?? currentState.dropIndicatorTop ?? blockRect.top - editorRect.top,
                    height: 2,  // Horizontal line height
                    blockLeft: blockRect.left - editorRect.left,
                    blockWidth: blockRect.width,
                    dropIndicatorTop: dropInfo?.top ?? currentState.dropIndicatorTop,
                  }
                  notifyListeners()
                }
              } catch {
                // Position invalid
              }
            }
          }
          return
        }

        const coords = editorView.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })

        if (!coords) return

        const $pos = editorView.state.doc.resolve(coords.pos)
        let blockPos: number | null = null

        for (let d = $pos.depth; d >= 1; d--) {
          if (d === 1) {
            blockPos = $pos.before(d)
            break
          }
        }

        if (blockPos !== null && blockPos !== currentBlockPos) {
          currentBlockPos = blockPos

          try {
            const dom = editorView.nodeDOM(blockPos)
            if (dom instanceof HTMLElement) {
              const editorRect = editorView.dom.getBoundingClientRect()
              const blockRect = dom.getBoundingClientRect()

              const top = blockRect.top - editorRect.top
              const height = blockRect.height
              const blockLeft = blockRect.left - editorRect.left
              const blockWidth = blockRect.width

              currentState = {
                ...currentState,
                visible: true,
                top,
                height,
                blockLeft,
                blockWidth,
                shiftHeld,
              }
              notifyListeners()
            }
          } catch {
            // Position invalid
          }
        }
      }

      let mouseDownPos: { x: number; y: number } | null = null

      const handleMouseDown = (event: MouseEvent) => {
        if (currentBlockPos === null) return
        if (event.button !== 0) return // Only left click

        const dom = editorView.nodeDOM(currentBlockPos)
        if (!(dom instanceof HTMLElement)) return

        // Don't block - allow normal text selection
        // We only take over if long press completes

        // Store click position for cursor placement on quick release
        mouseDownPos = { x: event.clientX, y: event.clientY }

        // Start long press detection
        longPressStartPos = { x: event.clientX, y: event.clientY }

        currentState = { ...currentState, isLongPressing: true }
        notifyListeners()

        const editorRect = editorView.dom.getBoundingClientRect()
        const capturedBlockPos = currentBlockPos
        const capturedDom = dom

        longPressTimer = setTimeout(() => {
          console.log('[BlockIndicator] Long press timer fired!')
          // Long press completed - start drag
          const node = editorView.state.doc.nodeAt(capturedBlockPos)
          if (!node) return

          // NOW we take over - clear any selection that started
          window.getSelection()?.removeAllRanges()

          // Create overlay for cursor styling only (pointer-events: none lets events through)
          dragOverlay = document.createElement('div')
          dragOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 999;
            cursor: grabbing;
            pointer-events: none;
          `
          document.body.appendChild(dragOverlay)

          startDrag(capturedBlockPos, node, capturedDom, event.clientX, event.clientY, editorRect, editorView)
        }, LONG_PRESS_DURATION)
      }

      const handleMouseUp = () => {
        const wasDragging = isDragging
        mouseDownPos = null

        cancelLongPress()

        // If wasn't dragging, let normal click/selection behavior happen
        if (!wasDragging) {
          return
        }

        // Remove interaction overlay
        if (dragOverlay) {
          dragOverlay.remove()
          dragOverlay = null
        }

        // Execute the move
        executeMove()

        // Clean up drag state (but keep animation state)
        isDragging = false
        dragSourcePos = null
        dragSourceNode = null
        dropTargetPos = null

        document.body.classList.remove("block-dragging")

        currentState = {
          ...currentState,
          isDragging: false,
          sourceOverlay: null,
        }
        notifyListeners()
      }

      const handleScroll = () => {
        updateBlockRect()
      }

      const handleGlobalMouseMove = (event: MouseEvent) => {
        if (!currentState.visible && !isDragging) return

        const editorRect = editorView.dom.getBoundingClientRect()
        const padding = 50

        const isOutside =
          event.clientX < editorRect.left - padding ||
          event.clientX > editorRect.right + padding ||
          event.clientY < editorRect.top - padding ||
          event.clientY > editorRect.bottom + padding

        if (isOutside && !isDragging) {
          hide()
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Shift') {
          setShiftHeld(true)
        }
        if (event.key === 'Escape') {
          cancelLongPress()
          if (isDragging) {
            cancelDrag()
          }
        }
      }

      const handleKeyUp = (event: KeyboardEvent) => {
        if (event.key === 'Shift') {
          setShiftHeld(false)
        }
      }

      editorView.dom.addEventListener("mousemove", handleMouseMove)
      editorView.dom.addEventListener("mousedown", handleMouseDown, true)  // Capture phase
      window.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("scroll", handleScroll, true)
      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)

      return {
        update: () => {
          updateBlockRect()
        },
        destroy: () => {
          cancelLongPress()
          if (isDragging) {
            cancelDrag()
          }
          editorView.dom.removeEventListener("mousemove", handleMouseMove)
          editorView.dom.removeEventListener("mousedown", handleMouseDown, true)
          window.removeEventListener("mouseup", handleMouseUp)
          document.removeEventListener("mousemove", handleGlobalMouseMove)
          window.removeEventListener("scroll", handleScroll, true)
          window.removeEventListener("keydown", handleKeyDown)
          window.removeEventListener("keyup", handleKeyUp)
        },
      }
    },
  })
}

// Called by React component when animation completes
export function finishAnimation() {
  currentState = {
    ...currentState,
    isAnimating: false,
    indicatorTransition: null,
  }
  clearDropInfo()
  notifyListeners()
}

export const BlockIndicator = Extension.create({
  name: "blockIndicator",

  addProseMirrorPlugins() {
    return [createBlockIndicatorPlugin()]
  },
})
