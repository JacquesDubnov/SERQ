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

console.log('[BlockIndicator] MODULE LOADED at', new Date().toISOString())

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
  /** Whether Option is held (shows full frame instead of left line) */
  commandHeld: boolean
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

  // Multi-block selection
  /** Array of selected blocks with their positions and dimensions */
  selectedBlocks: Array<{
    pos: number        // ProseMirror position
    top: number
    height: number
    blockLeft: number
    blockWidth: number
    pageNumber: number // Page number (1-indexed) for pagination support
  }>
  /** Last selected block position (for range selection) */
  lastSelectedPos: number | null

  /** Whether pagination mode is active */
  paginationEnabled: boolean
}

export const blockIndicatorKey = new PluginKey<{ isDragging: boolean }>("blockIndicator")

// HMR state persistence - preserve state across hot reloads
interface HMRState {
  currentState: BlockIndicatorState
  listeners: ((state: BlockIndicatorState) => void)[]
  selectedBlockPositions: Set<number>
  lastSelectedPos: number | null
  commandHeld: boolean
  indicatorEnabled: boolean
  enabledListeners: ((enabled: boolean) => void)[]
}

// Try to restore state from HMR, otherwise use defaults
const defaultState: BlockIndicatorState = {
  visible: false,
  top: 0,
  height: 0,
  blockLeft: 0,
  blockWidth: 0,
  commandHeld: false,
  isLongPressing: false,
  isDragging: false,
  dropIndicatorTop: null,
  sourceOverlay: null,
  isAnimating: false,
  indicatorTransition: null,
  dropAnimation: 'none',
  selectedBlocks: [],
  lastSelectedPos: null,
  paginationEnabled: false,
}

// Get persisted state from HMR or use defaults
const hmrData = (import.meta.hot?.data as HMRState | undefined)

// Module-level state for React subscription
let currentState: BlockIndicatorState = hmrData?.currentState ?? { ...defaultState }
let listeners: ((state: BlockIndicatorState) => void)[] = hmrData?.listeners ?? []

// Module-level selection tracking
let selectedBlockPositions = hmrData?.selectedBlockPositions ?? new Set<number>()
let lastSelectedPos: number | null = hmrData?.lastSelectedPos ?? null
let commandHeld = hmrData?.commandHeld ?? false

// Enable/disable state
let indicatorEnabled = hmrData?.indicatorEnabled ?? true
let enabledListeners: ((enabled: boolean) => void)[] = hmrData?.enabledListeners ?? []

// Preserve state on HMR
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    const data = import.meta.hot!.data as HMRState
    data.currentState = currentState
    data.listeners = listeners
    data.selectedBlockPositions = selectedBlockPositions
    data.lastSelectedPos = lastSelectedPos
    data.commandHeld = commandHeld
    data.indicatorEnabled = indicatorEnabled
    data.enabledListeners = enabledListeners
  })
}

/**
 * Enable or disable the block indicator feature
 * When disabled, no event handlers run and indicator is hidden
 */
export function setBlockIndicatorEnabled(enabled: boolean) {
  if (indicatorEnabled === enabled) return
  indicatorEnabled = enabled

  // If disabling, hide indicator and clear selections
  if (!enabled) {
    currentState = {
      ...currentState,
      visible: false,
      selectedBlocks: [],
      lastSelectedPos: null,
    }
    selectedBlockPositions.clear()
    lastSelectedPos = null
    notifyListeners()
  }

  // Notify enabled state listeners
  enabledListeners.forEach((fn) => fn(enabled))
}

/**
 * Check if block indicator is enabled
 */
export function isBlockIndicatorEnabled(): boolean {
  return indicatorEnabled
}

/**
 * Get the set of selected block positions
 * Returns a copy to prevent external modification
 */
export function getSelectedBlockPositions(): Set<number> {
  return new Set(selectedBlockPositions)
}

/**
 * Check if any blocks are currently selected
 */
export function hasSelectedBlocks(): boolean {
  return selectedBlockPositions.size > 0
}

/**
 * Get count of selected blocks
 */
export function getSelectedBlockCount(): number {
  return selectedBlockPositions.size
}

// Selection change listeners
let selectionListeners: ((positions: Set<number>) => void)[] = []

/**
 * Subscribe to block selection changes
 * Callback receives the set of selected positions whenever selection changes
 */
export function subscribeToBlockSelection(
  callback: (positions: Set<number>) => void
): () => void {
  selectionListeners.push(callback)
  callback(new Set(selectedBlockPositions))
  return () => {
    selectionListeners = selectionListeners.filter((fn) => fn !== callback)
  }
}

// Notify selection listeners when selection changes
function notifySelectionListeners() {
  const positions = new Set(selectedBlockPositions)
  selectionListeners.forEach((fn) => fn(positions))
}

/**
 * Subscribe to enabled state changes
 */
export function subscribeToBlockIndicatorEnabled(
  callback: (enabled: boolean) => void
): () => void {
  enabledListeners.push(callback)
  callback(indicatorEnabled)
  return () => {
    enabledListeners = enabledListeners.filter((fn) => fn !== callback)
  }
}

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentState }))
}

/**
 * Check if an element is in a non-content area (header, footer, or page gap)
 * These areas should not show the block indicator
 */
const isNonContentArea = (element: HTMLElement): boolean => {
  // Direct check for header/footer/gap elements
  const inGap = element.closest('.tiptap-pagination-gap') !== null
  const inHeader = element.closest('.tiptap-page-header') !== null
  const inFooter = element.closest('.tiptap-page-footer') !== null

  if (inHeader || inFooter || inGap) {
    return true
  }

  return false
}

/**
 * Check if coordinates are in a non-content area (gap, header, footer) in pagination mode.
 * Returns false if over a gap, header, or footer. Returns true otherwise.
 */
const isInPageContentArea = (clientY: number, _editorDom: HTMLElement): boolean => {
  // Find pagination container anywhere in the document
  const paginationContainer = document.querySelector('[data-tiptap-pagination]') as HTMLElement | null
  if (!paginationContainer) return true // Not paginated, always in content

  // Buffer to catch edge pixels at boundaries between content and gap/header/footer
  // Needs to be large enough to cover any visual transition areas
  const EDGE_BUFFER = 30

  // Check gaps - these have pointer-events:none so we check by coordinates
  const gaps = paginationContainer.querySelectorAll('.tiptap-pagination-gap')
  for (const gap of gaps) {
    const rect = gap.getBoundingClientRect()
    // Extend bounds slightly to catch edge pixels
    if (clientY >= rect.top - EDGE_BUFFER && clientY <= rect.bottom + EDGE_BUFFER) {
      return false // Over a gap
    }
  }

  // Check headers - extend into gap area
  const headers = paginationContainer.querySelectorAll('.tiptap-page-header')
  for (const header of headers) {
    const rect = header.getBoundingClientRect()
    if (clientY >= rect.top - EDGE_BUFFER && clientY <= rect.bottom + EDGE_BUFFER) {
      return false // Over a header
    }
  }

  // Check footers - extend into gap area
  const footers = paginationContainer.querySelectorAll('.tiptap-page-footer')
  for (const footer of footers) {
    const rect = footer.getBoundingClientRect()
    if (clientY >= rect.top - EDGE_BUFFER && clientY <= rect.bottom + EDGE_BUFFER) {
      return false // Over a footer
    }
  }

  return true // Not in gap/header/footer, so it's content
}

/**
 * Get the reference rect for positioning.
 * Always use the editor-content-wrapper since that's where BlockIndicator renders.
 */
const getPositionReferenceRect = (editorDom: HTMLElement): DOMRect => {
  // Find the wrapper - BlockIndicator component is a sibling of editor-content inside this wrapper
  const wrapper = editorDom.closest('.editor-content-wrapper') as HTMLElement | null
  if (wrapper) {
    return wrapper.getBoundingClientRect()
  }

  // Fallback to editor dom
  return editorDom.getBoundingClientRect()
}

/**
 * Check if pagination mode is enabled by looking for the pagination container
 */
const isPaginationEnabled = (editorDom: HTMLElement): boolean => {
  return editorDom.closest('[data-tiptap-pagination]') !== null
}


/**
 * Get the page number for a given DOM element (1-indexed)
 * Uses DOM hierarchy to find which .page element contains the block
 */
const getPageNumberForElement = (element: HTMLElement): number => {
  // Find the closest .page ancestor
  const pageElement = element.closest('.page')
  if (!pageElement) return 1

  // Find the pagination container
  const paginationContainer = element.closest('[data-tiptap-pagination]')
  if (!paginationContainer) return 1

  // Get all page elements and find index
  const pages = paginationContainer.querySelectorAll('.page')
  const pageIndex = Array.from(pages).indexOf(pageElement)

  return pageIndex >= 0 ? pageIndex + 1 : 1
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

// Helper to clear all selections
function clearSelections() {
  selectedBlockPositions.clear()
  lastSelectedPos = null
  currentState = {
    ...currentState,
    selectedBlocks: [],
    lastSelectedPos: null,
  }
  notifyListeners()
  notifySelectionListeners()
}

function createBlockIndicatorPlugin() {
  let currentBlockPos: number | null = null

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
      commandHeld: false,
      isLongPressing: false,
      isDragging: false,
      dropIndicatorTop: null,
      sourceOverlay: null,
      isAnimating: false,
      indicatorTransition: null,
      dropAnimation: 'none',
      selectedBlocks: currentState.selectedBlocks, // Preserve selections on reset
      lastSelectedPos: currentState.lastSelectedPos,
      paginationEnabled: currentState.paginationEnabled, // Preserve pagination state
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

  const setCommandHeld = (held: boolean) => {
    if (commandHeld !== held) {
      commandHeld = held
      currentState = { ...currentState, commandHeld: held }
      notifyListeners()
    }
  }

  // Track input mode: 'mouse' shows indicator at hover, 'keyboard' shows at caret
  let inputMode: 'mouse' | 'keyboard' = 'mouse'

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
            // Skip headers/footers
            if (isNonContentArea(dom)) return

            const refRect = getPositionReferenceRect(editorView.dom)
            const blockRect = dom.getBoundingClientRect()
            const isPaginated = isPaginationEnabled(editorView.dom)

            const top = blockRect.top - refRect.top
            const height = blockRect.height
            const blockLeft = blockRect.left - refRect.left
            const blockWidth = blockRect.width

            if (
              currentState.top !== top ||
              currentState.height !== height ||
              currentState.paginationEnabled !== isPaginated
            ) {
              currentState = {
                ...currentState,
                visible: true,
                top,
                height,
                blockLeft,
                blockWidth,
                paginationEnabled: isPaginated,
              }
              notifyListeners()
            }
          }
        } catch {
          // Position invalid
        }
      }

      const findDropPosition = (clientY: number): {
        pos: number
        top: number
        index: number
        pageNumber: number
      } | null => {
        const { doc } = editorView.state
        const editorRect = getPositionReferenceRect(editorView.dom)
        const isPaginated = isPaginationEnabled(editorView.dom)

        // Collect all block boundaries (gaps between blocks)
        const gaps: { pos: number; top: number; index: number; pageNumber: number }[] = []
        let blockIndex = 0
        let lastBottom = 0
        let lastPageNumber = 1

        doc.forEach((_node, offset) => {
          const dom = editorView.nodeDOM(offset)
          if (!(dom instanceof HTMLElement)) return

          // Skip headers/footers
          if (isNonContentArea(dom)) return

          const rect = dom.getBoundingClientRect()
          const blockTop = rect.top - editorRect.top
          const blockBottom = blockTop + rect.height
          const pageNumber = isPaginated ? getPageNumberForElement(dom) : 1

          // Gap before this block
          let gapTop: number
          if (blockIndex === 0) {
            gapTop = blockTop
          } else if (pageNumber !== lastPageNumber) {
            // Page boundary - gap is at the start of new page's first block
            gapTop = blockTop
          } else {
            // Normal gap - midpoint between last bottom and this top
            gapTop = (lastBottom + blockTop) / 2
          }

          gaps.push({ pos: offset, top: gapTop, index: blockIndex, pageNumber })

          lastBottom = blockBottom
          lastPageNumber = pageNumber
          blockIndex++
        })

        // Add gap after last block
        if (blockIndex > 0) {
          gaps.push({
            pos: doc.content.size,
            top: lastBottom,
            index: blockIndex,
            pageNumber: lastPageNumber,
          })
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

      // Selection helper: select range of blocks between two positions
      const selectBlockRange = (fromPos: number, toPos: number) => {
        const { doc } = editorView.state
        const minPos = Math.min(fromPos, toPos)
        const maxPos = Math.max(fromPos, toPos)

        doc.forEach((_node, offset) => {
          if (offset >= minPos && offset <= maxPos) {
            selectedBlockPositions.add(offset)
          }
        })
        lastSelectedPos = toPos
      }

      // Selection helper: deselect range of blocks between two positions
      const deselectBlockRange = (fromPos: number, toPos: number) => {
        const { doc } = editorView.state
        const minPos = Math.min(fromPos, toPos)
        const maxPos = Math.max(fromPos, toPos)

        doc.forEach((_node, offset) => {
          if (offset >= minPos && offset <= maxPos) {
            selectedBlockPositions.delete(offset)
          }
        })
        // Update lastSelectedPos
        lastSelectedPos = selectedBlockPositions.size > 0
          ? Array.from(selectedBlockPositions).pop() ?? null
          : null
      }

      // Update React state with current selected blocks
      const updateSelectedBlocksState = () => {
        const blocks: Array<{
          pos: number
          top: number
          height: number
          blockLeft: number
          blockWidth: number
          pageNumber: number
        }> = []
        const refRect = getPositionReferenceRect(editorView.dom)
        const isPaginated = isPaginationEnabled(editorView.dom)

        selectedBlockPositions.forEach((pos) => {
          try {
            const dom = editorView.nodeDOM(pos)
            if (dom instanceof HTMLElement) {
              // Skip headers/footers
              if (isNonContentArea(dom)) {
                selectedBlockPositions.delete(pos)
                return
              }

              const rect = dom.getBoundingClientRect()
              const blockLeft = rect.left - refRect.left
              blocks.push({
                pos,
                top: rect.top - refRect.top,
                height: rect.height,
                blockLeft,
                blockWidth: rect.width,
                pageNumber: isPaginated ? getPageNumberForElement(dom) : 1,
              })
            }
          } catch {
            // Position no longer valid, remove it
            selectedBlockPositions.delete(pos)
          }
        })

        currentState = {
          ...currentState,
          selectedBlocks: blocks,
          lastSelectedPos,
          paginationEnabled: isPaginated,
        }
        notifyListeners()
        notifySelectionListeners()
      }

      // Validate selected positions still exist (after doc changes)
      const validateSelectedPositions = () => {
        const { doc } = editorView.state
        const validPositions = new Set<number>()

        doc.forEach((_node, offset) => {
          if (selectedBlockPositions.has(offset)) {
            validPositions.add(offset)
          }
        })

        selectedBlockPositions = validPositions
        if (lastSelectedPos !== null && !validPositions.has(lastSelectedPos)) {
          lastSelectedPos = null
        }
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
          const refRect = getPositionReferenceRect(editorView.dom)
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
            commandHeld: false,
            top: landedRect ? landedRect.top - refRect.top : 0,
            height: 2,  // Horizontal line height
            blockLeft: landedRect ? landedRect.left - refRect.left : 0,
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
        // Skip if disabled
        if (!indicatorEnabled) return

        const target = event.target
        if (!(target instanceof HTMLElement)) return

        // Skip if hovering over header/footer/gap
        if (isNonContentArea(target)) {
          if (currentState.visible && !isDragging) {
            currentState = { ...currentState, visible: false }
            notifyListeners()
          }
          return
        }

        // In pagination mode, also check if Y coordinate is in page content area
        // This catches gaps (which have pointer-events: none so target won't be the gap)
        if (!isInPageContentArea(event.clientY, editorView.dom)) {
          if (currentState.visible && !isDragging) {
            currentState = { ...currentState, visible: false }
            notifyListeners()
          }
          return
        }

        // Switch to mouse mode when mouse moves in editor
        inputMode = 'mouse'

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
                  // Skip headers/footers during drag
                  if (isNonContentArea(dom)) return

                  const refRect = getPositionReferenceRect(editorView.dom)
                  const blockRect = dom.getBoundingClientRect()
                  const blockLeft = blockRect.left - refRect.left

                  currentState = {
                    ...currentState,
                    visible: true,
                    top: dropInfo?.top ?? currentState.dropIndicatorTop ?? blockRect.top - refRect.top,
                    height: 2,  // Horizontal line height
                    blockLeft,
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
              // Skip header/footer nodes
              if (isNonContentArea(dom)) {
                currentBlockPos = null
                if (currentState.visible) {
                  currentState = { ...currentState, visible: false }
                  notifyListeners()
                }
                return
              }

              const refRect = getPositionReferenceRect(editorView.dom)
              const blockRect = dom.getBoundingClientRect()
              const isPaginated = isPaginationEnabled(editorView.dom)
              const blockLeft = blockRect.left - refRect.left

              currentState = {
                ...currentState,
                visible: true,
                top: blockRect.top - refRect.top,
                height: blockRect.height,
                blockLeft,
                blockWidth: blockRect.width,
                commandHeld,
                paginationEnabled: isPaginated,
              }
              notifyListeners()
            }
          } catch {
            // Position invalid
          }
        }
      }

      const handleMouseDown = (event: MouseEvent) => {
        // Skip if disabled
        if (!indicatorEnabled) return
        if (currentBlockPos === null) return
        if (event.button !== 0) return // Only left click

        const dom = editorView.nodeDOM(currentBlockPos)
        if (!(dom instanceof HTMLElement)) return

        // Option+click selection logic
        if (event.altKey) {
          event.preventDefault()
          event.stopPropagation()

          if (event.shiftKey && lastSelectedPos !== null) {
            // Range selection/deselection: toggle based on whether clicked block is selected
            if (selectedBlockPositions.has(currentBlockPos)) {
              // Clicked block is selected - deselect the range
              deselectBlockRange(lastSelectedPos, currentBlockPos)
            } else {
              // Clicked block is not selected - select the range
              selectBlockRange(lastSelectedPos, currentBlockPos)
            }
          } else {
            // Toggle single block selection
            if (selectedBlockPositions.has(currentBlockPos)) {
              selectedBlockPositions.delete(currentBlockPos)
              // Update lastSelectedPos if we deselected it
              if (lastSelectedPos === currentBlockPos) {
                lastSelectedPos = selectedBlockPositions.size > 0
                  ? Array.from(selectedBlockPositions).pop() ?? null
                  : null
              }
            } else {
              selectedBlockPositions.add(currentBlockPos)
              lastSelectedPos = currentBlockPos
            }
          }

          updateSelectedBlocksState()
          return  // Don't proceed to drag logic
        }

        // Click without Option = deselect all selected blocks
        if (selectedBlockPositions.size > 0) {
          clearSelections()
        }

        // Don't block - allow normal text selection
        // We only take over if long press completes

        // Start long press detection
        longPressStartPos = { x: event.clientX, y: event.clientY }

        currentState = { ...currentState, isLongPressing: true }
        notifyListeners()

        const refRect = getPositionReferenceRect(editorView.dom)
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

          startDrag(capturedBlockPos, node, capturedDom, event.clientX, event.clientY, refRect, editorView)
        }, LONG_PRESS_DURATION)
      }

      const handleMouseUp = () => {
        const wasDragging = isDragging

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
        // Also update selected blocks positions on scroll
        if (selectedBlockPositions.size > 0) {
          updateSelectedBlocksState()
        }
      }

      const handleGlobalMouseMove = (event: MouseEvent) => {
        // Skip if disabled
        if (!indicatorEnabled) return
        if (!currentState.visible && !isDragging) return

        // Don't hide if we're in keyboard mode (caret-tracking)
        // In that case, the indicator should stay at the caret position
        if (inputMode === 'keyboard') return

        const refRect = getPositionReferenceRect(editorView.dom)
        const padding = 50

        const isOutside =
          event.clientX < refRect.left - padding ||
          event.clientX > refRect.right + padding ||
          event.clientY < refRect.top - padding ||
          event.clientY > refRect.bottom + padding

        if (isOutside && !isDragging) {
          hide()
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        // Skip if disabled
        if (!indicatorEnabled) return

        if (event.key === 'Alt') {
          setCommandHeld(true)
        }
        if (event.key === 'Escape') {
          cancelLongPress()
          if (isDragging) {
            cancelDrag()
          }
        }
      }

      const handleKeyUp = (event: KeyboardEvent) => {
        // Skip if disabled
        if (!indicatorEnabled) return

        if (event.key === 'Alt') {
          setCommandHeld(false)
        }
      }

      // Global click to deselect - anywhere without Option clears selection
      const handleGlobalMouseDown = (event: MouseEvent) => {
        // Skip if disabled
        if (!indicatorEnabled) return

        // Only deselect if Option is NOT held and we have selections
        // Skip if clicking inside the editor (editor handler will manage it)
        if (!event.altKey && selectedBlockPositions.size > 0) {
          const isInsideEditor = editorView.dom.contains(event.target as Node)
          if (!isInsideEditor) {
            clearSelections()
          }
        }
      }

      editorView.dom.addEventListener("mousemove", handleMouseMove)
      editorView.dom.addEventListener("mousedown", handleMouseDown, true)  // Capture phase
      window.addEventListener("mousedown", handleGlobalMouseDown)  // Global deselect
      window.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("scroll", handleScroll, true)
      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)

      // Hide indicator on keypress (user is typing)
      // But ignore modifier keys - they shouldn't hide the indicator
      const handleEditorKeyDown = (event: KeyboardEvent) => {
        // Skip if disabled
        if (!indicatorEnabled) return

        // Don't hide for modifier keys
        if (event.key === 'Meta' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
          return
        }

        if (inputMode !== 'keyboard') {
          inputMode = 'keyboard'
          // Instantly hide the indicator
          currentState = { ...currentState, visible: false }
          notifyListeners()
        }
      }

      editorView.dom.addEventListener("keydown", handleEditorKeyDown)

      let prevDoc = editorView.state.doc

      return {
        update: (view) => {
          updateBlockRect()

          // If document changed, recalculate selected block positions
          if (view.state.doc !== prevDoc && selectedBlockPositions.size > 0) {
            validateSelectedPositions()
            updateSelectedBlocksState()
          }
          prevDoc = view.state.doc
        },
        destroy: () => {
          cancelLongPress()
          if (isDragging) {
            cancelDrag()
          }
          editorView.dom.removeEventListener("mousemove", handleMouseMove)
          editorView.dom.removeEventListener("mousedown", handleMouseDown, true)
          editorView.dom.removeEventListener("keydown", handleEditorKeyDown)
          window.removeEventListener("mousedown", handleGlobalMouseDown)
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
