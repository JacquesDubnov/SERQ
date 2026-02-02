# Phase 0 Handoff Document - V3

## Session Date: 2026-02-02

## STATUS: BLOCK DRAGGING FIXED, SLASH COMMANDS BROKEN

---

## COMPLETED: Block Dragging via DragHandle

### The Problem
TipTap's DragHandle extension allows dragging blocks, but the drop never completed - blocks would pick up with ghost image but not move to new position.

### Root Cause Discovery
**Tauri's `dragDropEnabled: true`** (in `src-tauri/tauri.conf.json` line 22) intercepts ALL drag-drop events at the webview/OS level. This blocks the browser's native `drop` event from ever reaching TipTap/ProseMirror.

The browser's `drop` event simply never fires - Tauri consumes it at the native level.

### Solution Implemented
Instead of fighting Tauri, we work WITH it:

1. **useTauriFileDrop.ts** - During internal drags (`__internalDragActive` flag):
   - Capture coordinates from Tauri's `over` events
   - Calculate block boundaries using `findBlockDropTarget()`
   - Show horizontal blue indicator between blocks
   - Store drop position in `window.__blockDropPosition`

2. **DragHandle.tsx** - Coordinated drag handling:
   - `handleDragStart`: Set flags, store editor and dragged node globally
   - `handleDragEnd`: Read stored drop position, execute move transaction

### Files Modified for Block Dragging
- `src/components/Editor/DragHandle.tsx` - Drag start/end handlers with transaction execution
- `src/components/Editor/EditorCore.tsx` - Flag checks in drop handlers
- `src/hooks/useTauriFileDrop.ts` - Block indicator and position calculation

### Block Dragging Now Works
- Visual indicator shows between blocks
- Blocks move to correct position
- Committed as: `02964c5 fix(00): implement block dragging with Tauri coordination`

---

## BROKEN: Slash Commands Text Filtering

### The Problem
Typing "/" opens the menu with 37 items, but typing any character after "/" (e.g., "/t") closes the menu instead of filtering.

### What Console Logs Show
```
[SlashCommands] onStart, items: 37        ← Menu opens
[SlashCommands] onExit called             ← Immediately exits!
[SlashCommands] onExit called
[DragHandle] onNodeChange: paragraph pos: 713
[SlashCommands] onExit called
...repeats constantly...
```

The `onExit` callback is being called CONSTANTLY, correlated with `DragHandle onNodeChange` events.

### Root Cause (Identified but not fixed)
The TipTap DragHandle extension fires `onNodeChange` whenever the mouse moves over editor content. This is somehow causing the Suggestion plugin (which powers slash commands) to exit.

The Suggestion plugin's `onExit` is being triggered spuriously - even when the menu should stay open.

### Attempted Fixes (None Worked)
1. **Global flag `__slashMenuOpen`** - Set in `items()` callback, checked in DragHandle's `onNodeChange`
   - Problem: `onExit` is called before/during flag being set

2. **Conditional DragHandle rendering** - Hide DragHandle when slash menu open
   - Problem: React doesn't re-render fast enough

3. **Setting flag earlier** - In `items()` callback before render
   - Problem: Still doesn't prevent the interference

### Current State
In `EditorCore.tsx` there's a temporary flag:
```typescript
const DISABLE_DRAG_HANDLE_FOR_TESTING = true;
```
This completely disables DragHandle. **Need to test if slash commands work with this flag set.**

### Next Steps to Try
1. **Test with DragHandle disabled** - Confirm slash commands work without it
2. If confirmed, investigate WHY DragHandle interferes:
   - Check if DragHandle extension dispatches transactions
   - Check if it modifies selection
   - Look at TipTap's Suggestion plugin source for what triggers `onExit`
3. Possible solutions:
   - Use a debounce on DragHandle's `onNodeChange`
   - Check if there's a TipTap config to prevent DragHandle/Suggestion conflict
   - Modify Suggestion plugin to be more resilient
   - Use different approach for slash menu (not using Suggestion plugin)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/extensions/SlashCommands/SlashCommands.ts` | Suggestion plugin config, render callbacks |
| `src/extensions/SlashCommands/commands.ts` | Command definitions and filter function |
| `src/components/Editor/DragHandle.tsx` | DragHandle wrapper with drag handlers |
| `src/components/Editor/EditorCore.tsx` | Editor setup, has `DISABLE_DRAG_HANDLE_FOR_TESTING` flag |
| `src/hooks/useTauriFileDrop.ts` | Tauri file drops + block indicator logic |
| `src-tauri/tauri.conf.json` | Tauri config with `dragDropEnabled: true` |

---

## Global Flags Used

| Flag | Purpose |
|------|---------|
| `window.__internalDragActive` | True during any internal drag (block or content) |
| `window.__dragHandleDragActive` | True specifically during DragHandle drags |
| `window.__dragHandleEditor` | Editor reference for Tauri hook |
| `window.__dragHandleNode` | Dragged node info for Tauri hook |
| `window.__blockDropPosition` | Calculated drop position (block boundary) |
| `window.__slashMenuOpen` | True when slash menu should be open (NOT WORKING) |

---

## Testing Commands

```bash
# Start the app
npm run tauri dev

# Type check
npx tsc --noEmit
```

---

## What Works Now
1. ✅ Toolbar displays in 3 tiers with proper 40px gap
2. ✅ TextColorPicker popup appears above everything
3. ✅ CaseControls popup appears above everything
4. ✅ TablePicker popup appears above everything
5. ✅ Multi-select copy/cut
6. ✅ Turn into menu (inline with back button)
7. ✅ Turn into affects correct block (direct transaction)
8. ✅ **Block dragging via DragHandle with indicator**
9. ❌ Slash commands text filtering (BROKEN)

---

## Git Status
- Block dragging fix committed and pushed
- Slash command debugging changes NOT committed (still broken)
- `DISABLE_DRAG_HANDLE_FOR_TESTING = true` is currently set in EditorCore.tsx
