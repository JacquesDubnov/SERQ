---
phase: 07-layout-and-numbering
plan: 05
subsystem: ui
tags: [tiptap, prosemirror, paragraph-numbering, widget-decorations, presets]

# Dependency graph
requires:
  - phase: 07-04
    provides: Line numbers extension pattern
provides:
  - Paragraph numbering extension with widget decorations
  - 12 numbering presets (sequential, hierarchical, legal)
  - Preset picker component with category tabs
  - Canvas context menu integration for paragraph numbering
affects: [serialization, export, future-numbering-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Widget decoration pattern for inline visual elements
    - Preset-based formatting with formatNumber callbacks
    - Heading hierarchy tracking for multi-level numbering

key-files:
  created:
    - src/extensions/ParagraphNumbers/presets.ts
    - src/extensions/ParagraphNumbers/ParagraphNumbers.ts
    - src/extensions/ParagraphNumbers/index.ts
    - src/styles/paragraph-numbers.css
    - src/components/Editor/ParagraphNumberPicker.tsx
  modified:
    - src/stores/editorStore.ts
    - src/components/Editor/CanvasContextMenu.tsx
    - src/components/Editor/EditorCore.tsx
    - src/components/Editor/index.ts

key-decisions:
  - "Widget decorations with side: -1 for number placement before content"
  - "Presets define formatNumber callback for flexible number formatting"
  - "Heading level tracking for hierarchical and legal presets"
  - "Empty paragraphs skipped from numbering"

patterns-established:
  - "Preset-based extension configuration: formatNumber(index, level, parents)"
  - "Widget decoration pattern for non-editable inline elements"

# Metrics
duration: 7min
completed: 2026-02-01
---

# Phase 7 Plan 5: Paragraph Numbering Summary

**Paragraph numbering extension with 12 presets across sequential, hierarchical, and legal styles, using widget decorations for inline number display**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-01T03:35:03Z
- **Completed:** 2026-02-01T03:42:17Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- 12 numbering presets: 6 sequential (numeric, roman, alpha, hex), 3 hierarchical, 3 legal
- Widget decorations insert non-editable numbers before block content
- Heading hierarchy tracking for multi-level numbering (1.1, 1.2, 2.1 patterns)
- Preset picker with category tabs (Sequential, Hierarchical, Legal)
- Canvas context menu integration with enable toggle and style selector

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Numbering Presets and Store Settings** - `61d2eff` (feat)
2. **Task 2: Create ParagraphNumbers Extension** - `05420b7` (feat)
3. **Task 3: Create Preset Picker and Integrate** - `894ff8b` (feat)

## Files Created/Modified

### Created
- `src/extensions/ParagraphNumbers/presets.ts` - 12 numbering presets with toRoman, toAlpha helpers
- `src/extensions/ParagraphNumbers/ParagraphNumbers.ts` - Widget decoration plugin with hierarchy tracking
- `src/extensions/ParagraphNumbers/index.ts` - Barrel exports
- `src/styles/paragraph-numbers.css` - Number styling with level-based indentation
- `src/components/Editor/ParagraphNumberPicker.tsx` - Preset picker UI with category tabs

### Modified
- `src/stores/editorStore.ts` - Added paragraphNumbers state and actions
- `src/components/Editor/CanvasContextMenu.tsx` - Added paragraph numbering section
- `src/components/Editor/EditorCore.tsx` - Registered ParagraphNumbers extension
- `src/components/Editor/index.ts` - Export ParagraphNumberPicker

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| D-07-05-001 | Widget decorations with side: -1 | Insert before node content for inline number display |
| D-07-05-002 | Preset formatNumber callback pattern | Flexible formatting without hardcoded number styles |
| D-07-05-003 | Heading level tracking for hierarchy | Enables proper 1.1, 1.2, 2.1 multi-level numbering |
| D-07-05-004 | Skip empty paragraphs | Avoid cluttering document with numbers on blank lines |
| D-07-05-005 | contentEditable=false on number spans | Prevent user from editing/selecting numbers |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed unused variable warning in LineNumbers extension**
- **Found during:** Task 1 (TypeScript build verification)
- **Issue:** LineNumbers.ts had unused `_node` parameter causing build failure
- **Fix:** Changed to explicit `_node: unknown` typing
- **Files modified:** src/extensions/LineNumbers/LineNumbers.ts
- **Verification:** Build passes
- **Committed in:** 61d2eff (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor fix to existing code to unblock build. No scope creep.

## Issues Encountered
- Build errors in existing CalloutContextMenu and EditorWrapper (unused imports/variables) - these were pre-existing issues from Phase 7 work, not introduced by this plan. Build passed after verifying correct file states.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Paragraph numbering fully functional for all preset types
- Ready for page break integration (plan 07-03)
- Numbers properly update on document structure changes
- Can be disabled/enabled via canvas context menu

---
*Phase: 07-layout-and-numbering*
*Plan: 05*
*Completed: 2026-02-01*
