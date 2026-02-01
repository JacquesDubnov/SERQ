---
created: 2026-02-01T13:00
title: Add line and paragraph numbers toggle
area: ui
files:
  - src/components/Editor/EditorCore.tsx
  - src/components/CommandPalette/commands.ts
---

## Problem

Users need visual reference for line and paragraph numbers when writing or editing documents. This is especially useful for:
- Collaborative editing (referencing specific locations)
- Legal/academic documents requiring line citations
- Code blocks with line numbers
- Navigation and orientation in long documents

Currently there's no way to display line or paragraph numbers.

## Solution

1. **Line Numbers Display**
   - Toggle to show line numbers in left gutter
   - Numbers update dynamically as content changes
   - Respect canvas margins

2. **Paragraph Numbers Display**
   - Toggle to show paragraph numbers
   - Number each block-level element (p, h1-h6, etc.)
   - Useful for manuscript/chapter work

3. **Activation Points**
   - Command Palette: "Toggle Line Numbers", "Toggle Paragraph Numbers"
   - Right-click context menu on canvas
   - Status bar indicator when enabled
   - Keyboard shortcuts (optional)

4. **Visual Style**
   - Subtle, muted color that doesn't distract
   - Proper alignment and spacing
   - Works with all canvas color themes
