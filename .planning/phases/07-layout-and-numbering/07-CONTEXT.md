# Phase 7: Layout and Numbering - Context

## Overview

This phase adds advanced layout capabilities (multi-column layouts, text wrapping) and document numbering systems (line numbers, paragraph numbers). These features transform SERQ from a simple editor into a tool capable of professional document creation.

---

## Feature 1: Multi-Column Layouts

### Core Concept

**CRITICAL: Columns are BLOCK-BASED, not document-wide.** Each column section is a discrete block element that can be inserted anywhere in the document. A document can have multiple column sections with different configurations.

### Requirements (from user discussion)

1. **Column Count**: Support 2-6 columns
2. **Layout Modes**:
   - **Fixed mode (DEFAULT)**: Each column has independent content, no flow between columns
   - **Flowing mode**: Text flows from column to column (magazine style)
   - Mode switching via context menu (with reflow warning)
3. **Resizable Gutters**:
   - Drag column borders to resize
   - Resize individually OR proportionally
   - Content-based minimum width (can't shrink smaller than content)
   - No visual guides, just visual feedback while dragging
4. **Width Presets**: Quick presets (1:1, 1:2, 2:1, 1:1:2, etc.) + custom drag
5. **Borders**: Optional visible borders between columns
6. **Visual Appearance**: Columns look seamless; borders/boundaries only visible when selected/editing
7. **Content Inside**: ANY block type can live inside columns (images, tables, callouts, code blocks)

### Creation Methods (ALL supported)

1. **Select + Convert**: Highlight existing paragraphs → right-click → "Convert to Columns"
2. **Insert Empty**: Insert empty column container → click inside to type
3. **Slash Command**: Type `/columns` → select column count
4. **Drag Content**: Create columns → drag existing blocks into each column

### Column Deletion Behavior

- **Fixed mode**: Content moves to adjacent column OR extracted as regular paragraphs (user choice)
- **Flowing mode**: Content merges back into sequential paragraphs

### Export Behavior

- **HTML/PDF**: Preserve column layout visually
- **Markdown**: Export as Markdown table structure (columns become table columns)
- Show user preview of how Markdown export will look differently

### Technical Approach

**Node Structure:**
```
ColumnSection (parent node)
├── Column (child node, content: 'block+')
├── Column (child node, content: 'block+')
└── Column (child node, content: 'block+')

Attributes:
- columnCount: 2-6
- columnWidths: array of ratios [1, 1, 1.5] or null (equal)
- mode: 'fixed' | 'flowing' (default: 'fixed')
- showBorders: boolean
- gap: string (default: '24px')
```

**CSS Implementation:**
- Use CSS Grid (NOT CSS columns)
- `grid-template-columns: ${widths.join(' ')}`
- Draggable resize handles between columns

**Commands:**
- `insertColumns({ count, mode })` - Insert column section
- `convertToColumns({ count })` - Convert selection to columns
- `setColumnCount(n)` - Change column count
- `setColumnMode(mode)` - Switch flowing/fixed (with warning)
- `toggleColumnBorders()` - Show/hide borders
- `setColumnWidthPreset(preset)` - Apply width preset
- `removeColumns()` - Convert back to single column

---

## Feature 2: Text Wrapping

### Requirements

1. **Supported Elements**: ALL block types (images, callouts, tables, code blocks, etc.)
2. **Wrap Modes**:
   - Float left (text wraps on right)
   - Float right (text wraps on left)
   - Center with wrap both sides (text flows around both sides)
   - Center (no wrap, default)
3. **Center-Wrap Positioning**: Element is draggable within text flow, text wraps on both sides
4. **Clear Option**: Manual "Clear" formatting to force text below floated elements
   - Headings automatically clear floats
5. **Activation**: Context menu on the element, or toolbar button

### Technical Approach

**Extend existing extensions** (ResizableImage, Callout, etc.):
```typescript
addAttributes() {
  return {
    float: {
      default: 'none',
      options: ['none', 'left', 'right', 'center-wrap']
    },
    floatPosition: {
      default: 50, // percentage from left for center-wrap
    }
  }
}
```

**CSS:**
```css
.block-float-left { float: left; margin-right: 1rem; margin-bottom: 0.5rem; }
.block-float-right { float: right; margin-left: 1rem; margin-bottom: 0.5rem; }
.block-center-wrap { /* complex positioning */ }
.clear-float { clear: both; }
```

**Commands:**
- `setBlockFloat(position)` - Set float position
- `insertClearBreak()` - Insert clear break

---

## Feature 3: Draggable Image Positioning

### Requirements

1. **Two Modes**:
   - **Snap to document flow (default)**: Images can only go between blocks
   - **Free positioning**: Absolute positioning within canvas (can be enabled)
2. **Visual Drop Indicator**: Animated glow/highlight showing where image will land
3. **Bounds**: Constrained to canvas area (cannot extend outside margins)
4. **Text Reflow**: Text automatically reflows around dropped image

### Current State (Already Implemented)

- `ResizableImage` extension with `draggable: true`
- TipTap's dropcursor via StarterKit (shows line at drop position)
- Custom resize handles

### Enhancement Needed

**Drop Indicator Styling:**
```css
.prosemirror-dropcursor {
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  animation: dropZonePulse 1s ease-in-out infinite;
}
```

**Free Positioning Mode:**
- Toggle via context menu: "Enable free positioning"
- Image gets absolute positioning within canvas
- Draggable to any position
- Text flows around based on float settings

---

## Feature 4: Line Numbers

### Requirements

1. **Display Styles**:
   - Code-style gutter (permanent visible gutter like code editors)
   - Legal/academic style (for citations, court documents)
2. **Position**: User chooses between:
   - Left gutter (outside canvas margins)
   - Left margin (inside canvas)
3. **Activation**: Right-click context menu on canvas → "Toggle Line Numbers"
4. **Can be active simultaneously with paragraph numbers**

### Technical Approach

**Gutter Implementation:**
```typescript
new Plugin({
  view(editorView) {
    const gutter = document.createElement('div');
    gutter.className = 'line-number-gutter';
    // Position based on user preference (gutter vs margin)

    return {
      update(view) {
        // Calculate visible lines
        // Use coordsAtPos for positioning
        // Render only visible line numbers
      },
      destroy() {
        gutter.remove();
      }
    }
  }
})
```

**Performance Optimizations:**
- Only render visible line numbers (viewport-based)
- Cache line count in plugin state
- Incremental updates via transaction mapping

---

## Feature 5: Paragraph Numbering

### Requirements

1. **What Gets Numbered**: ALL block elements (paragraphs, headings, lists, blockquotes, callouts)
2. **Position**: Inline before text (like "1. First paragraph")
3. **Can be active simultaneously with line numbers**

### Numbering Presets (NO custom configuration - presets only)

**Sequential Styles:**
| Preset ID | Name | Example |
|-----------|------|---------|
| `seq-numeric` | Numbers | 1, 2, 3, 4... |
| `seq-roman` | Roman | I, II, III, IV... |
| `seq-roman-lower` | Roman lowercase | i, ii, iii, iv... |
| `seq-alpha` | Letters | a, b, c, d... |
| `seq-alpha-upper` | Letters uppercase | A, B, C, D... |
| `seq-hex` | Hexadecimal | 0x1, 0x2, 0x3... |

**Hierarchical Styles:**
| Preset ID | Name | Example |
|-----------|------|---------|
| `hier-numeric` | Hierarchical | 1, 1.1, 1.2, 2, 2.1... |
| `hier-roman` | Hierarchical Roman | I, I.i, I.ii, II... |
| `hier-alpha` | Hierarchical Letters | A, A.a, A.b, B... |

**Legal Multi-Level:**
| Preset ID | Name | Format per Level |
|-----------|------|------------------|
| `legal-standard` | Legal Standard | Article 1, Section 1.1, Clause 1.1.1 |
| `legal-outline` | Legal Outline | I., A., 1., a), (1), (a) |
| `legal-contract` | Contract Style | 1., 1.1, 1.1.1, (a), (i) |

### Preset Picker UI

- Show sample numbered text preview for each preset
- Example: "1. First paragraph\n2. Second paragraph"
- Grid or list layout with visual preview

### Technical Approach

```typescript
const PARAGRAPH_NUMBER_PRESETS = [
  {
    id: 'seq-numeric',
    name: 'Numbers (1, 2, 3)',
    format: 'numeric',
    style: 'sequential',
    preview: '1. First paragraph\n2. Second paragraph\n3. Third paragraph'
  },
  // ... more presets
];
```

- ProseMirror plugin with widget decorations
- Decorations inserted inline before each block
- Store selected preset in editor storage
- Regenerate on document structure change

---

## UI Integration

### Context Menus

**Canvas Context Menu** (right-click on empty canvas):
- Insert Columns → [2, 3, 4, 5, 6 columns]
- Toggle Line Numbers → [Gutter | Margin | Off]
- Paragraph Numbering → [Preset picker with previews]

**Selection Context Menu** (right-click on selected text):
- Convert to Columns → [2, 3, 4, 5, 6 columns]

**Block Context Menu** (right-click on image/callout/etc.):
- Float → [None, Left, Right, Center Wrap]
- Enable Free Positioning (toggle)
- Insert Clear Break

**Column Section Context Menu** (right-click on column area):
- Add Column
- Remove Column
- Column Mode → [Fixed, Flowing] (with warning on switch)
- Width Preset → [Equal, 1:2, 2:1, 1:1:2, Custom]
- Toggle Borders
- Remove Columns

### Command Palette

- "Insert 2 Columns"
- "Insert 3 Columns"
- "Convert Selection to Columns"
- "Toggle Line Numbers"
- "Set Paragraph Numbering"
- "Float Left"
- "Float Right"
- "Clear Float"

---

## Technical Decisions (Resolved)

| Decision | Resolution |
|----------|------------|
| Column nesting | NO - columns cannot contain columns |
| Default column mode | Fixed (independent content per column) |
| Column minimum width | Content-based (can't shrink smaller than content) |
| Line + para numbers together | YES - both can be active simultaneously |
| Float clear behavior | Manual clear option + headings auto-clear |
| Image free positioning bounds | Constrained to canvas area |
| Export columns to Markdown | As Markdown tables |

---

## Research Sources

- TipTap Multi-Column Discussion: https://github.com/ueberdosis/tiptap/discussions/6317
- ProseMirror Decorations: https://prosemirror.net/docs/guide/#view.decorations
- CodeMirror Gutter Implementation: https://codemirror.net/examples/gutter/
- Notion Columns Architecture: https://developers.notion.com/reference/block
- CSS Float and Clear: https://css-tricks.com/almanac/properties/f/float/
