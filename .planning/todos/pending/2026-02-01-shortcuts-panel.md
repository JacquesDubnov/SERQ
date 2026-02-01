---
created: 2026-02-01T12:30
title: Add keyboard shortcuts management panel
area: ui
files:
  - src/hooks/useKeyboardShortcuts.ts
---

## Problem

Users cannot view, customize, or manage keyboard shortcuts. Need a dedicated panel that:
- Shows all available shortcuts in organized categories
- Allows users to rebind keys
- Detects and resolves conflicts
- Supports chord bindings (e.g., Cmd+K, Cmd+O)
- Persists custom bindings across sessions
- Allows reset to defaults

Currently shortcuts are hardcoded in various places without central management.

## Solution

Create Shortcuts Panel modal:
1. List all shortcuts by category (File, Edit, Format, View, etc.)
2. Show current binding + default binding
3. Click to rebind - capture next key combination
4. Conflict detection with visual warning
5. Resolution options (swap, keep both, cancel)
6. Search/filter shortcuts
7. Reset single shortcut or all to defaults
8. Export/import shortcut configurations

Technical:
- Central shortcut registry (single source of truth)
- Storage via tauri-plugin-store
- Hook into react-hotkeys-hook system
