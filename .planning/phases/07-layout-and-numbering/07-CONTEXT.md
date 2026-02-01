# Phase 7: Layout and Numbering - Context

## Overview

This phase adds advanced layout capabilities (multi-column layouts, text wrapping) and document numbering systems (line numbers, paragraph numbers). These features transform SERQ from a simple editor into a tool capable of professional document creation.

## Feature 1: Multi-Column Layouts

### Requirements (from user discussion)

1. **Column Count**: Support 2-6 columns
2. **Layout Modes**:
   - **Flowing mode**: Text flows from column to column (magazine style)
   - **Rigid mode**: Side-by-side content blocks (comparison view)
   - Mode switching via context menu
3. **Resizable Gutters**:
   - Drag column borders to resize
   - Resize individually OR proportionally (all columns)
   - Visual feedback during drag
4. **Constraints**: Columns cannot exceed container/section viewport limits including margins
5. **Borders**: Optional visible borders between columns
6. **Activation**: Right-click context menu on canvas or via command palette

### Technical Approach

**Node Structure:**
```
Columns (parent node)
├── Column (child node, content: 'block+')
├── Column (child node, content: 'block+')
└── Column (child node, content: 'block+')

Attributes:
- columnCount: 2-6
- columnWidths: array of ratios [1, 1, 1.5] or null (equal)
- mode: 'flowing' | 'rigid'
- showBorders: boolean
- gap: string (default: '24px')
```

**CSS Implementation:**
- Use CSS Grid (NOT CSS columns - bad editing UX)
- `grid-template-columns: ${widths.join(' ')}`
- Draggable gutters via resize handle components

**Commands:**
- `insertColumns({ count, mode })` - Insert column section
- `setColumnCount(n)` - Change column count
- `setColumnMode(mode)` - Switch flowing/rigid
- `toggleColumnBorders()` - Show/hide borders
- `removeColumns()` - Convert back to single column

---

## Feature 2: Text Wrapping

### Requirements

1. **Supported Elements**: ALL block types (images, callouts, tables, code blocks, etc.)
2. **Wrap Modes**:
   - Float left (text wraps on right)
   - Float right (text wraps on left)
   - Center (no wrap, default)
   - Inline (for small images)
3. **Activation**: Context menu on the element, or toolbar button

### Technical Approach

**Extend existing extensions** (ResizableImage, Callout, etc.):
```typescript
addAttributes() {
  return {
    alignment: {
      default: 'center',
      options: ['left', 'center', 'right', 'float-left', 'float-right']
    }
  }
}
```

**CSS:**
```css
.block-float-left { float: left; margin-right: 1rem; margin-bottom: 0.5rem; }
.block-float-right { float: right; margin-left: 1rem; margin-bottom: 0.5rem; }
```

**UI:**
- Add alignment dropdown/buttons to existing context menus
- Visual indicator when element is floating

---

## Feature 3: Paragraph Numbering

### Requirements

1. **Numbering Styles** (as presets, NOT customizable):
   - **Sequential Simple**: 1, 2, 3... | I, II, III... | a, b, c... | 0x1, 0x2...
   - **Hierarchical**: 1, 1.1, 1.2, 2... (respects heading levels)
   - **Legal Multi-Level**: Different format per level (e.g., Article 1, Section 1.1, Clause 1.1.1)

2. **Preset System**: User selects from predefined presets, no custom configuration

3. **Default**: Simple sequential numbers

4. **Activation**: Command palette or settings panel

### Preset Definitions

```typescript
const PARAGRAPH_NUMBER_PRESETS = [
  // Sequential
  { id: 'seq-numeric', name: 'Numbers (1, 2, 3)', format: 'numeric', style: 'sequential' },
  { id: 'seq-roman', name: 'Roman (I, II, III)', format: 'roman', style: 'sequential' },
  { id: 'seq-alpha', name: 'Letters (a, b, c)', format: 'alpha', style: 'sequential' },
  { id: 'seq-hex', name: 'Hex (0x1, 0x2)', format: 'hex', style: 'sequential' },

  // Hierarchical
  { id: 'hier-numeric', name: 'Hierarchical (1, 1.1, 1.2)', format: 'numeric', style: 'hierarchical' },
  { id: 'hier-roman', name: 'Hierarchical Roman', format: 'roman', style: 'hierarchical' },
  { id: 'hier-alpha', name: 'Hierarchical Letters', format: 'alpha', style: 'hierarchical' },

  // Legal
  { id: 'legal-standard', name: 'Legal Standard', format: 'legal', style: 'multilevel',
    levels: ['Article %n', 'Section %n.%n', 'Clause %n.%n.%n'] },
  { id: 'legal-outline', name: 'Legal Outline', format: 'legal', style: 'multilevel',
    levels: ['%N.', '%A.', '%n.', '%a)', '(%n)', '(%a)'] },
];
```

### Technical Approach

- ProseMirror plugin with widget decorations
- Store selected preset in editor storage
- Decorations regenerate on document structure change
- Numbers rendered in gutter or inline (user preference)

---

## Feature 4: Line Numbers

### Requirements

1. **Display Modes** (toggle between):
   - **Code-style gutter**: Permanent visible gutter like code editors
   - **Legal/academic**: Line numbers for citations, court documents

2. **Activation**: Right-click context menu on canvas → "Toggle Line Numbers"

3. **Performance**: Must handle long documents (viewport optimization)

### Technical Approach

**Gutter Implementation:**
```typescript
new Plugin({
  view(editorView) {
    const gutter = document.createElement('div');
    gutter.className = 'line-number-gutter';
    editorView.dom.parentElement.prepend(gutter);

    return {
      update(view) {
        // Calculate visible lines
        // Update gutter numbers
        // Use coordsAtPos for positioning
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

## UI Integration

### Context Menus

**Canvas Context Menu** (right-click on empty canvas):
- Insert Columns → [2, 3, 4, 5, 6 columns]
- Toggle Line Numbers
- Toggle Paragraph Numbers → [preset picker]

**Block Context Menu** (right-click on image/callout/etc.):
- Alignment → [Left, Center, Right, Float Left, Float Right]

**Column Context Menu** (right-click on column section):
- Add Column
- Remove Column
- Column Mode → [Flowing, Rigid]
- Toggle Borders
- Reset Widths (equal)
- Remove Columns

### Command Palette

- "Insert 2 Columns"
- "Insert 3 Columns"
- "Toggle Line Numbers"
- "Set Paragraph Numbering"
- "Float Image Left"
- "Float Image Right"

---

## Feature 5: Draggable Image Positioning

### Requirements

1. Drag images to ANY position on the canvas
2. Visual drop indicator showing where image will land
3. Text reflows around dropped image position

### Current State (Already Implemented)

- `ResizableImage` extension with `draggable: true`
- `ReactNodeViewRenderer` for custom image UI
- TipTap's dropcursor via StarterKit (shows blue line at drop position)
- Custom resize handles on 4 corners

### Enhancement Needed

**Visual Drop Indicator Improvements:**
```css
.prosemirror-dropcursor {
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  animation: dropZonePulse 1s ease-in-out infinite;
}
```

**Drop Zone Highlighting:**
- Add decorations during drag to highlight potential drop targets
- Use `view.posAtCoords()` in dragover handler for position detection
- Show different indicators for before/after block positions

**Drag Handle Enhancement:**
- More visible drag handle icon (6-dot grip)
- Appears on hover over image
- Clear affordance for draggability

### Technical Approach

1. Enhance dropcursor CSS styling (animations, glow)
2. Add ProseMirror plugin for drop zone detection
3. Create widget decorations for visual feedback
4. Update ImageView with better drag handle UI

**Key insight:** Block-based positioning (current approach) is simpler for drag-and-drop than absolute/floating positioning. Keep images as discrete blocks, let TipTap handle the reflow.

---

## Technical Decisions to Make During Implementation

1. **Column node nesting**: Allow columns inside columns? (Recommend: No, keep flat)
2. **Float clearance**: How to handle text that should NOT wrap? (Add "clear" command?)
3. **Export handling**: How do columns/floats export to Markdown/PDF?
4. **Performance threshold**: At what document size do we need viewport optimization?

---

## Research Sources

- TipTap Multi-Column Discussion: https://github.com/ueberdosis/tiptap/discussions/6317
- ProseMirror Decorations: https://prosemirror.net/docs/guide/#view.decorations
- CodeMirror Gutter Implementation: https://codemirror.net/examples/gutter/
- Notion Columns Architecture: https://developers.notion.com/reference/block
