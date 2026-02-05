/**
 * Block Indicator - DOM Utility Functions
 *
 * Pure functions for DOM measurements and queries used by the block indicator.
 */

/**
 * Get the reference rect for positioning.
 * Always use the editor-content-wrapper since that's where BlockIndicator renders.
 */
export const getPositionReferenceRect = (editorDom: HTMLElement): DOMRect => {
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
export const isPaginationEnabled = (editorDom: HTMLElement): boolean => {
  // Pagination container is a CHILD of the ProseMirror element, not a parent
  return editorDom.querySelector('[data-tiptap-pagination]') !== null
}

/**
 * Get the effective zoom/scale factor from an ancestor transform:scale().
 * Compares getBoundingClientRect (scaled viewport px) to offsetWidth (unscaled CSS px).
 * With transform:scale(0.5): BCR.width=360, offsetWidth=720, ratio=0.5
 * Without transform: ratio=1.0
 */
export const getZoomFactor = (editorDom: HTMLElement): number => {
  if (editorDom.offsetWidth === 0) return 1
  return editorDom.getBoundingClientRect().width / editorDom.offsetWidth
}

/**
 * Get the page number for a given DOM element (1-indexed)
 * Uses DOM hierarchy to find which .page element contains the block
 */
export const getPageNumberForElement = (element: HTMLElement): number => {
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
