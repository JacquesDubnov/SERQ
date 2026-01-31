---
phase: 04-extended-features
plan: 03
subsystem: ui
tags: [tiptap, document-outline, navigation, command-palette, headings]

# Dependency graph
requires:
  - phase: 04-02
    provides: Command palette infrastructure with cmdk
provides:
  - Document outline panel with heading hierarchy display
  - Click-to-navigate heading navigation
  - Dynamic "Jump to" commands in command palette
  - TableOfContents extension integration
affects: [05-polish]

# Tech tracking
tech-stack:
  added: [@tiptap/extension-table-of-contents]
  patterns: [dynamic command generation, outline state management]

key-files:
  created:
    - src/components/DocumentOutline/OutlinePanel.tsx
    - src/components/DocumentOutline/index.ts
  modified:
    - src/stores/editorStore.ts
    - src/components/Editor/EditorCore.tsx
    - src/components/CommandPalette/commands.ts
    - src/components/CommandPalette/CommandPalette.tsx
    - src/App.tsx

key-decisions:
  - "D-04-03-001: Use TipTap TableOfContents extension for heading tracking"
  - "D-04-03-002: Store outline anchors in editorStore for UI consumption"
  - "D-04-03-003: Outline panel slides from left (mirrors StylePanel on right)"
  - "D-04-03-004: Jump-to group appears at top of command palette when headings exist"

patterns-established:
  - "Outline Panel Pattern: slide-in panel with heading hierarchy and click navigation"
  - "Dynamic Command Pattern: generate commands from store state (outlineAnchors)"

# Metrics
duration: 5min
completed: 2026-01-31
---

# Phase 4 Plan 3: Document Outline Summary

**TipTap TableOfContents integration with slide-in outline panel and command palette "Jump to" commands**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-31T02:40:12Z
- **Completed:** 2026-01-31T02:44:53Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- TableOfContents extension tracks all headings (H1-H6) with position data
- Outline panel displays heading hierarchy with level indentation (H1 at root, H2 indented 16px, etc.)
- Click any heading to navigate cursor and scroll into view
- Command palette includes dynamic "Jump to" group with all document headings
- "Show Document Outline" command (Cmd+Shift+O) opens outline panel

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure TableOfContents extension** - `4bf09a6` (feat)
2. **Task 2: Document outline panel UI** - `47b7121` (feat)
3. **Task 3: Command palette integration** - `432b882` (feat)

## Files Created/Modified

- `src/components/DocumentOutline/OutlinePanel.tsx` - Slide-in panel component with heading list
- `src/components/DocumentOutline/index.ts` - Barrel export
- `src/stores/editorStore.ts` - Added OutlineAnchor interface and outlineAnchors state
- `src/components/Editor/EditorCore.tsx` - Configured TableOfContents extension
- `src/components/CommandPalette/commands.ts` - Added jump-to group and show-outline command
- `src/components/CommandPalette/CommandPalette.tsx` - Dynamic heading commands generation
- `src/App.tsx` - Wired outline panel with toggle button and Cmd+Shift+O shortcut

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| D-04-03-001 | Use TipTap TableOfContents extension | Official TipTap utility, handles heading tracking and active state |
| D-04-03-002 | Store outline anchors in editorStore | Centralized state accessible to both panel and command palette |
| D-04-03-003 | Panel slides from left | Mirrors StylePanel on right, provides visual balance |
| D-04-03-004 | Jump-to at top of command palette | Most relevant when searching for headings, easy access |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Document outline feature complete
- Heading navigation works via panel, command palette, and keyboard shortcut
- Ready for plans 04-05 (Images) and 04-06 (Math/Code)

---
*Phase: 04-extended-features*
*Completed: 2026-01-31*
