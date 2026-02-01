---
created: 2026-02-01T04:55
title: Add Zoom Slider to Status Bar
area: ui
files:
  - src/components/StatusBar/StatusBar.tsx
---

## Problem

User requested zoom slider on the status bar for adjusting editor zoom level.

## Solution

Add a zoom slider (50%-200%) to the right side of the status bar:
- Store zoom level in editorStore or styleStore
- Apply zoom via CSS transform or font-size adjustment on editor container
- Show percentage label next to slider
