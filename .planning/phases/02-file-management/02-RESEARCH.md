# Phase 2: File Management - Research

**Researched:** 2026-01-30
**Domain:** Tauri 2.x File System + Dialog Plugins, Auto-save Patterns, Keyboard Shortcuts
**Confidence:** HIGH

## Summary

Phase 2 implements the complete file management layer for SERQ: native macOS open/save dialogs, the .serq.html document format, auto-save with dirty tracking, and recent files persistence. The research confirms that Tauri 2.x provides all necessary primitives through three plugins: `tauri-plugin-fs` (file operations), `tauri-plugin-dialog` (native dialogs), and `tauri-plugin-store` (preferences/recent files).

The critical insight from research is that **Tauri 2.x permissions MUST be explicitly configured before any file code runs**. The default capabilities only allow access to app-specific directories (AppData, AppConfig, etc.). Accessing `$HOME/**` for user documents requires explicit permission scoping in `capabilities/default.json`. Dev mode is more permissive than production builds, so test with `cargo tauri build` early.

For keyboard shortcuts (Cmd+S, Cmd+Shift+S), two approaches work: TipTap's built-in `addKeyboardShortcuts()` with `Mod-s` syntax (cross-platform), or `react-hotkeys-hook` for app-level shortcuts outside the editor. TipTap's approach is preferred since save operations are editor-centric.

**Primary recommendation:** Configure Tauri FS permissions for `$HOME/**` on Day 1, build the .serq.html format with embedded JSON metadata, use `react-hotkeys-hook` for global shortcuts, and implement auto-save with `useDebouncedCallback` from the `use-debounce` package.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tauri-plugin-fs | 2.x | File read/write | Official Tauri plugin, native performance |
| tauri-plugin-dialog | 2.x | Open/Save dialogs | Native macOS dialogs, proper file extension handling |
| tauri-plugin-store | 2.x | Preferences storage | Persistent key-value store for recent files |
| @tauri-apps/plugin-fs | 2.x | JS bindings for FS | Type-safe frontend API |
| @tauri-apps/plugin-dialog | 2.x | JS bindings for dialogs | Type-safe frontend API |
| @tauri-apps/plugin-store | 2.x | JS bindings for store | Type-safe frontend API |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hotkeys-hook | 4.x | Keyboard shortcuts | Cmd+S, Cmd+Shift+S outside editor |
| use-debounce | 10.x | Debounced callbacks | Auto-save every 30 seconds |
| tokio | 1.x | Async runtime (Rust) | Async file operations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tauri-plugin-store | SQLite | SQLite is overkill for key-value preferences |
| react-hotkeys-hook | TipTap shortcuts only | TipTap shortcuts don't work when editor unfocused |
| use-debounce | lodash.debounce | use-debounce has better React hooks integration |

**Installation:**
```bash
# Add Tauri plugins
npm run tauri add fs
npm run tauri add dialog
npm run tauri add store

# Install JS bindings
npm install @tauri-apps/plugin-fs @tauri-apps/plugin-dialog @tauri-apps/plugin-store

# Install keyboard/debounce utilities
npm install react-hotkeys-hook use-debounce

# Rust dependencies (already handled by tauri add)
# In src-tauri/Cargo.toml:
# tauri-plugin-fs = "2"
# tauri-plugin-dialog = "2"
# tauri-plugin-store = "2"
# tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── Editor/
│   │   └── EditorCore.tsx       # Existing - exposes setContent/getHTML
│   └── FileMenu/
│       └── FileMenu.tsx         # File > New/Open/Save/Save As
├── hooks/
│   ├── useFileOperations.ts     # Open, save, save-as logic
│   ├── useAutoSave.ts           # 30-second debounced auto-save
│   └── useKeyboardShortcuts.ts  # Cmd+S, Cmd+Shift+S handlers
├── stores/
│   └── editorStore.ts           # Existing - document.path, isDirty
├── lib/
│   ├── serqFormat.ts            # .serq.html serialize/deserialize
│   └── recentFiles.ts           # Recent files list management
└── App.tsx

src-tauri/
├── capabilities/
│   └── default.json             # FS permissions for $HOME/**
├── src/
│   ├── lib.rs                   # Plugin registration
│   └── commands/
│       └── file.rs              # Custom file commands if needed
└── Cargo.toml
```

### Pattern 1: Tauri FS Permissions Configuration (CRITICAL)

**What:** Configure capabilities BEFORE writing any file code
**When to use:** Always, first thing in Phase 2
**Example:**

```json
// src-tauri/capabilities/default.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "identifier": "default",
  "description": "Default capabilities for SERQ",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "fs:default",
    "dialog:default",
    "store:default",
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    },
    {
      "identifier": "fs:allow-exists",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    }
  ]
}
```

**Source:** [Tauri FS Plugin Docs](https://v2.tauri.app/plugin/file-system/), [Capabilities Docs](https://v2.tauri.app/security/capabilities/)

### Pattern 2: Native File Dialogs with Filters

**What:** Use Tauri dialog plugin for macOS-native open/save dialogs
**When to use:** File > Open, File > Save As
**Example:**

```typescript
// src/hooks/useFileOperations.ts
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '@/stores/editorStore'

export function useFileOperations(editorRef: React.RefObject<EditorCoreRef>) {
  const { setDocument, markSaved, markDirty } = useEditorStore()

  const openFile = async () => {
    const filePath = await open({
      multiple: false,
      directory: false,
      filters: [{
        name: 'SERQ Documents',
        extensions: ['serq.html', 'html']
      }]
    })

    if (!filePath) return // User cancelled

    const content = await readTextFile(filePath)
    const { html, metadata } = parseSerqDocument(content)

    editorRef.current?.setContent(html)
    setDocument(filePath, extractFileName(filePath))

    return { html, metadata }
  }

  const saveFile = async () => {
    const { document } = useEditorStore.getState()

    if (!document.path) {
      return saveFileAs() // No path yet, use Save As
    }

    const html = editorRef.current?.getHTML() ?? ''
    const content = serializeSerqDocument(html, document)

    await writeTextFile(document.path, content)
    markSaved()
  }

  const saveFileAs = async () => {
    const filePath = await save({
      filters: [{
        name: 'SERQ Document',
        extensions: ['serq.html']
      }],
      defaultPath: 'Untitled.serq.html'
    })

    if (!filePath) return // User cancelled

    const html = editorRef.current?.getHTML() ?? ''
    const content = serializeSerqDocument(html, { name: extractFileName(filePath) })

    await writeTextFile(filePath, content)
    setDocument(filePath, extractFileName(filePath))
    markSaved()

    return filePath
  }

  return { openFile, saveFile, saveFileAs }
}

function extractFileName(path: string): string {
  return path.split('/').pop()?.replace('.serq.html', '') ?? 'Untitled'
}
```

**Source:** [Tauri Dialog Plugin Docs](https://v2.tauri.app/plugin/dialog/)

### Pattern 3: .serq.html Document Format

**What:** HTML document with embedded JSON metadata in a script tag
**When to use:** Saving and loading documents
**Example:**

```typescript
// src/lib/serqFormat.ts

export interface SerqMetadata {
  version: string
  created: string
  modified: string
  wordCount: number
  presets?: {
    typography?: string
    colors?: string
    layout?: string
  }
}

export function serializeSerqDocument(
  html: string,
  documentMeta: { name: string; path?: string | null }
): string {
  const metadata: SerqMetadata = {
    version: '1.0',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    wordCount: countWords(html),
  }

  // Escape JSON for safe embedding in HTML
  // Note: </script> in JSON would break parsing
  const escapedJson = JSON.stringify(metadata, null, 2)
    .replace(/<\/script>/gi, '<\\/script>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="generator" content="SERQ">
  <title>${escapeHtml(documentMeta.name)}</title>
  <script type="application/json" id="serq-metadata">
${escapedJson}
  </script>
  <style>
    /* SERQ document styles - generated from presets */
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 720px; margin: 2rem auto; }
  </style>
</head>
<body class="serq-document">
${html}
</body>
</html>`
}

export function parseSerqDocument(content: string): { html: string; metadata: SerqMetadata } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')

  // Extract metadata from script tag
  const metadataScript = doc.getElementById('serq-metadata')
  let metadata: SerqMetadata = {
    version: '1.0',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    wordCount: 0,
  }

  if (metadataScript?.textContent) {
    try {
      metadata = JSON.parse(metadataScript.textContent)
    } catch {
      console.warn('Failed to parse SERQ metadata, using defaults')
    }
  }

  // Extract HTML content from body
  const body = doc.querySelector('.serq-document')
  const html = body?.innerHTML ?? content

  return { html, metadata }
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ')
  return text.split(/\s+/).filter(Boolean).length
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

**Source:** [Safe JSON in Script Tags](https://sirre.al/2025/08/06/safe-json-in-script-tags-how-not-to-break-a-site/), [MDN Script Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)

### Pattern 4: Auto-Save with Debounce

**What:** Save document every 30 seconds when dirty, with debounce
**When to use:** Background saving to prevent data loss
**Example:**

```typescript
// src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '@/stores/editorStore'
import { serializeSerqDocument } from '@/lib/serqFormat'

const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export function useAutoSave(
  editorRef: React.RefObject<EditorCoreRef>,
  enabled: boolean = true
) {
  const { document, markSaved } = useEditorStore()
  const lastSaveRef = useRef<Date | null>(null)

  const performAutoSave = useDebouncedCallback(
    async () => {
      if (!document.path || !document.isDirty) return
      if (!editorRef.current) return

      try {
        const html = editorRef.current.getHTML()
        const content = serializeSerqDocument(html, document)
        await writeTextFile(document.path, content)

        markSaved()
        lastSaveRef.current = new Date()
        console.log('[AutoSave] Document saved at', lastSaveRef.current)
      } catch (error) {
        console.error('[AutoSave] Failed:', error)
        // Don't mark as saved on error
      }
    },
    AUTO_SAVE_INTERVAL,
    { maxWait: AUTO_SAVE_INTERVAL * 2 } // Force save after 60s even if still typing
  )

  // Trigger auto-save when document becomes dirty
  useEffect(() => {
    if (enabled && document.isDirty && document.path) {
      performAutoSave()
    }
  }, [document.isDirty, document.path, enabled, performAutoSave])

  // Flush pending auto-save on unmount
  useEffect(() => {
    return () => {
      performAutoSave.flush()
    }
  }, [performAutoSave])

  return {
    lastSave: lastSaveRef.current,
    flushAutoSave: performAutoSave.flush,
  }
}
```

**Source:** [use-debounce GitHub](https://github.com/xnimorz/use-debounce), [Autosave with React Hooks](https://www.synthace.com/blog/autosave-with-react-hooks)

### Pattern 5: Keyboard Shortcuts (Cmd+S, Cmd+Shift+S)

**What:** Register save shortcuts at app level
**When to use:** Global keyboard shortcuts that work even when editor unfocused
**Example:**

```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useHotkeys } from 'react-hotkeys-hook'
import { useFileOperations } from './useFileOperations'
import type { EditorCoreRef } from '@/components/Editor/EditorCore'

export function useKeyboardShortcuts(
  editorRef: React.RefObject<EditorCoreRef>
) {
  const { saveFile, saveFileAs, openFile, newFile } = useFileOperations(editorRef)

  // Cmd+S - Save
  useHotkeys('meta+s, ctrl+s', (e) => {
    e.preventDefault()
    saveFile()
  }, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  })

  // Cmd+Shift+S - Save As
  useHotkeys('meta+shift+s, ctrl+shift+s', (e) => {
    e.preventDefault()
    saveFileAs()
  }, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  })

  // Cmd+O - Open
  useHotkeys('meta+o, ctrl+o', (e) => {
    e.preventDefault()
    openFile()
  }, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  })

  // Cmd+N - New
  useHotkeys('meta+n, ctrl+n', (e) => {
    e.preventDefault()
    newFile()
  }, {
    enableOnContentEditable: true,
    enableOnFormTags: true,
  })
}
```

**Alternative: TipTap-native shortcuts** (if editor must be focused):

```typescript
// In EditorCore.tsx extensions array
import { Extension } from '@tiptap/core'

const SaveShortcuts = Extension.create({
  name: 'saveShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-s': () => {
        // Access save function via editor storage or event
        this.editor.commands.focus() // Keep focus
        document.dispatchEvent(new CustomEvent('serq:save'))
        return true // Prevent default
      },
      'Mod-Shift-s': () => {
        document.dispatchEvent(new CustomEvent('serq:save-as'))
        return true
      },
    }
  },
})
```

**Source:** [react-hotkeys-hook Docs](https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys), [TipTap Keyboard Shortcuts](https://tiptap.dev/docs/editor/core-concepts/keyboard-shortcuts)

### Pattern 6: Recent Files with Tauri Store

**What:** Persist recent files list across app restarts
**When to use:** File > Recent menu, app startup
**Example:**

```typescript
// src/lib/recentFiles.ts
import { load } from '@tauri-apps/plugin-store'

const MAX_RECENT_FILES = 10
const STORE_FILE = 'preferences.json'

interface RecentFile {
  path: string
  name: string
  lastOpened: string
}

let storeInstance: Awaited<ReturnType<typeof load>> | null = null

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_FILE, { autoSave: false })
  }
  return storeInstance
}

export async function getRecentFiles(): Promise<RecentFile[]> {
  const store = await getStore()
  const files = await store.get<RecentFile[]>('recentFiles')
  return files ?? []
}

export async function addRecentFile(path: string, name: string): Promise<void> {
  const store = await getStore()
  let files = await getRecentFiles()

  // Remove if already exists (will re-add at top)
  files = files.filter(f => f.path !== path)

  // Add to front
  files.unshift({
    path,
    name,
    lastOpened: new Date().toISOString(),
  })

  // Trim to max
  files = files.slice(0, MAX_RECENT_FILES)

  await store.set('recentFiles', files)
  await store.save()
}

export async function clearRecentFiles(): Promise<void> {
  const store = await getStore()
  await store.set('recentFiles', [])
  await store.save()
}

export async function removeRecentFile(path: string): Promise<void> {
  const store = await getStore()
  let files = await getRecentFiles()
  files = files.filter(f => f.path !== path)
  await store.set('recentFiles', files)
  await store.save()
}
```

**Source:** [Tauri Store Plugin Docs](https://v2.tauri.app/plugin/store/)

### Anti-Patterns to Avoid

- **NEVER rely on dev mode permissions:** Dev mode is more permissive. Test with `cargo tauri build` early and often.
- **NEVER omit the `allow` scope:** Just enabling `fs:allow-read` without a path scope will get "forbidden path" errors.
- **NEVER block the main thread:** All file operations must be async. Use `writeTextFile` not synchronous alternatives.
- **NEVER trust user-provided HTML:** When loading external .html files, sanitize content before inserting into TipTap.
- **NEVER recreate debounce functions on render:** Use `useDebouncedCallback` or wrap in `useCallback` to prevent infinite loops.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File dialogs | Custom modal with path input | `@tauri-apps/plugin-dialog` | Native OS dialogs handle permissions, recent files, favorites |
| Key-value preferences | JSON file management | `@tauri-apps/plugin-store` | Handles serialization, file locking, cross-platform paths |
| Debounced callbacks | setTimeout management | `use-debounce` | Handles cleanup, max-wait, React lifecycle |
| Keyboard shortcuts | addEventListener | `react-hotkeys-hook` | Handles modifiers, conflicts, cleanup |
| Path manipulation | String splitting | `@tauri-apps/api/path` | Cross-platform path resolution |

**Key insight:** Tauri's plugin ecosystem handles OS-specific quirks (macOS sandboxing, Windows UAC, Linux permissions). Don't reinvent these wheels.

## Common Pitfalls

### Pitfall 1: Permission Scope Not Configured

**What goes wrong:** File operations work in dev, fail with "forbidden path" in production
**Why it happens:** Tauri 2.x default permissions only allow app-specific directories
**How to avoid:** Configure `capabilities/default.json` with explicit `$HOME/**` scopes BEFORE writing file code
**Warning signs:** `cargo tauri build` works, but the installed app can't open files from Documents

### Pitfall 2: Auto-Save Race Conditions

**What goes wrong:** Auto-save fires during user edit, corrupts file, or saves partial content
**Why it happens:** Save triggered while editor state is mid-transaction
**How to avoid:** Use TipTap's `onUpdate` callback with debounce, never read editor state during a transaction
**Warning signs:** Saved file occasionally has missing characters or duplicated content

### Pitfall 3: Recent Files Stale References

**What goes wrong:** Recent files list shows files that were moved or deleted
**Why it happens:** List isn't validated on display
**How to avoid:** Check `exists()` before displaying, gracefully remove invalid entries
**Warning signs:** Clicking recent file shows error or opens wrong file

### Pitfall 4: Save Without Path (New Document)

**What goes wrong:** User presses Cmd+S on new document, nothing happens
**Why it happens:** Save logic assumes `document.path` exists
**How to avoid:** Fallback to Save As when `path` is null
**Warning signs:** No error, no feedback, document not saved

### Pitfall 5: JSON Metadata Escaping

**What goes wrong:** Document with `</script>` in content breaks the .serq.html format
**Why it happens:** Script tag closes prematurely
**How to avoid:** Escape `</script>` as `<\/script>` in JSON string
**Warning signs:** Documents with code blocks fail to reopen

## Code Examples

Verified patterns from official sources:

### Complete Tauri Plugin Registration

```rust
// src-tauri/src/lib.rs
// Source: Tauri 2.x Plugin Documentation

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Complete Capabilities Configuration

```json
// src-tauri/capabilities/default.json
// Source: Tauri Capabilities Documentation
{
  "$schema": "https://schema.tauri.app/config/2",
  "identifier": "default",
  "description": "Default capabilities for SERQ document editor",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "fs:default",
    "dialog:default",
    "store:default",
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    },
    {
      "identifier": "fs:allow-exists",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    },
    {
      "identifier": "fs:allow-stat",
      "allow": [
        { "path": "$HOME" },
        { "path": "$HOME/**" }
      ]
    }
  ]
}
```

### File Operations Integration with EditorCore

```typescript
// src/App.tsx - Integration example
// Source: Combined from Tauri and TipTap patterns

import { useRef, useEffect } from 'react'
import { EditorCore, EditorCoreRef } from '@/components/Editor/EditorCore'
import { useFileOperations } from '@/hooks/useFileOperations'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useEditorStore } from '@/stores/editorStore'

export function App() {
  const editorRef = useRef<EditorCoreRef>(null)
  const { document, markDirty } = useEditorStore()

  // Initialize file operations
  const { openFile, saveFile, saveFileAs, newFile } = useFileOperations(editorRef)

  // Setup auto-save
  useAutoSave(editorRef, true)

  // Register keyboard shortcuts
  useKeyboardShortcuts(editorRef)

  const handleEditorUpdate = (html: string) => {
    markDirty()
  }

  return (
    <div className="app">
      <header className="titlebar">
        <span>{document.name}{document.isDirty ? ' *' : ''}</span>
      </header>
      <main className="editor-container">
        <EditorCore
          ref={editorRef}
          onUpdate={handleEditorUpdate}
        />
      </main>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri 1.x allowlist config | Tauri 2.x capabilities system | 2024 | More granular, per-window permissions |
| fs-extra in renderer | Tauri FS plugin | Tauri 2.0 | Sandboxed, secure file access |
| localStorage for preferences | tauri-plugin-store | Tauri 2.0 | Proper file persistence, not browser storage |
| Electron-style dialog | Native platform dialogs | Tauri 2.0 | True macOS look and feel |

**Deprecated/outdated:**
- Tauri 1.x `allowlist` config format - use `capabilities/` directory instead
- `window.__TAURI__` global - use `@tauri-apps/api` imports instead
- `tauri.conf.json` permissions - moved to capabilities system

## Open Questions

Things that couldn't be fully resolved:

1. **Working Folder Configuration (FILE-06)**
   - What we know: Can store a default folder path in tauri-plugin-store
   - What's unclear: Whether to use this as `defaultPath` in dialogs or as a filter
   - Recommendation: Start with defaultPath approach, iterate based on UX feedback

2. **Auto-Save Indicator UX**
   - What we know: Need to show "Saving..." / "Saved" indicator
   - What's unclear: Best placement (title bar vs status bar vs toast)
   - Recommendation: Start with title bar, similar to macOS apps showing dot

3. **Large File Performance Threshold**
   - What we know: Tauri IPC can handle large payloads via Response type
   - What's unclear: Exact threshold where .serq.html files become problematic
   - Recommendation: Test with 1MB+ documents during implementation, optimize if needed

## Sources

### Primary (HIGH confidence)
- [Tauri FS Plugin](https://v2.tauri.app/plugin/file-system/) - File operations, scopes, permissions
- [Tauri Dialog Plugin](https://v2.tauri.app/plugin/dialog/) - Native open/save dialogs
- [Tauri Store Plugin](https://v2.tauri.app/plugin/store/) - Persistent key-value storage
- [Tauri Capabilities](https://v2.tauri.app/security/capabilities/) - Permission configuration
- [Tauri Calling Rust](https://v2.tauri.app/develop/calling-rust/) - Async commands, large payloads
- [TipTap Keyboard Shortcuts](https://tiptap.dev/docs/editor/core-concepts/keyboard-shortcuts) - Mod-s syntax
- [react-hotkeys-hook](https://react-hotkeys-hook.vercel.app/docs/api/use-hotkeys) - useHotkeys API
- [use-debounce](https://github.com/xnimorz/use-debounce) - Debounced callbacks

### Secondary (MEDIUM confidence)
- [Safe JSON in Script Tags](https://sirre.al/2025/08/06/safe-json-in-script-tags-how-not-to-break-a-site/) - Escaping patterns
- [Tauri GitHub Issues](https://github.com/tauri-apps/tauri-docs/issues/3536) - Permission scope requirements
- [Autosave with React Hooks](https://www.synthace.com/blog/autosave-with-react-hooks) - useAutoSave patterns

### Tertiary (LOW confidence)
- Auto-save debounce timing (30 seconds) - Common convention, not scientifically validated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Tauri plugins with documented APIs
- Architecture: HIGH - Patterns from official docs and community best practices
- Pitfalls: HIGH - Confirmed via Tauri GitHub issues and documentation warnings
- Auto-save timing: MEDIUM - Convention from similar apps, needs UX validation

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days - Tauri 2.x is stable)
