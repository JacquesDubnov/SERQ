---
created: 2026-02-01T12:30
title: RTL Management (Right-to-Left Language Support)
area: feature
files:
  - src/extensions/RTL/RTL.ts
  - src/components/Editor/EditorCore.tsx
  - src/stores/editorStore.ts
---

## Problem

User needs support for right-to-left languages (Hebrew, Arabic, etc.) with proper text direction, alignment, and mixed-direction content handling.

## Solution

- Document-level RTL/LTR toggle
- Paragraph-level direction override
- Auto-detect direction from content
- Proper cursor movement in RTL mode
- Bidi text handling (mixed LTR/RTL content)
- Mirror UI elements when in RTL mode (optional)
- Support CSS `direction: rtl` and `unicode-bidi` properties
