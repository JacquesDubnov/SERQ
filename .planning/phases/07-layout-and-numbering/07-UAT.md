---
status: testing
phase: 07-layout-and-numbering
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md, 07-05-SUMMARY.md]
started: 2026-02-01T11:00:00Z
updated: 2026-02-01T11:00:00Z
---

## Current Test

number: 1
name: Insert 2-Column Layout
expected: |
  Type `/2col` in the editor. A 2-column layout should appear.
  You can type content in each column independently.
awaiting: user response

## Tests

### 1. Insert 2-Column Layout
expected: Type `/2col` - 2-column grid layout appears, can type in each column independently
result: [pending]

### 2. Resize Column Widths
expected: Drag the resize handle between columns - columns resize live, widths persist
result: [pending]

### 3. Float Image Left
expected: Insert image, right-click, select "Float Left" - image floats left, text wraps on right
result: [pending]

### 4. Float Callout Right
expected: Insert callout, right-click, select "Float Right" - callout floats right, text wraps on left
result: [pending]

### 5. Headings Clear Floats
expected: Insert heading after floated element - heading appears below float, not wrapped beside it
result: [pending]

### 6. Free Positioning Mode
expected: Right-click image, enable "Free Positioning" - image can be dragged anywhere on canvas
result: [pending]

### 7. Free Position Bounds
expected: Drag free-positioned image toward edge - constrained to stay within canvas bounds
result: [pending]

### 8. Line Numbers Toggle
expected: Right-click empty canvas space, enable "Show Line Numbers" - line numbers appear in gutter
result: [pending]

### 9. Line Numbers Legal Style
expected: Switch line numbers to "legal" style - only every 5th line numbered (5, 10, 15...)
result: [pending]

### 10. Paragraph Numbering Sequential
expected: Right-click canvas, open paragraph numbering, select "Numbers (1, 2, 3)" - paragraphs numbered sequentially
result: [pending]

### 11. Paragraph Numbering Hierarchical
expected: Add H1, paragraphs, H2, paragraphs - with hierarchical preset, numbers show 1.1, 1.2, 2.1 etc
result: [pending]

### 12. Disable Numbering
expected: Disable paragraph numbering via context menu - all numbers disappear
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0

## Gaps

[none yet]
