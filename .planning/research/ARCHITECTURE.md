# Architecture Patterns

**Project:** SERQ Document Editor
**Researched:** 2026-01-30
**Confidence:** HIGH (Context7/official docs verified for TipTap, Tauri, Claude API)

## Executive Summary

SERQ requires a layered architecture where:
1. **TipTap/ProseMirror** owns the document model and editing state
2. **Zustand** manages application state (UI, preferences, file state)
3. **Tauri Rust backend** handles file I/O, version history, and Claude API calls
4. **React** renders the UI with isolated editor components

The architecture follows the principle: **Editor state in TipTap, app state in Zustand, file operations in Rust.**

---

## Recommended Architecture

```
+------------------------------------------------------------------+
|                        SERQ Application                           |
+------------------------------------------------------------------+
|                                                                    |
|   +------------------------+    +---------------------------+     |
|   |    React UI Layer      |    |    TipTap Editor Core     |     |
|   |                        |    |                           |     |
|   |  - App Shell           |    |  - ProseMirror Document   |     |
|   |  - Toolbar             |    |  - Extensions (blocks)    |     |
|   |  - Sidebars            |    |  - Node Views (React)     |     |
|   |  - Style Panels        |    |  - History (undo/redo)    |     |
|   |  - Command Palette     |    |  - Serialization          |     |
|   +------------------------+    +---------------------------+     |
|              |                              |                      |
|              v                              v                      |
|   +----------------------------------------------------------+    |
|   |                    Zustand Store                          |    |
|   |                                                           |    |
|   |  - currentFile: FileState                                 |    |
|   |  - activePresets: { typography, colors, layout }          |    |
|   |  - uiState: { sidebarOpen, focusMode, etc. }             |    |
|   |  - preferences: UserPreferences                           |    |
|   +----------------------------------------------------------+    |
|                              |                                     |
|                              | invoke()                            |
|                              v                                     |
+==============================|=====================================+
                               | IPC (JSON-RPC)
+==============================|=====================================+
|                              v                                     |
|   +----------------------------------------------------------+    |
|   |                  Tauri Rust Backend                       |    |
|   |                                                           |    |
|   |  Commands:                                                |    |
|   |  - file_open(path) -> SerqDocument                       |    |
|   |  - file_save(path, content, metadata)                    |    |
|   |  - file_save_version(path, content) -> VersionId         |    |
|   |  - get_versions(path) -> Vec<Version>                    |    |
|   |  - restore_version(path, version_id) -> SerqDocument     |    |
|   |  - ai_stylize(content, preset_hints) -> StylizedContent  |    |
|   |  - load_presets() -> Presets                             |    |
|   |                                                           |    |
|   |  State:                                                   |    |
|   |  - Managed AppState (Mutex-protected)                    |    |
|   |  - SQLite connection for version history                 |    |
|   |  - File watchers for auto-save                           |    |
|   +----------------------------------------------------------+    |
|                              |                                     |
|                              v                                     |
|   +------------------------+    +---------------------------+     |
|   |     File System        |    |      Claude API           |     |
|   |  (.serq.html files)    |    |  (user-provided key)      |     |
|   +------------------------+    +---------------------------+     |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **EditorCore** | TipTap instance, document model, undo/redo | Zustand (content sync), React UI (events) |
| **AppShell** | Layout, routing, keyboard shortcuts | All UI components |
| **Toolbar** | Formatting commands, style selectors | EditorCore (commands), Zustand (presets) |
| **StylePanel** | Preset browsing, theme switching | Zustand (preset state), EditorCore (apply) |
| **FileManager** | Open/save dialogs, recent files | Tauri commands, Zustand (file state) |
| **VersionHistory** | Time Machine UI, recovery | Tauri commands (versions) |
| **AIStylizer** | Send to Claude, preview/accept | Tauri commands, EditorCore (content) |
| **RustBackend** | File I/O, SQLite, Claude API | File system, network, Zustand (via events) |

---

## Data Flow Patterns

### Pattern 1: Document Editing Flow

```
User types -> TipTap transaction -> ProseMirror state update
                                          |
                                          v
                              onUpdate callback fires
                                          |
                                          v
                              Zustand: isDirty = true
                              (debounced 500ms)
                                          |
                                          v
                              Auto-save triggers:
                              invoke('file_save_version', content)
```

**Key insight:** TipTap manages its own state. Don't mirror document content in Zustand - only track dirty/saved status.

### Pattern 2: File Open Flow

```
User: File > Open
        |
        v
Tauri dialog (native file picker)
        |
        v
invoke('file_open', path)
        |
        v
Rust: Read .serq.html, parse embedded JSON
        |
        v
Return: { html: string, metadata: SerqMetadata }
        |
        v
editor.commands.setContent(html)
Zustand: update currentFile state
```

### Pattern 3: Style Preset Application

```
User selects preset from StylePanel
        |
        v
Zustand: activePresets.typography = selectedPreset
        |
        v
CSS variables updated on :root
(typography presets map to CSS custom properties)
        |
        v
TipTap re-renders with new styles
(no document modification needed)
```

### Pattern 4: AI Stylization Flow

```
User: "Stylize with AI"
        |
        v
Get selection or full document from TipTap
        |
        v
invoke('ai_stylize', { content, presetHints })
        |
        v
Rust backend:
  1. Load Claude API key from secure storage
  2. Build prompt with style instructions
  3. Stream response via SSE
  4. Parse structured formatting output
        |
        v
Return: { stylizedContent, appliedFormats }
        |
        v
UI: Show preview diff
User: Accept/Reject
        |
        v
If accept: editor.commands.setContent(stylizedContent)
```

### Pattern 5: Version History Flow

```
Auto-save (every 30 seconds if dirty):
        |
        v
invoke('file_save_version', { path, content })
        |
        v
Rust:
  1. Write content to temp file
  2. Compute diff from last version
  3. Store in SQLite: versions(id, path, timestamp, content_hash, diff)
  4. Prune old versions (keep hourly for 24h, daily for 30d)
        |
        v
Return: { versionId, timestamp }

Recovery (Time Machine UI):
        |
        v
invoke('get_versions', path) -> Vec<VersionSummary>
        |
        v
User browses timeline, selects version
        |
        v
invoke('restore_version', { path, versionId })
        |
        v
Rust: Reconstruct content from version chain
        |
        v
editor.commands.setContent(restored)
```

---

## TipTap Integration Patterns

### Editor Setup (Recommended)

```typescript
// EditorCore.tsx - Isolated component to prevent re-renders
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function EditorCore({
  initialContent,
  onUpdate
}: EditorCoreProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 100, newGroupDelay: 500 }
      }),
      // Custom extensions for SERQ blocks
      CalloutNode,
      ColumnsNode,
      ImageBlockNode,
      EmbedNode,
    ],
    content: initialContent,
    immediatelyRender: false, // SSR safety
    onUpdate: ({ editor }) => {
      // Debounced - don't fire on every keystroke
      onUpdate({
        html: editor.getHTML(),
        json: editor.getJSON(),
        isEmpty: editor.isEmpty,
      })
    },
  })

  return <EditorContent editor={editor} />
}
```

**Performance critical:** Isolate the editor in its own component. The `useEditor` hook re-renders on every change - keep siblings minimal.

### Custom Node Views with React

```typescript
// CalloutNode.tsx
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      type: { default: 'info' }, // info, warning, error, success
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-callout': '' }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },
})

function CalloutComponent({ node, updateAttributes }) {
  return (
    <NodeViewWrapper className={`callout callout-${node.attrs.type}`}>
      <select
        value={node.attrs.type}
        onChange={e => updateAttributes({ type: e.target.value })}
      >
        <option value="info">Info</option>
        <option value="warning">Warning</option>
      </select>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  )
}
```

### Content Serialization

```typescript
// For saving to .serq.html
function serializeDocument(editor: Editor): string {
  const html = editor.getHTML()
  const metadata: SerqMetadata = {
    version: '1.0',
    created: new Date().toISOString(),
    presets: store.getState().activePresets,
    wordCount: editor.storage.characterCount?.words() ?? 0,
  }

  // Embed metadata as JSON in a script tag
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="generator" content="SERQ">
  <script type="application/json" id="serq-metadata">
    ${JSON.stringify(metadata, null, 2)}
  </script>
  <style>${generateStylesFromPresets(metadata.presets)}</style>
</head>
<body class="serq-document">
  ${html}
</body>
</html>`
}

// For opening .serq.html
function parseDocument(fileContent: string): { html: string, metadata: SerqMetadata } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(fileContent, 'text/html')

  const metadataScript = doc.getElementById('serq-metadata')
  const metadata = metadataScript
    ? JSON.parse(metadataScript.textContent || '{}')
    : { version: '1.0', presets: getDefaultPresets() }

  const body = doc.querySelector('.serq-document')
  const html = body?.innerHTML || fileContent

  return { html, metadata }
}
```

---

## Tauri Backend Patterns

### Project Structure

```
serq/
├── src/                      # React frontend
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── EditorCore.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── extensions/
│   │   ├── Panels/
│   │   │   ├── StylePanel.tsx
│   │   │   ├── OutlinePanel.tsx
│   │   │   └── VersionHistory.tsx
│   │   └── App.tsx
│   ├── stores/
│   │   ├── fileStore.ts
│   │   ├── presetStore.ts
│   │   └── uiStore.ts
│   ├── hooks/
│   │   └── useTauriCommands.ts
│   └── main.tsx
│
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs          # Entry point (desktop)
│   │   ├── lib.rs           # Entry point (mobile) + command registration
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── file.rs      # File operations
│   │   │   ├── versions.rs  # Version history
│   │   │   └── ai.rs        # Claude API integration
│   │   ├── models/
│   │   │   ├── mod.rs
│   │   │   ├── document.rs
│   │   │   └── version.rs
│   │   └── state.rs         # AppState management
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── presets/                  # Style preset JSON files
│   ├── typography/
│   ├── colors/
│   └── layouts/
│
└── package.json
```

### Command Registration Pattern

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

mod commands;
mod models;
mod state;

use commands::{file, versions, ai};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // File operations
            file::open_document,
            file::save_document,
            file::get_recent_files,
            // Version history
            versions::save_version,
            versions::get_versions,
            versions::restore_version,
            versions::prune_old_versions,
            // AI stylization
            ai::stylize_content,
            ai::get_api_key_status,
            ai::set_api_key,
        ])
        .setup(|app| {
            // Initialize SQLite for version history
            let app_data = app.path().app_data_dir()?;
            state::init_database(&app_data)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### File Operations Command

```rust
// src-tauri/src/commands/file.rs
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct SerqDocument {
    pub html: String,
    pub metadata: SerqMetadata,
    pub path: PathBuf,
}

#[derive(Serialize, Deserialize)]
pub struct SerqMetadata {
    pub version: String,
    pub created: String,
    pub modified: String,
    pub presets: PresetConfig,
    pub word_count: usize,
}

#[tauri::command]
pub async fn open_document(path: PathBuf) -> Result<SerqDocument, String> {
    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Parse .serq.html format
    let (html, metadata) = parse_serq_html(&content)?;

    Ok(SerqDocument { html, metadata, path })
}

#[tauri::command]
pub async fn save_document(
    path: PathBuf,
    html: String,
    metadata: SerqMetadata,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let content = serialize_serq_html(&html, &metadata);

    tokio::fs::write(&path, &content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;

    // Trigger version save
    state.mark_saved(&path).await;

    Ok(())
}
```

### Version History with SQLite

```rust
// src-tauri/src/commands/versions.rs
use sqlx::{SqlitePool, Row};

#[derive(Serialize)]
pub struct VersionSummary {
    pub id: i64,
    pub timestamp: String,
    pub word_count: usize,
    pub is_auto_save: bool,
}

#[tauri::command]
pub async fn save_version(
    path: PathBuf,
    content: String,
    is_auto_save: bool,
    state: tauri::State<'_, AppState>,
) -> Result<i64, String> {
    let pool = state.db_pool();

    let word_count = content.split_whitespace().count();
    let content_hash = blake3::hash(content.as_bytes()).to_hex().to_string();

    let result = sqlx::query(
        "INSERT INTO versions (path, timestamp, content_hash, content, word_count, is_auto_save)
         VALUES (?, datetime('now'), ?, ?, ?, ?)"
    )
    .bind(path.to_string_lossy().to_string())
    .bind(&content_hash)
    .bind(&content)
    .bind(word_count as i64)
    .bind(is_auto_save)
    .execute(pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn get_versions(
    path: PathBuf,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<VersionSummary>, String> {
    let pool = state.db_pool();

    let versions = sqlx::query_as::<_, VersionSummary>(
        "SELECT id, timestamp, word_count, is_auto_save
         FROM versions
         WHERE path = ?
         ORDER BY timestamp DESC
         LIMIT 100"
    )
    .bind(path.to_string_lossy().to_string())
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    Ok(versions)
}
```

### Claude API Integration

```rust
// src-tauri/src/commands/ai.rs
use reqwest::Client;
use futures_util::StreamExt;
use tokio::sync::mpsc;

#[derive(Serialize, Deserialize)]
pub struct StylizeRequest {
    pub content: String,
    pub preset_hints: Option<PresetHints>,
}

#[derive(Serialize)]
pub struct StylizeResult {
    pub stylized_html: String,
    pub applied_formats: Vec<FormatChange>,
}

#[tauri::command]
pub async fn stylize_content(
    request: StylizeRequest,
    window: tauri::Window,
    state: tauri::State<'_, AppState>,
) -> Result<StylizeResult, String> {
    let api_key = state.get_api_key()
        .ok_or("Claude API key not configured")?;

    let client = Client::new();

    let prompt = build_stylization_prompt(&request.content, &request.preset_hints);

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&serde_json::json!({
            "model": "claude-sonnet-4-5",
            "max_tokens": 4096,
            "stream": true,
            "messages": [{
                "role": "user",
                "content": prompt
            }]
        }))
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    // Stream response back to frontend via events
    let mut stream = response.bytes_stream();
    let mut accumulated = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);

        // Parse SSE format
        for line in text.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(event) = serde_json::from_str::<StreamEvent>(data) {
                    if let Some(delta) = event.get_text_delta() {
                        accumulated.push_str(&delta);
                        // Emit progress to frontend
                        window.emit("ai-progress", &delta).ok();
                    }
                }
            }
        }
    }

    // Parse Claude's structured output
    let result = parse_stylization_result(&accumulated)?;

    Ok(result)
}
```

---

## State Management Architecture

### Zustand Store Structure

```typescript
// stores/index.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FileState {
  currentFile: {
    path: string | null
    name: string
    isDirty: boolean
    lastSaved: Date | null
  }
  recentFiles: string[]
}

interface PresetState {
  activePresets: {
    typography: TypographyPreset
    colors: ColorPreset
    layout: LayoutPreset
  }
  availablePresets: {
    typography: TypographyPreset[]
    colors: ColorPreset[]
    layouts: LayoutPreset[]
  }
}

interface UIState {
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  focusMode: boolean
  typewriterMode: boolean
  commandPaletteOpen: boolean
}

// Split into domain stores for performance
export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      currentFile: { path: null, name: 'Untitled', isDirty: false, lastSaved: null },
      recentFiles: [],
      // actions
      setCurrentFile: (file) => set({ currentFile: file }),
      markDirty: () => set((s) => ({
        currentFile: { ...s.currentFile, isDirty: true }
      })),
      markSaved: () => set((s) => ({
        currentFile: { ...s.currentFile, isDirty: false, lastSaved: new Date() }
      })),
    }),
    { name: 'serq-file-state' }
  )
)

export const usePresetStore = create<PresetState>()(
  persist(
    (set) => ({
      activePresets: {
        typography: DEFAULT_TYPOGRAPHY,
        colors: DEFAULT_COLORS,
        layout: DEFAULT_LAYOUT,
      },
      availablePresets: { typography: [], colors: [], layouts: [] },
      // actions
      setTypography: (preset) => set((s) => ({
        activePresets: { ...s.activePresets, typography: preset }
      })),
      setColors: (preset) => set((s) => ({
        activePresets: { ...s.activePresets, colors: preset }
      })),
      setLayout: (preset) => set((s) => ({
        activePresets: { ...s.activePresets, layout: preset }
      })),
    }),
    { name: 'serq-presets' }
  )
)

export const useUIStore = create<UIState>()((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  focusMode: false,
  typewriterMode: false,
  commandPaletteOpen: false,
  // actions
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  enterFocusMode: () => set({ focusMode: true, leftSidebarOpen: false, rightSidebarOpen: false }),
  exitFocusMode: () => set({ focusMode: false }),
}))
```

---

## Style/Theme System Architecture

### CSS Variables Pattern

```css
/* styles/variables.css */
:root {
  /* Typography tokens (populated by preset) */
  --serq-font-heading: var(--preset-font-heading, 'Inter');
  --serq-font-body: var(--preset-font-body, 'Inter');
  --serq-font-mono: var(--preset-font-mono, 'JetBrains Mono');

  --serq-size-h1: var(--preset-size-h1, 2.5rem);
  --serq-size-h2: var(--preset-size-h2, 2rem);
  --serq-size-body: var(--preset-size-body, 1rem);
  --serq-line-height: var(--preset-line-height, 1.6);

  /* Color tokens (populated by preset) */
  --serq-bg-canvas: var(--preset-bg-canvas, #ffffff);
  --serq-bg-surface: var(--preset-bg-surface, #f8f9fa);
  --serq-text-primary: var(--preset-text-primary, #1a1a1a);
  --serq-text-secondary: var(--preset-text-secondary, #6b7280);
  --serq-accent: var(--preset-accent, #3b82f6);

  /* Layout tokens (populated by preset) */
  --serq-canvas-width: var(--preset-canvas-width, 720px);
  --serq-canvas-padding: var(--preset-canvas-padding, 2rem);
  --serq-paragraph-spacing: var(--preset-paragraph-spacing, 1.5em);
}

/* Dark mode handled via preset, not media query */
[data-theme="dark"] {
  --serq-bg-canvas: var(--preset-bg-canvas-dark, #0f0f0f);
  --serq-text-primary: var(--preset-text-primary-dark, #e5e5e5);
  /* ... */
}
```

### Preset Application

```typescript
// hooks/usePresetStyles.ts
import { useEffect } from 'react'
import { usePresetStore } from '@/stores'

export function usePresetStyles() {
  const { typography, colors, layout } = usePresetStore(s => s.activePresets)

  useEffect(() => {
    const root = document.documentElement

    // Apply typography tokens
    root.style.setProperty('--preset-font-heading', typography.fontHeading)
    root.style.setProperty('--preset-font-body', typography.fontBody)
    root.style.setProperty('--preset-size-h1', typography.sizeH1)
    // ... etc

    // Apply color tokens
    root.style.setProperty('--preset-bg-canvas', colors.bgCanvas)
    root.style.setProperty('--preset-text-primary', colors.textPrimary)
    root.style.setProperty('--preset-accent', colors.accent)
    // ... etc

    // Apply layout tokens
    root.style.setProperty('--preset-canvas-width', layout.canvasWidth)
    root.style.setProperty('--preset-canvas-padding', layout.canvasPadding)

  }, [typography, colors, layout])
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mirroring Document in Zustand

**What:** Storing the full document content in Zustand alongside TipTap
**Why bad:** Double state, synchronization bugs, performance death
**Instead:** TipTap owns document state. Zustand only tracks metadata (dirty flag, path, presets).

### Anti-Pattern 2: Synchronous IPC for Large Data

**What:** Using `invoke()` synchronously for file reads/writes
**Why bad:** Blocks the main thread, freezes UI
**Instead:** All file operations are async Rust commands. Use loading states in UI.

### Anti-Pattern 3: Re-rendering Editor on App State Changes

**What:** Having the editor component subscribe to global state
**Why bad:** TipTap re-renders on every keystroke. Additional subscriptions multiply the pain.
**Instead:** Isolate `EditorCore` component. Pass callbacks up, not state down.

### Anti-Pattern 4: Storing API Keys in Frontend

**What:** Keeping Claude API key in localStorage or Zustand
**Why bad:** Accessible via DevTools, trivially extractable
**Instead:** Store in Rust backend using platform keychain (Stronghold plugin or keyring crate). Frontend never sees the raw key.

### Anti-Pattern 5: Full Document Saves for Auto-Save

**What:** Writing the entire file to disk on every auto-save
**Why bad:** Disk thrashing, slow for large documents
**Instead:** Save to SQLite version history. Periodically consolidate to actual file.

---

## Build Order Implications

Based on component dependencies, recommended implementation order:

### Phase 1: Foundation (Must Build First)
1. **Tauri project setup** - Rust backend scaffold
2. **TipTap editor with basic extensions** - Core editing capability
3. **Zustand stores** - State management foundation
4. **File open/save commands** - Basic file I/O
5. **.serq.html format** - Document serialization

**Dependencies:** Everything else depends on these being stable.

### Phase 2: Core Features
6. **Style preset system** - CSS variables + preset loading
7. **Custom block extensions** - Callout, columns, embeds
8. **Auto-save** - Background saving with dirty tracking
9. **SQLite version history** - Version storage infrastructure

**Dependencies:** Requires Phase 1 complete. Presets depend on editor. Versions depend on file ops.

### Phase 3: Advanced Features
10. **Time Machine UI** - Version browsing and recovery
11. **AI stylization** - Claude API integration
12. **Command palette** - Keyboard-driven interface
13. **Advanced panels** - Outline, comments, style browser

**Dependencies:** Requires Phase 2 version history. AI requires working editor + file ops.

---

## Security Considerations

| Concern | Implementation |
|---------|---------------|
| API key storage | Use `tauri-plugin-stronghold` or platform keychain via Rust |
| File system access | Scope FS plugin to user's Documents folder + explicit paths |
| IPC validation | Validate all inputs in Rust commands, never trust frontend |
| Content injection | Sanitize HTML when parsing external .html files |
| CSP | Configure strict CSP in `tauri.conf.json` |

---

## Performance Considerations

| Concern | At 10 pages | At 100 pages | At 500+ pages |
|---------|-------------|--------------|---------------|
| Editor render | Instant | Slight delay on load | Consider virtualization |
| Auto-save | Imperceptible | ~100ms | Debounce to 5s, diff-based |
| Version history | Instant browse | SQLite indexed | Paginate, lazy load content |
| Style switching | Instant | Instant | Instant (CSS vars only) |

---

## Sources

### TipTap
- [TipTap React Installation](https://tiptap.dev/docs/editor/getting-started/install/react)
- [TipTap React Node Views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)
- [TipTap Undo/Redo](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo)
- [TipTap Export JSON/HTML](https://tiptap.dev/docs/guides/output-json-html)
- [TipTap Performance Guide](https://tiptap.dev/docs/guides/performance)

### Tauri
- [Tauri Architecture](https://v2.tauri.app/concept/architecture/)
- [Tauri Project Structure](https://v2.tauri.app/start/project-structure/)
- [Tauri Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/)
- [Tauri File System Plugin](https://v2.tauri.app/plugin/file-system/)
- [Tauri SQL Plugin](https://v2.tauri.app/plugin/sql/)
- [Tauri Stronghold Plugin](https://v2.tauri.app/plugin/stronghold/)
- [Tauri Security](https://v2.tauri.app/security/)

### State Management
- [Zustand Documentation](https://zustand.docs.pmnd.rs/getting-started/comparison)
- [State Management 2026 Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)

### Claude API
- [Claude Streaming Messages](https://platform.claude.com/docs/en/build-with-claude/streaming)

### Architecture Patterns
- [CSS Variables for React (Josh Comeau)](https://www.joshwcomeau.com/css/css-variables-for-react-devs/)
- [Time Machine Architecture](https://eclecticlight.co/2020/02/13/time-machine-13-backups-and-versions/)
