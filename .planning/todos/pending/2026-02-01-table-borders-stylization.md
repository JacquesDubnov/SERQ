---
created: 2026-02-01T06:58
title: Add table borders stylization options
area: ui
files:
  - src/styles/tables.css
  - src/components/Editor/TableContextMenu.tsx
---

## Problem

Tables currently have a fixed border style. Users need the ability to customize table borders to match their document aesthetic:
- Border styles (solid, dashed, dotted, none)
- Border thickness options
- Border color selection
- Per-cell or full-table border control
- Header row border distinction

This is part of the broader UI polish effort to make tables visually customizable.

## Solution

TBD - Research how other editors handle table border styling and implement:
- Border style presets in table context menu
- CSS variable integration for theme consistency
- Individual cell border overrides if needed
