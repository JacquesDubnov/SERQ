---
phase: 07
plan: 02
subsystem: editor-layout
tags:
  - float
  - text-wrap
  - context-menu
  - images
  - callouts
dependency-graph:
  requires: []
  provides:
    - float-attributes
    - float-css
    - block-context-menu
  affects:
    - 07-03 (page breaks may interact with floats)
tech-stack:
  added: []
  patterns:
    - data-float attribute for float state
    - CSS float with clear:both on headings
    - Block context menu for float controls
key-files:
  created:
    - src/styles/float.css
    - src/components/Editor/BlockContextMenu.tsx
  modified:
    - src/extensions/ResizableImage/ResizableImage.ts
    - src/extensions/ResizableImage/ImageView.tsx
    - src/extensions/Callout/Callout.ts
    - src/extensions/Callout/CalloutView.tsx
    - src/extensions/Callout/CalloutContextMenu.tsx
    - src/styles/editor.css
    - src/components/Editor/index.ts
decisions:
  - id: D-07-02-001
    decision: "Float attribute stored on node, applied via data-float and CSS class"
    rationale: "Consistent with existing alignment approach, enables CSS-only styling"
  - id: D-07-02-002
    decision: "Headings auto-clear floats via CSS"
    rationale: "Natural document flow - headings start new sections"
  - id: D-07-02-003
    decision: "Mobile responsive - floats disabled below 640px"
    rationale: "Text wrapping doesn't work well on narrow screens"
metrics:
  duration: ~15 minutes
  completed: 2026-02-01
---

# Phase 7 Plan 02: Float and Text Wrap Summary

Float controls for magazine-style layouts with text wrapping around images and callouts.

## What Was Built

### Float Attribute System
- Added `float` attribute to ResizableImage extension: `none | left | right | center-wrap`
- Added `float` attribute to Callout extension: `none | left | right | center-wrap`
- parseHTML reads from `data-float` attribute
- renderHTML outputs `data-float` attribute (only when not `none`)

### Float CSS System (`src/styles/float.css`)
- `.block-float-left`: Float left with right margin, max 50% width
- `.block-float-right`: Float right with left margin, max 50% width
- `.block-float-center-wrap`: Centered with text below, max 80% width
- Auto-clear on headings (h1-h6) via `clear: both`
- Responsive: Floats disabled on mobile (<640px)
- Print styles: `page-break-inside: avoid` for floated elements

### Block Context Menu
- New BlockContextMenu component for images with float options
- Float options: No Float, Float Left, Float Right, Center (Text Below)
- Visual icons for each option
- Insert Clear Break option (inserts horizontal rule)

### Callout Context Menu Updates
- Added Text Wrap section to CalloutContextMenu
- Same float options as images
- Integrated with existing border/color/icon controls

## Commits

| Hash | Description |
|------|-------------|
| 1908b79 | Add float attribute to image and callout extensions |
| c6da711 | Create float CSS and apply to views |
| 10605d4 | Add block context menu for float controls |
| 77ee15b | Restore CalloutContextMenu border and float options |

## Key Code Patterns

### Float Attribute Definition
```typescript
float: {
  default: 'none',
  parseHTML: (element) => element.getAttribute('data-float') || 'none',
  renderHTML: (attributes) => {
    if (!attributes.float || attributes.float === 'none') return {}
    return { 'data-float': attributes.float }
  },
}
```

### View Float Class Application
```typescript
const floatClass = floatValue && floatValue !== 'none' ? `block-float-${floatValue}` : ''
const wrapperClass = `callout ${selected ? 'callout-selected' : ''} ${floatClass}`.trim()
```

### Float CSS
```css
.block-float-left, [data-float="left"] {
  float: left;
  margin-right: 1.5rem;
  max-width: 50%;
}

.editor-content .tiptap h1, .editor-content .tiptap h2, /* ... */ {
  clear: both;
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Status

- [x] Float attribute added to ResizableImage
- [x] Float attribute added to Callout
- [x] Float CSS classes apply correct positioning
- [x] Headings auto-clear floats
- [x] Block context menu appears on image right-click
- [x] Float options work in CalloutContextMenu

## Next Phase Readiness

Ready for Plan 07-03 (Page Breaks). The float system is independent and won't conflict with page break insertion.

Note: Clear breaks currently insert horizontal rules. A dedicated clear break block could be added in the future for cleaner semantics.
