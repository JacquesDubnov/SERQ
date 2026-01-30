# Project Research Summary

**Project:** SERQ Document Editor
**Domain:** Desktop Document Editor (TipTap/Tauri)
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

SERQ is a desktop document editor built to replace Word, shipping in 2 weeks. The research confirms TipTap + Tauri + React is the right foundation. TipTap provides 60-70% of required features out of the box via open-source extensions. Tauri delivers native performance with 10x smaller bundle size than Electron. The remaining 30-40% breaks down into: 10% available via third-party extensions (columns, search/replace), 20% requiring custom development (callouts, AI stylization, tagging), and 10% behind TipTap's paywall (which we skip by building ourselves).

The architecture is clean: TipTap owns document state, Zustand manages app state, Tauri Rust backend handles file I/O and Claude API calls. The killer feature—AI text stylization—requires custom development but is straightforward: 50 lines of Rust calling Claude API, plus diff UI in React. Critical success factor: avoid the memory leak trap by creating ONE editor instance at startup and reusing it for all documents via `setContent()`, never recreate.

Key risks: memory leaks from editor recreation (HIGH), re-render avalanche from default TipTap hooks (HIGH), and schema validation silent failures (CRITICAL). All three are preventable with correct initial setup—get these right in Phase 1 or face rewrites. The 2-week timeline is achievable if we focus ruthlessly: use StarterKit + essential extensions for text editing, build minimal custom nodes (callout, spacer), integrate Claude API directly, and defer handwriting annotations and complex embedding until v2.

## Key Findings

### Recommended Stack

TipTap 3.18.0 provides the headless editor engine with excellent extension architecture. Tauri 2.9.6 gives native desktop runtime via Rust backend. React 19 with Zustand for state management keeps the frontend simple. All core technologies are battle-tested, MIT licensed, and actively maintained.

**Core technologies:**
- **TipTap 3.18.0**: Headless editor engine — ProseMirror abstraction with 100+ open-source extensions
- **Tauri 2.9.6**: Desktop runtime — Native performance, Rust backend for file ops and Claude API
- **React 19 + Zustand**: UI and state — Hooks-based, minimal boilerplate, excellent performance
- **anthropic-sdk-rust**: Claude API integration — Direct API access, streaming support, no TipTap Cloud lock-in
- **rusqlite**: Version history — SQLite for auto-save snapshots, simpler than Y.js collaboration stack
- **Tailwind CSS 4.x**: Styling — Rapid iteration with utility classes

**Critical dependencies:**
- **@tiptap/starter-kit**: Bundles 16 essential extensions (headings, lists, bold, italic, undo/redo)
- **@tiptap/extension-table-kit**: Full table support with merge/split cells
- **@sereneinserenade/tiptap-search-and-replace**: Community extension for find/replace (491+ dependents)
- **tauri-plugin-fs**: Native file system access with granular permissions
- **tauri-plugin-store**: User preferences persistence

**What we're skipping:**
- TipTap Pro extensions ($149+/mo) — Build AI ourselves, no collaboration needed for v1
- Electron — Tauri is 10x smaller, faster, native
- Redux/MobX — Zustand is simpler, sufficient for our state complexity

### Expected Features

TipTap's StarterKit provides all table-stakes text editing: bold, italic, underline, headings, lists, blockquotes, code blocks, links, images. Tables come from the official Table extension kit with full cell merge/split/background support. The gaps requiring custom work are callouts (Notion-style info/warning blocks), universal iframe embeds, tagging system, and AI stylization.

**Must have (table stakes):**
- Text formatting (bold/italic/underline/strikethrough) — StarterKit covers
- Headings H1-H6 — StarterKit covers
- Lists (bullet/numbered/checklist) — StarterKit + TaskList extension
- Tables with merge/split — Official Table extension kit
- Images and YouTube embeds — Official extensions
- Find & Replace — Community extension @sereneinserenade
- File open/save/auto-save — Tauri file system plugin

**Should have (competitive differentiators):**
- AI text stylization — Custom development (Claude API via Rust)
- Style presets (typography/colors/layout) — Custom CSS variable system
- Callout blocks (info/warning/error) — Custom node (2-3 days work)
- Columns (2-5 column layout) — Third-party @tiptap-extend/columns
- Version history (Time Machine) — SQLite + custom UI
- Table of contents with outline panel — Official TOC extension + custom drag UI

**Defer to v2+:**
- Handwritten annotations — Complex canvas overlay (10 days work)
- Multi-user collaboration — Not needed for local-first MVP
- DOCX import/export — TipTap Pro feature, not critical for HTML-native format
- EPUB export — Complex, niche use case
- Advanced tagging system — Core tagging yes, but cross-document search deferred

### Architecture Approach

The architecture follows clean separation: TipTap/ProseMirror owns the document model and editing transactions, Zustand tracks application state (file metadata, dirty flags, active presets), and Tauri Rust backend handles all I/O (files, SQLite version history, Claude API calls). React renders UI but doesn't mirror document content—that stays in TipTap.

**Major components:**

1. **EditorCore (TipTap)** — Single editor instance, document state, undo/redo history. Created once at app startup, reused for all documents via `setContent()`. Never recreate to avoid memory leaks.

2. **Tauri Rust Backend** — File operations (open/save via native dialogs), SQLite version history (auto-save every 30s), Claude API integration (streaming stylization requests), settings persistence.

3. **Zustand Stores** — Three domain-split stores: fileStore (current file path, isDirty flag, lastSaved), presetStore (active typography/colors/layout presets), uiStore (sidebar state, focus mode, command palette).

4. **Style System** — CSS custom properties mapped from presets. Presets update CSS variables on `:root`, no document modification needed. Enables instant theme switching.

5. **React UI Layer** — AppShell (layout, keyboard shortcuts), Toolbar (formatting commands), StylePanel (preset browser), VersionHistory (Time Machine UI), AIStylizer (send to Claude, preview diff, accept/reject).

**Data flow patterns:**
- **Editing:** User types → TipTap transaction → onUpdate callback → Zustand marks dirty → debounced auto-save to SQLite
- **File open:** Dialog → Tauri command reads `.serq.html` → Parse embedded JSON metadata → `editor.setContent(html)` + restore presets
- **AI stylization:** Get selection → Tauri command calls Claude API → Stream response → Show diff UI → User accept → `setContent()` with undo grouping
- **Style preset:** User selects → Zustand updates activePresets → CSS variables update → TipTap re-renders (no document change)

### Critical Pitfalls

The research identified 14 pitfalls across critical/moderate/minor severity. The top 5 can break the 2-week timeline if not addressed immediately in Phase 1.

1. **TipTap Memory Leaks (CRITICAL)** — Creating multiple editor instances leaks memory. Each `destroy()` doesn't fully clean up. Prevention: Create ONE editor at startup, use `setContent()` for document switching, never recreate.

2. **React Re-render Avalanche (CRITICAL)** — Default `useEditor` triggers 60+ renders/second during typing. Prevention: Set `shouldRerenderOnTransaction: false`, isolate EditorCore component, use `useEditorState` with selectors for toolbar.

3. **Schema Validation Silent Failures (CRITICAL)** — Invalid content from paste/import silently disappears. Prevention: Enable `enableContentCheck: true` and implement `onContentError` handler from day one.

4. **Tauri Permission Scope Hell (CRITICAL)** — File operations fail silently because default permissions only allow AppData/AppConfig directories, not user's Documents. Prevention: Configure `fs:allow-read` and `fs:allow-write` for `$HOME/**` in capabilities before writing file code.

5. **Large Document Performance Cliff (HIGH)** — Editor becomes unusable beyond ~1500 nodes or ~200k words. Prevention: Set realistic scope limits (SERQ is for "prose documents"), profile with 10x expected document size, implement debounced operations.

**Additional watch items:**
- Extension priority conflicts (custom nodes need explicit priority > 100)
- React Context unavailable in NodeViews (wrap EditorContent with all providers)
- Tauri IPC serialization bottleneck (use `tauri::ipc::Response` for large payloads)
- Nested HTML structure rejection on paste (implement transformPastedHTML cleanup)

## Implications for Roadmap

Based on research, recommended 5-phase structure over 2 weeks:

### Phase 1: Editor Foundation (Days 1-2)
**Rationale:** Everything depends on editor setup. Get the foundational architecture correct before building features. Memory leaks, re-render performance, and schema validation must be solved here or they poison every subsequent phase.

**Delivers:**
- Tauri + React + TipTap project scaffold
- Single editor instance pattern (avoiding Pitfall 1)
- `shouldRerenderOnTransaction: false` configuration (avoiding Pitfall 2)
- StarterKit + essential extensions (underline, link, image, highlight, text align, color, font family)
- Basic toolbar with formatting commands
- Schema validation enabled (avoiding Pitfall 3)

**Stack elements:**
- TipTap 3.18.0 core + StarterKit
- React 19 with Zustand
- Tauri 2.9.6 project structure
- Tailwind CSS setup

**Avoids:**
- Pitfall 1: Memory leaks (single instance)
- Pitfall 2: Re-render avalanche (performance config)
- Pitfall 3: Silent schema failures (validation enabled)

**No research needed:** Standard TipTap + Tauri integration, well-documented patterns.

---

### Phase 2: File Management (Days 3-4)
**Rationale:** Users need to open/save documents before we can deliver value. File operations unlock testing with real content. Version history infrastructure must be in place before building features that modify documents.

**Delivers:**
- Tauri file system plugin integration
- Permissions configured for `$HOME/**` (avoiding Pitfall 4)
- Open/Save/Save As with native dialogs
- `.serq.html` format (HTML + embedded JSON metadata)
- Auto-save every 30s with dirty flag tracking
- SQLite database for version history
- Basic version list UI

**Stack elements:**
- tauri-plugin-fs + tauri-plugin-dialog
- rusqlite for version storage
- Zustand fileStore (currentFile, isDirty, recentFiles)

**Addresses:**
- Must-have: File open/save/auto-save
- Should-have: Version history foundation

**Avoids:**
- Pitfall 4: Permission scope failures (configure first)
- Pitfall 8: IPC serialization bottleneck (async commands, Response type)

**No research needed:** Standard Tauri patterns, official docs cover this.

---

### Phase 3: Style System & Presets (Day 5)
**Rationale:** Style presets are a core differentiator. CSS variable approach is simpler than document manipulation. Enables instant theme switching without touching TipTap state. Must come before custom nodes (which need preset styling).

**Delivers:**
- CSS custom property system (typography, colors, layout tokens)
- Preset JSON format and loading
- StylePanel UI for browsing/selecting presets
- Zustand presetStore
- Apply preset → update CSS variables → editor re-renders
- 3-5 built-in presets (professional, academic, creative, etc.)

**Stack elements:**
- Tailwind CSS variables integration
- Jotai for derived preset state
- JSON preset files in `/presets` directory

**Addresses:**
- Should-have: Style presets (killer feature)
- Table stakes: Theme switching

**Avoids:**
- Coupling presets to document content (CSS approach avoids this)

**No research needed:** CSS variable pattern is well-established.

---

### Phase 4: Extended Features (Days 6-8)
**Rationale:** With foundation solid, add table-stakes features users expect. Tables, task lists, TOC, find/replace are all covered by existing extensions—mostly integration work. Custom nodes (callout, spacer) are straightforward after studying TipTap node API.

**Delivers:**
- Tables (Table extension kit with merge/split UI)
- Task lists (TaskList + TaskItem extensions)
- Table of Contents (official TOC extension)
- Outline panel with heading navigation
- Find & Replace (@sereneinserenade community extension)
- Callout blocks (custom node: info/warning/error/success)
- Spacer block (custom node with height attribute)
- Columns layout (@tiptap-extend/columns third-party)
- YouTube embeds (official extension)

**Stack elements:**
- @tiptap/extension-table-kit
- @tiptap/extension-task-list + task-item
- @tiptap/extension-table-of-contents
- @sereneinserenade/tiptap-search-and-replace
- Custom CalloutNode and SpacerNode extensions
- @tiptap-extend/columns (evaluate, fallback to custom if needed)

**Addresses:**
- Must-have: Tables, task lists, find/replace
- Should-have: Callout blocks, columns, TOC

**Avoids:**
- Pitfall 6: Extension priority conflicts (set explicit priorities on custom nodes)
- Pitfall 9: Nested HTML rejection (transformPastedHTML for callouts)

**Minimal research needed:** Custom node creation pattern is documented, but test callout implementation early.

---

### Phase 5: AI Integration (Days 9-10)
**Rationale:** AI text stylization is the killer feature but depends on working editor + file operations. Comes last because it's additive—everything else works without it. Streaming Claude API via Rust backend is well-documented pattern.

**Delivers:**
- Tauri commands for Claude API (stylize_content, get_api_key_status, set_api_key)
- anthropic-sdk-rust integration with streaming
- API key secure storage (platform keychain)
- AI stylization workflow: select text → invoke Tauri command → stream response → diff preview UI
- Accept/Reject UI with undo integration
- Style hints from active presets passed to Claude

**Stack elements:**
- anthropic-sdk-rust (0.1.x)
- tokio async runtime
- Tauri IPC channels for streaming
- Custom AIStylize TipTap command

**Addresses:**
- Should-have: AI text stylization (primary differentiator)
- Should-have: Context-aware formatting

**Avoids:**
- Storing API keys in frontend (Pitfall 4 variant)
- TipTap Pro lock-in (we build ourselves)

**Research flag:** Claude API streaming implementation needs validation. Test streaming to IPC channel early in phase. If anthropic-sdk-rust doesn't work cleanly, fallback to direct reqwest HTTP calls.

---

### Phase Ordering Rationale

**Dependency chain:**
- Phase 1 → Everything (editor must exist before features)
- Phase 2 → Phases 3, 5 (need file ops for testing presets and AI)
- Phase 3 → Phase 4 (custom nodes need preset styling)
- Phase 4 → Phase 5 (AI needs working editor with all features)

**Risk mitigation:**
- Critical pitfalls (1-4) all addressed in Phases 1-2
- Performance testing window: Days 6-8 with large documents
- Production build testing: Day 3 (after file ops), Day 8 (after features), Day 10 (final)

**2-week timeline validation:**
- Phase 1-2: 4 days (foundation, can't rush)
- Phase 3: 1 day (CSS variables, straightforward)
- Phase 4: 3 days (mostly integrating existing extensions)
- Phase 5: 2 days (Claude API + UI)
- Buffer: 0 days (tight but achievable if focused)

**What we're deferring:**
- Handwritten annotations (10 days complexity)
- Advanced tagging system (5 days complexity)
- Vimeo/Loom/Figma embeds (YouTube proves pattern, rest are copy-paste)
- DOCX import/export (TipTap Pro or significant custom work)
- Real-time collaboration (not needed for v1)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 5 (AI Integration):** Claude API streaming to Tauri IPC channel pattern needs validation. anthropic-sdk-rust is new (0.1.x), may have rough edges. Fallback: direct reqwest HTTP calls with manual SSE parsing. Allocate 1 day for spike if needed.

**Phases with standard patterns (skip research):**
- **Phase 1:** TipTap + React + Tauri setup is well-documented
- **Phase 2:** Tauri file operations have official examples
- **Phase 3:** CSS variable pattern is established
- **Phase 4:** Extension integration follows TipTap docs exactly

**Watch items:**
- Columns extension @tiptap-extend/columns last updated 2 years ago—test compatibility with TipTap 3.18.0 immediately. Have fallback plan to build custom columns node if it doesn't work.
- Large document performance (Pitfall 5) should be tested on Day 6 with 10x expected size (2000+ nodes). If performance cliff hit, implement debouncing and set scope limits.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official TipTap + Tauri docs verified, versions confirmed via npm, no experimental dependencies |
| Features | HIGH | 70% covered by official extensions, 10% by proven community extensions, 20% custom development patterns documented |
| Architecture | HIGH | Clean separation of concerns, standard state management patterns, well-documented IPC approach |
| Pitfalls | HIGH | All 5 critical pitfalls sourced from official docs + GitHub issues with multiple confirmations |

**Overall confidence:** HIGH

Research covered all critical areas with authoritative sources. The only MEDIUM confidence element is the Claude API streaming implementation (anthropic-sdk-rust is young), but the fallback path (direct HTTP) is well-documented.

### Gaps to Address

**Claude API streaming to Tauri IPC:** anthropic-sdk-rust is version 0.1.x and not widely adopted. The research confirms the approach (Rust backend calls Claude, streams via Tauri channels to React), but actual implementation needs validation. Recommendation: Build minimal spike on Day 9 before committing to full AI feature. If anthropic-sdk-rust proves problematic, switch to reqwest + manual SSE parsing (adds ~4 hours, not a timeline killer).

**Columns extension compatibility:** @tiptap-extend/columns hasn't been updated in 2 years. TipTap 3.x may have breaking changes. Recommendation: Test columns installation and basic functionality on Day 1 of Phase 4. If broken, allocate 1 day to build custom columns node using CSS Grid (pattern is straightforward).

**Large document performance threshold:** Research confirms performance cliff exists around 1500 nodes but exact threshold depends on node complexity and system. Recommendation: Load test with 2000-node document on Day 6. If lag detected, implement virtualization (show only viewport) or set hard limits with user warning.

**Production build differences:** Tauri dev mode is more permissive than release builds. File paths, permissions, asset bundling can differ. Recommendation: Run `cargo tauri build` and test actual app on Days 3, 8, and 10. Don't discover permission failures on release day.

## Sources

### Primary (HIGH confidence)
- [TipTap Official Documentation](https://tiptap.dev/docs) — Extensions, API, performance guides
- [Tauri v2 Official Documentation](https://v2.tauri.app/) — Architecture, plugins, IPC, permissions
- npm package registry — Version verification for all dependencies
- [TipTap GitHub Repository](https://github.com/ueberdosis/tiptap) — Issues #499, #538, #4491, #1547 for pitfall confirmation
- [ProseMirror Documentation](https://prosemirror.net/) — Core editor architecture

### Secondary (MEDIUM confidence)
- [Novel Editor GitHub](https://github.com/steven-tey/novel) — TipTap + AI patterns
- [awesome-tiptap](https://github.com/ueberdosis/awesome-tiptap) — Community extension discovery
- [Liveblocks TipTap Best Practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips)
- anthropic-sdk-rust GitHub — Claude API integration approach
- Community extensions (sereneinserenade, tiptap-extend) — Verified via npm dependents count

### Tertiary (verification needed)
- @tiptap-extend/columns compatibility with TipTap 3.x — Last update 2 years ago, needs testing
- Large document performance specific thresholds — Varies by system, needs load testing

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*
