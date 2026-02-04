# SERQ Session Handover

**Date:** 2026-02-04
**Branch:** feature/unified-style-system
**Last Commit:** f386e95 - feat: implement multi-block selection with Command+click

---

## Project Overview

SERQ is a Tauri-based desktop text editor built with React, TypeScript, and TipTap (ProseMirror). Focus is on Notion-style block editing with custom animations and interactions.

---

## What's Complete

### 1. Block Indicator System
- Animated vertical line tracks hovered block
- Frame mode (Command held) shows border around block
- Hides when user starts typing
- Reappears on mouse movement

### 2. Block Drag-and-Drop
- Long-press (400ms) activates drag
- Source text fades via white overlay
- Horizontal drop indicator shows target position
- Two-stage animation on drop: shrink to dot, grow to line

### 3. Multi-Block Selection (Latest)
- **Command+click**: Toggle single block selection
- **Command+Shift+click**: Range select/deselect
- **Click anywhere**: Deselect all
- Contiguous blocks grouped into single unified frame
- Visual: 1px stroke, 70% opacity (hover), 100% (selected)

---

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/extensions/block-indicator.ts` | ProseMirror plugin - state, events, selection logic |
| `src/components/BlockIndicator/BlockIndicator.tsx` | React rendering, contiguous grouping |
| `src/components/BlockIndicator/BlockIndicator.css` | Styles, transitions, animations |
| `.claude/BLOCK-SELECTION-IMPLEMENTATION.md` | Detailed reference for selection feature |

### State Pattern

```
Module-level state (selectedBlockPositions Set, commandHeld, etc.)
    ↓ notifyListeners()
React subscribes via useEffect
    ↓ setState()
React re-renders with data-* attributes
    ↓
CSS handles transitions/animations
```

### BlockIndicatorState Interface

```typescript
interface BlockIndicatorState {
  visible: boolean
  top: number
  height: number
  blockLeft: number
  blockWidth: number
  commandHeld: boolean              // Changed from shiftHeld
  isLongPressing: boolean
  isDragging: boolean
  dropIndicatorTop: number | null
  sourceOverlay: { left, top, width, height } | null
  isAnimating: boolean
  indicatorTransition: { ... } | null
  dropAnimation: 'none' | 'shrinking' | 'growing'
  selectedBlocks: Array<{ pos, top, height, blockLeft, blockWidth }>
  lastSelectedPos: number | null
}
```

---

## Technical Learnings

### Selection System
- Track positions in Set<number> at module level
- Group contiguous blocks (24px gap threshold) for unified frame
- Range select: iterate doc.forEach, add/delete positions in range
- Global mousedown (outside editor) clears selection

### Key Events
- `handleKeyDown/Up`: Track Meta key (Command on Mac)
- `handleEditorKeyDown`: Hide indicator on typing (ignore modifier keys!)
- `handleMouseDown`: Selection logic with metaKey/shiftKey checks
- `handleGlobalMouseDown`: Deselect on click outside editor

### CSS Transitions
- Selection frames: `transition: none` (instant appear/disappear)
- Hover frame: animated with existing transition system
- Drop animation: staged via `dropAnimation` state ('shrinking' → 'growing')

---

## Commands

```bash
npm run tauri dev          # Start desktop app (NOT npm run dev!)
npm run build              # TypeScript check
./scripts/read-log.sh      # Read ~/.serq-debug.log
./scripts/read-log.sh clear # Clear before testing
./scripts/screenshot.sh    # Capture window
```

---

## Recent Commits

```
f386e95 feat: implement multi-block selection with Command+click
6b4b91c feat: hide block indicator when typing, show on mouse move
a997399 feat: implement block drag-and-drop with custom animations
d424ae2 BASE VERSION - Our last good version
```

---

## What's Next

Ready for new features. Potential:
- Actions on selected blocks (delete, duplicate, style changes)
- Drag multiple selected blocks
- Slash command menu
- Block type conversion
- More block types (images, code, etc.)

---

## Reminders

- **Always `npm run tauri dev`** - Desktop app, not browser
- **TipTap Teams license** - Full Pro component access
- **No emojis in UI** - Use SVG icons
- **Debug bridge** - Console → `~/.serq-debug.log`

---

*Session completed: 2026-02-04*
