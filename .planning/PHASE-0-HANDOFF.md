# SERQ Phase 0 - TipTap UI Migration Handoff

## Current Status
Working on Phase 0 (TipTap UI Migration). Most tasks complete, but **2 critical issues remain**:

---

## ISSUE 2: Block Dragging Not Working (PRIORITY)

### Symptom
When trying to drag blocks via the DragHandle grip icon, nothing happens. The blocks don't move.

### What Was Tried
- Removed ALL custom drag handling from `EditorCore.tsx` (dragstart, dragover, drop handlers)
- Changed grip element to `<div draggable>` instead of `<button draggable="false">`
- Added checks to skip custom handling when DragHandle is active

### Root Cause Hypothesis
The TipTap DragHandle extension (`@tiptap/extension-drag-handle-react`) should handle dragging automatically via its plugin. The issue is likely:
1. The DragHandle wrapper has children (buttons/icons) that intercept mouse events
2. The plugin might need specific event handlers (onElementDragStart, onElementDragEnd)
3. CSS might be interfering (user-select, pointer-events)

### Files to Investigate
- `/src/components/Editor/DragHandle.tsx` - Custom component wrapping TipTap's DragHandle
- `/src/components/Editor/EditorCore.tsx` - Editor setup, editorProps around line 170
- `node_modules/@tiptap/extension-drag-handle-react/dist/index.js` - Plugin source

### Next Steps
1. Check TipTap DragHandle documentation for proper usage pattern
2. Add `onElementDragStart` and `onElementDragEnd` props to DragHandle
3. Try minimal implementation without custom menus to isolate issue
4. Check if dropcursor extension is showing (it handles drop position indicator)
5. Add console.log to see if drag events fire at all

---

## ISSUE 3: Slash Commands Search Not Working (PRIORITY)

### Symptom
Typing `/` opens the slash menu popup correctly, but any character typed after closes the popup immediately. Search/filtering doesn't work.

### What Was Tried
- Added `allowSpaces: false` and `startOfLine: false` to Suggestion config
- Fixed z-index for tippy popup (9999)
- Fixed CSS overscroll behavior

### Root Cause Hypothesis
The TipTap Suggestion extension tracks characters after the trigger (`/`). When characters are typed, `onUpdate` should be called with the query. Instead, the popup closes - suggesting:
1. `onExit` is being triggered prematurely
2. Some other handler is consuming the keystrokes
3. The Suggestion plugin might not be configured correctly

### Files to Investigate
- `/src/extensions/SlashCommands/SlashCommands.ts` - Extension setup
- `/src/extensions/SlashCommands/SlashMenu.tsx` - React component
- `/src/extensions/SlashCommands/commands.ts` - Command definitions

### Next Steps
1. Add console.log to `onStart`, `onUpdate`, `onKeyDown`, `onExit` in SlashCommands.ts
2. Check what query value is being passed
3. Look at TipTap Suggestion docs - check if there's a required config missing
4. Check if `shouldExitOnBlur` or similar option needs to be set
5. Compare with TipTap's official suggestion example

---

## Completed Fixes This Session

1. ✅ Turn into submenu - inline menu with back button (not side-by-side flyout)
2. ✅ Turn into affecting wrong block - uses direct transaction on stored node position
3. ✅ Table picker z-index - uses portal to render outside toolbar
4. ✅ Toolbar headings doubled - removed `text` prop
5. ✅ Added P button and H4-H6 headings
6. ✅ Slash menu scrolling CSS

---

## Key Files

```
src/components/Editor/
├── DragHandle.tsx        # Custom Notion-style drag handle (ISSUE 2)
├── EditorCore.tsx        # Editor with extensions
├── EditorToolbarNew.tsx  # TipTap UI-based toolbar
└── TablePicker.tsx       # Portal-based picker

src/extensions/SlashCommands/
├── SlashCommands.ts      # Extension using Suggestion (ISSUE 3)
├── SlashMenu.tsx         # Dropdown component
└── commands.ts           # Command definitions
```

---

## Commands
```bash
npm run tauri dev   # Start desktop app
npm run build       # TypeScript check + Vite build
```

---

## Instructions for Next Context

1. **Read this file first**
2. Focus ONLY on Issue 2 (drag) and Issue 3 (slash search)
3. Add debug logging before making changes
4. For drag: Check if DragHandle events are firing at all
5. For slash: Check if onUpdate is being called with query
6. Test each fix individually with `npm run tauri dev`
