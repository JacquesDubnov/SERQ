# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Documents that work everywhere, created by writers who write - not format.
**Current focus:** Phase 7 Complete - Moving to Phase 5 or 6

## Current Position

Phase: 7 of 7 (Layout and Numbering) - COMPLETE
Plan: 5 of 5 in current phase
Status: Verified
Last activity: 2026-02-01 - Phase 7 verified complete

Progress: [██████████] 100% (29/29 plans complete including Phase 7)

## Performance Metrics

**Velocity:**
- Total plans completed: 29
- Total execution time: ~2 hours 10 min

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Editor Foundation | 4/4 | Complete |
| 2. File Management | 4/4 | Complete |
| 3. Style System | 4/4 | Complete |
| 4. Extended Features | 6/6 | Complete |
| 5. Polish | 7/7 | Complete |
| 6. AI Integration | 0/4 | Planned |
| 7. Layout and Numbering | 5/5 | Complete |

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
| D-02-01-005 | Escape </script> as <\/script> in JSON | Prevent HTML structure breaks in serialized content |
| D-02-02-001 | saveFile delegates to saveFileAs when no path | New documents without path trigger Save As dialog |
| D-02-02-002 | Both meta+key and ctrl+key registered | Cross-platform keyboard shortcut support |
| D-02-02-003 | enableOnContentEditable for all shortcuts | Shortcuts work inside TipTap editor |
| D-02-03-001 | 30-second debounce with 60-second maxWait | Balance between data safety and disk wear |
| D-02-03-002 | Singleton store pattern for preferences | Avoid repeated file loads by caching store instance |
| D-02-03-003 | preferences.json as shared store file | Single file for all app preferences |
| D-02-03-004 | tauri-plugin-store defaults property required | API requires {defaults: {}} even for empty defaults |
| D-03-01-001 | CSS variables on :root for instant preset switching | No class management, instant updates via setProperty |
| D-03-01-002 | data-theme attribute on documentElement for dark mode | CSS selector :root[data-theme="dark"] for variant switching |
| D-03-01-003 | Preset objects use exact CSS variable names as keys | Direct mapping to setProperty calls, no translation needed |
| D-03-01-004 | Dynamic Tauri import with media query fallback | Supports browser dev mode without Tauri context |
| D-03-02-001 | Style changes call markDirty() on editorStore | Ensures document dirty state tracks style changes for save prompts |
| D-03-02-002 | Individual preset changes clear currentMasterTheme | Mixing presets means no longer using a master theme |
| D-03-02-003 | StyleMetadata shared interface between store and serqFormat | Single source of truth for style data shape |
| D-03-02-004 | Recents vs Defaults distinction | Recents = last 5 used (quick access), Defaults = explicit user choice (new docs) |
| D-03-03-001 | Single accordion section expanded at a time | Reduces visual noise, focuses user on one preset category |
| D-03-03-002 | Master Themes section shows combo preview text | Quick visual hint of what the theme includes |
| D-03-03-003 | Format painter uses 'copy' cursor globally | Universal cross-platform cursor, no custom SVG needed |
| D-04-01-001 | Named imports for TipTap table extensions | TipTap 3.18.0 uses named exports only |
| D-04-01-002 | withHeaderRow: false on table insert | User toggles header row via context menu per CONTEXT |
| D-04-01-003 | 8-color cell background palette | Matches CONTEXT spec for color presets |
| D-04-02-001 | Use cmdk for command palette | Powers Linear, Raycast, shadcn/ui - fast fuzzy search |
| D-04-02-002 | Use @tiptap/suggestion for slash commands | Official TipTap utility, handles cursor and popups |
| D-04-02-003 | tippy.js for slash menu positioning | Lightweight, handles viewport edges |
| D-04-02-004 | Separate command definitions from UI | commands.ts defines actions, palette renders - easier to extend |
| D-04-04-001 | Color-based callouts (not semantic types) | Per CONTEXT spec - 8 colors: blue, green, yellow, orange, red, purple, pink, gray |
| D-04-04-002 | 4px border-radius on callouts | Matches table styling per CONTEXT |
| D-04-04-003 | Left border accent + background color | Visual style for callout blocks |
| D-04-04-004 | Icons via emoji preset picker | Quick icon selection for callouts |
| D-04-05-001 | Base64 embedding for images | Document portability - images travel with content |
| D-04-05-002 | 2MB size warning threshold | Balance usability and performance |
| D-04-05-003 | SE corner resize handle only | Standard convention, reduces visual noise |
| D-04-05-004 | Aspect ratio locked on resize | Prevents distortion |
| D-04-03-001 | Use TipTap TableOfContents extension | Official TipTap utility, handles heading tracking and active state |
| D-04-03-002 | Store outline anchors in editorStore | Centralized state accessible to both panel and command palette |
| D-04-03-003 | Panel slides from left | Mirrors StylePanel on right, provides visual balance |
| D-04-03-004 | Jump-to at top of command palette | Most relevant when searching for headings, easy access |
| D-05-01-001 | Use tauri-plugin-sql with SQLite | Local storage, fast, no network dependency, works offline |
| D-05-01-002 | Singleton DB instance pattern | Avoid reconnection overhead, consistent connection |
| D-05-01-003 | 30s debounce + 60s maxWait for auto-snapshot | Balance between data safety and disk write frequency |
| D-05-01-004 | Keep 50 auto-saves + all checkpoints | Reasonable history depth without unbounded growth |
| D-05-02-001 | Manual JSON-to-Markdown conversion | More control than @tiptap/markdown extension, no extra dependency |
| D-05-02-002 | Browser print dialog for PDF | No heavy libraries like jsPDF needed, works everywhere |
| D-05-02-003 | Inline CSS in HTML export | Captures current CSS variables for visual fidelity |
| D-05-03-001 | Use body.focus-mode class for CSS-based chrome hiding | Simpler than conditional rendering, allows smooth transitions |
| D-05-03-002 | 50px threshold prevents jittery typewriter scrolling | Small movements don't trigger scroll recenter |
| D-05-03-003 | StatusBar reads from CharacterCount extension storage | Uses TipTap's built-in counting for accuracy |
| D-05-06-001 | Use mammoth.js for Word conversion | Client-side .docx parsing, no server, well-maintained |
| D-05-06-002 | Custom Markdown parser over external library | Matches export-handlers pattern, no extra dependency |
| D-05-06-003 | Confirmation dialog for dirty documents | Prevents accidental data loss when importing over unsaved work |
| D-05-04-001 | Simple read-only preview (not diff view) | VER-04 says "Version preview" not "Version diff" - visual diff is v2 |
| D-05-04-002 | Text selection enabled in preview | VER-06 workaround - users can copy text to partially restore |
| D-05-04-003 | Restore creates backup checkpoint | Undo safety - current state preserved before restore |
| D-05-05-001 | Store comment text in SQLite, only ID in document marks | Keeps document JSON clean, allows comment metadata without polluting content |
| D-05-05-002 | onCommentActivated callback option on Comment extension | Self-contained extension - click handling wired at registration, no hard dependencies |
| D-05-05-003 | Group comments by resolved/unresolved | Clear visual separation, open comments are actionable |
| D-05-07-001 | All panels/toolbars/controls MUST have margins and padding to confining containers | Ubiquitous design rule - applies to every UI component throughout the app |
| D-07-02-001 | Float attribute stored on node, applied via data-float and CSS class | Consistent with existing alignment approach, enables CSS-only styling |
| D-07-02-002 | Headings auto-clear floats via CSS | Natural document flow - headings start new sections |
| D-07-02-003 | Mobile responsive - floats disabled below 640px | Text wrapping doesn't work well on narrow screens |
| D-07-04-001 | Viewport optimization for line number rendering | Only render visible lines with 200px buffer for smooth scrolling - performance critical for long documents |
| D-07-04-002 | Canvas context menu triggers on empty space below content | Natural place for document-level settings, doesn't conflict with selection or table menus |
| D-07-04-003 | getSettings callback pattern for extension-to-store communication | Extension reads fresh settings on each render, store changes immediately affect rendering |
| D-07-01-001 | Use CSS Grid with display:contents for NodeViewContent | Allows column children to participate directly in parent grid |
| D-07-01-002 | Priority > 100 for column extensions | Prevents TipTap extension resolution conflicts |
| D-07-01-003 | Content type column+ for ColumnSection | Enforces structural hierarchy, only columns as children |
| D-07-05-001 | Widget decorations with side: -1 for number placement | Insert before node content for inline number display |
| D-07-05-002 | Preset formatNumber callback pattern | Flexible formatting without hardcoded number styles |
| D-07-05-003 | Heading level tracking for hierarchy | Enables proper 1.1, 1.2, 2.1 multi-level numbering |
| D-07-05-004 | Skip empty paragraphs from numbering | Avoid cluttering document with numbers on blank lines |
| D-07-05-005 | contentEditable=false on number spans | Prevent user from editing/selecting numbers |
| D-07-03-001 | Use percentage for X position (0-100%) and pixels for Y offset | Responsive horizontal, precise vertical positioning |
| D-07-03-002 | Free position and float are mutually exclusive | Enabling one disables the other automatically |
| D-07-03-003 | Green visual indicators for free position mode | Distinguishes from normal float mode visually |

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
{ "version": "1.0", "created": "...", "modified": "...", "wordCount": N, "presets": {...} }
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

**Auto-Save Pattern:**
```typescript
// 30-second debounce, 60-second maxWait
const performAutoSave = useDebouncedCallback(async () => {
  if (!document.path || !document.isDirty) return  // Guard conditions
  const html = editorRef.current?.getHTML()
  await writeTextFile(document.path, serializeSerqDocument(html, document))
  markSaved()
}, 30000, { maxWait: 60000 })
```

**Store Singleton Pattern:**
```typescript
let storeInstance: Awaited<ReturnType<typeof load>> | null = null
async function getStore() {
  if (!storeInstance) {
    storeInstance = await load('preferences.json', { defaults: {}, autoSave: false })
  }
  return storeInstance
}
```

**CSS Variable Preset System (Phase 3):**
```typescript
// Preset definition with CSS variable keys
interface TypographyPreset {
  id: string
  name: string
  variables: Record<string, string>  // Keys are --font-*, --color-*, etc.
}

// Apply preset by updating CSS custom properties
function applyTypographyPreset(presetId: string): void {
  const preset = TYPOGRAPHY_PRESETS.find(p => p.id === presetId)
  if (!preset) return
  Object.entries(preset.variables).forEach(([prop, value]) => {
    document.documentElement.style.setProperty(prop, value)
  })
}
```

**Theme Detection Hook Pattern (Phase 3):**
```typescript
// Tauri API with media query fallback
const { effectiveTheme, toggleTheme, setUserOverride } = useSystemTheme()
// Updates document.documentElement.dataset.theme = 'light' | 'dark'
```

**Style Store Pattern (Phase 3):**
```typescript
// Zustand store for style state
const useStyleStore = create<StyleState>((set, get) => ({
  currentTypography: 'serq-default',
  currentColor: 'default',
  currentCanvas: 'white',
  currentLayout: 'default',
  currentMasterTheme: null,

  setTypography: (presetId) => {
    applyTypographyPreset(presetId)  // Update CSS
    set({ currentTypography: presetId, currentMasterTheme: null })  // Update state
    useEditorStore.getState().markDirty()  // Mark document dirty
  },

  loadFromDocument: (metadata) => { /* Apply presets from document */ },
  getStyleMetadata: () => { /* Return current presets for serialization */ }
}))
```

**Style Panel Accordion Pattern (Phase 3):**
```typescript
// Single expanded section at a time
const [expandedSection, setExpandedSection] = useState<AccordionSection>('typography')

const toggleSection = (section: AccordionSection) => {
  setExpandedSection(current => current === section ? null : section)
}

// PresetSection with filter, recents, and grid
<PresetSection
  title="Typography"
  isExpanded={expandedSection === 'typography'}
  onToggle={() => toggleSection('typography')}
  presets={TYPOGRAPHY_PRESETS}
  currentPresetId={currentTypography}
  recentPresetIds={recentTypography}
  onSelectPreset={setTypography}
/>
```

**Format Painter Pattern (Phase 3):**
```typescript
// Hook captures and applies formatting
const { isActive, toggle, deactivate } = useFormatPainter(editor)

// Store state
formatPainter: {
  active: boolean
  mode: 'toggle' | 'hold'
  storedFormat: { marks: Mark[], textAlign: string } | null
}

// Cursor change when active
body.format-painter-active { cursor: copy !important; }
```

**Context Menu Pattern (Phase 4):**
```typescript
// State for context menu position
const [tableMenuState, setTableMenuState] = useState<{ x: number; y: number } | null>(null)

// Handle right-click on table cell
const handleContextMenu = useCallback((e: React.MouseEvent) => {
  const tableCell = (e.target as HTMLElement).closest('td, th')
  if (tableCell && editor) {
    e.preventDefault()
    setTableMenuState({ x: e.clientX, y: e.clientY })
  }
}, [editor])

// Render menu with viewport adjustment
{tableMenuState && <TableContextMenu position={tableMenuState} onClose={() => setTableMenuState(null)} />}
```

**Picker Dropdown Pattern (Phase 4):**
```typescript
// Grid-based dimension picker for tables
<TablePicker onSelect={(rows, cols) => {
  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run()
}} onClose={() => setShowPicker(false)} />

// Close on click outside (with delay to prevent immediate close)
useEffect(() => {
  const timeoutId = setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside)
  }, 100)
  return () => { clearTimeout(timeoutId); document.removeEventListener('mousedown', handleClickOutside) }
}, [])
```

**Command Palette Pattern (Phase 4):**
```typescript
// Centralized command definitions
interface CommandItem {
  id: string
  title: string
  shortcut?: string
  group: CommandGroup
  action: (editor: Editor) => void
}

// cmdk for command palette UI
<Command.Dialog open={isOpen} onOpenChange={handleOpenChange}>
  <Command.Input placeholder="Type a command..." />
  <Command.List>
    <Command.Group heading="Format">
      <Command.Item onSelect={() => command.action(editor)}>
        {command.title}
        <kbd>{command.shortcut}</kbd>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

**Slash Commands Pattern (Phase 4):**
```typescript
// TipTap extension with @tiptap/suggestion
export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        char: '/',
        items: ({ query }) => filterSlashCommands(query).slice(0, 10),
        render: () => ({
          onStart: (props) => {
            component = new ReactRenderer(SlashMenu, { props, editor: props.editor })
            popup = tippy('body', {
              getReferenceClientRect: props.clientRect,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
            })
          },
          onKeyDown: (props) => component.ref?.onKeyDown(props),
          onExit: () => { popup.destroy(); component.destroy() }
        })
      })
    ]
  }
})
```

**Custom Block Extension Pattern (Phase 4):**
```typescript
// Node.create with ReactNodeViewRenderer for custom blocks
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',  // Allows paragraphs, lists, headings inside
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      color: { default: 'blue' },
      icon: { default: null },
      collapsed: { default: false },
      collapsible: { default: false },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  addCommands() {
    return {
      insertCallout: (attrs = {}) => ({ commands }) => {
        return commands.insertContent({
          type: 'callout',
          attrs,
          content: [{ type: 'paragraph' }],
        })
      },
    }
  },
})

// View component with NodeViewWrapper/NodeViewContent
function CalloutView({ node, updateAttributes, selected, deleteNode }) {
  return (
    <NodeViewWrapper className="callout" data-color={node.attrs.color}>
      <div className="callout-header" contentEditable={false}>
        {/* Icon, collapse button */}
      </div>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  )
}
```

**Outline Panel Pattern (Phase 4):**
```typescript
// TableOfContents extension onUpdate callback
function handleTocUpdate(data: TableOfContentData): void {
  const anchors: OutlineAnchor[] = data.map((item) => ({
    id: item.id,
    level: item.level,
    textContent: item.textContent,
    isActive: item.isActive,
    pos: item.pos,
  }));
  useEditorStore.getState().setOutlineAnchors(anchors);
}

// Navigate to heading
const handleNavigate = useCallback((anchor: OutlineAnchor) => {
  if (!editor) return
  editor.chain().focus().setTextSelection(anchor.pos).run()
  const headingNode = editor.view.nodeDOM(anchor.pos)
  if (headingNode instanceof HTMLElement) {
    headingNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}, [editor])
```

**Dynamic Command Generation Pattern (Phase 4):**
```typescript
// Generate commands from store state
const jumpToCommands: CommandItem[] = useMemo(() => {
  return outlineAnchors.map((anchor) => ({
    id: `jump-to-${anchor.id}`,
    title: `H${anchor.level}: ${anchor.textContent || 'Untitled'}`,
    group: 'jump-to' as CommandGroup,
    action: (ed: Editor) => {
      ed.chain().focus().setTextSelection(anchor.pos).run()
      const headingNode = ed.view.nodeDOM(anchor.pos)
      if (headingNode instanceof HTMLElement) {
        headingNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
  }))
}, [outlineAnchors])
```

**SQLite Migration Pattern (Phase 5):**
```rust
// In lib.rs - register SQL plugin with migrations
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

.plugin(
    SqlBuilder::default()
        .add_migrations(
            "sqlite:serq.db",
            vec![Migration {
                version: 1,
                description: "create_versions_table",
                sql: include_str!("../migrations/001_versions.sql"),
                kind: MigrationKind::Up,
            }],
        )
        .build(),
)
```

**Database Singleton Pattern (Phase 5):**
```typescript
// Singleton for SQLite connection
let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:serq.db');
  }
  return dbInstance;
}
```

**Auto-Snapshot to SQLite Pattern (Phase 5):**
```typescript
// Debounced save to SQLite on editor changes
const performSnapshot = useDebouncedCallback(async () => {
  if (!enabled || !editor || !documentPath) return;

  const editorJSON = editor.getJSON();
  const contentString = JSON.stringify(editorJSON);

  // Skip if content unchanged
  if (contentString === lastSnapshotRef.current) return;

  await saveVersion(documentPath, editorJSON, wordCount, charCount, false);
  lastSnapshotRef.current = contentString;
  await deleteOldVersions(documentPath, 50);
}, 30000, { maxWait: 60000 });

editor.on('update', performSnapshot);
```

### Design Reference

See `.planning/DESIGN-REFERENCE.md` for UI/UX inspiration from:
- iA Writer (radical simplicity, typography as UI)
- Minimal | Writing + Notes (meditation-inspired, single focus)

### Pending Todos

1. **Add Excel-like formula support to tables** (2026-01-31)
   - Area: ui
   - File: `.planning/todos/pending/2026-01-31-excel-like-table-formulas.md`

### Blockers/Concerns

**Resolved in Phase 2:**
- [x] Tauri 2 permissions: fs:allow-write-text-file + fs:scope format
- [x] Rust installation: Rust 1.93.0 installed
- [x] Production build tested and working

**For Phase 3:**
- None identified

## Session Continuity

Last session: 2026-02-01
Stopped at: Ready for Phase 6 (AI Integration)
Resume file: None

### Session 2026-02-01 (evening) - Toolbar & Formatting Improvements

**Completed (ad-hoc, not from roadmap):**
- Font cycling shortcuts (Cmd+Alt+Up/Down) through all 35 fonts
- Clear Formatting button + enhanced Cmd+\ command
- Multi-select extension for Cmd+click non-sequential selection
- Format painter: Option key hold for repeat, deactivate on release
- Line/character spacing controls with selection preservation
- Text case controls (upper/lower/title/sentence case)
- Font size/weight controls with keyboard shortcuts
- Fixed font cycling only working within subgroups (exact matching)
- Fixed format painter affecting entire paragraph
- Line spacing default changed from "Auto" to "1"
- Added 40px gap between toolbar and canvas

**Commit:** 58e3a1c - feat(editor): comprehensive toolbar and formatting improvements

---
*State updated: 2026-02-01*
*Phase 7 complete: 2026-02-01 (verified)*
*Phase 1 complete: 2026-01-30 (human verified)*
*Phase 2 complete: 2026-01-30 (human verified)*
*Plan 03-01 complete: 2026-01-30*
*Plan 03-02 complete: 2026-01-30*
*Plan 03-03 complete: 2026-01-30*
*Plan 03-04 complete: 2026-01-31*
*Phase 3 complete: 2026-01-31 (human verified)*
*Plan 04-01 complete: 2026-01-31*
*Plan 04-02 complete: 2026-01-31*
*Plan 04-03 complete: 2026-01-31*
*Plan 04-04 complete: 2026-01-31*
*Plan 04-05 complete: 2026-01-31*
*Phase 4 complete: 2026-01-31 (human verified)*
*Plan 05-01 complete: 2026-01-31*
*Plan 05-02 complete: 2026-01-31*
*Plan 05-03 complete: 2026-01-31*
*Plan 05-04 complete: 2026-01-31*
*Plan 05-06 complete: 2026-01-31*
*Plan 05-05 complete: 2026-01-31*
*Plan 07-02 complete: 2026-02-01*
*Plan 07-04 complete: 2026-02-01*
*Plan 07-01 complete: 2026-02-01*
*Plan 07-05 complete: 2026-02-01*
*Plan 07-03 complete: 2026-02-01*
