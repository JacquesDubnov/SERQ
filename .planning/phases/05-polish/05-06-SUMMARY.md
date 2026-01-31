---
phase: 05-polish
plan: 06
subsystem: file-import
tags: [mammoth, docx, markdown, import, tiptap]

dependency_graph:
  requires: [05-02]
  provides: [document-import, word-import, markdown-import, text-import]
  affects: []

tech_stack:
  added: [mammoth@1.11.0]
  patterns: [file-import-handler, dirty-document-guard]

key_files:
  created:
    - src/lib/import-handlers.ts
  modified:
    - src/components/CommandPalette/commands.ts
    - package.json

decisions:
  - id: D-05-06-001
    decision: Use mammoth.js for Word conversion
    rationale: Well-maintained library, no server required, handles .docx to HTML cleanly

  - id: D-05-06-002
    decision: Custom Markdown parser over external library
    rationale: Matches export-handlers pattern, no extra dependency, handles basic Markdown syntax

  - id: D-05-06-003
    decision: Confirmation dialog for dirty documents
    rationale: Prevents accidental data loss when importing over unsaved work

metrics:
  duration: ~3 min
  completed: 2026-01-31
---

# Phase 5 Plan 6: Document Import Summary

Document import handlers using mammoth.js for Word, custom parser for Markdown, and plain text wrapper for .txt files.

## Implementation

**Import Handlers (`src/lib/import-handlers.ts`):**
- `importWordDocument` - Uses mammoth.js to convert .docx to HTML, passes to TipTap editor
- `importMarkdownFile` - Custom regex-based Markdown-to-HTML converter
- `importTextFile` - Wraps plain text in `<p>` tags preserving line breaks
- `confirmImportIfDirty` - Shows confirmation dialog if document has unsaved changes

**Command Palette Integration:**
- Added `import-word`, `import-markdown`, `import-text` commands in 'file' group
- Appears alongside existing export commands

**Document State After Import:**
- Title becomes "Imported - {filename}" (no extension)
- Path set to null (not a saved file)
- Marked as dirty (needs save)

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| D-05-06-001 | Use mammoth.js for Word | Client-side .docx parsing, no server, well-maintained |
| D-05-06-002 | Custom Markdown parser | Matches export pattern, no extra dep, handles essentials |
| D-05-06-003 | Confirm before replacing dirty doc | User protection against accidental content loss |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| a3efdb7 | feat | Import handlers for Word, Markdown, plain text |
| 8f999c8 | feat | Import commands in command palette |

## Files Changed

**Created:**
- `src/lib/import-handlers.ts` - Import handler functions

**Modified:**
- `src/components/CommandPalette/commands.ts` - Added import commands
- `package.json` - Added mammoth dependency

## Next Phase Readiness

Plan 05-07 can proceed. No blockers identified.
