# SERQ v1 Gap Analysis and Completion Plan

**Created:** 2026-02-02
**Purpose:** Comprehensive plan integrating TipTap Pro features, pending phases, and all todos for SERQ v1 completion.

---

## Executive Summary

SERQ is 97% complete (33/34 plans across 8 phases). This document consolidates:
- **TipTap Pro integration** ($149/mo Team plan acquired)
- **TipTap UI Components** - Replace ALL custom UI with TipTap components
- **DragHandle Extension** - Notion-style block rearrangement
- **Remaining GSD phases** (6, 8 pending verification)
- **25 pending todos** with user comments
- **UI/UX beautification** (final phase)

**NPM Token:** `dzX0eH5dWaDGX68jCXh7RWBoBYkncaQKbYI7GovqwGh7taq03qJhAtx6ngzb5biw`

---

## PHASE 0: TipTap UI Migration (FIRST PRIORITY)

**Goal:** Replace ALL existing custom UI with TipTap UI Components for consistent, professional appearance during development.

**Why First:** Ensures all subsequent development uses TipTap's design language. No more mismatched UI.

### TipTap UI Components to Install

**Primitives (15 - Foundation):**
- Button, Toolbar, Dropdown Menu, Popover, Tooltip
- Input, Label, Textarea Autosize
- Avatar, Badge, Card, Combobox, Menu, Separator, Spacer

**Open Source Components (use immediately):**
- Blockquote Button, Code Block Button
- Heading Button, Heading Dropdown
- List Button, List Dropdown
- Mark Button (bold, italic, etc.)
- Text Align Button
- Image Upload Button
- Link Popover
- Undo/Redo Button

**Paid Components (Team plan includes):**
- **Drag Context Menu** - Notion-style drag handles with context menu
- **Slash Dropdown Menu** - Slash commands interface
- **Color Highlight/Text Popover** - Color pickers
- **Emoji Menu/Dropdown** - Emoji picker
- **Turn Into Dropdown** - Block type conversion
- **AI Menu, AI Ask Button** - AI interface components

### Phase 0 Plans

| Plan | Description |
|------|-------------|
| 00-01 | TipTap CLI Setup and Component Installation |
| 00-02 | Replace EditorToolbar with TipTap Toolbar Components |
| 00-03 | Replace Command Palette with TipTap Slash Dropdown |
| 00-04 | Add DragHandle Extension with Drag Context Menu |
| 00-05 | Replace Style Panel controls with TipTap Primitives |
| 00-06 | Replace all modals/popovers with TipTap Primitives |

### Installation Commands

```bash
# Login to TipTap (required for Team plan access)
npx @tiptap/cli@latest login

# Initialize project with TipTap UI (if new) or add to existing:
npx @tiptap/cli@latest init   # For new setup with prompts
# OR add individual components:
npx @tiptap/cli@latest add primitives
npx @tiptap/cli@latest add drag-context-menu
npx @tiptap/cli@latest add slash-dropdown-menu
npx @tiptap/cli@latest add heading-dropdown
npx @tiptap/cli@latest add list-dropdown
npx @tiptap/cli@latest add link-popover
npx @tiptap/cli@latest add color-highlight-popover

# Install DragHandle Pro extension (via npm with .npmrc token)
npm install @tiptap-pro/extension-drag-handle-react @tiptap-pro/extension-node-range
```

**Note:** TipTap CLI adds components as **source code** to your project (not npm packages). This gives full customization control. Components will be added to `src/components/tiptap/` or similar.

### Components to Replace

| Current Component | Replace With |
|-------------------|--------------|
| `EditorToolbar.tsx` buttons | TipTap Mark/Heading/List/TextAlign Buttons |
| `CommandPalette.tsx` | TipTap Slash Dropdown Menu |
| `TableContextMenu.tsx` | TipTap Dropdown Menu primitive |
| `StylePanel.tsx` controls | TipTap Button, Dropdown, Popover primitives |
| `VersionHistoryPanel.tsx` UI | TipTap Card, Button primitives |
| `CommentsPanel.tsx` UI | TipTap Card, Input, Button primitives |
| All custom modals | TipTap Popover primitive |
| All custom tooltips | TipTap Tooltip primitive |

### Styling Configuration

```typescript
// Configure TipTap styles in index.css or App.css
@import '@tiptap/ui-components/styles/base.css';
@import '@tiptap/ui-components/styles/components.css';

// Use TipTap CSS variables for consistency
:root {
  --tiptap-color-primary: /* your brand color */;
  --tiptap-color-background: /* your background */;
}
```

### DragHandle Configuration

```typescript
import { DragHandleReact } from '@tiptap-pro/extension-drag-handle-react';

// In EditorCore.tsx
const editor = useEditor({
  extensions: [
    // ... existing extensions
    DragHandleReact.configure({
      render: () => {
        // Use TipTap Drag Context Menu component
        return <DragContextMenu />;
      },
    }),
  ],
});
```

---

## Current Status

### Completed Phases

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 1 | Editor Foundation | 4/4 | Complete |
| 2 | File Management | 4/4 | Complete |
| 3 | Style System | 4/4 | Complete |
| 4 | Extended Features | 6/6 | Complete |
| 5 | Polish | 7/7 | Complete |
| 7 | Layout and Numbering | 5/5 | Complete |

### Pending Phases

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 6 | AI Integration | 0/4 | Not Started |
| 8 | Document Output | 4/5 | Verification Pending |

---

## TipTap Pro Features Integration

### Features Acquired (Team Plan $149/mo)

| Feature | Status | Use Case |
|---------|--------|----------|
| **Pages Extension** | INTEGRATE | Node-based pagination (A4/Letter/Legal), headers/footers, page numbers |
| **AI Generation** | INTEGRATE | Simple AI commands (summarize, rephrase, extend, grammar, tone) |
| **AI Toolkit** | EVALUATE | Full AI agents with document manipulation, streaming |
| **Conversion** | INTEGRATE | Word/DOCX import/export (replaces mammoth.js) |
| **Free Pro Extensions** | INTEGRATE | Details, Emoji, FileHandler, Mention, UniqueID, ListKeymap |

### Features Requiring Cloud (Skip)

| Feature | Reason |
|---------|--------|
| Comments (Pro) | We have single-user comments implemented |
| Collaboration | Requires cloud documents, v2 scope |
| Version History (Pro) | We have SQLite version history implemented |
| Content AI | Requires cloud subscription |

### TipTap Pro NPM Configuration

```bash
# .npmrc (create in project root)
@tiptap-pro:registry=https://registry.tiptap.dev/
//registry.tiptap.dev/:_authToken=dzX0eH5dWaDGX68jCXh7RWBoBYkncaQKbYI7GovqwGh7taq03qJhAtx6ngzb5biw
```

---

## Revised Phase Structure

### Phase 6: AI Integration (REVISED - TipTap Pro)

**Goal:** Users can stylize text using AI with streaming response, preview, and accept/reject workflow.

**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05

**Revised Plans:**

| Plan | Description | Notes |
|------|-------------|-------|
| 06-01 | TipTap Pro AI Setup | Install AI Generation + AI Toolkit, configure provider |
| 06-02 | AI Provider Backend | Claude API via Tauri Rust, keyring storage |
| 06-03 | AI Commands Integration | Wire AI Generation to command palette and slash commands |
| 06-04 | AI Preview UI | Streaming preview, diff view, accept/reject |

**Key Change:** Use TipTap AI Generation/Toolkit instead of building from scratch.

---

### Phase 8: Document Output (REVISED - TipTap Pages)

**Goal:** Users can create print-ready paginated documents with proper headers/footers.

**Completed Plans:**
- 08-01: PDF JPEG compression (COMPLETE)
- 08-02: Word export via docx.js (COMPLETE - but consider TipTap Conversion)
- 08-03: CSS-only pagination (COMPLETE - REPLACE with TipTap Pages)
- 08-04: Markdown source view (COMPLETE)

**Revised Plans:**

| Plan | Description | Notes |
|------|-------------|-------|
| 08-03-REVISED | TipTap Pages Integration | Node-based pagination replacing CSS-only approach |
| 08-05 | Human Verification | Test all Phase 8 features |

**TipTap Pages Features:**
- Page sizes: A4, A3, A5, Letter, Legal, Tabloid
- Headers/footers with {page}/{total} tokens
- Custom margins per page size
- Page breaks (hard and soft)
- Print-ready output

---

### Phase 9: Settings and Configuration (NEW)

**Goal:** Users can configure app preferences, keyboard shortcuts, and integrations.

**Source Todos:**
- 2026-02-01-app-settings-phase.md
- 2026-02-01-shortcuts-panel.md
- 2026-02-01-integrations-and-sharing.md

**Plans:**

| Plan | Description |
|------|-------------|
| 09-01 | Settings Infrastructure | tauri-plugin-store, preferences schema |
| 09-02 | Settings Panel UI | Modal with categorized sections |
| 09-03 | Keyboard Shortcuts Manager | View, rebind, conflict detection |
| 09-04 | Integrations Framework | OAuth foundations for future sharing |

**Settings Categories:**
- General (language, updates)
- Editor (default styles, auto-save, spell-check)
- Files (working folder, backup, recent files limit)
- Appearance (theme, density)
- Keyboard shortcuts
- Export defaults
- Integrations (connection management)

---

### Phase 10: Extended Editor Features (NEW)

**Goal:** Users have advanced table, image, and layout capabilities.

**Source Todos:**
- 2026-01-31-excel-like-table-formulas.md
- 2026-02-01-columns-and-text-wrap.md (enhancement)
- 2026-02-01-table-borders-stylization.md
- 2026-02-01-multiple-image-gallery.md
- 2026-02-01-image-management-panel.md

**Plans:**

| Plan | Description |
|------|-------------|
| 10-01 | Table Formulas | Excel-like formulas (SUM, AVERAGE, IF, etc.) |
| 10-02 | Table Border Styling | Border styles, thickness, color options |
| 10-03 | Image Gallery Block | Multi-image grid with lightbox |
| 10-04 | Image Management Panel | Thumbnails, sizes, compression suggestions |

**Table Formula Functions (Priority):**
1. SUM, AVERAGE, MIN, MAX, COUNT
2. IF, ROUND, ABS
3. CONCATENATE, COUNTA

---

### Phase 11: Writer Features (NEW)

**Goal:** Users have tools optimized for long-form and professional writing.

**Source Todos:**
- 2026-02-01-handling-long-form.md
- 2026-02-01-writing-goals.md
- 2026-02-01-writing-statistics.md
- 2026-02-01-pomodoro-time-tracking.md
- 2026-02-01-track-changes-diff-view.md

**Plans:**

| Plan | Description |
|------|-------------|
| 11-01 | Long-Form Support | Chapter management, manuscript view, section navigation |
| 11-02 | Writing Goals | Daily/weekly/monthly targets, progress tracking |
| 11-03 | Writing Statistics | Readability scores, session tracking, historical trends |
| 11-04 | Pomodoro Timer | Focus sessions, break reminders, status bar widget |
| 11-05 | Track Changes View | Diff highlighting between versions |

---

### Phase 12: Advanced Features (NEW)

**Goal:** Users have project management, RTL support, and translation capabilities.

**Source Todos:**
- 2026-02-01-handling-projects.md
- 2026-02-01-handling-tasks.md
- 2026-02-01-rtl-management.md
- 2026-02-01-document-translation.md
- 2026-02-01-block-rearrangement-matrix-view.md

**Plans:**

| Plan | Description |
|------|-------------|
| 12-01 | Project Abstraction | Project folders, cross-document search |
| 12-02 | Task Management | Task blocks, task panel, due dates |
| 12-03 | RTL Language Support | Direction toggle, Bidi handling |
| 12-04 | Document Translation | AI-powered translation panel |
| 12-05 | Matrix Card View | Corkboard view for document structure |

---

### Phase 13: UI/UX Beautification (FINAL)

**Goal:** Professional, polished interface matching premium document editor standards.

**Source Todos:**
- 2026-02-01-style-panels-rework.md
- 2026-02-01-focus-mode-redesign.md
- 2026-02-01-logo-incorporation.md
- 2026-02-01-splash-screen.md
- 2026-02-01-zoom-slider-status-bar.md

**Plans:**

| Plan | Description |
|------|-------------|
| 13-01 | Style Panels Redesign | Visual hierarchy, preset cards, transitions |
| 13-02 | Focus Mode Redesign | True distraction-free experience |
| 13-03 | Brand Integration | Logo placement, about dialog |
| 13-04 | Splash Screen | Loading animation, branding |
| 13-05 | Status Bar Enhancements | Zoom slider, additional indicators |
| 13-06 | Global UI Polish | Consistent spacing, animations, hover states |

**UI Principles (from todos):**
- All panels/toolbars/controls MUST have margins and padding
- Smooth transitions between states
- Clear visual hierarchy
- Consistent spacing and alignment

---

## User Comments and Test Results

### Phase 7 Testing (from SERQ - Comments.md)

**07-01 (Columns):**
- Type /2col, /3col, /4col to insert column layouts
- Drag resize handles between columns to adjust widths
- Type content in each column independently
- Insert any block type (lists, callouts, code) inside columns

**07-02 (Float/Text Wrap):**
- Right-click image for float options in context menu
- Float Left: image floats left, text wraps on right
- Float Right: image floats right, text wraps on left
- Headings auto-clear floats

**07-03 (Free Positioning):**
- Drag image to see animated glow drop cursor
- Right-click > "Free Positioning" for absolute positioning
- Drag free-positioned image freely within canvas
- Constrained to canvas bounds
- Disable to return to document flow

**07-04 (Line Numbers):**
- Right-click empty canvas space for Line Numbers menu
- Enable: numbers appear in left gutter
- "Margin" position: numbers inside canvas
- "Legal" style: only every 5th line numbered

**07-05 (Paragraph Numbering):**
- Right-click canvas for Paragraph Numbering section
- Preset picker with tabs: Sequential, Hierarchical, Legal
- "Numbers (1, 2, 3)": paragraphs get numbered
- Hierarchical preset: nested numbering (1.1, 1.2)
- Legal preset: Article/Section/Clause format

**Multi-Select:**
- Select first chunk normally (click and drag)
- Hold Cmd
- Click and drag to select another chunk elsewhere
- Keep holding Cmd to add more selections

---

## Pending Todos Mapping

| Todo File | Target Phase | Plan |
|-----------|--------------|------|
| excel-like-table-formulas | 10 | 10-01 |
| app-settings-phase | 9 | 09-01, 09-02 |
| block-rearrangement-matrix-view | 12 | 12-05 |
| columns-and-text-wrap | COMPLETE (Phase 7) | - |
| document-translation | 12 | 12-04 |
| export-to-word | COMPLETE (08-02) | - |
| focus-mode-redesign | 13 | 13-02 |
| handling-long-form | 11 | 11-01 |
| handling-projects | 12 | 12-01 |
| handling-tasks | 12 | 12-02 |
| image-management-panel | 10 | 10-04 |
| integrations-and-sharing | 9 | 09-04 |
| logo-incorporation | 13 | 13-03 |
| markdown-source-mode | COMPLETE (08-04) | - |
| multiple-image-gallery | 10 | 10-03 |
| pomodoro-time-tracking | 11 | 11-04 |
| rtl-management | 12 | 12-03 |
| shortcuts-panel | 9 | 09-03 |
| splash-screen | 13 | 13-04 |
| style-panels-rework | 13 | 13-01 |
| table-borders-stylization | 10 | 10-02 |
| track-changes-diff-view | 11 | 11-05 |
| writing-goals | 11 | 11-02 |
| writing-statistics | 11 | 11-03 |
| zoom-slider-status-bar | 13 | 13-05 |

**Todos Completed:** 3 (columns-and-text-wrap, export-to-word, markdown-source-mode)
**Todos Pending:** 22

---

## Implementation Order

### Critical Path (v1.0 Release)

1. **Phase 6: AI Integration** (with TipTap Pro)
   - Install TipTap Pro packages
   - Configure Claude API backend
   - Wire AI commands

2. **Phase 8: Document Output** (verification + TipTap Pages)
   - Replace CSS pagination with TipTap Pages
   - Verify all export formats
   - Human verification

3. **Phase 9: Settings** (required for professional app)
   - Settings infrastructure
   - Basic preferences panel
   - Keyboard shortcuts view

### Enhancement Path (v1.1+)

4. **Phase 10: Extended Editor**
5. **Phase 11: Writer Features**
6. **Phase 12: Advanced Features**
7. **Phase 13: UI/UX Beautification** (ALWAYS LAST)

---

## Code Architecture Notes

### UI Integration Hooks (Critical)

All code must include hooks for future UI integration:

```typescript
// Pattern: Flags and placeholders for UI
interface FeatureConfig {
  enabled: boolean;
  uiPosition?: 'toolbar' | 'sidebar' | 'context-menu' | 'status-bar';
  uiStyle?: 'minimal' | 'standard' | 'prominent';
  // Placeholder for Phase 13 UI styling
  customStyles?: Record<string, string>;
}

// Pattern: UI-ready component structure
function FeatureButton({ config }: { config: FeatureConfig }) {
  // Phase 13 will replace this with polished UI
  return (
    <button
      className={`feature-button ${config.uiStyle || 'minimal'}`}
      style={config.customStyles}
    >
      {/* Placeholder content */}
    </button>
  );
}
```

### TipTap Pro Integration Pattern

```typescript
// Install TipTap Pro packages
import { Pages } from '@tiptap-pro/extension-pages';
import { AiGeneration } from '@tiptap-pro/extension-ai-generation';
import { AiToolkit } from '@tiptap-pro/extension-ai-toolkit';
import { Conversion } from '@tiptap-pro/extension-conversion';

// Configure in EditorCore.tsx
const editor = useEditor({
  extensions: [
    // ... existing extensions
    Pages.configure({
      pageSize: 'a4',
      pageOrientation: 'portrait',
      pageMargin: '2.5cm',
      header: true,
      footer: true,
    }),
    AiGeneration.configure({
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      apiKey: /* from Tauri keyring */,
    }),
    // ...
  ],
});
```

---

## Success Criteria

### v1.0 Release

- [ ] All 34 original plans verified complete
- [ ] TipTap Pro Pages integrated (replacing CSS pagination)
- [ ] AI integration functional (TipTap AI + Claude)
- [ ] Settings panel with basic preferences
- [ ] All export formats working (HTML, Markdown, PDF, Word)
- [ ] All import formats working (Word, Markdown, plain text)

### v1.1 Release

- [ ] Table formulas implemented
- [ ] Image management panel
- [ ] Writing goals and statistics
- [ ] Track changes view

### v1.2 Release

- [ ] Project management
- [ ] RTL support
- [ ] Translation panel
- [ ] Matrix card view

### v1.3 Release (Final Polish)

- [ ] Complete UI/UX beautification
- [ ] All panels redesigned
- [ ] Splash screen
- [ ] Brand integration

---

## Reference Documents

| Document | Path |
|----------|------|
| Project Definition | `.planning/PROJECT.md` |
| Requirements | `.planning/REQUIREMENTS.md` |
| Roadmap | `.planning/ROADMAP.md` |
| State | `.planning/STATE.md` |
| User Comments | `SERQ - Comments.md` |
| Phase Plans | `.planning/phases/*/` |
| Pending Todos | `.planning/todos/pending/` |

---

*Gap Analysis Created: 2026-02-02*
*TipTap Pro Token: dzX0eH5dWaDGX68jCXh7RWBoBYkncaQKbYI7GovqwGh7taq03qJhAtx6ngzb5biw*
