# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Documents that work everywhere, created by writers who write - not format.
**Current focus:** Phase 2 - File Management

## Current Position

Phase: 2 of 6 (File Management)
Plan: 2 of 4 in current phase
Status: In progress
Last activity: 2026-01-30 - Completed 02-02-PLAN.md

Progress: [███░░░░░░░] 30% (6/20 plans estimated)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Total execution time: ~1 hour 11 min

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Editor Foundation | 4/4 | Complete |
| 2. File Management | 2/4 | In progress |

## Accumulated Context

### Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D-01-01-001 | Use Tailwind CSS v4 with PostCSS plugin | v4 installed automatically; uses CSS-first config approach |
| D-01-01-002 | Named import for TextStyle extension | TipTap 3.18.0 TextStyle has no default export |
| D-01-02-001 | useEditorState with selector pattern | Prevents re-render avalanche on every transaction |
| D-01-02-002 | setTimeout for editor ref access | Editor ref set asynchronously after mount |
| D-01-03-001 | CSS custom properties for canvas widths | Future theming support in Phase 3 |
| D-01-04-001 | Document-level click listener with capture | Required to intercept clicks before ProseMirror |
| D-01-04-002 | Coordinate-based click detection | Padding clicks still target contenteditable element |
| D-01-04-003 | Insert paragraphs via insertContentAt | createParagraphNear doesn't create multiple paragraphs reliably |
| D-02-01-001 | Install Rust 1.93.0 toolchain | Required for tauri add CLI commands |
| D-02-01-002 | Explicit fs:allow-read/write/exists/stat permissions | Production safety - dev mode more permissive than release |
| D-02-01-003 | Scope FS permissions to $HOME/** | Allow saving anywhere in user home directory |
| D-02-01-004 | Embed metadata as JSON in script tag | .serq.html format - valid HTML + machine-readable metadata |
| D-02-01-005 | Escape </script> as <\\/script> in JSON | Prevent HTML structure breaks in serialized content |
| D-02-02-001 | saveFile delegates to saveFileAs when no path | New documents without path trigger Save As dialog |
| D-02-02-002 | Both meta+key and ctrl+key registered | Cross-platform keyboard shortcut support |
| D-02-02-003 | enableOnContentEditable for all shortcuts | Shortcuts work inside TipTap editor |

### Technical Patterns Established

**Click-Anywhere Implementation:**
```typescript
// Document-level listener (capture phase)
document.addEventListener('click', handler, true)

// Coordinate-based detection for clicks below content
const contentElements = proseMirror.querySelectorAll('p, h1, h2, ...')
const contentBottom = lastElement.getBoundingClientRect().bottom

// Insert paragraphs to reach click position
const paragraphs = Array(count).fill({ type: 'paragraph' })
editor.chain().insertContentAt(endPos, paragraphs).focus('end').run()
```

**Tauri Plugin Registration:**
```rust
tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
```

**.serq.html Format:**
```html
<script type="application/json" id="serq-metadata">
{ "version": "1.0", "created": "...", "modified": "...", "wordCount": N }
</script>
<body class="serq-document">
  <!-- TipTap HTML content -->
</body>
```

**File Operations Hook Pattern:**
```typescript
// useFileOperations accepts EditorCoreRef for content access
const { openFile, saveFile, saveFileAs, newFile } = useFileOperations(editorRef)

// useKeyboardShortcuts wraps useFileOperations
useKeyboardShortcuts(editorRef) // Registers Cmd+S/Shift+S/O/N
```

### Design Reference

See `.planning/DESIGN-REFERENCE.md` for UI/UX inspiration from:
- iA Writer (radical simplicity, typography as UI)
- Minimal | Writing + Notes (meditation-inspired, single focus)

### Pending Todos

None.

### Blockers/Concerns

**Resolved in 02-01:**
- [x] Tauri permissions: `$HOME/**` access configured
- [x] Rust installation: Rust 1.93.0 installed

**Remaining for Phase 2:**
- Test production build early (dev mode more permissive than release)

## Session Continuity

Last session: 2026-01-30
Stopped at: Completed 02-02-PLAN.md (File Operations Hooks)
Resume file: None - ready for 02-03-PLAN.md

---
*State updated: 2026-01-30*
*Phase 1 complete: 2026-01-30 (human verified)*
*Plan 02-01 complete: 2026-01-30*
*Plan 02-02 complete: 2026-01-30*
