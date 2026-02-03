# SERQ Session Handover

**Last Updated:** 2026-02-03
**Branch:** `feature/unified-style-system`

---

## Project Overview

SERQ is a Tauri-based desktop text editor using TipTap (ProseMirror). Currently building a **Unified Style System** to replace the dual-system architecture (TipTap marks + CSS variables) with a single, coherent styling architecture.

---

## Current Work: Unified Style System

### Why We're Doing This

The previous toolbar didn't reflect heading-level styles because:
- Toolbar reads from TipTap marks (editor.state)
- Heading styles live in styleStore (CSS variables)
- Two separate systems duct-taped together

The user wants a **modular, unified system** that can be exposed through:
1. **Toolbar** (Word-style)
2. **Context menus** (Notion-style)
3. **Keyboard shortcuts** (power user)
4. Any combination of the above

### What's Been Built (Foundation Complete)

**1. Style Operations Layer** (`src/lib/style-operations/`)
- `types.ts` - Core types: StyleContext, StyleProperty, StyleValue, StyleSource
- `context.ts` - Detect current context (is cursor in heading? what level?)
- `read.ts` - Read styles from marks, nodeAttrs, OR styleStore (auto-routes)
- `write.ts` - Write styles to correct destination based on context

**2. Unified Hooks Layer** (`src/hooks/style-hooks/`)
- `useUnifiedStyle` - Base hook for all style operations
- `useUnifiedFontFamily` - Font family with display name resolution
- `useUnifiedFontSize` - Font size in pixels
- `useUnifiedFontWeight` - Font weight 100-900 with labels
- `useUnifiedColor` / `useUnifiedHighlight` / `useUnifiedBackgroundColor`
- `useUnifiedMark` - Bold, italic, underline, strikethrough, code
- `useUnifiedLineHeight` / `useUnifiedLetterSpacing` / `useUnifiedSpacing`
- `useUnifiedTextAlign` - Alignment buttons

**Key Features:**
- All hooks return `isHeadingLevel: boolean` for UI indicator
- All hooks return `source: 'mark' | 'cssVar' | 'default'`
- Single entry point: `readStyle()` and `writeStyle()` route automatically
- Context-aware: headings → styleStore, paragraphs → marks

### What's Next (Not Started)

**3. Unified Toolbar Components** (`src/components/unified-toolbar/`)
Build toolbar controls that USE the unified hooks:
- FontFamilyControl
- FontSizeControl
- FontWeightControl
- MarkToggle (bold/italic/etc.)
- ColorControl
- TextAlignControl
- etc.

**4. Integration**
- Add toggle to switch between old/new toolbar for testing
- Test all scenarios (paragraph, heading, mixed selection)
- Replace EditorToolbar with UnifiedToolbar
- Archive old components

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED STYLE SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CONTROL SURFACES (UI)                   │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │ Toolbar │ │ Context  │ │ Keyboard │ │  Slash  │ │   │
│  │  │         │ │  Menu    │ │ Shortcuts│ │Commands │ │   │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │   │
│  └───────┼───────────┼────────────┼────────────┼──────┘   │
│          │           │            │            │           │
│          ▼           ▼            ▼            ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           UNIFIED STYLE HOOKS                        │   │
│  │  useUnifiedFontFamily, useUnifiedFontSize, etc.     │   │
│  │                                                      │   │
│  │  READ:  isHeading? → styleStore : editor.state      │   │
│  │  WRITE: isHeading? → styleStore : editor.chain()    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              STYLE OPERATIONS LAYER                  │   │
│  │                                                      │   │
│  │  StyleContext: { scope, blockType, level, editor }  │   │
│  │                                                      │   │
│  │  readStyle(ctx, property) → StyleValue              │   │
│  │  writeStyle(ctx, property, value)                   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│          ┌──────────────┼──────────────┐                   │
│          ▼              ▼              ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  styleStore  │ │ TipTap Editor│ │   CSS Vars   │       │
│  │ (Zustand)    │ │ (marks/attrs)│ │ (document)   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `.planning/UNIFIED-STYLE-SYSTEM-PLAN.md` | Full architectural plan |
| `src/lib/style-operations/` | Core read/write operations |
| `src/hooks/style-hooks/` | React hooks for UI components |
| `src/stores/styleStore.ts` | Zustand store for heading styles |
| `src/components/Editor/EditorToolbar.tsx` | Current toolbar (to be replaced) |

---

## Build Status

```bash
npm run build    # Compiles successfully
npm run tauri dev   # For testing
```

Branch: `feature/unified-style-system` (ahead of main)

---

## Technical Notes

- **Heading-level styling**: When cursor is in a heading, style changes affect ALL headings of that level (document-wide)
- **Inline styling**: When cursor is in paragraph, style changes affect only the selection
- **Context detection**: `getStyleContext(editor)` determines where we are
- **Auto-routing**: `writeStyle(ctx, 'fontFamily', value)` automatically routes to styleStore or marks

---

## What NOT to Change

- Keep existing styleStore structure intact
- Keep CSS variable system for heading styles
- Keep TipTap UI primitives (Button, Dropdown, etc.)
- Don't modify existing toolbar until UnifiedToolbar is ready

---

## Testing Checklist (For Next Session)

When building the UnifiedToolbar:

1. Place cursor in paragraph, change font → Only that text changes
2. Place cursor in H1, change font → ALL H1s change
3. Toolbar shows correct font for paragraph (from marks)
4. Toolbar shows correct font for H1 (from styleStore)
5. Blue dot indicator shows when viewing heading-level style
6. Undo works for both paragraph and heading changes
7. Save/load preserves all styles
