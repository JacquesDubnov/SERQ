/**
 * Presentation Store - Controls how content is displayed
 *
 * Based on Round 4 spec Section F.1. Manages presentation mode (continuous/paginated),
 * page format, content width, and zoom. All presentation concerns live here,
 * NOT in editorStore (which is document metadata only).
 *
 * Key architectural principle: switching modes is a CONFIG CHANGE, not an editor
 * rebuild. The document content is untouched. SectionView reads this store and
 * applies different CSS classes based on activeMode.
 */

import { create } from 'zustand';

export type PresentationMode = 'continuous' | 'paginated';
export type CanvasWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type PageSize = 'a4' | 'letter' | 'legal';

// Page dimensions in pixels at 96 DPI
export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number; label: string }> = {
  a4: { width: 794, height: 1123, label: 'A4' },           // 210mm x 297mm
  letter: { width: 816, height: 1056, label: 'Letter' },   // 8.5" x 11"
  legal: { width: 816, height: 1344, label: 'Legal' },     // 8.5" x 14"
};

// Canvas width values in pixels
export const CANVAS_WIDTH_VALUES: Record<CanvasWidth, string> = {
  narrow: '600px',
  normal: '720px',
  wide: '900px',
  full: '100%',
};

// Default page margins (in px)
export const DEFAULT_PAGE_MARGINS = {
  top: 72,     // ~1 inch
  right: 72,
  bottom: 72,
  left: 72,
};

export interface PageFormat {
  size: PageSize;
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface PresentationState {
  // Mode
  activeMode: PresentationMode;

  // Page format (for paginated mode)
  pageFormat: PageFormat;

  // Content width (for continuous mode)
  contentWidth: CanvasWidth;

  // Zoom (applies to all modes)
  zoom: number; // 20-300 percent

  // Actions
  setActiveMode: (mode: PresentationMode) => void;
  setPageSize: (size: PageSize) => void;
  setPageMargins: (margins: Partial<PageFormat['margins']>) => void;
  setContentWidth: (width: CanvasWidth) => void;
  setZoom: (zoom: number) => void;
  toggleMode: () => void;
}

export const usePresentationStore = create<PresentationState>((set) => ({
  activeMode: 'continuous',

  pageFormat: {
    size: 'a4',
    width: PAGE_DIMENSIONS.a4.width,
    height: PAGE_DIMENSIONS.a4.height,
    margins: { ...DEFAULT_PAGE_MARGINS },
  },

  contentWidth: 'normal',

  zoom: 100,

  setActiveMode: (mode) => set({ activeMode: mode }),

  setPageSize: (size) => set((state) => ({
    pageFormat: {
      ...state.pageFormat,
      size,
      width: PAGE_DIMENSIONS[size].width,
      height: PAGE_DIMENSIONS[size].height,
    },
  })),

  setPageMargins: (margins) => set((state) => ({
    pageFormat: {
      ...state.pageFormat,
      margins: { ...state.pageFormat.margins, ...margins },
    },
  })),

  setContentWidth: (width) => set({ contentWidth: width }),

  setZoom: (zoom) => set({ zoom: Math.min(300, Math.max(20, zoom)) }),

  toggleMode: () => set((state) => ({
    activeMode: state.activeMode === 'continuous' ? 'paginated' : 'continuous',
  })),
}));
