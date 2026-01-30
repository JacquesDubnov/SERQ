# Requirements: SERQ

**Defined:** 2026-01-30
**Core Value:** Documents that work everywhere, created by writers who write - not format.

## v1 Requirements

Requirements for first release (2 weeks). Mapped to TipTap coverage from research.

### Foundation (TipTap-Native)

<!-- These come essentially free with TipTap StarterKit + extensions -->

- [ ] **FOUND-01**: Continuous flow canvas with infinite scroll
- [ ] **FOUND-02**: Click-anywhere cursor placement
- [ ] **FOUND-03**: Responsive canvas adapts to viewport
- [ ] **FOUND-04**: Adjustable canvas width (narrow/normal/wide/full)
- [ ] **FOUND-05**: Pagination mode toggle (A4/Letter/Legal)
- [ ] **FOUND-06**: HTML-native document model (.serq.html)
- [ ] **FOUND-07**: JSON intelligence layer embedded in HTML

### Text Blocks (TipTap StarterKit)

<!-- All covered by TipTap StarterKit extension -->

- [ ] **TEXT-01**: Paragraph block
- [ ] **TEXT-02**: Heading blocks (H1-H6)
- [ ] **TEXT-03**: Blockquote block
- [ ] **TEXT-04**: Code block with syntax highlighting
- [ ] **TEXT-05**: Bullet list block
- [ ] **TEXT-06**: Numbered list block
- [ ] **TEXT-07**: Checklist/todo block (TaskList extension)

### Text Formatting (TipTap Native)

<!-- All covered by TipTap extensions -->

- [ ] **FMT-01**: Bold, Italic, Underline, Strikethrough
- [ ] **FMT-02**: Code/monospace inline
- [ ] **FMT-03**: Highlight/mark
- [ ] **FMT-04**: Superscript/Subscript
- [ ] **FMT-05**: Text color and highlight color
- [ ] **FMT-06**: Links with Cmd+K
- [ ] **FMT-07**: Text alignment (left/center/right/justify)

### Tables (TipTap Table Extension)

<!-- Covered by @tiptap/extension-table -->

- [ ] **TBL-01**: Table creation and editing
- [ ] **TBL-02**: Row/column insert/delete
- [ ] **TBL-03**: Cell merge/split
- [ ] **TBL-04**: Cell background color
- [ ] **TBL-05**: Column resize
- [ ] **TBL-06**: Header row formatting

### Navigation (TipTap Extensions)

<!-- TableOfContents and related extensions -->

- [ ] **NAV-01**: Table of Contents from headings
- [ ] **NAV-02**: Find and replace (community extension)
- [ ] **NAV-03**: Outline panel
- [ ] **NAV-04**: Go-to heading navigation

### Editing (TipTap Core)

<!-- Core ProseMirror features -->

- [ ] **EDIT-01**: Undo/redo with unlimited history
- [ ] **EDIT-02**: Multi-cursor (Cmd+click)
- [ ] **EDIT-03**: Select next occurrence (Cmd+D)
- [ ] **EDIT-04**: Select all occurrences (Cmd+Shift+L)
- [ ] **EDIT-05**: Smart selection expansion

### Custom Blocks (Custom Development)

<!-- Not in TipTap, must build -->

- [ ] **CUST-01**: Callout/admonition block (info/warning/success/error)
- [ ] **CUST-02**: Divider/horizontal rule block
- [ ] **CUST-03**: Spacer block (vertical spacing)
- [ ] **CUST-04**: Column layout block (2-5 columns)
- [ ] **CUST-05**: Toggle/collapsible block

### Media (Mixed - Some Native, Some Custom)

<!-- Images native, embeds need custom work -->

- [ ] **MEDIA-01**: Image insertion (drag/drop, paste, upload)
- [ ] **MEDIA-02**: Image resize and crop
- [ ] **MEDIA-03**: Image placement modes (inline/wrap/break)
- [ ] **MEDIA-04**: Universal iframe embed block
- [ ] **MEDIA-05**: YouTube/Vimeo embed
- [ ] **MEDIA-06**: Video player for local files

### Commands (TipTap Experiments)

<!-- Based on TipTap slash commands experiment -->

- [ ] **CMD-01**: Command palette (Cmd+K)
- [ ] **CMD-02**: Slash commands (/ triggers menu)
- [ ] **CMD-03**: Keyboard shortcuts (100+ shortcuts)
- [ ] **CMD-04**: Block type conversion via slash

### File Management (Tauri Native)

<!-- Tauri file system integration -->

- [ ] **FILE-01**: New document
- [ ] **FILE-02**: Open document (native dialog)
- [ ] **FILE-03**: Save document
- [ ] **FILE-04**: Save As (native dialog)
- [ ] **FILE-05**: Auto-save every 30 seconds
- [ ] **FILE-06**: Working folder configuration
- [ ] **FILE-07**: Recent files list

### Export/Import (Custom + Libraries)

<!-- Mammoth.js for Word, custom for others -->

- [ ] **EXP-01**: Export to HTML (self-contained)
- [ ] **EXP-02**: Export to Markdown
- [ ] **EXP-03**: Export to PDF (print-to-PDF)
- [ ] **EXP-04**: Import from Word (.docx)
- [ ] **EXP-05**: Import from Markdown
- [ ] **EXP-06**: Import from plain text

### Style System (Custom - CSS Variables)

<!-- Research recommends CSS custom properties approach -->

- [ ] **STYLE-01**: Typography preset application (23 presets)
- [ ] **STYLE-02**: Color scheme preset application (25 presets)
- [ ] **STYLE-03**: Layout preset application (25 presets)
- [ ] **STYLE-04**: Master theme application (33 themes)
- [ ] **STYLE-05**: Style picker UI with previews
- [ ] **STYLE-06**: Copy/paste style (format painter)

### Version History (SQLite)

<!-- Research recommends SQLite for version storage -->

- [ ] **VER-01**: Auto-save versions to SQLite
- [ ] **VER-02**: Named version checkpoints (Cmd+S)
- [ ] **VER-03**: Time Machine recovery UI
- [ ] **VER-04**: Version preview
- [ ] **VER-05**: Restore entire document from version
- [ ] **VER-06**: Restore specific sections from version

### AI Features (Claude API via Rust)

<!-- Custom integration, skip TipTap Pro -->

- [ ] **AI-01**: Claude API integration via Tauri backend
- [ ] **AI-02**: AI text stylization (structure detection)
- [ ] **AI-03**: Context-aware formatting (document type detection)
- [ ] **AI-04**: Preview/accept/reject workflow
- [ ] **AI-05**: Streaming response display

### Interface (Custom)

<!-- Panel system and focus mode -->

- [ ] **UI-01**: Sliding panel system (left/right)
- [ ] **UI-02**: Focus mode (Cmd+Shift+F)
- [ ] **UI-03**: Typewriter mode option
- [ ] **UI-04**: Dark/light/system theme
- [ ] **UI-05**: Distraction-free writing mode
- [ ] **UI-06**: Status bar with word count

### Markdown View (TipTap Native)

<!-- Markdown extension provides this -->

- [ ] **MD-01**: Toggle source view (Cmd+/)
- [ ] **MD-02**: Split view (rendered + source)
- [ ] **MD-03**: Bidirectional sync
- [ ] **MD-04**: Syntax highlighting in source

### Comments (Lightweight Custom)

<!-- Single-user comments, not TipTap Pro -->

- [ ] **COMM-01**: Add comment to selection
- [ ] **COMM-02**: Comment margin indicators
- [ ] **COMM-03**: Comment panel
- [ ] **COMM-04**: Resolve/delete comments

### Canvas Aesthetics (Custom CSS)

<!-- Background and visual polish -->

- [ ] **CANV-01**: Background color options
- [ ] **CANV-02**: Background gradients
- [ ] **CANV-03**: Background patterns
- [ ] **CANV-04**: Per-section backgrounds

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Tagging System

- **TAG-01**: Universal tagging (words, blocks, sections)
- **TAG-02**: Tag search and filter
- **TAG-03**: Tag management UI
- **TAG-04**: AI tag suggestions

### Annotations

- **ANNOT-01**: Handwritten annotation layer
- **ANNOT-02**: Pen, highlighter, eraser tools
- **ANNOT-03**: Shape tools (arrow, circle, rectangle)
- **ANNOT-04**: AI annotation interpretation

### Formatting Rules

- **RULE-01**: Text match rules (auto-format patterns)
- **RULE-02**: Regex pattern rules
- **RULE-03**: Context-aware rules
- **RULE-04**: Rule management UI

### Advanced Features

- **ADV-01**: Cork board view
- **ADV-02**: Bookmarks
- **ADV-03**: Cross-references
- **ADV-04**: Shortcut customization

### Advanced Export

- **AEXP-01**: Export to EPUB
- **AEXP-02**: Export to Apple Pages
- **AEXP-03**: Export presets

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration | High complexity (Y.js/CRDT), v2 |
| Team workspaces | Requires collaboration first |
| Living data connections | Google Sheets/Airtable integration is v2 |
| Document morphing | Slides/landing page transform is v2 |
| Legacy Word-like mode | Not differentiated, adds complexity |
| Cloud sync | Focus on local-first, cloud later |
| TipTap Pro features | Building AI ourselves, skip $149+/mo |
| Other platforms | macOS first, Windows/Web/iOS later |
| Advanced AI editing | Structural analysis, fact-checking v2 |
| Plugin system | v2 feature |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-* | Phase 1 | Pending |
| TEXT-* | Phase 1 | Pending |
| FMT-* | Phase 1 | Pending |
| EDIT-* | Phase 1 | Pending |
| FILE-* | Phase 2 | Pending |
| STYLE-* | Phase 3 | Pending |
| TBL-* | Phase 4 | Pending |
| NAV-* | Phase 4 | Pending |
| CUST-* | Phase 4 | Pending |
| MEDIA-* | Phase 4 | Pending |
| CMD-* | Phase 4 | Pending |
| VER-* | Phase 5 | Pending |
| AI-* | Phase 6 | Pending |
| UI-* | Phase 5 | Pending |
| MD-* | Phase 4 | Pending |
| COMM-* | Phase 5 | Pending |
| CANV-* | Phase 3 | Pending |
| EXP-* | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 74 total
- Mapped to phases: 74
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after research synthesis*
