# SERQ Session Handover

**Date:** 2026-02-05
**Branch:** `main` (merged from `feature/unified-style-system`)
**Last Commit:** See git log

---

## Project Overview

SERQ is "The Last Editor You'll Ever Need" - a Tauri-based desktop rich text editor:
- **Frontend:** React + TypeScript + TipTap (ProseMirror)
- **Desktop:** Tauri 2.x (Rust backend)
- **State:** Zustand
- **License:** TipTap Teams ($149/mo) - use native components first

---

## Accurate Feature Inventory (2026-02-05)

This is the ground truth of what EXISTS in the codebase. Not what planning
docs claim. Not what the old version had. What's actually here.

### WORKING -- Production Ready

1. **TipTap Core Editor**
   - StarterKit: bold, italic, strike, code, headings H1-H6, blockquote,
     bullet/ordered lists, hard break, undo/redo (100 depth), dropcursor, gapcursor
   - Underline, Highlight (multicolor), Subscript, Superscript
   - Link (auto-detect URLs)
   - TextAlign (heading + paragraph)
   - TextStyle, Color
   - Placeholder, CharacterCount
   - Markdown (paste support, converts markdown to rich text)

2. **Custom Typography Extensions**
   - FontSize (custom extension)
   - FontWeight (custom extension)
   - LineHeight (custom extension)
   - LetterSpacing (custom extension)

3. **Block Indicator System** (1200+ LOC)
   - Blue vertical line on hover
   - Frame mode (Option held) shows border
   - Option+click multi-block selection
   - Option+Shift+click range selection
   - Click without modifiers deselects all
   - Contiguous blocks grouped into single frame
   - Hide on typing, reappear on mouse move
   - Toggle enable/disable button in toolbar
   - Long-press drag-and-drop with FLIP animations
   - Drop indicator shows where block will land
   - Pagination support (edge detection WIP -- 30px buffer)

4. **Unified Style System**
   - 5-level cascade: Project > Document > Page > Block > Character
   - StyleResolver with caching
   - 6 built-in named styles (h1-h3, body, quote, code)
   - Preset system: typography, colors, canvas, layout, master themes
   - Per-heading custom styles (font, size, weight, spacing, marks, dividers)
   - Global paragraph spacing + per-heading overrides
   - Heading divider support (position, color, thickness, style)
   - CSS variable system (--h1-font-size, etc.)
   - Format painter state (capture/apply marks -- button disabled, needs refinement)
   - Custom saved styles
   - Dynamic configurable options (fonts, weights, colors from store, not hardcoded)

5. **Style Panel** (right-side slide-in)
   - Typography presets
   - Color scheme presets
   - Canvas background presets
   - Layout presets
   - Master theme selection

6. **Tables** (TipTap native table-node, 50+ UI components)
   - Full table creation with grid selector
   - Row/column insert, delete, duplicate, move, extend
   - Merge/split cells
   - Sort rows/columns
   - Cell alignment
   - Header rows toggle
   - Table handles with drag operations
   - Column resize

7. **Pagination Mode**
   - Toggle in header bar
   - Page size selector: A4, Letter, Legal
   - TipTap Pages extension (conditional load)
   - Page gaps with proper dark/light styling
   - VirtualCursor extension for pagination
   - Block indicator works in pagination mode

8. **File Management**
   - Open file (Cmd+O) via Tauri native dialog
   - Save file (Cmd+S)
   - Save As (Cmd+Shift+S)
   - New file (Cmd+N)
   - Auto-save every 30 seconds (debounced)
   - .serq.html format (valid HTML + embedded JSON metadata)
   - Recent files tracking
   - Working folder preference
   - Dirty indicator in title bar + footer
   - Last saved timestamp in footer

9. **Command Palette** (Cmd+P)
   - Custom implementation (not cmdk)
   - 22+ registered commands
   - Fuzzy search
   - Keyboard navigation
   - Grouped by category
   - Shows keyboard shortcuts

10. **Toolbar** (unified)
    - Text formatting (bold, italic, underline, strikethrough, code)
    - Heading selector
    - List/quote/code block buttons
    - Text alignment
    - Link button
    - Color picker (text + highlight)
    - Undo/redo
    - Block indicator toggle
    - Keyboard shortcut tooltips

11. **App Shell**
    - Header: document title, dirty indicator, theme toggle, canvas width, pagination
    - Scrollable content area (continuous or paginated)
    - Footer: character count, zoom slider, last saved time
    - Theme system: light/dark/system detection

12. **Infrastructure**
    - Command Registry
    - SQLite database (tables for versions + comments -- schema only)
    - Preferences store (Tauri plugin-store)
    - Debug bridge (console output piped to ~/.serq-debug.log)
    - App initialization pipeline

13. **Slash Commands** (TipTap native slash-dropdown-menu)

### NOT WORKING / NOT IMPLEMENTED

These features either never existed in this branch or were removed during
the unified style system rebuild:

1. **Export/Import** -- NONE
   - No export menu UI
   - No PDF export
   - No Word (.docx) export
   - No HTML export
   - No Markdown export
   - No Word import
   - No Markdown import
   - (Packages installed: docx, jspdf, html2canvas, mammoth -- zero imports)

2. **Markdown Source View** -- NONE
   - No CodeMirror integration
   - No Cmd+/ toggle
   - No source editing
   - (Packages installed: @uiw/react-codemirror, @codemirror/* -- zero imports)

3. **Version History** -- NONE
   - Database tables exist (schema), but no UI
   - No auto-snapshots
   - No Time Machine panel
   - No version restore

4. **Comments** -- NONE
   - Database table exists (schema), but no UI
   - No comment creation
   - No comment panel
   - No thread/reply system

5. **Focus Mode / Typewriter Mode** -- NONE
   - No focus mode
   - No typewriter scrolling
   - No distraction-free mode

6. **Outline Panel** -- NONE
   - No document outline / table of contents
   - No heading navigation panel

7. **Callout Blocks** -- NONE
   - Extension removed in this branch

8. **Column Layouts** -- NONE
   - ColumnSection/Column extensions removed

9. **Text Float / Wrapping** -- NONE
   - Float CSS removed

10. **Line Numbers** -- NONE
    - Extension removed

11. **Paragraph Numbering** -- NONE
    - Extension removed

12. **AI Integration** -- NONE
    - @tiptap-pro/extension-ai installed but not imported
    - Rust keyring commands commented out
    - No UI

13. **Image Management** -- PARTIAL
    - No custom ResizableImage extension
    - No image resize handles
    - No image float/positioning
    - Basic image insertion works via TipTap

14. **Multi-Selection** -- DISABLED
    - Extension exists but commented out for debugging

15. **Format Painter** -- DISABLED
    - State exists in styleStore
    - Button disabled, needs refinement

### Known Bugs

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | Block indicator edge detection at page boundaries | Medium | block-indicator.ts |
| 2 | Char spacing field doesn't reflect cursor value | Low | toolbar |
| 3 | Heading style divider takes text color not default | Low | style system |

---

## Architecture v4.0

**Master Reference:** `.claude/STYLING-HIERARCHY-ARCHITECTURE.md`

### 5-Level Style Cascade
```
PROJECT (root defaults)
  +-- DOCUMENT (per-doc overrides)
       +-- PAGE (section styles)
            +-- BLOCK (paragraph/heading level)
                 +-- CHARACTER (inline marks)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app shell |
| `src/components/Editor/EditorCore.tsx` | TipTap editor setup |
| `src/components/unified-toolbar/` | Main toolbar |
| `src/components/StylePanel/` | Style presets panel |
| `src/components/CommandPalette/` | Cmd+P command palette |
| `src/components/BlockIndicator/` | Block selection visual |
| `src/extensions/block-indicator.ts` | Block hover/selection/drag (1200+ LOC) |
| `src/extensions/font-size.ts` | Custom font size extension |
| `src/extensions/font-weight.ts` | Custom font weight extension |
| `src/extensions/line-height.ts` | Custom line height extension |
| `src/extensions/letter-spacing.ts` | Custom letter spacing extension |
| `src/extensions/virtual-cursor.ts` | Cursor fix for pagination |
| `src/stores/editorStore.ts` | Document state, pagination, zoom |
| `src/stores/styleStore.ts` | Style presets, per-heading config |
| `src/lib/style-system/` | StyleResolver, types |
| `src/lib/command-registry/` | Command definitions and registry |
| `src/lib/database/` | SQLite schema and connection |
| `src/styles/pagination.css` | Pagination mode styling |
| `src/styles/themes.css` | Light/dark theme variables |
| `.claude/STYLING-HIERARCHY-ARCHITECTURE.md` | Architecture reference |

---

## Commands

```bash
npm run tauri dev          # ALWAYS use this - desktop app
npm run build              # TypeScript check (passes clean)
./scripts/read-log.sh      # Read debug log
./scripts/screenshot.sh    # Capture window
```

---

## Planning Docs Note

The `.planning/` directory contains phase plans and summaries from BOTH the
old version (phases 1-8 GSD) and the TIPTAP-NATIVE-REBUILD-PLAN.md. Many of
those summaries describe work that was done in the previous version and does
NOT exist in this branch. The phase PLANS are still useful as future work
reference, but their SUMMARIES should not be treated as current status.

The accurate status is THIS document's feature inventory above.

---

*Updated: 2026-02-05*
