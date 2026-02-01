---
created: 2026-02-01T12:00
title: Project Management / Handling Projects
area: feature
files:
  - src/stores/projectStore.ts
  - src/components/ProjectPanel/ProjectPanel.tsx
---

## Problem

User wants project-level organization - grouping documents, tracking progress across multiple files.

## Solution

- Project abstraction layer (folder of .serq.html files)
- Project sidebar/panel
- Cross-document search
- Project-level metadata (goals, deadlines, status)
- Consider: file system based vs database based
