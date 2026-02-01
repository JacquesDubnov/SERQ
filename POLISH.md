# SERQ Polish Items

Bugs and minor issues to address during final polish phase.

## Tauri-Specific Limitations

These work in browser but not in the Tauri app due to webview limitations:

- [ ] **Cursor on image resize handles** - Cursor doesn't change to resize cursor when hovering over image resize handles in Tauri
- [ ] **Image drag within canvas** - Cannot drag images to reposition them within the editor in Tauri
- [ ] **Drop cursor indicator** - Blue line showing drop position doesn't appear when dragging in Tauri

## Both Platforms

- [ ] **Cell selection overlay persistence** - When clicking a context menu item, the blue selection overlay sometimes persists after the menu closes. Requires an additional click to dismiss. The selection STATE works correctly, just the visual overlay cleanup has a timing issue.

---

## Broken/Incomplete Features (Priority: CRITICAL)

These were marked complete but are NOT working:

- [ ] **Focus Mode** - Completely broken, needs full implementation
  - Hide all UI chrome (toolbar, panels, status bar)
  - Show exit hint on hover near edges
  - Smooth transition in/out
  - Keyboard shortcut (Cmd+Shift+F)

- [ ] **Typewriter Mode** - Doesn't work at all
  - Keep cursor line centered vertically while typing
  - Smooth scrolling as user types
  - Toggle via status bar or command palette

- [ ] **Status Bar** - Needs significant work
  - Word count display
  - Character count display
  - Cursor position (line/column)
  - Document state indicator
  - Typewriter mode toggle
  - Clean visual design

---

## UI Polish - Comprehensive Overhaul

**Priority: HIGH** - Current UI is functional but visually rough. Needs dedicated session to make it beautiful.

### Global Design System

- [ ] **Establish consistent spacing scale** - Define 4px/8px/12px/16px/24px/32px system
- [ ] **Typography hierarchy** - Consistent font sizes, weights, line heights across app
- [ ] **Color palette refinement** - Cohesive light/dark theme colors with proper contrast ratios
- [ ] **Border radius consistency** - Unified corner rounding (currently mixed)
- [ ] **Shadow system** - Consistent elevation shadows for cards, panels, menus
- [ ] **Transition/animation standards** - Smooth, consistent motion design

### Component Polish

- [ ] **Header/Toolbar** - Clean up button spacing, alignment, visual weight
- [ ] **Command Palette** - Improve search input styling, result grouping, keyboard hints
- [ ] **Slash Menu** - Better visual hierarchy, cleaner icons, improved hover states
- [ ] **Context Menus** - Consistent styling with command palette, proper padding
- [ ] **Comment Panel** - Better visual separation, cleaner edit states, improved empty state
- [ ] **Comment Tooltip** - Refined arrow, better shadow, smoother animation
- [ ] **Style Panel** - Tab styling, form controls, preset cards
- [ ] **Document Outline** - Tree styling, active state, indentation guides
- [ ] **Status Bar** - Better information density, cleaner separators
- [ ] **Export Menu** - Dropdown styling consistency

### Editor Canvas

- [ ] **Canvas shadow/border** - Clean paper-like appearance
- [ ] **Selection highlight color** - Refine blue selection color
- [ ] **Cursor styling** - Consider custom caret color
- [ ] **Placeholder text** - Better positioning and styling
- [ ] **Block spacing** - Consistent paragraph/heading margins

### Tables

- [ ] **Cell borders** - Cleaner grid lines
- [ ] **Header row styling** - Better visual distinction
- [ ] **Resize handles** - More refined appearance
- [ ] **Selection overlay** - Cleaner blue highlight

### Callouts

- [ ] **Color variants** - Refine the 8 callout colors
- [ ] **Icon styling** - Clean collapse/expand icons
- [ ] **Border/background** - Better visual weight

### Icons

- [ ] **Icon library audit** - Replace ALL emoji icons with Lucide/clean SVG
- [ ] **Consistent icon sizing** - 16px/20px/24px standard sizes
- [ ] **Icon color** - Proper opacity/color for different states

### Responsive/Polish

- [ ] **Minimum window size handling** - Graceful degradation
- [ ] **Panel collapse animations** - Smooth open/close
- [ ] **Loading states** - Skeleton screens where needed
- [ ] **Empty states** - Helpful messaging with icons
- [ ] **Error states** - Consistent error styling

---

*Last updated: 2026-02-01*
