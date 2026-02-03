# SERQ Session Handover

**Last Updated:** 2026-02-03
**Branch:** main

---

## Project Overview

SERQ is a Tauri-based desktop text editor using TipTap (ProseMirror). We've built a **Unified Style System** that makes the toolbar heading-aware - when cursor is in a heading with assigned custom styles, the toolbar shows those styles instead of TipTap's default mark values.

---

## Current State: Heading-Aware Toolbar COMPLETE

### What's Working

1. **UnifiedToolbar** - Single toolbar (exact replica of original EditorToolbar)
   - Two rows: History, Fonts, Marks, Colors, Links, Clear / Headings, Lists, Alignment, Spacing
   - All original components with input fields, +/- buttons, dropdowns

2. **Heading Context Menu** - Right-click H1-H6 buttons to:
   - Assign current style to heading type
   - Customize style (inline typography panel)
   - Reset to default
   - Add dividing line with settings

3. **Heading-Aware Toolbar Components**
   - Font dropdowns read from styleStore for headings (via editor-utils.ts)
   - Mark buttons (Bold/Italic/Underline/Strike) read from styleStore for headings
   - Color popover reads from styleStore for headings, resolves CSS variables

### Architecture

**See `.planning/UNIFIED-STYLE-SYSTEM-ARCHITECTURE.md`** for complete documentation.

Key concept: **editor-utils.ts is THE BRIDGE** between toolbar and styles.

```
Toolbar Component
       ↓
editor-utils.ts (getTextStyleAtCursor, etc.)
       ↓
Is heading with custom style?
       ↓
YES → Read from styleStore.headingCustomStyles
NO  → Read from TipTap marks/defaults
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/editor-utils.ts` | **THE BRIDGE** - All toolbar style queries go through here |
| `src/stores/styleStore.ts` | Zustand store for heading custom styles |
| `src/components/unified-toolbar/UnifiedToolbar.tsx` | The single toolbar |
| `src/components/tiptap-ui-custom/heading-aware-mark-button/` | Bold/Italic/Underline/Strike |
| `src/components/tiptap-ui-custom/heading-aware-color-popover/` | Color picker |
| `src/components/tiptap-ui-custom/heading-context-menu/` | Right-click menu for H1-H6 |
| `.planning/UNIFIED-STYLE-SYSTEM-ARCHITECTURE.md` | Full architecture docs |

---

## What's Next

### Immediate
1. **Test** - Run `npm run tauri dev` and verify heading styles work
2. **Clean up** - Remove debug console.log statements once verified

### Pending Tasks
- **Task #8** - Blue dot indicator for "default" values in dropdowns

---

## Commands

```bash
# Start Tauri app (ALWAYS use this, not npm run dev)
npm run tauri dev

# Type check / build
npm run build
```

---

## Technical Notes

### Heading-Level Styling
When cursor is in a heading with assigned custom style:
- Style values come from `styleStore.headingCustomStyles.h1` (or h2, etc.)
- CSS variables applied to document for rendering
- Inline marks are cleared when style is assigned (CSS takes precedence)

### CSS Variables
Colors may be stored as CSS variables like `var(--tt-color-text-blue)`. Use `resolveCssVariable()` from editor-utils.ts to convert to hex for display in color pickers.

### What NOT To Do
1. Don't modify standard TipTap components - create heading-aware wrappers
2. Don't check styleStore directly in toolbar components - use editor-utils
3. Don't store resolved hex colors - store CSS variables, resolve at display time
4. Don't assume inline marks exist for headings with custom styles

---

## Recent Session Work (2026-02-03)

### Session 2: Dynamic Configuration Refactoring

**Major architectural change:** Removed ALL hardcoded lists from components. Everything is now dynamic.

#### What Changed

1. **styleStore.ts** - Added dynamic configuration system:
   - `FontOption`, `FontWeightOption`, `ColorOption` types
   - `FontCategories` interface for categorized fonts
   - `fontCategories`, `availableFonts`, `availableFontWeights`, `availableTextColors`, `availableHighlightColors`
   - Actions: `addFont`, `removeFont`, `reorderFonts`, etc.
   - Default values defined as constants outside store

2. **Toolbar Components** - Now read from store:
   - `font-family-dropdown.tsx` - Uses `fontCategories` and `availableFonts` from store
   - `font-weight-dropdown.tsx` - Uses `availableFontWeights` from store
   - `FontFamilyControl.tsx`, `FontWeightControl.tsx` - Same
   - `TextColorControl.tsx`, `HighlightControl.tsx` - Use dynamic color lists

3. **Hooks** - Updated to use store:
   - `useUnifiedFontFamily.ts` - Gets `availableFonts` from store for label lookup
   - `useUnifiedFontWeight.ts` - Gets `availableFontWeights` from store for label lookup

4. **Index Files** - Removed hardcoded exports:
   - `hooks/style-hooks/index.ts` - Removed `FONT_WEIGHTS`, `GOOGLE_FONTS` exports
   - `unified-toolbar/controls/index.ts` - Removed `TEXT_COLORS`, `HIGHLIGHT_COLORS` exports
   - `tiptap-ui-custom/index.tsx` - Removed `GOOGLE_FONTS`, `FONT_WEIGHTS` exports

5. **HeadingStyleSettings.tsx** - Already updated to use dynamic store

#### Why This Matters

Users can now:
- Add/remove/reorder fonts
- Create custom color palettes
- Modify font weight options
- All without touching component code

#### Files Modified

- `src/stores/styleStore.ts`
- `src/components/tiptap-ui-custom/font-family-dropdown/font-family-dropdown.tsx`
- `src/components/tiptap-ui-custom/font-weight-dropdown/font-weight-dropdown.tsx`
- `src/components/unified-toolbar/controls/FontFamilyControl.tsx`
- `src/components/unified-toolbar/controls/FontWeightControl.tsx`
- `src/components/unified-toolbar/controls/TextColorControl.tsx`
- `src/components/unified-toolbar/controls/HighlightControl.tsx`
- `src/hooks/style-hooks/useUnifiedFontFamily.ts`
- `src/hooks/style-hooks/useUnifiedFontWeight.ts`
- Various index.ts files

### Session 1: Heading-Aware Toolbar

Fixed toolbar to accurately reflect heading custom styles:

1. **Created HeadingAwareMarkButton** - Bold/Italic/Underline/Strike read from styleStore
2. **Created HeadingAwareColorPopover** - Color picker reads from styleStore
3. **Added resolveCssVariable()** - Converts CSS variables to hex for display
4. **Updated HeadingStyleSettings** - Context menu color pickers resolve CSS variables

---

## Build Status

```bash
npm run build    # ✓ Compiles successfully (2026-02-03)
```

---

*For detailed architecture, see `.planning/UNIFIED-STYLE-SYSTEM-ARCHITECTURE.md`*
