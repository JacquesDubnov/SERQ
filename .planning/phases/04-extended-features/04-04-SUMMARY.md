---
phase: 04-extended-features
plan: 04
subsystem: ui
tags: [tiptap, callout, react, nodeview, context-menu]

# Dependency graph
requires:
  - phase: 01-editor-foundation
    provides: TipTap editor core with extensions array
  - phase: 04-02
    provides: Slash commands infrastructure
provides:
  - Callout node extension with color-based styling
  - Right-click context menu for callout configuration
  - Toolbar and slash command insertion
affects: [05-polishing, document-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ReactNodeViewRenderer for custom block UI
    - Context menu pattern matching tables
    - 8-color palette for callouts

key-files:
  created:
    - src/extensions/Callout/Callout.ts
    - src/extensions/Callout/CalloutView.tsx
    - src/extensions/Callout/CalloutContextMenu.tsx
    - src/extensions/Callout/index.ts
    - src/lib/calloutColors.ts
  modified:
    - src/components/Editor/EditorCore.tsx
    - src/components/Editor/EditorToolbar.tsx
    - src/extensions/SlashCommands/commands.ts
    - src/styles/callout.css

key-decisions:
  - "Color-based callouts (not semantic info/warning/error types) per CONTEXT spec"
  - "8 colors: blue, green, yellow, orange, red, purple, pink, gray"
  - "4px border-radius matching table styling"
  - "Left border accent + background color visual style"

patterns-established:
  - "Custom block extension: Node.create + ReactNodeViewRenderer"
  - "NodeViewWrapper + NodeViewContent for editable content"
  - "Context menu integrated into NodeView component"
  - "Callout colors defined in calloutColors.ts for reuse"

# Metrics
duration: 4min
completed: 2026-01-31
---

# Phase 04 Plan 04: Callout Blocks Summary

**Custom callout block extension with 8-color palette, right-click context menu, collapsible toggle, and optional icons**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-31T02:33:31Z
- **Completed:** 2026-01-31T02:37:27Z
- **Tasks:** 3
- **Files created:** 5
- **Files modified:** 4

## Accomplishments

- Callout node extension with `content: 'block+'` allowing paragraphs, lists, headings inside
- 8 color variants with light and dark mode support
- Right-click context menu for color, icon, collapsible, and delete
- Toolbar button and `/callout` slash command for insertion

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Callout node extension** - `6905096` (feat)
2. **Task 2: Callout styling and color palette** - `207a370` (feat)
3. **Task 3: Context menu and toolbar integration** - `722c963` (feat)

## Files Created/Modified

**Created:**
- `src/extensions/Callout/Callout.ts` - TipTap Node.create with attributes: color, icon, collapsed, collapsible
- `src/extensions/Callout/CalloutView.tsx` - React component with NodeViewWrapper, context menu handler
- `src/extensions/Callout/CalloutContextMenu.tsx` - Right-click menu with color/icon pickers
- `src/extensions/Callout/index.ts` - Module exports
- `src/lib/calloutColors.ts` - Color definitions and icon presets

**Modified:**
- `src/components/Editor/EditorCore.tsx` - Register Callout extension
- `src/components/Editor/EditorToolbar.tsx` - Add callout insert button
- `src/extensions/SlashCommands/commands.ts` - Add /callout command
- `src/styles/callout.css` - Block styles, 8 color variants, context menu styles

## Decisions Made

- **Color-based not semantic:** Per CONTEXT, callouts use colors (blue, green, yellow, etc.) not semantic types (info, warning, error)
- **8-color palette:** Consistent with table cell background colors
- **Left border accent:** Visual style with 4px left border + light background
- **Icons via emoji:** Using emoji for quick icon selection (lightbulb, warning, note, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - previous executor's partial work was cleaned up before starting fresh.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Callout blocks fully functional with all features
- Ready for Phase 5 polishing or additional extended features
- Patterns established for future custom block extensions

---
*Phase: 04-extended-features*
*Completed: 2026-01-31*
