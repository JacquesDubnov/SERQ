# SERQ Session Context

**Last Updated:** 2026-02-02
**Purpose:** Enable complete context restoration between Claude sessions.

---

## Quick Restart

**Single instruction to continue work:**

```
Read @.planning/SERQ-V1-GAP-ANALYSIS.md and @.planning/STATE.md. FIRST PRIORITY: Execute Phase 0 (TipTap UI Migration) - replace ALL custom UI with TipTap UI Components and add DragHandle extension for Notion-style block dragging. TipTap Pro token in .npmrc. After Phase 0, continue with Phase 6 (AI) or Phase 8 verification.
```

---

## Project Identity

**SERQ** - A new-age document editor that breaks the 30-year paper prison paradigm. Documents flow continuously, respond to any screen size, auto-style from semantic declarations, and export as universal HTML.

**Core Value:** Documents that work everywhere, created by writers who write - not format.

---

## Critical Files (Read These)

| Priority | File | Purpose |
|----------|------|---------|
| 1 | `.planning/SERQ-V1-GAP-ANALYSIS.md` | Master plan with TipTap Pro integration |
| 2 | `.planning/STATE.md` | Current progress, decisions, patterns |
| 3 | `.planning/ROADMAP.md` | Phase structure and success criteria |
| 4 | `.planning/REQUIREMENTS.md` | 104 v1 requirements mapped |
| 5 | `SERQ - Comments.md` | User testing feedback |
| 6 | `.planning/PROJECT.md` | Core vision and constraints |

---

## TipTap Pro Configuration

**Registry Token:**
```
dzX0eH5dWaDGX68jCXh7RWBoBYkncaQKbYI7GovqwGh7taq03qJhAtx6ngzb5biw
```

**NPM Config (.npmrc):** Already created in project root.

**Pro Extensions to Install:**
- `@tiptap-pro/extension-drag-handle-react` - Notion-style drag handles (PHASE 0)
- `@tiptap-pro/extension-pages` - Node-based pagination
- `@tiptap-pro/extension-ai-generation` - Simple AI commands
- `@tiptap-pro/extension-ai-toolkit` - Full AI agents (evaluate)
- `@tiptap-pro/extension-file-handler` - Enhanced file handling
- `@tiptap-pro/extension-unique-id` - Stable node IDs
- `@tiptap-pro/extension-details` - Collapsible sections

**UI Components to Install (PHASE 0 - FIRST PRIORITY):**
```bash
# Use TipTap CLI to add components
npx @tiptap/cli@latest add primitives
npx @tiptap/cli@latest add toolbar
npx @tiptap/cli@latest add drag-context-menu
npx @tiptap/cli@latest add slash-dropdown-menu
npx @tiptap/cli@latest add heading-dropdown
npx @tiptap/cli@latest add list-dropdown
npx @tiptap/cli@latest add color-highlight-popover
npx @tiptap/cli@latest add link-popover
```

**Components to Replace (MANDATORY):**
- All toolbar buttons → TipTap Mark/Heading/List buttons
- Command palette → TipTap Slash Dropdown Menu
- Context menus → TipTap Dropdown Menu primitive
- Style panel controls → TipTap primitives
- All modals/dialogs → TipTap Popover
- All tooltips → TipTap Tooltip
- Add DragHandle → Notion-style block dragging

---

## Current Status

**Progress:** 97% (33/34 plans complete)

**Completed Phases:**
- Phase 1: Editor Foundation (4/4)
- Phase 2: File Management (4/4)
- Phase 3: Style System (4/4)
- Phase 4: Extended Features (6/6)
- Phase 5: Polish (7/7)
- Phase 7: Layout and Numbering (5/5)
- Phase 8: Document Output (4/5 - verification pending)

**Pending Phases:**
- Phase 6: AI Integration (0/4 - not started)
- Phase 8: 08-05 verification

**New Phases (from Gap Analysis):**
- **Phase 0: TipTap UI Migration (FIRST - before anything else)**
- Phase 9: Settings and Configuration
- Phase 10: Extended Editor Features
- Phase 11: Writer Features
- Phase 12: Advanced Features
- Phase 13: UI/UX Beautification (MUST BE LAST)

---

## Key Technical Decisions

### Architecture

| Decision | Rationale |
|----------|-----------|
| Single TipTap editor instance | Prevent memory leaks, reuse via setContent() |
| shouldRerenderOnTransaction: false | Prevent 60+ renders/second |
| SQLite for versions | Local, fast, no network dependency |
| CSS variables for presets | Instant switching via setProperty() |
| Base64 images | Document portability |

### TipTap Pro Integration

| Decision | Rationale |
|----------|-----------|
| Use TipTap Pages over CSS @page | Node-based pagination is the only correct approach |
| Use TipTap AI Generation | Pre-built commands vs custom implementation |
| Skip TipTap cloud features | Comments/Collaboration require hosted docs |
| Keep existing version history | SQLite implementation works, no need for Pro |

### UI/UX Rules

- All panels/toolbars/controls MUST have margins and padding
- Use inline styles for complex layouts (Tailwind can conflict)
- minHeight: 0 CRITICAL for flex scroll containers
- SQLite returns 0/1 not true/false (must convert)

---

## Pending Todos (22)

**Phase 9 (Settings):**
- app-settings-phase
- shortcuts-panel
- integrations-and-sharing

**Phase 10 (Extended Editor):**
- excel-like-table-formulas
- table-borders-stylization
- multiple-image-gallery
- image-management-panel

**Phase 11 (Writer):**
- handling-long-form
- writing-goals
- writing-statistics
- pomodoro-time-tracking
- track-changes-diff-view

**Phase 12 (Advanced):**
- handling-projects
- handling-tasks
- rtl-management
- document-translation
- block-rearrangement-matrix-view

**Phase 13 (UI/UX):**
- style-panels-rework
- focus-mode-redesign
- logo-incorporation
- splash-screen
- zoom-slider-status-bar

---

## User Feedback Summary

### Focus Mode
"Completely broken" - needs full redesign (Phase 13)

### Pagination
User chose TipTap Pro Team plan ($149/mo) after dependency hell with free packages

### Table Formulas
10 functions cover 90% of real document needs:
SUM, AVERAGE, MIN, MAX, COUNT, IF, ROUND, ABS, CONCATENATE, COUNTA

### RTL Support
Needed for Hebrew, Arabic - document and paragraph level direction control

### Image Management
Need visibility into what's consuming document space (base64 bloat)

---

## GSD Commands

| Command | Use |
|---------|-----|
| `/gsd:progress` | Check current status and next actions |
| `/gsd:execute-phase N` | Execute all plans in phase N |
| `/gsd:plan-phase N` | Create plans for phase N |
| `/gsd:check-todos` | Review pending todos |
| `/gsd:verify-work N` | Manual acceptance testing |

---

## Next Actions

**MANDATORY FIRST:** Phase 0 (TipTap UI Migration)
- Install TipTap UI Components via CLI
- Replace ALL custom buttons/menus/popovers with TipTap components
- Add DragHandle extension for Notion-style block dragging
- Ensures consistent, professional UI during all subsequent development

**After Phase 0:**

1. **Option A:** Complete Phase 6 (AI Integration with TipTap Pro)
   - Install TipTap Pro AI extensions
   - Configure Claude API backend
   - Wire AI commands using TipTap AI Menu component

2. **Option B:** Verify Phase 8 (Document Output)
   - Run 08-05 verification plan
   - Replace CSS pagination with TipTap Pages extension

3. **Option C:** Plan Phase 9 (Settings)
   - Create settings infrastructure using TipTap primitives
   - Build preferences panel

**Recommended:** Phase 0 → Option A (UI consistency, then AI as killer feature)

---

## Important Patterns

### File Operations
```typescript
const { openFile, saveFile, saveFileAs, newFile } = useFileOperations(editorRef)
```

### Auto-Save
```typescript
// 30-second debounce, 60-second maxWait
useDebouncedCallback(autoSave, 30000, { maxWait: 60000 })
```

### Store Singleton
```typescript
let storeInstance = null
async function getStore() {
  if (!storeInstance) storeInstance = await load('preferences.json')
  return storeInstance
}
```

### Context Menu
```typescript
const [menuState, setMenuState] = useState<{ x: number; y: number } | null>(null)
// Right-click handler, render at menuState position
```

---

*Context preserved: 2026-02-02*
*For full history, see: ~/.claude/projects/-Users-jacquesdubnov-Coding-serq/*.jsonl*
