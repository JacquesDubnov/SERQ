# SERQ Viewport Transform Architecture Plan

**Date:** 2026-02-08
**Scope:** Replace CSS `zoom` with `transform: scale()` + a proper coordinate abstraction layer
**Prerequisite reading:** SESSION-HANDOVER.md, PROJECT-DEBUG-LOG.md

---

## THE PROBLEM

CSS `zoom` in WebKit/WKWebView (Tauri's rendering engine) creates two incompatible
coordinate spaces: `event.clientX/Y` is in viewport space, `getBoundingClientRect()`
is in zoom-local space. Three sessions and eight agent reviews proved this is an
unfixed WebKit bug (#77998, #30034), not a code problem. Every ad-hoc coordinate
fix introduces a new breakage elsewhere.

**Eliminated alternatives:**
- **CSS zoom** -- WebKit bugs are OPEN and UNFIXED. Dead path.
- **Tauri webview zoom** (`setZoom`) -- Zooms EVERYTHING (toolbar, footer), causes
  layout reflow (text rewraps at zoom). Fatal for paginated/canvas modes.

---

## THE SOLUTION: transform: scale() + Camera Abstraction

Use `transform: scale(z)` on the editor container. This keeps the DOM layout at 1x
and applies visual scaling. All coordinate APIs (getBoundingClientRect, event.clientX/Y,
elementFromPoint) return values in the SAME viewport space. The only conversion needed
is between viewport (screen) space and document (content) space -- a simple, well-defined
operation.

### Why This Is Different From Last Time

The first time `transform: scale()` was used, it was applied without a coordinate
abstraction. Every file that touched coordinates had ad-hoc `/ zoom` scattered through
it (28+ operations across 6 files). When any one was wrong, debugging was impossible.

This time: ONE module, TWO functions, ZERO ad-hoc conversions anywhere else.

---

## ARCHITECTURE

```
APP SHELL (toolbar, sidebar, footer -- NEVER transformed)
  |
  MAIN (overflow: auto, scrollable viewport)
    |
    VIEWPORT CONTAINER (position: relative) <-- camera origin
      |
      TRANSFORM WRAPPER (transform: scale(z); transform-origin: top center;
      |                   width: calc(100% / z))
      |
      |  EDITOR WRAPPER (position: relative, minHeight)
      |    |
      |    inner div (position: relative, zIndex: 1)
      |      |
      |      .editor-content-wrapper (position: relative)
      |        |-- BlockIndicator (position: absolute -- document space)
      |        |-- EditorContent (.tiptap)
      |              |
      |              SECTION NodeView
      |                |
      |                paragraphs, headings, columns, etc.
      |
      BLOCK INDICATOR GUTTER (optional, future -- viewport space sibling)
```

### Critical Layout Detail

`transform: scale(z)` does NOT affect layout flow. A 720px-wide editor at 2x scale
visually occupies 1440px but its layout box is still 720px. The browser won't give
it more space.

Solution: `width: calc(100% / z)` on the transform wrapper. At zoom 2x, the wrapper
gets `width: 50%` of the viewport, which when scaled 2x, visually fills 100%.
This is the exact pattern used by tldraw and Excalidraw.

For fixed-width modes (A4, Letter, normal/narrow/wide canvas widths), the width
stays fixed and the wrapper is just centered with `margin: 0 auto` as before.

---

## COORDINATE SPACES

```
SCREEN SPACE (viewport pixels)         DOCUMENT SPACE (content pixels)
---------------------------------      ---------------------------------
event.clientX/Y                        CSS top/left inside transform wrapper
elementFromPoint() input               Block positions in layout
getBoundingClientRect() output         The "real" content coordinates
window.scrollX/Y
```

### Conversion

```typescript
// The ONE conversion module: src/lib/viewport/pipeline.ts

interface Camera {
  zoom: number     // 1.0 = 100%, 2.0 = 200%
  panX: number     // 0 for now, used by infinite canvas later
  panY: number     // 0 for now, used by infinite canvas later
  originX: number  // viewport container's screen X (getBoundingClientRect)
  originY: number  // viewport container's screen Y (getBoundingClientRect)
}

function screenToDoc(sx: number, sy: number, camera: Camera): { x: number; y: number } {
  return {
    x: (sx - camera.originX) / camera.zoom + camera.panX,
    y: (sy - camera.originY) / camera.zoom + camera.panY,
  }
}

function docToScreen(dx: number, dy: number, camera: Camera): { x: number; y: number } {
  return {
    x: (dx - camera.panX) * camera.zoom + camera.originX,
    y: (dy - camera.panY) * camera.zoom + camera.originY,
  }
}

// For comparing getBoundingClientRect() values with mouse events:
// getBoundingClientRect() returns SCREEN-space values (after transform)
// event.clientX/Y is ALSO in screen space
// So BOTH are directly comparable -- NO conversion needed for hit testing!
//
// The conversion is only needed when:
// 1. Setting CSS top/left positions from screen-space measurements
// 2. Calculating document-space offsets for the ProseMirror coordinate system
```

### The Critical Insight

With `transform: scale()`, **getBoundingClientRect() and event.clientX/Y are in the
SAME space** (screen/viewport space). This means:

- Block indicator hit testing: compare `event.clientY` directly against `rect.top/bottom`
- Drop zone detection: compare `event.clientX` directly against `rect.left/right`
- Pagination zone detection: compare `event.clientY` directly against zone boundaries

The ONLY place conversion is needed is when setting CSS `top`/`left` on absolutely
positioned elements inside the transform wrapper (like BlockIndicator), because CSS
properties operate in document space, not screen space.

**For BlockIndicator specifically:** It uses `refRect.top` subtracted from `blockRect.top`.
Both are from `getBoundingClientRect()`, so both are in screen space. The DIFF is
zoom-invariant. This means `top = blockRect.top - refRect.top` gives the correct
screen-space offset. But CSS `top` inside the transform needs document-space offset.
So: `cssTop = (blockRect.top - refRect.top) / zoom`.

Actually -- let me reconsider. With `transform: scale()`:
- The parent `.editor-content-wrapper` has its OWN coordinate space (document space)
- CSS `position: absolute; top: X` is in the parent's document space
- `getBoundingClientRect()` returns screen space (after transform)
- So `blockRect.top - refRect.top` gives a screen-space delta
- To get the document-space delta for CSS `top`: divide by zoom
- This is the ONLY division needed, and it happens in ONE place (BlockIndicator.tsx)

### ProseMirror posAtCoords

`posAtCoords()` uses `caretRangeFromPoint()` internally. With `transform: scale()`,
`caretRangeFromPoint` receives screen-space coordinates and the browser's hit testing
accounts for the transform. This is a CRITICAL difference from CSS `zoom` where
`caretRangeFromPoint` was broken (WebKit bug #30034).

However, ProseMirror's maintainer has stated "scaling transforms are not currently
supported." The safe approach: intercept when zoom != 100% using `elementFromPoint()`
+ `view.posAtDOM()` (which DO work with transforms). Keep `posAtCoords()` as the
fast path at 100%.

---

## FUTURE-PROOFING: MODE COMPATIBILITY

This camera abstraction handles ALL five planned modes:

| Mode | camera.zoom | camera.panX/Y | Layout Engine |
|------|-------------|---------------|---------------|
| Continuous | variable | 0, 0 | Native flow + scroll |
| Paginated | variable | 0, 0 | Fixed pages + overflow |
| Infinite Canvas | variable | variable | Absolute positioning |
| Outline | 1.0 | 0, 0 | Native tree layout |
| Slideshow | fit-to-slide | 0, 0 | Single slide viewport |

For infinite canvas (future):
- Transform becomes: `transform: scale(z) translate(-panX, -panY)`
- Native scroll is replaced by pan (wheel/drag events update camera)
- Sections get absolute positions from `PresentationConfig.canvas.sectionFrames`
- The `screenToDoc` / `docToScreen` functions handle it with the same formula

For paginated with variable section heights (future):
- Each section renders with its own dimensions from `PresentationConfig`
- Zoom still applies uniformly via transform
- Section layout is a CSS concern (fixed-size divs with overflow hidden)
- Camera abstraction unchanged

---

## IMPLEMENTATION STEPS

### Step 1: Create viewport pipeline module

**New file:** `src/lib/viewport/pipeline.ts`

Contains:
- `Camera` interface
- `screenToDoc()` pure function
- `docToScreen()` pure function
- `getCamera()` function that reads zoom from `presentationStore` and
  origin from a viewport container DOM element

**New file:** `src/lib/viewport/index.ts`
- Re-exports pipeline

### Step 2: Replace CSS zoom with transform: scale in App.tsx

**File:** `src/App.tsx` (line ~387-392)

Change:
```tsx
// BEFORE (CSS zoom)
<div style={{
  margin: '0 auto',
  width: (!isPaginated && contentWidth === 'full') ? '100%' : 'fit-content',
  ...(zoom !== 100 ? { zoom: zoom / 100 } : {}),
}}>

// AFTER (transform scale)
<div
  data-viewport-container
  style={{ position: 'relative' }}
>
  <div style={{
    margin: '0 auto',
    width: getTransformWidth(zoom, contentWidth, isPaginated),
    transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
    transformOrigin: 'top center',
  }}>
```

Where `getTransformWidth` returns:
- For `full` width: `calc(100% / ${zoom / 100})` (fills viewport at any zoom)
- For fixed widths: the fixed width unchanged (A4=794px, normal=720px, etc.)

### Step 3: Fix BlockIndicator positioning

**File:** `src/components/BlockIndicator/BlockIndicator.tsx`

The `v()` helper (currently identity) needs to divide by zoom for CSS positioning:
```tsx
const zoom = usePresentationStore(s => s.zoom) / 100
const v = (px: number) => px / zoom
```

This is the ONLY place zoom division happens for positioning.

### Step 4: Clean up dom-utils.ts

**File:** `src/extensions/block-indicator/dom-utils.ts`

Remove:
- `getZoomFactor()` -- no longer needed
- `getZoomContainer()` -- no longer needed
- `adjustCoordsForZoom()` -- no longer needed (screen space is unified)

### Step 5: Fix plugin.ts hover resolution

**File:** `src/extensions/block-indicator/plugin.ts`

The current `handleMouseMove` hover resolution walks all blocks comparing
`adjCoords.top` (zoom-adjusted) against `getBoundingClientRect()`. With
`transform: scale()`, `event.clientY` and `getBoundingClientRect().top` are in the
SAME space. So:

- Remove `adjCoords` / `adjustCoordsForZoom` call
- Compare `event.clientY` directly against `rect.top` / `rect.bottom`
- Remove all `adjustCoordsForZoom` calls from drag code paths too

The block-walk approach (lines 1107-1170) is actually good architecture -- it avoids
the broken `posAtCoords` and `elementFromPoint` entirely. Keep it, but use raw
`event.clientY` instead of `adjCoords.top`.

### Step 6: Fix plugin.ts drag code

In the drag handler (lines 958-1104):
- `findDropPosition` uses `adjustCoordsForZoom` + `posAtCoords` -- remove the
  adjustment, keep posAtCoords (it works with transforms at 100%, and the
  block-walk is the safe fallback)
- `elementFromPoint(event.clientX, event.clientY)` on line 1002 -- this now
  works correctly (screen space in, screen space DOM lookup)
- Column gap detection (lines 1047-1058) -- `event.clientX` vs `colRect.right/left`
  are now in the same space, works correctly
- Edge zone detection (line 1030) -- `event.clientX - topRect.left` is now a
  screen-space delta, correct

### Step 7: Fix EditorWrapper.tsx

**File:** `src/components/Editor/EditorWrapper.tsx` (line 42)

```tsx
// BEFORE (broken: mixes viewport clientY with zoom-local rect)
const adjustedClickY = e.clientY - wrapperRect.top

// AFTER (both in screen space now, but need document space for line calc)
const screenDelta = e.clientY - wrapperRect.top
const adjustedClickY = screenDelta / (zoom / 100)
```

The `PARAGRAPH_HEIGHT = 42` is a document-space value, so the click Y needs to
be in document space too.

### Step 8: Fix pagination.ts

**File:** `src/extensions/block-indicator/pagination.ts`

`isPointInForbiddenZone(clientY)` -- the `clientY` and zone boundaries (from
`getBoundingClientRect()`) are now both in screen space. No change needed.

`clipIndicatorToCurrentPage(mouseY, blockTop, blockBottom)` -- all three
parameters come from `getBoundingClientRect()` or `event.clientY`. All screen space.
No change needed.

### Step 9: Remove diagnostic artifacts

Search and remove:
- Any remaining `_diagT`, `[BI-X]`, `[BI-OK]`, `[BI-WALK]`, `[BI-RESULT]` logs
- The `[WD]` width reporter in EditorCore.tsx
- Any dead `getZoomFactor` / `adjustCoordsForZoom` imports

### Step 10: Verify and test

1. Build passes clean (`npm run build`)
2. Test at 100% -- everything works as before
3. Test at 50% -- block indicator tracks correctly, drag works, pagination zones work
4. Test at 200% -- same
5. Test mode switching (continuous <-> paginated) at non-100% zoom
6. Test click-anywhere cursor at non-100% zoom
7. Test column drag-into at non-100% zoom

---

## RISK ASSESSMENT

### Known risk: posAtCoords with transforms

ProseMirror's maintainer says transforms aren't supported. The current code already
avoids `posAtCoords` for hover resolution (uses block-walk instead). It's only used
in `findDropPosition` for drag. If it breaks:

**Mitigation:** Replace the `posAtCoords` call in `findDropPosition` with
`elementFromPoint()` + `view.posAtDOM()`, same pattern the hover handler used
before but now `elementFromPoint` actually works correctly with transforms.

### Known risk: layout width

`transform: scale()` doesn't affect layout flow. The `width: calc(100% / z)` trick
works for full-width mode. For fixed-width modes (A4=794px, normal=720px), the
element keeps its natural width and the transform just scales it visually. The
parent `MAIN` with `overflow: auto` handles any overflow.

### Known risk: scroll position

Scrolling the `MAIN` element scrolls the viewport. With transforms, the scrollable
height is the LAYOUT height (1x), not the visual height (z*x). This means at 2x zoom,
you need to scroll further to reach the bottom. This is standard behavior and matches
user expectation (more zoomed = more scrolling).

Wait -- actually this is wrong. The layout height stays at 1x, but visually the
content is 2x tall. The scrollbar would only scroll through the 1x layout, cutting
off the bottom half at 2x zoom.

**Fix:** Set `height: calc(100% * z)` on a spacer element or use `min-height` on
the transform wrapper to ensure the scrollable area accounts for the visual size.
OR: set `transform-origin: top center` and apply `margin-bottom: calc(100% * (z - 1))`
to the transform wrapper.

Actually the cleanest approach: wrap the transform div in a container that has
`min-height: calc(...)` or simply let the content determine height and add padding.

Let me think about this more carefully:

```
MAIN (overflow: auto, height: viewport height)
  SPACER (height: content-height * zoom, invisible)
  TRANSFORM WRAPPER (position: relative or absolute, transform: scale(z))
    ... content at 1x layout ...
```

No, that's overcomplicating it. The standard approach is:

```css
.transform-wrapper {
  transform: scale(var(--zoom));
  transform-origin: top center;
  /* Make the parent's scrollable area match the visual size */
  margin-bottom: calc((var(--zoom) - 1) * 100%);
}
```

This works because `margin-bottom` is computed on the element's layout height.
At zoom 2x with 1000px content, margin-bottom = 1 * 100% = 1000px, total
scrollable = 2000px, matching the visual height of 2000px.

For fixed-width content that's narrower than viewport: the horizontal scrollbar
should not appear because the visual width = fixed-width * zoom, and if
fixed-width < viewport, then visual-width < viewport * zoom... which could
exceed viewport at high zoom. So `overflow-x: auto` on MAIN is correct.

### Known risk: text sharpness

`transform: scale()` can cause subpixel rendering artifacts at non-integer scales.
At 150% (1.5x), text may appear slightly blurry compared to CSS zoom. At 200% (2x),
it should be pixel-perfect.

**Mitigation:** Apply `will-change: transform` to hint the browser to use a
high-quality rendering path. In practice, modern WebKit on macOS Retina displays
renders transforms sharply. Can revisit with `image-rendering: crisp-edges` if
needed.

---

## FILE CHANGE SUMMARY

| File | Action | Description |
|------|--------|-------------|
| `src/lib/viewport/pipeline.ts` | NEW | Camera, screenToDoc, docToScreen |
| `src/lib/viewport/index.ts` | NEW | Re-exports |
| `src/App.tsx` | EDIT | Replace CSS zoom with transform: scale |
| `src/components/BlockIndicator/BlockIndicator.tsx` | EDIT | v() divides by zoom |
| `src/extensions/block-indicator/dom-utils.ts` | EDIT | Remove zoom utilities |
| `src/extensions/block-indicator/plugin.ts` | EDIT | Remove adjustCoordsForZoom, use raw event coords |
| `src/components/Editor/EditorWrapper.tsx` | EDIT | Fix click-anywhere with zoom division |
| `src/extensions/block-indicator/pagination.ts` | REVIEW | Should work unchanged |

---

## SUCCESS CRITERIA

1. Block indicator appears on correct block at 50%, 100%, 150%, 200% zoom
2. Block drag-and-drop works at all zoom levels
3. Column drag-into (horizontal drop) works at all zoom levels
4. Click-anywhere cursor placement works at all zoom levels
5. Pagination mode page gaps correctly detected at all zoom levels
6. Text remains sharp at common zoom levels (75%, 100%, 125%, 150%, 200%)
7. Scrolling covers full content at all zoom levels
8. `npm run build` passes with 0 TypeScript errors
9. No coordinate conversion code outside of `pipeline.ts` and `BlockIndicator.tsx`
