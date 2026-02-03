# SERQ Session Handover

**Last Updated:** 2026-02-03

---

## Project Overview

SERQ is a Tauri-based desktop text editor using TipTap (ProseMirror). Currently in Phase 0 rebuild - migrating to native TipTap components while keeping custom styling architecture.

---

## Completed Work (This Session)

### Major Fixes to Style Assignment System

The style assignment system had multiple alignment issues between capture, storage, CSS application, and modal display. These have been comprehensively fixed:

#### 1. Style Capture (style-capture.ts) - REWRITTEN
- Now properly scans ALL text nodes in the block for marks (not just cursor position)
- Captures from textStyle marks, individual marks (bold/italic/etc), AND node attributes
- Added `rgbToHex()` converter - computed styles return rgb(), color picker needs hex
- Improved `parseNumericValue()` to handle various formats with units
- Added comprehensive debug logging

#### 2. Font Weight Handling - FIXED
- Added all weights from 100 (Thin) to 900 (Black) to the dropdown
- Fixed `applyHeadingCustomStyleCSS` - previously `bold: true` ALWAYS overwrote fontWeight to 700
- Now: If explicit fontWeight is set (e.g., 900), use it. Only default to 700 for bold if no explicit weight.

#### 3. Font Family Matching - FIXED
- Added `matchFontFamily()` function that does partial matching
- "Merriweather" now correctly matches "Merriweather, serif"
- Added `matchFontWeight()` to find closest weight if exact match not in dropdown

#### 4. Inline Marks Clearing on Assign - NEW
- When "Assign current style" is clicked, ALL headings of that level now have their inline marks cleared
- This is critical because inline styles (marks) override CSS variables
- Without this, assigned styles wouldn't visually apply to headings that had inline styling

#### 5. Modal Display - FIXED
- Skip initial mount to prevent double-emit
- Use matching functions for initial state
- Colors now display correctly (hex format)

### Other Fixes This Session

1. **Save/Cancel buttons** - Moved to bottom of context menu, appear after divider settings
2. **Field alignment** - Changed to CSS Grid for consistent right-edge alignment
3. **Auto-expand panels** - When opening context menu, if heading has customization, panels auto-expand
4. **Cursor visibility** - Added `caret-color` to all heading levels in editor.css
5. **Clear Formatting** - Now also clears all heading custom styles (including dividers)
6. **Divider setting row** - Fixed duplicate CSS rules, using grid layout

---

## Known Limitation: Toolbar Display

**The toolbar does NOT reflect heading-level styles.**

This is an architectural limitation:
- Toolbar components read from TipTap's editor.state (marks on current selection)
- Our heading styles are stored in styleStore and applied via CSS variables
- These are two separate systems

**What this means:**
- When cursor is in an H1 styled with Merriweather/Black/Red, the toolbar shows:
  - Font: Inter (default, not Merriweather)
  - Weight: Bold or Regular (not Black)
  - No color highlight

**To fix this would require:**
- Modifying each toolbar hook (useFontFamily, useFontSize, useFontWeight, etc.)
- Check if cursor is in a heading
- Read corresponding style from styleStore
- Use those values instead of editor.state

This is significant work and could be a future enhancement.

---

## Build Status

```bash
npm run build  # Compiles successfully
npm run tauri dev  # Use for testing
```

---

## Architecture Notes

### Style Flow (After Fixes)

1. **User styles paragraph** with toolbar (creates marks on text)
2. **User clicks "Assign current style"** on H1 context menu
3. **Style captured** from marks + node.attrs + computed styles
4. **Inline marks cleared** from ALL H1 headings in document
5. **CSS variables applied** via `applyHeadingCustomStyleCSS()`
6. **All H1s now use CSS variables** (since inline marks are gone)

### Key Files

| File | Role |
|------|------|
| `style-capture.ts` | Captures style from current block |
| `styleStore.ts` | Stores styles, applies CSS variables |
| `heading-style-settings.tsx` | Modal for customizing styles |
| `heading-context-menu.tsx` | Context menu, handles assign/reset |
| `editor.css` | CSS variable consumption for headings |

### CSS Variable Chain

```
--h1-font-size → --font-size-h1 → 2.25rem
--h1-font-weight → 700 (default)
--h1-letter-spacing → inherit
--h1-line-height → --line-height-heading → 1.2
--h1-color → --color-text-primary
--h1-background-color → transparent
--h1-text-decoration → none
--h1-font-style → normal
```

---

## Technical Notes

- **Tauri App**: Always use `npm run tauri dev` not `npm run dev`
- **TipTap Teams License**: Full access to Pro components
- **Color Format**: Computed styles return `rgb()`, color picker needs hex - `rgbToHex()` handles conversion
- **Font Weight Values**: 100=Thin, 200=Extralight, 300=Light, 400=Regular, 500=Medium, 600=Semibold, 700=Bold, 800=Extrabold, 900=Black
- **Inline vs CSS**: Inline marks (textStyle, bold, etc.) ALWAYS override CSS variables - must clear marks for CSS to take effect

---

## Testing Checklist

When testing style assignment:
1. Style a paragraph with font, size, weight, color, letter-spacing, etc.
2. Right-click H1 button → "Assign current style"
3. Check console for `[StyleCapture]` logs showing what was captured
4. Verify ALL H1s in document change visually
5. Right-click H1 → "Customize style" → verify modal shows correct values
6. Note: Toolbar will NOT reflect heading styles (known limitation)
