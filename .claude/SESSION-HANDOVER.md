# SERQ Session Handover

**Last Updated:** 2026-02-04
**Branch:** feature/unified-style-system
**Current Task:** DragHandle Not Working - BLOCKED

---

## CRITICAL: DragHandle Issue - What We Know

### The Problem
TipTap's DragHandle doesn't show in SERQ, even though:
- It works PERFECTLY in a clean sandbox (`/Users/jacquesdubnov/Coding/drag-test`)
- Same TipTap packages, same component, same import

### What We Proved

1. **Clean sandbox works flawlessly** (32 seconds to set up, instant success)
   - Path: `/Users/jacquesdubnov/Coding/drag-test/src/App.tsx`
   - Just StarterKit + DragHandle - nothing else
   - Handles appear, drag works, drop works

2. **SERQ's custom code breaks it** - Per Jacques: "It is something out of the things that we've done in order to deal with bugs that screwed the entire thing"

3. **DragHandle IS receiving mouse events** (from debug logs):
   ```
   [DragHandle] Node changed: undefined at pos: -1
   ```
   The plugin fires, but returns `pos: -1` meaning it can't resolve node coordinates.

4. **Mouse events reach the editor DOM** (verified with listener)

### What This Means
The DragHandle plugin can detect mouse movement but **cannot map coordinates to document positions**. Something in SERQ's structure breaks `view.posAtCoords()`.

### Suspects (Not Yet Proven)

1. **CSS Transform** - Was using `transform: scale(zoom/100)` for zoom - KNOWN to break floating-ui
2. **Canvas padding** - 74px padding might affect coordinate mapping
3. **EditorWrapper** - Has click handlers, positioned children, background overlay
4. **overflow: hidden** - Root app has this, could clip absolutely positioned handle
5. **Custom extensions** - VirtualCursor, StubCommands, etc.

### What NOT to Do
- Random trial-and-error changes
- Breaking other functionality to debug this
- Removing essential components without reverting

---

## Clean Slate Plan

### Step 1: Isolate Variables
Create a minimal test INSIDE SERQ (not separate app) that progressively adds:
1. Just TipTap + StarterKit + DragHandle (no custom extensions)
2. Add custom extensions one by one
3. Add wrappers one by one
4. Find the exact component that breaks it

### Step 2: Compare Working vs Broken
Side-by-side comparison of:
- DOM structure (working sandbox vs SERQ)
- CSS applied to editor elements
- Event propagation paths

### Step 3: Fix Root Cause
Don't patch symptoms - find why `posAtCoords` fails.

---

## Files Reverted

All experimental changes from the debugging session were reverted:
```bash
git checkout src/App.tsx src/components/Editor/EditorCore.tsx
```

App is back to working state (minus DragHandle).

---

## Current App Structure

```
App.tsx
├── <main> (overflow-x: hidden, overflow-y: auto)
│   ├── [Paginated mode]
│   │   └── EditorWrapper > EditorCore
│   └── [Continuous mode]
│       └── Canvas (74px padding) > EditorWrapper > EditorCore
│           └── EditorCore contains:
│               └── EditorContent + all extensions
└── DragContextMenu (separate, receives editor prop)
```

The working sandbox has:
```
App.tsx
└── <div> (simple padding)
    ├── EditorContent
    └── DragHandle (sibling)
```

---

## Quick Context

### What SERQ Is
Tauri desktop text editor using TipTap (ProseMirror). Has zoom, pagination, unified styling.

### Key Commands
```bash
npm run tauri dev    # Start app (ALWAYS this)
./scripts/read-log.sh # Check debug log
```

### TipTap Teams License
Full Pro access. DragHandle component installed and configured.

---

## Next Session: Fresh Start Required

Jacques' advice: "Take a nap, get a fresh mind, restart in the morning."

The debugging approach of random changes didn't work. Need systematic isolation testing.

---

*Working sandbox reference: `/Users/jacquesdubnov/Coding/drag-test`*
