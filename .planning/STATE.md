# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Documents that work everywhere, created by writers who write - not format.
**Current focus:** Phase 4 - Extended Features

## Current Position

Phase: 3 of 6 (Style System) - COMPLETE
Plan: 4 of 4 in current phase
Status: Complete
Last activity: 2026-01-31 - Completed Phase 3

Progress: [██████░░░░] 50.0% (12/24 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Total execution time: ~1 hour 48 min

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Editor Foundation | 4/4 | Complete |
| 2. File Management | 4/4 | Complete |
| 3. Style System | 4/4 | Complete |

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

### Design Reference

See `.planning/DESIGN-REFERENCE.md` for UI/UX inspiration from:
- iA Writer (radical simplicity, typography as UI)
- Minimal | Writing + Notes (meditation-inspired, single focus)

### Pending Todos

None.

### Blockers/Concerns

**Resolved in Phase 2:**
- [x] Tauri 2 permissions: fs:allow-write-text-file + fs:scope format
- [x] Rust installation: Rust 1.93.0 installed
- [x] Production build tested and working

**For Phase 3:**
- None identified

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed Phase 3 (Style System)
Resume file: None

---
*State updated: 2026-01-31*
*Phase 1 complete: 2026-01-30 (human verified)*
*Phase 2 complete: 2026-01-30 (human verified)*
*Plan 03-01 complete: 2026-01-30*
*Plan 03-02 complete: 2026-01-30*
*Plan 03-03 complete: 2026-01-30*
*Plan 03-04 complete: 2026-01-31*
*Phase 3 complete: 2026-01-31 (human verified)*
