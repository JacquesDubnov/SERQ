/**
 * Block Indicator - DOM Utility Functions
 *
 * Pure functions for DOM measurements and queries used by the block indicator.
 * Updated for presentation-agnostic architecture (no TipTap Pages dependency).
 *
 * CSS zoom coordinate strategy:
 * - For CSS positioning (absolute top/left): use offsetTop/offsetLeft chain
 *   via getOffsetRelativeTo(). These match CSS absolute positioning.
 * - For block finding (which block is under cursor): use elementFromPoint()
 *   which handles CSS zoom correctly in screen space.
 * - For bounds checking: use elementFromPoint + contains() instead of
 *   comparing mouse coords against getBoundingClientRect (broken by
 *   WebKit CSS zoom bug where getBoundingClientRect returns un-zoomed values).
 */

import { usePresentationStore } from '@/stores/presentationStore';

/**
 * Get the reference rect for positioning.
 * Always use the editor-content-wrapper since that's where BlockIndicator renders.
 * NOTE: Returns un-zoomed values in WebKit with CSS zoom bug.
 * Only use for screen-space hit testing where both sides are in the same space.
 */
export const getPositionReferenceRect = (editorDom: HTMLElement): DOMRect => {
  const wrapper = editorDom.closest('.editor-content-wrapper') as HTMLElement | null;
  if (wrapper) {
    return wrapper.getBoundingClientRect();
  }
  return editorDom.getBoundingClientRect();
};

/**
 * Get the positioned ancestor (.editor-content-wrapper) for offset calculations.
 */
export const getPositionAncestor = (editorDom: HTMLElement): HTMLElement | null => {
  return editorDom.closest('.editor-content-wrapper') as HTMLElement | null;
};

/**
 * Calculate an element's offset position relative to a specific ancestor
 * by walking the offsetParent chain. Returns { top, left } in the
 * content coordinate space -- exactly what CSS absolute positioning uses.
 *
 * This bypasses getBoundingClientRect entirely, avoiding the WebKit CSS zoom
 * bug where getBoundingClientRect returns un-zoomed values.
 */
export const getOffsetRelativeTo = (
  element: HTMLElement,
  ancestor: HTMLElement,
): { top: number; left: number } => {
  let top = 0;
  let left = 0;
  let current: HTMLElement | null = element;

  while (current && current !== ancestor) {
    top += current.offsetTop;
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }

  return { top, left };
};

/**
 * Check if pagination mode is enabled.
 * Reads from presentationStore instead of checking for TipTap Pages DOM elements.
 */
export const isPaginationEnabled = (_editorDom: HTMLElement): boolean => {
  return usePresentationStore.getState().activeMode === 'paginated';
};

/**
 * Get the page number for a given DOM element (1-indexed).
 * Uses section boundaries: in paginated mode, each section IS a page.
 */
export const getPageNumberForElement = (element: HTMLElement): number => {
  // Find the closest section ancestor (SectionView renders with data-section-id)
  const sectionElement = element.closest('[data-section-id]');
  if (!sectionElement) return 1;

  // Find the editor container (tiptap root)
  const editor = element.closest('.tiptap');
  if (!editor) return 1;

  // Count section elements before this one
  const sections = editor.querySelectorAll('[data-section-id]');
  const sectionIndex = Array.from(sections).indexOf(sectionElement);

  return sectionIndex >= 0 ? sectionIndex + 1 : 1;
};
