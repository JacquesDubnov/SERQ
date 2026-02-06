/**
 * ColumnBlockView - React NodeView for CSS Grid column layout
 *
 * Renders columns in a CSS Grid with draggable dividers between them.
 * Direct DOM mutation during resize for performance, commits on mouseUp.
 */

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useRef, useCallback, useEffect } from 'react'
import { getZoomFactor } from '@/extensions/block-indicator/dom-utils'
import './columns.css'

const MIN_COLUMN_WIDTH = 80 // px
const MIN_GUTTER = 10 // px
const MIN_COLUMN_FOR_GUTTER = 30 // px - columns can shrink to this during gutter resize

/**
 * Compute the maximum gutter that keeps every column at least MIN_COLUMN_FOR_GUTTER px wide.
 * containerWidth = N * columnWidth + (N-1) * gutter
 * => maxGutter = (containerWidth - N * MIN_COLUMN_FOR_GUTTER) / (N - 1)
 */
function computeMaxGutter(containerWidth: number, columnCount: number): number {
  if (columnCount <= 1) return containerWidth // no gutters with 1 column
  return Math.floor((containerWidth - columnCount * MIN_COLUMN_FOR_GUTTER) / (columnCount - 1))
}

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

export function ColumnBlockView({ node, getPos, updateAttributes, editor }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const resizeState = useRef<{
    active: boolean
    dividerIndex: number
    startX: number
    startWidths: number[]
    isGutterMode: boolean
    startGutter: number
    containerWidth: number
    rafId: number | null
  }>({
    active: false,
    dividerIndex: -1,
    startX: 0,
    startWidths: [],
    isGutterMode: false,
    startGutter: 24,
    containerWidth: 0,
    rafId: null,
  })

  const columnCount = node.childCount
  const columnWidths: number[] = node.attrs.columnWidths || Array(columnCount).fill(1 / columnCount)
  const gutter: number = node.attrs.gutter || 24

  // Build grid-template-columns from widths
  const gridTemplateColumns = columnWidths.map((w: number) => `${w}fr`).join(' ')

  // For N columns there are N-1 dividers
  const dividerCount = columnCount - 1

  // --- Focus tracking ---
  // Set data-focused when editor selection is inside this columnBlock.
  // ProseMirror keeps focus on the root editor DOM, so :focus-within doesn't work.
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
    checkFocus() // Initial check
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

      const zoom = getZoomFactor(editor.view.dom)
      const wrapperRect = wrapper.getBoundingClientRect()
      const totalWidth = wrapperRect.width / zoom
      const totalGutter = gutter * (columnCount - 1)
      const contentWidth = totalWidth - totalGutter

      // Calculate current pixel widths from fractions
      const currentWidths = columnWidths.map((w: number) => w * contentWidth)

      const isGutterMode = event.altKey

      resizeState.current = {
        active: true,
        dividerIndex,
        startX: event.clientX,
        startWidths: currentWidths,
        isGutterMode,
        startGutter: gutter,
        containerWidth: totalWidth,
        rafId: null,
      }

      wrapper.setAttribute('data-resizing', 'true')
      if (isGutterMode) {
        wrapper.setAttribute('data-gutter-mode', 'true')
        wrapper.style.setProperty('--current-gutter', `${gutter}px`)
      }
      document.body.style.cursor = 'col-resize'

      // Prevent text selection in both the document and ProseMirror editor
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

          const currentZoom = getZoomFactor(editor.view.dom)
          const delta = (e.clientX - resizeState.current.startX) / currentZoom

          if (resizeState.current.isGutterMode) {
            // Option+drag: adjust gutter width
            const maxGutter = computeMaxGutter(resizeState.current.containerWidth, columnCount)
            const newGutter = Math.max(MIN_GUTTER, Math.min(maxGutter, resizeState.current.startGutter + delta))
            wrapper.style.columnGap = `${newGutter}px`
            wrapper.style.setProperty('--current-gutter', `${newGutter}px`)
          } else {
            // Normal drag: resize adjacent columns
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
            const dividerEl = wrapper.querySelector<HTMLElement>(`[data-divider-index="${idx}"]`)
            if (dividerEl) {
              dividerEl.style.left = computeDividerLeft(fractions, idx, gutter)
            }
          }
        })
      }

      const handleMouseUp = () => {
        if (!resizeState.current.active) return

        if (resizeState.current.rafId !== null) {
          cancelAnimationFrame(resizeState.current.rafId)
        }

        resizeState.current.active = false
        wrapper.removeAttribute('data-resizing')
        wrapper.removeAttribute('data-gutter-mode')
        wrapper.style.removeProperty('--current-gutter')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        ;(document.body.style as any).webkitUserSelect = ''
        editor.view.dom.style.userSelect = ''
        ;(editor.view.dom.style as any).webkitUserSelect = ''

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        if (resizeState.current.isGutterMode) {
          // Read final gutter from DOM and commit
          const computedGap = parseFloat(wrapper.style.columnGap) || gutter
          const maxGutter = computeMaxGutter(resizeState.current.containerWidth, columnCount)
          updateAttributes({ gutter: Math.max(MIN_GUTTER, Math.min(maxGutter, Math.round(computedGap))) })
        } else {
          // Read final widths from DOM and commit as fractions
          const currentZoom = getZoomFactor(editor.view.dom)
          const columns = wrapper.querySelectorAll<HTMLElement>('[data-column]')
          const pixelWidths: number[] = []
          columns.forEach((col) => {
            pixelWidths.push(col.getBoundingClientRect().width / currentZoom)
          })

          const total = pixelWidths.reduce((a, b) => a + b, 0)
          if (total > 0) {
            const fractions = pixelWidths.map((w) => +(w / total).toFixed(4))
            // Fix rounding
            const sum = fractions.reduce((a, b) => a + b, 0)
            fractions[fractions.length - 1] = +(fractions[fractions.length - 1] + (1 - sum)).toFixed(4)
            updateAttributes({ columnWidths: fractions })
          }
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [columnWidths, gutter, columnCount, editor, updateAttributes],
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
