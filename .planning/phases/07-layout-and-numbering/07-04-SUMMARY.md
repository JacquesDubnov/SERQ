---
phase: "07"
plan: "04"
subsystem: editor-extensions
tags: [line-numbers, gutter, context-menu, viewport-optimization]
requires:
  - "01-01"
provides:
  - line-number-settings-state
  - line-numbers-extension
  - canvas-context-menu
  - gutter-rendering
affects:
  - "07-05"
tech-stack:
  added: []
  patterns:
    - prosemirror-plugin-gutter
    - viewport-optimized-rendering
    - context-menu-pattern
key-files:
  created:
    - src/extensions/LineNumbers/LineNumbers.ts
    - src/extensions/LineNumbers/index.ts
    - src/styles/line-numbers.css
    - src/components/Editor/CanvasContextMenu.tsx
  modified:
    - src/stores/editorStore.ts
    - src/components/Editor/EditorCore.tsx
    - src/components/Editor/EditorWrapper.tsx
    - src/components/Editor/index.ts
    - src/styles/editor.css
decisions:
  - id: D-07-04-001
    decision: "Use viewport optimization for line number rendering"
    rationale: "Only render visible lines with 200px buffer for smooth scrolling - performance critical for long documents"
  - id: D-07-04-002
    decision: "Canvas context menu triggers on empty space below content"
    rationale: "Natural place for document-level settings, doesn't conflict with selection context menu or table menu"
  - id: D-07-04-003
    decision: "getSettings callback pattern for extension-to-store communication"
    rationale: "Extension reads fresh settings on each render, allowing store changes to immediately affect rendering without extension reconfiguration"
metrics:
  duration: "~5 minutes"
  completed: "2026-02-01"
---

# Phase 07 Plan 04: Line Numbers Summary

Line numbering system with gutter display and viewport optimization - toggleable via canvas context menu.

## One-Liner

ProseMirror plugin renders line numbers in left gutter with viewport optimization, controlled via canvas right-click menu.

## What Was Built

### 1. Line Number Settings in Store
- Added `LineNumberSettings` interface with enabled/position/style
- Added `lineNumbers` state to editorStore
- Added `setLineNumbers` and `toggleLineNumbers` actions
- Position options: gutter (outside content) or margin (inside with background)
- Style options: code (1,2,3...) or legal (5,10,15...)

### 2. LineNumbers Extension
- ProseMirror plugin that renders line numbers in absolute-positioned gutter
- Viewport optimization: only renders visible lines with 200px buffer
- Debounced scroll/resize handlers for smooth performance
- Uses `coordsAtPos` for accurate line positioning
- getSettings callback pattern reads from store on each render

### 3. Canvas Context Menu
- CanvasContextMenu component with line number toggle and options
- Position toggle buttons (gutter/margin)
- Style buttons (code/legal)
- Shows expanded options only when line numbers enabled
- Inline styles with CSS variable theming

### 4. Integration
- LineNumbers extension added to EditorCore with getSettings callback
- Canvas context menu wired to EditorWrapper
- Triggers on right-click in empty canvas space below content
- Exported from Editor index

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Viewport optimization | Only render visible lines | Long documents could have thousands of lines |
| 200px buffer | Pre-render just outside viewport | Smooth scrolling without pop-in |
| getSettings callback | Fresh read on each render | Store changes immediately affect rendering |
| Canvas menu trigger | Below content only | Clear distinction from selection/table menus |
| Inline styles | CSS variables in style objects | Consistent with existing context menu pattern |

## Files Changed

**Created:**
- `src/extensions/LineNumbers/LineNumbers.ts` - ProseMirror plugin for gutter rendering
- `src/extensions/LineNumbers/index.ts` - Extension exports
- `src/styles/line-numbers.css` - Gutter and line number styles
- `src/components/Editor/CanvasContextMenu.tsx` - Canvas right-click menu

**Modified:**
- `src/stores/editorStore.ts` - Line number settings state
- `src/components/Editor/EditorCore.tsx` - LineNumbers extension integration
- `src/components/Editor/EditorWrapper.tsx` - Canvas context menu handling
- `src/components/Editor/index.ts` - CanvasContextMenu export
- `src/styles/editor.css` - CSS import

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 07076ba | feat | Add line number settings to editorStore |
| 208999e | feat | Create LineNumbers extension with gutter plugin |
| 2010b79 | feat | Create canvas context menu with line number controls |

## Verification Results

- [x] TypeScript compiles (ignoring pre-existing issues in VersionPreview/BlockContextMenu)
- [x] Build passes: `npm run build`
- [x] LineNumbers extension registered in EditorCore
- [x] Canvas context menu renders on empty canvas right-click
- [x] Line number settings in store with proper types

## Deviations from Plan

None - plan executed as written.

## Next Phase Readiness

Ready for plan 07-05 (Paragraph Numbering) which will add preset-based paragraph numbering. The line numbers provide the gutter rendering pattern that paragraph numbers will follow.

## Open Items

- Manual testing needed: visual verification of line numbers in gutter/margin positions
- Manual testing needed: legal style showing only every 5th line
- Manual testing needed: scroll performance with long documents
