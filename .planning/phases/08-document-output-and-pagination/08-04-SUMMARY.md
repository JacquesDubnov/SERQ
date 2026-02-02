---
phase: 08
plan: 04
subsystem: editor
tags: [markdown, codemirror, source-view, keyboard-shortcuts]
requires: [08-03]
provides: [markdown-source-view, view-mode-toggle]
affects: [future-split-view, markdown-import]
tech-stack:
  added: [@uiw/react-codemirror, @codemirror/lang-markdown, @codemirror/theme-one-dark, @codemirror/language-data]
  patterns: [conditional-rendering-by-view-mode, store-driven-view-state]
key-files:
  created:
    - src/components/Editor/MarkdownEditor.tsx
    - src/styles/markdown-editor.css
  modified:
    - package.json
    - src/stores/editorStore.ts
    - src/components/Editor/EditorCore.tsx
    - src/hooks/useKeyboardShortcuts.ts
    - src/lib/export-handlers.ts
decisions:
  - id: D-08-04-001
    decision: Use @uiw/react-codemirror wrapper for CodeMirror 6
    rationale: Well-maintained React wrapper with TypeScript support, simpler than raw CM6 setup
  - id: D-08-04-002
    decision: One-way sync from rendered to source on toggle
    rationale: Markdown-to-TipTap conversion is lossy; source edits are for viewing/copying, not persistent round-trip
  - id: D-08-04-003
    decision: Export jsonToMarkdown from export-handlers.ts
    rationale: Reuse existing JSON-to-Markdown conversion for source view sync
metrics:
  duration: ~8 minutes
  completed: 2026-02-02
---

# Phase 08 Plan 04: Markdown Source View Summary

**One-liner:** CodeMirror-based Markdown source editor with syntax highlighting, Cmd+/ toggle, and rendered-to-source sync.

## What Was Built

1. **MarkdownEditor Component** (`src/components/Editor/MarkdownEditor.tsx`)
   - CodeMirror 6 editor with markdown language support
   - Light and dark theme switching based on document.documentElement.dataset.theme
   - Line numbers, folding, active line highlighting
   - Code block syntax highlighting for embedded code

2. **View Mode State** (`src/stores/editorStore.ts`)
   - `ViewMode` type: `'rendered' | 'source'`
   - `viewMode` state (default: 'rendered')
   - `markdownSource` state for source content
   - `setViewMode`, `toggleViewMode`, `setMarkdownSource` actions

3. **View Mode Toggle** (`src/components/Editor/EditorCore.tsx`)
   - Conditional rendering based on viewMode
   - Auto-sync: converts TipTap JSON to Markdown when switching to source
   - Markdown changes mark document as dirty

4. **Keyboard Shortcut** (`src/hooks/useKeyboardShortcuts.ts`)
   - Cmd+/ (macOS) / Ctrl+/ (Windows/Linux) toggles between rendered and source view

## Key Technical Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D-08-04-001 | Use @uiw/react-codemirror | Well-maintained wrapper, TS support |
| D-08-04-002 | One-way sync (rendered -> source) | MD-to-TipTap is lossy, avoid data loss |
| D-08-04-003 | Export jsonToMarkdown | Reuse existing conversion logic |

## Implementation Pattern

```typescript
// View mode toggle in EditorCore
const viewMode = useEditorStore((s) => s.viewMode);

// Sync markdown when switching to source
useEffect(() => {
  if (prevMode === 'rendered' && viewMode === 'source') {
    const json = editor.getJSON();
    const md = jsonToMarkdown(json);
    setMarkdownSource(md);
  }
}, [viewMode]);

// Conditional render
if (viewMode === 'source') {
  return <MarkdownEditor value={markdownSource} onChange={handleChange} />;
}
return <EditorContent editor={editor} />;
```

## Commits

| Hash | Message |
|------|---------|
| e0127b6 | feat(08-04): add CodeMirror packages and view mode state |
| 3e03861 | feat(08-04): create MarkdownEditor component with syntax highlighting |
| 74e3655 | feat(08-04): wire view mode toggle with Cmd+/ shortcut |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @codemirror/language-data**
- **Found during:** Task 3 build
- **Issue:** MarkdownEditor imports languages from @codemirror/language-data for code block highlighting
- **Fix:** Installed missing package
- **Commit:** 74e3655

## Files Changed

### Created
- `src/components/Editor/MarkdownEditor.tsx` - CodeMirror markdown editor component
- `src/styles/markdown-editor.css` - Styling for markdown editor

### Modified
- `package.json` - Added CodeMirror packages
- `src/stores/editorStore.ts` - Added ViewMode, viewMode, markdownSource state
- `src/components/Editor/EditorCore.tsx` - View mode switching logic
- `src/hooks/useKeyboardShortcuts.ts` - Cmd+/ shortcut
- `src/lib/export-handlers.ts` - Exported jsonToMarkdown and TipTapNode

## Success Criteria Met

- [x] CodeMirror packages installed (@uiw/react-codemirror, @codemirror/lang-markdown)
- [x] MarkdownEditor component with Markdown syntax highlighting
- [x] viewMode state in editorStore ('rendered' | 'source')
- [x] Cmd+/ keyboard shortcut toggles between modes
- [x] Content syncs between modes (rendered to source uses jsonToMarkdown)

## Future Enhancements

1. **Split View (MD-02)** - Show rendered and source side-by-side
2. **Markdown-to-TipTap Parser** - Enable round-trip editing in source mode
3. **Cursor Position Sync** - Maintain cursor position when switching modes
