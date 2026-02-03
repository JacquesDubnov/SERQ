# Style Templates and Document Defaults

**Created:** 2026-02-03
**Priority:** Medium
**Category:** Preferences / Settings

---

## Overview

Add the ability to set document styling defaults and save/load style templates that can be applied to change an entire document's styling at will.

## Requirements

### 1. Document Defaults

- Default font family for body text and headings
- Default font sizes for each heading level (H1-H6) and paragraphs
- Default colors for text, headings, links
- Default line height and letter spacing
- Default paragraph spacing (before/after)
- These defaults apply to every new document

### 2. Style Templates

- Save current document styling as a named template
- Load a template to apply its styling to the current document
- Built-in templates (e.g., "Academic", "Minimal", "Modern", "Classic")
- User-created templates stored in preferences
- Template includes:
  - Typography settings (fonts, sizes, weights)
  - Heading custom styles (including dividers)
  - Spacing settings
  - Color scheme

### 3. UI Location

- Settings/Preferences panel
- Style Panel quick-access dropdown for template switching
- "Save as Template" option in context menus

## Technical Notes

- Store in user preferences (Tauri app data directory)
- Templates stored as JSON matching the StyleMetadata structure
- Document defaults are effectively a "Default" template that's applied on new document creation
- Consider import/export of templates as .json files

## Related Files

- `src/stores/styleStore.ts` - StyleMetadata structure
- `src/lib/preferencesStore.ts` - User preferences storage
- `src/components/StylePanel/` - UI for applying styles

## Acceptance Criteria

- [ ] User can set default document styling in Settings
- [ ] User can save current styling as a named template
- [ ] User can apply saved templates from Style Panel
- [ ] Templates persist across app sessions
- [ ] New documents use the default template
