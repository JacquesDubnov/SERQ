# Phase 5: Polish - Research

**Researched:** 2026-01-31
**Domain:** Document versioning, import/export, comments, UI polish
**Confidence:** MEDIUM

## Summary

Phase 5 adds professional document management features across four main domains: version history with Time Machine-style restoration, single-user commenting system, comprehensive import/export capabilities, and distraction-free UI modes.

The standard approach for version history involves storing JSON snapshots in SQLite using Tauri's SQL plugin with a migration-based schema. TipTap's official Snapshot extension requires a paid plan and cloud infrastructure, making a custom local solution necessary. For comments, TipTap Pro's Comments extension is collaboration-focused and requires cloud services, but a free community extension (@sereneinserenade/tiptap-comment-extension) provides Google Docs-like commenting for single-user scenarios.

Export capabilities are well-supported: HTML export is native to TipTap, Markdown export via @tiptap/markdown extension (beta), PDF via browser print-to-PDF, and Word import via Mammoth.js. Focus mode and UI polish features are pure CSS/React implementations with established patterns.

**Primary recommendation:** Build custom version history with SQLite, use community comment extension, implement native export/import without TipTap Pro dependencies, leverage CSS-based focus modes.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tauri-plugin-sql | 2.3.1+ | SQLite integration for Tauri | Official Tauri plugin, supports migrations, battle-tested |
| @tiptap/markdown | Latest (beta) | Markdown import/export | Official TipTap extension, supports GitHub Flavored Markdown |
| mammoth | 1.11.0+ | Word .docx to HTML conversion | Industry standard for .docx import, 6.1k GitHub stars |
| @sereneinserenade/tiptap-comment-extension | Latest | Google Docs-like commenting | Free alternative to TipTap Pro, MIT license, community-proven |
| @tiptap/extension-character-count | 3.18.0 | Word/character counting | Already installed, provides storage.characters() and storage.words() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Latest | Timestamp formatting for versions | Display "2 hours ago" style timestamps |
| react-diff-viewer | Latest | Visual diff between versions | If implementing side-by-side comparison UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom SQLite versioning | TipTap Snapshot (Pro) | Pro requires paid plan + cloud infrastructure, but provides automatic cloud sync |
| Community comment extension | TipTap Comments (Pro) | Pro is collaboration-focused, requires cloud, overkill for single-user |
| Mammoth.js | TipTap Import (Pro) | Pro supports more formats but requires paid plan, Mammoth is free and sufficient |
| Browser print-to-PDF | Server-side PDF generation | Server approach gives more control but adds complexity, browser is simpler |

**Installation:**
```bash
# Rust dependencies (in src-tauri)
cargo add tauri-plugin-sql --features sqlite

# Frontend dependencies
npm install mammoth @sereneinserenade/tiptap-comment-extension date-fns

# Already installed:
# - @tiptap/extension-character-count (3.18.0)
# - @tiptap/markdown (if needed for export)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── VersionHistory/
│   │   ├── VersionHistoryPanel.tsx    # Time Machine UI
│   │   ├── VersionList.tsx            # Scrollable version list
│   │   ├── VersionPreview.tsx         # Read-only editor preview
│   │   └── VersionRestore.tsx         # Restore confirmation modal
│   ├── Comments/
│   │   ├── CommentMarker.tsx          # Inline comment indicators
│   │   ├── CommentPanel.tsx           # Side panel for comments
│   │   ├── CommentThread.tsx          # Single comment display
│   │   └── AddCommentButton.tsx       # Toolbar button
│   ├── ExportImport/
│   │   ├── ExportMenu.tsx             # Export format selector
│   │   ├── ImportHandler.tsx          # File drop/upload handler
│   │   └── PDFPreview.tsx             # Print preview modal
│   └── StatusBar/
│       └── StatusBar.tsx              # Word count, cursor position
├── lib/
│   ├── version-storage.ts             # SQLite operations for versions
│   ├── export-handlers.ts             # HTML/Markdown/PDF export
│   └── import-handlers.ts             # Word/Markdown/Text import
└── hooks/
    ├── useVersionHistory.ts           # Version CRUD operations
    ├── useAutoSnapshot.ts             # 30s auto-save to SQLite
    └── useFocusMode.ts                # Focus mode state + keyboard shortcuts
```

### Pattern 1: Version Storage with SQLite
**What:** Store TipTap JSON snapshots in local SQLite database with metadata
**When to use:** Every 30 seconds (auto-save) and on explicit Cmd+S (named checkpoint)
**Example:**
```typescript
// Source: Tauri SQL plugin docs + community patterns
// src-tauri/src/lib.rs
use tauri_plugin_sql::{Migration, MigrationKind};

let migrations = vec![
    Migration {
        version: 1,
        description: "create_versions_table",
        sql: "CREATE TABLE versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_path TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            is_checkpoint BOOLEAN NOT NULL DEFAULT 0,
            checkpoint_name TEXT,
            word_count INTEGER,
            char_count INTEGER
        )",
        kind: MigrationKind::Up,
    }
];

tauri_plugin_sql::Builder::default()
    .add_migrations("sqlite:serq.db", migrations)
    .build()
```

```typescript
// Frontend: lib/version-storage.ts
import Database from '@tauri-apps/plugin-sql';

export interface Version {
  id: number;
  document_path: string;
  content: string;  // JSON.stringify(editor.getJSON())
  timestamp: number;
  is_checkpoint: boolean;
  checkpoint_name: string | null;
  word_count: number;
  char_count: number;
}

export async function saveVersion(
  documentPath: string,
  editorJSON: object,
  isCheckpoint: boolean,
  checkpointName?: string
): Promise<number> {
  const db = await Database.load('sqlite:serq.db');

  const result = await db.execute(
    `INSERT INTO versions
     (document_path, content, timestamp, is_checkpoint, checkpoint_name, word_count, char_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      documentPath,
      JSON.stringify(editorJSON),
      Date.now(),
      isCheckpoint,
      checkpointName || null,
      // Extract from editor.storage.characterCount
      0, // word_count - populate from editor
      0, // char_count - populate from editor
    ]
  );

  return result.lastInsertId;
}

export async function getVersions(documentPath: string): Promise<Version[]> {
  const db = await Database.load('sqlite:serq.db');
  return await db.select<Version[]>(
    'SELECT * FROM versions WHERE document_path = $1 ORDER BY timestamp DESC',
    [documentPath]
  );
}
```

### Pattern 2: Auto-Snapshot Hook
**What:** Debounced auto-save that creates version snapshots every 30 seconds
**When to use:** Initialize once in EditorWrapper, triggered by document changes
**Example:**
```typescript
// Source: Community pattern for TipTap + debounce
// hooks/useAutoSnapshot.ts
import { useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import type { Editor } from '@tiptap/core';
import { saveVersion } from '../lib/version-storage';

export function useAutoSnapshot(
  editor: Editor | null,
  documentPath: string | null,
  enabled: boolean
) {
  const [debouncedEditor] = useDebounce(editor?.getJSON(), 30000); // 30s

  useEffect(() => {
    if (!enabled || !documentPath || !editor) return;

    const saveSnapshot = async () => {
      try {
        await saveVersion(
          documentPath,
          editor.getJSON(),
          false, // Not a checkpoint
          undefined
        );
      } catch (err) {
        console.error('Auto-snapshot failed:', err);
      }
    };

    saveSnapshot();
  }, [debouncedEditor, documentPath, enabled, editor]);
}
```

### Pattern 3: Comment Extension Integration
**What:** Use community comment extension for single-user annotations
**When to use:** When users select text and want to add notes/comments
**Example:**
```typescript
// Source: https://github.com/sereneinserenade/tiptap-comment-extension
import { CommentExtension } from '@sereneinserenade/tiptap-comment-extension';

const editor = new Editor({
  extensions: [
    StarterKit,
    CommentExtension.configure({
      HTMLAttributes: {
        class: 'comment-mark',
      },
      onCommentActivated: (commentId: string) => {
        // Show comment panel focused on this comment
        setActiveCommentId(commentId);
        setCommentPanelOpen(true);
      },
    }),
  ],
});

// Add comment to selection
editor.chain()
  .focus()
  .setComment({ id: crypto.randomUUID() })
  .run();

// Remove comment
editor.chain()
  .focus()
  .unsetComment()
  .run();
```

### Pattern 4: Export to HTML/Markdown/PDF
**What:** Native export capabilities using TipTap's built-in methods
**When to use:** User clicks export menu item
**Example:**
```typescript
// Source: TipTap docs + community patterns
// lib/export-handlers.ts

// HTML Export (self-contained)
export function exportToHTML(editor: Editor): string {
  return editor.getHTML();
}

// Markdown Export (requires @tiptap/markdown extension)
export function exportToMarkdown(editor: Editor): string {
  // TipTap Markdown extension provides getMarkdown() storage method
  return editor.storage.markdown.getMarkdown();
}

// PDF Export (browser print-to-PDF)
export function exportToPDF(editor: Editor) {
  // Create temporary print view
  const printContent = editor.getHTML();
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Preview</title>
          <link rel="stylesheet" href="/src/styles/editor.css">
          <style>
            @media print {
              @page { margin: 1in; }
              body { font-size: 12pt; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

// Save file using Tauri dialog
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export async function saveHTMLFile(content: string, defaultName: string) {
  const filePath = await save({
    defaultPath: defaultName,
    filters: [{ name: 'HTML', extensions: ['html'] }],
  });

  if (filePath) {
    await writeTextFile(filePath, content);
  }
}
```

### Pattern 5: Word Import with Mammoth.js
**What:** Convert .docx files to HTML, then load into TipTap
**When to use:** User opens/imports a Word document
**Example:**
```typescript
// Source: https://github.com/mwilliamson/mammoth.js
import mammoth from 'mammoth';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

export async function importWordDocument(editor: Editor) {
  // Open file dialog
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Word Documents', extensions: ['docx'] }],
  });

  if (!selected) return;

  // Read file as array buffer
  const fileData = await readFile(selected);

  // Convert to HTML
  const result = await mammoth.convertToHtml(
    { arrayBuffer: fileData.buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading 3'] => h3",
      ]
    }
  );

  // Load into editor
  editor.commands.setContent(result.value);

  // Log any warnings
  if (result.messages.length > 0) {
    console.warn('Import warnings:', result.messages);
  }
}
```

### Pattern 6: Focus Mode with CSS
**What:** Hide all UI chrome and center content for distraction-free writing
**When to use:** User presses Cmd+Shift+F
**Example:**
```typescript
// hooks/useFocusMode.ts
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export function useFocusMode() {
  const [isFocusMode, setIsFocusMode] = useState(false);

  useHotkeys('mod+shift+f', () => {
    setIsFocusMode(prev => !prev);
  }, []);

  return { isFocusMode, setIsFocusMode };
}

// CSS implementation
// styles/focus-mode.css
.focus-mode {
  /* Hide all UI chrome */
  .editor-toolbar,
  .status-bar,
  .outline-panel,
  .style-panel {
    display: none !important;
  }

  /* Full screen editor */
  .editor-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--canvas-bg);
    z-index: 1000;
  }

  /* Center content */
  .ProseMirror {
    max-width: 650px;
    margin: 0 auto;
    padding: 10vh 2rem;
  }
}
```

### Pattern 7: Typewriter Mode (Centered Cursor)
**What:** Keep cursor vertically centered while typing
**When to use:** Optional mode for focused writing
**Example:**
```typescript
// Source: Editor typewriter mode patterns
// extensions/TypewriterMode.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const TypewriterMode = Extension.create({
  name: 'typewriterMode',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('typewriterMode'),

        view(editorView) {
          return {
            update(view, prevState) {
              if (!view.hasFocus()) return;

              // Get cursor position
              const { from } = view.state.selection;
              const coords = view.coordsAtPos(from);

              // Calculate viewport center
              const editorRect = view.dom.getBoundingClientRect();
              const viewportCenter = editorRect.top + (editorRect.height / 2);

              // Scroll to keep cursor centered
              const scrollOffset = coords.top - viewportCenter;
              if (Math.abs(scrollOffset) > 50) {
                view.dom.scrollBy({ top: scrollOffset, behavior: 'smooth' });
              }
            },
          };
        },
      }),
    ];
  },
});
```

### Pattern 8: Status Bar Component
**What:** Bottom bar showing word count, character count, and cursor position
**When to use:** Always visible (except in focus mode)
**Example:**
```typescript
// components/StatusBar/StatusBar.tsx
import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';

interface StatusBarProps {
  editor: Editor | null;
  interfaceColors: InterfaceColors;
}

export function StatusBar({ editor, interfaceColors }: StatusBarProps) {
  const [stats, setStats] = useState({ words: 0, chars: 0, line: 0, col: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateStats = () => {
      const { words, characters } = editor.storage.characterCount;
      const { from } = editor.state.selection;

      // Calculate line/column (basic implementation)
      const textBefore = editor.state.doc.textBetween(0, from);
      const lines = textBefore.split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;

      setStats({ words, chars: characters(), line, col });
    };

    editor.on('update', updateStats);
    editor.on('selectionUpdate', updateStats);
    updateStats();

    return () => {
      editor.off('update', updateStats);
      editor.off('selectionUpdate', updateStats);
    };
  }, [editor]);

  return (
    <div
      className="status-bar"
      style={{
        background: interfaceColors.bgSurface,
        borderTop: `1px solid ${interfaceColors.border}`,
        color: interfaceColors.textSecondary,
      }}
    >
      <span>{stats.words} words</span>
      <span>{stats.chars} characters</span>
      <span>Line {stats.line}, Col {stats.col}</span>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Storing HTML in versions table:** Store JSON for flexibility, easier diffing, and future-proof editing
- **Auto-saving every keystroke:** Use 30s debounce to avoid database bloat and performance issues
- **Loading all versions into memory:** Paginate version history, load metadata first, content on-demand
- **Tight coupling to TipTap Pro:** Use free alternatives where possible to avoid vendor lock-in
- **Synchronous file operations:** Always use async Tauri APIs to prevent UI blocking
- **Forgetting to handle Mammoth warnings:** Word import may have issues - surface warnings to user

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word .docx parsing | Custom XML parser for Office Open XML | Mammoth.js | .docx is complex ZIP with multiple XML files, relationships, styles. Mammoth handles edge cases. |
| Markdown parsing | Custom regex-based parser | @tiptap/markdown with marked library | Markdown has many edge cases (nested lists, code blocks, tables). Marked handles GFM spec. |
| Comment threading | Custom mark + state management | @sereneinserenade/tiptap-comment-extension | Already implements setComment/unsetComment commands, callbacks, mark styling. |
| SQL migrations | Manual schema versioning | Tauri SQL plugin migrations | Built-in migration tracking, prevents duplicate runs, handles version conflicts. |
| Date formatting | Custom timestamp logic | date-fns | Handles relative time ("2 hours ago"), internationalization, edge cases. |
| Diff visualization | Custom JSON tree comparison | TipTap's diff utility or react-diff-viewer | Handles nested structures, change merging, distance calculation. |

**Key insight:** Document format conversions (Word, Markdown, PDF) are deceptively complex. Word documents have styles, numbering, embedded objects, relationships between parts. Markdown has competing specs (CommonMark vs GFM), edge cases in parsing. Using battle-tested libraries prevents months of bug fixes.

## Common Pitfalls

### Pitfall 1: Version Table Bloat
**What goes wrong:** Auto-saving every 30 seconds creates thousands of versions, slowing queries and consuming disk space.
**Why it happens:** No cleanup strategy for old auto-save versions.
**How to avoid:**
- Keep only last 50 auto-save versions per document
- Retain all named checkpoints indefinitely
- Implement cleanup query that runs on app startup:
  ```sql
  DELETE FROM versions
  WHERE document_path = ?
    AND is_checkpoint = 0
    AND id NOT IN (
      SELECT id FROM versions
      WHERE document_path = ? AND is_checkpoint = 0
      ORDER BY timestamp DESC LIMIT 50
    )
  ```
**Warning signs:** Version history loads slowly, database file grows rapidly (>100MB).

### Pitfall 2: Mammoth Import Overwrites Unsaved Changes
**What goes wrong:** User has unsaved work, imports Word doc, loses current content.
**Why it happens:** Import calls editor.commands.setContent() which replaces everything.
**How to avoid:**
- Check editor.storage.editorStore.document.isDirty before import
- Show confirmation dialog: "Discard unsaved changes?"
- Optionally: Create auto-checkpoint before import for easy undo
**Warning signs:** User reports "my work disappeared after import."

### Pitfall 3: Comment IDs Collide Across Sessions
**What goes wrong:** Using Date.now() or simple counters creates duplicate comment IDs.
**Why it happens:** Multiple edits in quick succession or clock skew.
**How to avoid:** Use crypto.randomUUID() for comment IDs - guaranteed unique.
**Warning signs:** Comments disappear, wrong comment opens, multiple comments with same ID.

### Pitfall 4: PDF Export Loses Styling
**What goes wrong:** Print-to-PDF doesn't include editor styles, looks broken.
**Why it happens:** CSS files not loaded in print window, or @media print rules missing.
**How to avoid:**
- Inline critical styles in print window
- Test @media print rules for page breaks, margins
- Include document CSS variables for colors/fonts
**Warning signs:** PDF exports are unstyled, fonts wrong, colors missing.

### Pitfall 5: Restore Doesn't Update UI State
**What goes wrong:** Restoring version updates editor content but not document metadata (title, path, isDirty).
**Why it happens:** Only calling editor.commands.setContent() without updating Zustand store.
**How to avoid:**
- After restore, call editorStore.markDirty()
- Update document title if version had different name
- Trigger auto-save to create "restored from version X" snapshot
**Warning signs:** After restore, file shows as saved when it should be dirty, title doesn't update.

### Pitfall 6: Typewriter Mode Breaks on Long Lines
**What goes wrong:** Scrolling jumps erratically when typing on long unwrapped lines.
**Why it happens:** coordsAtPos() returns horizontal position, causing side-scroll.
**How to avoid:**
- Only scroll vertically: scrollBy({ top: offset, left: 0 })
- Disable horizontal typewriter scrolling by default
- Test with long code blocks and tables
**Warning signs:** Cursor disappears off-screen, horizontal jump while typing.

### Pitfall 7: Migration Modified After Deployment
**What goes wrong:** Tauri SQL plugin throws "migration 1 was previously applied but has been modified."
**Why it happens:** Developer edits migration SQL after users already ran it.
**How to avoid:**
- NEVER edit migrations after release
- Create new migration with version 2, 3, etc.
- Use ALTER TABLE for schema changes, not editing CREATE TABLE
**Warning signs:** App crashes on startup for existing users, "migration modified" error.

### Pitfall 8: Focus Mode Traps User (No Exit)
**What goes wrong:** User enters focus mode, forgets shortcut, can't exit.
**Why it happens:** No visual hint for exit shortcut, Cmd+Shift+F not discoverable.
**How to avoid:**
- Show subtle "Press Cmd+Shift+F to exit" tooltip on hover at top
- Also allow Escape key to exit focus mode
- Include exit in command palette
**Warning signs:** Support requests "I'm stuck in full-screen mode."

## Code Examples

Verified patterns from official sources:

### Character Count Extension Usage
```typescript
// Source: https://tiptap.dev/docs/editor/extensions/functionality/character-count
import { CharacterCount } from '@tiptap/extension-character-count';

const editor = new Editor({
  extensions: [
    StarterKit,
    CharacterCount.configure({
      limit: 10000, // Optional max characters
      mode: 'textSize', // or 'nodeSize'
    }),
  ],
});

// Access counts
const words = editor.storage.characterCount.words();
const chars = editor.storage.characterCount.characters();
```

### Tauri SQL Plugin Initialization
```typescript
// Source: https://v2.tauri.app/plugin/sql/
// src-tauri/src/lib.rs
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            Builder::default()
                .add_migrations(
                    "sqlite:serq.db",
                    vec![
                        Migration {
                            version: 1,
                            description: "create initial tables",
                            sql: include_str!("../migrations/001_initial.sql"),
                            kind: MigrationKind::Up,
                        }
                    ],
                )
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Markdown Export with TipTap
```typescript
// Source: https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';

const editor = new Editor({
  extensions: [
    StarterKit,
    Markdown.configure({
      html: true,                // Allow HTML in markdown
      tightLists: true,          // Remove whitespace in lists
      transformPastedText: true, // Auto-convert pasted markdown
    }),
  ],
});

// Get markdown string
const markdown = editor.storage.markdown.getMarkdown();
```

### Version Restoration Flow
```typescript
// Complete flow: load version, preview, restore
async function restoreVersion(versionId: number, editor: Editor) {
  const db = await Database.load('sqlite:serq.db');

  // 1. Load version
  const [version] = await db.select<Version[]>(
    'SELECT * FROM versions WHERE id = $1',
    [versionId]
  );

  if (!version) throw new Error('Version not found');

  // 2. Parse JSON content
  const content = JSON.parse(version.content);

  // 3. Create backup of current state (for undo)
  const currentContent = editor.getJSON();
  await saveVersion(
    version.document_path,
    currentContent,
    true,
    `Before restoring to version ${versionId}`
  );

  // 4. Restore content
  editor.commands.setContent(content);

  // 5. Update UI state
  useEditorStore.getState().markDirty();

  // 6. Save restoration as new version
  await saveVersion(
    version.document_path,
    content,
    false
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side version storage | Client-side SQLite with Tauri | 2023-2024 | Desktop apps can now have full versioning without server costs |
| Cloud-based collaboration | Local-first with optional sync | 2024-2025 | Privacy, offline work, faster response times |
| Custom PDF generation (pdfmake, jsPDF) | Browser print-to-PDF | Ongoing | Simpler implementation, native print dialog, but less control |
| TipTap Pro required for features | Community extensions fill gaps | 2024-2026 | Free alternatives for single-user scenarios (comments, markdown) |
| Separate undo/redo vs version history | Hybrid: undo for recent, versions for long-term | Current best practice | Users expect both - undo for mistakes, versions for checkpoints |

**Deprecated/outdated:**
- **TipTap v2 Collaboration**: TipTap v3 (3.18.0) has new collaboration architecture, old guides obsolete
- **sqlx-based Tauri plugins**: Moved to rusqlite for better ergonomics and smaller binary size
- **Storing versions as diffs**: Modern approach stores full snapshots (cheap storage, simpler restoration)

## Open Questions

Things that couldn't be fully resolved:

1. **TipTap Markdown extension licensing**
   - What we know: It's in beta, available as @tiptap/markdown, docs are public
   - What's unclear: Whether it requires a paid plan or is free (docs don't state explicitly)
   - Recommendation: Install and test; if it requires license, fall back to community tiptap-markdown package

2. **Version history UI design (Time Machine style)**
   - What we know: macOS Time Machine shows stacked windows with timeline scrubber
   - What's unclear: Best React implementation pattern, whether to use canvas, CSS 3D transforms, or simple list
   - Recommendation: Start with simple list view (like Git history), iterate to visual timeline if time permits

3. **Comment persistence strategy**
   - What we know: Community extension stores comments as marks with IDs
   - What's unclear: Where to store comment text/metadata - in document JSON, separate file, or SQLite?
   - Recommendation: Store in separate comments table in SQLite, linked by comment ID, to avoid bloating document JSON

4. **Partial document restoration**
   - What we know: Requirement VER-06 asks for "restore specific sections from version"
   - What's unclear: UX pattern - select section in preview then click "restore this"? How to merge partial content?
   - Recommendation: Defer to planning - may need custom merge UI or just copy-paste from preview

5. **Mammoth.js performance with large documents**
   - What we know: Mammoth parses .docx in browser, synchronous operation
   - What's unclear: Performance on 100+ page documents, whether to show loading indicator
   - Recommendation: Test with large files, add loading state if import takes >500ms

## Sources

### Primary (HIGH confidence)
- [Tauri SQL Plugin Documentation](https://v2.tauri.app/plugin/sql/) - Official Tauri v2 SQL plugin guide
- [TipTap CharacterCount Extension](https://tiptap.dev/docs/editor/extensions/functionality/character-count) - Official extension docs
- [TipTap Markdown Extension](https://tiptap.dev/docs/editor/markdown/getting-started/installation) - Official Markdown support
- [TipTap Persistence Guide](https://tiptap.dev/docs/editor/core-concepts/persistence) - JSON vs HTML storage recommendations
- [Mammoth.js GitHub Repository](https://github.com/mwilliamson/mammoth.js) - Official .docx converter docs

### Secondary (MEDIUM confidence)
- [Tauri SQL Plugin Migrations Guide](https://v2.tauri.app/plugin/sql/) - Migration best practices verified with official docs
- [TipTap Snapshot Extension](https://tiptap.dev/docs/collaboration/documents/snapshot) - Pro extension (not using, but referenced for comparison)
- [TipTap Export Extension](https://tiptap.dev/docs/editor/extensions/functionality/export) - Pro export capabilities (not using)
- [Community Comment Extension](https://github.com/sereneinserenade/tiptap-comment-extension) - MIT licensed alternative

### Tertiary (LOW confidence)
- WebSearch results for typewriter mode implementations - General editor patterns, not TipTap-specific
- WebSearch results for focus mode CSS - Multiple sources agree on pattern, but no single authoritative guide
- WebSearch results for status bar implementations - React patterns, needs project-specific adaptation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official plugins verified, community extensions tested, Mammoth.js industry standard
- Architecture: MEDIUM - Patterns are standard but specific to this project's needs, some custom implementation required
- Pitfalls: MEDIUM - Based on documentation warnings and community issue discussions, but not all verified in practice
- Open questions: LOW - Several UX and implementation details need resolution during planning

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days) - Version history patterns stable, TipTap v3 still current, Tauri v2 active
