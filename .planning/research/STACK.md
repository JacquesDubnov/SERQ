# Technology Stack

**Project:** SERQ Document Editor
**Researched:** 2026-01-30
**Confidence:** HIGH (verified via npm, official docs, Context7)

---

## Executive Summary

For a TipTap-based document editor shipping as a native macOS app in 2 weeks, this stack prioritizes:

1. **Maximum leverage** - Use existing open-source code, skip reinventing
2. **Zero subscription lock-in** - No TipTap Cloud dependencies
3. **Direct AI integration** - Claude API through Rust backend, not TipTap's paid extensions
4. **Battle-tested foundation** - Tauri 2.x + React 19 + TipTap 3.x

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tauri | 2.9.6 | Desktop runtime | 10x smaller than Electron, Rust backend, native performance |
| React | 19.x | UI framework | Hooks-based, massive ecosystem, React Compiler for auto-memoization |
| TypeScript | 5.x | Type safety | Catch bugs at compile time, TipTap has excellent TS support |
| Vite | 7.x | Build tool | Fast HMR, Tauri's recommended bundler |
| TipTap | 3.18.0 | Editor core | Headless, extensible, MIT licensed |

### Editor Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tiptap/core | 3.18.0 | Editor engine | ProseMirror abstraction with clean extension API |
| @tiptap/pm | 3.18.0 | ProseMirror access | Direct access when needed for custom behavior |
| @tiptap/react | 3.18.0 | React bindings | useEditor hook, NodeViewWrapper components |
| @tiptap/starter-kit | 3.18.0 | Base extensions | Bold, italic, headings, lists - all table stakes |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Global UI state | Minimal boilerplate, works great with React 19 |
| TanStack Query | 5.x | Async state | File operations, AI requests - automatic caching/retry |
| Jotai | 2.x | Atomic state | For style presets, theme state - derived state is clean |

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility CSS | Rapid styling, design system integration |
| shadcn/ui | latest | UI components | Not a dependency - copy-paste components, full control |
| Lucide React | latest | Icons | Clean, consistent icon set |

### Backend (Rust)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| anthropic-sdk-rust | 0.1.x | Claude API | Full Messages API, streaming, tools support |
| tauri-specta | latest | Type generation | Auto-generate TS types from Rust commands |
| serde | 1.x | Serialization | JSON handling for document format |
| tokio | 1.x | Async runtime | Required for async Claude API calls |

### Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| tauri-plugin-fs | 2.x | File operations | Native file save/load, drag-drop |
| tauri-plugin-dialog | 2.x | File dialogs | Save As, Open dialogs |
| tauri-plugin-store | 2.x | Settings | User preferences, recent files |
| rusqlite | 0.31.x | Version history | SQLite for document versions, not JSON files |

---

## TipTap Extensions - Complete Analysis

### FREE Extensions (Use These)

All at version 3.18.0, MIT licensed, no account required.

#### Starter Kit (Bundle)
The `@tiptap/starter-kit` includes everything in one install:

| Extension | What It Does | Include? |
|-----------|--------------|----------|
| Document | Root document node | YES |
| Paragraph | Text paragraphs | YES |
| Text | Text content | YES |
| Heading | H1-H6 headers | YES |
| Bold | **bold** text | YES |
| Italic | *italic* text | YES |
| Strike | ~~strikethrough~~ | YES |
| Code | `inline code` | YES |
| CodeBlock | Multi-line code | YES |
| Blockquote | > quoted text | YES |
| BulletList | - unordered lists | YES |
| OrderedList | 1. numbered lists | YES |
| ListItem | List item wrapper | YES |
| HardBreak | Shift+Enter line break | YES |
| HorizontalRule | --- dividers | YES |
| Dropcursor | Visual drop indicator | YES |
| Gapcursor | Cursor between blocks | YES |
| History | Undo/redo (100 steps) | YES |

**Install:** `npm install @tiptap/starter-kit`

#### Essential Additions

| Extension | Package | What It Does | Priority |
|-----------|---------|--------------|----------|
| Underline | @tiptap/extension-underline | Underlined text | HIGH |
| Link | @tiptap/extension-link | Hyperlinks with preview | HIGH |
| Image | @tiptap/extension-image | Inline images | HIGH |
| Highlight | @tiptap/extension-highlight | Background color on text | HIGH |
| TextAlign | @tiptap/extension-text-align | Left/center/right/justify | HIGH |
| TextStyle | @tiptap/extension-text-style | Span wrapper for styling | HIGH |
| Color | @tiptap/extension-color | Text color | HIGH |
| FontFamily | @tiptap/extension-font-family | Font selection | HIGH |
| Placeholder | @tiptap/extension-placeholder | Empty state hint text | HIGH |
| CharacterCount | @tiptap/extension-character-count | Word/char counters | MEDIUM |
| Typography | @tiptap/extension-typography | Smart quotes, dashes | MEDIUM |
| Subscript | @tiptap/extension-subscript | H₂O subscript | MEDIUM |
| Superscript | @tiptap/extension-superscript | E=mc² superscript | MEDIUM |

#### Tables (Critical for Documents)

| Extension | Package | What It Does |
|-----------|---------|--------------|
| Table | @tiptap/extension-table | Table container |
| TableRow | @tiptap/extension-table-row | Row wrapper |
| TableCell | @tiptap/extension-table-cell | Data cells |
| TableHeader | @tiptap/extension-table-header | Header cells |

**Or use:** `@tiptap/extension-table-kit` (bundles all four)

#### Task Lists

| Extension | Package | What It Does |
|-----------|---------|--------------|
| TaskList | @tiptap/extension-task-list | Checkbox list container |
| TaskItem | @tiptap/extension-task-item | Individual checkbox items |

#### Embeds

| Extension | Package | What It Does | Priority |
|-----------|---------|--------------|----------|
| Youtube | @tiptap/extension-youtube | YouTube video embeds | HIGH |
| Mention | @tiptap/extension-mention | @mentions with suggestions | LOW |

#### Recently Open-Sourced (June 2025)

These were Pro extensions, now FREE under MIT:

| Extension | Package | What It Does | Priority |
|-----------|---------|--------------|----------|
| DragHandle | @tiptap/extension-drag-handle | Drag blocks around | HIGH |
| FileHandler | @tiptap/extension-file-handler | Drag-drop file handling | HIGH |
| Details | @tiptap/extension-details | Collapsible sections | MEDIUM |
| DetailsContent | @tiptap/extension-details-content | Collapsible inner content | MEDIUM |
| DetailsSummary | @tiptap/extension-details-summary | Collapsible header | MEDIUM |
| Emoji | @tiptap/extension-emoji | Emoji picker/rendering | LOW |
| InvisibleCharacters | @tiptap/extension-invisible-characters | Show spaces/breaks | LOW |
| Mathematics | @tiptap/extension-mathematics | LaTeX math rendering | MEDIUM |
| TableOfContents | @tiptap/extension-table-of-contents | Auto-generated TOC | HIGH |
| UniqueID | @tiptap/extension-unique-id | Node IDs for linking | MEDIUM |

#### Bubble/Floating Menus

| Extension | Package | What It Does |
|-----------|---------|--------------|
| BubbleMenu | @tiptap/extension-bubble-menu | Floating toolbar on selection |
| FloatingMenu | @tiptap/extension-floating-menu | Menu on empty lines |

#### Not Included in Starter Kit But Useful

| Extension | Package | What It Does | Priority |
|-----------|---------|--------------|----------|
| Focus | @tiptap/extension-focus | Track focused node | LOW |
| Selection | Built-in | Preserve selection on blur | Auto |

### PRO Extensions (Evaluation)

**Verdict: SKIP the Pro extensions. Build AI integration yourself.**

| Extension | What It Does | Cost | Our Alternative |
|-----------|--------------|------|-----------------|
| AI Generation | AI text generation | $149+/mo (Start plan) | Build with Claude API |
| AI Agent | AI that edits documents | $149+/mo | Build with Claude API |
| AI Suggestion | Autocomplete | $149+/mo | Build with Claude API |
| Comments | Inline commenting | $149+/mo | Not needed for v1 |
| Collaboration | Real-time multi-user | $149+/mo | Not needed for v1 |
| Snapshot | Version history | $149+/mo | Build with SQLite |
| Pages | Pagination UI | Team plan ($999+/mo) | Build custom |
| Export | DOCX/ODT export | $149+/mo | Not needed (HTML-native) |
| Import | DOCX/ODT import | $149+/mo | Consider for v2 |

**Why skip:**
1. **Cost** - $149/mo minimum, scales with docs
2. **Lock-in** - Depends on TipTap Cloud
3. **Overkill** - AI integration is 50 lines with Claude API
4. **v1 scope** - Collaboration/comments not needed yet

**When to reconsider:**
- If you need real-time collaboration (Hocuspocus is open-source, but complex)
- If you need DOCX import/export (their converter is solid)

---

## Community Extensions Worth Using

From [awesome-tiptap](https://github.com/ueberdosis/awesome-tiptap):

| Extension | Package | What It Does | Stars | Use? |
|-----------|---------|--------------|-------|------|
| tiptap-search-and-replace | @sereneinserenade/tiptap-search-n-replace | Find & replace | 200+ | YES |
| tiptap-media-resize | @sereneinserenade/tiptap-media-resize | Resize images/videos | 150+ | YES |
| tiptap-text-direction | @amirhhashemi/tiptap-text-direction | RTL/LTR support | 100+ | MAYBE |
| tiptap-extension-figure | @pentestpad/tiptap-extension-figure | Image captions | 50+ | YES |
| tiptap-footnotes | @buttondown/tiptap-footnotes | Footnote support | 50+ | MAYBE |
| tiptap-extension-code-block-shiki | @aolyang/tiptap-extension-code-block-shiki | Syntax highlighting | 100+ | YES |
| tiptap-global-drag-handle | @niclas/tiptap-extension-global-drag-handle | Better drag handle UI | 100+ | MAYBE (official now exists) |

---

## Open Source Projects to Learn From

### 1. Novel (Best Reference)

**Repo:** [github.com/steven-tey/novel](https://github.com/steven-tey/novel)
**Stars:** 13k+
**License:** Apache-2.0

**What to steal:**
- Notion-style block interface
- AI autocompletion pattern (Vercel AI SDK approach)
- Slash command menu implementation
- Clean TipTap configuration

**Stack:** Next.js, TipTap, Tailwind, OpenAI

**Limitation:** Web-only, no desktop considerations

### 2. Umo Editor

**Repo:** [github.com/umodoc/editor](https://github.com/umodoc/editor)
**Stars:** 2k+
**License:** MIT

**What to steal:**
- Word-like pagination approach
- Export/print functionality
- Toolbar organization
- Vue3 (adapt patterns to React)

**Limitation:** Vue3-based, would need conversion

### 3. Luke Desktop

**Repo:** [github.com/DrJonBrock/luke-desktop](https://github.com/DrJonBrock/luke-desktop)
**Stars:** 500+
**License:** MIT

**What to steal:**
- Tauri + React + TypeScript patterns
- Claude API integration approach
- MCP protocol implementation

**Limitation:** Chat interface, not document editor

### 4. Tauri Template (Best Starter)

**Repo:** [github.com/dannysmith/tauri-template](https://github.com/dannysmith/tauri-template)
**Stars:** 1k+
**License:** MIT

**What to steal:**
- Complete Tauri 2 + React 19 + TypeScript setup
- tauri-specta for type-safe Rust-TS bridge
- State management pattern (useState → Zustand → TanStack Query)
- Command palette implementation
- Cross-platform considerations

**Highly recommended as starting point.**

### 5. Claudia

**Repo:** [github.com/winfunc/claudia](https://github.com/winfunc/claudia) (private, but docs at claudia.so)
**License:** MIT

**What to steal:**
- Tauri 2 + Claude API integration
- Token usage tracking UI
- Settings/preferences architecture

---

## AI Integration Approach

### Recommended: Direct Claude API via Rust

**Why not TipTap's AI extensions:**
- Requires $149+/mo subscription
- Locked to TipTap Cloud
- We want Claude specifically, not OpenAI default

**Architecture:**

```
React Frontend                    Rust Backend (Tauri)
┌─────────────────┐              ┌──────────────────────┐
│ TipTap Editor   │  invoke()    │ Tauri Commands       │
│ + Custom AI     │ ──────────►  │ + anthropic-sdk-rust │
│   Commands      │              │ + Streaming support  │
└─────────────────┘              └──────────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────────┐
                                 │ Claude API           │
                                 │ (claude-sonnet-4)    │
                                 └──────────────────────┘
```

**Rust backend command:**

```rust
// src-tauri/src/commands/ai.rs
use anthropic_sdk_rust::{Client, MessageCreateBuilder, StreamEvent};
use tauri::ipc::Channel;

#[tauri::command]
pub async fn stylize_text(
    text: String,
    style: String,
    channel: Channel<String>,
) -> Result<(), String> {
    let client = Client::new();

    let request = MessageCreateBuilder::default()
        .model("claude-sonnet-4-20250514")
        .max_tokens(4096)
        .system(format!("Rewrite the following text in {} style. Output only the rewritten text.", style))
        .user_message(&text)
        .stream(true)
        .build()
        .map_err(|e| e.to_string())?;

    let mut stream = client.messages().create_stream(request).await
        .map_err(|e| e.to_string())?;

    while let Some(event) = stream.next().await {
        if let StreamEvent::ContentBlockDelta { delta, .. } = event {
            channel.send(delta.text).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}
```

**React hook:**

```typescript
// src/hooks/useAI.ts
import { invoke } from '@tauri-apps/api/core';
import { Channel } from '@tauri-apps/api/core';

export function useAI() {
  const stylizeText = async (
    text: string,
    style: string,
    onChunk: (chunk: string) => void
  ) => {
    const channel = new Channel<string>();
    channel.onmessage = onChunk;

    await invoke('stylize_text', { text, style, channel });
  };

  return { stylizeText };
}
```

**TipTap command:**

```typescript
// src/extensions/ai-stylize.ts
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const AIStylize = Extension.create({
  name: 'aiStylize',

  addCommands() {
    return {
      stylizeSelection: (style: string) => ({ editor, tr }) => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to);

        // Invoke Tauri command with streaming
        // Insert result back into editor

        return true;
      },
    };
  },
});
```

---

## Version History Approach

### Recommended: SQLite + Custom UI

**Why not TipTap's Snapshot extension:**
- Requires paid subscription
- Requires Y.js/collaboration infrastructure
- Overkill for single-user

**Architecture:**

```sql
-- SQLite schema
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,  -- JSON/HTML
  created_at INTEGER NOT NULL,
  auto_save BOOLEAN DEFAULT TRUE,
  label TEXT,  -- User-defined checkpoint name
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE INDEX idx_versions_document ON versions(document_id, created_at DESC);
```

**Auto-save strategy:**
- Save version every 30 seconds IF content changed
- Keep last 100 versions per document
- Allow user-named checkpoints
- "Time Machine" UI browses versions

---

## Installation Commands

### Initialize Project

```bash
# Create Tauri + React + TypeScript project
npm create tauri-app@latest serq -- --template react-ts

cd serq

# Install TipTap core
npm install @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit

# Essential extensions
npm install @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image
npm install @tiptap/extension-highlight @tiptap/extension-text-align
npm install @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-font-family
npm install @tiptap/extension-placeholder @tiptap/extension-character-count
npm install @tiptap/extension-typography @tiptap/extension-subscript @tiptap/extension-superscript

# Tables
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header

# Task lists
npm install @tiptap/extension-task-list @tiptap/extension-task-item

# Embeds
npm install @tiptap/extension-youtube

# Recently open-sourced (verify availability)
npm install @tiptap/extension-drag-handle @tiptap/extension-file-handler
npm install @tiptap/extension-details @tiptap/extension-details-content @tiptap/extension-details-summary
npm install @tiptap/extension-table-of-contents @tiptap/extension-unique-id

# Menus
npm install @tiptap/extension-bubble-menu @tiptap/extension-floating-menu

# Community extensions
npm install @sereneinserenade/tiptap-search-n-replace
npm install @sereneinserenade/tiptap-media-resize

# State management
npm install zustand @tanstack/react-query jotai

# Styling
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react

# Tauri plugins (run in src-tauri directory)
cd src-tauri
cargo add tauri-plugin-fs tauri-plugin-dialog tauri-plugin-store
cargo add rusqlite --features bundled
cargo add anthropic-sdk-rust tokio --features tokio/rt-multi-thread,tokio/macros
cargo add serde --features derive
cargo add tauri-specta
cd ..
```

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Electron | 10x bundle size, memory hog |
| Slate.js | Less mature than TipTap, worse ecosystem |
| Quill | Not headless, hard to customize |
| Draft.js | Facebook deprecated, React 18+ issues |
| TipTap Pro AI | $149+/mo, locked to TipTap Cloud |
| TipTap Collaboration | Not needed for v1, adds complexity |
| PouchDB | Overkill, SQLite is simpler for local-first |
| IndexedDB | Not as reliable for documents, use SQLite |
| Redux | Overkill, Zustand is simpler |
| CSS-in-JS (Emotion/Styled) | Tailwind is faster for rapid iteration |

---

## Sources

**HIGH Confidence (Official/npm verified):**
- [TipTap Extensions Overview](https://tiptap.dev/docs/editor/extensions/overview)
- [TipTap Open-Sourcing Announcement](https://tiptap.dev/blog/release-notes/were-open-sourcing-more-of-tiptap)
- [Tauri v2 Create Project](https://v2.tauri.app/start/create-project/)
- [Tauri FS Plugin](https://v2.tauri.app/plugin/file-system/)
- [TipTap Pricing](https://tiptap.dev/pricing)
- npm package versions verified via `npm view`

**MEDIUM Confidence (GitHub/Community):**
- [awesome-tiptap](https://github.com/ueberdosis/awesome-tiptap)
- [Novel](https://github.com/steven-tey/novel)
- [tauri-template](https://github.com/dannysmith/tauri-template)
- [anthropic-sdk-rust](https://github.com/dimichgh/anthropic-sdk-rust)

**LOW Confidence (Web search only):**
- Community extension compatibility with TipTap 3.x (verify before using)
