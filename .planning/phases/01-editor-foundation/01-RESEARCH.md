# Phase 1: Editor Foundation - Research

**Researched:** 2026-01-30
**Domain:** TipTap 3.x + Tauri 2.x + React 19 Desktop Editor
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational architecture for SERQ: a Tauri 2 desktop app with TipTap 3.18 as the editor core and React 19 for the UI layer. The research confirms three critical patterns that MUST be implemented correctly from day one or they will poison all subsequent work:

1. **Single Editor Instance** - Create ONE TipTap editor at app startup, reuse via `setContent()` for document switching. Never recreate. Memory leaks are real and documented.

2. **Performance Configuration** - TipTap 3.x defaults to `shouldRerenderOnTransaction: false`, but explicitly set it. Use `useEditorState` with selectors for toolbar state. Isolate editor in its own component.

3. **Schema Validation** - Enable `enableContentCheck: true` with `onContentError` handler from day one. Invalid content from paste/import will silently corrupt documents otherwise.

The tech stack is validated: Tauri 2.9.6 + React 19 + TipTap 3.18.0 are compatible, with one caveat - TipTap's UI Components work best with React 18, but core editor functionality works with React 19. For SERQ's headless approach (custom UI), this is not a blocker.

**Primary recommendation:** Use the [dannysmith/tauri-template](https://github.com/dannysmith/tauri-template) as the starter, add TipTap with the critical performance configuration, and implement click-anywhere cursor via a custom click handler on the editor wrapper.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tauri | 2.9.6 | Desktop runtime | 10x smaller than Electron, Rust backend, native file dialogs |
| @tauri-apps/api | 2.x | Frontend IPC | Type-safe communication with Rust backend |
| React | 19.x | UI framework | Hooks-based, massive ecosystem, React Compiler support |
| TypeScript | 5.x | Type safety | TipTap has excellent TS support |
| Vite | 7.x | Build tool | Fast HMR, Tauri's recommended bundler |
| @tiptap/core | 3.18.0 | Editor engine | ProseMirror abstraction with clean extension API |
| @tiptap/react | 3.18.0 | React bindings | useEditor hook, NodeViewWrapper components |
| @tiptap/starter-kit | 3.18.0 | Base extensions | 16 essential extensions bundled |
| @tiptap/pm | 3.18.0 | ProseMirror access | Direct access for custom behavior |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.x | App state | UI state, file metadata, presets |
| Tailwind CSS | 4.x | Styling | Rapid iteration, shadcn/ui compatibility |
| @tiptap/extension-underline | 3.18.0 | Underline mark | Basic formatting |
| @tiptap/extension-link | 3.18.0 | Hyperlinks | Link insertion with Cmd+K |
| @tiptap/extension-highlight | 3.18.0 | Text highlight | Background color on text |
| @tiptap/extension-text-align | 3.18.0 | Alignment | Left/center/right/justify |
| @tiptap/extension-text-style | 3.18.0 | Span wrapper | Required for Color extension |
| @tiptap/extension-color | 3.18.0 | Text color | Font color picker |
| @tiptap/extension-placeholder | 3.18.0 | Empty state | "Start writing..." hint |
| @tiptap/extension-character-count | 3.18.0 | Word count | Status bar statistics |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tauri 2.x | Electron | 10x larger bundle, more permissive but slower |
| TipTap 3.x | Slate.js | Less mature ecosystem, more manual work |
| Zustand | Redux | Redux is overkill for SERQ's state complexity |
| Vite | Next.js | Next.js adds SSR complexity not needed for desktop |

**Installation:**
```bash
# From dannysmith/tauri-template or fresh create-tauri-app
npm install @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit

# Essential extensions
npm install @tiptap/extension-underline @tiptap/extension-link
npm install @tiptap/extension-highlight @tiptap/extension-text-align
npm install @tiptap/extension-text-style @tiptap/extension-color
npm install @tiptap/extension-placeholder @tiptap/extension-character-count
npm install @tiptap/extension-subscript @tiptap/extension-superscript

# State management (if not using tauri-template)
npm install zustand

# Styling (if not using tauri-template)
npm install -D tailwindcss postcss autoprefixer
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── Editor/
│   │   ├── EditorCore.tsx       # Isolated TipTap instance
│   │   ├── EditorToolbar.tsx    # Formatting toolbar
│   │   ├── EditorWrapper.tsx    # Click-anywhere handler
│   │   └── extensions/          # Custom extensions
│   ├── Layout/
│   │   ├── AppShell.tsx         # Main layout
│   │   └── Canvas.tsx           # Responsive canvas container
│   └── ui/                      # shadcn/ui components
├── stores/
│   ├── editorStore.ts           # Editor-related state
│   └── uiStore.ts               # UI state (sidebar, focus mode)
├── hooks/
│   ├── useEditorInstance.ts     # Singleton editor access
│   └── useToolbarState.ts       # Toolbar active states
├── styles/
│   └── editor.css               # TipTap-specific styles
└── main.tsx
```

### Pattern 1: Single Editor Instance (CRITICAL)

**What:** Create ONE editor at app startup, never recreate
**When to use:** Always - this is the only correct pattern
**Example:**
```typescript
// Source: TipTap GitHub Issues + Official Performance Guide
// EditorCore.tsx - Created once, mounted at app root

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

interface EditorCoreProps {
  onUpdate?: (html: string) => void
}

export function EditorCore({ onUpdate }: EditorCoreProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 100, newGroupDelay: 500 }
      }),
      // Add other extensions here
    ],
    content: '<p>Start writing...</p>',

    // CRITICAL: Performance configuration
    immediatelyRender: true, // Desktop app, not SSR
    shouldRerenderOnTransaction: false, // Prevent re-render avalanche

    // CRITICAL: Schema validation
    enableContentCheck: true,
    onContentError: ({ error }) => {
      console.error('Content validation failed:', error)
      // Show user-friendly toast/notification
    },

    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
  })

  // Expose editor via ref or context for setContent() calls
  return <EditorContent editor={editor} className="tiptap-editor" />
}
```

### Pattern 2: Document Switching via setContent()

**What:** Switch documents by calling setContent(), not recreating editor
**When to use:** File > Open, File > New, version restore
**Example:**
```typescript
// Source: TipTap API Docs - Content Commands
// hooks/useDocumentOperations.ts

import { useCallback } from 'react'
import { Editor } from '@tiptap/core'

export function useDocumentOperations(editor: Editor | null) {
  const openDocument = useCallback((html: string) => {
    if (!editor) return

    // Clear undo history for new document
    editor.commands.setContent(html, false, {
      preserveWhitespace: 'full'
    })

    // Reset cursor to start
    editor.commands.focus('start')
  }, [editor])

  const newDocument = useCallback(() => {
    if (!editor) return
    editor.commands.setContent('<p></p>')
    editor.commands.focus()
  }, [editor])

  return { openDocument, newDocument }
}
```

### Pattern 3: Isolated Toolbar with useEditorState

**What:** Toolbar subscribes to specific state slices, not whole editor
**When to use:** Any UI that reflects editor state (bold active, etc.)
**Example:**
```typescript
// Source: TipTap Performance Guide
// components/Editor/EditorToolbar.tsx

import { useEditorState } from '@tiptap/react'
import { Editor } from '@tiptap/core'

interface ToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: ToolbarProps) {
  // GOOD: Subscribe only to needed state
  const { isBold, isItalic, isUnderline } = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isUnderline: ctx.editor.isActive('underline'),
    }),
  })

  return (
    <div className="toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={isBold}
      >
        Bold
      </button>
      {/* ... */}
    </div>
  )
}
```

### Pattern 4: Click-Anywhere Cursor Placement

**What:** Click empty space below content to position cursor there
**When to use:** Always - this is a key UX requirement (FOUND-02)
**Example:**
```typescript
// Source: Custom implementation based on ProseMirror handleClick
// components/Editor/EditorWrapper.tsx

import { useRef, useCallback } from 'react'
import { Editor } from '@tiptap/core'

interface EditorWrapperProps {
  editor: Editor | null
  children: React.ReactNode
}

export function EditorWrapper({ editor, children }: EditorWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    if (!editor) return

    // Only handle clicks directly on wrapper, not on content
    if (e.target !== wrapperRef.current) return

    // Get click position relative to content
    const rect = wrapperRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top

    // If click is below content, move cursor to end and create paragraph
    const contentHeight = editor.view.dom.scrollHeight
    if (clickY > contentHeight) {
      editor.commands.focus('end')
      editor.commands.createParagraphNear()
      editor.commands.focus('end')
    }
  }, [editor])

  return (
    <div
      ref={wrapperRef}
      onClick={handleWrapperClick}
      className="editor-wrapper min-h-screen cursor-text"
    >
      {children}
    </div>
  )
}
```

### Pattern 5: Responsive Canvas

**What:** Editor content reflows responsively with viewport
**When to use:** Always - continuous flow canvas requirement (FOUND-01, FOUND-03)
**Example:**
```css
/* Source: TipTap Styling Guide + Standard CSS Patterns */
/* styles/editor.css */

.editor-canvas {
  /* Continuous flow - no pagination */
  min-height: 100vh;
  padding: 2rem;
}

.editor-canvas .tiptap-editor {
  /* Responsive width with max constraint */
  max-width: var(--canvas-width, 720px);
  margin: 0 auto;
  width: 100%;
}

/* Adjustable canvas widths (FOUND-04) */
:root[data-canvas-width="narrow"] { --canvas-width: 600px; }
:root[data-canvas-width="normal"] { --canvas-width: 720px; }
:root[data-canvas-width="wide"] { --canvas-width: 900px; }
:root[data-canvas-width="full"] { --canvas-width: 100%; }

/* Prose styling */
.tiptap-editor {
  font-family: var(--font-body, 'Inter', sans-serif);
  font-size: var(--font-size-body, 1rem);
  line-height: var(--line-height, 1.6);
  color: var(--text-primary, #1a1a1a);
}

.tiptap-editor p {
  margin-bottom: var(--paragraph-spacing, 1em);
}

.tiptap-editor h1 { font-size: 2.5rem; margin-top: 2rem; }
.tiptap-editor h2 { font-size: 2rem; margin-top: 1.5rem; }
.tiptap-editor h3 { font-size: 1.5rem; margin-top: 1rem; }
```

### Anti-Patterns to Avoid

- **NEVER recreate editor on document switch:** Use `setContent()` instead. Memory leaks are documented and real.
- **NEVER let editor re-render parent components:** Isolate EditorCore, pass callbacks up, not state down.
- **NEVER skip schema validation:** Enable `enableContentCheck: true` or face silent content corruption.
- **NEVER mirror document content in Zustand:** TipTap owns document state. Zustand only tracks metadata (dirty flag, file path).
- **NEVER use TipTap UI Components with React 19:** They're not fully compatible. Build custom toolbar instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Basic text formatting | Custom marks | StarterKit | Handles bold, italic, strike, code, headings, lists |
| Undo/redo history | Custom history | StarterKit's History | 100-step history with proper transaction handling |
| Cursor in block gaps | Custom selection | Gapcursor extension | Handles cursor placement after tables, etc. |
| Drop indicator | Custom CSS | Dropcursor extension | Visual indicator during drag operations |
| Link editing | Custom modal | Link extension | Cmd+K, auto-detect URLs, validation |
| Character/word count | Manual counting | CharacterCount extension | Accurate, handles unicode, configurable |
| Smart quotes/dashes | Regex replacement | Typography extension | Handles all common typographic replacements |

**Key insight:** TipTap's extension ecosystem is massive. Before building anything custom, check if an extension exists. The StarterKit alone provides 16 extensions that would take weeks to build correctly.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Editor Recreation

**What goes wrong:** Memory grows unbounded when switching documents by destroying/recreating editor
**Why it happens:** TipTap's ProseMirror instances don't fully clean up on `editor.destroy()`. Node instances and internal state persist.
**How to avoid:** Create ONE editor at startup. Use `setContent()` for all document operations. Never destroy unless app is closing.
**Warning signs:** Memory tab shows steady growth after document switches. App becomes sluggish after opening 5-10 documents.

### Pitfall 2: React Re-render Avalanche

**What goes wrong:** Parent components re-render 60+ times per second during typing
**Why it happens:** Default TipTap hook behavior (pre-3.0 was worse, but isolation still matters)
**How to avoid:**
1. Set `shouldRerenderOnTransaction: false` explicitly
2. Isolate EditorCore in its own component
3. Use `useEditorState` with selectors for toolbar
4. Never subscribe to whole editor state from parent
**Warning signs:** React DevTools Profiler shows constant re-renders. CPU spikes during typing.

### Pitfall 3: Schema Validation Silent Failures

**What goes wrong:** Pasted content from Word/Google Docs silently loses formatting or entire sections
**Why it happens:** TipTap doesn't validate by default. Unknown nodes are dropped without error.
**How to avoid:** Set `enableContentCheck: true` and implement `onContentError` handler from day one
**Warning signs:** Users report "my content disappeared" after paste. No errors in console.

### Pitfall 4: Gapcursor CSS Missing

**What goes wrong:** Gapcursor extension enabled but cursor doesn't appear in block gaps
**Why it happens:** Gapcursor is headless - it needs CSS for visibility
**How to avoid:** Import default styles or add custom gapcursor CSS
**Warning signs:** Cursor can't be placed after tables or block elements at document end.

### Pitfall 5: Extension Priority Conflicts

**What goes wrong:** Custom extensions don't parse correctly, built-in extensions override
**Why it happens:** TipTap processes extensions by priority (default 100, Paragraph is 1000)
**How to avoid:** Set explicit priority > 100 on custom nodes, > 1000 to override Paragraph
**Warning signs:** Custom block becomes plain paragraph on paste.

## Code Examples

Verified patterns from official sources:

### Complete Editor Setup with All Critical Configuration

```typescript
// Source: TipTap Official Docs + Performance Guide + GitHub Issues
// components/Editor/EditorCore.tsx

import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { forwardRef, useImperativeHandle } from 'react'

export interface EditorCoreRef {
  setContent: (html: string) => void
  getHTML: () => string
  getJSON: () => any
  focus: () => void
}

interface EditorCoreProps {
  initialContent?: string
  onUpdate?: (html: string) => void
  onSelectionChange?: () => void
}

export const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(
  ({ initialContent = '<p></p>', onUpdate, onSelectionChange }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          history: { depth: 100, newGroupDelay: 500 },
          // Keep gapcursor and dropcursor from StarterKit
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: 'text-blue-600 underline' },
        }),
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Placeholder.configure({
          placeholder: 'Start writing...',
        }),
        CharacterCount,
        Subscript,
        Superscript,
      ],
      content: initialContent,

      // CRITICAL: Performance configuration
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,

      // CRITICAL: Schema validation
      enableContentCheck: true,
      onContentError: ({ error }) => {
        console.error('[EditorCore] Content validation failed:', error)
        // TODO: Show user toast notification
      },

      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getHTML())
      },

      onSelectionUpdate: () => {
        onSelectionChange?.()
      },
    })

    // Expose methods for document operations
    useImperativeHandle(ref, () => ({
      setContent: (html: string) => {
        editor?.commands.setContent(html, false, { preserveWhitespace: 'full' })
      },
      getHTML: () => editor?.getHTML() ?? '',
      getJSON: () => editor?.getJSON() ?? {},
      focus: () => editor?.commands.focus(),
    }), [editor])

    if (!editor) return null

    return (
      <EditorContent
        editor={editor}
        className="prose prose-lg max-w-none focus:outline-none"
      />
    )
  }
)

EditorCore.displayName = 'EditorCore'
```

### Toolbar with Optimized State Subscription

```typescript
// Source: TipTap Performance Guide
// components/Editor/EditorToolbar.tsx

import { useEditorState } from '@tiptap/react'
import { Editor } from '@tiptap/core'

interface ToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isUnderline: ctx.editor.isActive('underline'),
      isStrike: ctx.editor.isActive('strike'),
      isCode: ctx.editor.isActive('code'),
      textAlign: ctx.editor.isActive({ textAlign: 'left' }) ? 'left'
        : ctx.editor.isActive({ textAlign: 'center' }) ? 'center'
        : ctx.editor.isActive({ textAlign: 'right' }) ? 'right'
        : ctx.editor.isActive({ textAlign: 'justify' }) ? 'justify'
        : 'left',
      heading: ctx.editor.isActive('heading', { level: 1 }) ? 1
        : ctx.editor.isActive('heading', { level: 2 }) ? 2
        : ctx.editor.isActive('heading', { level: 3 }) ? 3
        : 0,
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
    }),
  })

  return (
    <div className="flex items-center gap-1 p-2 border-b">
      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!state.canUndo}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        Undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!state.canRedo}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        Redo
      </button>

      <div className="w-px h-6 bg-gray-200 mx-2" />

      {/* Text formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={state.isBold}
        className="p-2 rounded hover:bg-gray-100 data-[active=true]:bg-gray-200"
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={state.isItalic}
        className="p-2 rounded hover:bg-gray-100 data-[active=true]:bg-gray-200"
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        data-active={state.isUnderline}
        className="p-2 rounded hover:bg-gray-100 data-[active=true]:bg-gray-200"
      >
        Underline
      </button>

      {/* Add more toolbar items... */}
    </div>
  )
}
```

### Zustand Store for File State (Not Document Content)

```typescript
// Source: Standard Zustand patterns
// stores/editorStore.ts

import { create } from 'zustand'

interface EditorState {
  // File metadata - NOT document content
  currentFile: {
    path: string | null
    name: string
    isDirty: boolean
    lastSaved: Date | null
  }

  // Actions
  setCurrentFile: (path: string, name: string) => void
  markDirty: () => void
  markSaved: () => void
  clearFile: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  currentFile: {
    path: null,
    name: 'Untitled',
    isDirty: false,
    lastSaved: null,
  },

  setCurrentFile: (path, name) => set({
    currentFile: { path, name, isDirty: false, lastSaved: null }
  }),

  markDirty: () => set((state) => ({
    currentFile: { ...state.currentFile, isDirty: true }
  })),

  markSaved: () => set((state) => ({
    currentFile: { ...state.currentFile, isDirty: false, lastSaved: new Date() }
  })),

  clearFile: () => set({
    currentFile: { path: null, name: 'Untitled', isDirty: false, lastSaved: null }
  }),
}))
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Re-render on every transaction | `shouldRerenderOnTransaction: false` default | TipTap 3.0 | Major perf improvement |
| Manual state subscription | `useEditorState` with selectors | TipTap 2.5+ | Cleaner toolbar code |
| Separate UI components | TipTap UI Components | 2024 | Not React 19 compatible yet |
| TipTap Pro required for many features | Many Pro extensions now open-source | June 2025 | DragHandle, FileHandler, Details now free |

**Deprecated/outdated:**
- `editor.on('transaction')` for state updates - use `useEditorState` instead
- Creating new editor per document - use `setContent()` instead
- React Context for editor state - use Zustand or direct refs instead

## Open Questions

Things that couldn't be fully resolved:

1. **React 19 + TipTap UI Components Compatibility**
   - What we know: Core TipTap works with React 19, but UI Components have issues with tippy.js
   - What's unclear: Exact workarounds if we need floating menus
   - Recommendation: Build custom toolbar/menus, avoid TipTap UI Components for now

2. **Click-Anywhere Below Content - Exact Implementation**
   - What we know: Not a built-in TipTap feature, needs custom handler
   - What's unclear: Best way to calculate "below content" position with varying content
   - Recommendation: Implement wrapper click handler, iterate on UX during Phase 1

3. **Tauri WebView Performance Variation**
   - What we know: Tauri uses platform webviews (WKWebView on macOS)
   - What's unclear: Performance differences vs Chrome for TipTap specifically
   - Recommendation: Profile early on target platform, watch for unexpected behavior

## Sources

### Primary (HIGH confidence)
- [TipTap Performance Guide](https://tiptap.dev/docs/guides/performance) - shouldRerenderOnTransaction, useEditorState
- [TipTap Invalid Schema Handling](https://tiptap.dev/docs/guides/invalid-schema) - enableContentCheck, onContentError
- [TipTap React Installation](https://tiptap.dev/docs/editor/getting-started/install/react) - Basic setup
- [TipTap Gapcursor Extension](https://tiptap.dev/docs/editor/extensions/functionality/gapcursor) - Block gap cursor
- [Tauri Create Project](https://v2.tauri.app/start/create-project/) - Tauri 2 setup
- [dannysmith/tauri-template](https://github.com/dannysmith/tauri-template) - Production-ready Tauri 2 + React 19 template

### Secondary (MEDIUM confidence)
- [TipTap GitHub Issue #499](https://github.com/ueberdosis/tiptap/issues/499) - Memory leak documentation
- [TipTap GitHub Discussion #5816](https://github.com/ueberdosis/tiptap/discussions/5816) - React 19 compatibility
- [Mth-Ryan/tauri-tiptap-sample](https://github.com/Mth-Ryan/tauri-tiptap-sample) - Basic Tauri + TipTap integration
- [Liveblocks TipTap Best Practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips) - Schema validation importance

### Tertiary (LOW confidence)
- Click-anywhere implementation approach - Custom pattern, needs validation during implementation
- React 19 specific workarounds - Community discussion, may change

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm, official docs
- Architecture: HIGH - Patterns from official TipTap docs and GitHub issues
- Pitfalls: HIGH - Multiple confirmed sources (GitHub issues, official guides)
- Click-anywhere pattern: MEDIUM - Custom implementation, needs validation

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days - TipTap is stable, Tauri 2.x is stable)
