/**
 * Block Indicator - ProseMirror Plugin
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
 * 1. Update store.currentState
 * 2. Call notifyListeners()
 * 3. React component re-renders with new state
 * 4. CSS transitions handle the animation
 */

import type { Node as PMNode } from "@tiptap/pm/model"
import { Plugin, TextSelection } from "@tiptap/pm/state"

import { blockIndicatorKey } from './types'
import { store, notifyListeners, notifySelectionListeners, clearSelections } from './state'
import { isNonContentArea, isPointInForbiddenZone, clipIndicatorToCurrentPage } from './pagination'
import { getPositionReferenceRect, isPaginationEnabled, getZoomFactor, getPageNumberForElement } from './dom-utils'

export function createBlockIndicatorPlugin() {
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

  // Editor view reference for contentEditable toggling during drag
  let editorViewRef: { dom: HTMLElement } | null = null

  const resetState = () => {
    store.currentState = {
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
      selectedBlocks: store.currentState.selectedBlocks, // Preserve selections on reset
      lastSelectedPos: store.currentState.lastSelectedPos,
      paginationEnabled: store.currentState.paginationEnabled, // Preserve pagination state
      horizontalDropSide: null,
      horizontalDropBlockPos: null,
      horizontalDropRect: null,
      horizontalDropColumnIndex: null,
      horizontalDropGapX: null,
      columnContentDrop: null,
    }
  }

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    longPressStartPos = null
    if (store.currentState.isLongPressing) {
      store.currentState = { ...store.currentState, isLongPressing: false }
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
    // Get fresh DOM reference (the captured one might be stale)
    const freshDom = editorView.nodeDOM(pos)
    if (!(freshDom instanceof HTMLElement)) return
    const dom = freshDom

    isDragging = true
    dragSourcePos = pos
    dragSourceNode = node
    dropTargetPos = pos

    const blockRect = dom.getBoundingClientRect()
    const isPaginated = isPaginationEnabled(editorView.dom)
    const zoom = getZoomFactor(editorView.dom)

    // Clip source overlay to current page in pagination mode
    let overlayTop = blockRect.top
    let overlayHeight = blockRect.height

    if (isPaginated) {
      const clipped = clipIndicatorToCurrentPage(store.lastMouseY, blockRect.top, blockRect.bottom)
      if (clipped) {
        overlayTop = clipped.clippedTop
        overlayHeight = clipped.clippedHeight
      }
      // If null (mouse in forbidden zone), use raw rect as fallback -- drag already started
    }

    // Source overlay position (relative to editor container for React)
    // Divide by zoom: BCR is scaled, CSS absolute positioning is unscaled
    const sourceOverlayRect = {
      left: (blockRect.left - editorRect.left) / zoom,
      top: (overlayTop - editorRect.top) / zoom,
      width: blockRect.width / zoom,
      height: overlayHeight / zoom,
    }

    store.currentState = {
      ...store.currentState,
      visible: true,  // Keep indicator visible during drag (becomes drop indicator)
      isLongPressing: false,
      isDragging: true,
      dropIndicatorTop: (overlayTop - editorRect.top) / zoom,
      sourceOverlay: sourceOverlayRect,
    }
    notifyListeners()

    // Add body class for grabbing cursor, disable editability to prevent
    // text selection during drag (contentEditable=false is the only approach
    // that fully stops WebKit's native selection engine)
    document.body.classList.add("block-dragging")
    window.getSelection()?.removeAllRanges()
    if (editorViewRef) {
      editorViewRef.dom.contentEditable = 'false'
    }
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

    store.currentState = {
      ...store.currentState,
      isDragging: false,
      dropIndicatorTop: null,
      sourceOverlay: null,
      columnContentDrop: null,
    }
    notifyListeners()

    document.body.classList.remove("block-dragging")
    if (editorViewRef) {
      editorViewRef.dom.contentEditable = 'true'
    }
  }

  const setCommandHeld = (held: boolean) => {
    if (store.commandHeld !== held) {
      store.commandHeld = held
      store.currentState = { ...store.currentState, commandHeld: held }
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

    props: {
      handleDOMEvents: {
        // Prevent ProseMirror from extending TextSelection during long press and drag.
        // PM internally tracks mousedown and extends selection on every mousemove.
        // Returning true tells PM to skip its default mousemove handling entirely --
        // our own DOM listeners still fire for drag indicator logic.
        mousemove(_view, _event) {
          if (longPressTimer !== null || isDragging) {
            return true
          }
          return false
        },
      },
    },

    view: (editorView) => {
      editorViewRef = editorView

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
            const zoom = getZoomFactor(editorView.dom)

            let top = blockRect.top
            let height = blockRect.height
            let shouldShow = true

            // Clip to current page in pagination mode
            if (isPaginated) {
              const clipped = clipIndicatorToCurrentPage(store.lastMouseY, blockRect.top, blockRect.bottom)
              if (clipped) {
                top = clipped.clippedTop
                height = clipped.clippedHeight
              } else {
                shouldShow = false
              }
            }

            // Divide by zoom: BCR returns scaled viewport px, but CSS absolute positioning
            // inside the transform:scale container uses unscaled CSS px
            const relativeTop = (top - refRect.top) / zoom
            const blockLeft = (blockRect.left - refRect.left) / zoom
            const blockWidth = blockRect.width / zoom

            if (
              store.currentState.top !== relativeTop ||
              store.currentState.height !== height ||
              store.currentState.visible !== shouldShow ||
              store.currentState.paginationEnabled !== isPaginated
            ) {
              store.currentState = {
                ...store.currentState,
                visible: shouldShow,
                top: relativeTop,
                height: height / zoom,
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
            store.selectedBlockPositions.add(offset)
          }
        })
        store.lastSelectedPos = toPos
      }

      // Selection helper: deselect range of blocks between two positions
      const deselectBlockRange = (fromPos: number, toPos: number) => {
        const { doc } = editorView.state
        const minPos = Math.min(fromPos, toPos)
        const maxPos = Math.max(fromPos, toPos)

        doc.forEach((_node, offset) => {
          if (offset >= minPos && offset <= maxPos) {
            store.selectedBlockPositions.delete(offset)
          }
        })
        // Update lastSelectedPos
        store.lastSelectedPos = store.selectedBlockPositions.size > 0
          ? Array.from(store.selectedBlockPositions).pop() ?? null
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
        const zoom = getZoomFactor(editorView.dom)

        store.selectedBlockPositions.forEach((pos) => {
          try {
            const dom = editorView.nodeDOM(pos)
            if (dom instanceof HTMLElement) {
              // Skip headers/footers
              if (isNonContentArea(dom)) {
                store.selectedBlockPositions.delete(pos)
                return
              }

              const rect = dom.getBoundingClientRect()

              // In pagination mode, clip each selected block to its content slice
              let blockTop = rect.top
              let blockHeight = rect.height

              if (isPaginated) {
                // Use block's vertical center as reference for which content slice it belongs to
                const blockCenter = rect.top + rect.height / 2
                const clipped = clipIndicatorToCurrentPage(blockCenter, rect.top, rect.bottom)
                if (clipped) {
                  blockTop = clipped.clippedTop
                  blockHeight = clipped.clippedHeight
                } else {
                  // Block is entirely in a forbidden zone, skip it
                  return
                }
              }

              // Divide by zoom: BCR is scaled, CSS absolute positioning is unscaled
              const blockLeft = (rect.left - refRect.left) / zoom
              blocks.push({
                pos,
                top: (blockTop - refRect.top) / zoom,
                height: blockHeight / zoom,
                blockLeft,
                blockWidth: rect.width / zoom,
                pageNumber: isPaginated ? getPageNumberForElement(dom) : 1,
              })
            }
          } catch {
            // Position no longer valid, remove it
            store.selectedBlockPositions.delete(pos)
          }
        })

        store.currentState = {
          ...store.currentState,
          selectedBlocks: blocks,
          lastSelectedPos: store.lastSelectedPos,
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
          if (store.selectedBlockPositions.has(offset)) {
            validPositions.add(offset)
          }
        })

        store.selectedBlockPositions = validPositions
        if (store.lastSelectedPos !== null && !validPositions.has(store.lastSelectedPos)) {
          store.lastSelectedPos = null
        }
      }

      /**
       * Execute a horizontal drop: wrap source + target blocks into a columnBlock.
       * If target is already a columnBlock with room, add a new column instead.
       */
      const executeHorizontalDrop = () => {
        if (!dragSourceNode || dragSourcePos === null) return
        const targetPos = store.currentState.horizontalDropBlockPos
        const side = store.currentState.horizontalDropSide
        if (targetPos === null || !side) return

        const { state } = editorView
        const schema = state.schema
        const targetNode = state.doc.nodeAt(targetPos)
        if (!targetNode) return

        const columnType = schema.nodes.column
        const columnBlockType = schema.nodes.columnBlock
        if (!columnType || !columnBlockType) return

        let tr = state.tr

        const columnIndex = store.currentState.horizontalDropColumnIndex

        // Case 1: target is already a columnBlock with < 4 columns
        if (targetNode.type.name === 'columnBlock' && targetNode.childCount < 4) {
          const newColumn = columnType.create(null, dragSourceNode)

          // Delete source first
          tr = tr.delete(dragSourcePos, dragSourcePos + dragSourceNode.nodeSize)

          // Adjust target position after source deletion
          let adjTargetPos = targetPos
          if (targetPos > dragSourcePos) {
            adjTargetPos -= dragSourceNode.nodeSize
          }

          // Insert new column at the right position
          if (columnIndex !== null) {
            // Insert between columns at the specified index
            const adjNode = tr.doc.nodeAt(adjTargetPos)
            if (adjNode) {
              let insertPos = adjTargetPos + 1 // After columnBlock opening
              for (let ci = 0; ci < columnIndex && ci < adjNode.childCount; ci++) {
                insertPos += adjNode.child(ci).nodeSize
              }
              tr = tr.insert(insertPos, newColumn)
            }
          } else if (side === 'left') {
            // Insert as first column (after columnBlock opening tag)
            tr = tr.insert(adjTargetPos + 1, newColumn)
          } else {
            // Insert as last column (before columnBlock closing tag)
            const adjustedNode = tr.doc.nodeAt(adjTargetPos)
            if (adjustedNode) {
              tr = tr.insert(adjTargetPos + adjustedNode.nodeSize - 1, newColumn)
            }
          }

          // Update column count and widths
          const updatedNode = tr.doc.nodeAt(adjTargetPos)
          if (updatedNode) {
            const newCount = updatedNode.childCount
            const base = Math.floor((1 / newCount) * 10000) / 10000
            const widths = Array(newCount).fill(base)
            widths[newCount - 1] = +(1 - base * (newCount - 1)).toFixed(4)
            tr = tr.setNodeMarkup(adjTargetPos, undefined, {
              ...updatedNode.attrs,
              columns: newCount,
              columnWidths: widths,
            })
          }
        }
        // Case 2: target is a regular block -- wrap both into a new columnBlock
        else if (targetNode.type.name !== 'columnBlock') {
          // Build columns
          let col1Content = side === 'left' ? dragSourceNode : targetNode
          let col2Content = side === 'left' ? targetNode : dragSourceNode

          // Wrap block-level content in a column (column expects block children)
          const col1 = columnType.create(null, col1Content)
          const col2 = columnType.create(null, col2Content)

          const columnBlock = columnBlockType.create(
            { columns: 2, columnWidths: [0.5, 0.5], gutter: 24 },
            [col1, col2],
          )

          // We need to delete both blocks and insert the columnBlock.
          // Order: delete higher position first to avoid offset shifts.
          const sourcePos = dragSourcePos
          const sourceEnd = sourcePos + dragSourceNode.nodeSize
          const targetEnd = targetPos + targetNode.nodeSize

          if (sourcePos > targetPos) {
            // Source is after target
            tr = tr.delete(sourcePos, sourceEnd)
            tr = tr.replaceWith(targetPos, targetEnd, columnBlock)
          } else {
            // Source is before target
            tr = tr.replaceWith(targetPos, targetEnd, columnBlock)
            tr = tr.delete(sourcePos, sourceEnd)
          }
        }

        // Clear horizontal drop state
        store.currentState = {
          ...store.currentState,
          isDragging: false,
          sourceOverlay: null,
          horizontalDropSide: null,
          horizontalDropBlockPos: null,
          horizontalDropRect: null,
          horizontalDropColumnIndex: null,
          horizontalDropGapX: null,
          columnContentDrop: null,
        }
        notifyListeners()

        tr = tr.setMeta(blockIndicatorKey, { isDragging: false })
        editorView.dispatch(tr)
      }

      /**
       * Execute a column content drop: insert the dragged block INTO a column as content.
       */
      const executeColumnContentDrop = () => {
        if (!dragSourceNode || dragSourcePos === null) return
        const dropInfo = store.currentState.columnContentDrop
        if (!dropInfo) return

        const { state } = editorView
        let tr = state.tr

        const sourceNodeSize = dragSourceNode.nodeSize
        const sourcePos = dragSourcePos
        let insertPos = dropInfo.insertPos

        // Delete source block first
        tr = tr.delete(sourcePos, sourcePos + sourceNodeSize)

        // Adjust insert position if source was before the insert point
        if (sourcePos < insertPos) {
          insertPos -= sourceNodeSize
        }

        // Insert the block at the target position inside the column
        tr = tr.insert(insertPos, dragSourceNode)

        // Place cursor at start of moved block
        const $pos = tr.doc.resolve(insertPos + 1)
        tr = tr.setSelection(TextSelection.near($pos))

        tr = tr.setMeta(blockIndicatorKey, { isDragging: false })

        // Clear state
        store.currentState = {
          ...store.currentState,
          isDragging: false,
          sourceOverlay: null,
          columnContentDrop: null,
          horizontalDropSide: null,
          horizontalDropBlockPos: null,
          horizontalDropRect: null,
          horizontalDropColumnIndex: null,
          horizontalDropGapX: null,
        }
        notifyListeners()

        editorView.dispatch(tr)
      }

      const executeMove = () => {
        // Check for column content drop first (dropping INTO a column)
        if (store.currentState.columnContentDrop) {
          executeColumnContentDrop()
          return
        }

        // Check for horizontal drop (column creation)
        if (store.currentState.horizontalDropSide && store.currentState.horizontalDropBlockPos !== null) {
          executeHorizontalDrop()
          return
        }

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
        store.currentState = {
          ...store.currentState,
          isDragging: false,
          sourceOverlay: null,
          isAnimating: true,
        }
        notifyListeners()

        editorView.dispatch(tr)

        // Animate indicator: horizontal shrinks to dot, then vertical grows
        requestAnimationFrame(() => {
          const refRect = getPositionReferenceRect(editorView.dom)
          const zoom = getZoomFactor(editorView.dom)
          const landedDom = editorView.nodeDOM(adjustedPos)
          const landedRect = landedDom instanceof HTMLElement
            ? landedDom.getBoundingClientRect()
            : null

          const finalHeight = landedRect ? landedRect.height / zoom : 24

          // Hide caret during animation
          document.body.classList.add("block-animating")

          // Start shrinking animation - keep horizontal mode, will shrink width
          store.currentState = {
            ...store.currentState,
            visible: true,
            isDragging: true,  // Keep horizontal mode for shrinking
            commandHeld: false,
            top: landedRect ? (landedRect.top - refRect.top) / zoom : 0,
            height: 2,  // Horizontal line height
            blockLeft: landedRect ? (landedRect.left - refRect.left) / zoom : 0,
            blockWidth: landedRect ? landedRect.width / zoom : 0,
            dropAnimation: 'shrinking',
          }
          notifyListeners()

          // After shrink animation completes, immediately start growing
          setTimeout(() => {
            // Switch to vertical mode, start at dot height (2px)
            store.currentState = {
              ...store.currentState,
              isDragging: false,
              height: 2,  // Start from dot
              dropAnimation: 'growing',
            }
            notifyListeners()

            // Next frame: set final height - CSS will animate the growth
            requestAnimationFrame(() => {
              store.currentState = {
                ...store.currentState,
                height: finalHeight,
              }
              notifyListeners()

              // After grow animation, return to normal state
              setTimeout(() => {
                store.currentState = {
                  ...store.currentState,
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
        if (!store.indicatorEnabled) return

        // Track mouse Y for code paths that don't have direct event access
        store.lastMouseY = event.clientY

        const target = event.target
        if (!(target instanceof HTMLElement)) return

        // Skip if hovering over header/footer/gap
        if (isNonContentArea(target)) {
          if (store.currentState.visible && !isDragging) {
            store.currentState = { ...store.currentState, visible: false }
            notifyListeners()
          }
          return
        }

        // Hide indicator when mouse drifts into a pagination gap, header, or footer
        if (isPaginationEnabled(editorView.dom) && isPointInForbiddenZone(event.clientY)) {
          if (store.currentState.visible && !isDragging) {
            store.currentState = { ...store.currentState, visible: false }
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
          event.preventDefault()

          const dropInfo = findDropPosition(event.clientY)
          if (dropInfo) {
            dropTargetPos = dropInfo.pos
            store.dropTargetIndex = dropInfo.index
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
                  const isPaginated = isPaginationEnabled(editorView.dom)
                  const zoom = getZoomFactor(editorView.dom)
                  const blockLeft = (blockRect.left - refRect.left) / zoom

                  // In pagination mode, clip block reference to current page
                  const blockWidth = blockRect.width / zoom
                  if (isPaginated) {
                    const clipped = clipIndicatorToCurrentPage(event.clientY, blockRect.top, blockRect.bottom)
                    if (!clipped) {
                      // Mouse is in a forbidden zone during drag -- keep last known state
                      return
                    }
                  }

                  // --- Edge zone detection for horizontal drop (column creation) ---
                  const EDGE_ZONE = 30 // px from block edge
                  const relativeX = event.clientX - blockRect.left
                  const blockNode = editorView.state.doc.nodeAt(blockPos)
                  // Don't allow horizontal drop on self or when target is already a columnBlock
                  // that has 4 columns
                  const isTargetColumnBlock = blockNode?.type.name === 'columnBlock'
                  const targetColumnCount = isTargetColumnBlock ? blockNode.childCount : 0
                  const canDropHorizontal = blockPos !== dragSourcePos && !(isTargetColumnBlock && targetColumnCount >= 4)

                  let horizontalDropSide: 'left' | 'right' | null = null
                  let horizontalDropColumnIndex: number | null = null
                  let horizontalDropGapX: number | null = null
                  if (canDropHorizontal) {
                    if (relativeX <= EDGE_ZONE) {
                      horizontalDropSide = 'left'
                    } else if (relativeX >= blockRect.width - EDGE_ZONE) {
                      horizontalDropSide = 'right'
                    }

                    // For existing columnBlocks with room: also detect drops on divider gaps
                    if (!horizontalDropSide && isTargetColumnBlock && targetColumnCount < 4) {
                      const columnEl = (event.target as HTMLElement).closest?.('[data-column-block]')
                      if (columnEl) {
                        const columnChildren = columnEl.querySelectorAll<HTMLElement>('[data-column]')
                        // Check if mouse is in a gap between columns
                        for (let ci = 0; ci < columnChildren.length - 1; ci++) {
                          const colRect = columnChildren[ci].getBoundingClientRect()
                          const nextColRect = columnChildren[ci + 1].getBoundingClientRect()
                          const gapLeft = colRect.right
                          const gapRight = nextColRect.left
                          if (event.clientX >= gapLeft - 8 && event.clientX <= gapRight + 8) {
                            horizontalDropSide = 'right' // visual: show indicator between
                            horizontalDropColumnIndex = ci + 1 // insert at this column index
                            // Store exact gap center X for vertical indicator positioning
                            horizontalDropGapX = ((gapLeft + gapRight) / 2 - refRect.left) / zoom
                            break
                          }
                        }
                      }
                    }
                  }

                  // --- Column content drop detection ---
                  // If no horizontal drop triggered, check if cursor is inside a column's content area
                  let columnContentDrop: typeof store.currentState.columnContentDrop = null
                  if (!horizontalDropSide && isTargetColumnBlock && blockNode && dragSourceNode) {
                    // Don't allow dropping a columnBlock into a column (nesting prevention)
                    if (dragSourceNode.type.name !== 'columnBlock') {
                      const columnEl = (event.target as HTMLElement).closest?.('[data-column-block]')
                      if (columnEl) {
                        const columnChildren = columnEl.querySelectorAll<HTMLElement>('[data-column]')
                        for (let ci = 0; ci < columnChildren.length; ci++) {
                          const colRect = columnChildren[ci].getBoundingClientRect()
                          if (event.clientX >= colRect.left && event.clientX <= colRect.right &&
                              event.clientY >= colRect.top && event.clientY <= colRect.bottom) {
                            // Found the column -- walk its child blocks to find nearest gap
                            // Resolve ProseMirror position for this column
                            let columnNodePos = blockPos + 1 // after columnBlock opening
                            for (let k = 0; k < ci; k++) {
                              columnNodePos += blockNode.child(k).nodeSize
                            }
                            const columnNode = blockNode.child(ci)
                            // columnNodePos is start of the column node
                            // Content starts at columnNodePos + 1 (after column opening tag)
                            const contentStart = columnNodePos + 1

                            // Collect gaps between child blocks in this column
                            const childGaps: { insertPos: number; yPos: number }[] = []
                            let childOffset = 0
                            for (let ch = 0; ch < columnNode.childCount; ch++) {
                              const child = columnNode.child(ch)
                              const childPos = contentStart + childOffset
                              // Gap before this child
                              try {
                                const childDom = editorView.nodeDOM(childPos)
                                if (childDom instanceof HTMLElement) {
                                  const childRect = childDom.getBoundingClientRect()
                                  childGaps.push({
                                    insertPos: childPos,
                                    yPos: childRect.top,
                                  })
                                  // After last child, add gap at bottom
                                  if (ch === columnNode.childCount - 1) {
                                    childGaps.push({
                                      insertPos: childPos + child.nodeSize,
                                      yPos: childRect.bottom,
                                    })
                                  }
                                }
                              } catch { /* skip */ }
                              childOffset += child.nodeSize
                            }

                            // If column is empty, insert at content start
                            if (childGaps.length === 0) {
                              childGaps.push({
                                insertPos: contentStart,
                                yPos: colRect.top + colRect.height / 2,
                              })
                            }

                            // Find closest gap to cursor Y
                            let closestGap = childGaps[0]
                            let closestDist = Infinity
                            for (const gap of childGaps) {
                              const dist = Math.abs(event.clientY - gap.yPos)
                              if (dist < closestDist) {
                                closestDist = dist
                                closestGap = gap
                              }
                            }

                            if (closestGap) {
                              columnContentDrop = {
                                columnBlockPos: blockPos,
                                columnIndex: ci,
                                insertPos: closestGap.insertPos,
                                indicatorTop: (closestGap.yPos - refRect.top) / zoom,
                                indicatorLeft: (colRect.left - refRect.left) / zoom,
                                indicatorWidth: colRect.width / zoom,
                              }
                            }
                            break
                          }
                        }
                      }
                    }
                  }

                  // dropInfo.top is a BCR diff from findDropPosition -- divide by zoom
                  let indicatorTop: number
                  if (columnContentDrop) {
                    indicatorTop = columnContentDrop.indicatorTop
                  } else if (dropInfo) {
                    indicatorTop = dropInfo.top / zoom
                  } else if (store.currentState.dropIndicatorTop != null) {
                    indicatorTop = store.currentState.dropIndicatorTop
                  } else {
                    indicatorTop = (blockRect.top - refRect.top) / zoom
                  }

                  store.currentState = {
                    ...store.currentState,
                    visible: true,
                    top: indicatorTop,
                    height: 2,  // Horizontal line height
                    blockLeft: columnContentDrop ? columnContentDrop.indicatorLeft : blockLeft,
                    blockWidth: columnContentDrop ? columnContentDrop.indicatorWidth : blockWidth,
                    dropIndicatorTop: indicatorTop,
                    // Horizontal drop state
                    horizontalDropSide: columnContentDrop ? null : horizontalDropSide,
                    horizontalDropBlockPos: horizontalDropSide && !columnContentDrop ? blockPos : null,
                    horizontalDropRect: horizontalDropSide && !columnContentDrop ? {
                      left: blockLeft,
                      top: (blockRect.top - refRect.top) / zoom,
                      width: blockWidth,
                      height: blockRect.height / zoom,
                    } : null,
                    horizontalDropColumnIndex: columnContentDrop ? null : horizontalDropColumnIndex,
                    horizontalDropGapX: columnContentDrop ? null : horizontalDropGapX,
                    columnContentDrop,
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

        // Re-evaluate when entering a new block OR when returning to content
        // from a forbidden zone (indicator hidden but mouse now on valid block)
        const needsUpdate = blockPos !== null && (blockPos !== currentBlockPos || !store.currentState.visible)
        if (needsUpdate && blockPos !== null) {
          currentBlockPos = blockPos

          try {
            const dom = editorView.nodeDOM(blockPos)
            if (dom instanceof HTMLElement) {
              // Skip header/footer nodes
              if (isNonContentArea(dom)) {
                currentBlockPos = null
                if (store.currentState.visible) {
                  store.currentState = { ...store.currentState, visible: false }
                  notifyListeners()
                }
                return
              }

              const refRect = getPositionReferenceRect(editorView.dom)
              const blockRect = dom.getBoundingClientRect()
              const isPaginated = isPaginationEnabled(editorView.dom)
              const zoom = getZoomFactor(editorView.dom)
              const blockLeft = (blockRect.left - refRect.left) / zoom

              // In pagination mode, clip the indicator to the current page's content area
              let indicatorTop = blockRect.top
              let indicatorHeight = blockRect.height
              let shouldShow = true

              if (isPaginated) {
                const clipped = clipIndicatorToCurrentPage(event.clientY, blockRect.top, blockRect.bottom)
                if (clipped) {
                  indicatorTop = clipped.clippedTop
                  indicatorHeight = clipped.clippedHeight
                } else {
                  shouldShow = false
                }
              }

              store.currentState = {
                ...store.currentState,
                visible: shouldShow,
                top: (indicatorTop - refRect.top) / zoom,
                height: indicatorHeight / zoom,
                blockLeft,
                blockWidth: blockRect.width / zoom,
                commandHeld: store.commandHeld,
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
        if (!store.indicatorEnabled) return
        if (currentBlockPos === null) return
        if (event.button !== 0) return // Only left click

        // Don't interfere with column resize divider handles
        if ((event.target as HTMLElement).closest('.column-divider-handle')) return

        const dom = editorView.nodeDOM(currentBlockPos)
        if (!(dom instanceof HTMLElement)) return

        // Option+click selection logic
        if (event.altKey) {
          event.preventDefault()
          event.stopPropagation()

          if (event.shiftKey && store.lastSelectedPos !== null) {
            // Range selection/deselection: toggle based on whether clicked block is selected
            if (store.selectedBlockPositions.has(currentBlockPos)) {
              // Clicked block is selected - deselect the range
              deselectBlockRange(store.lastSelectedPos, currentBlockPos)
            } else {
              // Clicked block is not selected - select the range
              selectBlockRange(store.lastSelectedPos, currentBlockPos)
            }
          } else {
            // Toggle single block selection
            if (store.selectedBlockPositions.has(currentBlockPos)) {
              store.selectedBlockPositions.delete(currentBlockPos)
              // Update lastSelectedPos if we deselected it
              if (store.lastSelectedPos === currentBlockPos) {
                store.lastSelectedPos = store.selectedBlockPositions.size > 0
                  ? Array.from(store.selectedBlockPositions).pop() ?? null
                  : null
              }
            } else {
              store.selectedBlockPositions.add(currentBlockPos)
              store.lastSelectedPos = currentBlockPos
            }
          }

          updateSelectedBlocksState()
          return  // Don't proceed to drag logic
        }

        // Click without Option = deselect all selected blocks
        if (store.selectedBlockPositions.size > 0) {
          clearSelections()
        }

        // Don't block - allow normal text selection
        // We only take over if long press completes

        // Start long press detection
        longPressStartPos = { x: event.clientX, y: event.clientY }

        store.currentState = { ...store.currentState, isLongPressing: true }
        notifyListeners()

        const refRect = getPositionReferenceRect(editorView.dom)
        const capturedBlockPos = currentBlockPos
        const capturedDom = dom

        longPressTimer = setTimeout(() => {
          // Long press completed - start drag
          const node = editorView.state.doc.nodeAt(capturedBlockPos)
          if (!node) return

          // Clear any selection that formed during the 400ms long press wait
          window.getSelection()?.removeAllRanges()

          // Break ProseMirror's internal drag-to-select state machine.
          // PM tracks mousedown and extends selection on every mousemove until mouseup.
          // A synthetic mouseup tells PM the text selection cycle is over.
          const syntheticUp = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
          })
          editorView.dom.dispatchEvent(syntheticUp)

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
        if (editorViewRef) {
          editorViewRef.dom.contentEditable = 'true'
        }

        store.currentState = {
          ...store.currentState,
          isDragging: false,
          sourceOverlay: null,
        }
        notifyListeners()
      }

      const handleScroll = () => {
        updateBlockRect()
        // Also update selected blocks positions on scroll
        if (store.selectedBlockPositions.size > 0) {
          updateSelectedBlocksState()
        }
      }

      const handleGlobalMouseMove = (event: MouseEvent) => {
        // Skip if disabled
        if (!store.indicatorEnabled) return
        if (!store.currentState.visible && !isDragging) return

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
        if (!store.indicatorEnabled) return

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
        if (!store.indicatorEnabled) return

        if (event.key === 'Alt') {
          setCommandHeld(false)
        }
      }

      // Global click to deselect - anywhere without Option clears selection
      const handleGlobalMouseDown = (event: MouseEvent) => {
        // Skip if disabled
        if (!store.indicatorEnabled) return

        // Only deselect if Option is NOT held and we have selections
        // Skip if clicking inside the editor (editor handler will manage it)
        if (!event.altKey && store.selectedBlockPositions.size > 0) {
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
        if (!store.indicatorEnabled) return

        // Don't hide for modifier keys
        if (event.key === 'Meta' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
          return
        }

        if (inputMode !== 'keyboard') {
          inputMode = 'keyboard'
          // Instantly hide the indicator
          store.currentState = { ...store.currentState, visible: false }
          notifyListeners()
        }
      }

      editorView.dom.addEventListener("keydown", handleEditorKeyDown)

      let prevDoc = editorView.state.doc

      return {
        update: (view) => {
          updateBlockRect()

          // If document changed, recalculate selected block positions
          if (view.state.doc !== prevDoc && store.selectedBlockPositions.size > 0) {
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
