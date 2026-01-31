# Roadmap: SERQ

## Overview

SERQ ships in 6 phases over 2 weeks. Phase 1 establishes the critical foundation (single editor instance, performance config, schema validation) that prevents memory leaks and render avalanches. Phases 2-5 layer capabilities vertically: file operations, style system, extended features, and polish. Phase 6 adds AI stylization as the killer feature. Each phase delivers independently verifiable value - no horizontal slicing, no waiting until end to see something work.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Editor Foundation** - TipTap + Tauri scaffold with critical performance patterns
- [x] **Phase 2: File Management** - Native dialogs, .serq.html format, auto-save
- [x] **Phase 3: Style System** - CSS variables, presets, theme switching
- [ ] **Phase 4: Extended Features** - Tables, custom blocks, media, commands
- [ ] **Phase 5: Polish** - Version history, comments, export, UI panels
- [ ] **Phase 6: AI Integration** - Claude API, stylization workflow, streaming

## Phase Details

### Phase 1: Editor Foundation
**Goal**: Users can open the app and write formatted text in a responsive, continuously flowing canvas
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, TEXT-01, TEXT-02, TEXT-03, TEXT-04, TEXT-05, TEXT-06, TEXT-07, FMT-01, FMT-02, FMT-03, FMT-04, FMT-05, FMT-06, FMT-07, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Success Criteria** (what must be TRUE):
  1. User can type and see text appear without lag in an infinite-scroll canvas
  2. User can apply formatting (bold, italic, headers, lists) via toolbar and shortcuts
  3. User can click anywhere in empty space and cursor appears there
  4. User can resize browser window and content reflows responsively
  5. User can undo/redo with full history preservation
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Tauri + React project scaffold with TipTap core and critical performance config
- [x] 01-02-PLAN.md — Formatting toolbar with useEditorState and keyboard shortcuts
- [x] 01-03-PLAN.md — Responsive canvas layout with click-anywhere cursor placement
- [x] 01-04-PLAN.md — Zustand integration and human verification of all success criteria

**Critical Research Constraints (from research/SUMMARY.md):**
- MUST create single editor instance at startup, reuse via `setContent()` - never recreate
- MUST set `shouldRerenderOnTransaction: false` to prevent 60+ renders/second
- MUST enable `enableContentCheck: true` with `onContentError` handler
- MUST set custom node priorities > 100 to avoid extension conflicts

---

### Phase 2: File Management
**Goal**: Users can create, open, save documents and never lose work to crashes or power failures
**Depends on**: Phase 1
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, FILE-06, FILE-07
**Success Criteria** (what must be TRUE):
  1. User can create new document with File > New
  2. User can open existing .serq.html files via native macOS dialog
  3. User can save document with Cmd+S and Save As with Cmd+Shift+S
  4. User sees auto-save indicator and document saves every 30 seconds automatically
  5. User can access recent files list
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Tauri plugins (fs, dialog, store), permissions config, .serq.html format
- [x] 02-02-PLAN.md — File operations hook and keyboard shortcuts (Cmd+S/Shift+S/O/N)
- [x] 02-03-PLAN.md — Auto-save with 30-second debounce and recent files persistence
- [x] 02-04-PLAN.md — UI integration and human verification of all success criteria

**Critical Research Constraints:**
- MUST configure Tauri permissions for `$HOME/**` (not just AppData) before writing file code
- MUST use async Tauri commands with `tauri::ipc::Response` for large payloads
- MUST test production build on Day 3 (dev mode more permissive than release)

---

### Phase 3: Style System
**Goal**: Users can instantly transform document appearance via preset selection without touching content
**Depends on**: Phase 2
**Requirements**: STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06, CANV-01, CANV-02, CANV-03, CANV-04
**Success Criteria** (what must be TRUE):
  1. User can select from 23 typography presets and see document update instantly
  2. User can select from 25 color schemes with light/dark mode support
  3. User can change canvas background (solid, gradient, pattern)
  4. User can copy formatting from one selection and paste to another (format painter)
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — CSS variable foundation, preset data definitions, system theme detection
- [x] 03-02-PLAN.md — Style store (Zustand), document style persistence, user defaults
- [x] 03-03-PLAN.md — Style panel UI components, format painter hook and button
- [x] 03-04-PLAN.md — App integration, editor CSS variables, human verification

**Implementation Notes:**
- CSS custom properties approach - presets update `:root` variables
- Style changes mark document dirty (trigger auto-save)
- Per-document styles saved in .serq.html metadata
- Light/dark mode follows macOS system, user can override

**Critical Context Decisions (from 03-CONTEXT.md):**
- Slide-in panel from right, pushes content (not overlay)
- Accordion sections (Typography | Colors | Canvas)
- Document IS the preview - clicking preset instantly updates document
- Format painter has toggle mode AND hold mode (like Word/Google Docs)

---

### Phase 4: Extended Features
**Goal**: Users have full editing capabilities expected from a modern document editor
**Depends on**: Phase 3
**Requirements**: TBL-01, TBL-02, TBL-03, TBL-04, TBL-05, TBL-06, NAV-01, NAV-03, NAV-04, CUST-01, MEDIA-01, MEDIA-02, MEDIA-03, CMD-01, CMD-02, CMD-03, CMD-04
**Success Criteria** (what must be TRUE):
  1. User can create tables, add/remove rows/columns, merge cells, and resize columns
  2. User can insert callout blocks with color selection that style automatically
  3. User can add images (drag/drop, paste) and resize/position them
  4. User can trigger command palette with Cmd+K and slash commands with /
  5. User can view document outline and navigate to any heading
**Plans**: 6 plans

Plans:
- [ ] 04-01-PLAN.md — Tables with TipTap extension, dimension picker, context menu
- [ ] 04-02-PLAN.md — Command palette (cmdk) and slash commands (@tiptap/suggestion)
- [ ] 04-03-PLAN.md — Document outline panel with TableOfContents extension
- [ ] 04-04-PLAN.md — Callout block extension with color palette and collapse
- [ ] 04-05-PLAN.md — Image insertion (drag/drop, paste, slash) with resize handles
- [ ] 04-06-PLAN.md — Human verification of all Phase 4 success criteria

**Implementation Notes:**
- Tables via @tiptap/extension-table (official, includes all 4 required extensions)
- Command palette via cmdk (powers Linear, Raycast)
- Slash commands via @tiptap/suggestion with tippy.js positioning
- Callout is custom Node with ReactNodeViewRenderer
- Images embedded as base64 for portability

**Wave Structure:**
- Wave 1 (parallel): 04-01, 04-02, 04-04 (no dependencies)
- Wave 2 (parallel): 04-03, 04-05 (depend on command system from 04-02)
- Wave 3: 04-06 (human verification after all features complete)

**Deferred to Phase 5 (not in success criteria):**
- NAV-02 (Find/Replace)
- CUST-02-05 (Divider, Spacer, Column, Toggle blocks)
- MEDIA-04-06 (Embeds: iframe, YouTube, video)
- MD-01-04 (Markdown view)
- Advanced image features (cropping, effects, masks, editor mode)

---

### Phase 5: Polish
**Goal**: Users have professional document management with version history, comments, and export options
**Depends on**: Phase 4
**Requirements**: VER-01, VER-02, VER-03, VER-04, VER-05, VER-06, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, COMM-01, COMM-02, COMM-03, COMM-04, EXP-01, EXP-02, EXP-03, EXP-04, EXP-05, EXP-06
**Success Criteria** (what must be TRUE):
  1. User can view version history (Time Machine style) and restore any previous version
  2. User can add comments to text selections and see them in margin
  3. User can export document to HTML, Markdown, and PDF
  4. User can import Word (.docx), Markdown, and plain text files
  5. User can toggle focus mode (Cmd+Shift+F) hiding all UI chrome
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

**Implementation Notes:**
- SQLite via rusqlite for version storage (auto-save snapshots every 30s)
- Single-user comments (not TipTap Pro collaboration)
- Word import via Mammoth.js, PDF export via print-to-PDF

---

### Phase 6: AI Integration
**Goal**: Users can stylize text using AI that understands document context and active style presets
**Depends on**: Phase 5
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria** (what must be TRUE):
  1. User can select text and invoke AI stylization
  2. User sees streaming AI response in real-time
  3. User can preview AI changes in diff view before accepting
  4. User can accept or reject AI suggestions with full undo support
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

**Implementation Notes:**
- Claude API via Tauri Rust backend (user provides own API key)
- Streaming via Tauri IPC channels
- anthropic-sdk-rust preferred, fallback to direct reqwest HTTP if problematic
- API key stored in platform keychain (not frontend)

**Research Flag:** Claude API streaming to Tauri IPC channel needs validation spike on Day 9

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 > 2 > 3 > 4 > 5 > 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Editor Foundation | 4/4 | Complete | 2026-01-30 |
| 2. File Management | 4/4 | Complete | 2026-01-30 |
| 3. Style System | 4/4 | Complete | 2026-01-31 |
| 4. Extended Features | 0/6 | Planned | - |
| 5. Polish | 0/3 | Not started | - |
| 6. AI Integration | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-30*
*Phase 1 planned: 2026-01-30*
*Phase 1 complete: 2026-01-30*
*Phase 2 planned: 2026-01-30*
*Phase 2 complete: 2026-01-30*
*Phase 3 planned: 2026-01-30*
*Phase 3 complete: 2026-01-31*
*Phase 4 planned: 2026-01-31*
*Depth: comprehensive*
*Coverage: 99/99 v1 requirements mapped*
