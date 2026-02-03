# Final Polish Items

**Created:** 2026-02-03
**Priority:** Low - Deferred to final polish phase
**Phase:** Post-Phase 5 (Before Release)

---

## Items

### 1. Format Painter
- **Status:** Disabled in App.tsx
- **Issue:** Button works but feature needs refinement
- **Location:** `/src/components/FormatPainter/`
- **TODO:** Fix mouseup handling and re-enable in toolbar

### 2. Multi-Select for Non-Sequential Text
- **Status:** Not implemented
- **Issue:** TipTap/ProseMirror doesn't natively support discontinuous selections
- **Challenge:** Would need custom selection tracking and mark application
- **Use case:** Select word on line 1 + word on line 5, apply formatting to both
- **Research needed:** Check if TipTap Pro has any support for this

### 3. Debug Console Logs
- **Status:** Multiple debug logs scattered in color components
- **Files affected:**
  - `color-text-button.tsx`
  - `color-highlight-button.tsx`
  - `color-text-popover.tsx`
  - `use-color-text.ts`
  - `use-color-highlight.ts`
- **TODO:** Remove all `console.log` statements before release

---

## Notes

These items are intentionally deferred to avoid scope creep during core development. Address only after Phase 5 is complete and stable.
