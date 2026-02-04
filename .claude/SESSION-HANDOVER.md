# SERQ Session Handover - Block Drag Animation System

**Date:** 2026-02-04
**Branch:** feature/unified-style-system
**Last Commit:** a997399 - feat: implement block drag-and-drop with custom animations

---

## Project Overview

SERQ is a TipTap-based rich text editor built as a Tauri desktop app. We implemented a custom drag-and-drop system for block reordering using mouse events (HTML5 Drag API doesn't work in Tauri WebView).

---

## What Was Built

### Block Drag-and-Drop System

**Activation:**
- Long press (400ms) on any block activates drag mode
- Movement threshold (10px) cancels long press if user starts selecting text

**During Drag:**
- Source block text fades out via white overlay (1.5s CSS transition)
- Horizontal blue drop indicator shows where block will land
- Text selection disabled via CSS `user-select: none`
- Virtual cursor hidden via CSS targeting `.prosemirror-virtual-cursor`
- Cursor changes to `grabbing`

**On Drop:**
- Block reorders instantly (ProseMirror handles the actual move)
- Two-stage indicator animation:
  1. Horizontal line shrinks right-to-left to a dot (300ms ease-in-out)
  2. Vertical line grows from dot downward (400ms ease-out)

---

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/extensions/block-indicator.ts` | Core ProseMirror plugin (~700 lines) |
| `src/components/BlockIndicator/BlockIndicator.tsx` | React component for rendering |
| `src/components/BlockIndicator/BlockIndicator.css` | Styles and transitions |

### State Management Pattern

```
Module-level state (block-indicator.ts)
    ↓ notifyListeners()
React component subscribes via useEffect
    ↓ setState()
React re-renders with new props
    ↓ data-* attributes
CSS transitions animate the changes
```

### BlockIndicatorState Interface

```typescript
interface BlockIndicatorState {
  visible: boolean
  top: number
  height: number
  blockLeft: number
  blockWidth: number
  shiftHeld: boolean
  isLongPressing: boolean
  isDragging: boolean
  dropIndicatorTop: number | null
  sourceOverlay: { left, top, width, height } | null
  isAnimating: boolean
  indicatorTransition: { fromTop, fromHeight, toTop, toHeight } | null
  dropAnimation: 'none' | 'shrinking' | 'growing'
}
```

---

## Critical Technical Learnings

### 1. ProseMirror DOM Control
**Problem:** Direct DOM manipulation gets wiped by ProseMirror re-renders
**Solution:** All visual changes must go through React state → CSS transitions

### 2. CSS Transition Triggering
**Problem:** Setting initial and final values in same frame doesn't animate
**Solution:** Double `requestAnimationFrame` to ensure browser commits initial state

```typescript
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    // Now set final value - CSS will animate
  })
})
```

### 3. Virtual Cursor Hiding
**Problem:** `caret-color: transparent` doesn't work - SERQ uses prosemirror-virtual-cursor
**Solution:** CSS targeting the virtual cursor element directly:
```css
body.block-dragging .prosemirror-virtual-cursor {
  display: none !important;
}
```

### 4. Text Selection During Drag
**Problem:** Text gets selected while dragging
**Solution:** CSS `user-select: none` on body + `window.getSelection()?.removeAllRanges()` on every mousemove

### 5. Displaced Blocks Animation
**Attempted:** FLIP animation, CSS transforms, React overlays with cloned HTML
**Result:** FAILED - ProseMirror wipes all DOM changes before animation can play
**Current:** Blocks snap into place instantly (no animation)

---

## What Works

| Feature | Status |
|---------|--------|
| Long press detection (400ms) | WORKS |
| Source overlay fade (text disappears) | WORKS |
| Horizontal drop indicator | WORKS |
| Drop indicator position tracking | WORKS |
| Block reordering on drop | WORKS |
| Text selection disabled during drag | WORKS |
| Cursor hidden during drag | WORKS |
| Two-stage drop animation (shrink → grow) | WORKS |
| Normal text selection when not dragging | WORKS |

---

## What Doesn't Work (By Design)

| Feature | Reason |
|---------|--------|
| Displaced blocks push-down animation | ProseMirror controls DOM, wipes transforms |
| Ghost block following cursor | Removed - simplified to just drop indicator |

---

## CSS Variables for Customization

```css
--block-indicator-width: 2px
--block-indicator-color: var(--color-brand, #3b82f6)
--block-indicator-opacity-visible: 0.6
--block-indicator-opacity-hidden: 0
--block-indicator-radius: 1px
--block-indicator-offset: 16px
--block-indicator-transition-duration: 510ms
--block-indicator-transition-easing: cubic-bezier(0.22, 0.1, 0.25, 1.0)
--block-indicator-fade-duration: 340ms
```

---

## Debug Commands

```bash
npm run tauri dev          # Start the app
./scripts/read-log.sh      # Read debug logs
./scripts/read-log.sh clear # Clear logs before test
./scripts/screenshot.sh    # Take screenshot
```

---

## Next Steps (Potential)

1. Add haptic feedback on long press (if Tauri supports)
2. Add sound feedback on drop
3. Consider alternative visual feedback for displaced blocks (flash/highlight instead of animation)
4. Multi-block selection and drag

---

*Session completed: 2026-02-04*
