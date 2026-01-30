# SERQ

## What This Is

SERQ is a new-age document editor that breaks the 30-year paper prison paradigm. Documents flow continuously like web pages, respond to any screen size, auto-style themselves from semantic declarations, and export as universal HTML that opens anywhere without special software. It's not a better Word - it's what Word would be if invented today.

## Core Value

**Documents that work everywhere, created by writers who write - not format.**

The writer declares semantics (heading, paragraph, quote). The system handles visual treatment through pre-designed style presets. Ugliness becomes structurally impossible. The output is HTML that opens in any browser on any device.

## Requirements

### Validated

(None yet - ship to validate)

### Active

<!-- P0 - Must ship in first release -->

**Canvas & Document Foundation:**
- [ ] Continuous flow canvas - infinite scroll, no pagination by default
- [ ] Click-anywhere cursor placement - click empty space, start typing
- [ ] Responsive canvas - content adapts to any screen size
- [ ] Adjustable canvas width (narrow, normal, wide, full)
- [ ] Optional pagination mode toggle (A4/Letter/Legal)
- [ ] HTML-native document model (.serq.html files)
- [ ] JSON intelligence layer embedded in HTML
- [ ] Stylized canvas backgrounds (solid, gradient, pattern, texture)

**Block System:**
- [ ] Text blocks: paragraph, H1-H6, blockquote, callout, caption, code
- [ ] List blocks: bullet, numbered, checklist, toggle
- [ ] Layout blocks: columns (2-5), divider, spacer
- [ ] Media blocks: image, video (YouTube/Vimeo/Loom)
- [ ] Embed blocks: universal iframe, Figma, Miro, CodeSandbox, any URL
- [ ] Block selection, reordering, duplication, deletion
- [ ] Block type conversion (/blocktype or Cmd+/)

**Text Editing:**
- [ ] Intelligent cursor & navigation (smooth, multi-cursor)
- [ ] Smart selection (non-contiguous, Cmd+D, Cmd+Shift+L)
- [ ] Text input (smart quotes, auto-capitalize, spell-check)
- [ ] Undo/redo with unlimited history

**Style System:**
- [ ] 23 typography presets (Classic, Modern, Writing App)
- [ ] 25 color scheme presets with light/dark mode
- [ ] 25 layout presets
- [ ] 33 master themes (pre-bundled combinations)
- [ ] Character formatting (bold, italic, underline, strike, code, highlight)
- [ ] Text/highlight color picker
- [ ] Links (Cmd+K, auto-link on URL paste)
- [ ] Copy/paste style (Cmd+Option+C/V)

**Layout System:**
- [ ] Powerful column layouts (container mode, flow mode)
- [ ] Complete spacing control (line, character, paragraph)
- [ ] Padding & margins with visual handles
- [ ] Text alignment (left, center, right, justify)

**Tables:**
- [ ] Full table creation and editing
- [ ] Advanced border control (full grid to borderless)
- [ ] Cell formatting (background, alignment, rotation)
- [ ] Row/column styling (zebra, header, banding)

**Media & Embeds:**
- [ ] Image system (all placement modes, basic editing)
- [ ] Universal iframe embedding (CRITICAL)
- [ ] Video embedding (YouTube, Vimeo, Loom)

**Keyboard & Commands:**
- [ ] Command palette (Cmd+K)
- [ ] Slash commands (/ triggers menu)
- [ ] Comprehensive keyboard shortcuts (100+ shortcuts)

**Tagging System:**
- [ ] Universal tagging (words, blocks, sections)
- [ ] Tag search, filter, navigation
- [ ] Tag management (create, rename, merge, delete)

**Long-Form Writing:**
- [ ] Automatic numbering (chapters, sections)
- [ ] Outline panel with drag-to-reorder
- [ ] Table of Contents (auto and manual)

**Comments & Annotations:**
- [ ] Self-comments (Cmd+Shift+M)
- [ ] Handwritten annotation layer (pen, highlighter, shapes)

**File Management:**
- [ ] Traditional file menu (New, Open, Save, Save As)
- [ ] Working folder configuration
- [ ] Auto-save (every 30 seconds)
- [ ] Time Machine recovery interface
- [ ] Export: HTML, Markdown, EPUB, Word, Pages, PDF, Plain Text
- [ ] Import: Word, Markdown, HTML, Plain Text, PDF

**AI Features:**
- [ ] AI text stylization (the killer feature)
- [ ] Context-aware formatting (detects document type)
- [ ] Preview/accept/reject workflow

**Markdown Source View:**
- [ ] Toggle between rendered and source
- [ ] Split view (side-by-side)
- [ ] Bidirectional sync

**Distraction-Free Interface:**
- [ ] Sliding panel system (left/right/top/bottom)
- [ ] Focus mode (Cmd+Shift+F)
- [ ] Typewriter mode

**Formatting Rules Engine:**
- [ ] Text/pattern/context matching
- [ ] Auto-apply formatting rules

**Search & Navigation:**
- [ ] Find and replace (regex support)
- [ ] Go-to navigation

**Settings & Preferences:**
- [ ] Appearance settings (theme, accent, density)
- [ ] Editor settings (quotes, spell-check, defaults)
- [ ] Behavior settings (paste, auto-save)

<!-- P1 - Should ship if possible -->

**P1 Features:**
- [ ] Gallery block (image grid/carousel)
- [ ] Audio block
- [ ] File attachment block
- [ ] Chart block (from table data)
- [ ] Column/rectangular selection
- [ ] Shortcut customization
- [ ] Cork board view
- [ ] Bookmarks

### Out of Scope

<!-- Explicitly excluded - PARKED features from PRD -->

- Real-time collaboration (Y.js/CRDT) - High complexity, defer to v2
- Team workspaces - Requires collaboration first
- Living data connections (Google Sheets, Airtable) - v2 feature
- Document morphing (slides, landing page) - v2 feature
- Legacy Word-like mode - Not differentiated
- Cloud sync with conflict resolution - v2 feature
- Advanced AI (structural analysis, fact-checking) - Beyond MVP AI
- Other platforms (Windows, Web, iOS, Android) - macOS first
- Browser extension - v2 feature

## Context

**Technical Stack (Decided):**
- Framework: Tauri (Rust backend) for native macOS app
- Frontend: React + TypeScript
- Editor Core: TipTap (ProseMirror)
- AI Provider: Claude API (user's own key)
- File Format: .serq.html (self-contained HTML with embedded JSON)

**Pre-Built Assets:**
- 23 typography presets (SERQ - Preset Styles - Typography.json)
- 25 color schemes (SERQ - Preset Styles - Colors.json)
- 25 layout templates (SERQ - Preset Styles - Layouts.json)
- 33 master themes (SERQ - Preset Styles - Master Themes.json)
- JSON schemas for all preset types

**Reference Documents:**
- Vision: `/Obsidian Vaults/JD Second Brain/PROJECTS/SERQ/SERQ - Vision Statement.md`
- PRD: `/Obsidian Vaults/JD Second Brain/PROJECTS/SERQ/SERQ - PRD Foundation.xml`
- MRD: `/Obsidian Vaults/JD Second Brain/PROJECTS/SERQ/SERQ - MRD V1.0.md`
- Features HLD: `/Obsidian Vaults/JD Second Brain/PROJECTS/SERQ/SERQ - Features HLD.md`

**AI-Era Development Context:**
- Cursor team built a full browser in 1 week
- Claude team built co-work in 10 days
- This project targets 2 weeks maximum for first release
- Timeline predictions are pre-AI thinking - execute fast

## Constraints

- **Platform**: macOS native first (via Tauri) - other platforms deferred
- **Timeline**: 2 weeks maximum to first release
- **AI API**: User provides own Claude API key - no hosted AI costs
- **File Format**: Must be self-contained HTML that opens in any browser
- **Editor Core**: TipTap/ProseMirror - already decided, no switching

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tauri over Electron | Smaller, faster, Rust security | - Pending |
| TipTap as editor core | Best ProseMirror wrapper, MIT license | - Pending |
| HTML as native format | Universal opening, no app required to view | - Pending |
| User-provided Claude key | No API costs, user owns their AI usage | - Pending |
| Web-first then wrap | Faster development, same code for future web app | - Pending |
| macOS first | Jacques's platform, fastest path to use | - Pending |
| Style presets pre-built | Design work done, just implement application | - Pending |

---
*Last updated: 2026-01-30 after initialization*
