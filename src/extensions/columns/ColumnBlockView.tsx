/**
 * ColumnBlockView - React NodeView for CSS Grid column layout
 *
 * Renders columns in a CSS Grid with draggable dividers between them.
 * Direct DOM mutation during resize for performance, commits on mouseUp.
 *
 * Column widths are read from Column children (Column.attrs.width),
 * NOT from parent attributes. On resize commit, widths are written
 * to BOTH adjacent column children in a single transaction using
 * position mapping (per spec R4-1).
 */

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useRef, useCallback, useEffect } from 'react'
import './columns.css'

const MIN_COLUMN_WIDTH = 80 // px
const DEFAULT_GUTTER = 24 // px
const MIN_GUTTER = 10 // px
const MAX_GUTTER = 80 // px

/**
 * Compute the CSS `left` value for a divider centered in the gap between columns.
 *
 * CSS Grid with `fr` units distributes (containerWidth - totalGaps) among columns.
 * Gap i center = fractionSum * (W - (N-1)*G) + i*G + G/2
 * In CSS calc:  fractionSum * 100% + (i*G + G/2 - fractionSum*(N-1)*G)px
 */
function computeDividerLeft(fractions: number[], dividerIndex: number, gutter: number): string {
  const fractionSum = fractions.slice(0, dividerIndex + 1).reduce((a, b) => a + b, 0)
  const columnCount = fractions.length
  const pxOffset = dividerIndex * gutter + gutter / 2 - fractionSum * (columnCount - 1) * gutter
  return `calc(${fractionSum * 100}% + ${pxOffset}px)`
}

/**
 * Read width fractions from Column children.
 */
function getChildWidths(node: NodeViewProps['node']): number[] {
  const widths: number[] = []
  node.forEach((child) => {
    widths.push((child.attrs.width as number) || 1 / node.childCount)
  })
  return widths
}

export function ColumnBlockView({ node, getPos, editor }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const resizeState = useRef<{
    active: boolean
    dividerIndex: number
    startX: number
    startWidths: number[]
    containerWidth: number
    rafId: number | null
    gutterMode: boolean
    startGutter: number
  }>({
    active: false,
    dividerIndex: -1,
    startX: 0,
    startWidths: [],
    containerWidth: 0,
    rafId: null,
    gutterMode: false,
    startGutter: DEFAULT_GUTTER,
  })

  const columnCount = node.childCount
  const columnWidths = getChildWidths(node)
  const gutter = (node.attrs.gutter as number) || DEFAULT_GUTTER

  // Build grid-template-columns from widths
  const gridTemplateColumns = columnWidths.map((w: number) => `${w}fr`).join(' ')

  // For N columns there are N-1 dividers
  const dividerCount = columnCount - 1

  // --- Focus tracking ---
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const checkFocus = () => {
      const pos = getPos()
      if (pos === undefined) return
      const { from } = editor.state.selection
      const nodeEnd = pos + node.nodeSize
      const inside = from > pos && from < nodeEnd
      if (inside) {
        wrapper.setAttribute('data-focused', '')
      } else {
        wrapper.removeAttribute('data-focused')
      }
    }

    editor.on('selectionUpdate', checkFocus)
    checkFocus()
    return () => {
      editor.off('selectionUpdate', checkFocus)
    }
  }, [editor, getPos, node.nodeSize])

  // --- Resize Logic ---

  const handleMouseDown = useCallback(
    (dividerIndex: number, event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const wrapper = wrapperRef.current
      if (!wrapper) return

      const isGutterMode = event.altKey
      const wrapperRect = wrapper.getBoundingClientRect()
      const totalWidth = wrapperRect.width
      const totalGutter = gutter * (columnCount - 1)
      const contentWidth = totalWidth - totalGutter

      // Calculate current pixel widths from fractions
      const currentWidths = columnWidths.map((w: number) => w * contentWidth)

      resizeState.current = {
        active: true,
        dividerIndex,
        startX: event.clientX,
        startWidths: currentWidths,
        containerWidth: totalWidth,
        rafId: null,
        gutterMode: isGutterMode,
        startGutter: gutter,
      }

      wrapper.setAttribute('data-resizing', 'true')
      if (isGutterMode) {
        wrapper.dataset.gutterMode = 'true'
      }
      document.body.style.cursor = 'col-resize'

      // Prevent text selection
      document.body.style.userSelect = 'none'
      const style = document.body.style as any
      style.webkitUserSelect = 'none'
      editor.view.dom.style.userSelect = 'none'
      ;(editor.view.dom.style as any).webkitUserSelect = 'none'

      const handleMouseMove = (e: MouseEvent) => {
        if (!resizeState.current.active) return

        if (resizeState.current.rafId !== null) return

        resizeState.current.rafId = requestAnimationFrame(() => {
          resizeState.current.rafId = null
          if (!resizeState.current.active || !wrapper) return

          const delta = e.clientX - resizeState.current.startX

          if (resizeState.current.gutterMode) {
            // Gutter mode: adjust spacing between ALL columns uniformly
            const newGutter = Math.round(
              Math.min(MAX_GUTTER, Math.max(MIN_GUTTER, resizeState.current.startGutter + delta))
            )
            wrapper.style.columnGap = `${newGutter}px`

            // Reposition all divider handles for the new gutter
            const dividerEls = wrapper.querySelectorAll<HTMLElement>('[data-divider-index]')
            const currentFractions = columnWidths // Fractions unchanged in gutter mode
            dividerEls.forEach((el) => {
              const di = parseInt(el.dataset.dividerIndex ?? '0', 10)
              el.style.left = computeDividerLeft(currentFractions, di, newGutter)
            })
          } else {
            // Column width mode: adjust widths of adjacent columns
            const idx = resizeState.current.dividerIndex
            const widths = [...resizeState.current.startWidths]

            let newLeft = widths[idx] + delta
            let newRight = widths[idx + 1] - delta

            // Enforce minimums
            if (newLeft < MIN_COLUMN_WIDTH) {
              const diff = MIN_COLUMN_WIDTH - newLeft
              newLeft = MIN_COLUMN_WIDTH
              newRight -= diff
            }
            if (newRight < MIN_COLUMN_WIDTH) {
              const diff = MIN_COLUMN_WIDTH - newRight
              newRight = MIN_COLUMN_WIDTH
              newLeft -= diff
            }

            widths[idx] = newLeft
            widths[idx + 1] = newRight

            // Direct DOM mutation for performance
            const totalContentWidth = widths.reduce((a, b) => a + b, 0)
            const fractions = widths.map((w) => w / totalContentWidth)
            wrapper.style.gridTemplateColumns = fractions.map((f) => `${f}fr`).join(' ')

            // Also move the active divider handle to match the new grid
            const currentGutter = resizeState.current.startGutter
            const dividerEl = wrapper.querySelector<HTMLElement>(`[data-divider-index="${idx}"]`)
            if (dividerEl) {
              dividerEl.style.left = computeDividerLeft(fractions, idx, currentGutter)
            }
          }
        })
      }

      const handleMouseUp = () => {
        if (!resizeState.current.active) return

        if (resizeState.current.rafId !== null) {
          cancelAnimationFrame(resizeState.current.rafId)
        }

        const wasGutterMode = resizeState.current.gutterMode
        resizeState.current.active = false
        wrapper.removeAttribute('data-resizing')
        delete wrapper.dataset.gutterMode
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        ;(document.body.style as any).webkitUserSelect = ''
        editor.view.dom.style.userSelect = ''
        ;(editor.view.dom.style as any).webkitUserSelect = ''

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        const blockPos = getPos()
        if (blockPos === undefined) return

        if (wasGutterMode) {
          // Commit gutter change to ColumnBlock node attribute
          const computedGap = wrapper.style.columnGap
          const newGutter = computedGap ? parseInt(computedGap, 10) : DEFAULT_GUTTER
          const clamped = Math.min(MAX_GUTTER, Math.max(MIN_GUTTER, newGutter))

          const { tr } = editor.state
          const columnBlock = editor.state.doc.nodeAt(blockPos)
          if (!columnBlock) return

          tr.setNodeMarkup(blockPos, undefined, {
            ...columnBlock.attrs,
            gutter: clamped,
          })
          editor.view.dispatch(tr)
        } else {
          // Read final widths from DOM and commit to Column children
          const columns = wrapper.querySelectorAll<HTMLElement>('[data-column]')
          const pixelWidths: number[] = []
          columns.forEach((col) => {
            pixelWidths.push(col.getBoundingClientRect().width)
          })

          const total = pixelWidths.reduce((a, b) => a + b, 0)
          if (total > 0) {
            const fractions = pixelWidths.map((w) => +(w / total).toFixed(4))
            // Fix rounding on last element
            const sum = fractions.reduce((a, b) => a + b, 0)
            fractions[fractions.length - 1] = +(fractions[fractions.length - 1] + (1 - sum)).toFixed(4)

            // Write widths to Column children using position mapping (R4-1 pattern).
            // Each setNodeMarkup shifts subsequent positions, so we map through
            // the transaction's mapping for correctness.
            const { tr } = editor.state
            const columnBlock = editor.state.doc.nodeAt(blockPos)
            if (!columnBlock) return

            const childPositions: number[] = []
            columnBlock.forEach((_child, childOffset) => {
              childPositions.push(blockPos + 1 + childOffset)
            })

            for (let i = 0; i < childPositions.length; i++) {
              const mappedPos = tr.mapping.map(childPositions[i])
              const col = tr.doc.nodeAt(mappedPos)
              if (col && col.type.name === 'column') {
                tr.setNodeMarkup(mappedPos, undefined, {
                  ...col.attrs,
                  width: fractions[i],
                })
              }
            }

            editor.view.dispatch(tr)
          }
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [columnWidths, gutter, columnCount, editor, getPos],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeState.current.rafId !== null) {
        cancelAnimationFrame(resizeState.current.rafId)
      }
    }
  }, [])

  return (
    <NodeViewWrapper
      className="column-block-wrapper"
      data-column-block=""
      ref={wrapperRef}
      style={{
        gridTemplateColumns,
        columnGap: `${gutter}px`,
      } as React.CSSProperties}
    >
      <NodeViewContent className="column-block-content" />
      {/* Divider handles (positioned absolutely over the gaps) */}
      {Array.from({ length: dividerCount }).map((_, i) => (
        <div
          key={i}
          className="column-divider-handle"
          style={{
            left: computeDividerLeft(columnWidths, i, gutter),
          }}
          onMouseDown={(e) => handleMouseDown(i, e)}
          data-divider-index={i}
        />
      ))}
    </NodeViewWrapper>
  )
}
