# SERQ Session Handover

**Last Updated:** 2026-02-03
**Branch:** feature/unified-style-system
**Next Task:** Notion-Style Block System

---

## CURRENT MISSION: Notion-Style Blocks

Implement the full Notion experience:
- **Drag handles** (⋮⋮) on every block
- **Block menus** - duplicate, delete, turn into, color
- **Add block button** (+) with block type selector
- **Smooth animations** - Notion-quality drag & drop
- **Tables** - Full table support with TipTap
- **New blocks** - Callouts, toggles, dividers

**Full plan:** `.planning/NOTION-STYLE-BLOCKS-PLAN.md`

---

## Quick Context

### What SERQ Is
Tauri desktop text editor using TipTap (ProseMirror). Has a unified style system where heading styles can be assigned and reflected in the toolbar.

### What's Already Built
- TipTap editor with basic blocks (paragraphs, headings, lists)
- Unified toolbar with heading-aware styling
- Dynamic configuration system (fonts, colors from store)
- Debug bridge (console output to ~/.serq-debug.log)

### What We're Adding
The Notion-style block system on top of the existing editor.

---

## Key Commands

```bash
# Start app (ALWAYS use this)
npm run tauri dev

# Type check
npm run build

# TipTap CLI (we have Teams license)
npx @tiptap/cli add <component>
```

---

## Key Files

| File | Purpose |
|------|---------|
| `.planning/NOTION-STYLE-BLOCKS-PLAN.md` | Full implementation plan |
| `src/stores/styleStore.ts` | Zustand store for styles |
| `src/lib/editor-utils.ts` | Editor utility functions |
| `CLAUDE.md` | Project rules and context |

---

## TipTap Teams License

**We have full access to TipTap Pro components.**

Relevant for this task:
- `@tiptap-pro/extension-drag-handle` - Drag handle functionality
- `@tiptap/extension-table` - Table support
- All Pro UI components

NPM registry already configured in `.npmrc`.

---

## Implementation Phases

### Phase 1: Drag Handle Foundation
- [ ] Install/configure DragHandle extension
- [ ] Create BlockWrapper component with hover detection
- [ ] Position handle left of blocks
- [ ] Basic drag functionality

### Phase 2: Drag Animations
- [ ] Lifted block styling (scale, shadow)
- [ ] Other blocks slide to make room
- [ ] Drop indicator line
- [ ] Smooth drop animation

### Phase 3: Block Menu
- [ ] Menu appears on handle click
- [ ] Duplicate, delete, move up/down
- [ ] Turn into submenu (paragraph, headings, lists, etc.)
- [ ] Color submenu (text and background)

### Phase 4: Add Block Button
- [ ] (+) button on hover
- [ ] Block type selector popup
- [ ] Search/filter blocks
- [ ] Insert block at position

### Phase 5: Table Block
- [ ] Install TipTap table extension
- [ ] Row/column add buttons
- [ ] Cell selection and merging
- [ ] Header row toggle

### Phase 6: Additional Blocks
- [ ] Callout block with icons
- [ ] Toggle/collapsible block
- [ ] Divider block

---

## Design Reference

### Notion's Block Handle
- Appears ~16px left of block on hover
- 6 dots (⋮⋮) icon, gray, subtle
- Click = menu, Drag = move
- 150ms fade in/out

### Notion's Drag Animation
- Block lifts slightly (scale 1.02)
- Shadow appears (0 4px 12px rgba(0,0,0,0.15))
- Other blocks slide apart smoothly
- Blue line shows drop position
- 200ms transitions, ease-out

### Notion's Block Menu
- Appears below handle on click
- Sections: Edit actions, Turn into, Color
- Keyboard navigable
- Closes on outside click or Escape

---

## Technical Notes

### TipTap DragHandle Extension
```typescript
import { DragHandle } from '@tiptap-pro/extension-drag-handle'

const editor = useEditor({
  extensions: [
    DragHandle.configure({
      render: () => {
        // Custom drag handle element
      }
    })
  ]
})
```

### NodeView for Block Wrapper
May need custom NodeView to wrap blocks with hover detection and handle positioning.

### Tauri Considerations
- No browser drag-and-drop API restrictions
- Can use native cursor styles
- File drops handled by Tauri

---

## Don't Forget

1. **Use TipTap Teams components** - We paid for them
2. **Check TipTap docs first** - https://tiptap.dev/docs
3. **Run with Tauri** - `npm run tauri dev`, not `npm run dev`
4. **Dynamic config** - Any new options go in styleStore, not hardcoded

---

## Previous Session Summary

Completed dynamic configuration refactor:
- Removed all hardcoded lists from components
- Fonts, weights, colors now from styleStore
- Build passing, pushed to remote

**Commit:** `4016c8c feat: dynamic configuration system`

---

*Full plan: `.planning/NOTION-STYLE-BLOCKS-PLAN.md`*
