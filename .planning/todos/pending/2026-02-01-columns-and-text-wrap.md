---
created: 2026-02-01T09:20
title: Add columns and text wrap support
area: ui
files:
  - src/components/Editor/EditorCore.tsx
  - src/extensions/
---

## Problem

Document layout is currently limited to single-column flow. Users need:

1. **Multi-column layouts** - Newsletter-style 2-3 column text flow within a document section
2. **Text wrap control** - Wrapping text around images, callouts, or other block elements

These are fundamental layout capabilities expected in any serious document editor. Without them, certain document types (newsletters, brochures, academic papers with figures) are impossible to create.

## Solution

**Multi-Column Layout:**
- Section-based column control (not page-wide)
- 2, 3, or 4 column options
- Column gap and break controls
- TBD: Custom TipTap extension or CSS columns approach

**Text Wrap:**
- Float images left/right with text wrap
- Callout blocks with wrap option
- Clear/break controls
- TBD: How this interacts with TipTap's block model

**Priority:** Major issue for next phase - without this, SERQ can't compete with Word/Pages for real document work.

**Research Needed:**
- How other TipTap-based editors handle columns
- ProseMirror plugins for float/wrap
- CSS-only vs node-based approaches
