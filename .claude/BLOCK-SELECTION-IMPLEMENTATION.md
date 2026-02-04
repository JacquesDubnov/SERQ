# Block Selection Implementation Reference

## Overview

Multi-block selection using Command+click with visual feedback via blue frame indicators.

---

## Behaviors

| Action | Behavior |
|--------|----------|
| Command + hover | Animated frame follows mouse |
| Command + click | Toggle single block selection |
| Command + Shift + click (unselected) | Select range from last selected to clicked |
| Command + Shift + click (selected) | Deselect range from last selected to clicked |
| Click anywhere without Command | Deselect ALL selected blocks |

---

## Architecture

### State Model

```typescript
// Module-level tracking (block-indicator.ts)
let selectedBlockPositions = new Set<number>()  // ProseMirror positions
let lastSelectedPos: number | null = null       // For range selection
let commandHeld = false                         // Track Command key

// State interface additions
interface BlockIndicatorState {
  // ... existing fields ...
  commandHeld: boolean
  selectedBlocks: Array<{
    pos: number
    top: number
    height: number
    blockLeft: number
    blockWidth: number
  }>
  lastSelectedPos: number | null
}
```

### Key Functions

**Selection helpers** (inside plugin view):
- `selectBlockRange(fromPos, toPos)` - Add range to selection
- `deselectBlockRange(fromPos, toPos)` - Remove range from selection
- `updateSelectedBlocksState()` - Sync positions to React state
- `validateSelectedPositions()` - Clean up invalid positions after doc changes
- `clearSelections()` - Module-level helper to clear all

**Event handlers**:
- `handleKeyDown/handleKeyUp` - Track Meta (Command) key
- `handleMouseDown` - Selection logic with Command/Shift modifiers
- `handleGlobalMouseDown` - Click outside editor to deselect
- `handleEditorKeyDown` - Hide on typing (ignores modifier keys)

---

## Visual Rendering (React)

### Contiguous Block Grouping

Blocks are grouped if visually adjacent (gap <= 24px):

```typescript
const groupedSelections = (() => {
  // Sort by top position
  const sorted = [...state.selectedBlocks].sort((a, b) => a.top - b.top)

  // Group contiguous blocks
  for each block:
    if (gap between current group bottom and block top <= 24px):
      extend current group
    else:
      start new group

  return groups  // Each group renders as ONE frame
})()
```

### Render Order

1. Source overlay (during drag)
2. Selection frames (grouped, static, no animation)
3. Hover indicator (when current block not selected)

---

## CSS Styling

```css
/* Line indicator */
.block-indicator-line {
  width: 1px;                    /* 50% of original 2px */
  opacity: 0.7;                  /* Non-selected */
}

/* Frame mode (Command held or selected) */
.block-indicator-line[data-frame="true"] {
  border: 1px solid var(--block-indicator-color);
  border-radius: 4px;
}

/* Selected - full opacity, no transitions */
.block-indicator-line[data-selected="true"] {
  opacity: 1;
  transition: none !important;  /* Instant appear/disappear */
}
```

---

## Edge Cases Handled

1. **Document changes while blocks selected** - `validateSelectedPositions()` in plugin update
2. **Block deleted while selected** - Removed from Set during validation
3. **Scroll while selected** - `handleScroll` calls `updateSelectedBlocksState()`
4. **Range with no previous selection** - Treated as single select
5. **Modifier keys hiding indicator** - `handleEditorKeyDown` ignores Meta/Shift/Control/Alt
6. **Click inside vs outside editor** - Global handler checks `editorView.dom.contains()`

---

## Files Modified

| File | Changes |
|------|---------|
| `src/extensions/block-indicator.ts` | Selection state, event handlers, helpers |
| `src/components/BlockIndicator/BlockIndicator.tsx` | Grouped rendering, new state fields |
| `src/components/BlockIndicator/BlockIndicator.css` | Selection styles, reduced thickness |

---

## Testing Checklist

- [ ] Command + click toggles single block
- [ ] Command + click multiple blocks = multiple frames
- [ ] Command + Shift + click selects range
- [ ] Command + Shift + click on selected deselects range
- [ ] Contiguous selection = single unified frame
- [ ] Non-contiguous selection = separate frames
- [ ] Click anywhere without Command = all deselected
- [ ] Typing hides hover indicator
- [ ] Command key shows frame on hover
- [ ] Scroll updates selection positions
- [ ] Drag-and-drop still works (without Command)

---

*Created: 2026-02-04*
