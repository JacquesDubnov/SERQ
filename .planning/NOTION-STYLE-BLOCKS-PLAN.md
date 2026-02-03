# Notion-Style Block System Plan

**Date:** 2026-02-03
**Feature:** Drag handles, block menus, animations, tables - the full Notion experience

---

## Vision

Every block in SERQ gets the Notion treatment:
- **Drag handle** (⋮⋮) appears on hover left of block
- **Add menu** (+) for inserting new blocks
- **Block menu** on drag handle click - duplicate, delete, turn into, color
- **Smooth drag animations** - blocks slide apart, drop indicator shows insertion point
- **All block types** - paragraphs, headings, lists, tables, images, code, callouts

---

## Phase 1: Foundation - Drag Handle UI

### 1.1 Block Wrapper Component
Create a wrapper that surrounds every block node with hover detection.

```
┌─────────────────────────────────────────────┐
│ ⋮⋮  │ Block content here                    │
│     │                                        │
└─────────────────────────────────────────────┘
  ↑ Drag handle (visible on hover)
```

### 1.2 Drag Handle Behavior
- **Hover** - Handle appears with fade-in (150ms)
- **Click** - Opens block menu
- **Drag** - Initiates block move
- **Position** - Fixed left of block, vertically centered

### 1.3 Files to Create
- `src/components/block-system/BlockWrapper.tsx`
- `src/components/block-system/DragHandle.tsx`
- `src/components/block-system/BlockMenu.tsx`
- `src/styles/block-system.css`

---

## Phase 2: Drag & Drop

### 2.1 DnD Library
Use `@tiptap/extension-drag-handle` (we have TipTap Teams license) or build custom with:
- ProseMirror drag events
- CSS transforms for smooth animation
- Drop indicator line

### 2.2 Drag States
1. **Idle** - Normal block display
2. **Hover** - Handle visible
3. **Dragging** - Block lifted, shadow, slight scale
4. **Over target** - Blue line indicator where block will drop
5. **Dropped** - Smooth animation to new position

### 2.3 Animation Specs (Notion-style)
- Drag start: `transform: scale(1.02)`, `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`
- During drag: Block follows cursor with slight offset
- Other blocks: Slide up/down to make room (200ms ease-out)
- Drop: Snap to position (150ms ease-out)

---

## Phase 3: Block Menu

### 3.1 Menu Structure
```
┌──────────────────────┐
│ ✎ Edit              │
│ ⬆ Move up           │
│ ⬇ Move down         │
│ ⎘ Duplicate         │
│ 🗑 Delete            │
├──────────────────────┤
│ Turn into →         │
│   Paragraph         │
│   Heading 1         │
│   Heading 2         │
│   Heading 3         │
│   Bullet list       │
│   Numbered list     │
│   To-do list        │
│   Quote             │
│   Code              │
│   Callout           │
├──────────────────────┤
│ Color →             │
│   (text colors)     │
│   (bg colors)       │
└──────────────────────┘
```

### 3.2 Files to Create
- `src/components/block-system/BlockMenu.tsx`
- `src/components/block-system/TurnIntoMenu.tsx`
- `src/components/block-system/ColorMenu.tsx`

---

## Phase 4: Add Block Menu (+)

### 4.1 Trigger Behavior
- Shows on hover (left of drag handle, or at start of empty block)
- Click opens full block type selector

### 4.2 Block Type Selector
```
┌──────────────────────────────┐
│ 🔍 Search blocks...         │
├──────────────────────────────┤
│ BASIC                        │
│ ¶ Text                       │
│ H1 Heading 1                 │
│ H2 Heading 2                 │
│ H3 Heading 3                 │
│ • Bulleted list              │
│ 1. Numbered list             │
│ ☐ To-do list                 │
├──────────────────────────────┤
│ MEDIA                        │
│ 🖼 Image                     │
│ 📹 Video                     │
│ 📁 File                      │
├──────────────────────────────┤
│ ADVANCED                     │
│ ═══ Table                    │
│ </> Code                     │
│ 💬 Callout                   │
│ ─── Divider                  │
│ " Quote                      │
└──────────────────────────────┘
```

### 4.3 Files to Create
- `src/components/block-system/AddBlockButton.tsx`
- `src/components/block-system/BlockTypeSelector.tsx`

---

## Phase 5: Table Block

### 5.1 TipTap Table Extension
We have TipTap Teams - use their table extension:
```bash
npx @tiptap/cli add table
```

### 5.2 Table Features
- Add/remove rows and columns
- Resize columns by dragging
- Cell selection
- Merge cells
- Header row toggle
- Cell background colors

### 5.3 Table UI
- Hover shows row/column add buttons
- Right-click for cell menu
- Drag to select multiple cells

---

## Phase 6: Additional Block Types

### 6.1 Callout Block
```
┌─────────────────────────────┐
│ 💡 This is a callout block  │
│    with an icon and text    │
└─────────────────────────────┘
```

### 6.2 Toggle Block
```
▶ Click to expand
  Hidden content appears here
```

### 6.3 Divider Block
```
────────────────────────────────
```

### 6.4 Files to Create
- `src/extensions/callout/`
- `src/extensions/toggle/`
- `src/extensions/divider/`

---

## Technical Approach

### TipTap Extensions to Use/Create
1. **DragHandle** - `@tiptap-pro/extension-drag-handle` (Teams license)
2. **Table** - `@tiptap/extension-table` (Pro)
3. **Custom NodeView** - For block wrapper with hover detection
4. **Custom Callout** - New extension
5. **Custom Toggle** - New extension

### CSS Architecture
- Use CSS custom properties for theming
- Framer Motion or CSS transitions for animations
- z-index management for overlays

### State Management
- Block menu open state
- Currently dragging block
- Drop target position
- Selected blocks (for multi-select)

---

## Implementation Order

1. **DragHandle extension** - Get basic drag working
2. **BlockWrapper NodeView** - Hover detection, handle positioning
3. **Block menu** - Click on handle
4. **Drag animations** - Polish the feel
5. **Add block button** - Insert new blocks
6. **Table extension** - Full table support
7. **Additional blocks** - Callout, toggle, divider

---

## Success Criteria

- [ ] Drag handle appears on hover for all blocks
- [ ] Blocks can be dragged and reordered
- [ ] Smooth Notion-like animations
- [ ] Block menu with duplicate, delete, turn into
- [ ] Add block menu with all block types
- [ ] Tables with row/column management
- [ ] Callout, toggle, and divider blocks
- [ ] Works in Tauri (no browser-only APIs)

---

## Reference

- Notion: https://notion.so (primary reference)
- TipTap DragHandle: https://tiptap.dev/docs/editor/extensions/functionality/drag-handle
- TipTap Table: https://tiptap.dev/docs/editor/extensions/nodes/table
