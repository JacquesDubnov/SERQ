---
created: 2026-02-01T07:00
title: Add track changes and diff view for version history
area: ui
files:
  - src/components/VersionHistory/VersionHistoryPanel.tsx
  - src/lib/version-storage.ts
---

## Problem

Version history currently shows read-only preview of past versions. Users need:
- **Track Changes mode**: See what changed between versions (insertions/deletions highlighted)
- **Diff View**: Side-by-side or inline comparison of current vs selected version
- **Visual diff highlighting**: Green for additions, red for deletions, like GitHub diffs

This was explicitly marked as "v2 enhancement" and deferred from initial release.

## Solution

TBD - Research approaches:
- Use diff library (jsdiff, diff-match-patch) to compute changes
- Render diff as highlighted ProseMirror content or separate diff panel
- Consider side-by-side vs inline unified diff view
- Integrate with existing version history panel
- May need custom TipTap marks for diff highlighting (ins/del marks)
