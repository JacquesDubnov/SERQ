---
created: 2026-02-01T10:15
title: Add block rearrangement and matrix card view
area: feature
files:
  - src/components/Editor/
  - src/extensions/
---

## Problem

Users need better tools for organizing and restructuring long-form documents:

1. **Block Dragging**: Drag entire blocks (paragraphs, sections, headings) to rearrange document structure
2. **Matrix Card View**: Visual "corkboard" view showing sections/blocks as cards that can be rearranged
3. **Automatic Numbering**: Chapter, section, subsection numbering that updates automatically

Currently, rearranging content requires cut/paste operations. No visual overview of document structure exists.

## Solution

### Block Rearrangement
- Drag handles on all block-level elements
- Visual drop indicators between blocks
- Undo support for rearrangements

### Matrix Card View
- New view mode showing document as cards on a grid
- Each card = one section/chapter/major heading
- Drag cards to rearrange document order
- Preview content on card (truncated)
- Click card to navigate to that section in editor

### Automatic Section Numbering
- Chapter: 1, 2, 3...
- Section: 1.1, 1.2...
- Subsection: 1.1.1, 1.1.2...
- Updates automatically when sections are reordered

### Document Templates by Intent
Create proper project structure based on user intent:
- **Essay**: Introduction, Body paragraphs, Conclusion
- **Research Paper**: Abstract, Introduction, Literature Review, Methodology, Results, Discussion, References
- **Whitepaper**: Executive Summary, Problem Statement, Solution, Implementation, ROI
- **Novel**: Chapters with optional parts, prologue, epilogue

## Priority

Future phase - requires significant architecture work for matrix view
