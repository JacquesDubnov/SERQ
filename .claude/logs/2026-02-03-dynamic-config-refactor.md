# Dynamic Configuration Refactor Log

**Date:** 2026-02-03
**Branch:** feature/unified-style-system

---

## Summary

Removed ALL hardcoded lists from toolbar components. Everything now reads from `styleStore.ts` - fonts, weights, colors are fully dynamic and user-configurable.

---

## Files Modified

### Core Store
- `src/stores/styleStore.ts`
  - Added types: `FontOption`, `FontWeightOption`, `ColorOption`, `FontCategories`
  - Added state: `fontCategories`, `availableFonts`, `availableFontWeights`, `availableTextColors`, `availableHighlightColors`
  - Added actions: `addFont`, `removeFont`, `reorderFonts`, `addFontWeight`, `removeFontWeight`, `addTextColor`, `removeTextColor`, `addHighlightColor`, `removeHighlightColor`
  - Added defaults: `DEFAULT_FONT_CATEGORIES`, `DEFAULT_FONT_WEIGHTS`, `DEFAULT_TEXT_COLORS`, `DEFAULT_HIGHLIGHT_COLORS`

### Toolbar Dropdown Components
- `src/components/tiptap-ui-custom/font-family-dropdown/font-family-dropdown.tsx`
  - Removed `GOOGLE_FONTS` constant
  - Now uses `fontCategories` and `availableFonts` from store

- `src/components/tiptap-ui-custom/font-weight-dropdown/font-weight-dropdown.tsx`
  - Removed `FONT_WEIGHTS` constant
  - Now uses `availableFontWeights` from store

### Unified Toolbar Controls
- `src/components/unified-toolbar/controls/FontFamilyControl.tsx`
  - Removed import of `GOOGLE_FONTS`
  - Now uses `fontCategories` from store

- `src/components/unified-toolbar/controls/FontWeightControl.tsx`
  - Removed import of `FONT_WEIGHTS`
  - Now uses `availableFontWeights` from store

- `src/components/unified-toolbar/controls/TextColorControl.tsx`
  - Removed `TEXT_COLORS` constant
  - Now uses `availableTextColors` from store

- `src/components/unified-toolbar/controls/HighlightControl.tsx`
  - Removed `HIGHLIGHT_COLORS` constant
  - Now uses `availableHighlightColors` from store

### Style Hooks
- `src/hooks/style-hooks/useUnifiedFontFamily.ts`
  - Removed `GOOGLE_FONTS` import and `ALL_FONTS` constant
  - Now gets `availableFonts` from store for label lookup

- `src/hooks/style-hooks/useUnifiedFontWeight.ts`
  - Removed `FONT_WEIGHTS` constant
  - Now gets `availableFontWeights` from store for label lookup

### Index Files (Removed Hardcoded Exports)
- `src/hooks/style-hooks/index.ts` - Removed `FONT_WEIGHTS` export
- `src/components/unified-toolbar/controls/index.ts` - Removed `TEXT_COLORS`, `HIGHLIGHT_COLORS` exports
- `src/components/tiptap-ui-custom/index.tsx` - Removed `GOOGLE_FONTS`, `FONT_WEIGHTS` exports
- `src/components/tiptap-ui-custom/font-family-dropdown/index.tsx` - Removed `GOOGLE_FONTS` export

---

## Not Changed (By Design)

- `src/components/tiptap-ui/color-highlight-button/use-color-highlight.ts` - TipTap template hook
- `src/components/tiptap-ui/color-text-button/use-color-text.ts` - TipTap template hook
- `src/components/tiptap-ui/color-menu/color-menu.tsx` - TipTap template component

These are part of TipTap's native UI system. The unified-toolbar controls (primary UI) now use dynamic store.

---

## Architecture Pattern

```tsx
// ❌ OLD - Hardcoded in component
export const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 400, label: 'Regular' },
  { value: 700, label: 'Bold' },
];

// ✅ NEW - Read from store
const availableFontWeights = useStyleStore((state) => state.availableFontWeights);
```

---

## Build Status

```
npm run build    # ✓ Compiles successfully
```

---

## What This Enables

1. **User Font Management** - Add/remove/reorder fonts without code changes
2. **Custom Color Palettes** - Define project-specific colors
3. **Font Weight Presets** - Customize available weight options
4. **Future: Settings UI** - Build a settings panel that modifies the store
5. **Future: Persistence** - Save user preferences to file/database
