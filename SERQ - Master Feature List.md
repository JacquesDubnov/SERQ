# SERQ - Master Feature List

**Version:** 1.0 Target
**Updated:** 2026-02-05
**Purpose:** Single source of truth for all SERQ features. Deduped from Feature List, Comments, old version work, and codebase audit.

**Status Key:**
- DONE = Working in current codebase
- PARTIAL = Some implementation exists, needs completion
- WIRED = Component/package exists, not connected to UI
- PLANNED = No code yet

---

## 1. EDITOR CORE

### Text Editing
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.01 | Paragraph blocks | DONE | StarterKit |
| 1.02 | Heading blocks H1-H6 | DONE | StarterKit |
| 1.03 | Blockquote blocks | DONE | StarterKit |
| 1.04 | Code blocks | DONE | StarterKit (no syntax highlighting) |
| 1.05 | Bullet lists | DONE | StarterKit |
| 1.06 | Ordered lists | DONE | StarterKit |
| 1.07 | Task/checklist lists | PLANNED | TaskList extension needed |
| 1.08 | Horizontal rule | DONE | StarterKit |
| 1.09 | Hard break | DONE | StarterKit |
| 1.10 | Undo/redo (100 depth) | DONE | StarterKit |
| 1.11 | Dropcursor | DONE | StarterKit |
| 1.12 | Gapcursor | DONE | StarterKit |

### Text Formatting
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.13 | Bold | DONE | |
| 1.14 | Italic | DONE | |
| 1.15 | Underline | DONE | Extension |
| 1.16 | Strikethrough | DONE | StarterKit |
| 1.17 | Inline code | DONE | StarterKit |
| 1.18 | Highlight (multicolor) | DONE | Extension |
| 1.19 | Subscript | DONE | Extension |
| 1.20 | Superscript | DONE | Extension |
| 1.21 | Text color | DONE | Color extension |
| 1.22 | Link (auto-detect) | DONE | Link extension |
| 1.23 | Text alignment (L/C/R/J) | DONE | TextAlign extension |
| 1.24 | Font family | DONE | FontFamily extension |
| 1.25 | Font size | DONE | Custom extension |
| 1.26 | Font weight | DONE | Custom extension |
| 1.27 | Line height | DONE | Custom extension |
| 1.28 | Letter spacing | DONE | Custom extension |
| 1.29 | Markdown paste (convert to rich text) | DONE | tiptap-markdown |

### Advanced Editing
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.30 | Multi-cursor (Cmd+click) | PLANNED | Extension disabled |
| 1.31 | Select next occurrence (Cmd+D) | PLANNED | |
| 1.32 | Select all occurrences (Cmd+Shift+L) | PLANNED | |
| 1.33 | Smart selection expansion | PLANNED | |
| 1.34 | Copy/paste style (format painter) | PARTIAL | State exists, button disabled |
| 1.35 | Clear formatting | PLANNED | Command exists in old version |

---

## 2. BLOCKS & CONTENT TYPES

### Custom Blocks
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.01 | Callout/admonition blocks (info/warning/success/error) | PLANNED | Was in old version |
| 2.02 | Toggle/collapsible blocks | PLANNED | |
| 2.03 | Spacer block | PLANNED | |
| 2.04 | Divider block (styled) | DONE | Horizontal rule |
| 2.05 | Block background color and gradients | PLANNED | |
| 2.06 | Block linking (source blocks and sync blocks) | PLANNED | |

### Tables
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.07 | Table creation (grid selector) | WIRED | Components exist, not registered |
| 2.08 | Row/column insert/delete/duplicate/move | WIRED | 50+ UI components in tiptap-node |
| 2.09 | Merge/split cells | WIRED | |
| 2.10 | Column resize | WIRED | |
| 2.11 | Cell background color | WIRED | |
| 2.12 | Header row formatting | WIRED | |
| 2.13 | Sort rows/columns | WIRED | |
| 2.14 | Table handles (drag) | WIRED | |
| 2.15 | Table border stylization | PLANNED | |
| 2.16 | Table formulas (Excel-like) | PLANNED | |

---

## 3. UI & NAVIGATION

### Toolbar & Menus
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.01 | Unified formatting toolbar | DONE | |
| 3.02 | Keyboard shortcut tooltips | DONE | |
| 3.03 | Slash commands (/) | WIRED | Component exists, not connected |
| 3.04 | Command palette (Cmd+P) | DONE | 22+ commands |
| 3.05 | Bubble menu (text selection) | PLANNED | TipTap native component available |
| 3.06 | Floating menu (empty lines) | PLANNED | |
| 3.07 | Drag context menu (block ops) | PLANNED | |
| 3.08 | Color picker (text + highlight) | DONE | In toolbar |
| 3.09 | Color menu -- show active color in icon | PLANNED | |
| 3.10 | Link style menu (presets + custom) | PLANNED | |
| 3.11 | Lists context menu (indent, bullet color, numbering, full customization) | PLANNED | |
| 3.12 | Quote blocks context menu (line, spacing, full customization) | PLANNED | |

### Panels & Navigation
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.13 | Style panel (right slide-in) | DONE | Presets, themes |
| 3.14 | Outline panel / Table of Contents | PLANNED | Was in old version |
| 3.15 | Search and replace (full UI, regex support) | PLANNED | |
| 3.16 | Keyboard shortcuts modal (search, set, conflict resolution) | PLANNED | |
| 3.17 | Preferences / Settings section | PLANNED | |

---

## 4. STYLE SYSTEM

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4.01 | 5-level style cascade (Project > Doc > Page > Block > Char) | DONE | |
| 4.02 | StyleResolver with caching | DONE | |
| 4.03 | 6 built-in named styles | DONE | h1-h3, body, quote, code |
| 4.04 | Typography presets | DONE | |
| 4.05 | Color scheme presets | DONE | |
| 4.06 | Canvas background presets | DONE | |
| 4.07 | Layout presets | DONE | |
| 4.08 | Master theme selection | DONE | |
| 4.09 | Per-heading custom styles (font, size, weight, marks, dividers) | DONE | |
| 4.10 | Global paragraph spacing + per-heading overrides | DONE | |
| 4.11 | Heading divider support (position, color, thickness, style) | DONE | |
| 4.12 | CSS variable system | DONE | |
| 4.13 | Dynamic configurable options (fonts, weights, colors from store) | DONE | |
| 4.14 | Custom saved styles | DONE | |
| 4.15 | Styling templates (save/load full document styles) | PLANNED | |
| 4.16 | Document structure templates | PLANNED | |
| 4.17 | Theme system (light/dark/system) | DONE | |
| 4.18 | Conditional formatting (e.g. make every "hero" bold) | PLANNED | |
| 4.19 | Document background color and gradients | PARTIAL | Canvas presets, no gradients |

---

## 5. LAYOUT & CANVAS

### Canvas
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.01 | Canvas width: Normal (80 chars) | DONE | |
| 5.02 | Canvas width: Wide (full window) | DONE | |
| 5.03 | Canvas width: Narrow | DONE | |
| 5.04 | Canvas width: Full | DONE | |
| 5.05 | Canvas width: Book (65 chars optimal readability) | PLANNED | |
| 5.06 | Canvas: Desktop simulation | PLANNED | |
| 5.07 | Canvas: Tablet simulation | PLANNED | |
| 5.08 | Canvas: Mobile simulation | PLANNED | |
| 5.09 | Canvas: Custom mode | PLANNED | |
| 5.10 | Canvas: Long-form mode (side-by-side pages) | PLANNED | |
| 5.11 | Canvas: Project mode | PLANNED | |
| 5.12 | Zoom slider (20-300%) | DONE | In footer |

### Pagination & Page Layout
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.13 | Pagination mode toggle | DONE | TipTap Pages |
| 5.14 | Page size: A4 | DONE | |
| 5.15 | Page size: Letter | DONE | |
| 5.16 | Page size: Legal | DONE | |
| 5.17 | Page numbers (full styling, presets and custom) | PLANNED | |
| 5.18 | Headers / footers (customizable) | PARTIAL | Footer shows "Page X of Y" |

### Advanced Layout
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.19 | Multi-column layouts (2-6 columns, CSS Grid) | PLANNED | Was in old version |
| 5.20 | Column resize (drag borders) | PLANNED | |
| 5.21 | Column modes: fixed and flowing | PLANNED | |
| 5.22 | Text float / wrapping (left, right, center) | PLANNED | Was in old version |
| 5.23 | Layout templates | PLANNED | |

---

## 6. IMAGES & MEDIA

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6.01 | Image insertion (basic via TipTap) | DONE | No resize handles |
| 6.02 | Image drag and drop | PLANNED | Was in old version |
| 6.03 | Image paste | PLANNED | |
| 6.04 | Image resize handles | PLANNED | Was in old version |
| 6.05 | Image text wrap | PLANNED | |
| 6.06 | Image float positioning | PLANNED | Was in old version |
| 6.07 | Image free positioning (drag anywhere) | PLANNED | Was in old version |
| 6.08 | Image gallery view | PLANNED | |
| 6.09 | Image mask | PLANNED | |
| 6.10 | Image basic edit (crop, rotate) | PLANNED | |
| 6.11 | Image alpha channel / blend into doc | PLANNED | |
| 6.12 | Image preset styling filters | PLANNED | |
| 6.13 | Image match styling | PLANNED | |
| 6.14 | Image remove background | PLANNED | |
| 6.15 | Universal iframe embed | PLANNED | |
| 6.16 | YouTube/Vimeo embed | PLANNED | |
| 6.17 | Audio block | PLANNED | |

---

## 7. FILE MANAGEMENT

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7.01 | New document (Cmd+N) | DONE | |
| 7.02 | Open document (Cmd+O) | DONE | Tauri native dialog |
| 7.03 | Save document (Cmd+S) | DONE | |
| 7.04 | Save As (Cmd+Shift+S) | DONE | |
| 7.05 | Auto-save (30-second debounce) | DONE | |
| 7.06 | .serq.html format (HTML + JSON metadata) | DONE | |
| 7.07 | Recent files list | DONE | |
| 7.08 | Working folder preference | DONE | |
| 7.09 | Dirty indicator + last saved timestamp | DONE | |
| 7.10 | Pages/Chapters/Sections management | PLANNED | Long-form structure |
| 7.11 | Auto chapter/section numbering (reorder-safe) | PLANNED | |

---

## 8. EXPORT & IMPORT

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 8.01 | Export to PDF | WIRED | jspdf + html2canvas installed, no UI |
| 8.02 | Export to Word (.docx) | WIRED | docx package installed, no UI |
| 8.03 | Export to HTML (self-contained) | PLANNED | |
| 8.04 | Export to Markdown | PLANNED | |
| 8.05 | Export to EPUB | PLANNED | |
| 8.06 | Export to plain text | PLANNED | |
| 8.07 | Import from Word (.docx) | WIRED | mammoth installed, no UI |
| 8.08 | Import from Markdown | PLANNED | |
| 8.09 | Import from HTML | PLANNED | |
| 8.10 | Import from plain text | PLANNED | |
| 8.11 | Future-proof backup (auto Markdown + txt copies) | PLANNED | |

---

## 9. DOCUMENT MANAGEMENT

### Version History
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9.01 | Auto-snapshots to SQLite | PARTIAL | DB schema exists, no logic |
| 9.02 | Named version checkpoints | PLANNED | |
| 9.03 | Time Machine UI (WYSIWYG on canvas) | PLANNED | |
| 9.04 | Version preview | PLANNED | |
| 9.05 | Restore from any version | PLANNED | |
| 9.06 | Document version management (named variants, not timeline) | PLANNED | English/French, "Sent to Tom" |

### Comments & Collaboration
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9.07 | Inline comments | PARTIAL | DB schema exists, no UI |
| 9.08 | Comment panel | PLANNED | |
| 9.09 | Comment tracking and resolution | PLANNED | |
| 9.10 | Track changes (inline marking + diff views) | PLANNED | |

---

## 10. MARKDOWN

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10.01 | Markdown source view (Cmd+/) | WIRED | CodeMirror installed, no UI |
| 10.02 | Markdown side-by-side (source + render) | PLANNED | Render style options |
| 10.03 | Markdown paste to rich text | DONE | tiptap-markdown |
| 10.04 | YAML frontmatter support | PLANNED | |

---

## 11. AI FEATURES

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11.01 | Claude API integration (Rust backend) | WIRED | Extension installed, keyring issue |
| 11.02 | AI text stylization | PLANNED | |
| 11.03 | Context-aware formatting (detect doc type) | PLANNED | |
| 11.04 | Preview/accept/reject workflow | PLANNED | |
| 11.05 | Streaming response display | PLANNED | |
| 11.06 | Mark sentences too long | PLANNED | |
| 11.07 | Mark bad grammar | PLANNED | |
| 11.08 | Show outdated/inaccurate data | PLANNED | |
| 11.09 | Show claims needing validation | PLANNED | |
| 11.10 | Define document intent + suggestions | PLANNED | |
| 11.11 | Styling suggestions and auto-assist | PLANNED | |
| 11.12 | Voice AI interface (intellectual sparring partner) | PLANNED | |
| 11.13 | Auto supporting data from user computer/web | PLANNED | |
| 11.14 | Research, advice, fact validation, tone preservation | PLANNED | |

---

## 12. WRITING TOOLS

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 12.01 | Word count | DONE | CharacterCount extension + footer |
| 12.02 | Character count | DONE | |
| 12.03 | Advanced counts (lines, pages, chapters, adjectives, verbs) | PLANNED | Project/doc/selection levels |
| 12.04 | Performance stats (time, per day/week/month, plan vs actual) | PLANNED | |
| 12.05 | Writing goals management | PLANNED | |
| 12.06 | Focus/Zen mode | PLANNED | |
| 12.07 | Typewriter mode | PLANNED | |
| 12.08 | Clock / alarm / pomodoro (project-assigned) | PLANNED | |
| 12.09 | Calculator | PLANNED | |

---

## 13. NUMBERING & REFERENCES

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 13.01 | Line numbers (coding style, legal style) | PLANNED | Was in old version |
| 13.02 | Paragraph numbering presets (sequential, hierarchical, legal) | PLANNED | Was in old version |
| 13.03 | Page numbers (styled, presets + custom) | PLANNED | |
| 13.04 | Auto chapter/section numbering (reorder-safe) | PLANNED | For long-form |

---

## 14. DATA & VARIABLES

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 14.01 | Doc variables ({fileName}, {date}, {version}, {pages}, {Author}...) | PLANNED | |
| 14.02 | Live data insert ({NASDAQ:AAPL} stock ticker etc.) | PLANNED | |
| 14.03 | Live formula insert ({USD/EUR * 1,200,000}) | PLANNED | |
| 14.04 | Collect web data into objects (auto-fetch on doc open) | PLANNED | |
| 14.05 | Conditional formatting rules | PLANNED | |

---

## 15. SECURITY & PRIVACY

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 15.01 | Document password lock | PLANNED | |
| 15.02 | Social encryption (Shamir secret sharing) | PLANNED | |
| 15.03 | Dead-man's switch | PLANNED | |
| 15.04 | Coercion password | PLANNED | |

---

## 16. PUBLISHING & DISTRIBUTION

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 16.01 | Auto publish (Medium, Substack, X, LinkedIn) | PLANNED | |
| 16.02 | Publishing calendar / scheduling | PLANNED | |
| 16.03 | Track distribution (who got what version, when) | PLANNED | |
| 16.04 | Future-proof backup (auto Markdown + txt) | PLANNED | |

---

## 17. SETTINGS & PREFERENCES

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17.01 | Theme toggle (light/dark/system) | DONE | |
| 17.02 | UI mode: SERQ (novel approach) | PLANNED | |
| 17.03 | UI mode: Zen / Focus | PLANNED | |
| 17.04 | UI mode: Legacy (Word-like) | PLANNED | |
| 17.05 | Preferences panel (full app settings) | PLANNED | |
| 17.06 | Keyboard shortcuts panel (search, set, conflict resolution) | PLANNED | |
| 17.07 | Font management (Google Fonts interface, add/remove) | PLANNED | |

---

## 18. VOICE & INPUT

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 18.01 | Voice dictation | PLANNED | |
| 18.02 | Voice activation | PLANNED | |
| 18.03 | Voice note-taking | PLANNED | |
| 18.04 | Voice transcripts | PLANNED | |
| 18.05 | Mobile capture (camera to doc/inbox) | PLANNED | Needs mobile companion |

---

## 19. SPECIALIZED MODES

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 19.01 | Journaling mode (calendar, daily push, maps) | PLANNED | |
| 19.02 | Research mode (inbox, corkboard, sticky notes, citations, flowchart) | PLANNED | |
| 19.03 | General inbox (fast capture: data, images, links) | PLANNED | |
| 19.04 | Long-form mode (chapters, sections, side-by-side pages) | PLANNED | |
| 19.05 | Project mode | PLANNED | |

---

## 20. LOCALIZATION

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 20.01 | RTL support (document-level, paragraph-level, auto-detect) | PLANNED | |
| 20.02 | Translation (multilingual document variants) | PLANNED | |

---

## 21. BLOCK INDICATOR & SELECTION

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 21.01 | Hover tracking (blue vertical line) | DONE | |
| 21.02 | Frame mode (Option held) | DONE | |
| 21.03 | Multi-block selection (Option+click) | DONE | |
| 21.04 | Range selection (Option+Shift+click) | DONE | |
| 21.05 | Long-press drag-and-drop with animations | DONE | |
| 21.06 | Drop indicator | DONE | |
| 21.07 | Toggle enable/disable | DONE | |
| 21.08 | Pagination support | PARTIAL | Edge detection WIP |

---

## SUMMARY

| Category | DONE | PARTIAL | WIRED | PLANNED | Total |
|----------|------|---------|-------|---------|-------|
| 1. Editor Core | 27 | 1 | 0 | 7 | 35 |
| 2. Blocks & Content | 1 | 0 | 8 | 7 | 16 |
| 3. UI & Navigation | 5 | 0 | 1 | 11 | 17 |
| 4. Style System | 14 | 1 | 0 | 4 | 19 |
| 5. Layout & Canvas | 7 | 1 | 0 | 15 | 23 |
| 6. Images & Media | 1 | 0 | 0 | 16 | 17 |
| 7. File Management | 9 | 0 | 0 | 2 | 11 |
| 8. Export & Import | 0 | 0 | 3 | 8 | 11 |
| 9. Document Mgmt | 0 | 2 | 0 | 8 | 10 |
| 10. Markdown | 1 | 0 | 1 | 2 | 4 |
| 11. AI Features | 0 | 0 | 1 | 13 | 14 |
| 12. Writing Tools | 2 | 0 | 0 | 7 | 9 |
| 13. Numbering | 0 | 0 | 0 | 4 | 4 |
| 14. Data & Variables | 0 | 0 | 0 | 5 | 5 |
| 15. Security | 0 | 0 | 0 | 4 | 4 |
| 16. Publishing | 0 | 0 | 0 | 4 | 4 |
| 17. Settings | 1 | 0 | 0 | 6 | 7 |
| 18. Voice & Input | 0 | 0 | 0 | 5 | 5 |
| 19. Specialized Modes | 0 | 0 | 0 | 5 | 5 |
| 20. Localization | 0 | 0 | 0 | 2 | 2 |
| 21. Block Indicator | 6 | 1 | 0 | 0 | 7 |
| 22. UI/UX/Visual Design | 1 | 13 | 0 | 31 | 45 |
| **TOTAL** | **75** | **19** | **14** | **159** | **267** |

**75 features done. 267 total for v1. 28% complete on feature count.**
(But the 75 done includes the hardest foundational work -- the remaining features build on top.)

---

## 22. UI / UX / VISUAL DESIGN

This is a first-class section. SERQ's UI must be polished, novel, and
visually superior to Word, Notion, and every other editor. The graphics
interface IS the product. Bad UX = dead product.

### Visual Foundation
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22.01 | Splash screen | PLANNED | First impression |
| 22.02 | Logo incorporation (app icon, title bar, about) | PLANNED | |
| 22.03 | Custom window chrome (native macOS title bar integration) | PARTIAL | Basic Tauri window |
| 22.04 | App typography system (UI fonts, spacing, sizing hierarchy) | PARTIAL | Some CSS variables |
| 22.05 | Color system (semantic palette for UI: surface, border, text, accent) | PARTIAL | themes.css exists |
| 22.06 | Shadow and elevation system | PLANNED | |
| 22.07 | Icon system (consistent icon library throughout) | PARTIAL | TipTap icons + some custom |
| 22.08 | Dark mode -- full pixel-perfect polish | PARTIAL | Functional, not polished |
| 22.09 | Light mode -- full pixel-perfect polish | PARTIAL | Functional, not polished |

### Animations & Transitions
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22.10 | Panel slide transitions (smooth, spring-based) | PARTIAL | Style panel slides |
| 22.11 | Menu open/close animations | PLANNED | |
| 22.12 | Block drag animations | DONE | Block indicator FLIP animations |
| 22.13 | Page transition animations | PLANNED | |
| 22.14 | Theme switch transition (smooth crossfade) | PLANNED | Currently instant |
| 22.15 | Toolbar state transitions | PLANNED | |
| 22.16 | Toast/notification system with animations | PLANNED | |
| 22.17 | Loading states and skeleton screens | PLANNED | |
| 22.18 | Micro-interactions (button press, toggle flip, checkbox tick) | PLANNED | |

### Interaction Design
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22.19 | Hover states on all interactive elements | PARTIAL | |
| 22.20 | Focus states (keyboard navigation indicators) | PLANNED | |
| 22.21 | Selection styling (text, blocks, table cells) | PARTIAL | |
| 22.22 | Context menus (right-click, consistent design) | PLANNED | |
| 22.23 | Drag and drop UX (visual feedback, drop zones, snap) | PARTIAL | Block indicator has this |
| 22.24 | Tooltip system (consistent, delay, positioning) | PARTIAL | Some tooltips exist |
| 22.25 | Custom cursor behaviors (resize, move, crosshair, etc.) | PLANNED | |
| 22.26 | Keyboard-first design (full app navigable without mouse) | PLANNED | |
| 22.27 | Empty states (new doc, no recent files, empty panel) | PLANNED | |

### Novel UX Patterns
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22.28 | SERQ UI mode (novel approach -- what makes SERQ look like nothing else) | PLANNED | |
| 22.29 | Zen/Focus mode UI (distraction-free, minimal chrome) | PLANNED | |
| 22.30 | Legacy mode UI (Word-like for familiarity) | PLANNED | |
| 22.31 | Responsive canvas that feels native on any window size | PARTIAL | 4 width presets |
| 22.32 | First-run experience / onboarding | PLANNED | |
| 22.33 | Document switcher UX (fast open, preview, search) | PLANNED | |
| 22.34 | Status bar design (information density without clutter) | PARTIAL | Basic footer exists |
| 22.35 | Header bar design (document identity, save state, quick actions) | PARTIAL | Basic header exists |
| 22.36 | Floating toolbar design (bubble menu on text selection) | PLANNED | |
| 22.37 | Block-level affordances (clear visual language for block types) | PLANNED | |

### Typography & Readability
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22.38 | Editor typography polish (heading hierarchy, body text, lists) | PARTIAL | CSS vars work, needs design pass |
| 22.39 | Print typography (pagination mode must look publication-ready) | PARTIAL | Pagination works, needs polish |
| 22.40 | Monospace/code typography (code blocks, inline code) | PARTIAL | |
| 22.41 | Font rendering optimization (subpixel, antialiasing) | PLANNED | |

### Accessibility
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 22.42 | Screen reader support (ARIA labels, roles) | PLANNED | |
| 22.43 | Contrast ratios (WCAG AA minimum) | PLANNED | |
| 22.44 | Reduced motion mode | PLANNED | |
| 22.45 | Font size scaling (UI chrome, not just editor content) | PLANNED | |

---

## KNOWN BUGS

| # | Bug | Severity |
|---|-----|----------|
| B1 | Block indicator edge detection at page boundaries (30px buffer) | Medium |
| B2 | Char spacing field doesn't reflect value at cursor position | Low |
| B3 | Heading style divider takes text color instead of default color | Low |

---

*Sources: Feature List, Comments, TIPTAP-NATIVE-REBUILD-PLAN, old version planning docs, codebase audit 2026-02-05*
