/**
 * ZoomCoordinateFix - Patches caretRangeFromPoint for CSS transform:scale
 *
 * Problem: WebKit's caretRangeFromPoint operates in layout coordinate space,
 * ignoring CSS transforms. When the editor is wrapped in transform:scale(s),
 * clicking at visual position (vx, vy) resolves to the wrong character because
 * caretRangeFromPoint looks up (vx, vy) in the unscaled layout.
 *
 * Fix: Monkey-patch caretRangeFromPoint to detect zoom wrappers and convert
 * visual coordinates to layout coordinates before calling the original.
 *
 * Why this works:
 * - elementFromPoint(vx, vy) correctly finds the visual target (handles transforms)
 * - We detect the zoom wrapper and compute: layoutX = originX + (vx - originX) / zoom
 * - originalCaretRangeFromPoint(layoutX, layoutY) finds the correct character
 * - ProseMirror's posAtCoords validates the Range's BCR (visual coords) against
 *   the original visual input coords -- both in the same space, validation passes
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const ZOOM_WRAPPER_ATTR = 'data-zoom-wrapper'
const pluginKey = new PluginKey('zoomCoordinateFix')

let originalCaretRangeFromPoint: ((x: number, y: number) => Range | null) | null = null
let patchRefCount = 0

function adjustedCaretRangeFromPoint(x: number, y: number): Range | null {
  if (!originalCaretRangeFromPoint) return null

  // Find what element is at this visual point (handles transforms correctly)
  const el = document.elementFromPoint(x, y)
  if (!el) return originalCaretRangeFromPoint(x, y)

  // Check if inside a zoom wrapper
  const wrapper = (el as HTMLElement).closest?.(`[${ZOOM_WRAPPER_ATTR}]`) as HTMLElement | null
  if (!wrapper) return originalCaretRangeFromPoint(x, y)

  // Compute effective zoom: BCR (visual) vs offset (layout)
  const zoom = wrapper.offsetWidth > 0
    ? wrapper.getBoundingClientRect().width / wrapper.offsetWidth
    : 1
  if (Math.abs(zoom - 1) < 0.01) return originalCaretRangeFromPoint(x, y)

  // Transform origin is 'top left', so origin = wrapper's BCR top-left
  const bcr = wrapper.getBoundingClientRect()
  const adjX = bcr.left + (x - bcr.left) / zoom
  const adjY = bcr.top + (y - bcr.top) / zoom

  return originalCaretRangeFromPoint(adjX, adjY)
}

export const ZoomCoordinateFix = Extension.create({
  name: 'zoomCoordinateFix',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        view() {
          if (patchRefCount === 0 && document.caretRangeFromPoint) {
            originalCaretRangeFromPoint = document.caretRangeFromPoint.bind(document)
            document.caretRangeFromPoint = adjustedCaretRangeFromPoint
          }
          patchRefCount++

          return {
            destroy() {
              patchRefCount--
              if (patchRefCount === 0 && originalCaretRangeFromPoint) {
                document.caretRangeFromPoint = originalCaretRangeFromPoint as typeof document.caretRangeFromPoint
                originalCaretRangeFromPoint = null
              }
            },
          }
        },
      }),
    ]
  },
})
