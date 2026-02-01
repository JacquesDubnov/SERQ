---
created: 2026-02-01T07:08
title: Add export to Word (.docx) format
area: ui
files:
  - src/lib/export-handlers.ts
  - src/components/ExportMenu/ExportMenu.tsx
---

## Problem

Currently SERQ can export to HTML, Markdown, and PDF. Users need Word (.docx) export for:
- Sharing with colleagues who use Microsoft Office
- Professional document submission requirements
- Cross-platform compatibility with the most common document format

Word import exists (via Mammoth.js) but export does not.

## Solution

TBD - Research approaches:
- Use docx library (npm: docx) to generate .docx files
- Convert TipTap JSON/HTML to docx structure
- Handle formatting: headings, bold, italic, lists, tables, images
- Preserve styles as much as possible
- Add "Export to Word" option in ExportMenu
