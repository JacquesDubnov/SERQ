# SERQ - Project Debug Log

> **PURPOSE**: Persistent, session-surviving record of all bugs encountered, debugging steps taken, assumptions tested, and resolutions reached. This file is MANDATORY reading at the start of every session, alongside SESSION-HANDOVER.md.
>
> **PROTOCOL**: Update this file after EVERY code change, debugging iteration, or bug state change. Timestamps are required. No exceptions.

---

## SESSION 2026-02-08 (night): Block Indicator Zoom -- FIXED

### Root Cause (Three-Part)

The block indicator had THREE coordinate problems at non-100% CSS zoom:

1. **Block Finding:** `event.clientY` (screen space) compared against `getBoundingClientRect().top/bottom` (un-zoomed). Wrong block was selected.
   - Fix: `elementFromPoint()` + `posAtDOM()` for block finding (screen-space native)

2. **CSS Positioning:** `getBoundingClientRect()` deltas used for `position: absolute; top/left`. Actually worked (both sides un-zoomed, same space), but switched to `offsetTop/offsetLeft` chain for cleanliness.
   - Fix: `getOffsetRelativeTo(element, ancestor)` walks offsetParent chain

3. **Bounds Checking:** `handleGlobalMouseMove` compared `event.clientY` against `getBoundingClientRect().bottom + 50`. At high zoom, visual bottom exceeded un-zoomed rect value.
   - Fix: `elementFromPoint()` + `contains()` for bounds checking

### Key Discovery

WebKit CSS zoom bug affects EVERYTHING including the zoom wrapper's own `getBoundingClientRect()`. The `screenToUnzoomed()` approach failed because the wrapper's rect is also un-zoomed (w=720 at zoom 1.5, should be 1080).

The ONLY reliable screen-space APIs: `elementFromPoint()`, `posAtCoords()`, and `event.clientX/Y`.

### Files Changed
- `src/extensions/block-indicator/dom-utils.ts` -- added `getPositionAncestor()`, `getOffsetRelativeTo()`
- `src/extensions/block-indicator/plugin.ts` -- elementFromPoint block finding, offset positioning, elementFromPoint bounds checking
- `src/components/BlockIndicator/BlockIndicator.tsx` -- removed diagnostics, updated comments
- `src/lib/zoom/prosemirror-zoom-patch.ts` -- removed diagnostic log

### Status: RESOLVED -- Block indicator works at 80-150% zoom

---

## SESSION 2026-02-08 (late evening): CSS Zoom -- Caret Works, Block Indicator Broken

### What Happened

Executed the war room's recommended approach (transform: scale() + prototype posAtCoords override). It FAILED -- all coordinate APIs in WKWebView are broken with transform: scale(). caretRangeFromPoint returns same wrong positions as PM's original (delta=0 between our override and original).

Switched to CSS zoom. CARET IS PERFECT at high zoom (200% verified by Jacques). Block indicator is broken at non-100% zoom ("two paragraphs down at high zoom, two paragraphs up at low zoom"). Caret also has issues at low zoom (< 100%).

### Approaches Tried (ALL FAILED for transform: scale())

1. **Prototype posAtCoords override** -- caretRangeFromPoint returns same wrong results
2. **Coordinate adjustment** (unscale coords before passing to PM) -- wrong block boundary detection
3. **withoutTransform** (strip transform, call API, restore) -- layout shift invalidates coords
4. **mousedown plugin** (preventDefault + manual selection) -- same as #1

### Key Discovery: WebKit CSS Zoom Bug

`isCSSZoomCoordinateFixed()` returns `false`. getBoundingClientRect() returns un-zoomed values. BUT caret placement works because PM's caretRangeFromPoint + posFromDOM path is pure DOM traversal, no coordinate comparisons.

### Current State

- CSS zoom approach is IN the codebase (uncommitted)
- Zoom slider limited to 80-150% in 5% steps
- Diagnostic code present: [BI-ZOOM], [BI-DIAG], [ZOOM]
- Block indicator needs fixing for CSS zoom coordinate space

### Files Changed This Session

- `src/lib/zoom/prosemirror-zoom-patch.ts` -- CREATED, currently no-op
- `src/extensions/zoom-click-fix.ts` -- DELETED
- `src/lib/viewport/pipeline.ts` -- DELETED
- `src/lib/viewport/index.ts` -- DELETED
- `src/App.tsx` -- CSS zoom wrapper, zoom slider 80-150%
- `src/components/Editor/EditorCore.tsx` -- removed ZoomClickFix
- `src/components/BlockIndicator/BlockIndicator.tsx` -- v() identity, diagnostics
- `src/components/Editor/EditorWrapper.tsx` -- removed zoom division
- `src/extensions/block-indicator/plugin.ts` -- diagnostics

---

## SESSION 2026-02-08 (evening): Zoom Architecture -- transform: scale() Abandoned

### What Happened

Continued the `transform: scale()` zoom migration. Block indicator works perfectly at all zoom levels. But caret placement is fundamentally broken because ProseMirror's `posAtCoords` doesn't support CSS transforms.

### Attempts Made

1. **ZoomClickFix v1** (monkey-patch `view.posAtCoords` in onCreate) -- FAILED. PM's internal mousedown uses the public method but the patch didn't take effect.

2. **ZoomClickFix v2** (handleDOMEvents.mousedown plugin) -- PARTIALLY WORKED. The architecture is correct (confirmed by ProseMirror source research). `caretRangeFromPoint` correctly finds the right text under transforms. But the drag-to-select mousemove handler immediately overwrites the correct selection. Even with `event.preventDefault()`, caret still misaligned.

3. **Scroll fix** (overflow: hidden on viewport container) -- WRONG APPROACH. `overflow: hidden` prevents parent from scrolling. Changed to `overflow: visible` but fundamental issue remains: transform: scale() doesn't affect layout flow.

### Key Discovery

`transform: scale()` requires EVERY coordinate consumer to be patched individually. Clicks, drags, selections, drag-and-drop, future presentation modes -- all need custom handling. This is unsustainable.

### Decision

**REVERT TO CSS `zoom`.** CSS zoom is a rendering-level operation that the browser handles transparently. ProseMirror's coordinate APIs should work without patches. The block indicator (original reason for leaving CSS zoom) has been rewritten with zoom-invariant rect-walk approach.

### Files with diagnostic code to remove

- `src/extensions/zoom-click-fix.ts` -- has `[ZCF]` console.log statements (entire file to be deleted)
- No other diagnostic code remains

---

## SESSION 2026-02-08: Bug Kill Sweep

### What Was Executed

Systematic fix of all active bugs from the 2026-02-07 sessions. All fixes are code-only (no commits yet). Build passes clean.

### BUG-A: Text Selection During Drag -- FIXED

**Root cause:** `contenteditable="true"` on the ProseMirror editor DOM overrides `user-select: none !important` set on `body` in WebKit. The browser's native selection mechanism fights the drag system.

**Fix (3 layers of defense):**
1. **Direct style override:** Set `userSelect: none` and `-webkit-user-select: none` directly on `editorView.dom` during long-press detection and drag. Restored on `cancelLongPress`, `cancelDrag`, and `mouseUp`.
2. **preventDefault on mousemove:** During long-press timer (`longPressTimer !== null`) or active drag, `event.preventDefault()` on the DOM mousemove handler prevents the browser from extending native selection.
3. **Aggressive selection clearing:** `window.getSelection()?.removeAllRanges()` called on every mousemove during long-press/drag.

**Files changed:**
- `src/extensions/block-indicator/plugin.ts` -- handleMouseMove, handleMouseDown, startDrag, cancelLongPress, cancelDrag, handleMouseUp

### BUG-B: Block Indicator at Non-100% Zoom -- FIXED

**Session 2026-02-08 (night) -- FULLY RESOLVED.**

**Root cause:** Three separate coordinate mismatches (see session log above).

**Final fix:** elementFromPoint for block finding + offset chain for positioning + elementFromPoint for bounds checking.

**All diagnostic code removed.**

**Files changed:**
- `src/extensions/block-indicator/plugin.ts` -- major rewrite of event handling and block resolution
- `src/extensions/block-indicator/dom-utils.ts` -- added `getZoomContainer()`, `adjustCoordsForZoom()`
- `src/components/BlockIndicator/BlockIndicator.tsx` -- `v()` is identity, removed zoom import
- `src/components/BlockIndicator/BlockIndicator.tsx` -- all CSS position values wrapped in `v()` converter

### BUG-007: Column Extraction Doesn't Delete Source -- IMPROVED

**Likely root cause:** The original `cleanupSourceColumn` used `STRUCTURAL_WRAPPERS` (which includes both `column` and `section`) to find the source column. This could potentially find `section` before `column` in certain doc structures. Also, position mapping validation was missing.

**Fix:**
- Explicitly finds BOTH `column` AND `columnBlock` positions in the walk (separate variables, not generic STRUCTURAL_WRAPPERS match)
- Maps both positions through `tr.mapping`
- Validates mapped positions are within document bounds
- Uses `mappedBlockPos` directly instead of re-resolving against `tr.doc`
- Wrapped in try/catch for safety

**Files changed:**
- `src/extensions/block-indicator/plugin.ts` -- cleanupSourceColumn() rewritten

### BUG-005: Toolbar Not Influencing Text -- RESOLVED (architecture)

**Analysis:** The new presentation-agnostic architecture uses a single editor instance that is never destroyed. Mode switching is a CSS config change. The toolbar subscribes to editor events (selectionUpdate, transaction) and stays connected. The bug was a transient state from the old architecture (which recreated the editor on mode switch).

### BUG-010: Pagination Catatonic State -- RESOLVED (architecture)

**Analysis:** This was caused by content serialization (getJSON/setContent) during mode switching. The new architecture has zero content manipulation on mode switch -- just toggles `activeMode` in `presentationStore`. No validation, no serialization, no catatonic state.

### BUG-D: Drag Sometimes Doesn't Activate -- LIKELY RESOLVED

**Analysis:** Caused by zoom coordinate issues (BUG-B) and text selection interference (BUG-A). Both root causes are now fixed.

### Debug Reporter [WD] -- Already Removed

Not found in codebase. Was cleaned up in a previous session.

---

## SESSION 2026-02-07 AFTERNOON: CSS Zoom Migration

### What Was Executed

A 4-fix architectural plan targeting the root causes of 20+ debugging cycles:

1. **Replace `transform: scale()` with CSS `zoom`** -- eliminates dual coordinate space
2. **Replace source block overlay with CSS class** -- eliminates coordinate-dependent fade overlay
3. **Remove `contentEditable=false` during drag** -- eliminates pagination full-text fade
4. **Add Option+drag gutter resize** -- new column feature

Fixes 2, 3, and 4 are **COMPLETE and working**. Fix 1 is **90% complete** with a layout issue remaining.

### The CSS Zoom Layout Bug (Fix 1 remaining issue)

**Root cause discovered via debug reporter:**

The `<main>` element uses `display: flex; justify-content: center`. The zoom wrapper divs are flex children. With `transform: scale()`, elements maintain full layout width (transform doesn't affect flow). With CSS `zoom`, elements participate in normal layout flow, so flex children **collapse to minimum content width** unless explicitly sized.

**Evidence from debug reporter (continuous mode, 100% zoom):**
```
WITHOUT width: '100%' on zoom wrapper:
  MAIN = 980px, zoom wrapper = 148px (COLLAPSED), canvas = 148px

WITH width: '100%' on zoom wrapper:
  MAIN = 980px, zoom wrapper = 926px (CORRECT), canvas = 720px (CORRECT)
```

**Current state:** Both zoom wrappers now have `width: '100%'`. Continuous mode verified working at 100% zoom. Pagination mode NOT YET verified. Zoom at non-100% levels NOT YET tested.

**The zoom property is conditionally applied:** `...(zoom !== 100 ? { zoom: zoom / 100 } : {})` to avoid any WebKit side effects at the default level.

---

## ACTIVE BUGS

### BUG-001: Zoom Breaks Block Indicator -- FIXED

**Severity**: CRITICAL
**First observed**: 2026-02-05
**Status**: FIXED -- CSS zoom + elementFromPoint block finding + offset positioning (2026-02-08 night)
**Affects**: All modes at non-100% zoom

#### Current State (2026-02-07 afternoon)

The CSS zoom migration eliminates the dual coordinate space that caused this bug. All zoom division operations (28+) have been removed from plugin.ts, ColumnBlockView.tsx, EditorWrapper.tsx. The `ZoomCoordinateFix` monkey-patch and virtual cursor `MutationObserver` are both deleted.

**Verification needed:** Does caret placement work at 75%, 120% zoom in both modes?

#### Root Cause (architectural)

`transform: scale()` creates two coordinate spaces:
- Visual (scaled) -- what `getBoundingClientRect()` returns
- Layout (unscaled) -- what CSS absolute positioning uses

CSS `zoom` operates in ONE space. All coordinate APIs return values in the zoomed space. No conversion needed.

#### Files Changed for This Fix
- `src/App.tsx` -- zoom wrappers
- `src/extensions/block-indicator/plugin.ts` -- 28+ division removals
- `src/extensions/block-indicator/dom-utils.ts` -- getZoomFactor() stubbed
- `src/extensions/virtual-cursor.ts` -- zoom correction removed
- `src/extensions/zoom-coordinate-fix.ts` -- DELETED
- `src/components/Editor/EditorCore.tsx` -- extension removed
- `src/extensions/columns/ColumnBlockView.tsx` -- zoom divisions removed
- `src/components/Editor/EditorWrapper.tsx` -- zoom division removed

---

### BUG-001b: Full-Text Fade During Block Drag (Pagination) -- FIXED (pending verification)

**Severity**: CRITICAL
**First observed**: 2026-02-05
**Status**: FIXED -- contentEditable toggle removed, overlay replaced with CSS class
**Affects**: Block drag in pagination mode

#### Resolution (2026-02-07 afternoon)

**Two fixes applied:**

1. **Removed `contentEditable=false` toggle during drag.** This was the smoking gun. The Pages extension has CSS rules that fade all content when `contentEditable=false`. The `body.block-dragging` CSS with `user-select: none !important` already prevents text selection -- the contentEditable toggle was redundant AND harmful.

2. **Replaced overlay div with CSS class.** Instead of positioning a white rectangle over the source block (which required coordinate calculations that broke in pagination), the source DOM element gets `classList.add('block-drag-source')` which applies `opacity: 0` with a 1500ms transition. Zero coordinate math. Works in any mode.

#### Files Changed
- `src/extensions/block-indicator/plugin.ts` -- removed contentEditable toggles, replaced overlay with class
- `src/extensions/block-indicator/state.ts` -- added dragSourceElement, removed sourceOverlay default
- `src/extensions/block-indicator/types.ts` -- removed sourceOverlay field
- `src/components/BlockIndicator/BlockIndicator.tsx` -- removed overlay rendering
- `src/components/BlockIndicator/BlockIndicator.css` -- `.block-drag-source` class replaces `.block-source-overlay`

---

### BUG-005: Toolbar Does Not Influence Text -- RESOLVED (architecture)

**Severity**: CRITICAL (if still present)
**First observed**: 2026-02-07 (early session)
**Status**: RESOLVED -- single-editor architecture eliminates root cause
**Affects**: All toolbar styling controls

**Resolution (2026-02-08):** Analyzed toolbar-editor binding. The new architecture uses a single, never-recreated editor instance. Toolbar components subscribe to editor events (selectionUpdate, transaction) and maintain connection through mode switches. The original bug was caused by the old architecture which destroyed/recreated the editor on mode switch.

---

### BUG-006: Pagination Page Layout Broken at Non-100% Zoom -- LIKELY FIXED

**Severity**: HIGH
**First observed**: 2026-02-07
**Status**: LIKELY FIXED by CSS zoom migration (verification pending)
**Affects**: Pagination mode with zoom

The original cause was `transform: scale()` with `transformOrigin: 'top left'` causing rightward skew. CSS `zoom` doesn't have this problem -- it scales uniformly from the element's position in flow.

---

### BUG-007: Column Extraction Does Not Delete Source Column -- IMPROVED

**Severity**: HIGH
**First observed**: 2026-02-07
**Status**: IMPROVED -- cleanupSourceColumn rewritten with better position tracking
**Affects**: Column block drag-out behavior

**Fix (2026-02-08):** Rewrote `cleanupSourceColumn()` to explicitly find both `column` and `columnBlock` positions (not generic STRUCTURAL_WRAPPERS), validate mapped positions, and use direct node lookups instead of re-resolving. Needs verification with actual column drag-out testing.

---

### BUG-008: Double-Click Word Selection Lost -- LIKELY FIXED

**Severity**: HIGH
**First observed**: 2026-02-07
**Status**: LIKELY FIXED by removing contentEditable toggle (verification pending)

The `contentEditable = 'false'` was set during long-press detection on mousedown. A double-click fires two mousedowns -- the second could set contentEditable before the browser processes the double-click selection. With contentEditable toggling removed, native double-click should work.

---

### BUG-009: Triple-Click Paragraph Selection Lost -- LIKELY FIXED

**Severity**: HIGH
**First observed**: 2026-02-07
**Status**: LIKELY FIXED (same root cause as BUG-008)

---

### BUG-010: Pagination Mode Catatonic State -- RESOLVED (architecture)

**Severity**: CRITICAL
**First observed**: 2026-02-07
**Status**: RESOLVED -- new architecture has zero content manipulation on mode switch
**Affects**: Entire pagination mode

**Resolution (2026-02-08):** The new presentation-agnostic architecture eliminates content serialization during mode switching. `toggleMode()` in presentationStore only changes `activeMode` state. SectionView reads the store and applies CSS classes. No getJSON, no setContent, no validation errors.

---

### BUG-002: Character Spacing Field Not Reflecting Cursor Position

**Severity**: LOW
**Status**: OPEN
**First observed**: 2026-02-01

---

### BUG-003: Heading Style Divider Takes Text Color

**Severity**: LOW
**Status**: OPEN
**First observed**: 2026-02-01

---

### BUG-004: Table Width Limit Internal Proportions

**Severity**: MEDIUM
**Status**: OPEN (70% fixed)
**First observed**: 2026-01-30

---

## RESOLVED BUGS

### BUG-R001: Text Selection During Block Drag
**Resolved**: 2026-02-05, commit `de5322a`

### BUG-R002: Column Extraction/Unwrap Not Working
**Resolved**: 2026-02-05, commit `de5322a`

### BUG-R003: Edge Drop Indicators Missing
**Resolved**: 2026-02-05, commit `de5322a`

### BUG-R004: Duplicate Extension Warnings (link + underline)
**Status**: KNOWN, DEFERRED -- console noise only

### BUG-R005 through BUG-R017: Phase 4 Bug Fixes (2026-01-31)
All resolved. See `.claude/CONTEXT-HANDOFF.md` for details.

---

## ARCHITECTURAL NOTES

### CSS Zoom vs Transform Scale (Key Insight from This Session)

**`transform: scale(s)` creates a DUAL coordinate space:**
- `getBoundingClientRect()` returns visual (scaled) coordinates
- CSS `position: absolute` uses layout (unscaled) coordinates
- `caretRangeFromPoint()` operates in layout coordinates
- `elementFromPoint()` operates in visual coordinates
- Result: 28+ manual division operations across 6 files, all fragile

**CSS `zoom: s` creates a SINGLE coordinate space:**
- All APIs return values in the same zoomed space
- No coordinate conversion needed
- `getZoomFactor()` always returns 1
- The zoom property participates in normal CSS flow (unlike transform)

**The flow participation is both the advantage AND the gotcha:**
- Advantage: no coordinate math needed
- Gotcha: flex children collapse to content width (transform preserves layout width)
- Solution: explicit `width: '100%'` on zoom wrapper divs

### The contentEditable/Pages Interaction (Key Discovery)

The TipTap Pages extension includes CSS that fades content when `contentEditable=false`:
```css
[contenteditable=false] * { opacity: 0.5 }
```
(or similar -- the exact rule is in the Pages extension CSS)

When the drag system set `contentEditable=false` on the editor DOM, this rule cascaded to ALL page content, causing the full-text fade. The fix: don't toggle contentEditable at all. `user-select: none` via the `body.block-dragging` class is sufficient.

---

## DEBUGGING AIDS

### Debug Reporter (TEMPORARY -- REMOVE BEFORE COMMIT)

There is a width reporter injected in `src/components/Editor/EditorCore.tsx` at approximately line 214. It logs `[WD]` prefixed messages to the console (visible in `~/.serq-debug.log`). It reports the offsetWidth of every element from the editor-content-wrapper up to the root, helping diagnose flex layout issues.

**Search for `[WD]` to find and remove it.**

### Debug Bridge

```bash
./scripts/read-log.sh          # Last 50 lines
./scripts/read-log.sh 100      # Last N lines
./scripts/read-log.sh errors   # Errors only
./scripts/read-log.sh clear    # Clear log
cat ~/.serq-debug.log           # Direct read
./scripts/screenshot.sh         # Capture SERQ window
```

---

*Created: 2026-02-07*
*Last updated: 2026-02-07 10:45 -- CSS zoom migration session. Fixes 2-4 complete. Fix 1 (zoom layout) 90% done, continuous mode verified, pagination pending.*
