---
created: 2026-02-01T04:55
title: Redesign Focus Mode
area: ui
files:
  - src/hooks/useFocusMode.ts
  - src/styles/focus-mode.css
---

## Problem

Focus mode is "completely broken" per user testing feedback. The current implementation hides UI chrome but doesn't provide the expected distraction-free writing experience.

## Solution

TBD - needs user input on what focus mode should actually do. Options:
- Full-screen editor only (no panels, no toolbar)
- Dim everything except current paragraph
- Hide all UI with fade-in on hover
- Typewriter mode combination
