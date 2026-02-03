# Unified Style System Architecture

**Last Updated:** 2026-02-03
**Status:** Implemented and Working

---

## The Problem We Solved

SERQ has a heading customization feature where users can right-click H1-H6 buttons and assign custom styles (font, size, weight, colors, bold/italic/etc.) to heading types. The challenge: **make the toolbar accurately reflect these assigned styles when the cursor is in a styled heading**.

### The Core Issue

TipTap's toolbar components read styles from two places:
1. **Inline marks** (textStyle, bold, italic, etc.) - applied directly to text
2. **Node attributes** - stored on the block node

But our heading custom styles are stored in a **third place**:
3. **Zustand styleStore** - `headingCustomStyles.h1`, `headingCustomStyles.h2`, etc.

The toolbar was showing wrong values because it only checked TipTap's marks/attributes, not our styleStore.

---

## The Architecture

### ONE SOURCE OF TRUTH Principle

**CRITICAL: For any given block, there must be ONE source of truth.**

| Block Type | Source of Truth | TipTap Marks |
|------------|-----------------|--------------|
| Paragraph | TipTap marks | Active - used for rendering and UI |
| Heading WITHOUT custom style | TipTap marks + defaults | Active - used for rendering and UI |
| Heading WITH custom style | **styleStore ONLY** | CLEARED - CSS variables handle rendering |

When a heading has a custom style assigned:
1. styleStore is DEFINITIVE
2. TipTap marks do NOT exist (cleared on assignment)
3. UI reads ONLY from styleStore (no fallback)
4. CSS variables render the heading

### Data Flow

```
User assigns style to H1 (via context menu)
         ↓
1. captureBlockStyle() captures from TipTap marks
         ↓
2. Clear ALL inline marks from H1 text
         ↓
3. styleStore.assignStyleToHeading(1, style)
         ↓
4. CSS variables applied to document
   (--h1-font-family, --h1-font-weight, etc.)
         ↓
5. Heading renders via CSS variables

When cursor moves to H1:
         ↓
Toolbar components query editor-utils.ts
         ↓
getTextStyleAtCursor() checks:
  - Is this a heading?
  - Does it have a custom style in styleStore?
         ↓
If CUSTOM STYLE EXISTS:
  → Return ONLY styleStore values (NO TipTap fallback)
If NO CUSTOM STYLE:
  → Return TipTap marks + defaults
```

### Key Files

| File | Purpose |
|------|---------|
| `src/stores/styleStore.ts` | Zustand store holding `headingCustomStyles` |
| `src/lib/editor-utils.ts` | **THE BRIDGE** - All toolbar components read through this |
| `src/components/unified-toolbar/UnifiedToolbar.tsx` | The single toolbar |
| `src/components/tiptap-ui-custom/heading-aware-mark-button/` | Heading-aware Bold/Italic/Underline/Strike |
| `src/components/tiptap-ui-custom/heading-aware-color-popover/` | Heading-aware color picker |
| `src/components/tiptap-ui-custom/heading-context-menu/` | Right-click menu for heading buttons |

---

## editor-utils.ts - The Central Bridge

This file is **the single source of truth** for getting styles at cursor position. Every toolbar component should use these functions.

### Key Functions

```typescript
// Get block info (type, level, attrs)
getBlockInfoAtCursor(editor: Editor): { type: string; level?: number; attrs: Record<string, unknown> }

// Get text style (font family, size, weight, line height, letter spacing, color)
// HEADING-AWARE: Checks styleStore for headings with custom styles
getTextStyleAtCursor(editor: Editor): Record<string, unknown>

// Get mark states (bold, italic, underline, strikethrough)
// HEADING-AWARE: Checks styleStore for headings with custom styles
getMarkStatesAtCursor(editor: Editor): { bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean }

// Get text color - resolves CSS variables
// HEADING-AWARE: Checks styleStore for headings with custom styles
getTextColorAtCursor(editor: Editor): string | null

// Get highlight/background color
// HEADING-AWARE: Checks styleStore for headings with custom styles
getHighlightColorAtCursor(editor: Editor): string | null

// Get block attributes (textAlign, etc.)
// HEADING-AWARE: Merges custom heading styles from styleStore
getBlockAttrsAtCursor(editor: Editor): Record<string, unknown>

// Resolve CSS variable to computed value
// e.g., "var(--tt-color-text-blue)" → "#0066ff"
resolveCssVariable(value: string | null | undefined): string | null
```

### Priority Order (Lowest to Highest)

1. **Paragraph defaults** (Inter, 16px, 400 weight)
2. **Heading-specific defaults** (if in heading - larger size, bolder weight)
3. **Custom heading styles from styleStore** (if assigned)
4. **Explicit inline marks from editor** (user manually applied bold, etc.)

---

## Component Architecture

### Font Dropdowns (Already Heading-Aware)

These components use `getTextStyleAtCursor()` from editor-utils:
- `FontFamilyDropdown`
- `FontSizeDropdown`
- `FontWeightDropdown`
- `LineHeightDropdown`
- `LetterSpacingDropdown`

They automatically get heading-aware behavior because editor-utils does the work.

### Mark Buttons (Required Custom Component)

The standard `MarkButton` uses `editor.isActive(type)` which only checks TipTap marks.

**Solution:** Created `HeadingAwareMarkButton` that:
```typescript
function getHeadingAwareMarkState(editor: Editor | null, type: Mark): boolean {
  const blockInfo = getBlockInfoAtCursor(editor);

  if (blockInfo.type === 'heading' && blockInfo.level) {
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);
    if (customStyle) {
      switch (type) {
        case 'bold': return customStyle.bold;
        case 'italic': return customStyle.italic;
        case 'underline': return customStyle.underline;
        case 'strike': return customStyle.strikethrough;
      }
    }
  }

  return editor.isActive(type); // Fallback to TipTap
}
```

### Color Popover (Required Custom Component)

The standard `ColorTextPopover` uses `getActiveMarkAttrs(editor, 'textStyle')` which only checks TipTap marks.

**Solution:** Created `HeadingAwareColorPopover` that:
```typescript
function getHeadingAwareTextColor(editor: Editor | null): string | undefined {
  const blockInfo = getBlockInfoAtCursor(editor);

  if (blockInfo.type === 'heading' && blockInfo.level) {
    const customStyle = useStyleStore.getState().getHeadingCustomStyle(level);
    if (customStyle?.textColor) {
      return resolveCssVariable(customStyle.textColor) || undefined;
    }
  }

  const attrs = getActiveMarkAttrs(editor, 'textStyle') || {};
  return attrs.color || undefined;
}
```

---

## CSS Variable Handling

### The Problem

When a user picks "Blue" text color from the color picker, we store:
```typescript
textColor: "var(--tt-color-text-blue)"
```

This CSS variable renders correctly in the editor, but the color picker can't display it (expects hex like `#0066ff`).

### The Solution

The `resolveCssVariable()` function:
```typescript
export function resolveCssVariable(value: string | null | undefined): string | null {
  if (!value) return null;

  if (value.startsWith('var(')) {
    const varName = value.slice(4, -1).trim();
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return resolved || value;
  }
  return value;
}
```

Used in:
- `HeadingAwareColorPopover` - shows correct color in toolbar button
- `HeadingStyleSettings` - shows correct color in context menu color picker

---

## Toolbar Structure

```tsx
<UnifiedToolbar editor={editor}>
  {/* Row 1 */}
  <UndoRedoButton />
  <FontFamilyDropdown />      {/* Uses getTextStyleAtCursor - heading-aware */}
  <FontSizeDropdown />        {/* Uses getTextStyleAtCursor - heading-aware */}
  <FontWeightDropdown />      {/* Uses getTextStyleAtCursor - heading-aware */}

  <HeadingAwareMarkButton type="bold" />      {/* Custom - heading-aware */}
  <HeadingAwareMarkButton type="italic" />    {/* Custom - heading-aware */}
  <HeadingAwareMarkButton type="underline" /> {/* Custom - heading-aware */}
  <HeadingAwareMarkButton type="strike" />    {/* Custom - heading-aware */}
  <MarkButton type="code" />                  {/* Standard - no heading style for code */}

  <HeadingAwareColorPopover />  {/* Custom - heading-aware */}
  <LinkPopover />
  <ClearFormattingButton />

  {/* Row 2 */}
  <HeadingToggleButtons />      {/* With context menu for style assignment */}
  <ListDropdownMenu />
  <BlockquoteButton />
  <TextAlignButton />
  <LineHeightDropdown />        {/* Uses getTextStyleAtCursor - heading-aware */}
  <LetterSpacingDropdown />     {/* Uses getTextStyleAtCursor - heading-aware */}
  <SpacingBeforeDropdown />
  <SpacingAfterDropdown />
</UnifiedToolbar>
```

---

## HeadingCustomStyle Type

```typescript
interface HeadingCustomStyle {
  // Typography
  fontFamily: string | null;
  fontSize: number | null;        // in px
  fontWeight: number | null;      // 100-900
  letterSpacing: number | null;   // in px
  lineHeight: number | null;      // multiplier (1.2, 1.5, etc.)

  // Marks
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;

  // Colors (may be CSS variables or hex)
  textColor: string | null;
  backgroundColor: string | null;

  // Divider (separate feature)
  divider: HeadingDividerConfig | null;
}
```

---

## Debugging Checklist

When toolbar and modal show DIFFERENT values for the same heading:

**This is a ONE SOURCE OF TRUTH violation!**

1. **Check if it's a custom-styled heading** - Does `styleStore.headingCustomStyles.h1` exist?
2. **If YES (custom style):**
   - Toolbar AND modal should BOTH read from styleStore
   - TipTap marks should NOT exist on the text
   - Check editor-utils.ts is returning styleStore values (not falling back to marks)
3. **If NO (no custom style):**
   - Toolbar reads from TipTap marks
   - Modal reads from... wait, modal only shows for headings being customized

When capture doesn't capture values correctly:

1. **Check [StyleCapture] logs** - What marks are being found?
2. **Check if marks exist** - TipTap may not have the marks you expect
3. **Check getAttributes fallback** - `editor.getAttributes('textStyle')` should catch most things

### Console Logs

**editor-utils.ts** - For headings with custom styles:
```
[EditorUtils] Heading with custom style - H1 | Result: {...}
```

**editor-utils.ts** - For other blocks:
```
[EditorUtils] Block: paragraph undefined | Defaults: {...} | Explicit: {...} | Result: {...}
```

**style-capture.ts** - During capture:
```
[StyleCapture] Starting capture for node: heading | content size: 20
[StyleCapture] Found mark: textStyle | attrs: {"fontFamily":"IBM Plex Mono, monospace"}
[StyleCapture] Captured fontFamily from textStyle mark: IBM Plex Mono, monospace
[StyleCapture] Block style captured: {...}
```

**styleStore.ts** - During assignment:
```
[styleStore.assignStyleToHeading] level: 1 key: h1
[styleStore.assignStyleToHeading] style being saved: {...}
```

---

## What NOT To Do

1. **Don't modify standard TipTap components** - Create heading-aware wrappers instead
2. **Don't check styleStore directly in toolbar components** - Always go through editor-utils
3. **Don't store resolved hex colors** - Store CSS variables, resolve at display time
4. **Don't assume inline marks exist for headings with custom styles** - They are CLEARED
5. **Don't fall back to TipTap marks for headings with custom styles** - styleStore is DEFINITIVE
6. **Don't have multiple sources of truth** - For each block type, ONE source is authoritative

---

## Future Considerations

### Style Templates
The context menu has a TODO for "style templates" - predefined styles like "Modern", "Classic", etc. These would be stored in preferences and selectable from the heading context menu.

### Document Defaults
Ability to set default heading styles at the document level, persisted in the .serq file format.

### Undo/Redo
Heading style changes integrate with TipTap's undo/redo through the Zustand store's history (if implemented) or by re-applying CSS variables.

---

## Files Created/Modified in This Session

### New Files
- `src/components/tiptap-ui-custom/heading-aware-mark-button/heading-aware-mark-button.tsx`
- `src/components/tiptap-ui-custom/heading-aware-mark-button/index.ts`
- `src/components/tiptap-ui-custom/heading-aware-color-popover/heading-aware-color-popover.tsx`
- `src/components/tiptap-ui-custom/heading-aware-color-popover/index.ts`

### Modified Files
- `src/lib/editor-utils.ts` - Added `resolveCssVariable()`, already had heading-aware functions
- `src/components/tiptap-ui-custom/heading-context-menu/heading-style-settings.tsx` - Uses `resolveCssVariable()` for color display
- `src/components/unified-toolbar/UnifiedToolbar.tsx` - Uses heading-aware components

---

*This document captures the complete architecture of the Unified Style System. Reference it whenever working on toolbar display issues or heading style features.*
