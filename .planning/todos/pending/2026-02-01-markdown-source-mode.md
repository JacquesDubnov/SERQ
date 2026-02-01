---
created: 2026-02-01T21:41
title: Add Markdown source mode with toggle
area: feature
files:
  - src/components/Editor/EditorCore.tsx
  - src/stores/editorStore.ts
---

## Problem

Users who are comfortable with Markdown syntax want the ability to write in pure Markdown format without any rendering - seeing the raw `# Heading`, `**bold**`, `- list item` syntax directly. This is especially valuable for:
- Developers and technical writers who think in Markdown
- Users who want precise control over formatting
- Export to Markdown with exact visual correspondence
- Learning Markdown syntax while writing

Currently SERQ only has a WYSIWYG rendered view. Users cannot see or edit the underlying Markdown source.

## Solution

TBD - Research approaches:
- Add view mode toggle: "Rendered" | "Source" (| "Split" for side-by-side)
- Source mode: plain text editor with Markdown syntax
- Bidirectional sync between rendered TipTap and source text
- Keyboard shortcut for quick toggle (e.g., Cmd+/)
- Preserve cursor position when switching modes
- Syntax highlighting in source mode (optional enhancement)
