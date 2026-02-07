# SERQ Operations & Mutations Analysis

**Role:** Operations & Mutations Engineer
**Date:** 2026-02-06
**Status:** Round 2 -- Operations Analysis against Round 1 Schema Proposal
**Analyzed against:** `round1-schema-architect.md` (Schema Architect, Round 1)
**Codebase commit:** `de5322a` on `main`

---

## 0. Executive Summary

The Schema Architect's proposal to insert a `section` node between `doc` and blocks is structurally sound and solves the right problem. But adding a hierarchy level has non-trivial consequences for every mutation the user performs. ProseMirror's transaction model handles tree mutations well, but the devil is in how `isolating: true` and `defining: true` interact with keyboard operations, how positions shift when the tree depth increases by one, and how the existing drag-and-drop code (which assumes blocks live at depth 1 under `doc`) must be rewritten.

**Bottom line:** The schema change is worth it. The pagination problem dies. But the migration cost for the interaction layer is significant and must not be underestimated. Below is the exhaustive catalog.

---

## 1. OPERATION CATALOG

### 1.1 CREATE Operations

#### 1.1.1 Create New Paragraph (Enter Key)

- **Preconditions:** Cursor is inside a text block (paragraph, heading, list item). Document is in a valid state.
- **The operation:** ProseMirror's `splitBlock` command. Splits the current textblock at the cursor, creating a new sibling paragraph.
- **Postconditions:** Two nodes exist where one existed before. Cursor is at the start of the new node.
- **Inverse:** `join` (undo merges them back). PM history handles this natively.
- **Impact of section node:** **CHANGED, NEEDS ATTENTION.**
  - Today: `splitBlock` at depth 1 splits a direct child of `doc`. The new paragraph is another direct child of `doc`.
  - New schema: `splitBlock` at the deepest textblock is fine -- the paragraph is still splitting within its section. But `splitBlock` with `isolating: true` on the section means that pressing Enter at the very end of the last paragraph in a section does NOT split the section. It creates a new paragraph inside the same section. This is the **correct** behavior -- you don't want every Enter keypress to spawn a new section.
  - **Risk:** If `isolating` is misconfigured or overridden, Enter at end-of-section could split the section, which would be catastrophic for user experience.
  - **Verdict:** Easier (no change to default behavior).

#### 1.1.2 Create New Heading

- **Preconditions:** Cursor is in a paragraph. User triggers heading conversion (keyboard shortcut or slash command).
- **The operation:** `setNode` command: `tr.setNodeMarkup(pos, schema.nodes.heading, { level })`. Transforms the paragraph node type to heading without changing content.
- **Postconditions:** Node at same position is now `heading` with specified level.
- **Inverse:** `setNodeMarkup` back to paragraph. PM history handles this.
- **Impact of section node:** **UNCHANGED.** `setNodeMarkup` operates on the node at a given position. Adding a section wrapper above it does not affect this operation. The position `pos` shifts (because section opening tag adds to the offset), but that is handled by PM's position resolution.

#### 1.1.3 Create New List (Bullet/Ordered)

- **Preconditions:** Cursor is in a paragraph.
- **The operation:** `wrapInList` command from `prosemirror-schema-list`. Wraps the current block in a `bulletList > listItem` structure.
- **Postconditions:** Paragraph is now nested inside `listItem > bulletList`. Structure: `doc > section > bulletList > listItem > paragraph`.
- **Inverse:** `liftListItem`. PM history handles this.
- **Impact of section node:** **UNCHANGED.** `wrapInList` wraps a range of blocks within their parent. The parent is now `section` instead of `doc`, but the wrapping logic is parent-agnostic. Content expression `(block | container)+` on section allows `bulletList` (as a container).

#### 1.1.4 Create Image Block

- **Preconditions:** User triggers image insertion (file picker, paste, drag).
- **The operation:** `tr.insert(pos, schema.nodes.image.create(attrs))` or `tr.replaceSelectionWith(imageNode)`.
- **Postconditions:** Image node exists at the specified position within the current section.
- **Inverse:** `tr.delete`. PM history.
- **Impact of section node:** **UNCHANGED.** Insert operations work at arbitrary positions. The image lands inside whatever section the cursor is in.

#### 1.1.5 Create Column Layout

- **Preconditions:** Cursor is in a top-level block within a section (not already inside a column).
- **The operation:** Current `setColumns` command (commands.ts line 77-151): finds the depth-1 block, wraps it in `columnBlock > column` structure.
- **Postconditions:** `doc > section > columnBlock > column > paragraph`.
- **Inverse:** `unsetColumns` (unwraps back to individual blocks). PM history.
- **Impact of section node:** **CHANGED, NEEDS UPDATE.**
  - Today: `setColumns` finds the block at `$from.depth === 1` (direct child of doc at depth 0). It uses `$from.before(1)` for block position.
  - New schema: The block is at depth 2 (child of section at depth 1, which is child of doc at depth 0). The command must find depth 2, not depth 1. Alternatively, it should look for "the nearest block-group child" rather than hardcoding depth.
  - **All commands.ts `findColumnBlock` and `setColumns` depth assumptions must be updated.**
  - The nesting guard (`$from.node(d).type.name === 'columnBlock' || 'column'`) still works -- it walks up from any depth.

#### 1.1.6 Create Section (NEW)

- **Preconditions:** User explicitly requests section creation (keyboard shortcut, slash command, or section split).
- **The operation:** Two sub-cases:
  1. **Empty section after current:** `tr.insert(afterSectionPos, schema.nodes.section.create(null, [schema.nodes.paragraph.create()]))`
  2. **Split section at cursor:** See Section 1.5.2 below.
- **Postconditions:** New section exists in the document. Old section's content is preserved. New section has at least one block (empty paragraph).
- **Inverse:** Merge sections (delete section boundary). PM history handles the insert/split.
- **Impact of section node:** **NEW OPERATION.** Does not exist today. Must be implemented from scratch.

---

### 1.2 DELETE Operations

#### 1.2.1 Delete Block

- **Preconditions:** Block is selected or cursor is at block boundary and Backspace/Delete is pressed.
- **The operation:** `tr.delete(pos, pos + node.nodeSize)`.
- **Postconditions:** Block is gone. If the section is now empty, ProseMirror auto-inserts a paragraph (because `content: '(block | container)+'` requires at least one child).
- **Inverse:** `tr.insert`. PM history.
- **Impact of section node:** **UNCHANGED for non-last blocks.** ProseMirror handles auto-fill for empty required content. The `+` in the content expression means PM will insert a default block if all children are deleted.

#### 1.2.2 Delete Section

- **Preconditions:** User explicitly deletes a section (context menu, keyboard shortcut when section is selected).
- **The operation:** `tr.delete(sectionPos, sectionPos + sectionNode.nodeSize)`.
- **Postconditions:** Section and all its content are gone. If it was the last section, PM auto-inserts a new section with an empty paragraph (because `doc` content is `section+`).
- **Inverse:** PM history inserts the entire section back.
- **Impact of section node:** **NEW OPERATION.** Today there are no sections to delete. The auto-insert behavior needs verification -- will PM create `section > paragraph` or just `section`? The answer depends on the `section` node's content expression. Since `section` has `(block | container)+`, PM should create `section > paragraph`. This cascades: `doc` requires `section+`, `section` requires `(block | container)+`, so the minimum valid document is `doc > section > paragraph`. Correct.

#### 1.2.3 Delete Column

- **Preconditions:** Column exists within a columnBlock. User triggers column removal.
- **The operation:** `removeColumn(index)` command. See commands.ts line 209-279.
- **Postconditions:** Column content merged into adjacent column. ColumnBlock attributes updated. If only 1 column would remain, unwrap entire columnBlock.
- **Inverse:** PM history.
- **Impact of section node:** **UNCHANGED.** Column operations are internal to the columnBlock subtree, which is nested inside a section. Section boundary does not affect intra-columnBlock mutations.

---

### 1.3 MOVE Operations

#### 1.3.1 Move Block Within Section

- **Preconditions:** Block A is in section S. Drop target is also in section S.
- **The operation:** `tr.delete(sourcePos, sourceEnd).insert(targetPos, sourceNode)` with position mapping.
- **Postconditions:** Block A is at new position within section S. All other blocks shifted accordingly.
- **Inverse:** PM history (reverse delete + reverse insert).
- **Impact of section node:** **UNCHANGED in mechanics.** The block moves within the same parent container. ProseMirror handles this identically to today's within-doc moves.

#### 1.3.2 Move Block Between Sections (NEW)

- **Preconditions:** Block A is in section S1. Drop target is in section S2.
- **The operation:** `tr.delete(sourcePos, sourceEnd)` then `tr.insert(mappedTargetPos, sourceNode)`.
- **Postconditions:** Block A is now in section S2. Section S1 has one fewer block. If S1 is now empty, PM auto-fills with a paragraph.
- **Inverse:** PM history.
- **Impact of section node:** **NEW OPERATION, WORKS NATURALLY.**
  - ProseMirror does not care whether the source and target are in the same parent node. `tr.delete` + `tr.insert` works across any tree boundaries.
  - **Key concern:** Position mapping. When you delete from S1, all positions in nodes after S1 shift. `tr.mapping.map(targetPos)` handles this correctly because PM transactions track position mappings.
  - **Key concern:** If S1 becomes empty after the move, PM's schema enforcement inserts a default paragraph. This is correct but the user might not expect it. Consider: should an empty section be auto-deleted instead? This would require a normalization plugin.

#### 1.3.3 Section Reorder

- **Preconditions:** User drags an entire section to a new position among sibling sections.
- **The operation:** `tr.delete(sectionPos, sectionEnd).insert(mappedTargetPos, sectionNode)`.
- **Postconditions:** Section is at new position. Other sections shifted.
- **Inverse:** PM history.
- **Impact of section node:** **NEW OPERATION.** This is a major UX feature enabled by the section node. Today, there is no concept of "move a group of blocks." You would have to select multiple blocks, cut, navigate, paste. With sections, a single drag moves the entire section atomically.
  - **Transaction concern:** Section nodes can be large (hundreds of blocks). The transaction will contain a delete step and an insert step both involving large node sizes. PM handles this fine -- steps work with `Slice` objects, not individual nodes.

---

### 1.4 SPLIT Operations

#### 1.4.1 Split Paragraph at Cursor

- **Preconditions:** Cursor is mid-paragraph.
- **The operation:** `splitBlock` (Enter key). Standard ProseMirror behavior.
- **Postconditions:** Two paragraphs where one existed before. Both in the same section.
- **Inverse:** PM history.
- **Impact of section node:** **UNCHANGED.** `splitBlock` splits the deepest textblock. The section wrapper above is unaffected.

#### 1.4.2 Split Section at Cursor (NEW)

- **Preconditions:** Cursor is between blocks within a section, or at a block boundary. User triggers section split.
- **The operation:** This is conceptually: "Take all blocks from cursor position to end of section, move them into a new section inserted after the current one."
  - Step 1: Determine the split point (between which two blocks).
  - Step 2: Collect all blocks after the split point.
  - Step 3: Delete them from the current section.
  - Step 4: Create a new section containing those blocks.
  - Step 5: Insert the new section after the current section.
- **Postconditions:** Two sections where one existed before. First section has blocks before the split. Second section has blocks after the split. Both sections are valid (at least one block each).
- **Inverse:** PM history (but see complications below).
- **Impact of section node:** **NEW OPERATION, NON-TRIVIAL.**
  - This is multiple transaction steps that must execute atomically.
  - **Complication:** Section attributes. If the original section had `level: 2, numbering: 'decimal'`, what does the new section inherit? The Schema Architect's proposal doesn't specify inheritance rules for section splits. My recommendation: the new section inherits all attributes from the original except `pageBreakBefore` (which should be `false` on the continuation section).
  - **Complication:** Section UUID. The new section gets a new UUID. Any cross-references targeting the original section still point to the original (which now has fewer blocks). This is probably correct behavior.

---

### 1.5 MERGE Operations

#### 1.5.1 Merge Adjacent Paragraphs

- **Preconditions:** Cursor is at the start of paragraph B, which immediately follows paragraph A. Backspace is pressed.
- **The operation:** `joinBackward` or `joinTextblockBackward`. ProseMirror merges the two textblocks.
- **Postconditions:** Single paragraph with combined content.
- **Inverse:** PM history.
- **Impact of section node:** **UNCHANGED within a section.** If both paragraphs are in the same section, this is standard PM join behavior.
  - **CRITICAL EDGE CASE: Merging across section boundary.** If paragraph B is the FIRST block of section S2, and paragraph A is the LAST block of section S1, pressing Backspace at the start of B should merge the paragraphs. But `isolating: true` on the section node **blocks this join**. ProseMirror's `joinBackward` respects `isolating` and will NOT merge across isolating boundaries.
  - **This is a deliberate design choice** but must be consciously decided. Options:
    1. **Keep isolation:** Backspace at start of first block in a section does nothing (or moves cursor to end of previous section without merging). This is the safest but may confuse users who don't understand sections.
    2. **Override isolation for Backspace:** Write a custom keymap that, on Backspace at the start of a section's first block, merges the block into the previous section and potentially merges the sections if the moved block was the only content.
    3. **Use `isolating: false`:** This allows natural merging but weakens section boundaries for ALL operations. Not recommended.
  - **My recommendation:** Option 2. Keep `isolating: true` but add explicit keymap handling for the cross-section merge case. This gives the best of both worlds.

#### 1.5.2 Merge Adjacent Sections (NEW)

- **Preconditions:** Two adjacent sections S1 and S2. User triggers merge (e.g., Backspace at start of S2's first block, or explicit merge command).
- **The operation:**
  - Step 1: Collect all blocks from S2.
  - Step 2: Delete S2.
  - Step 3: Insert S2's blocks at the end of S1.
  - Alternative: `tr.join(posAfterS1)` if sections are adjacent. ProseMirror's `join` merges two adjacent nodes of the same type by combining their children.
- **Postconditions:** Single section with all blocks from both. Section attributes come from S1 (the surviving section).
- **Inverse:** PM history.
- **Impact of section node:** **NEW OPERATION.** The `tr.join()` approach is clean but only works when the nodes are of the same type (both `section`). This is always true in our schema since all direct children of `doc` are sections. The `join` step is a single PM step that undo can reverse cleanly.

---

### 1.6 REPARENT Operations

#### 1.6.1 Block Into Column

- **Preconditions:** Block exists at the section level (not inside a column). User drags it to a column's edge zone.
- **The operation:** `executeHorizontalDrop` in plugin.ts. Either wraps source + target into a new columnBlock, or inserts source as a new column in an existing columnBlock.
- **Postconditions:** Block is now nested inside `columnBlock > column`.
- **Inverse:** PM history.
- **Impact of section node:** **MINOR CHANGE.** The horizontal drop logic uses `$pos.before(1)` and `$pos.node(1)` to find the top-level block. With sections, depth 1 is the section, depth 2 is the block. This must change to depth 2. The architectural rule in plugin.ts line ~985 ("edge zones always operate on the TOP-LEVEL (depth 1) block") needs to become depth 2.

#### 1.6.2 Block Out of Column

- **Preconditions:** Block is inside a column. User drags it to a position outside the columnBlock.
- **The operation:** `executeMove` + `cleanupSourceColumn` in plugin.ts. The block is deleted from the column, inserted at the target position, and the source column is cleaned up (possibly unwrapping the columnBlock if only 1 column remains).
- **Postconditions:** Block is at section level. Source column is cleaned up.
- **Inverse:** PM history.
- **Impact of section node:** **CHANGED.** The target position for the extracted block is now inside a section rather than directly under doc. Position calculation for "drop between top-level blocks" must account for the section container. The `findGapsInNode` function (plugin.ts line ~341) walks `node.forEach` on the container -- if the container is doc, it finds top-level blocks; if the container is a section, it finds section-level blocks. This function needs to be section-aware: when the cursor is inside a section, gaps should be computed within that section, not at the doc level.

#### 1.6.3 Block Into/Out of List

- **Preconditions:** Block is a paragraph. User triggers list wrapping (Tab, slash command) or unwrapping (Shift+Tab, Backspace at empty list item).
- **The operation:** `wrapInList` / `liftListItem` from prosemirror-schema-list.
- **Postconditions:** Block is wrapped/unwrapped.
- **Inverse:** PM history.
- **Impact of section node:** **UNCHANGED.** List operations work within the block tree. The section wrapper above is transparent.

#### 1.6.4 Block Into/Out of Blockquote

- **Preconditions:** Block is a paragraph. User triggers blockquote wrapping/unwrapping.
- **The operation:** `wrapIn(blockquote)` / `lift`.
- **Postconditions:** Block wrapped/unwrapped.
- **Inverse:** PM history.
- **Impact of section node:** **UNCHANGED.** Same reasoning as lists.

---

### 1.7 TRANSFORM Operations

#### 1.7.1 Paragraph to Heading

- **Preconditions:** Cursor in a paragraph.
- **The operation:** `setNodeMarkup` with `heading` type and `level` attr.
- **Postconditions:** Node is now a heading.
- **Inverse:** PM history.
- **Impact of section node:** **UNCHANGED.** Node type transformation is position-based and parent-agnostic.

#### 1.7.2 Block to Column Layout

- **Preconditions:** Cursor in a top-level block within section.
- **The operation:** `setColumns(count)` command.
- **Postconditions:** Block wrapped in `columnBlock > column`.
- **Inverse:** `unsetColumns`.
- **Impact of section node:** **CHANGED.** See 1.1.5 -- depth assumption needs updating.

---

### 1.8 DRAG-AND-DROP Operations

#### 1.8.1 Block Drag Within Section

- **Preconditions:** Block is in section S. Drop target is in section S.
- **The operation:** Long press -> drag -> `executeMove()`.
- **Postconditions:** Block at new position within S.
- **Inverse:** PM history.
- **Impact of section node:** **MOSTLY UNCHANGED.** The core move logic (delete + insert) works the same. But:
  - `resolveDeepestDraggableBlock` needs updating. Currently, it considers depth 1 as "top-level block." With sections, depth 1 is the section and depth 2 is the block. The function must be updated to recognize `section` as a structural wrapper (add it to `STRUCTURAL_WRAPPERS`) or adjust the depth check.
  - `findGapsInNode` computes drop targets by walking the container's children. Currently, `containerPos: null` means doc-level. It needs a new path: when within a section, walk the section's children.
  - `findDropPosition` walks up from `$pos.depth` looking for `STRUCTURAL_WRAPPERS` or `d === 0` (doc). It needs to also recognize `section` as a valid gap-computation container.

#### 1.8.2 Block Drag Between Sections

- **Preconditions:** Block is in section S1. Drop target is in section S2.
- **The operation:** Same as `executeMove()` -- delete source, insert at target.
- **Postconditions:** Block in S2. S1 may auto-fill with empty paragraph.
- **Inverse:** PM history.
- **Impact of section node:** **NEW OPERATION, but mechanically identical to within-section move.** ProseMirror transactions don't care about parent boundaries. The position mapping handles cross-parent moves correctly.
  - **Key difference for UI:** The drop target computation must work across section boundaries. Currently, `findDropPosition` looks for gaps in a single container. It needs to support "I'm hovering between two sections" as a valid drop zone, which is a new gap type.

#### 1.8.3 Block Drag Across Page Boundary

- **Preconditions:** Paginated mode. Block is on page N. Drop target is on page M (M != N).
- **The operation:** Same transaction mechanics as any cross-section move.
- **Postconditions:** Block at new position. Page assignments updated by layout engine.
- **Inverse:** PM history.
- **Impact of section node:** **SIGNIFICANTLY EASIER.**
  - Today: The drag system must calculate page boundaries from DOM measurements, clip indicators to pages, check forbidden zones, and translate coordinates across page gaps. See the 15+ pagination-specific code paths cataloged in the Schema Architect's proposal.
  - New schema: The layout engine provides `blockPages: Map<string, number>` in its `LayoutResult`. The drag system asks "what section/block is at this position?" and "what page is it on?" Both are tree lookups or map lookups. No DOM coordinate math required.
  - **The ENTIRE `pagination.ts` module (140 lines) becomes obsolete.** The `clipIndicatorToCurrentPage`, `isPointInForbiddenZone`, and `getPaginationForbiddenZones` functions are replaced by `LayoutResult` lookups.

#### 1.8.4 Section Drag (NEW)

- **Preconditions:** User selects an entire section and drags it.
- **The operation:** Same as section reorder (1.3.3).
- **Postconditions:** Section at new position among siblings.
- **Inverse:** PM history.
- **Impact of section node:** **NEW FEATURE.** Not possible today. With `draggable: true` on the section node, ProseMirror provides native drag handles. But we need to decide: when the user long-presses on the section's drag handle (or section header), are they dragging the section or the block under the cursor? This requires a disambiguation mechanism -- likely a dedicated section drag handle in the UI, separate from the block indicator.

---

### 1.9 COLUMN Operations

#### 1.9.1 Add Column

- **The operation:** `addColumn()` command.
- **Impact of section node:** **UNCHANGED.** Internal to columnBlock.

#### 1.9.2 Remove Column

- **The operation:** `removeColumn(index)` command.
- **Impact of section node:** **UNCHANGED.** Internal to columnBlock.

#### 1.9.3 Resize Columns

- **The operation:** `setColumnWidths(widths)` command.
- **Impact of section node:** **UNCHANGED.** Attribute-only mutation.

#### 1.9.4 Extract from Column

- **The operation:** Drag block out. `cleanupSourceColumn()` handles empty column removal and columnBlock unwrap.
- **Impact of section node:** **CHANGED.** Target position for extracted block is inside a section. See 1.6.2.

#### 1.9.5 Drag into Column

- **The operation:** `executeHorizontalDrop()`. Wraps or inserts into columnBlock.
- **Impact of section node:** **CHANGED.** Depth assumptions need updating. See 1.6.1.

---

### 1.10 SECTION Operations

#### 1.10.1 Create Section

- See 1.1.6.

#### 1.10.2 Merge Sections

- See 1.5.2.

#### 1.10.3 Split Section

- See 1.4.2.

#### 1.10.4 Reorder Sections

- See 1.3.3.

---

## 2. THE DRAG-AND-DROP ANALYSIS

### 2.1 Current Pain Points (Quantified)

From reading `plugin.ts` (1417 lines), `pagination.ts` (140 lines), `dom-utils.ts` (60 lines), and `state.ts` (233 lines):

**Pagination-specific code paths in the current drag system:**

| Location | Lines | Purpose |
|----------|-------|---------|
| `clipIndicatorToCurrentPage` (4 call sites) | ~8 | Clip block rect to page content area |
| `isPointInForbiddenZone` (1 call site) | ~2 | Check mouse in gap/header/footer |
| `isNonContentArea` (6 call sites) | ~12 | Skip non-content DOM elements |
| `isPaginationEnabled` (6 call sites) | ~12 | Mode branching |
| `getPageNumberForElement` (3 call sites) | ~6 | Page number for gap computation |
| `pageNumber` in gap finding | ~8 | Page-aware gap calculation |
| `paginationEnabled` state tracking | ~6 | State field propagation |
| **Total pagination-specific** | **~54 lines** | |

Plus the entire `pagination.ts` module (140 lines) and the pagination helpers in `dom-utils.ts` (~35 lines).

**Grand total: ~230 lines of pagination-specific code** out of ~1850 total lines in the block-indicator system (~12.4%).

This doesn't sound catastrophic in line count, but the cognitive load is severe: every operation has a "but what if pagination?" branch. The Schema Architect is correct that this is the symptom of a missing abstraction.

### 2.2 How the Section Node Changes the Algorithm

**Current algorithm:**

```
1. Mouse moves over editor
2. posAtCoords -> resolved position
3. Walk up from depth to find the draggable block
4. Get block's DOM element -> getBoundingClientRect()
5. IF pagination: clip rect to current page's content area
6. IF pagination: check if mouse is in forbidden zone
7. IF pagination: compute page number for gap finding
8. Show indicator at computed rect
9. On drop: delete source + insert at target
10. IF pagination: adjust for page boundaries
```

**New algorithm (with sections + LayoutResult):**

```
1. Mouse moves over editor
2. posAtCoords -> resolved position
3. Walk up from depth to find the draggable block
   (skip section AND column as structural wrappers)
4. Get block's DOM element -> getBoundingClientRect()
5. Look up block's page from LayoutResult (no DOM clipping)
6. Show indicator at rect (no forbidden zone check)
7. On drop: delete source + insert at target
   (same mechanics, no page-specific adjustments)
```

Steps 5-7 and 10 in the old algorithm are replaced by a single `LayoutResult` lookup in the new algorithm. The forbidden zone concept disappears entirely because the layout engine defines page membership structurally, not geometrically.

### 2.3 Within-Section Drag

**Identical to today's within-doc drag**, with one depth offset. Block positions within a section are contiguous. `findGapsInNode` can be called with the section as the container. Drop indicators render at gap positions between the section's children.

No pagination concerns. No coordinate clipping. The layout engine already knows which page each block is on; the drag system only needs to decide WHERE to insert.

### 2.4 Between-Section Drag

**New operation category.** Two sub-cases:

1. **Dragging a block from section S1 into section S2:** The block is removed from S1 and inserted into S2. This is a standard ProseMirror cross-container move. Position mapping handles it.

2. **Dragging a block into the gap BETWEEN sections:** This means "insert into the adjacent section's start or end." The drag system needs to detect this gap -- when the mouse is between two sections' DOM rects, the drop target should be "first position in the next section" or "last position in the previous section."
   - **Alternative:** The gap between sections could mean "create a new section containing this block." This is a design decision, not a technical one. Both are implementable.

**Drop target computation for between-section gaps:**

```
findDropPosition must now handle THREE levels:
1. Within-column gaps (existing: cursor inside a column's children)
2. Within-section gaps (existing at depth change: cursor between a section's children)
3. Between-section gaps (NEW: cursor between section DOM rects)

Level 3 is new. The code currently has levels 1 and 2 (where level 2 is "doc level"
which becomes "section level"). We need to add the doc-level gap computation
for sections as a new container type.
```

### 2.5 Across-Page Drag

**With the section-based schema + LayoutResult, there is no "across page" drag as a special case.** Pages are a presentation concept. The drag system moves blocks between tree positions. The layout engine then re-computes which page each block is on.

The current code has this (plugin.ts lines 385-388):
```typescript
} else if (pageNumber !== lastPageNumber) {
  gapTop = blockTop
} else {
  gapTop = (lastBottom + blockTop) / 2
}
```

This page-boundary-aware gap computation disappears entirely. Gaps are computed from tree positions, not DOM coordinates.

### 2.6 Does LayoutResult Eliminate DOM-Based Pagination Checks?

**Yes, for the interaction layer. No, for the rendering layer.**

The rendering layer still needs to know where to draw page boundaries, headers, footers, and gaps. But that is CSS/DOM work, not interaction logic. The critical win is that the interaction layer (block indicator, drag-and-drop, selection) becomes completely presentation-agnostic.

The `LayoutResult` acts as a clean interface between the content model and the presentation:

```
Content Model  -->  LayoutResult  -->  Interaction Layer (reads LayoutResult)
                                  -->  Rendering Layer (reads LayoutResult)
```

Both layers consume the same data. Neither needs to reverse-engineer the other's state from DOM measurements.

---

## 3. PROSEMIRROR TRANSACTION ANALYSIS

### 3.1 Moving a Block from Section A to Section B

**Setup:**
```
doc
  section-A (pos: 0)
    paragraph-1 (pos: 2)     "Hello"       [nodeSize: 7]
    paragraph-2 (pos: 9)     "World"       [nodeSize: 7]  <-- MOVE THIS
  section-B (pos: 18)
    paragraph-3 (pos: 20)    "Foo"         [nodeSize: 5]
    paragraph-4 (pos: 25)    "Bar"         [nodeSize: 5]
                              ^ INSERT AFTER THIS (pos: 30)
```

Position math (approximate, assumes section has 2 bytes overhead for open/close tags):

**Transaction:**

```typescript
const { tr } = state

// Step 1: Delete paragraph-2 from section A
// Positions: 9 (start of paragraph-2) to 16 (end: 9 + 7)
tr.delete(9, 16)

// After step 1, positions shift:
// section-A: pos 0, now contains only paragraph-1
// section-B: pos 11 (was 18, shifted by -7)
// paragraph-3: pos 13 (was 20, shifted by -7)
// paragraph-4: pos 18 (was 25, shifted by -7)
// Insert target: pos 23 (was 30, shifted by -7)

// Step 2: Insert paragraph-2 into section-B after paragraph-4
// Use tr.mapping.map() to get adjusted position
const insertPos = tr.mapping.map(30) // -> 23
tr.insert(insertPos, dragSourceNode)

// Step 3: Set cursor
const $pos = tr.doc.resolve(insertPos + 1)
tr.setSelection(TextSelection.near($pos))
```

**Undo behavior:** PM history records two steps (delete + insert). Undo reverses both atomically, returning paragraph-2 to section-A.

**Key observation:** This is exactly the same pattern as today's block move, with positions shifted because of the section wrapper nodes. No new step types required.

### 3.2 Splitting a Section at a Block Boundary

**Setup:**
```
doc
  section-X (pos: 0)
    heading-1 (pos: 2)       "Intro"          [nodeSize: 9]
    paragraph-1 (pos: 11)    "First para"     [nodeSize: 12]
    --- SPLIT HERE ---
    paragraph-2 (pos: 23)    "Second para"    [nodeSize: 13]
    paragraph-3 (pos: 36)    "Third para"     [nodeSize: 12]
  section-Y (pos: 50)        ...
```

**Transaction:**

```typescript
const { tr, schema } = state

// We want to split section-X between paragraph-1 and paragraph-2.
// Result: section-X has heading-1 + paragraph-1, new section has paragraph-2 + paragraph-3.

// Step 1: Collect blocks to move (paragraph-2 and paragraph-3)
const sectionNode = state.doc.nodeAt(0) // section-X
const splitIndex = 2 // After the 2nd child (0-indexed: heading=0, para-1=1, split here, para-2=2)
const blocksToMove: PMNode[] = []
for (let i = splitIndex; i < sectionNode.childCount; i++) {
  blocksToMove.push(sectionNode.child(i))
}

// Step 2: Delete paragraphs 2 and 3 from section-X
// Position of paragraph-2: 23. End of paragraph-3: 48 (36 + 12)
tr.delete(23, 48)

// Step 3: Create new section with the moved blocks
const newSection = schema.nodes.section.create(
  { id: generateUUID(), level: sectionNode.attrs.level },
  blocksToMove
)

// Step 4: Insert new section after section-X
// After deletion, section-X ends at pos 23 (inner) + 1 (close tag) = 24
// section-X nodeSize is now 2 (open) + heading(9) + para-1(12) + 2 (close) - wait.
// Actually, need to use mapping:
const afterSectionX = tr.mapping.map(50) // was start of section-Y
// Actually simpler: position after section-X close tag
tr.insert(afterSectionX, newSection)
```

**Alternative approach using PM's `split` step:**

ProseMirror has a `ReplaceAroundStep` that can split a node. The higher-level `tr.split(pos, depth)` call does this:

```typescript
// Split the section at position 23 (start of paragraph-2), at depth 1 (section level)
tr.split(23, 1)
```

This single call creates a `ReplaceAroundStep` that:
1. Closes section-X after paragraph-1
2. Opens a new section before paragraph-2
3. Everything before the split stays in section-X
4. Everything after goes into the new section

**This is by far the cleaner approach.** One step. Undo is a single inverse step. The new section inherits the default section attributes, which we can then fix up:

```typescript
tr.split(23, 1)
// Set attributes on the new section
const newSectionPos = tr.mapping.map(23) // Start of new section
tr.setNodeMarkup(newSectionPos, undefined, {
  id: generateUUID(),
  level: originalLevel,
  numbering: originalNumbering,
  pageBreakBefore: false,
})
```

**Undo behavior:** Two steps (split + setNodeMarkup). Undo reverses both, joining the sections back.

### 3.3 Extracting a Block from a Column and Placing It in a Different Section

**Setup:**
```
doc
  section-A (pos: 0)
    columnBlock (pos: 2)
      column-1 (pos: 4)
        paragraph-1 (pos: 6)    "Left col"     [nodeSize: 10]
      column-2 (pos: 16)
        paragraph-2 (pos: 18)   "Right col"    [nodeSize: 11]  <-- EXTRACT THIS
        paragraph-3 (pos: 29)   "Also right"   [nodeSize: 12]
  section-B (pos: 45)
    paragraph-4 (pos: 47)       "Target"        [nodeSize: 8]
    --- INSERT HERE (pos: 55) ---
```

**Transaction:**

```typescript
const { tr, schema } = state

// Step 1: Delete paragraph-2 from column-2
tr.delete(18, 29) // paragraph-2 nodeSize = 11

// Step 2: Insert at target position (after paragraph-4 in section-B)
const targetPos = tr.mapping.map(55) // Adjust for deletion
tr.insert(targetPos, dragSourceNode) // paragraph-2

// Step 3: Clean up the source column
// After step 1, column-2 still has paragraph-3, so it's not empty. No cleanup needed.
// BUT if paragraph-2 was the ONLY block, column-2 would be empty.

// Step 3 (if column-2 is now empty): The normalize plugin will handle this:
// - Empty column gets deleted
// - If only 1 column remains, columnBlock unwraps
// This happens automatically in appendTransaction.

// Alternatively, do it in the same transaction (what cleanupSourceColumn does today):
// a. Check if column-2 is empty
// b. Count non-empty columns in columnBlock
// c. If only 1 non-empty: unwrap entire columnBlock
// d. If 2+ non-empty: delete empty column

// Step 4: Place cursor
const $pos = tr.doc.resolve(targetPos + 1)
tr.setSelection(TextSelection.near($pos))
```

**Important edge case:** If extracting the block causes the columnBlock to unwrap (only 1 column left), the entire tree structure of section-A changes. Positions shift dramatically. This is why `cleanupSourceColumn` uses `tr.mapping.map()` throughout -- it must handle arbitrary position shifts from earlier steps.

**Undo behavior:** PM history records the individual steps. Undo reverses them, re-creating the column structure. If the normalize plugin ran in `appendTransaction`, its changes are also recorded and reversed. This is why the current approach of doing cleanup in the main transaction (via `cleanupSourceColumn`) is preferable to relying on `appendTransaction` -- it keeps everything in one undo group.

---

## 4. WHAT GETS HARDER

### 4.1 Enter Key at End of Section

**Question:** When the cursor is at the end of the last paragraph in a section and the user presses Enter, what happens?

**With `defining: true` and `isolating: true`:**

- `defining: true` means the section "defines" the context. When ProseMirror's `splitBlock` runs, it creates a new paragraph INSIDE the same section. It does NOT split the section to create a new one.
- This is the **desired behavior** for normal typing. You don't want every Enter to create a new section.

**But what about creating new sections?** The user needs an explicit action:
- Keyboard shortcut (e.g., Cmd+Enter to split section)
- Context menu option
- Drag-and-drop (drag a block to the between-sections gap)

**Verdict:** Not harder -- it's correctly behaved. But the explicit section-creation UX must be designed.

### 4.2 Backspace at Start of Section

**Question:** Cursor is at the very start of the first block in section S2 (which follows section S1). User presses Backspace.

**With `isolating: true`:**

ProseMirror's `joinBackward` will NOT join across the isolating boundary. The cursor stays where it is. The user presses Backspace and nothing happens.

**This WILL confuse users** who expect Backspace to merge with the previous paragraph (which is in the previous section).

**Required mitigation:** A custom keymap handler:

```typescript
// Pseudocode for cross-section Backspace
function handleBackspaceAtSectionStart(state, dispatch) {
  const { $from } = state.selection
  // Check if cursor is at the very start of a section's first block
  if ($from.parentOffset === 0) {
    const sectionDepth = findSectionDepth($from)
    if (sectionDepth !== null && $from.index(sectionDepth) === 0) {
      // First block in section. Check for previous section.
      const sectionPos = $from.before(sectionDepth)
      if (sectionPos > 0) {
        // There's a previous section. Merge this block into it.
        // Option A: Join the sections (merge S2 into S1)
        // Option B: Move just this block to end of S1
        // Design choice needed.
      }
    }
  }
  return false // Let default handling proceed
}
```

**Verdict:** Harder. Requires custom keymap handling that doesn't exist today.

### 4.3 Cursor Navigation Across Section Boundaries

**Question:** User presses Down arrow at the last line of the last block in section S1. Where does the cursor go?

**With `isolating: true`:**

ProseMirror's default arrow key handling respects `isolating`. The cursor will NOT cross the section boundary via arrow keys. It will stop at the end of the section.

**This is almost certainly wrong.** Users expect arrow keys to flow through the entire document, not stop at invisible section boundaries.

**Required mitigation:** Override the arrow key handlers:

```typescript
// Allow arrow keys to cross section boundaries
// ProseMirror's default behavior with isolating: true blocks this.
// We need a custom keymap that, when the default fails (returns false),
// manually moves the cursor to the start of the next section.
```

**Verdict:** HARDER. This is the most significant UX regression. Arrow key navigation must work seamlessly. The custom keymap for this is non-trivial because it must handle:
- Down arrow at end of section -> first line of next section
- Up arrow at start of section -> last line of previous section
- Left arrow at start of section -> end of previous section's last block
- Right arrow at end of section -> start of next section's first block

**Alternative: Use `isolating: false`.** This fixes arrow keys and Backspace but weakens the section boundary for other operations (splitBlock might split the section). The trade-off needs careful evaluation.

**My strong recommendation:** Use `isolating: false` on the section node. Instead of relying on ProseMirror's isolation mechanism, implement section boundary enforcement through explicit commands and the normalize plugin. The UX cost of `isolating: true` is too high -- it breaks three fundamental keyboard operations (Backspace, arrows, and possibly Home/End).

### 4.4 Copy-Paste Across Sections

**Question:** User selects text spanning from section S1 into section S2 (e.g., the last paragraph of S1 and the first paragraph of S2). They copy and paste.

**With `isolating: true`:**

ProseMirror's selection model may not allow a selection to span across isolating boundaries. `TextSelection` is constrained to a single block. `NodeSelection` selects a single node. `AllSelection` selects everything. But a "range selection" that starts mid-paragraph in S1 and ends mid-paragraph in S2 is a `TextSelection` that spans a gap -- ProseMirror may refuse to create it or may clip it to the nearest isolating boundary.

**Testing required.** If ProseMirror clips the selection, users cannot select text across section boundaries, which is unacceptable.

**With `isolating: false`:**

Cross-section selections work normally. The selection spans the section boundary just like it currently spans any block boundary.

**Verdict:** Potentially MUCH harder with `isolating: true`. This reinforces my recommendation to use `isolating: false`.

### 4.5 Tab/Shift-Tab in Lists Near Section Boundaries

If a list spans the end of a section (last item in S1) and the user presses Tab, the list item should indent. This should work regardless of section boundaries since the list is entirely within one section.

But if a user tries to drag a list item from a list in S1 to a list in S2, that's a cross-section reparent that needs explicit handling.

**Verdict:** Unchanged within sections. Cross-section list operations are new and need design decisions.

---

## 5. CASCADE ANALYSIS

### 5.1 Moving a Block: Cross-Reference Impact

**Scenario:** Block B has a UUID `block-123`. A `crossRef` mark in section S3 targets `block-123`. Block B is moved from S1 to S2.

**Impact:** None on the cross-reference itself. The `crossRef` mark stores `targetId: 'block-123'`, which is a UUID. UUIDs do not change when blocks move. The `EdgeRegistry` (proposed in the Schema Architect's spec) re-indexes `nodePositions` on every document change, so the cross-reference resolves to the new position.

**Key dependency:** The `EdgeRegistry` must be rebuilt after every document change. The Schema Architect's performance analysis (Section 11.3) estimates ~5ms for 5000 blocks. This is acceptable.

### 5.2 Deleting a Section: Contained References

**Scenario:** Section S2 contains paragraph P with UUID `para-456`. A `crossRef` mark in S3 targets `para-456`. S2 is deleted.

**Impact:** The `crossRef` target no longer exists. The reference is broken.

**Required behavior (per INV-5):** The `EdgeRegistry` rebuild detects that `para-456` is no longer in the document. The cross-reference validation plugin marks the reference as broken (e.g., adds a decoration, or removes the mark).

**Undo behavior:** If the user undoes the section deletion, the cross-reference becomes valid again. The `EdgeRegistry` rebuild after undo finds the target. The broken reference decoration is removed.

**Cascade concern:** If the validation plugin REMOVES the broken `crossRef` mark (rather than decorating it), and the user then undoes the section deletion, the mark is gone and the undo does not restore it (because mark removal was a separate transaction in `appendTransaction`). This is a data loss scenario.

**Recommendation:** NEVER remove broken cross-references automatically. Decorate them visually (strikethrough, red text, "[broken ref]") but preserve the mark. Let the user decide to remove them.

### 5.3 Splitting a Section: Attribute Distribution

**Scenario:** Section S has `level: 2`, `numbering: 'decimal'`, `pageBreakBefore: true`. User splits S at a block boundary, creating S and S'.

**Question:** What attributes does S' get?

**Proposed rule:**
- `id`: New UUID (always)
- `level`: Same as S (the section level is a structural property that should persist)
- `numbering`: Same as S (inherits parent section's numbering scheme)
- `pageBreakBefore`: `false` (the continuation section should not force a page break; only the original had the explicit break)

**Edge case:** If S had `meta.bookmark: 'methodology'`, should S' also have it? No -- bookmarks must be unique. The bookmark stays with S.

**Edge case:** If S had `meta.breakHint: 'avoid'`, S' should NOT inherit it. Break avoidance applies to the original section's content integrity. The split explicitly breaks that integrity.

**Recommendation:** Define an explicit `splitSectionAttributes(original)` function that returns the attributes for the new section. Do not rely on implicit copying.

### 5.4 Section Style Cascade Impact

**Scenario:** Section S has `styleParams.fontFamily: 'Georgia'`. All blocks inside inherit this. Block B explicitly overrides with `styleParams.blockFontFamily: 'Inter'`. Block B is moved to section S2 which has `styleParams.fontFamily: 'Helvetica'`.

**After move:**
- Block B still has `blockFontFamily: 'Inter'` (explicit override persists).
- Block B renders in Inter (its own explicit style overrides the new section's cascade).
- Other blocks in S2 render in Helvetica.

**No cascade update needed on move.** The cascade is resolved at render time, not stored. Moving a block doesn't change its explicit style parameters. The new section's defaults apply only to properties the block doesn't explicitly set.

This is correct and simple. No transaction-level cascade update required.

---

## 6. SPECIFIC CONCERNS

### 6.1 CONCERN: `isolating: true` is the Wrong Default

**Reference:** Schema Architect's Section 10, line 1277: `isolating: true`.

This is my strongest objection. As detailed in Section 4, `isolating: true` breaks:

1. **Backspace at section start** (4.2): Does nothing instead of merging.
2. **Arrow key navigation** (4.3): Cursor trapped inside section.
3. **Cross-section text selection** (4.4): Possibly blocked.
4. **Home/End keys**: May not cross section boundaries.

Every single one of these requires custom keymap overrides to restore expected behavior. That is a lot of custom code to fight ProseMirror's isolation model.

**Counter-argument:** `isolating: true` prevents `splitBlock` from accidentally splitting the section on Enter. But this can be handled with a custom `handleEnter` that intercepts the one case we want to prevent, rather than using isolation to prevent everything and then un-preventing the things we want.

**Recommendation:** `isolating: false`, with a custom keymap that prevents section-splitting on Enter (the ONE behavior we want to suppress). This is far less code than overriding Backspace, arrow keys, Home/End, and selection to work across isolated boundaries.

### 6.2 CONCERN: `defining: true` Interaction with `splitBlock`

**Reference:** Schema Architect's Section 10, line 1279: `defining: true`.

`defining: true` means the section "defines" the context for its content. In ProseMirror, this affects how `splitBlock` and related commands behave. Specifically, when you split the LAST block in a `defining` node, ProseMirror does NOT create a new sibling of the defining node -- it creates a new child. This is the behavior we want.

But `defining: true` also affects `createParagraphNear` and `exitCode`. When the cursor is at the end of a code block inside a section, `exitCode` creates a new paragraph INSIDE the section (not after it). This is correct for our use case.

**Verdict:** `defining: true` is correct. No concerns here.

### 6.3 CONCERN: Depth Assumptions Throughout the Codebase

**Reference:** plugin.ts line 57: `if (d === 1)` (top-level block depth), line 63: `parent.type.name === 'doc'`, commands.ts line 95-101: `if (d === 1)`.

The current codebase hardcodes depth 1 as "top-level block" and depth 0 as "doc." With the section node, top-level blocks are at depth 2 and sections are at depth 1.

**Files requiring depth updates:**

| File | Location | Current Assumption | Required Change |
|------|----------|-------------------|-----------------|
| `plugin.ts` | `resolveDeepestDraggableBlock`, line 57 | `d === 1` is top-level block | Must recognize depth 2 as top-level block, or add `section` to `STRUCTURAL_WRAPPERS` |
| `plugin.ts` | line 63 | `parent.type.name === 'doc'` | Must also accept `parent.type.name === 'section'` |
| `plugin.ts` | line 443 | `d === 0` is doc for gap finding | Must handle `section` as container for gap finding |
| `plugin.ts` | line 997 | `$pos.before(1)` for edge zones | Must be `$pos.before(2)` or use a helper to find "nearest block-group parent" |
| `commands.ts` | line 95-101 | `d === 1` for top-level block | Must be `d === 2` or use a helper |
| `commands.ts` | lines 86-89 | Column nesting guard walks from `$from.depth` | Still works (walks up), but the guard now also encounters `section` nodes. Must not treat `section` as a column-nesting indicator. |

**Recommendation:** Instead of changing magic numbers from 1 to 2, create a helper function:

```typescript
function findBlockDepth($pos: ResolvedPos): number | null {
  for (let d = $pos.depth; d >= 1; d--) {
    const parent = $pos.node(d - 1)
    if (parent.type.name === 'section' || parent.type.name === 'doc') {
      return d
    }
  }
  return null
}
```

This is future-proof: if sections ever nest, or if another container type is added, the helper still works.

### 6.4 CONCERN: `section` in `STRUCTURAL_WRAPPERS`

**Reference:** plugin.ts line 27: `const STRUCTURAL_WRAPPERS = new Set(['column'])`.

Should `section` be added to `STRUCTURAL_WRAPPERS`? The answer depends on how we define "structural wrapper."

Currently, `STRUCTURAL_WRAPPERS` means "skip over this node, it's not the draggable entity." A `column` is skipped because you drag blocks inside columns, not the column itself.

A `section` is different:
- Sometimes you want to drag a block inside a section (skip the section).
- Sometimes you want to drag the section itself (don't skip it).

**Recommendation:** Add `section` to `STRUCTURAL_WRAPPERS` for BLOCK-level drag. Add a separate `SECTION_DRAG` mode that treats sections as draggable units. The mode is determined by what the user is dragging (block indicator = block drag, section handle = section drag).

### 6.5 CONCERN: `findGapsInNode` and Multi-Level Gap Detection

**Reference:** plugin.ts lines 341-423.

Currently, `findGapsInNode` takes a container node and computes gaps between its children. It handles two levels: doc-level gaps (between top-level blocks) and column-level gaps (between blocks in a column).

With sections, we need THREE levels:
1. Doc-level gaps (between sections) -- for section drag-and-drop
2. Section-level gaps (between blocks in a section) -- for block drag-and-drop
3. Column-level gaps (between blocks in a column) -- existing

The function needs to determine which level is relevant based on the cursor position. If the cursor is over a section's content, use section-level gaps. If the cursor is between sections (in the section boundary area), use doc-level gaps.

**Complication:** How does the user indicate "I want to drop between sections" vs. "I want to drop at the start/end of this section"? The answer is a spatial heuristic: if the mouse is within the section's padding area (near the top or bottom edge), it's a between-section drop. If it's deeper inside, it's a within-section drop.

### 6.6 CONCERN: Empty Section Auto-Fill vs. Auto-Delete

**Reference:** Schema Architect's grammar: `section := (block | container)+`. The `+` means at least one child.

When a block is moved out of a section, leaving it empty, ProseMirror auto-inserts a default block (paragraph) to satisfy the content expression. This creates a section with a single empty paragraph.

**Is this the right behavior?** Two schools of thought:

1. **Auto-fill (current proposal):** Empty section gets a paragraph. User can type in it or explicitly delete the section. Pro: Never loses the section structure. Con: Orphan empty sections accumulate.

2. **Auto-delete (alternative):** Empty section is automatically removed by a normalize plugin. Pro: Clean document. Con: If the user intended to keep the section (temporarily empty), it vanishes. Also, if it was the last section, the document would need a new empty section anyway (`doc` requires `section+`).

**Recommendation:** Auto-fill for now. Add a user-facing "Delete Section" action for explicit cleanup. Consider a normalize plugin that removes sections containing only a single empty paragraph IF there are other sections in the document.

### 6.7 CONCERN: The Transitional Grammar `(section | block)+`

**Reference:** Schema Architect's Section 10, line 1361-1367.

The proposal suggests a transitional doc content of `(section | block)+` during migration. This means the document can contain a mix of sections and bare blocks.

**Operational impact:** This DOUBLES the complexity of every operation. Every function that finds blocks must handle both "block at depth 1 under doc" and "block at depth 2 under section." The drag system, gap finding, depth resolution, and drop target computation all need two code paths.

**Strong recommendation:** Do NOT use the transitional grammar. Instead:

1. Migration runs on document load: wrap ALL bare blocks in a single section.
2. The grammar is `section+` from day one.
3. Old documents are migrated transparently on open.
4. No dual code paths. No "is this block in a section or at doc level?" checks.

The migration is O(n) and runs once. The ongoing complexity of dual code paths is far worse.

### 6.8 CONCERN: `selectable: true` on Section

**Reference:** Schema Architect's Section 10, line 1282: `selectable: true`.

Making sections selectable means ProseMirror will create a `NodeSelection` when a user clicks on the section node. But sections are large -- a NodeSelection on a section selects the entire section (all its blocks). This might conflict with:

1. The block indicator's click-to-select behavior.
2. Normal text cursor placement (clicking inside a section should place the text cursor, not select the entire section).

**ProseMirror behavior:** NodeSelection is only created when the user clicks on a node that has `selectable: true` AND the click hits the node's "chrome" (the area of the DOM that isn't content). For sections rendered as `<section>` elements, the "chrome" is typically the padding/margin area.

**Risk:** If the section has visible chrome (e.g., a section border or background), clicking on it creates a NodeSelection that selects the entire section. This is probably the wrong default behavior.

**Recommendation:** Set `selectable: false` on the section node. Section selection should be explicit (via the section drag handle, or Option+click in the block indicator). ProseMirror's NodeSelection is too coarse for sections.

---

## 7. SUMMARY: IMPACT MATRIX

| Operation | Impact | Effort | Notes |
|-----------|--------|--------|-------|
| Create paragraph (Enter) | Unchanged | None | `defining: true` prevents section split |
| Create heading | Unchanged | None | `setNodeMarkup` is position-based |
| Create list | Unchanged | None | `wrapInList` is parent-agnostic |
| Create image | Unchanged | None | Insert at position |
| Create columns | **Changed** | Small | Depth 1 -> depth 2 in `setColumns` |
| Create section | **New** | Medium | New command + UX |
| Delete block | Unchanged | None | Auto-fill handles empty section |
| Delete section | **New** | Small | `tr.delete` on section range |
| Delete column | Unchanged | None | Internal to columnBlock |
| Move within section | Unchanged | None | Same as current within-doc |
| Move between sections | **New** | Small | Standard PM cross-parent move |
| Section reorder | **New** | Medium | New UX (section drag handle) |
| Split paragraph | Unchanged | None | Standard `splitBlock` |
| Split section | **New** | Medium | `tr.split(pos, 1)` + attr setup |
| Merge paragraphs (same section) | Unchanged | None | Standard `join` |
| Merge paragraphs (cross section) | **Harder** | Medium | Blocked by `isolating` -- needs keymap |
| Merge sections | **New** | Small | `tr.join` at section boundary |
| Block into column | **Changed** | Small | Depth assumption update |
| Block out of column | **Changed** | Small | Target position in section |
| Block into/out of list | Unchanged | None | Parent-agnostic |
| Block into/out of blockquote | Unchanged | None | Parent-agnostic |
| Paragraph to heading | Unchanged | None | Position-based transform |
| Drag within section | **Changed** | Medium | `STRUCTURAL_WRAPPERS` + gap finding update |
| Drag between sections | **New** | Medium | Multi-level gap detection |
| Drag across pages | **Easier** | Significant (removal) | ~230 lines of pagination code removed |
| Section drag | **New** | Medium | New drag mode + UX |
| Column add/remove/resize | Unchanged | None | Internal to columnBlock |
| Column extract | **Changed** | Small | Section-aware target position |
| Drag into column | **Changed** | Small | Depth update for edge zones |
| Arrow keys | **Harder** | Medium | Must override if `isolating: true` |
| Copy-paste cross-section | **Harder** | Medium | Selection spanning if `isolating: true` |
| Backspace at section start | **Harder** | Medium | Custom keymap needed |

**Total new operations:** 6
**Total changed operations:** 8
**Total harder operations:** 3 (all caused by `isolating: true`)
**Total unchanged operations:** 15
**Total easier operations:** 1 (drag across pages -- but it removes ~230 lines)

---

## 8. KEY RECOMMENDATIONS

1. **Use `isolating: false` on the section node.** The operational cost of `isolating: true` is too high. Three fundamental keyboard operations break. Fix section-splitting behavior with a single custom keymap override for Enter, rather than fixing Backspace + arrows + selection with multiple overrides.

2. **Use `selectable: false` on the section node.** NodeSelection on a section is too coarse. Use explicit section selection via UI controls.

3. **Skip the transitional grammar.** Go directly to `section+` with migration on load. The dual code path complexity is not worth the incremental safety.

4. **Add `section` to `STRUCTURAL_WRAPPERS`.** For block-level drag, the section is transparent. Section-level drag is a separate mode.

5. **Create a `findBlockDepth` helper.** Replace all hardcoded `d === 1` checks with a parent-type-aware depth resolver. This is future-proof and prevents depth assumption bugs.

6. **Define explicit section split attribute rules.** Document which attributes inherit, which don't, and why. Implement as a pure function.

7. **Never auto-remove broken cross-references.** Decorate them visually. Let the user decide. Automatic removal causes data loss on undo.

8. **Design the between-section drop target UX.** The gap between sections needs a clear spatial heuristic and visual indicator. This is a new UX concept that doesn't exist today.

---

*This analysis was written against SERQ codebase commit `de5322a` on branch `main`, and the Schema Architect's Round 1 proposal dated 2026-02-06. All file references and line numbers are to the actual codebase.*
