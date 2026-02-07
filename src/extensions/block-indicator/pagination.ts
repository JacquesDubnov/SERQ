/**
 * Block Indicator - Pagination Helpers
 *
 * Pure functions for detecting and clipping to section boundaries
 * in paginated mode. Updated for presentation-agnostic architecture
 * (no TipTap Pages dependency -- sections are the page units).
 */

import { usePresentationStore } from '@/stores/presentationStore';

/**
 * Check if an element is in a non-content area.
 * With SectionView, non-content areas are the gaps between section-page elements
 * (CSS margin-bottom). There are no more .tiptap-pagination-gap, .tiptap-page-header,
 * or .tiptap-page-footer elements.
 *
 * In the new architecture, the block indicator plugin only operates on content
 * inside sections. If an element is outside any section, it's non-content.
 */
export const isNonContentArea = (element: HTMLElement): boolean => {
  // If element is not inside a section, it's non-content
  const inSection = element.closest('[data-section-id]') !== null;
  if (!inSection) return true;

  return false;
};

/**
 * Get forbidden zones in paginated mode: the gaps between section-page elements.
 * Returns array of {top, bottom} rects where the indicator should NOT appear.
 * Returns null if not in paginated mode.
 */
export const getPaginationForbiddenZones = (): Array<{ top: number; bottom: number }> | null => {
  const { activeMode } = usePresentationStore.getState();
  if (activeMode !== 'paginated') return null;

  const sections = document.querySelectorAll('.section-page');
  if (sections.length < 2) return null;

  const zones: Array<{ top: number; bottom: number }> = [];

  // The gap between sections is the space from one section's bottom to the next section's top
  for (let i = 0; i < sections.length - 1; i++) {
    const currentRect = sections[i].getBoundingClientRect();
    const nextRect = sections[i + 1].getBoundingClientRect();

    const gapTop = currentRect.bottom;
    const gapBottom = nextRect.top;

    if (gapBottom > gapTop) {
      zones.push({ top: gapTop, bottom: gapBottom });
    }
  }

  return zones.length > 0 ? zones : null;
};

/**
 * Check if a Y coordinate falls inside any forbidden pagination zone.
 * Returns true if the point is in a gap between pages.
 */
export const isPointInForbiddenZone = (clientY: number): boolean => {
  const zones = getPaginationForbiddenZones();
  if (!zones) return false;

  for (const { top, bottom } of zones) {
    if (clientY >= top && clientY <= bottom) {
      return true;
    }
  }

  return false;
};

/**
 * Given a mouse Y and the block's screen rect, clip the indicator to the
 * current section's content area. In paginated mode, each section is a page.
 * If the block spans a section boundary (shouldn't happen normally), clip
 * to the section the mouse is in.
 *
 * @returns {top, height} in screen coordinates, or null if mouse is in a gap
 */
export const clipIndicatorToCurrentPage = (
  mouseY: number,
  blockTop: number,
  blockBottom: number,
): { clippedTop: number; clippedHeight: number } | null => {
  const zones = getPaginationForbiddenZones();
  if (!zones || zones.length === 0) {
    return { clippedTop: blockTop, clippedHeight: blockBottom - blockTop };
  }

  // Check if mouse is in a forbidden zone (gap between pages)
  for (const { top, bottom } of zones) {
    if (mouseY >= top && mouseY <= bottom) {
      return null;
    }
  }

  // Find the content slice: nearest gap boundary above and below the mouse
  let sliceTop = -Infinity;
  let sliceBottom = Infinity;

  for (const { top, bottom } of zones) {
    if (bottom <= mouseY && bottom > sliceTop) {
      sliceTop = bottom;
    }
    if (top >= mouseY && top < sliceBottom) {
      sliceBottom = top;
    }
  }

  // Clip the block rect to the content slice
  const clippedTop = Math.max(blockTop, sliceTop);
  const clippedBottom = Math.min(blockBottom, sliceBottom);

  if (clippedBottom <= clippedTop) {
    return null;
  }

  return { clippedTop, clippedHeight: clippedBottom - clippedTop };
};
