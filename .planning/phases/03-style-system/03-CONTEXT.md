# Phase 3: Style System - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can transform document appearance via preset selection — typography (23 presets), color schemes (25 presets with light/dark variants), and canvas backgrounds (solid, gradient, pattern) — without modifying content. Format painter copies block-level formatting between elements.

</domain>

<decisions>
## Implementation Decisions

### Preset Selector UX

- **Panel type:** Slide-in panel from right side, fixed width, pushes content (doesn't overlay)
- **Panel structure:** Combined panel with accordion sections (Typography | Colors | Canvas)
- **Default section:** Typography expanded on open, one section at a time
- **Preset display:** Name only (no font samples), alphabetically sorted
- **Recents:** "Recently used" section at top of each accordion section
- **Filter:** Simple text filter to search presets by name
- **Panel activation:** Toolbar toggle button + keyboard shortcut (both work)
- **Instant application:** Clicking preset immediately applies to document — document IS the preview
- **Reset button:** Reverts to document's saved style (last saved state)

### Style Scope & Persistence

- **Scope:** Per-document styles saved in file, with global user default for new documents
- **New document default:** SERQ default preset unless user has set their own default
- **Default setting:** "Set as Default" button in panel AND accessible in app Settings
- **Style storage:** Claude's discretion (metadata JSON or inline CSS variables in .serq.html)
- **Dirty state:** Style changes mark document as dirty (trigger auto-save, unsaved indicator)
- **Legacy files:** Files without style metadata get user's default → SERQ default fallback, always open styled

### Custom Saved Styles

- **Combined styles:** Users can save custom combinations of typography + colors + canvas as named styles
- **Save action:** "Save Current Style" button at bottom of panel
- **Storage location:** Custom styles appear at top of each section with distinct visual designation
- **Management:** Full inline management — rename, delete, reorder via hover icons

### Light/Dark Mode

- **System follow:** Follows macOS system mode by default, user can override to lock light or dark
- **Color scheme variants:** Each of 25 color schemes has both light AND dark variants
- **Toggle location:** Both in style panel (Colors section) AND in app chrome/title bar
- **Mode scope:** Global only (not per-document)
- **Keyboard shortcut:** Yes, assign one for quick toggle
- **Transition:** Immediate and silent when system mode changes
- **Canvas independence:** Canvas background is separate choice, doesn't auto-adapt with light/dark mode

### Format Painter Mechanics

- **What's copied:** All block-level parameters — text: alignment, paragraph styling, inline formatting; images: size (maintaining aspect ratio), borders, shadows, crop
- **Activation modes:**
  1. Toggle mode (button): Click painter icon → stays active → paint multiple targets → click icon again to deactivate
  2. Hold mode (keyboard): Select source → hold shortcut → paint while held → release to stop
- **Baseline UX:** Works like Microsoft Word / Google Docs — familiar muscle memory
- **Visual feedback:** Custom paintbrush cursor when active
- **Type mismatch:** Apply compatible properties, silently ignore incompatible ones

### Claude's Discretion

- Style storage format in .serq.html (metadata JSON vs inline CSS variables)
- Keyboard shortcut assignments (style panel, light/dark toggle)
- Exact panel width
- Saved style visual designation (icon vs color vs other)

</decisions>

<specifics>
## Specific Ideas

- "The document IS the preview" — clicking preset instantly transforms content, no separate preview pane
- Format painter should work exactly like Word/Google Docs because that's what people know
- Custom saved styles should feel native, appearing alongside built-in presets but visually distinguished

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-style-system*
*Context gathered: 2026-01-30*
