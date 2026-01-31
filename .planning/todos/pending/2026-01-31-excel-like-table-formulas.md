---
created: 2026-01-31T22:29
title: Add Excel-like formula support to tables
area: ui
files:
  - src/extensions/CustomTableCell.ts
  - src/components/Editor/EditorCore.tsx
---

## Problem

Tables in SERQ are currently static content only. Users expect basic spreadsheet-like functionality for practical document use cases:
- Arithmetic operations in cells (e.g., `=A1+B1*2`)
- Cell references using standard notation (A1, B2, C3)
- Common functions for aggregation and calculation

This is not about building full Excel - it's about the 10 functions that cover 90% of real document needs.

## Solution

Research and implement formula support:

**Cell Reference System:**
- Parse A1-style references (column letter + row number)
- Support relative references within tables
- Handle cross-cell dependencies

**Top 10 Functions to Implement:**
1. SUM - Sum of values
2. AVERAGE - Mean of values
3. MIN - Minimum value
4. MAX - Maximum value
5. COUNT - Count of numeric cells
6. IF - Conditional logic
7. ROUND - Rounding
8. ABS - Absolute value
9. CONCATENATE - Text joining
10. COUNTA - Count non-empty cells (alternative to VLOOKUP for simpler use case)

**Technical Approach (TBD):**
- Formula parser (possibly use existing library like hot-formula-parser or formulajs)
- Cell dependency graph for recalculation
- Integration with TipTap table extension
- Display calculated values while storing formulas
- Error handling (circular refs, invalid refs, #VALUE!, #REF!)

**Research Needed:**
- Survey existing formula parser libraries
- Determine how to integrate with ProseMirror/TipTap node model
- UX for formula input vs display mode
