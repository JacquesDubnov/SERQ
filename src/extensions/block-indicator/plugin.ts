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

import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model"
import { findTopBlockDepth } from "@/lib/tiptap/depth-utils"
import { Plugin, TextSelection } from "@tiptap/pm/state"

import { blockIndicatorKey } from './types'

// --- Node classification for depth-aware drag ---
// Structural wrappers: skip over them, never draggable themselves
const STRUCTURAL_WRAPPERS = new Set(['column', 'section'])
// Drag units: the draggable entity itself (Phase 2: add 'listItem')
const DRAG_UNITS = new Set<string>()

/**
 * Resolve the deepest draggable block at a given document position.
 *
 * Walks from the deepest depth up to 1, classifying each node:
 * - Structural wrapper (column): skip, look deeper
 * - Drag unit (Phase 2: listItem): return immediately
 * - Content block at depth 1: always return
 * - Content block whose parent is a structural wrapper or doc: return
 *
 * Returns null if no draggable block found (cursor in doc root or invalid).
 */
function resolveDeepestDraggableBlock($pos: ResolvedPos): {
  pos: number
  node: PMNode
  depth: number
} | null {
  for (let d = $pos.depth; d >= 1; d--) {
    const node = $pos.node(d)

    if (STRUCTURAL_WRAPPERS.has(node.type.name)) continue

    if (DRAG_UNITS.has(node.type.name)) {
      return { pos: $pos.before(d), node, depth: d }
    }

    // Check parent: if parent is a structural wrapper (section, column) or doc,
    // this node is the block-level draggable unit.
    const parent = d > 0 ? $pos.node(d - 1) : null
    if (!parent || parent.type.name === 'doc' || STRUCTURAL_WRAPPERS.has(parent.type.name)) {
      return { pos: $pos.before(d), node, depth: d }
    }
  }
  return null
}
import { store, notifyListeners, notifySelectionListeners, clearSelections } from './state'
import { isNonContentArea, isPointInForbiddenZone, clipIndicatorToCurrentPage } from './pagination'
import { getPositionReferenceRect, getPositionAncestor, getOffsetRelativeTo, isPaginationEnabled, getPageNumberForElement } from './dom-utils'

import type { EditorView } from "@tiptap/pm/view"

// Module-level active view: TipTap/React creates multiple plugin instances.
// Only the instance whose editorView matches this reference should process events.
// Updated in view() when the DOM is connected; handlers bail if they don't match.
let _activeEditorView: EditorView | null = null

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
  // Editor DOM reference for user-select restoration (set in view())
  let editorDom: HTMLElement | null = null

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
      // Restore user-select if long press was cancelled (not transitioning to drag)
      if (!isDragging && editorDom) {
        editorDom.style.userSelect = ''
        ;(editorDom.style as any).webkitUserSelect = ''
      }
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

    const isPaginated = isPaginationEnabled(editorView.dom)
    const ancestor = getPositionAncestor(editorView.dom)

    // Use offset-based positioning for the initial drop indicator
    let indicatorY: number
    if (ancestor) {
      const offset = getOffsetRelativeTo(dom, ancestor)
      indicatorY = offset.top
    } else {
      const blockRect = dom.getBoundingClientRect()
      indicatorY = blockRect.top - editorRect.top
    }

    if (isPaginated) {
      const blockRect = dom.getBoundingClientRect()
      const clipped = clipIndicatorToCurrentPage(store.lastMouseY, blockRect.top, blockRect.bottom)
      if (clipped) {
        // Adjust offset-based position by the clip delta
        const clipDelta = clipped.clippedTop - blockRect.top
        if (ancestor) {
          indicatorY = getOffsetRelativeTo(dom, ancestor).top + clipDelta
        } else {
          indicatorY = clipped.clippedTop - editorRect.top
        }
      }
    }

    // Fade the source block via CSS class (no overlay needed)
    dom.classList.add('block-drag-source')
    // Store reference so we can remove the class later
    store.dragSourceElement = dom

    store.currentState = {
      ...store.currentState,
      visible: true,  // Keep indicator visible during drag (becomes drop indicator)
      isLongPressing: false,
      isDragging: true,
      dropIndicatorTop: indicatorY,
    }
    notifyListeners()

    // Add body class for grabbing cursor and user-select:none
    document.body.classList.add("block-dragging")
    // Also set user-select directly on the editor DOM -- contenteditable="true"
    // can override the body-level user-select:none in WebKit
    editorView.dom.style.userSelect = 'none'
    ;(editorView.dom.style as any).webkitUserSelect = 'none'
    window.getSelection()?.removeAllRanges()
  }

  const cancelDrag = () => {
    // Remove interaction overlay
    if (dragOverlay) {
      dragOverlay.remove()
      dragOverlay = null
    }

    // Remove source block fade
    if (store.dragSourceElement) {
      store.dragSourceElement.classList.remove('block-drag-source')
      store.dragSourceElement = null
    }

    isDragging = false
    dragSourcePos = null
    dragSourceNode = null
    dropTargetPos = null

    store.currentState = {
      ...store.currentState,
      isDragging: false,
      dropIndicatorTop: null,
    }
    notifyListeners()

    document.body.classList.remove("block-dragging")
    // Restore user-select on editor DOM
    if (editorDom) {
      editorDom.style.userSelect = ''
      ;(editorDom.style as any).webkitUserSelect = ''
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
      editorDom = editorView.dom
      // Claim active view when our DOM is connected
      if (editorView.dom.isConnected) {
        _activeEditorView = editorView
      }

      const updateBlockRect = () => {
        if (currentBlockPos === null || isDragging) return

        try {
          const dom = editorView.nodeDOM(currentBlockPos)
          if (dom instanceof HTMLElement) {
            // Skip headers/footers
            if (isNonContentArea(dom)) return

            const ancestor = getPositionAncestor(editorView.dom)
            if (!ancestor) return
            const isPaginated = isPaginationEnabled(editorView.dom)

            // Use offset chain for CSS positioning (zoom-invariant)
            const offset = getOffsetRelativeTo(dom, ancestor)
            let top = offset.top
            let height = dom.offsetHeight
            let shouldShow = true


            // Clip to current page in pagination mode
            if (isPaginated) {
              const blockRect = dom.getBoundingClientRect()
              const clipped = clipIndicatorToCurrentPage(store.lastMouseY, blockRect.top, blockRect.bottom)
              if (clipped) {
                // For pagination clipping, compute the clipped portion relative to offset
                top = offset.top + (clipped.clippedTop - blockRect.top)
                height = clipped.clippedHeight
              } else {
                shouldShow = false
              }
            }

            const blockLeft = offset.left
            const blockWidth = dom.offsetWidth

            if (
              store.currentState.top !== top ||
              store.currentState.height !== height ||
              store.currentState.visible !== shouldShow ||
              store.currentState.paginationEnabled !== isPaginated
            ) {
              store.currentState = {
                ...store.currentState,
                visible: shouldShow,
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

      /**
       * Find gaps between children of a given container node.
       * When containerPos is null, child offsets are doc-absolute (top-level).
       * When non-null, positions are containerPos + 1 + childOffset.
       */
      const findGapsInNode = (
        node: PMNode,
        containerPos: number | null,
        clientY: number,
      ): { pos: number; top: number; index: number; pageNumber: number } | null => {
        const ancestor = getPositionAncestor(editorView.dom)
        if (!ancestor) return null
        const isPaginated = isPaginationEnabled(editorView.dom)

        const gaps: { pos: number; top: number; index: number; pageNumber: number }[] = []
        let blockIndex = 0
        let lastBottom = 0
        let lastPageNumber = 1

        // Handle empty container (e.g., empty column) -- single gap at content start
        if (node.childCount === 0 && containerPos !== null) {
          const containerDom = editorView.nodeDOM(containerPos)
          if (containerDom instanceof HTMLElement) {
            const containerOffset = getOffsetRelativeTo(containerDom, ancestor)
            const gapTop = containerOffset.top + containerDom.offsetHeight / 2
            gaps.push({
              pos: containerPos + 1, // inside the container (after opening tag)
              top: gapTop,
              index: 0,
              pageNumber: isPaginated ? getPageNumberForElement(containerDom) : 1,
            })
          }
        }

        node.forEach((_child, offset) => {
          const absPos = containerPos !== null ? containerPos + 1 + offset : offset
          const dom = editorView.nodeDOM(absPos)
          if (!(dom instanceof HTMLElement)) return

          // Skip headers/footers
          if (isNonContentArea(dom)) return

          const blockOffset = getOffsetRelativeTo(dom, ancestor)
          const blockTop = blockOffset.top
          const blockBottom = blockTop + dom.offsetHeight
          const pageNumber = isPaginated ? getPageNumberForElement(dom) : 1

          let gapTop: number
          if (blockIndex === 0) {
            gapTop = blockTop
          } else if (pageNumber !== lastPageNumber) {
            gapTop = blockTop
          } else {
            gapTop = (lastBottom + blockTop) / 2
          }

          gaps.push({ pos: absPos, top: gapTop, index: blockIndex, pageNumber })

          lastBottom = blockBottom
          lastPageNumber = pageNumber
          blockIndex++
        })

        // Gap after last child
        if (blockIndex > 0) {
          const afterLastPos = containerPos !== null
            ? containerPos + 1 + node.content.size
            : node.content.size
          gaps.push({
            pos: afterLastPos,
            top: lastBottom,
            index: blockIndex,
            pageNumber: lastPageNumber,
          })
        }

        // Find closest gap to mouse Y.
        // Gap tops are in content space (offset-based). Convert mouse clientY
        // to content space by subtracting the ancestor's viewport position.
        const ancestorRect = ancestor.getBoundingClientRect()
        let closest = gaps[0]
        let closestDistance = Infinity
        for (const gap of gaps) {
          const dist = Math.abs(clientY - (gap.top + ancestorRect.top))
          if (dist < closestDistance) {
            closestDistance = dist
            closest = gap
          }
        }

        return closest || null
      }

      const findDropPosition = (clientX: number, clientY: number): {
        pos: number
        top: number
        index: number
        pageNumber: number
      } | null => {
        // Try to determine which container the cursor is inside.
        // posAtCoords receives screen-space coords.
        const coords = editorView.posAtCoords({ left: clientX, top: clientY })
        if (coords) {
          const $pos = editorView.state.doc.resolve(coords.pos)
          // Walk up to find the innermost structural wrapper or doc
          for (let d = $pos.depth; d >= 0; d--) {
            const node = $pos.node(d)
            if (STRUCTURAL_WRAPPERS.has(node.type.name)) {
              const containerPos = $pos.before(d)
              return findGapsInNode(node, containerPos, clientY)
            }
            if (d === 0) {
              // doc level -- top-level gaps
              return findGapsInNode(node, null, clientY)
            }
          }
        }
        // Fallback: top-level gaps
        return findGapsInNode(editorView.state.doc, null, clientY)
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
        const ancestor = getPositionAncestor(editorView.dom)
        if (!ancestor) return
        const isPaginated = isPaginationEnabled(editorView.dom)

        store.selectedBlockPositions.forEach((pos) => {
          try {
            const dom = editorView.nodeDOM(pos)
            if (dom instanceof HTMLElement) {
              // Skip headers/footers
              if (isNonContentArea(dom)) {
                store.selectedBlockPositions.delete(pos)
                return
              }

              const offset = getOffsetRelativeTo(dom, ancestor)
              let blockTop = offset.top
              let blockHeight = dom.offsetHeight

              if (isPaginated) {
                // Use getBoundingClientRect for pagination clipping (screen-space comparison)
                const rect = dom.getBoundingClientRect()
                const blockCenter = rect.top + rect.height / 2
                const clipped = clipIndicatorToCurrentPage(blockCenter, rect.top, rect.bottom)
                if (clipped) {
                  blockTop = offset.top + (clipped.clippedTop - rect.top)
                  blockHeight = clipped.clippedHeight
                } else {
                  // Block is entirely in a forbidden zone, skip it
                  return
                }
              }

              blocks.push({
                pos,
                top: blockTop,
                height: blockHeight,
                blockLeft: offset.left,
                blockWidth: dom.offsetWidth,
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
       * Clean up the source column after a block is extracted from it.
       * If only 1 non-empty column remains, unwraps the entire columnBlock.
       * Otherwise deletes just the empty column.
       * Returns the (possibly modified) transaction.
       */
      const cleanupSourceColumn = (tr: any, sourcePos: number): any => {
        // Find the column that contained the source block (before deletion).
        // Resolve against the OLD doc (pre-transaction) since sourcePos is from there.
        try {
          const $src = editorView.state.doc.resolve(sourcePos)
          let sourceColumnPos: number | null = null
          let sourceColumnBlockPos: number | null = null
          for (let d = $src.depth; d >= 1; d--) {
            const nodeName = $src.node(d).type.name
            if (nodeName === 'column' && sourceColumnPos === null) {
              sourceColumnPos = $src.before(d)
            }
            if (nodeName === 'columnBlock' && sourceColumnBlockPos === null) {
              sourceColumnBlockPos = $src.before(d)
              break
            }
          }
          // Source was not inside a column layout -- nothing to clean up
          if (sourceColumnPos === null || sourceColumnBlockPos === null) return tr

          // Map both positions through the transaction's changes
          const mappedColPos = tr.mapping.map(sourceColumnPos)
          const mappedBlockPos = tr.mapping.map(sourceColumnBlockPos)

          // Validate mapped positions
          if (mappedColPos < 0 || mappedColPos >= tr.doc.content.size) return tr
          if (mappedBlockPos < 0 || mappedBlockPos >= tr.doc.content.size) return tr

          const colNode = tr.doc.nodeAt(mappedColPos)
          if (!colNode || colNode.type.name !== 'column') return tr

          const columnBlockNode = tr.doc.nodeAt(mappedBlockPos)
          if (!columnBlockNode || columnBlockNode.type.name !== 'columnBlock') return tr

          const isEmpty = colNode.childCount === 0 ||
            (colNode.childCount === 1 &&
             colNode.child(0).type.name === 'paragraph' &&
             colNode.child(0).childCount === 0)
          if (!isEmpty) return tr

          // Count non-empty columns
          let nonEmptyColumns = 0
          const contentNodes: PMNode[] = []
          columnBlockNode.forEach((child: PMNode) => {
            if (child.type.name === 'column') {
              const childEmpty = child.childCount === 0 ||
                (child.childCount === 1 &&
                 child.child(0).type.name === 'paragraph' &&
                 child.child(0).childCount === 0)
              if (!childEmpty) {
                nonEmptyColumns++
                child.forEach((block: PMNode) => contentNodes.push(block))
              }
            }
          })

          if (nonEmptyColumns <= 1) {
            // Unwrap: replace the entire columnBlock with its content
            if (contentNodes.length === 0) {
              contentNodes.push(editorView.state.schema.nodes.paragraph.create())
            }
            tr = tr.replaceWith(mappedBlockPos, mappedBlockPos + columnBlockNode.nodeSize, contentNodes)
          } else {
            // More than 1 non-empty column remains -- just delete the empty one
            tr = tr.delete(mappedColPos, mappedColPos + colNode.nodeSize)
          }
          return tr
        } catch {
          // Position resolution failed -- no cleanup needed
          return tr
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
        const sourcePos = dragSourcePos
        const sourceNodeSize = dragSourceNode.nodeSize

        // Case 1: target is already a columnBlock with < 4 columns
        if (targetNode.type.name === 'columnBlock' && targetNode.childCount < 4) {
          const newColumn = columnType.create(null, dragSourceNode)

          // Delete source first
          tr = tr.delete(sourcePos, sourcePos + sourceNodeSize)

          // Clean up empty source column (if source was inside a column)
          tr = cleanupSourceColumn(tr, sourcePos)

          // Adjust target position after source deletion
          const adjTargetPos = tr.mapping.map(targetPos)

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
          const finalTargetPos = tr.mapping.map(targetPos)
          const updatedNode = tr.doc.nodeAt(finalTargetPos)
          if (updatedNode) {
            const newCount = updatedNode.childCount
            const base = Math.floor((1 / newCount) * 10000) / 10000
            const widths = Array(newCount).fill(base)
            widths[newCount - 1] = +(1 - base * (newCount - 1)).toFixed(4)
            // Update parent column count (widths live on Column children,
            // handled by normalize-plugin width validation)
            tr = tr.setNodeMarkup(finalTargetPos, undefined, {
              ...updatedNode.attrs,
              columns: newCount,
            })
          }
        }
        // Case 2: target is a regular block -- wrap both into a new columnBlock
        else if (targetNode.type.name !== 'columnBlock') {
          // Build columns
          let col1Content = side === 'left' ? dragSourceNode : targetNode
          let col2Content = side === 'left' ? targetNode : dragSourceNode

          const col1 = columnType.create(null, col1Content)
          const col2 = columnType.create(null, col2Content)

          const columnBlock = columnBlockType.create(
            { columns: 2 },
            [col1, col2],
          )

          // Delete source and replace target, higher position first
          const sourceEnd = sourcePos + sourceNodeSize
          const targetEnd = targetPos + targetNode.nodeSize

          if (sourcePos > targetPos) {
            tr = tr.delete(sourcePos, sourceEnd)
            // Clean up empty source column before replacing target
            tr = cleanupSourceColumn(tr, sourcePos)
            const adjTargetEnd = tr.mapping.map(targetEnd)
            const adjTargetPos = tr.mapping.map(targetPos)
            tr = tr.replaceWith(adjTargetPos, adjTargetEnd, columnBlock)
          } else {
            tr = tr.replaceWith(targetPos, targetEnd, columnBlock)
            tr = tr.delete(sourcePos, sourceEnd)
            // Clean up empty source column after deletion
            tr = cleanupSourceColumn(tr, sourcePos)
          }
        }

        // Remove source block fade
        if (store.dragSourceElement) {
          store.dragSourceElement.classList.remove('block-drag-source')
          store.dragSourceElement = null
        }

        // Clear horizontal drop state
        store.currentState = {
          ...store.currentState,
          isDragging: false,
          horizontalDropSide: null,
          horizontalDropBlockPos: null,
          horizontalDropRect: null,
          horizontalDropColumnIndex: null,
          horizontalDropGapX: null,
        }
        notifyListeners()

        tr = tr.setMeta(blockIndicatorKey, { isDragging: false })
        editorView.dispatch(tr)
      }

      const executeMove = () => {
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

        // Clean up empty source column and unwrap columnBlock if needed
        tr = cleanupSourceColumn(tr, sourcePos)
        adjustedPos = tr.mapping.map(adjustedPos)

        // Place cursor at start of moved block (not select entire block)
        const $pos = tr.doc.resolve(adjustedPos + 1)
        tr = tr.setSelection(TextSelection.near($pos))

        // Mark transaction
        tr = tr.setMeta(blockIndicatorKey, { isDragging: false, justMoved: adjustedPos })

        // Remove source block fade
        if (store.dragSourceElement) {
          store.dragSourceElement.classList.remove('block-drag-source')
          store.dragSourceElement = null
        }

        // Set animating state
        store.currentState = {
          ...store.currentState,
          isDragging: false,
          isAnimating: true,
        }
        notifyListeners()

        editorView.dispatch(tr)

        // Animate indicator: horizontal shrinks to dot, then vertical grows
        requestAnimationFrame(() => {
          const ancestor = getPositionAncestor(editorView.dom)
          const landedDom = editorView.nodeDOM(adjustedPos)

          let landedTop = 0
          let landedLeft = 0
          let landedWidth = 0
          let finalHeight = 24

          if (landedDom instanceof HTMLElement && ancestor) {
            const landedOffset = getOffsetRelativeTo(landedDom, ancestor)
            landedTop = landedOffset.top
            landedLeft = landedOffset.left
            landedWidth = landedDom.offsetWidth
            finalHeight = landedDom.offsetHeight
          }

          // Hide caret during animation
          document.body.classList.add("block-animating")

          // Start shrinking animation - keep horizontal mode, will shrink width
          store.currentState = {
            ...store.currentState,
            visible: true,
            isDragging: true,  // Keep horizontal mode for shrinking
            commandHeld: false,
            top: landedTop,
            height: 2,  // Horizontal line height
            blockLeft: landedLeft,
            blockWidth: landedWidth,
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
        if (editorView !== _activeEditorView) return
        if (!store.indicatorEnabled) return

        // During drag/long-press, always process (user may drag outside editor)
        if (!isDragging && longPressTimer === null) {
          // Quick bounds check: is the mouse anywhere near the editor?
          // Use elementFromPoint to check if we're near the editor content,
          // avoiding the WebKit CSS zoom bug with getBoundingClientRect.
          const hitCheck = document.elementFromPoint(event.clientX, event.clientY)
          const ancestor = getPositionAncestor(editorView.dom)
          const zoomWrapper = editorView.dom.closest('[data-zoom-wrapper]')
          const isNearEditor = hitCheck && (
            editorView.dom.contains(hitCheck) ||
            (ancestor && ancestor.contains(hitCheck)) ||
            (zoomWrapper && zoomWrapper.contains(hitCheck))
          )
          if (!isNearEditor) {
            if (store.currentState.visible) {
              store.currentState = { ...store.currentState, visible: false }
              notifyListeners()
            }
            return
          }
        }

        store.lastMouseY = event.clientY

        if (longPressTimer !== null || isDragging) {
          event.preventDefault()
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            sel.removeAllRanges()
          }
        }

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

          const dropInfo = findDropPosition(event.clientX, event.clientY)
          if (dropInfo) {
            dropTargetPos = dropInfo.pos
            store.dropTargetIndex = dropInfo.index
          }

          // Resolve which block the cursor is over (depth-aware).
          // posAtCoords receives screen-space coords.
          const coords = editorView.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })

          if (coords) {
            const $pos = editorView.state.doc.resolve(coords.pos)
            const resolved = resolveDeepestDraggableBlock($pos)

            if (resolved) {
              const { pos: blockPos } = resolved

              try {
                const dom = editorView.nodeDOM(blockPos)
                if (!(dom instanceof HTMLElement)) return
                // Skip headers/footers during drag
                if (isNonContentArea(dom)) return

                const ancestor = getPositionAncestor(editorView.dom)
                if (!ancestor) return
                const isPaginated = isPaginationEnabled(editorView.dom)

                // In pagination mode, clip block reference to current page
                if (isPaginated) {
                  const blockRect = dom.getBoundingClientRect()
                  const clipped = clipIndicatorToCurrentPage(event.clientY, blockRect.top, blockRect.bottom)
                  if (!clipped) return // Mouse in forbidden zone -- keep last known state
                }

                // --- Vertical drop indicator dimensions ---
                // Use offset-based positioning for CSS values
                const blockOffset = getOffsetRelativeTo(dom, ancestor)
                let indicatorLeft = blockOffset.left
                let indicatorWidth = dom.offsetWidth

                const hitEl = document.elementFromPoint(event.clientX, event.clientY)
                const cursorColumnEl = hitEl?.closest?.('[data-column]')
                if (cursorColumnEl instanceof HTMLElement) {
                  const colOffset = getOffsetRelativeTo(cursorColumnEl, ancestor)
                  indicatorLeft = colOffset.left
                  indicatorWidth = cursorColumnEl.offsetWidth
                }

                // --- Edge zone detection (horizontal drop / column creation) ---
                // ARCHITECTURAL RULE: edge zones always operate on the top-level
                // block (direct child of section/doc), independent of
                // resolveDeepestDraggableBlock. This avoids flickering when
                // posAtCoords oscillates between different depths.
                let horizontalDropSide: 'left' | 'right' | null = null
                let horizontalDropColumnIndex: number | null = null
                let horizontalDropGapX: number | null = null
                let horizontalDropBlockPos: number | null = null
                let horizontalDropRect: { left: number; top: number; width: number; height: number } | null = null

                const topBlockDepth = findTopBlockDepth($pos)
                if ($pos.depth >= topBlockDepth) {
                  const topPos = $pos.before(topBlockDepth)
                  const topNode = $pos.node(topBlockDepth)
                  const topDom = editorView.nodeDOM(topPos)

                  if (topDom instanceof HTMLElement) {
                    // Use getBoundingClientRect for hit testing (mouse comparison)
                    const topRect = topDom.getBoundingClientRect()
                    const EDGE_ZONE = 30
                    const relativeX = event.clientX - topRect.left

                    const isTargetColumnBlock = topNode.type.name === 'columnBlock'
                    const targetColumnCount = isTargetColumnBlock ? topNode.childCount : 0
                    const canDropHorizontal = topPos !== dragSourcePos
                      && !(isTargetColumnBlock && targetColumnCount >= 4)

                    if (canDropHorizontal) {
                      if (relativeX <= EDGE_ZONE) {
                        horizontalDropSide = 'left'
                      } else if (relativeX >= topRect.width - EDGE_ZONE) {
                        horizontalDropSide = 'right'
                      }

                      // Divider gap detection for columnBlocks with room
                      if (!horizontalDropSide && isTargetColumnBlock && targetColumnCount < 4) {
                        const columnChildren = topDom.querySelectorAll<HTMLElement>(':scope [data-column]')
                        for (let ci = 0; ci < columnChildren.length - 1; ci++) {
                          const colRect = columnChildren[ci].getBoundingClientRect()
                          const nextColRect = columnChildren[ci + 1].getBoundingClientRect()
                          const gapLeft = colRect.right
                          const gapRight = nextColRect.left
                          if (event.clientX >= gapLeft - 8 && event.clientX <= gapRight + 8) {
                            horizontalDropSide = 'right'
                            horizontalDropColumnIndex = ci + 1
                            // Gap X in content space via offsets
                            const colOffset = getOffsetRelativeTo(columnChildren[ci], ancestor)
                            const nextColOffset = getOffsetRelativeTo(columnChildren[ci + 1], ancestor)
                            horizontalDropGapX = (colOffset.left + columnChildren[ci].offsetWidth + nextColOffset.left) / 2
                            break
                          }
                        }
                      }
                    }

                    if (horizontalDropSide) {
                      // Use offset-based positioning for the horizontal drop rect
                      const topOffset = getOffsetRelativeTo(topDom, ancestor)
                      horizontalDropBlockPos = topPos
                      horizontalDropRect = {
                        left: topOffset.left,
                        top: topOffset.top,
                        width: topDom.offsetWidth,
                        height: topDom.offsetHeight,
                      }
                    }
                  }
                }

                // --- Drop indicator Y position ---
                let indicatorTop: number
                if (dropInfo) {
                  indicatorTop = dropInfo.top
                } else if (store.currentState.dropIndicatorTop != null) {
                  indicatorTop = store.currentState.dropIndicatorTop
                } else {
                  indicatorTop = blockOffset.top
                }

                store.currentState = {
                  ...store.currentState,
                  visible: true,
                  top: indicatorTop,
                  height: 2,
                  blockLeft: indicatorLeft,
                  blockWidth: indicatorWidth,
                  dropIndicatorTop: indicatorTop,
                  horizontalDropSide,
                  horizontalDropBlockPos,
                  horizontalDropRect,
                  horizontalDropColumnIndex,
                  horizontalDropGapX,
                }
                notifyListeners()
              } catch {
                // Position invalid
              }
            }
          }
          return
        }

        // Find the block under the cursor using elementFromPoint (screen-space).
        // This avoids the WebKit CSS zoom bug where getBoundingClientRect()
        // returns un-zoomed values while event.clientX/Y is in screen space.
        // elementFromPoint correctly handles CSS zoom in all browsers.
        let blockPos: number | null = null

        const hitEl = document.elementFromPoint(event.clientX, event.clientY)
        if (hitEl && editorView.dom.contains(hitEl)) {
          // Walk up from the hit element to find a ProseMirror block node
          let el: HTMLElement | null = hitEl as HTMLElement
          while (el && el !== editorView.dom) {
            // Try to get PM position from this DOM element
            const pos = editorView.posAtDOM(el, 0)
            if (pos >= 0) {
              try {
                const $pos = editorView.state.doc.resolve(pos)
                const resolved = resolveDeepestDraggableBlock($pos)
                if (resolved && !STRUCTURAL_WRAPPERS.has(resolved.node.type.name)) {
                  // Verify we can get DOM for this position
                  const blockDom = editorView.nodeDOM(resolved.pos)
                  if (blockDom instanceof HTMLElement && !isNonContentArea(blockDom)) {
                    blockPos = resolved.pos
                    break
                  }
                }
              } catch { /* skip */ }
            }
            el = el.parentElement
          }
        }

        // Fallback: if elementFromPoint didn't find a block (e.g., mouse
        // in padding area), try posAtCoords which also works in screen space
        if (blockPos === null) {
          const coords = editorView.posAtCoords({ left: event.clientX, top: event.clientY })
          if (coords) {
            try {
              const $pos = editorView.state.doc.resolve(coords.pos)
              const resolved = resolveDeepestDraggableBlock($pos)
              if (resolved) {
                const blockDom = editorView.nodeDOM(resolved.pos)
                if (blockDom instanceof HTMLElement && !isNonContentArea(blockDom)) {
                  blockPos = resolved.pos
                }
              }
            } catch { /* skip */ }
          }
        }

        // Hide indicator if no block found
        if (blockPos === null) {
          if (store.currentState.visible && !isDragging) {
            currentBlockPos = null
            store.currentState = { ...store.currentState, visible: false }
            notifyListeners()
          }
          return
        }

        // Re-evaluate when entering a new block OR when returning to content
        // from a forbidden zone (indicator hidden but mouse now on valid block)
        const needsUpdate = blockPos !== currentBlockPos || !store.currentState.visible
        if (needsUpdate) {
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

              const ancestor = getPositionAncestor(editorView.dom)
              if (!ancestor) return
              const isPaginated = isPaginationEnabled(editorView.dom)

              // Use offset-based positioning (zoom-invariant)
              const offset = getOffsetRelativeTo(dom, ancestor)
              let indicatorTop = offset.top
              let indicatorHeight = dom.offsetHeight
              let shouldShow = true

              if (isPaginated) {
                const blockRect = dom.getBoundingClientRect()
                const clipped = clipIndicatorToCurrentPage(event.clientY, blockRect.top, blockRect.bottom)
                if (clipped) {
                  indicatorTop = offset.top + (clipped.clippedTop - blockRect.top)
                  indicatorHeight = clipped.clippedHeight
                } else {
                  shouldShow = false
                }
              }

              store.currentState = {
                ...store.currentState,
                visible: shouldShow,
                top: indicatorTop,
                height: indicatorHeight,
                blockLeft: offset.left,
                blockWidth: dom.offsetWidth,
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
        if (editorView !== _activeEditorView) return
        // Skip if disabled
        if (!store.indicatorEnabled) return
        if (currentBlockPos === null) return
        if (event.button !== 0) return // Only left click

        // Containment check (listener is on document, not editorView.dom)
        const mdTarget = event.target as HTMLElement | null
        if (!mdTarget || !editorView.dom.contains(mdTarget)) return

        // Don't interfere with column resize divider handles
        if ((event.target as HTMLElement).closest('.column-divider-handle')) return

        const dom = editorView.nodeDOM(currentBlockPos)
        if (!(dom instanceof HTMLElement)) return

        // Ctrl+click selection logic
        if (event.ctrlKey) {
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

        // Click without Ctrl = deselect all selected blocks
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

        // Suppress text selection during the long-press wait.
        // We set user-select:none on the editor DOM directly because
        // contenteditable="true" overrides body-level user-select:none in WebKit.
        editorView.dom.style.userSelect = 'none'
        ;(editorView.dom.style as any).webkitUserSelect = 'none'

        longPressTimer = setTimeout(() => {
          // Long press completed - start drag
          const node = editorView.state.doc.nodeAt(capturedBlockPos)
          if (!node) return

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
        if (editorView !== _activeEditorView) return
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
        // Restore user-select on editor DOM
        editorView.dom.style.userSelect = ''
        ;(editorView.dom.style as any).webkitUserSelect = ''

        // Remove source block fade (if executeMove didn't already)
        if (store.dragSourceElement) {
          store.dragSourceElement.classList.remove('block-drag-source')
          store.dragSourceElement = null
        }

        store.currentState = {
          ...store.currentState,
          isDragging: false,
        }
        notifyListeners()
      }

      const handleScroll = () => {
        if (editorView !== _activeEditorView) return
        updateBlockRect()
        // Also update selected blocks positions on scroll
        if (store.selectedBlockPositions.size > 0) {
          updateSelectedBlocksState()
        }
      }

      const handleGlobalMouseMove = (event: MouseEvent) => {
        if (editorView !== _activeEditorView) return
        // Skip if disabled
        if (!store.indicatorEnabled) return
        if (!store.currentState.visible && !isDragging) return

        // Don't hide if we're in keyboard mode (caret-tracking)
        // In that case, the indicator should stay at the caret position
        if (inputMode === 'keyboard') return

        // Check if mouse is outside the editor area.
        // Use elementFromPoint to avoid the WebKit CSS zoom getBoundingClientRect bug.
        const globalHit = document.elementFromPoint(event.clientX, event.clientY)
        const zoomWrapperEl = editorView.dom.closest('[data-zoom-wrapper]')
        const ancestorEl = getPositionAncestor(editorView.dom)
        const isInsideEditor = globalHit && (
          editorView.dom.contains(globalHit) ||
          (ancestorEl && ancestorEl.contains(globalHit)) ||
          (zoomWrapperEl && zoomWrapperEl.contains(globalHit))
        )

        if (!isInsideEditor && !isDragging) {
          hide()
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (editorView !== _activeEditorView) return
        // Skip if disabled
        if (!store.indicatorEnabled) return

        if (event.key === 'Control') {
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
        if (editorView !== _activeEditorView) return
        // Skip if disabled
        if (!store.indicatorEnabled) return

        if (event.key === 'Control') {
          setCommandHeld(false)
        }
      }

      // Global click to deselect - anywhere without Ctrl clears selection
      const handleGlobalMouseDown = (event: MouseEvent) => {
        if (editorView !== _activeEditorView) return
        // Skip if disabled
        if (!store.indicatorEnabled) return

        // Only deselect if Ctrl is NOT held and we have selections
        // Skip if clicking inside the editor (editor handler will manage it)
        if (!event.ctrlKey && store.selectedBlockPositions.size > 0) {
          const isInsideEditor = editorView.dom.contains(event.target as Node)
          if (!isInsideEditor) {
            clearSelections()
          }
        }
      }

      // Attach to window instead of editorView.dom.
      // TipTap/React may replace the editor DOM node after ProseMirror's view()
      // attaches listeners, leaving them on a disconnected element.
      // Handlers check containment internally.
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mousedown", handleMouseDown, true)  // Capture phase
      window.addEventListener("mousedown", handleGlobalMouseDown)  // Global deselect
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("mousemove", handleGlobalMouseMove)
      window.addEventListener("scroll", handleScroll, true)
      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)

      // Hide indicator on keypress (user is typing)
      // But ignore modifier keys - they shouldn't hide the indicator
      const handleEditorKeyDown = (event: KeyboardEvent) => {
        if (editorView !== _activeEditorView) return
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

      window.addEventListener("keydown", handleEditorKeyDown)

      let prevDoc = editorView.state.doc

      return {
        update: (view) => {
          // Claim active view if our DOM is now connected (may not have been
          // connected when view() ran during React's initial render cycle)
          if (view.dom.isConnected && _activeEditorView !== editorView) {
            _activeEditorView = editorView
          }
          if (editorView !== _activeEditorView) return
          updateBlockRect()

          // If document changed, recalculate selected block positions
          if (view.state.doc !== prevDoc && store.selectedBlockPositions.size > 0) {
            validateSelectedPositions()
            updateSelectedBlocksState()
          }
          prevDoc = view.state.doc
        },
        destroy: () => {
          if (_activeEditorView === editorView) {
            _activeEditorView = null
          }
          cancelLongPress()
          if (isDragging) {
            cancelDrag()
          }
          window.removeEventListener("mousemove", handleMouseMove)
          window.removeEventListener("mousedown", handleMouseDown, true)
          window.removeEventListener("keydown", handleEditorKeyDown)
          window.removeEventListener("mousedown", handleGlobalMouseDown)
          window.removeEventListener("mouseup", handleMouseUp)
          window.removeEventListener("mousemove", handleGlobalMouseMove)
          window.removeEventListener("scroll", handleScroll, true)
          window.removeEventListener("keydown", handleKeyDown)
          window.removeEventListener("keyup", handleKeyUp)
        },
      }
    },
  })
}
