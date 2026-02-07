# SERQ Session Handover

**Date:** 2026-02-08 (night session)
**Branch:** `main`
**Last commit:** `de5322a` -- NO new commits (all changes uncommitted)
**Next session:** Fix block drag-and-drop at non-100% zoom

---

## MANDATORY: Read These Files First

1. **This file** -- full context of what was tried, what works, what doesn't
2. **`.claude/PROJECT-DEBUG-LOG.md`** -- all bug states

---

## Project Overview

SERQ: Tauri 2 desktop rich text editor. React + TypeScript + TipTap (ProseMirror) + Zustand.

---

## ZOOM IS FIXED

### The Three-Part Solution

The block indicator zoom issue had THREE separate coordinate problems, each requiring a different fix:

#### 1. CSS Positioning (indicator placement)
**Problem:** `getBoundingClientRect()` deltas were used for CSS `position: absolute; top/left` values. With the WebKit CSS zoom bug, both sides return un-zoomed values, but CSS absolute positioning inside the zoom wrapper operates in content space. The values happened to match (diagnostic confirmed offset and rect give identical numbers), so this wasn't actually the root cause -- but offset-based is cleaner.

**Fix:** `getOffsetRelativeTo(element, ancestor)` walks the `offsetParent` chain to compute content-space positions. Used for all CSS positioning values (`top`, `left`, `width`, `height` on the indicator).

#### 2. Block Finding (which block is the mouse over)
**Problem:** `event.clientY` (screen space) was compared against `getBoundingClientRect().top/bottom` (un-zoomed due to WebKit bug). At zoom 1.5, a block at content y=500 has `rect.top=500` but the mouse at that position has `clientY=750`. The comparison picked the WRONG block.

**Fix:** Replaced the entire block-finding loop with `document.elementFromPoint(event.clientX, event.clientY)` which works in screen space and correctly handles CSS zoom. Falls back to `posAtCoords` for padding/gap areas.

#### 3. Bounds Checking (when to show/hide indicator)
**Problem:** `handleGlobalMouseMove` compared `event.clientY` against `getBoundingClientRect().bottom + 50`. At high zoom, the visual bottom extends far beyond the un-zoomed rect value, so the indicator was hidden for the bottom ~4 paragraphs.

**Fix:** Replaced rect-based bounds check with `elementFromPoint` + `contains()` checks against the zoom wrapper, ancestor, and editor DOM.

### Key Insight: WebKit CSS Zoom Bug

`isCSSZoomCoordinateFixed()` returns `false` in this WKWebView. This means:
- `getBoundingClientRect()` returns UN-ZOOMED values for elements inside a CSS zoom container
- `event.clientX/Y` is in SCREEN space (zoomed)
- `elementFromPoint()` works correctly in screen space (handles zoom)
- `posAtCoords()` works correctly for caret placement
- `offsetTop/offsetLeft/offsetWidth/offsetHeight` return content-space values
- CSS `position: absolute; top: X` uses content-space values

The bug is tracked as WebKit #300474 and was fixed in Safari Technology Preview 232, but NOT in production WKWebView.

---

## CURRENT STATE: What Works

- Block indicator at ALL zoom levels (80-150%) -- FIXED this session
- Caret placement at high zoom (120%+) -- verified by Jacques
- Text selection at 100% zoom
- Editor rendering at all zoom levels
- Zoom slider: 80-150% in 5% steps

## WHAT'S NEXT: Broken

1. **Block drag-and-drop at non-100% zoom** -- Jacques's next priority
   - The drag indicator positioning uses offset-based values (should be correct)
   - But `findDropPosition()` and the drag's `posAtCoords` calls might have coordinate issues
   - Edge zone detection uses `getBoundingClientRect` for mouse comparison (needs elementFromPoint)
   - The `clipIndicatorToCurrentPage` pagination clipping still uses getBoundingClientRect vs mouse coords

2. **Caret at low zoom (<100%)** -- less investigated, Jacques reports issues

---

## FILES STATE (Uncommitted)

### Files CREATED (new)
- `src/lib/zoom/prosemirror-zoom-patch.ts` -- no-op module (CSS zoom doesn't need patching)

### Files DELETED
- `src/extensions/zoom-coordinate-fix.ts` -- abandoned

### Files MODIFIED

- **`src/extensions/block-indicator/dom-utils.ts`** -- MAJOR CHANGES:
  - Added `getPositionAncestor()` -- finds `.editor-content-wrapper`
  - Added `getOffsetRelativeTo()` -- walks offsetParent chain for content-space coordinates
  - Removed `getEffectiveZoom()` and `screenToUnzoomed()` (unused, approach didn't work)
  - Updated doc comment explaining the three-part coordinate strategy

- **`src/extensions/block-indicator/plugin.ts`** -- MAJOR CHANGES:
  - `updateBlockRect()`: uses `getOffsetRelativeTo` for positioning instead of rect deltas
  - `findGapsInNode()`: uses `getOffsetRelativeTo` for gap positions
  - `updateSelectedBlocksState()`: uses `getOffsetRelativeTo` for selected block positions
  - `startDrag()`: uses `getOffsetRelativeTo` for initial drop indicator
  - `handleMouseMove` (hover): uses `elementFromPoint` + `posAtDOM` for block finding
  - `handleMouseMove` (drag): uses `getOffsetRelativeTo` for indicator positioning
  - `handleMouseMove` (bounds check): uses `elementFromPoint` + `contains()`
  - `handleGlobalMouseMove`: uses `elementFromPoint` + `contains()` instead of rect comparison
  - `executeMove` animation: uses `getOffsetRelativeTo` for landing position
  - All stale `transform: scale()` comments updated
  - All diagnostic code removed

- **`src/components/BlockIndicator/BlockIndicator.tsx`**:
  - Removed `[BI-DIAG]` diagnostic log
  - Updated comments (no more transform: scale references)
  - `v()` function is identity (no zoom conversion needed)
  - Removed `usePresentationStore` import (no zoom factor needed)

- **`src/components/Editor/EditorCore.tsx`**:
  - Removed zoom plugin extension
  - Removed `Extension` and `createZoomPlugin` imports

- **`src/components/Editor/EditorWrapper.tsx`**:
  - Removed zoom division from click-anywhere handler

- **`src/App.tsx`**:
  - CSS zoom wrapper instead of transform: scale wrapper
  - Zoom slider: 80-150% in 5% steps

- **`src/lib/zoom/prosemirror-zoom-patch.ts`**:
  - Removed `[ZOOM]` diagnostic log
  - `installZoomPatch()` is pure no-op

---

## APPROACHES TRIED AND RESULTS (This Session)

### 1. offsetTop/offsetLeft chain for CSS positioning
**WORKS** but wasn't the root cause. Both offset and rect approaches give identical values (confirmed by diagnostic). The positioning was always correct -- the block FINDING was wrong.

### 2. screenToUnzoomed coordinate conversion
**FAILED.** Assumed `wrapperRect.top` from getBoundingClientRect is in screen space. Diagnostic proved the wrapper's OWN rect is also un-zoomed (width=720 at zoom 1.5, should be 1080).

### 3. elementFromPoint for block finding
**WORKS.** `elementFromPoint` handles CSS zoom correctly in screen space. Combined with `posAtDOM` to get PM positions. Fallback to `posAtCoords` for padding areas.

### 4. elementFromPoint for bounds checking
**WORKS.** Replaces getBoundingClientRect comparisons with containment checks.

---

## KEY TECHNICAL INSIGHTS

### The WebKit CSS Zoom Bug Affects EVERYTHING Inside the Zoom Container
- Every element's `getBoundingClientRect()` returns un-zoomed values
- The zoom wrapper's OWN `getBoundingClientRect()` is also un-zoomed
- `event.clientX/Y` is in screen space (NOT affected by the bug)
- `elementFromPoint(x, y)` handles zoom correctly
- `posAtCoords({left, top})` handles zoom correctly for caret placement
- `offsetTop/offsetLeft` are in content space (same as CSS absolute positioning)

### Never Compare event.clientX/Y Against getBoundingClientRect
This is THE rule for this WKWebView. Use `elementFromPoint` + `contains()` for hit testing, and offset chain for positioning.

---

## COMMANDS

```bash
npm run tauri dev          # Desktop app (ALWAYS use this)
npm run build              # TypeScript + Vite build
./scripts/read-log.sh      # Debug log
cat ~/.serq-debug.log      # Direct log read
./scripts/screenshot.sh    # Capture SERQ window
```

---

*Updated: 2026-02-08 -- CSS zoom block indicator FIXED. Three-part solution: offset positioning + elementFromPoint block finding + elementFromPoint bounds checking.*
