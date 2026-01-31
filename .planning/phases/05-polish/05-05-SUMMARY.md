---
phase: 05-polish
plan: 05
subsystem: ui
tags: [tiptap, comments, sqlite, zustand, mark-extension]

# Dependency graph
requires:
  - phase: 05-01
    provides: SQLite database foundation with migrations pattern
provides:
  - Comment TipTap mark extension with self-contained click handling
  - CommentPanel side panel component for comment management
  - SQLite comment storage with CRUD operations
  - Zustand store for comment state
affects: [05-07 integration, document serialization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mark extension with onCommentActivated callback option
    - SQLite migration versioning
    - Panel component with grouped list pattern

key-files:
  created:
    - src/extensions/Comment/Comment.ts
    - src/extensions/Comment/index.ts
    - src/components/Comments/CommentPanel.tsx
    - src/components/Comments/index.ts
    - src/lib/comment-storage.ts
    - src/stores/commentStore.ts
    - src/styles/comments.css
    - src-tauri/migrations/002_comments.sql
  modified:
    - src-tauri/src/lib.rs

key-decisions:
  - "D-05-05-001: Mark-based comment extension stores only ID in document, text in SQLite"
  - "D-05-05-002: Self-contained click handling via onCommentActivated callback option"
  - "D-05-05-003: Comment panel groups by resolved/unresolved status"

patterns-established:
  - "Comment mark pattern: data-comment-id attribute links to SQLite record"
  - "Extension callback option: onCommentActivated configured at registration time"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 05 Plan 05: Comments Summary

**Single-user commenting with inline yellow highlights, SQLite storage, and side panel for view/resolve/delete**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-01-31T16:22:17Z
- **Completed:** 2026-01-31T16:25:40Z
- **Tasks:** 3/3
- **Files modified:** 9

## Accomplishments

- Comment TipTap mark extension with setComment/unsetComment commands
- Self-contained click handling via onCommentActivated callback option
- CommentPanel side panel with grouped comment list (open/resolved)
- Full CRUD: create, resolve, unresolve, edit, delete comments
- SQLite storage separates comment text from document JSON
- Yellow highlight CSS with dark mode support

## Task Commits

Each task was committed atomically:

1. **Task 1: Create comment storage and store** - `7b8fcf6` (feat)
2. **Task 2: Create Comment TipTap extension** - `eff7d85` (feat)
3. **Task 3: Create CommentPanel component** - `c64ec2b` (feat)

## Files Created/Modified

- `src-tauri/migrations/002_comments.sql` - SQLite schema for comments table
- `src-tauri/src/lib.rs` - Added version 2 migration
- `src/lib/comment-storage.ts` - SQLite CRUD operations
- `src/stores/commentStore.ts` - Zustand state management
- `src/extensions/Comment/Comment.ts` - TipTap mark extension
- `src/extensions/Comment/index.ts` - Export barrel
- `src/components/Comments/CommentPanel.tsx` - Side panel component (393 lines)
- `src/components/Comments/index.ts` - Export barrel
- `src/styles/comments.css` - Yellow highlight styling

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| D-05-05-001 | Store comment text in SQLite, only ID in document marks | Keeps document JSON clean, allows comment metadata without polluting content |
| D-05-05-002 | onCommentActivated callback option on Comment extension | Self-contained extension - click handling wired at registration, no hard dependencies |
| D-05-05-003 | Group comments by resolved/unresolved | Clear visual separation, open comments are actionable |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Comment extension ready for registration in EditorCore (Plan 05-07)
- CommentPanel ready for integration in EditorWrapper (Plan 05-07)
- Add Comment command to be added to command palette (Plan 05-07)
- Integration will wire onCommentActivated callback to update store and open panel

---
*Phase: 05-polish*
*Completed: 2026-01-31*
