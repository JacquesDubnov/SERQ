# SERQ Session Handover

**Date:** 2026-02-06
**Branch:** `main` (uncommitted changes)
**Build status:** `npm run build` passes clean (tsc + vite)

---

## Project Overview

SERQ is a Tauri-based desktop rich text editor:
- **Frontend:** React + TypeScript + TipTap (ProseMirror)
- **Desktop:** Tauri 2.x (Rust backend, WebKit/WKWebView on macOS)
- **State:** Zustand
- **License:** TipTap Teams ($149/mo)

---

## What Was Done This Session (ALL COMPLETE EXCEPT TEXT SELECT BUG)

### 1. Gutter Min/Max Clamping (COMPLETE)

- `ColumnBlockView.tsx` -- mouseUp commit and live drag now clamp to dynamic max
- `column-block.ts` -- parseHTML clamps to MIN_GUTTER (10) floor only (no max at parse time since container width unknown)
- Removed fixed `MAX_GUTTER = 80` constant
- Added `computeMaxGutter(containerWidth, columnCount)` helper: `(containerWidth - N * 30) / (N - 1)`
- Added `containerWidth` field to `resizeState` ref, stored at drag start
- Columns cannot shrink below 30px during gutter resize

### 2. Block Drag INTO Column Content (COMPLETE)

- Added `columnContentDrop` state field to `BlockIndicatorState` in `types.ts`:
  ```
  { columnBlockPos, columnIndex, insertPos, indicatorTop, indicatorLeft, indicatorWidth } | null
  ```
- Detection in `plugin.ts` drag mousemove: when cursor is over a columnBlock but NOT in edge/gap zone, finds which `[data-column]` element contains cursor, walks child blocks to find nearest Y gap, resolves ProseMirror insert position
- `executeColumnContentDrop()` function: deletes source, adjusts position for deletion offset, inserts at column target position
- Wired into `executeMove()` as first priority check (before horizontal drop and normal vertical drop)
- Nesting prevention: won't drop a columnBlock into a column
- Existing horizontal drag indicator renders correctly (blockLeft/blockWidth set to column dimensions in state)

### 3. Between-Column Gap Drop Indicator Position (COMPLETE)

- Added `horizontalDropGapX: number | null` to `BlockIndicatorState`
- Gap detection computes midpoint: `((gapLeft + gapRight) / 2 - refRect.left) / zoom`
- `BlockIndicator.tsx` vertical indicator uses `horizontalDropGapX` when set, falls back to left/right edge calculation
- All cleanup paths clear the field

### 4. Divider Visibility (COMPLETE)

- `columns.css`: Divider `::after` opacity now `0` by default (was always `0.4`)
- Shows at `opacity: 0.4` on `.column-block-wrapper:hover`
- Shows at `opacity: 0.7` when `[data-focused]` (cursor/caret inside columnBlock)
- `opacity: 1` with active color on divider `:hover` or `[data-resizing]`
- `pointer-events` on `.column-divider-handle`: `none` by default, `auto` when wrapper is `:hover`, `[data-focused]`, or `[data-resizing]`

### 5. Text Selection During Block Drag (PARTIALLY FIXED -- BUG REMAINS)

This is the open bug. Text selection still flickers during drag, particularly when crossing element boundaries.

---

## OPEN BUG: Text Selection During Block Drag

### The Problem

When long-press-dragging a block, text gets selected as the cursor moves over content. The selection flickers -- it appears, then clears after crossing element boundaries. It does NOT affect drop functionality, but it's visually jarring.

### What Was Tried (5 approaches, none fully solved it)

**Attempt 1: CSS `user-select: none` via `.block-dragging` class**
- The class IS added in `startDrag()` and the CSS rule uses `!important` on `body.block-dragging *`
- DOESN'T WORK because the class is applied AFTER the browser/ProseMirror already entered selection-drag mode during the 400ms long press
- File: `src/components/BlockIndicator/BlockIndicator.css` lines 59-68

**Attempt 2: Inline `user-select: none` on body**
- Added `suppressTextSelection()` / `restoreTextSelection()` helpers that set `document.body.style.userSelect = 'none'` directly
- Called in `startDrag()`, cleared in `cancelDrag()` and `handleMouseUp()`
- PARTIALLY WORKS but selection still appears intermittently -- inline styles applied after selection started don't fully stop WebKit's active selection drag
- File: `plugin.ts` around line 95-105

**Attempt 3: `selectstart` event handler**
- Added `document.addEventListener('selectstart', handler)` that calls `preventDefault()` when `isDragging` is true
- Registered in plugin view setup, cleaned up in destroy
- DOESN'T FULLY WORK because `selectstart` only fires for NEW selections, not for extension of existing ones
- IMPORTANT: Initially also blocked during `isLongPressing` -- this BROKE cursor placement because ProseMirror creates TextSelection on normal clicks which fires `selectstart`. Had to revert to `isDragging` only.
- File: `plugin.ts` around line 1290

**Attempt 4: `removeAllRanges()` on every mousemove**
- Both editor-scoped and global mousemove handlers call `window.getSelection()?.removeAllRanges()` during drag
- DOESN'T WORK because ProseMirror re-applies its own selection from internal state on every view update, immediately recreating the selection after we clear it

**Attempt 5: Synthetic mouseup before startDrag**
- Dispatches a synthetic `MouseEvent('mouseup')` to `editorView.dom` right before `startDrag()` runs
- Idea: tells ProseMirror the text-selection gesture is over, so it stops extending on mousemove
- MOSTLY WORKS -- significantly reduced the flickering, but edge cases remain where selection still appears briefly
- File: `plugin.ts` around line 1166

### Root Cause Analysis

The fundamental problem has TWO layers:

**Layer 1 -- Browser native selection:** The mousedown in `handleMouseDown` is intentionally NOT prevented (`event.preventDefault()` is not called) because ProseMirror needs the mousedown to place the cursor. This means the browser enters its native selection-drag state. This state persists until a real mouseup.

**Layer 2 -- ProseMirror's selection:** ProseMirror has its OWN selection tracking separate from the browser. When it receives mousedown, it stores internal state (`lastMouseDown`) and on every subsequent mousemove, extends a TextSelection. ProseMirror then applies this to the editor state, which re-renders as a browser selection. This is INDEPENDENT of CSS `user-select`, `selectstart` events, and `removeAllRanges()`.

The synthetic mouseup partially fixes Layer 2 by telling ProseMirror the gesture is done. But edge cases remain -- possibly because ProseMirror's internal handlers process events in a specific order, or because the synthetic event doesn't fully clear all internal tracking state.

### Approaches NOT Yet Tried

1. **Prevent mousedown + manual cursor placement:** Call `event.preventDefault()` on the mousedown in `handleMouseDown`, then manually place the ProseMirror cursor via `editorView.dispatch()` with a `TextSelection`. This would prevent BOTH the browser and ProseMirror from entering selection-drag mode. The risk: getting cursor placement right for all cases (inside text, at block edges, etc.).

2. **`editorView.dom.contentEditable = 'false'` during drag:** Temporarily make the editor non-editable when drag starts, restore when drag ends. ContentEditable=false completely prevents selection. Risk: might cause ProseMirror to lose state or throw errors.

3. **Full-screen overlay with `pointer-events: all`:** The `dragOverlay` already exists with `pointer-events: none`. Changing to `pointer-events: all` would intercept ALL mouse events, preventing both browser and ProseMirror from seeing them. The drag logic would need to use `editorView.posAtCoords()` for position detection, but that internally uses `document.elementFromPoint()` which would return the overlay. Workaround: temporarily set overlay to `pointer-events: none` during `posAtCoords` calls.

4. **ProseMirror plugin with `handleDOMEvents`:** Create a ProseMirror plugin that intercepts `mousemove` during drag and returns `true` (preventing ProseMirror's default handling). This is the most architecturally clean approach -- it works within ProseMirror's own event system.

5. **`editorView.dispatch` with `setMeta` to flag drag state + custom selection handling in plugin `apply`:** Have the plugin's state `apply` method reject selection changes when a drag meta flag is set. This prevents ProseMirror from updating its selection during drag.

### Jacques's Instruction

Jacques says: "Think again. The solution should disable text select at the core, not paper over it. Consult specialists (CSS, React, TipTap/ProseMirror) to find the proper architectural solution."

The most promising architectural approach is #4 (ProseMirror plugin `handleDOMEvents`) because it stops the selection at ProseMirror's own event processing level -- before it ever creates a TextSelection. This is the "core" fix rather than fighting the effects downstream.

---

## Uncommitted Files Modified

| File | Changes |
|------|---------|
| `src/extensions/columns/ColumnBlockView.tsx` | Dynamic max gutter via `computeMaxGutter()`, `containerWidth` in resizeState, removed `MAX_GUTTER` constant |
| `src/extensions/columns/column-block.ts` | parseHTML gutter: min clamp only (removed max) |
| `src/extensions/columns/columns.css` | Divider visibility on hover/focus, pointer-events gating |
| `src/extensions/block-indicator/types.ts` | Added `columnContentDrop`, `horizontalDropGapX` to BlockIndicatorState |
| `src/extensions/block-indicator/state.ts` | Added defaults for new state fields |
| `src/extensions/block-indicator/plugin.ts` | Column content drop detection + execution, gap X tracking, selectstart handler, inline user-select, synthetic mouseup, suppressTextSelection helpers |
| `src/components/BlockIndicator/BlockIndicator.tsx` | Added new state field defaults, gap X indicator positioning |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/extensions/block-indicator/plugin.ts` | Block hover/select/drag -- ALL drag logic lives here (~1350 lines) |
| `src/extensions/block-indicator/types.ts` | `BlockIndicatorState` type definition |
| `src/extensions/block-indicator/state.ts` | Store, defaults, subscriptions, public API |
| `src/components/BlockIndicator/BlockIndicator.tsx` | React rendering of all indicators |
| `src/components/BlockIndicator/BlockIndicator.css` | Indicator + drag cursor styling (`.block-dragging` rules) |
| `src/extensions/columns/ColumnBlockView.tsx` | Column resize/gutter drag (React NodeView) |
| `src/extensions/columns/column-block.ts` | ColumnBlock TipTap node definition |
| `src/extensions/columns/columns.css` | All column styling including dividers |

---

## Critical Code Locations for Text Select Bug

- `plugin.ts ~1095-1100`: `handleMouseDown` -- mousedown NOT prevented (allows ProseMirror cursor placement)
- `plugin.ts ~1158-1190`: Long press timer callback -- synthetic mouseup + startDrag
- `plugin.ts ~95-105`: `suppressTextSelection()` / `restoreTextSelection()` helpers
- `plugin.ts ~109-165`: `startDrag()` and `cancelDrag()` -- where drag state begins/ends
- `plugin.ts ~1290-1296`: `handleSelectStart` -- selectstart prevention during isDragging
- `plugin.ts ~1225-1235`: `handleGlobalMouseMove` -- removeAllRanges during drag
- `BlockIndicator.css ~59-68`: `.block-dragging` CSS rules with user-select:none

---

## Commands

```bash
npm run tauri dev          # ALWAYS use this - desktop app
npm run build              # TypeScript check + Vite build
./scripts/read-log.sh      # Read debug log
./scripts/screenshot.sh    # Capture window
```

---

*Updated: 2026-02-06*
