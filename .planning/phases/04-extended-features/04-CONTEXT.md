# Phase 4: Extended Features - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Full editing capabilities expected from a modern document editor: tables with cell operations, custom blocks (callouts), image handling with manipulation, command palette, slash commands, and document outline navigation.

</domain>

<decisions>
## Implementation Decisions

### Tables

**Insertion:**
- Insert via `/table` command with visual picker grid
- Default size: 3x4
- Picker grid (like Word/Notion) to drag and select dimensions

**Structure:**
- Proportional column resizing (table width stays fixed, columns adjust relative to neighbors)
- Table width: user-resizable by dragging edges
- Full content allowed in cells (lists, code blocks, images, nested content)
- Row/column drag reorder via handles

**Navigation:**
- Tab indents text within cell
- Arrow keys + Cmd (Mac) / Ctrl (PC) for cell navigation
- Edge hover for row/column selection (not click headers)

**Operations:**
- Cell merge via both context menu AND floating toolbar when multiple cells selected
- Header row styling: toggle option (not automatic)
- Add/remove rows/columns: hover buttons for quick insert + context menu for full options
- Delete table: backspace when empty, context menu, or select all + delete
- Pasting cells outside table creates new table
- Alignment: toolbar + context menu for horizontal and vertical alignment

**Styling:**
- Default border: 1px line, 4px corner radius on outer frame
- Right-click context menu with border toggles:
  - All borders on/off
  - Frame borders on/off
  - Vertical borders (including outer frames)
  - Horizontal borders (including outer frames)
  - Per-cell border control (Word-style) for selected cells
- Cell background: color picker with 8 preset colors
- Table styles integration with style panel: future work

**Keyboard:**
- Claude's discretion for table-specific shortcuts

### Callouts

**Philosophy:**
- Color-based, NOT semantic (no info/warning/error labels)
- Colors pulled from active document theme
- User picks color, optionally adds icon, optionally makes collapsible

**Visual:**
- Default: background only (no border), 4px corner radius (matching tables)
- Icons: default is NO icon, user can add from presets via context menu
- Border accent: context menu to add on any of the four sides

**Behavior:**
- Collapsible: toggle option per callout
- Full formatting allowed inside (any heading level H1-H6, or plain text)

**Insertion:**
- Toolbar button
- Slash commands (`/callout`)
- Obsidian-style markdown: `> [!type]`

**Note:** Global toggle for corner radius on/off per document

### Images

**Insertion:**
- All methods: drag/drop, paste, `/image` command, toolbar button, file picker
- Multiple images: auto-arrange in grid layout

**Storage:**
- Embedded as base64 in .serq.html (fully portable)
- Large images: warn user with option to proceed or resize

**Display:**
- User can toggle each image between inline/block display
- Drag to position with snap to left/center/right guides
- SVG: rendered as native SVG (scalable, resolution-independent) but not editable

**Resize and Crop:**
- Corner handles only, always maintain aspect ratio
- Modifier key (Alt/Option) enables non-destructive cropping
- Full image kept in memory - re-cropping shows faded ghost of original extent
- Free rotation with drag handle

**Shape Masks:**
- Context menu for preset masks: circle, square, additional shapes
- Alpha channel fades: transparency gradients to blend into canvas (right, left, top, bottom)

**Effects:**
- Full effects via context menu: border, shadow, rounded corners
- Text wrap: toggle on/off, 20px default padding
- Draggable padding handles when hovering over wrap margin

**Copy/Paste:**
- Copy includes image + all settings (effects, masks, rotation)
- Replace in place: context menu keeps size/position/effects

**Image Editor Mode:**
- Double-click or context menu enters light editor mode
- Features:
  - Background removal
  - Image adjustments (brightness, contrast, saturation, etc.)
  - Simple annotations (text, basic lines, colors, highlights)
- Surrounded by editing UI, "Save" commits changes
- **Research needed:** Open-source image editing tools for annotation and light manipulation

**Animated Images:**
- GIF/WebP: play on hover (default), context menu to toggle auto-play per image

**Accessibility:**
- Optional alt text via context menu
- Images can be made clickable (linkable) via context menu

**Multi-Image Grid:**
- Drag/import multiple images: auto-arrange in grid
- Context menu for grid dimensions (3x3, 7x9, etc.)
- 3-4 grid styles including masonry

**Formats:**
- JPG, PNG, GIF, WebP, SVG (common web formats)
- No built-in screenshot capture (use system tools, paste into SERQ)

**Undo:**
- Claude's discretion on whether image editor has separate undo stack

### Command Palette

**Triggers:**
- Cmd+K (Ctrl+K on PC)
- Cmd+P (Ctrl+P on PC) - both work

**Contents:**
- Everything: actions, navigation, settings, keyboard shortcut hints
- Recent files, jump to heading

### Slash Commands

**Trigger:**
- Type `/` anywhere in document
- Inline dropdown appears at cursor position
- Filter as you type

**Commands:**
- Full command set - all available actions accessible via slash
- Not limited to insert-type commands

### Document Outline

*Not discussed - Claude's discretion on implementation approach*

### Performance

**Critical note:** Performance is paramount throughout all features. The editor must be blazing fast.
- Ongoing performance monitoring during development
- Lazy loading for images likely best approach
- Response time and scroll performance ahead of everything else

### Claude's Discretion

- Table keyboard shortcuts
- Document outline implementation
- Image editor undo stack behavior
- Specific UI polish and micro-interactions
- Performance optimization approaches

</decisions>

<specifics>
## Specific Ideas

- Tables should feel like Word/Excel with context menus and hover buttons
- Callouts should be simple colored boxes, not semantic categories
- Image editor should be light and quick - not a full Photoshop replacement
- Command palette should work like VS Code (Cmd+K or Cmd+P)
- "Clean design environment. Lots of whitespace and breathing."

</specifics>

<deferred>
## Deferred Ideas

- Table styles integration with style panel (after Phase 3 style system matures)
- Global corner radius toggle per document (style system feature)
- Advanced image filters and effects beyond light editing

</deferred>

---

*Phase: 04-extended-features*
*Context gathered: 2026-01-31*
