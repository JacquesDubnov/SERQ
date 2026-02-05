/**
 * Block Indicator - Pagination Helpers
 *
 * Pure functions for detecting and clipping to pagination zones
 * (gaps, headers, footers created by TipTap Pages).
 */

/**
 * Check if an element is in a non-content area (header, footer, or page gap).
 * These areas should not show the block indicator.
 */
export const isNonContentArea = (element: HTMLElement): boolean => {
  const inGap = element.closest('.tiptap-pagination-gap') !== null
  const inHeader = element.closest('.tiptap-page-header') !== null
  const inFooter = element.closest('.tiptap-page-footer') !== null

  if (inHeader || inFooter || inGap) {
    return true
  }

  return false
}

/**
 * Get the forbidden zones in pagination mode: gaps, headers, and footers.
 * Returns array of {top, bottom} rects where the indicator should NOT appear.
 * Returns null if pagination is not active.
 *
 * Uses the actual DOM elements created by TipTap Pages:
 * - .tiptap-pagination-gap (visual separator between pages)
 * - .tiptap-page-header (page header area)
 * - .tiptap-page-footer (page footer area)
 */
export const getPaginationForbiddenZones = (): Array<{ top: number; bottom: number }> | null => {
  const paginationContainer = document.querySelector('[data-tiptap-pagination]') as HTMLElement | null
  if (!paginationContainer) return null

  const zones: Array<{ top: number; bottom: number }> = []

  // Collect gaps
  const gaps = document.querySelectorAll('.tiptap-pagination-gap')
  for (const gap of gaps) {
    const rect = gap.getBoundingClientRect()
    if (rect.height > 0) {
      zones.push({ top: rect.top, bottom: rect.bottom })
    }
  }

  // Collect headers
  const headers = document.querySelectorAll('.tiptap-page-header')
  for (const header of headers) {
    const rect = header.getBoundingClientRect()
    if (rect.height > 0) {
      zones.push({ top: rect.top, bottom: rect.bottom })
    }
  }

  // Collect footers
  const footers = document.querySelectorAll('.tiptap-page-footer')
  for (const footer of footers) {
    const rect = footer.getBoundingClientRect()
    if (rect.height > 0) {
      zones.push({ top: rect.top, bottom: rect.bottom })
    }
  }

  return zones
}

/**
 * Check if a Y coordinate falls inside any forbidden pagination zone.
 * Returns true if the point is in a gap, header, or footer.
 */
export const isPointInForbiddenZone = (clientY: number): boolean => {
  const zones = getPaginationForbiddenZones()
  if (!zones) return false // Not paginated

  for (const { top, bottom } of zones) {
    if (clientY >= top && clientY <= bottom) {
      return true
    }
  }

  return false
}

/**
 * Given a mouse Y and the block's screen rect, clip the indicator to the
 * current page's content area. Content area is defined as the space between
 * the nearest forbidden zone edges above and below the mouse position.
 *
 * When a block's DOM rect spans a page gap (because TipTap Pages paginates
 * visually but the DOM element is one continuous node), this clips the
 * indicator so it only renders within the page the mouse is on.
 *
 * @returns {top, height} in screen coordinates, or null if mouse is in a forbidden zone
 */
export const clipIndicatorToCurrentPage = (
  mouseY: number,
  blockTop: number,
  blockBottom: number,
): { clippedTop: number; clippedHeight: number } | null => {
  const zones = getPaginationForbiddenZones()
  if (!zones || zones.length === 0) {
    return { clippedTop: blockTop, clippedHeight: blockBottom - blockTop }
  }

  // Check if mouse is in a forbidden zone
  for (const { top, bottom } of zones) {
    if (mouseY >= top && mouseY <= bottom) {
      return null // Mouse in forbidden zone, hide indicator
    }
  }

  // Find the content slice: nearest forbidden boundary above and below the mouse
  let sliceTop = -Infinity
  let sliceBottom = Infinity

  for (const { top, bottom } of zones) {
    // Forbidden zone is above the mouse -- its bottom edge constrains our slice top
    if (bottom <= mouseY && bottom > sliceTop) {
      sliceTop = bottom
    }
    // Forbidden zone is below the mouse -- its top edge constrains our slice bottom
    if (top >= mouseY && top < sliceBottom) {
      sliceBottom = top
    }
  }

  // Clip the block rect to the content slice
  const clippedTop = Math.max(blockTop, sliceTop)
  const clippedBottom = Math.min(blockBottom, sliceBottom)

  if (clippedBottom <= clippedTop) {
    return null // Fully clipped away
  }

  return { clippedTop, clippedHeight: clippedBottom - clippedTop }
}
