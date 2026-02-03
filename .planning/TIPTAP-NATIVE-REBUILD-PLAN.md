# SERQ - TipTap Native Rebuild Plan

> **CRITICAL REFERENCE**: This is the master plan for rebuilding SERQ from scratch using 100% TipTap native components. NO CUSTOM CODE until all native features work perfectly.

---

## Project Context

**What We Have:**
- TipTap Teams subscription ($149/month) - FULL ACCESS to all Pro extensions and UI components
- TipTap CLI access for installing UI components as source code
- All packages already installed (see package.json)

**What We're Doing:**
- Burning down all custom code that interferes with TipTap
- Rebuilding from the ground up using TipTap's Notion-like template as reference
- Implementing ALL TipTap features natively before adding any SERQ-specific code

**Reference Template:**
https://template.tiptap.dev/preview/templates/notion-like/

**TipTap Documentation:**
- UI Components: https://tiptap.dev/docs/ui-components/getting-started/overview
- Extensions: https://tiptap.dev/docs/editor/extensions/overview
- Notion-like Template: https://tiptap.dev/docs/ui-components/templates/notion-like-editor

---

## Notion-like Template Features (Our Target)

The Notion-like template includes ALL of these - this is our baseline:

### Text Formatting
- Bold, italic, underline, strikethrough
- Highlight colors, text colors
- Superscript, subscript
- Inline code

### Content Organization
- Slash commands (/) menu for quick insertion
- Floating toolbar on text selection
- Drag-and-drop block reordering
- Turn Into menu for block transformation

### Block Types
- Headings (H1-H6)
- Paragraphs
- Bullet lists, ordered lists, task lists
- Blockquotes
- Code blocks with syntax highlighting
- Horizontal dividers
- Images with alignment controls
- Tables
- Mathematics/equations

### Navigation & Structure
- Text alignment (left/center/right/justify)
- Link management with previews
- Table of Contents
- Undo/redo history

### UI Features
- Dark mode / Light mode
- Responsive design (mobile-optimized)
- 30+ pre-built components

---

## Phase 0: Archive & Clean Slate

### 0.1 Archive Old Code
Move all custom code to `/src/_archived/` for reference:
- `/src/extensions/` → Custom extensions (ResizableImage, SlashCommands, etc.)
- `/src/components/Editor/DragHandle.tsx`
- `/src/hooks/useTauriFileDrop.ts` (the interference source)
- Any other custom implementations

### 0.2 Keep Only Infrastructure
Preserve:
- Tauri configuration (`/src-tauri/`)
- Zustand stores (will need modification but keep structure)
- Basic app shell (`App.tsx` - will be rebuilt)
- TipTap installed components (`/src/components/tiptap-*/`)

---

## Phase 1: Core Editor - Native TipTap Only

**Goal:** A working editor with ALL TipTap native extensions, zero custom code.

### 1.1 StarterKit Extensions (Included by Default)
These come bundled with `@tiptap/starter-kit`:
- [x] Document
- [x] Paragraph
- [x] Text
- [x] Bold
- [x] Italic
- [x] Strike
- [x] Code (inline)
- [x] Heading (H1-H6)
- [x] Blockquote
- [x] Code Block
- [x] Horizontal Rule
- [x] Bullet List
- [x] Ordered List
- [x] List Item
- [x] Hard Break
- [x] History (Undo/Redo)
- [x] Dropcursor
- [x] Gapcursor

### 1.2 Additional Mark Extensions
- [ ] Underline (`@tiptap/extension-underline`)
- [ ] Highlight (`@tiptap/extension-highlight`) - multicolor support
- [ ] Subscript (`@tiptap/extension-subscript`)
- [ ] Superscript (`@tiptap/extension-superscript`)
- [ ] Link (`@tiptap/extension-link`)
- [ ] Text Style (`@tiptap/extension-text-style`) - required for colors

### 1.3 Text Formatting Extensions
- [ ] Color (`@tiptap/extension-color`)
- [ ] Font Family (`@tiptap/extension-font-family`)
- [ ] Font Size (use TipTap native or TextStyle)
- [ ] Text Align (`@tiptap/extension-text-align`)
- [ ] Line Height (if available in Pro)

### 1.4 Table Extensions (Full TableKit)
- [ ] Table (`@tiptap/extension-table`)
- [ ] Table Row (`@tiptap/extension-table-row`)
- [ ] Table Cell (`@tiptap/extension-table-cell`)
- [ ] Table Header (`@tiptap/extension-table-header`)
- [ ] TableKit bundle for full features
- [ ] Table Handle Extension (row/column drag)

### 1.5 Image Extensions
- [ ] Image (`@tiptap/extension-image`)
- [ ] Image Upload Node (TipTap native dropzone)
- [ ] File Handler (`@tiptap/extension-file-handler`) - drag & drop files

### 1.6 List Extensions (Full ListKit)
- [ ] Task List
- [ ] Task Item
- [ ] List Kit (`@tiptap/extension-list-kit`)
- [ ] List Keymap

### 1.7 Navigation & Structure
- [ ] Table of Contents (`@tiptap/extension-table-of-contents`)
- [ ] Unique ID (`@tiptap/extension-unique-id`)
- [ ] Placeholder (`@tiptap/extension-placeholder`)
- [ ] Character Count (`@tiptap/extension-character-count`)
- [ ] Focus (`@tiptap/extension-focus`)
- [ ] Trailing Node

### 1.8 Drag & Drop System (CRITICAL)
- [ ] Drag Handle (`@tiptap/extension-drag-handle`)
- [ ] Drag Handle React (`@tiptap/extension-drag-handle-react`)
- [ ] Node Range (`@tiptap/extension-node-range`)
- [ ] UiState Extension (for isDragging state)
- [ ] File Handler (`@tiptap/extension-file-handler`) - Drag/drop/paste files

### 1.9 Advanced Functionality Extensions
- [ ] Typography - Automatic text correction
- [ ] Invisible Characters - Show spaces, breaks, paragraphs
- [ ] Selection - Preserve selection when editor loses focus
- [ ] Trailing Node - Add node after last block
- [ ] Pages - Page-based document interface (optional)
- [ ] Export - Convert to docx, odt, markdown
- [ ] Import - Load from docx, odt, markdown

### 1.10 Collaboration Extensions (Pro - for later)
- [ ] Collaboration - Real-time editing
- [ ] Collaboration Caret - User cursors
- [ ] Comments - Inline discussions
- [ ] Snapshot - Version history

### 1.11 AI Extensions (Pro - for later)
- [ ] AI Generation - AI text generation
- [ ] AI Toolkit - AI agents for document manipulation
- [ ] Server AI Toolkit - Server-side AI capabilities

---

## Phase 2: UI Components - Full TipTap Native

**Goal:** Complete UI matching TipTap's Notion-like template with light/dark mode.

### 2.1 Primitive Components (Foundation)
Already installed in `/src/components/tiptap-ui-primitive/`:
- [ ] Avatar - Visual representation of user/entity
- [ ] Badge - Small visual indicators
- [ ] Button - Core button component with button-colors.scss
- [ ] Button Group
- [ ] Card - Flexible container for content
- [ ] Combobox - Searchable dropdown with filtering
- [ ] Dropdown Menu
- [ ] Input - Text entry field
- [ ] Label - Semantic label component
- [ ] Menu - Hierarchical navigation with search/filtering
- [ ] Popover - Pop-up UI element
- [ ] Separator - Visual dividers
- [ ] Spacer - Spacing between items
- [ ] Textarea Autosize - Auto-expanding textarea
- [ ] Toolbar - Organize actions and controls
- [ ] Tooltip - Hover popup information

### 2.2 Formatting Buttons
- [ ] Mark Button - Bold, italic, underline, strike, code toggles
- [ ] Heading Button - Toggle through headings
- [ ] Heading Dropdown Menu - Select heading levels
- [ ] Text Button - Transform to paragraph text
- [ ] Text Align Button - Left/center/right/justify
- [ ] List Button - Toggle bullet/ordered/task lists
- [ ] List Dropdown Menu - Select list type
- [ ] Blockquote Button - Toggle blockquotes
- [ ] Code Block Button - Toggle code blocks
- [ ] Undo Redo Button - History navigation

### 2.3 Color Controls
- [ ] Color Text Button - Apply text colors
- [ ] Color Text Popover - Full color picker with recent colors
- [ ] Color Highlight Button - Apply highlight colors
- [ ] Color Highlight Popover - Highlight color picker

### 2.4 Link Controls
- [ ] Link Popover - Edit/create links with preview

### 2.5 Image Controls
- [ ] Image Upload Button - Trigger image upload
- [ ] Image Align Button - Control image alignment
- [ ] Image Download Button - Download image (context menu)

### 2.6 Block Operations
- [ ] Drag Context Menu - + button and drag handle with full context menu
- [ ] Slash Command Trigger Button - Insert slash trigger
- [ ] Slash Dropdown Menu - Full slash command interface
- [ ] Turn Into Dropdown - Transform between block types
- [ ] Delete Node Button - Delete nodes
- [ ] Duplicate Button - Duplicate nodes
- [ ] Copy to Clipboard Button - Copy content
- [ ] Copy Anchor Link Button - Copy anchor links
- [ ] Move Node Button - Move nodes up/down
- [ ] Reset All Formatting Button - Remove all formatting

### 2.7 Table Controls
- [ ] Table Handle - Row/column operations
- [ ] Table Handle Menu
- [ ] Table Trigger Button
- [ ] Table Grid Selector
- [ ] Table Alignment Menu
- [ ] Table Merge/Split Cell Button

### 2.8 Menus & Floating Elements
- [ ] Floating Menu - Appears on empty lines
- [ ] Bubble Menu - Appears on text selection
- [ ] Floating Element - Versatile floating UI positioning
- [ ] Suggestion Menu - Powerful suggestion system with keyboard nav

### 2.9 AI Components (Pro - Optional for later)
- [ ] AI Ask Button - Trigger AI content generation
- [ ] AI Menu - AI-powered editing menu
- [ ] Improve Dropdown - AI improvements (grammar, tone, translation)

### 2.10 Social Features
- [ ] Emoji Trigger Button - Insert emoji trigger
- [ ] Emoji Dropdown Menu - Emoji suggestions (:trigger)
- [ ] Emoji Menu - Interactive emoji picker with search
- [ ] Mention Trigger Button - Insert mention trigger
- [ ] Mention Dropdown Menu - User mention suggestions

---

## Phase 3: Node Views - Full Visual Implementation

**Goal:** All block types render beautifully with proper styling.

### 3.1 Node Components (TipTap Native)
Already partially installed in `/src/components/tiptap-node/`:
- [ ] Paragraph Node - Basic text blocks
- [ ] Heading Node - H1-H6 with proper styling
- [ ] Blockquote Node - Styled quotes
- [ ] Code Block Node - Syntax highlighted code
- [ ] List Node - Bullet, ordered, task lists
- [ ] Horizontal Rule Node - Dividers
- [ ] Image Node - Basic image display
- [ ] Image Node Pro - Enhanced with floating toolbar, alignment controls
- [ ] Image Upload Node - Drag/drop upload interface
- [ ] Table Node - Full table with all features
- [ ] Table of Contents Node - Document navigation with sidebar

### 3.2 Additional Node Extensions (From TipTap)
- [ ] Details Node - Collapsible content (accordion)
- [ ] Details Content
- [ ] Details Summary
- [ ] Audio Node - Audio playback
- [ ] YouTube Node - Embedded YouTube
- [ ] Twitch Node - Embedded Twitch
- [ ] Mathematics Node - LaTeX math rendering
- [ ] Emoji Node - Inline emoji

### 3.3 Node Styling Requirements
Each node needs:
- Light mode styling
- Dark mode styling
- Proper spacing/padding
- Hover states
- Selection states
- Drag states
- Focus indicators

---

## Phase 4: Theming & Polish

### 4.1 Light Mode
- [ ] All components styled for light mode
- [ ] Proper contrast ratios
- [ ] Consistent color palette

### 4.2 Dark Mode
- [ ] All components styled for dark mode
- [ ] Proper contrast ratios
- [ ] CSS variables for theme switching

### 4.3 Typography
- [ ] Font stack configuration
- [ ] Heading sizes (H1-H6)
- [ ] Body text sizing
- [ ] Line heights
- [ ] Letter spacing

### 4.4 Spacing System
- [ ] Consistent padding
- [ ] Proper margins between blocks
- [ ] Whitespace management

---

## Phase 5: Full App Shell with Complete UI

**Goal:** Full-featured editor UI exactly like TipTap's Notion-like template - NOT minimal.

### 5.1 Main Toolbar (Top Bar)
- [ ] Complete formatting toolbar with all operations
- [ ] Heading dropdown (H1-H6, paragraph)
- [ ] Text formatting buttons (bold, italic, underline, strike, code)
- [ ] List buttons (bullet, ordered, task)
- [ ] Text alignment buttons
- [ ] Color text button with popover
- [ ] Highlight button with popover
- [ ] Link button with popover
- [ ] Image upload button
- [ ] Table insert button with grid selector
- [ ] Blockquote button
- [ ] Code block button
- [ ] Undo/Redo buttons
- [ ] More options dropdown

### 5.2 Bubble Menu (Text Selection)
- [ ] Appears when text is selected
- [ ] Bold, italic, underline, strike toggles
- [ ] Link creation/editing
- [ ] Color text picker
- [ ] Highlight picker
- [ ] Code toggle
- [ ] Turn Into dropdown
- [ ] AI options (if enabled)
- [ ] Comment button (for later)

### 5.3 Floating Menu (Empty Lines)
- [ ] Appears on empty paragraphs
- [ ] Quick block insertion
- [ ] Slash command trigger
- [ ] Common block types

### 5.4 Drag Context Menu (Block Operations)
- [ ] + button for slash commands
- [ ] Drag handle for reordering
- [ ] Context menu with:
  - Turn Into submenu
  - Duplicate
  - Copy to clipboard
  - Copy anchor link
  - Delete
  - Move up/down
  - Color/styling options

### 5.5 Table Controls
- [ ] Row handle menu (add above/below, delete, move)
- [ ] Column handle menu (add left/right, delete, move)
- [ ] Cell selection with multi-select
- [ ] Merge/split cells
- [ ] Table alignment
- [ ] Column resize handles
- [ ] Header row/column toggle

### 5.6 Image Controls
- [ ] Floating toolbar on image selection
- [ ] Alignment controls (left, center, right)
- [ ] Resize handles
- [ ] Caption editing (if supported)
- [ ] Download option
- [ ] Delete option

### 5.7 Link Popover
- [ ] Edit link URL
- [ ] Edit link text
- [ ] Open in new tab toggle
- [ ] Remove link
- [ ] Link preview

### 5.8 Color Pickers
- [ ] Text color popover with:
  - Preset colors
  - Recent colors
  - Custom color input
  - Remove color option
- [ ] Highlight color popover with same features

### 5.9 Slash Command Menu
- [ ] Full / command palette
- [ ] Searchable/filterable
- [ ] Keyboard navigation
- [ ] All block types:
  - Text, Heading 1-6
  - Bullet list, Ordered list, Task list
  - Quote, Code block
  - Image, Table
  - Divider
  - Emoji (if enabled)
  - Mention (if enabled)

### 5.10 Canvas & Layout
- [ ] Continuous scroll canvas
- [ ] Width controls (narrow, normal, wide, full)
- [ ] Proper centering and margins
- [ ] Responsive design

### 5.11 App Chrome
- [ ] Header bar with:
  - App name/logo
  - Document title (editable)
  - Save indicator
  - Theme toggle
  - Export menu
- [ ] Status bar with:
  - Word count
  - Character count
  - Reading time (optional)
  - Cursor position (optional)

### 5.12 Theme System
- [ ] Light mode - complete styling
- [ ] Dark mode - complete styling
- [ ] System theme detection
- [ ] Manual toggle
- [ ] Persistent preference
- [ ] All components respect theme

### 5.13 Tauri Integration
- [ ] File open dialog
- [ ] File save dialog
- [ ] Save as dialog
- [ ] Recent files (optional)
- [ ] Native window controls
- [ ] Keyboard shortcuts (Cmd+S, Cmd+O, etc.)

---

## Phase 6: TipTap Pro Features (Pagination, Export/Import)

These features use TipTap Pro extensions and standard libraries. They're "Pro" features but not SERQ-custom.

### 6.1 PDF Export Optimization
**Problem:** Current PDF exports are 80MB+ for simple documents.
**Solution:** Switch from PNG to JPEG with compression.
- [ ] Replace `canvas.toDataURL('image/png')` with `canvas.toDataURL('image/jpeg', 0.75)`
- [ ] Use 'FAST' compression flag in jsPDF addImage()
- [ ] Target: Under 5MB for text-only documents
- [ ] Visual quality must remain acceptable (readable text, no artifacts)

### 6.2 Word (.docx) Export
**Library:** `docx` npm package (standard, 365+ projects use it)
- [ ] Install docx package
- [ ] Create TipTap-to-docx converter (`src/lib/docx-converter.ts`)
- [ ] Support all node types: headings, paragraphs, lists, blockquotes, code blocks, tables, images, callouts
- [ ] Add "Export to Word" option in ExportMenu
- [ ] Handle inline formatting: bold, italic, underline, strike, highlight
- [ ] Handle images from base64 to Uint8Array
- [ ] Files should open correctly in Microsoft Word, Google Docs, LibreOffice

### 6.3 Pagination Mode
**Purpose:** Print-ready documents with visual page boundaries.
- [ ] Add pagination state to editorStore: `{ enabled: boolean, pageSize: 'a4' | 'letter' | 'legal' }`
- [ ] Create `/src/styles/pagination.css` with CSS @page rules
- [ ] Visual page boundaries in editor (gray lines at page breaks)
- [ ] Page size selector (A4, Letter, Legal)
- [ ] CSS break-inside/break-after rules to avoid breaking headings, tables, images
- [ ] @page :first for different first page margins
- [ ] Print preview respects page size
- [ ] Toggle in toolbar: "Pages: On/Off"

**Page Dimensions:**
- A4: 21cm × 29.7cm
- Letter: 21.6cm × 27.9cm
- Legal: 21.6cm × 35.6cm

### 6.4 Markdown Source View
**Purpose:** Power users want to see/edit raw Markdown.
- [ ] Install CodeMirror packages: `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@codemirror/theme-one-dark`
- [ ] Create `MarkdownEditor.tsx` component with syntax highlighting
- [ ] Add viewMode state to editorStore: `'rendered' | 'source'`
- [ ] Keyboard shortcut: Cmd+/ toggles between modes
- [ ] When switching to source: convert TipTap JSON to Markdown
- [ ] When switching back: parse Markdown and update editor
- [ ] Syntax highlighting for headers, bold, italic, lists, links, code
- [ ] Light and dark theme support

### 6.5 Additional Export Formats
- [ ] ePub export (JSZip already installed)
- [ ] HTML export (existing)
- [ ] Markdown export (existing - refine with jsonToMarkdown)
- [ ] Plain text export

### 6.6 Import Capabilities
- [ ] Word import (Mammoth.js - already installed)
- [ ] Markdown import (TipTap markdown extension)
- [ ] HTML import
- [ ] Drag & drop file import

### 6.7 Auto-Save
- [ ] Auto-save on idle (after typing stops for 2 seconds)
- [ ] Auto-save on blur (when app loses focus)
- [ ] Save indicator in header (Saved/Saving.../Unsaved)
- [ ] Preserve to SQLite or filesystem via Tauri

---

## Phase 7: SERQ Advanced Layout Features

These features transform SERQ from a simple editor into a professional document tool.

### 7.1 Multi-Column Layouts
**CRITICAL: Columns are BLOCK-BASED, not document-wide.**

**Requirements:**
- [ ] Support 2-6 columns
- [ ] Two modes:
  - **Fixed mode (DEFAULT)**: Each column has independent content
  - **Flowing mode**: Text flows column to column (magazine style)
- [ ] Resizable gutters (drag column borders)
- [ ] Width presets: Equal, 1:2, 2:1, 1:1:2, custom drag
- [ ] Optional visible borders between columns
- [ ] ANY block type can live inside columns (images, tables, callouts)

**Creation Methods:**
- [ ] Select + Convert: Highlight paragraphs → right-click → "Convert to Columns"
- [ ] Insert Empty: Insert empty column container → click inside to type
- [ ] Slash Command: `/columns` → select column count
- [ ] Drag Content: Create columns → drag blocks into each column

**Technical:**
```
ColumnSection (parent node)
├── Column (child, content: 'block+')
├── Column (child)
└── Column (child)

Attributes: columnCount, columnWidths[], mode, showBorders, gap
CSS: Grid (NOT CSS columns)
```

**Commands:**
- `insertColumns({ count, mode })`
- `convertToColumns({ count })`
- `setColumnCount(n)`
- `setColumnMode(mode)`
- `toggleColumnBorders()`
- `removeColumns()`

### 7.2 Text Wrapping / Float
- [ ] Float images left (text wraps on right)
- [ ] Float images right (text wraps on left)
- [ ] Center with wrap both sides
- [ ] Clear option (force text below floats)
- [ ] Headings automatically clear floats
- [ ] Works with images, callouts, any block

**CSS:**
```css
.block-float-left { float: left; margin-right: 1rem; }
.block-float-right { float: right; margin-left: 1rem; }
.clear-float { clear: both; }
```

### 7.3 Line Numbers
**Display Styles:**
- [ ] Code-style gutter (permanent visible gutter)
- [ ] Legal/academic style (for citations, court documents)

**Position Options:**
- [ ] Left gutter (outside canvas margins)
- [ ] Left margin (inside canvas)

**Activation:** Right-click context menu → "Toggle Line Numbers"

**Technical:**
- ProseMirror Plugin with widget decorations
- Only render visible line numbers (viewport-based)
- Incremental updates via transaction mapping

### 7.4 Paragraph Numbering
**What Gets Numbered:** ALL block elements (paragraphs, headings, lists, blockquotes, callouts)

**Presets Only (NO custom config):**

**Sequential Styles:**
| Preset | Example |
|--------|---------|
| `seq-numeric` | 1, 2, 3, 4... |
| `seq-roman` | I, II, III, IV... |
| `seq-roman-lower` | i, ii, iii, iv... |
| `seq-alpha` | a, b, c, d... |
| `seq-alpha-upper` | A, B, C, D... |
| `seq-hex` | 0x1, 0x2, 0x3... |

**Hierarchical Styles:**
| Preset | Example |
|--------|---------|
| `hier-numeric` | 1, 1.1, 1.2, 2, 2.1... |
| `hier-roman` | I, I.i, I.ii, II... |
| `hier-alpha` | A, A.a, A.b, B... |

**Legal Multi-Level:**
| Preset | Format per Level |
|--------|------------------|
| `legal-standard` | Article 1, Section 1.1, Clause 1.1.1 |
| `legal-outline` | I., A., 1., a), (1), (a) |
| `legal-contract` | 1., 1.1, 1.1.1, (a), (i) |

- [ ] Preset picker UI with visual previews
- [ ] Can be active simultaneously with line numbers

---

## Phase 8: SERQ Core Differentiators

These features are what make SERQ unique. ONLY add after Phases 1-7 complete.

### 8.1 Version History
- [ ] Auto-snapshots (every 5 minutes of activity, or on save)
- [ ] SQLite storage for versions (Tauri native)
- [ ] Version list panel with:
  - Timestamp
  - Preview
  - Size/word count delta
- [ ] Time Machine UI: slider to scrub through versions
- [ ] Restore to any version
- [ ] Compare versions side-by-side
- [ ] Track changes diff view (green additions, red deletions)

### 8.2 Comments System
- [ ] Inline comments (TipTap Comments extension)
- [ ] Comment panel sidebar
- [ ] Comment resolution workflow
- [ ] Comment threads
- [ ] User attribution

### 8.3 Document Management
- [ ] File save/load (Tauri native dialogs)
- [ ] Recent documents list
- [ ] Auto-save with dirty state tracking
- [ ] Unsaved changes warning on close

### 8.4 Custom Callout Blocks
- [ ] Multiple callout types: info, warning, success, error, note
- [ ] Color-coded borders and backgrounds
- [ ] Icon support
- [ ] Collapsible option

### 8.5 Focus Mode
- [ ] Full-screen editor only (no panels, no toolbar)
- [ ] Dim everything except current paragraph
- [ ] Hide all UI with fade-in on hover
- [ ] Optional combination with typewriter mode
- [ ] Escape to exit

### 8.6 RTL (Right-to-Left) Support
- [ ] Document-level RTL/LTR toggle
- [ ] Paragraph-level direction override
- [ ] Auto-detect direction from content
- [ ] Proper cursor movement in RTL mode
- [ ] Bidi text handling (mixed LTR/RTL content)
- [ ] Mirror UI elements when in RTL mode (optional)

### 8.7 Writing Statistics
- [ ] Word count, character count (basic - already have)
- [ ] Reading time estimate
- [ ] Readability scores (Flesch-Kincaid, etc.)
- [ ] Sentence/paragraph length distribution
- [ ] Writing session tracking (words per session, time spent)
- [ ] Historical trends (words written per day/week)

### 8.8 Additional Features (Backlog)
- [ ] Table formulas (Excel-like)
- [ ] Table border stylization
- [ ] Zoom slider in status bar
- [ ] Style panels rework
- [ ] Image gallery for multiple images
- [ ] Task management
- [ ] Project/folder management
- [ ] Long-form writing tools (chapters, sections)
- [ ] Writing goals (daily word targets)
- [ ] Splash screen
- [ ] Logo incorporation
- [ ] App settings panel
- [ ] Keyboard shortcuts panel
- [ ] Integrations (cloud storage, sharing)
- [ ] Block rearrangement matrix view
- [ ] Pomodoro time tracking
- [ ] Image management panel
- [ ] Document translation

---

## Technical Notes

### TipTap CLI Usage
```bash
# Install a UI component as source code
npx @tiptap/cli add <component-name>

# List available components
npx @tiptap/cli list
```

### Required npm Packages (Already Installed)
```json
{
  "@tiptap/core": "^3.18.0",
  "@tiptap/react": "^3.18.0",
  "@tiptap/starter-kit": "^3.18.0",
  "@tiptap/pm": "^3.18.0",
  "@tiptap/extension-*": "various",
  "@tiptap-pro/extension-*": "various"
}
```

### File Structure After Rebuild
```
/src
  /components
    /tiptap-extension/     # TipTap extension configs
    /tiptap-icons/         # TipTap icons (already installed)
    /tiptap-node/          # TipTap node views (already installed)
    /tiptap-ui/            # TipTap UI components (already installed)
    /tiptap-ui-primitive/  # TipTap primitives (already installed)
    /tiptap-ui-utils/      # TipTap utilities (already installed)
    /Editor/
      EditorCore.tsx       # Main editor - NATIVE ONLY
      index.ts
    /Layout/
      Canvas.tsx           # Simple canvas wrapper
  /hooks
    /use-tiptap-editor.ts  # TipTap provided hook
    (other TipTap hooks)
  /lib
    /tiptap-utils.ts       # TipTap utilities
  /stores
    /editorStore.ts        # Simplified - document state only
  /styles
    /editor.css            # Minimal - mostly TipTap native
  App.tsx                  # Simplified app shell
  main.tsx
```

---

## Success Criteria

### Before Phase 6 (TipTap Pro Features)
ALL of the following must work EXACTLY like TipTap's Notion-like template:

### 1. Typing & Formatting
- [ ] Type text naturally
- [ ] Bold, italic, underline, strike, code all work
- [ ] Headings H1-H6 with proper styling
- [ ] Lists (bullet, ordered, task) with nesting
- [ ] Blockquotes styled correctly
- [ ] Code blocks with syntax highlighting
- [ ] Horizontal rules

### 2. Toolbar Operations
- [ ] All toolbar buttons functional
- [ ] Heading dropdown works
- [ ] All formatting toggles work
- [ ] Color pickers open and apply colors
- [ ] Link creation works from toolbar
- [ ] Table insertion with grid selector works
- [ ] Undo/redo work

### 3. Bubble Menu (Text Selection)
- [ ] Appears on text selection
- [ ] All formatting options work
- [ ] Link editing works
- [ ] Color options work
- [ ] Disappears correctly when deselected

### 4. Floating Menu (Empty Lines)
- [ ] Appears on empty paragraphs
- [ ] Block insertion options work
- [ ] Slash command trigger works

### 5. Drag & Block Operations
- [ ] Drag handle appears on block hover
- [ ] Can drag blocks to reorder (CRITICAL)
- [ ] + button opens slash menu
- [ ] Context menu shows all options
- [ ] Turn Into menu works
- [ ] Duplicate, delete, copy all work

### 6. Slash Commands
- [ ] / triggers command palette
- [ ] Can search/filter commands
- [ ] Keyboard navigation works
- [ ] All block types insertable
- [ ] Menu closes on selection or Escape

### 7. Tables (Full Feature Set)
- [ ] Insert table via slash or toolbar
- [ ] Add/remove rows and columns
- [ ] Resize columns by dragging
- [ ] Row/column handles appear on hover
- [ ] Cell selection works (click, shift+click, drag)
- [ ] Multi-cell selection works
- [ ] Merge cells works
- [ ] Split cells works
- [ ] Header row/column toggle works
- [ ] Table alignment works

### 8. Images
- [ ] Insert via slash command
- [ ] Insert via toolbar button
- [ ] Drag/drop from desktop works
- [ ] Paste image works
- [ ] Image displays correctly
- [ ] Alignment controls work (left, center, right)
- [ ] Floating toolbar appears on selection

### 9. Links
- [ ] Create link via toolbar
- [ ] Create link via bubble menu
- [ ] Create link via keyboard shortcut (Cmd+K)
- [ ] Link popover shows on click
- [ ] Can edit URL
- [ ] Can remove link
- [ ] Link preview works

### 10. Color System
- [ ] Text color picker opens
- [ ] Preset colors work
- [ ] Recent colors shown
- [ ] Color applies to selected text
- [ ] Highlight picker works same way
- [ ] Colors persist on save/load

### 11. Theme System
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] All components respect theme
- [ ] Toggle works instantly
- [ ] Preference persists

### 12. Keyboard Shortcuts
- [ ] Cmd+B = Bold
- [ ] Cmd+I = Italic
- [ ] Cmd+U = Underline
- [ ] Cmd+K = Link
- [ ] Cmd+Z = Undo
- [ ] Cmd+Shift+Z = Redo
- [ ] Tab/Shift+Tab for list indentation
- [ ] Enter for new paragraph
- [ ] Shift+Enter for soft break

### 13. Visual Polish
- [ ] Proper spacing between blocks
- [ ] Consistent typography
- [ ] Smooth animations/transitions
- [ ] No visual glitches
- [ ] Proper hover states
- [ ] Proper focus states
- [ ] Selection styling correct

### 14. Zero Interference
- [ ] No custom code blocking TipTap
- [ ] No console errors
- [ ] No React warnings
- [ ] Clean startup
- [ ] No performance issues

---

### Before Phase 7 (Advanced Layout)
Phase 6 success criteria:

- [ ] PDF export produces files < 5MB for text documents
- [ ] Word export preserves all formatting, opens in Word/Google Docs
- [ ] Pagination mode shows visual page breaks
- [ ] Page size selector works (A4, Letter, Legal)
- [ ] Markdown source view toggles with Cmd+/
- [ ] Syntax highlighting in source view
- [ ] Auto-save triggers on idle and blur
- [ ] All export formats work (PDF, Word, ePub, HTML, Markdown)

---

### Before Phase 8 (SERQ Differentiators)
Phase 7 success criteria:

- [ ] Multi-column layouts insert via /columns
- [ ] 2-6 column support working
- [ ] Column resize by dragging borders
- [ ] Fixed and flowing modes both work
- [ ] Text wrap/float works for images
- [ ] Line numbers display in gutter or margin
- [ ] Paragraph numbering with all presets
- [ ] Sequential, hierarchical, and legal styles work

---

## Cross-Session Memory

**IMPORTANT FOR FUTURE SESSIONS:**

1. SERQ is a Tauri desktop app - always use `npm run tauri dev`
2. We have TipTap Teams subscription ($149/month) - use ALL Pro features
3. The rebuild is 100% TipTap native FIRST
4. NO custom extensions until Phases 1-5 complete
5. Reference template: https://template.tiptap.dev/preview/templates/notion-like/
6. Old code is archived in `/src/_archived/`
7. This plan is the ONLY roadmap - ignore old plans

**Phase Summary:**
- **Phase 0:** Archive & Clean Slate
- **Phase 1:** Core Editor - Native TipTap Extensions
- **Phase 2:** UI Components - Full TipTap Native
- **Phase 3:** Node Views - Full Visual Implementation
- **Phase 4:** Theming & Polish
- **Phase 5:** Full App Shell with Complete UI
- **Phase 6:** TipTap Pro Features (Pagination, Export/Import, Markdown Source)
- **Phase 7:** SERQ Advanced Layout (Columns, Line Numbers, Paragraph Numbering)
- **Phase 8:** SERQ Core Differentiators (Version History, Comments, Focus Mode, RTL, Stats)

**Key Technical Decisions:**
- PDF: Use JPEG at 0.75 quality + FAST compression (not PNG)
- Word: Use `docx` npm package (not custom OOXML)
- Pagination: CSS @page rules + visual boundaries in editor
- Markdown: CodeMirror for source editing (not raw textarea)
- Columns: CSS Grid-based (not CSS columns property)
- Line Numbers: ProseMirror Plugin with viewport-based rendering
- Version History: SQLite storage via Tauri

**Dependencies Between Phases:**
- Phases 1-5 must complete before Phase 6
- Phase 6 (Export/Import) can run parallel within itself
- Phase 7 (Layout) depends on Phase 5 (App Shell)
- Phase 8 (Differentiators) depends on Phase 6 complete

---

*Created: February 2, 2026*
*Last Updated: February 2, 2026*
