# SERQ Content Schema -- Round 3 Synthesis

**Role:** Synthesis Architect
**Date:** 2026-02-06
**Status:** Round 3 -- AUTHORITATIVE SPECIFICATION (supersedes Round 1)
**Inputs:** Round 1 Schema Architect, Round 2 (VSM, Presentation Decoupler, Operations Engineer, Semantic Graph, Devil's Advocate)

---

## PART 1: DECISION LOG

---

### DECISION #1: `isolating: true` vs `false` on Section

**RESOLUTION:** `isolating: false`

**AGENTS FOR:** Operations Engineer (primary advocate), Devil's Advocate (strongest objection, ranked #1 killer), VSM (implicit -- section should not trap cursors)

**AGENTS AGAINST:** Schema Architect (chose `true` for structural boundary enforcement)

**RATIONALE:**

`isolating: true` breaks four fundamental keyboard operations:
1. Arrow key navigation across section boundaries (cursor trapped inside section)
2. Backspace at the start of a section's first block (does nothing)
3. Delete at the end of a section's last block (does nothing)
4. Cross-section text selection (Cmd+A, drag-select, Shift+Click all fail across boundaries)

The Operations Engineer quantified the impact: fixing `isolating: true` requires custom keymap overrides for Backspace, Delete, all four arrow keys, Home, End, and custom selection handling. That is ~8 custom keymap handlers to undo what one flag caused.

The alternative: `isolating: false` with ONE custom handler to prevent Enter from splitting sections. This is asymmetric in the right direction -- one handler to suppress the one behavior we do not want, vs. eight handlers to restore the eight behaviors we DO want.

The Devil's Advocate rated this as the #1 architecture killer: "If users can't navigate across sections AND can't delete section boundaries, sections become prisons, not paragraphs."

**TRADEOFFS:** With `isolating: false`, ProseMirror's `splitBlock` CAN split a section if the cursor is at a section boundary and Enter is pressed. We prevent this with a custom keymap that intercepts Enter at the section boundary. The `defining: true` flag already helps here -- it prevents `createParagraphNear` from escaping the section. The combination `isolating: false` + `defining: true` gives us the right behavior: cursor flows freely, but structural operations respect the section boundary.

**IMPLEMENTATION IMPACT:**
- Section extension: `isolating: false`, `defining: true`
- Add one keymap handler: intercept Enter at section boundary to prevent section split
- No Backspace/Delete/arrow overrides needed (they work naturally with `isolating: false`)
- Cross-section text selection works natively

---

### DECISION #2: `pageBreakBefore` and `breakHint` -- Content or Presentation?

**RESOLUTION:** Remove `pageBreakBefore` from SectionNode.attrs. Remove `breakHint` from NodeMeta. Move both to a PresentationConfig side-channel.

**AGENTS FOR:** Presentation Decoupler (primary advocate -- Trojan Horses #1 and #2), Devil's Advocate (Attack 5.1 -- "the field is literally named pageBreakBefore"), Operations Engineer (accepts break rules as external config)

**AGENTS AGAINST:** Schema Architect (argued these are "author intent"), Semantic Graph Specialist (did not address this)

**RATIONALE:**

The Presentation Decoupler's Five-Mode Proof is definitive. `pageBreakBefore` is meaningful in exactly ONE mode (paginated). In continuous mode, canvas mode, outline mode, and slide mode, it is dead weight that renderers must explicitly ignore. The Schema Architect's own Principle 1.2 states: "Layout is a function applied to the schema, not embedded in it." A field named `pageBreakBefore` is a layout directive.

The redundancy clinches it: the Schema Architect defined BOTH `section.attrs.pageBreakBefore` AND `meta.breakHint` for the same concept. Two systems for one concern, with no specified precedence, is a design defect.

The author's intent ("I want this section to start on a new page") is real and must be captured somewhere. That somewhere is a PresentationConfig stored alongside the document in the `.serq` file, keyed by node UUID. The content tree remains mode-agnostic. The presentation config contains the mode-specific instructions.

**TRADEOFFS:** Break rules are now in a separate data structure, not co-located with the content node. This adds indirection. The tradeoff is worth it because co-location violates the mode-agnosticism principle, and the indirection is a simple UUID lookup.

**IMPLEMENTATION IMPACT:**
- Remove `pageBreakBefore` from Section attrs
- Remove `breakHint` from NodeMeta interface
- Add `PresentationConfig` Zustand store with `pagination.sectionBreaks` and `pagination.nodeBreaks`
- Serialize PresentationConfig in the `.serq` file alongside the document tree
- Layout engine reads break rules from PresentationConfig, not from node attrs

---

### DECISION #3: Style Fields (fontSize, lineHeight, spacing) -- Content or Presentation?

**RESOLUTION:** Split StyleParams into two tiers. Keep `textAlign`, `fontFamily`, `color`, `fontWeight` in the content tree as author-intent advisory values. Move `fontSize`, `lineHeight`, `letterSpacing`, `spacingBefore`, `spacingAfter`, `borderStyle` to PresentationConfig. Eliminate the `block*` prefix duplicates entirely.

**AGENTS FOR:** Presentation Decoupler (field-by-field audit), VSM (Challenge #1 -- block* prefix duplication), Operations Engineer (cascade clarity)

**AGENTS AGAINST:** Schema Architect (kept all in StyleParams for simplicity)

**RATIONALE:**

The Presentation Decoupler's analysis divides styleParams into three categories:
1. **Content intent** (author chose this, survives mode changes): `textAlign`, `fontFamily`, `color`
2. **Ambiguous** (lean toward content intent with renderer override): `fontWeight`, `backgroundColor`
3. **Presentation** (mode-dependent, must vary per output): `fontSize`, `lineHeight`, `letterSpacing`, `spacingBefore`, `spacingAfter`, `borderStyle`

The Five-Mode Proof demonstrates that `fontSize: 12` is wrong for 4 of 5 modes. A caption that is 12px on screen should be 9pt in print and 24px on a slide. Absolute pixel values do not survive mode transitions.

The VSM analysis identified the `block*` prefix duplication as variety noise -- `fontFamily` and `blockFontFamily` are two channels for the same concept. This is resolved by eliminating the `block*` fields and using the base StyleParams fields exclusively.

**Pragmatic compromise:** For Phase 1, we keep a MINIMAL set of advisory style intents in the content tree. These are values the author explicitly set via the UI. They are "content intent" -- the author's preference, not a rendering command. The presentation layer may override them. The cascade root lives in DocNode.styleParams (not in an external store), ensuring document self-sufficiency per the VSM's Challenge #5.

**TRADEOFFS:** The boundary between "content intent" and "presentation" is inherently fuzzy. We chose a conservative content set and pushed everything arguable to the presentation side. This means some inline styling that users apply directly (like font size on a caption) lives in the PresentationConfig rather than on the node. The PresentationConfig uses node-UUID-keyed overrides for this.

**IMPLEMENTATION IMPACT:**
- Revised StyleParams interface (content-side only): `textAlign`, `fontFamily`, `fontWeight`, `color`, `backgroundColor`
- Remove `blockFontFamily`, `blockFontSize`, `blockFontWeight`, `blockColor` from ParagraphNode
- Add PresentationConfig.nodeStyleOverrides for mode-specific style properties
- DocNode.styleParams provides cascade root defaults (non-null)
- Cascade resolution utility function (single implementation, not per-component)

---

### DECISION #4: Column Width Ownership -- Parent or Child?

**RESOLUTION:** Column nodes own their width. ColumnBlock aggregates from children.

**AGENTS FOR:** VSM (Challenge #2 -- column is not viable without parent; Fragility Rating HIGH for column reorder and column move)

**AGENTS AGAINST:** Schema Architect (put width on parent, matching current implementation)

**RATIONALE:**

The VSM's fragility analysis is compelling. Under the Schema Architect's proposal, reordering columns within a ColumnBlock silently changes their widths (because widths are index-coupled to the parent's `columnWidths` array). Moving a column to a different ColumnBlock loses its width entirely. Both are HIGH-fragility perturbations.

VSM Principle 3 (No Dependent Identity): "A node's identity must never depend on its parent." A column's width is a rendering-critical property. Making it parent-dependent means the column cannot describe itself without traversing upward.

By placing `width: number` (fraction 0-1) on each ColumnNode, the column becomes a portable unit. The parent's `columnWidths` array becomes a DERIVED value (computed from children). The normalize plugin validates that widths sum to ~1.0 and adjusts if needed. Reordering columns preserves their widths because widths travel with the node.

**TRADEOFFS:** This inverts the current implementation. The normalize plugin must now compute `columnWidths` from children rather than distributing `columnWidths` to children. This is a moderate refactor of the existing normalize logic. It also means the column drag/resize system writes to child attrs rather than parent attrs.

**IMPLEMENTATION IMPACT:**
- Add `width: number` (0-1 fraction) to ColumnNode.attrs
- Remove `columnWidths` from ColumnBlockNode.attrs (derived from children)
- Update normalize plugin to validate children widths sum to ~1.0
- Update column resize handlers to write to child.attrs.width
- Update drag-column-reorder to NOT update widths (they travel with the node)

---

### DECISION #5: EdgeRegistry -- Monolith vs Split

**RESOLUTION:** Keep as a single conceptual unit, but implement with incremental updates instead of full rebuilds. Do NOT split into 4 independent plugins.

**AGENTS FOR (split):** VSM (Challenge #3 -- single point of failure)

**AGENTS AGAINST (keep unified):** Devil's Advocate (Attack 2.2/2.4 -- performance is the real issue, not structure), Operations Engineer (favors simplicity)

**RATIONALE:**

The VSM's concern about a single point of failure is theoretically valid but practically misaligned. ProseMirror plugins are tightly coupled to the transaction lifecycle. Splitting the EdgeRegistry into 4 independent plugins means 4 plugins each walking the document tree on every transaction. The overhead of 4 separate walks exceeds the overhead of 1 walk that populates 4 data structures.

The REAL problem -- identified by the Devil's Advocate (Attack 2.2/2.4) -- is the full rebuild on every transaction. The fix is incremental updates, not structural splitting:

1. On text-only edits: map existing positions through `Transaction.mapping`. Do NOT rebuild.
2. On structural changes (section add/remove/reorder, node insert/delete): rebuild affected sections only.
3. On bookmark/crossRef changes: update only the affected entries.

This gives us the performance the Devil's Advocate demands while keeping the implementation simple.

**TRADEOFFS:** A single EdgeRegistry plugin is a single point of failure. If it throws, all derived data is stale. We mitigate this with a try/catch wrapper and stale-data indicators rather than splitting into independent plugins.

**IMPLEMENTATION IMPACT:**
- EdgeRegistry implemented as one ProseMirror plugin with incremental update logic
- Transaction analysis: classify each transaction as "text-only" or "structural"
- Text-only: position mapping via `Transaction.mapping`
- Structural: targeted rebuild (affected sections only)
- Debounce for expensive rebuilds (cross-reference resolution) -- 100ms idle callback

---

### DECISION #6: `selectable: true` vs `false` on Section

**RESOLUTION:** `selectable: false`

**AGENTS FOR (false):** Operations Engineer (recommends false -- NodeSelection on section is too coarse)

**AGENTS AGAINST (true):** Schema Architect (set true for section-level operations)

**RATIONALE:**

The Operations Engineer's analysis is correct. ProseMirror's NodeSelection is triggered by clicking on a node's "chrome" (padding/margin area). For a section rendered as `<section>` with padding, clicking near the edge would select the ENTIRE section (all its blocks). This conflicts with the expected behavior of placing a text cursor.

Section selection should be an explicit action (dedicated UI control, not an accidental click). Setting `selectable: false` prevents accidental whole-section selection while still allowing programmatic NodeSelection when explicitly triggered by section management UI.

**TRADEOFFS:** Users cannot click-to-select a section. They must use the section management UI (e.g., section handle in outline view, or explicit "Select Section" command). This is a net UX improvement -- accidental section selection would be far more confusing than the inability to accidentally select one.

**IMPLEMENTATION IMPACT:**
- Section extension: `selectable: false`
- Section-level selection available programmatically via `NodeSelection.create(doc, sectionPos)`
- Section drag via dedicated drag handle (not ProseMirror's native drag-from-selection)

---

### DECISION #7: Transitional Grammar vs Clean Cut

**RESOLUTION:** Clean cut. `doc` content is `section+` from day one. No transitional `(section | block)+` grammar.

**AGENTS FOR (clean cut):** Operations Engineer (strongest advocate -- "Do NOT use the transitional grammar"), Devil's Advocate (Attack 6.2 -- "doubles the state space and code paths")

**AGENTS AGAINST (transitional):** Schema Architect (proposed it for safety)

**RATIONALE:**

The Operations Engineer's argument is decisive: the transitional grammar `(section | block)+` means EVERY function that operates on blocks must handle two cases -- "block at depth 1 under doc" and "block at depth 2 under section." This doubles the code paths for drag-and-drop, gap finding, depth resolution, and drop target computation. The Devil's Advocate quantifies this as a "combinatorial explosion of states."

Migration on load is O(n), runs once, and is synchronous. The ongoing complexity of dual code paths is permanent. The math is clear: one-time cost vs. permanent cost. Take the one-time cost.

**TRADEOFFS:** If migration fails, the document cannot be opened (the schema rejects bare blocks under doc). Decision #8 addresses this with atomic migration and error handling.

**IMPLEMENTATION IMPACT:**
- Doc content expression: `section+` (no transitional period)
- Migration runs synchronously on `setContent()` before editor initialization
- Migration is atomic: build new tree in memory, validate, then replace
- Failure fallback: wrap ALL blocks in one section (never fails for valid ProseMirror docs)

---

### DECISION #8: Migration Strategy -- Single Section vs Smart Splitting

**RESOLUTION:** Smart heading-based splitting with single-section fallback.

**AGENTS FOR (smart split):** Devil's Advocate (Attack 6.1 -- "strategically disastrous" to wrap in one section, ranked #2 killer)

**AGENTS AGAINST:** Schema Architect (proposed single-section wrap for simplicity)

**RATIONALE:**

The Devil's Advocate's attack is the most compelling argument in the entire boardroom discussion. The section architecture's value is contingent on documents having meaningful sections. Wrapping everything in one section produces the degenerate case where sections provide zero structural benefit. The user's first experience with the new architecture would be "same as before, but with an extra wrapper." This undermines the entire project.

Smart migration splits at H1/H2 headings, which are natural section boundaries in most documents. For documents without headings, the single-section fallback is acceptable (the user was not using structural hierarchy anyway).

**TRADEOFFS:** Smart migration can produce unexpected results (sections the user did not explicitly create). A very long document with 50 H2 headings becomes 50 sections. The user may not have intended this granularity. We mitigate this by making the migration non-destructive -- sections can be merged afterward -- and by showing a brief notification on first open.

**IMPLEMENTATION IMPACT:**
- Migration function: scan top-level blocks for headings at level 1 or 2
- Split at each H1/H2 boundary: blocks before first heading become one section, each H1/H2 starts a new section
- If no headings found: wrap all blocks in one section (fallback)
- Atomic execution: build complete new tree, validate, replace
- Try/catch with single-section fallback if migration encounters unknown node types
- First-open notification: "Your document has been organized into N sections based on headings."

---

### DECISION #9: `gutter` as Pixels in Content Tree

**RESOLUTION:** Remove `gutter` from ColumnBlockNode.attrs. Move to PresentationConfig. Keep `columns` (count) and child `width` (fraction) in the content tree.

**AGENTS FOR (remove):** Presentation Decoupler (Trojan Horse #4 -- "24px is a screen-specific unit")

**AGENTS AGAINST:** Schema Architect (included for completeness)

**RATIONALE:**

The Presentation Decoupler's argument is straightforward: 24px of gutter is meaningful on a 1x screen but meaningless on a printed page (where the unit is points or millimeters) or a slide (where the gutter should scale with slide dimensions). Absolute pixel values are screen-specific and violate mode-agnosticism.

The structural aspects of a columnBlock -- how many columns and what fractional widths -- ARE content intent. The spacing between them is presentation.

**Pragmatic middle ground:** The PresentationConfig provides a default gutter value that applies to all columnBlocks. Per-columnBlock overrides are available via UUID-keyed entries. This covers the 99% case (all columns use the same gutter) and the 1% case (one specific columnBlock needs different spacing).

**TRADEOFFS:** Column gutter is no longer self-contained in the node. A columnBlock extracted from one document and placed in another will inherit the target document's gutter. This is the correct behavior -- gutter should match the target document's style, not carry over from the source.

**IMPLEMENTATION IMPACT:**
- Remove `gutter` from ColumnBlockNode.attrs
- Add `PresentationConfig.columnDefaults.gutter` (default gutter for all columnBlocks)
- Add `PresentationConfig.columnOverrides` (per-UUID overrides)
- Column rendering reads gutter from PresentationConfig, not from node attrs

---

### DECISION #10: Image `width`/`height` -- Content or Presentation?

**RESOLUTION:** Keep `width` and `height` on ImageNode as content attrs representing the author's intended display dimensions. Do NOT rename to `intrinsicWidth`/`intrinsicHeight`. Document that these are advisory and the renderer may override.

**AGENTS FOR (keep as-is):** Schema Architect (included them), Devil's Advocate (Attack 7.3 -- accepted current behavior as standard, "Word does the same thing")

**AGENTS AGAINST (split/remove):** Presentation Decoupler (Trojan Horse #5 -- should separate intrinsic from display)

**RATIONALE:**

The Presentation Decoupler's theoretical analysis is correct -- intrinsic dimensions and display dimensions are different concepts. But the pragmatic reality is:

1. TipTap's native image extension stores `width` and `height` as attrs. Changing this requires forking the extension.
2. Every ProseMirror-based editor in production stores image dimensions as node attrs. This is the established pattern.
3. The author explicitly resizes an image to 400px wide. That IS their content intent. The renderer caps it at container width, which is standard behavior across all editors and browsers.
4. Splitting into `intrinsicWidth`/`intrinsicHeight` + a PresentationConfig entry per image adds significant complexity for minimal gain.

The pragmatic choice: document that `width`/`height` are the author's preferred display dimensions (advisory), not intrinsic dimensions. The renderer scales to fit the container. Add an optional `aspectRatio` attr for responsive rendering.

**TRADEOFFS:** Image dimensions that exceed the container width are silently capped. The stored value does not match the displayed size. This is standard behavior across all document editors and is well understood by users.

**IMPLEMENTATION IMPACT:**
- Keep `width` and `height` on ImageNode.attrs (no change from Round 1)
- Add documentation: these are author's preferred display dimensions, not intrinsic
- Renderer: `max-width: 100%` ensures images never overflow their container
- No PresentationConfig entry needed for images

---

### DECISION #11: `displayFormat` on CrossRef Mark

**RESOLUTION:** Keep `displayFormat` on the crossRef mark but redefine its semantics. It is the author's PREFERRED display format, not a command. Add optional `relationship` attr per the Semantic Graph Specialist's recommendation.

**AGENTS FOR (remove displayFormat):** Presentation Decoupler (mode-dependent rendering)

**AGENTS FOR (add relationship):** Semantic Graph Specialist (Section 6.2, recommendation #3)

**AGENTS FOR (keep displayFormat):** Schema Architect (included it), Operations Engineer (did not object)

**RATIONALE:**

The Presentation Decoupler is correct that `displayFormat: 'page'` is meaningless in continuous mode. But removing `displayFormat` entirely loses the author's intent ("I want this to show as a number, not a title"). The renderer should respect the author's preference when the mode supports it, and fall back to a sensible default when it does not.

Redefine: `displayFormat` is the author's preferred rendering. The renderer uses it when the mode supports it:
- `'number'` in paginated mode: renders as "Section 3"
- `'number'` in slide mode: renders as "Slide 3"
- `'page'` in paginated mode: renders as "page 42"
- `'page'` in continuous mode: falls back to `'number'` or `'title'` (no pages available)

The Semantic Graph Specialist's `relationship` attr is a zero-cost hook with high future value. Adding `relationship?: string | null` (default null) to the crossRef mark costs nothing and enables typed references when the semantic layer arrives.

**TRADEOFFS:** `displayFormat` is somewhat mode-dependent, but treating it as "author preference with mode-aware fallback" is pragmatically sound. The renderer needs a fallback table, which adds minor complexity.

**IMPLEMENTATION IMPACT:**
- Keep `displayFormat` on crossRef mark (unchanged from Round 1)
- Add `relationship?: string | null` to crossRef mark attrs (default null, not rendered in Phase 1)
- Document displayFormat as advisory with mode-specific fallback rules
- Remove `pageNumber` from EdgeRegistry.crossRefTargets (moved to LayoutResult per Presentation Decoupler's Objection 7)

---

### DECISION #12: Semantic Hooks for Phase 1

**RESOLUTION:** Accept 4 of the Semantic Graph Specialist's 6 recommendations. Defer 2.

**AGENTS FOR:** Semantic Graph Specialist (all 6)

**All other agents:** Did not address semantic hooks (outside their scope)

**RATIONALE:**

The Semantic Graph Specialist proposed 6 trivial additions. Evaluation:

1. **Add `relationship` attr to crossRef mark** -- ACCEPTED (see Decision #11). Zero cost, high future value.

2. **Document `meta.semanticRole`, `meta.ideaRefs`, `meta.confidence` in TS types** -- ACCEPTED. These are TypeScript-only type declarations (not ProseMirror attrs). They establish naming conventions that prevent future conflicts. Cost: literally adding optional fields to an interface.

3. **Document `meta.summary` convention for sections** -- ACCEPTED. Same reasoning. The `[key: string]: unknown` extensibility already supports this. Documenting the convention costs nothing.

4. **Clarify `comment` mark vs `commentThreadIds` distinction** -- ACCEPTED. This is documentation, not code. The distinction should be clear in the spec.

5. **Document `ai_` prefix convention for AI-assigned metadata** -- DEFERRED. This is premature. No AI features exist or are planned for the immediate phases. Establishing naming conventions for non-existent features risks constraining future design. When AI features are scoped, the convention can be established then.

6. **Document future evolution of `tags` from `string[]` to `SemanticTag[]`** -- DEFERRED. Same reasoning. String tags are sufficient for Phase 1 and potentially for the entire 2026 roadmap. Documenting a speculative upgrade path adds noise to the spec.

**TRADEOFFS:** Deferring items 5 and 6 means these conventions may not be established when AI features arrive. This is acceptable because establishing them takes minutes and can be done at the time of need.

**IMPLEMENTATION IMPACT:**
- Add `relationship?: string | null` to crossRef mark attrs
- Add `semanticRole?: string`, `ideaRefs?: string[]`, `confidence?: number` to NodeMeta TypeScript interface (optional, not as ProseMirror attrs)
- Document `meta.summary` convention for sections
- Document `comment` mark vs `commentThreadIds` in the spec

---

### DECISION #13: Section-Level Column Attrs

**RESOLUTION:** Remove `columns`, `columnWidths`, `columnGutter` from SectionNode.attrs entirely.

**AGENTS FOR (remove):** Presentation Decoupler (Trojan Horse #3 -- CSS multi-column is a style concern)

**AGENTS AGAINST:** Schema Architect (included them, deferred to Phase 3+)

**RATIONALE:**

The Schema Architect included these "for completeness" but explicitly deferred them to Phase 3+. Including deferred features in the type definition creates maintenance burden (every deserializer must handle them) without benefit. The Presentation Decoupler correctly identifies section-level columns as a FLOW directive (like CSS `column-count`), distinct from ColumnBlock which is a STRUCTURAL container.

If section-level columns are needed in Phase 3+, they belong in PresentationConfig as a section style, not in the content tree.

**TRADEOFFS:** If section-level columns ARE later determined to be content intent (e.g., the author explicitly wants a newspaper-style layout for a specific section), adding them to SectionNode.attrs is a non-breaking additive change.

**IMPLEMENTATION IMPACT:**
- Remove `columns`, `columnWidths`, `columnGutter` from SectionNode interface and extension
- Section content expression remains `(block | container)+` -- single-column flow only
- ColumnBlock remains the only column mechanism in Phase 1

---

### DECISION #14: ColumnBlock Group Assignment

**RESOLUTION:** Remove `columnBlock` from the `'block'` group. It belongs in `'container'` only.

**AGENTS FOR:** Devil's Advocate (Attack 4.1 -- three representations contradict each other)

**AGENTS AGAINST:** Schema Architect (proposed dual group `'block container'` for compatibility)

**RATIONALE:**

The Devil's Advocate identified a coherence problem: the grammar, the TypeScript types, and the ProseMirror groups say three different things about columnBlock's identity. The grammar puts it in `container`. The TypeScript union puts it in `ContainerNode`. The PM schema puts it in `'block container'`. One truth per concept.

ColumnBlock is a container. It holds columns, which hold blocks. It is not itself a block. The current codebase has `group: 'block'` because the old `doc` content was `block+` and columnBlock needed to be a valid doc child. With sections (`(block | container)+`), this hack is no longer necessary.

**TRADEOFFS:** This is a breaking change to the current ProseMirror schema. The column extension's group must change from `'block'` to `'container'`. All other container nodes (blockquote, bulletList, orderedList, callout) should also be in `'container'` group. The section's content expression `(block | container)+` matches both.

**IMPLEMENTATION IMPACT:**
- ColumnBlock: `group: 'container'`
- Blockquote, BulletList, OrderedList, Callout: `group: 'container'`
- Section content expression: `(block | container)+`
- Column content expression: `(block | container)+` (allows containers inside columns, except columnBlock which is prevented by normalize plugin)

---

### DECISION #15: Cascade Root -- DocNode vs External Store

**RESOLUTION:** DocNode.styleParams provides the cascade root with sensible non-null defaults. The styleStore provides application-level fallbacks only when DocNode values are null.

**AGENTS FOR:** VSM (Challenge #5 -- cascade root must be in the document for self-sufficiency)

**AGENTS AGAINST:** Schema Architect (cascade root was implicitly the styleStore)

**RATIONALE:**

The VSM's argument is correct: a document opened in a different application (or the same application with different styleStore state) should render predictably. If the cascade root is external to the document, the document is not self-sufficient. This violates the VSM's self-sufficiency criterion for documents.

The fix: DocNode.styleParams always has non-null defaults for all cascadable properties. These are the "constitutional" styles of the document -- set on document creation, editable by the user. The styleStore provides a final fallback for any property the DocNode still has null (defensive), but in practice, DocNode should always have complete defaults.

**TRADEOFFS:** DocNode now carries style defaults that were previously implicit in the application. This adds ~10 attrs to the doc node. Negligible storage cost.

**IMPLEMENTATION IMPACT:**
- DocNode.styleParams: provide non-null defaults for `fontFamily`, `fontWeight`, `color`, `textAlign`, `backgroundColor`
- Cascade resolution: block.style -> section.style -> doc.style -> styleStore (final fallback)
- New documents created with DocNode defaults populated from styleStore's current settings
- Existing documents migrated with DocNode defaults populated from current styleStore

---

## PART 2: REVISED SCHEMA

---

### 2.1 Base Node Interface

```typescript
/**
 * SerqNodeBase -- the recursive viable unit.
 * [REVISED] styleParams reduced to content-intent fields only.
 * [REVISED] meta.breakHint removed (moved to PresentationConfig).
 */
interface SerqNodeBase {
  id: string
  type: string
  content: SerqNode[]
  marks: SerqMark[]
  attrs: Record<string, unknown>
  styleParams: StyleParams
  meta: NodeMeta
}
```

### 2.2 StyleParams [REVISED]

```typescript
/**
 * Style parameters that travel with content as AUTHOR INTENT.
 * These are advisory -- the presentation layer may override them.
 *
 * [REVISED] Removed presentation-only fields:
 *   - fontSize, lineHeight, letterSpacing (mode-dependent)
 *   - spacingBefore, spacingAfter (layout-dependent)
 *   - borderStyle (visual chrome)
 * [REVISED] Removed block* prefix duplicates:
 *   - blockFontFamily, blockFontSize, blockFontWeight, blockColor
 *
 * Remaining fields are content intent: the author explicitly chose
 * these values via the UI. They survive mode transitions.
 */
interface StyleParams {
  textAlign?: 'left' | 'center' | 'right' | 'justify' | null
  fontFamily?: string | null
  fontWeight?: number | null        // 100-900
  color?: string | null
  backgroundColor?: string | null   // for callouts, highlights

  /** Extensible for future content-intent fields */
  [key: string]: unknown
}
```

### 2.3 NodeMeta [REVISED]

```typescript
/**
 * Non-rendered metadata attached to nodes.
 *
 * [REVISED] Removed breakHint (moved to PresentationConfig).
 * [REVISED] Added semantic hook fields (TS-only, not PM attrs).
 */
interface NodeMeta {
  createdAt?: string
  modifiedAt?: string
  tags?: string[]
  bookmark?: string
  commentThreadIds?: string[]

  // --- Semantic hooks (Phase 1: declare only, do not populate) ---

  /** IDs of Ideas that reference this node (future semantic layer) */
  semanticRole?: string
  /** Node's role in its semantic context: 'thesis', 'evidence', etc. */
  ideaRefs?: string[]
  /** AI confidence score for semantic classification (0.0-1.0) */
  confidence?: number
  /** Section summary for outline views and AI summarization */
  summary?: string

  /** Extensible */
  [key: string]: unknown
}
```

### 2.4 Mark Definitions [REVISED]

```typescript
interface SerqMark {
  type: SerqMarkType
  attrs: Record<string, unknown>
}

type SerqMarkType =
  | 'bold' | 'italic' | 'underline' | 'strike'
  | 'code' | 'subscript' | 'superscript'
  | 'link'
  | 'textStyle'
  | 'highlight'
  | 'comment'
  | 'suggestion'
  | 'crossRef'

/**
 * [REVISED] CrossRef mark with relationship hook and
 * advisory displayFormat.
 */
interface CrossRefMark {
  type: 'crossRef'
  attrs: {
    targetId: string
    targetType: 'section' | 'heading' | 'image' | 'table' | 'footnote'
    /** Author's preferred display format. Advisory -- renderer may
     *  fall back to a different format based on active mode. */
    displayFormat: 'number' | 'title' | 'page' | 'full'
    /** [REVISED] Semantic relationship type. Null = navigational only.
     *  Future: typed connections use this field. */
    relationship?: string | null
  }
}
```

### 2.5 DocNode [REVISED]

```typescript
interface DocNode extends SerqNodeBase {
  type: 'doc'
  content: SectionNode[]
  attrs: {
    lang?: string
    dir?: 'ltr' | 'rtl' | 'auto'
  }
  /**
   * [REVISED] DocNode.styleParams provides the CASCADE ROOT.
   * All fields should have non-null defaults for document self-sufficiency.
   */
  styleParams: StyleParams & {
    fontFamily: string           // e.g., 'Inter' (non-null cascade root)
    fontWeight: number           // e.g., 400
    color: string                // e.g., '#1a1a1a'
    textAlign: 'left' | 'center' | 'right' | 'justify'  // e.g., 'left'
    backgroundColor: string      // e.g., '#ffffff'
  }
  meta: NodeMeta & {
    title?: string
    author?: string
    summary?: string
  }
}
```

### 2.6 SectionNode [REVISED]

```typescript
/**
 * [REVISED] Section node. Key changes from Round 1:
 * - Removed pageBreakBefore (moved to PresentationConfig)
 * - Removed columns, columnWidths, columnGutter (presentation concern)
 * - Sections are flat (no nesting) -- this is a Phase 1 constraint
 */
interface SectionNode extends SerqNodeBase {
  type: 'section'
  content: (BlockNode | ContainerNode)[]
  attrs: {
    level?: 1 | 2 | 3 | 4 | 5 | 6 | null
    numbering?: 'none' | 'decimal' | 'alpha' | 'roman' | null
  }
}
```

### 2.7 Container Nodes [REVISED]

```typescript
/**
 * [REVISED] ColumnBlockNode: gutter removed. columnWidths removed
 * (derived from children).
 */
interface ColumnBlockNode extends SerqNodeBase {
  type: 'columnBlock'
  content: ColumnNode[]
  attrs: {
    columns: number   // 2-4
  }
}

/**
 * [REVISED] ColumnNode: width added as owned property.
 */
interface ColumnNode extends SerqNodeBase {
  type: 'column'
  content: (BlockNode | ContainerNode)[]
  attrs: {
    width: number     // fraction 0-1 (e.g., 0.5 = 50%)
  }
}

// Blockquote, BulletList, OrderedList, ListItem, Callout -- UNCHANGED from Round 1
interface BlockquoteNode extends SerqNodeBase {
  type: 'blockquote'
  content: (BlockNode | ContainerNode)[]
  attrs: {}
}

interface BulletListNode extends SerqNodeBase {
  type: 'bulletList'
  content: ListItemNode[]
  attrs: {}
}

interface OrderedListNode extends SerqNodeBase {
  type: 'orderedList'
  content: ListItemNode[]
  attrs: { start: number }
}

interface ListItemNode extends SerqNodeBase {
  type: 'listItem'
  content: (BlockNode | BulletListNode | OrderedListNode)[]
  attrs: {}
}

interface CalloutNode extends SerqNodeBase {
  type: 'callout'
  content: BlockNode[]
  attrs: { variant: 'info' | 'warning' | 'error' | 'success' | 'note' }
}
```

### 2.8 Block Nodes [REVISED]

```typescript
/**
 * [REVISED] ParagraphNode: removed block* prefix fields.
 * StyleParams are the base interface only.
 */
interface ParagraphNode extends SerqNodeBase {
  type: 'paragraph'
  content: InlineNode[]
  attrs: {}
  styleParams: StyleParams  // base interface, no extensions
}

interface HeadingNode extends SerqNodeBase {
  type: 'heading'
  content: InlineNode[]
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 }
  styleParams: StyleParams
}

interface CodeBlockNode extends SerqNodeBase {
  type: 'codeBlock'
  content: TextRunNode[]
  attrs: { language?: string | null }
}

/**
 * [REVISED] ImageNode: width/height documented as author's preferred
 * display dimensions (advisory). Unchanged structurally.
 */
interface ImageNode extends SerqNodeBase {
  type: 'image'
  content: []
  attrs: {
    src: string
    alt?: string
    title?: string
    /** Author's preferred display width in px. Advisory -- renderer
     *  caps at container width. */
    width?: number | null
    /** Author's preferred display height in px. Advisory. */
    height?: number | null
  }
}

interface HorizontalRuleNode extends SerqNodeBase {
  type: 'horizontalRule'
  content: []
  attrs: {}
}
```

### 2.9 Inline Nodes -- UNCHANGED from Round 1

```typescript
interface TextRunNode extends SerqNodeBase {
  type: 'text'
  content: []
  attrs: { text: string }
  marks: SerqMark[]
}

interface MentionNode extends SerqNodeBase {
  type: 'mention'
  content: []
  attrs: { id: string; label: string }
}

type InlineNode = TextRunNode | MentionNode
```

### 2.10 Union Types [REVISED]

```typescript
type SerqNode =
  | DocNode
  | SectionNode
  | ColumnBlockNode
  | ColumnNode
  | BlockquoteNode
  | BulletListNode
  | OrderedListNode
  | ListItemNode
  | CalloutNode
  | ParagraphNode
  | HeadingNode
  | CodeBlockNode
  | ImageNode
  | HorizontalRuleNode
  | TextRunNode
  | MentionNode

type BlockNode =
  | ParagraphNode
  | HeadingNode
  | CodeBlockNode
  | ImageNode
  | HorizontalRuleNode

/**
 * [REVISED] ContainerNode is separate from BlockNode.
 * ColumnBlock is NOT in the 'block' group.
 */
type ContainerNode =
  | ColumnBlockNode
  | BlockquoteNode
  | BulletListNode
  | OrderedListNode
  | CalloutNode
```

### 2.11 EdgeRegistry [REVISED]

```typescript
/**
 * [REVISED] Removed pageNumber from crossRefTargets.
 * Page numbers belong in LayoutResult.
 * Incremental update strategy (not full rebuild).
 */
interface EdgeRegistry {
  nodePositions: Map<string, number>
  sectionMembership: Map<string, string>
  sectionOrder: string[]
  bookmarks: Map<string, string>
  crossRefTargets: Map<string, {
    uuid: string
    label: string
    // [REVISED] pageNumber removed -- lives in LayoutResult
  }>
}
```

### 2.12 Composition Rules (Grammar) [REVISED]

```
doc           := section+
section       := (block | container)+
container     := columnBlock | blockquote | bulletList | orderedList | callout
columnBlock   := column{2,4}
column        := (block | container)+       // except columnBlock (normalize plugin)
blockquote    := (block | container)+
bulletList    := listItem+
orderedList   := listItem+
listItem      := (block | bulletList | orderedList)+
callout       := block+
block         := paragraph | heading | codeBlock | image | horizontalRule
paragraph     := inline*
heading       := inline*
codeBlock     := text*
image         := (empty)
horizontalRule := (empty)
inline        := text | mention
```

### 2.13 ProseMirror Group Assignments [REVISED]

```
Node            Groups
----            ------
section         'section'
paragraph       'block'
heading         'block'
codeBlock       'block'
image           'block'
horizontalRule  'block'
columnBlock     'container'          [REVISED: removed from 'block' group]
blockquote      'container'
bulletList      'container'
orderedList     'container'
callout         'container'
column          'column'
listItem        'listItem'
text            'inline'
mention         'inline'
```

---

## PART 3: REVISED PROSEMIRROR SCHEMA

```typescript
import { Node } from '@tiptap/core'

/**
 * Section extension -- REVISED per Round 3 decisions.
 *
 * Key changes from Round 1:
 * - isolating: false (Decision #1)
 * - selectable: false (Decision #6)
 * - pageBreakBefore removed (Decision #2)
 * - columns/columnWidths/columnGutter removed (Decision #13)
 */
export const Section = Node.create({
  name: 'section',

  group: 'section',

  content: '(block | container)+',

  // [REVISED] false -- cursor flows freely across section boundaries.
  // Section boundary enforcement for structural operations is handled
  // by custom keymap and the normalize plugin, not by isolation.
  isolating: false,

  // true -- prevents splitBlock from escaping the section on Enter.
  // Combined with isolating: false, this gives: cursor flows freely,
  // but Enter creates new paragraphs inside the section, not new sections.
  defining: true,

  // Sections are draggable as units (via dedicated section drag handle)
  draggable: true,

  // [REVISED] false -- no accidental whole-section NodeSelection on click.
  // Section selection is programmatic only (via section management UI).
  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-section-id'),
        renderHTML: (attrs) => ({ 'data-section-id': attrs.id }),
      },
      level: {
        default: null,
        parseHTML: (el) => {
          const v = el.getAttribute('data-section-level')
          return v ? parseInt(v, 10) : null
        },
        renderHTML: (attrs) => {
          if (attrs.level == null) return {}
          return { 'data-section-level': attrs.level }
        },
      },
      // [REVISED] pageBreakBefore REMOVED -- lives in PresentationConfig
      numbering: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-numbering') || null,
        renderHTML: (attrs) => {
          if (!attrs.numbering) return {}
          return { 'data-numbering': attrs.numbering }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'section[data-section-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['section', { ...HTMLAttributes }, 0]
  },

  addKeyboardShortcuts() {
    return {
      // Prevent Enter from splitting the section.
      // With isolating: false + defining: true, this is mostly handled
      // by ProseMirror. But we add an explicit guard for edge cases.
      'Mod-Enter': () => {
        // Cmd/Ctrl+Enter: explicit section split.
        // Implementation: tr.split at section level.
        return this.editor.commands.splitSection()
      },
    }
  },
})

/**
 * Doc node override -- content is section+ (no transitional grammar).
 */
export const Doc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'section+',
})

/**
 * ColumnBlock -- REVISED group assignment.
 * [REVISED] group: 'container' only (removed from 'block').
 * [REVISED] gutter removed (moved to PresentationConfig).
 * [REVISED] columnWidths removed (derived from children).
 */
export const ColumnBlock = Node.create({
  name: 'columnBlock',
  group: 'container',              // [REVISED] was 'block container'
  content: 'column{2,4}',
  // ...
  addAttributes() {
    return {
      id: { /* ... */ },
      columns: { default: 2 },
      // [REVISED] columnWidths REMOVED (derived from children)
      // [REVISED] gutter REMOVED (lives in PresentationConfig)
    }
  },
})

/**
 * Column -- REVISED with width attr.
 * [REVISED] width added as owned property (was parent-dependent).
 */
export const Column = Node.create({
  name: 'column',
  group: 'column',
  content: '(block | container)+',
  // ...
  addAttributes() {
    return {
      id: { /* ... */ },
      width: {
        default: 0.5,             // [REVISED] column owns its width
        parseHTML: (el) => {
          const v = el.getAttribute('data-col-width')
          return v ? parseFloat(v) : 0.5
        },
        renderHTML: (attrs) => ({
          'data-col-width': String(attrs.width),
          style: `flex: 0 0 ${attrs.width * 100}%`,
        }),
      },
    }
  },
})
```

---

## PART 4: REVISED MIGRATION STRATEGY

### 4.1 Migration Function

```typescript
/**
 * Smart migration: splits at H1/H2 headings.
 * Falls back to single section if no headings found.
 * Atomic: builds complete new tree before replacing.
 *
 * [REVISED] Per Decision #8: smart splitting replaces naive wrapping.
 * [REVISED] Per Decision #7: no transitional grammar.
 */
function migrateToSections(doc: PMNode, schema: Schema): PMNode {
  const sectionType = schema.nodes.section
  if (!sectionType) return doc

  // If doc already has sections, no migration needed
  const firstChild = doc.content.firstChild
  if (firstChild?.type.name === 'section') return doc

  try {
    return smartMigrate(doc, schema, sectionType)
  } catch (e) {
    // Fallback: wrap everything in one section (never fails)
    console.warn('Smart migration failed, falling back to single section:', e)
    return fallbackMigrate(doc, schema, sectionType)
  }
}

function smartMigrate(doc: PMNode, schema: Schema, sectionType: NodeType): PMNode {
  const sections: PMNode[] = []
  let currentBlocks: PMNode[] = []

  doc.forEach((child) => {
    // Split at H1 and H2 headings
    if (child.type.name === 'heading' && child.attrs.level <= 2) {
      // Flush current blocks as a section (if any)
      if (currentBlocks.length > 0) {
        sections.push(createSection(sectionType, currentBlocks, null))
        currentBlocks = []
      }
      // Start new section with this heading
      currentBlocks.push(child)
    } else {
      currentBlocks.push(child)
    }
  })

  // Flush remaining blocks
  if (currentBlocks.length > 0) {
    sections.push(createSection(sectionType, currentBlocks, null))
  }

  // If no sections created (empty doc edge case), create one empty section
  if (sections.length === 0) {
    sections.push(sectionType.create(
      { id: generateUUID() },
      [schema.nodes.paragraph.create()]
    ))
  }

  const newDoc = schema.nodes.doc.create(null, sections)

  // Validate the new doc against the schema
  if (!newDoc.check()) {
    throw new Error('Migrated document failed schema validation')
  }

  return newDoc
}

function fallbackMigrate(doc: PMNode, schema: Schema, sectionType: NodeType): PMNode {
  const section = sectionType.create(
    { id: generateUUID() },
    doc.content
  )
  return schema.nodes.doc.create(null, [section])
}

function createSection(
  sectionType: NodeType,
  blocks: PMNode[],
  level: number | null
): PMNode {
  // Infer level from first heading if present
  const firstBlock = blocks[0]
  const inferredLevel = (firstBlock?.type.name === 'heading')
    ? firstBlock.attrs.level
    : level

  return sectionType.create(
    { id: generateUUID(), level: inferredLevel },
    blocks
  )
}
```

### 4.2 Migration Execution

- Runs synchronously in `setContent()` before editor initialization
- Atomic: the old document is replaced only after the new one passes validation
- On failure: fallback to single-section wrap (always succeeds for valid ProseMirror docs)
- First-open notification: "Your document has been organized into N sections."

### 4.3 UUID Assignment

A plugin in `appendTransaction` assigns UUIDs to any node missing one. This runs:
- After migration (newly created section nodes need UUIDs)
- After paste (pasted nodes may lack UUIDs)
- After undo/redo (restored nodes should retain their original UUIDs)

UUID deduplication runs in `transformPasted` (before paste enters the document) per Devil's Advocate Attack 8.5, eliminating the one-frame duplicate window.

---

## PART 5: REVISED LAYOUT ENGINE CONTRACT

### 5.1 Layout Engine Interface

```typescript
/**
 * The layout engine is a pure function from content + config to result.
 * UNCHANGED from Round 1 in concept, REVISED in details.
 */

interface LayoutConfig {
  mode: 'continuous' | 'paginated' | 'outline' | 'slide'
  pageSize?: { width: number; height: number }   // mm
  margins?: { top: number; bottom: number; left: number; right: number }  // mm
}

/**
 * [REVISED] blockPages now tracks start AND end page for blocks
 * that span multiple pages (e.g., tall images, tables).
 */
interface LayoutResult {
  sectionPages: Map<string, number>
  blockPages: Map<string, { startPage: number; endPage: number }>  // [REVISED]
  pageBreaks: Array<{ afterSectionId: string; pageNumber: number }>
  pageCount: number
}
```

### 5.2 PresentationConfig

```typescript
/**
 * [NEW] The external companion to the content schema.
 * Not in the ProseMirror document. Stored in a Zustand store
 * and serialized in the .serq file alongside the content tree.
 *
 * Incorporates fields removed from the content schema per
 * Decisions #2, #3, #9, #13.
 */
interface PresentationConfig {
  activeMode: 'continuous' | 'paginated' | 'outline' | 'slide'

  /** Pagination-specific config */
  paginated: PaginatedConfig

  /** Style defaults (applied across all modes unless overridden) */
  styleDefaults: StyleDefaults

  /** Per-node style overrides (keyed by node UUID) */
  nodeStyleOverrides: Record<string, NodeStyleOverride>

  /** Column defaults */
  columnDefaults: {
    gutter: number       // px (screen) -- renderer converts to mode units
  }

  /** Per-columnBlock overrides */
  columnOverrides: Record<string, {
    gutter?: number
  }>
}

interface PaginatedConfig {
  pageSize: {
    width: number        // mm
    height: number       // mm
    preset?: 'A4' | 'Letter' | 'Legal' | 'A5' | 'custom'
  }
  margins: {
    top: number          // mm
    bottom: number
    left: number
    right: number
  }
  header?: HeaderFooterConfig
  footer?: HeaderFooterConfig

  /**
   * [NEW] Per-section break rules.
   * Replaces SectionNode.attrs.pageBreakBefore (Decision #2).
   */
  sectionBreaks: Record<string, {
    breakBefore?: boolean
    breakAfter?: boolean
    avoidBreakInside?: boolean
  }>

  /**
   * [NEW] Per-node break rules.
   * Replaces NodeMeta.breakHint (Decision #2).
   */
  nodeBreaks: Record<string, {
    breakBefore?: boolean
    breakAfter?: boolean
    avoidBreakInside?: boolean
  }>

  orphanLines: number
  widowLines: number
}

/**
 * Style defaults for presentation.
 * These are the mode-dependent properties removed from the content tree.
 */
interface StyleDefaults {
  typography: {
    bodyFontSize: number        // px (renderer converts per mode)
    bodyLineHeight: number      // unitless ratio
    bodyLetterSpacing: number   // px
    headingScale: number[]      // [h1..h6] as multipliers
    captionFontSize: number
    codeFontFamily: string
  }
  spacing: {
    blockSpacingBefore: number  // px
    blockSpacingAfter: number
    sectionSpacingBefore: number
    sectionSpacingAfter: number
  }
}

/**
 * Per-node style overrides for presentation-layer properties.
 * Keyed by node UUID.
 */
interface NodeStyleOverride {
  fontSize?: number
  lineHeight?: number
  letterSpacing?: number
  spacingBefore?: number
  spacingAfter?: number
  borderStyle?: string
}
```

### 5.3 Interaction Between Content and Presentation

```
+---------------------+         +-------------------------+
|   CONTENT SCHEMA    |         |   PRESENTATION CONFIG   |
|                     |         |                         |
|  doc                |         |  activeMode             |
|    section[]        |<--------|  paginated.sectionBreaks|
|      block[]        |  (refs  |  paginated.nodeBreaks   |
|        text[]       |  by     |  styleDefaults          |
|                     |  UUID)  |  nodeStyleOverrides     |
|  styleIntents       |         |  columnDefaults         |
|  (advisory)         |         |  (authoritative)        |
+---------------------+         +-------------------------+
          |                               |
          |    +-------------------+      |
          +--->|     RENDERER      |<-----+
               |                   |
               |  Resolves cascade:|
               |  presentationCfg  |
               |    > nodeOverride |
               |    > authorIntent |
               |    > styleDefault |
               +-------------------+
```

**Cascade resolution order (highest to lowest priority):**
1. `PresentationConfig.nodeStyleOverrides[nodeId]` (mode-specific override)
2. `node.styleParams` (author intent from content tree)
3. Parent cascade (section.styleParams -> doc.styleParams)
4. `PresentationConfig.styleDefaults` (application defaults)
5. `styleStore` Zustand store (final fallback, never reached if DocNode has complete defaults)

**Switching modes is free:** Change `PresentationConfig.activeMode`. The content tree is untouched. The renderer switches which config section it reads.

---

## PART 6: IMPLEMENTATION PHASES

---

### Phase 1: Section Node + Migration (Immediate)

**Goal:** Add the section node, migrate existing documents, and make all existing features work with the new hierarchy.

**Deliverables:**

1. **Section extension** -- TipTap Node extension with the spec from Part 3
2. **Doc override** -- Content expression `section+`
3. **Migration function** -- Smart heading-based splitting with fallback
4. **UUID plugin** -- Assigns UUIDs to all nodes; dedup in `transformPasted`
5. **Depth helper** -- `findBlockDepth($pos)` replacing all `d === 1` hardcodes
6. **Block indicator updates** -- Add `section` to `STRUCTURAL_WRAPPERS`; update gap finding for three levels (doc, section, column)
7. **Commands updates** -- `setColumns`, `removeColumn` depth assumptions updated
8. **Normalize plugin updates** -- Column width validation (sum to 1.0) now reads from child attrs
9. **ColumnBlock group change** -- `group: 'container'` (from `'block'`)
10. **Column width migration** -- Move `columnWidths` from parent to children `width` attrs
11. **Section split/merge commands** -- `splitSection()` and `mergeSections()`
12. **Custom keymap** -- Prevent Enter from splitting sections; cross-section Backspace/Delete merge

**Dependencies:** None (builds on current codebase)

**Estimated effort:** 1-2 weeks

---

### Phase 2: Section-Aware Layout Engine (Pagination Fix)

**Goal:** Replace the DOM-based pagination overlay with a section-aware layout engine. This is the PRIMARY goal -- fixing the pagination/continuous-flow divergence.

**Deliverables:**

1. **PresentationConfig store** -- Zustand store with pagination, style defaults, and per-node overrides
2. **Layout engine** -- Pure function: `(document, config) -> LayoutResult`
3. **LayoutResult integration** -- Block indicator reads from LayoutResult instead of DOM measurements
4. **Remove pagination-specific code** -- ~230 lines of `clipIndicatorToCurrentPage`, `isPointInForbiddenZone`, `isPaginationEnabled`, `getPageNumberForElement`
5. **Break rules migration** -- If any documents have break hints, migrate them to PresentationConfig
6. **PresentationConfig serialization** -- Save/load alongside content tree in `.serq` file
7. **EdgeRegistry incremental updates** -- Transaction-based position mapping instead of full rebuild
8. **ResizeObserver integration** -- Layout engine re-runs on CSS-induced height changes (font size, window resize)

**Dependencies:** Phase 1 complete

**Estimated effort:** 2-3 weeks

---

### Phase 3: Cross-References and Semantic Hooks

**Goal:** Add cross-reference marks, bookmarks, and the foundation for future semantic features.

**Deliverables:**

1. **CrossRef mark** -- With `targetId`, `targetType`, `displayFormat`, `relationship`
2. **EdgeRegistry cross-ref resolution** -- Validates targets, decorates broken refs (never auto-removes)
3. **Bookmark attrs** -- `meta.bookmark` on nodes
4. **Outline view** -- Reads section tree for collapsible hierarchy
5. **Section summary support** -- `meta.summary` field populated by user or AI
6. **DisplayFormat fallback table** -- Mode-aware rendering of crossRef display formats

**Dependencies:** Phase 2 complete (LayoutResult provides page numbers for `displayFormat: 'page'`)

**Estimated effort:** 1-2 weeks

---

## PART 7: KNOWN LIMITATIONS

These are architectural limitations that the schema CANNOT solve. They are documented for honesty.

### 1. Flat Sections Cannot Represent Deep Hierarchy

Sections do not nest. A document with Chapters > Sections > Subsections flattens to a single level with `level` attrs that imply hierarchy but do not enforce it. A user can create `level: [1, 3, 1, 5, 2]` and the schema will not complain.

**Why this is accepted:** Recursive section nesting dramatically increases the complexity of drag-and-drop, outline manipulation, and schema validation. The `level` attr captures the author's intent, and the EdgeRegistry can validate level consistency. If true nesting is needed, a `sectionGroup` or `subsection` node type can be added later as a non-breaking change.

### 2. No Within-Block Page Breaking

The layout engine assigns blocks to pages but does not split a block across pages. A paragraph that is taller than a page overflows. A table that spans multiple pages must be handled as a special case by the renderer.

**Why this is accepted:** Within-block breaking (splitting a paragraph's text across two pages) requires the layout engine to understand text reflow, which is a browser-engine-level problem. ProseMirror's document model does not support "half a paragraph." The renderer handles visual splitting via CSS (e.g., `break-inside: auto` on block elements).

### 3. ColumnBlock Across Page Breaks is Unspecified

When a 2-column layout overflows a page boundary, the behavior is undefined in Phase 1. Options include: push entire columnBlock to next page, break columns independently, or break the columnBlock at the boundary.

**Why this is accepted:** This is a known hard problem. Word and InDesign handle it differently. For Phase 1, columnBlocks default to `avoidBreakInside: true` in the PresentationConfig. Phase 2+ addresses column-aware page breaking.

### 4. No Transclusion

A block cannot exist in two places simultaneously. ProseMirror's tree structure requires exactly one parent per node. Cross-references point to nodes but do not embed them. "Include by reference" is not supported.

**Why this is accepted:** Transclusion requires either shadow DOM or a reference-resolution layer that creates virtual copies. Both are significant architectural additions. Cross-references handle the 95% use case.

### 5. Style Cascade Does Not Include Columns

The cascade chain is `doc -> section -> block`. ColumnNode and ColumnBlockNode do not participate in the style cascade (their styleParams are empty/unused). A block inside a column inherits from the section, skipping the column and columnBlock. This means you cannot set a style on a column that cascades to its children.

**Why this is accepted:** Column-level style cascading is rarely needed. Blocks inside columns inherit from the section, which is the correct behavior in most cases. If column-level styling is needed, explicit styleParams on the blocks inside the column provide the mechanism.

### 6. EdgeRegistry Freshness is Eventual, Not Synchronous

The EdgeRegistry updates incrementally via transaction mapping for text edits and rebuilds for structural changes. Between a structural change and the rebuild, derived data (section numbering, bookmark resolution) may be stale. The interaction layer should handle brief staleness gracefully.

**Why this is accepted:** Synchronous full rebuilds on every transaction do not scale to large documents. The Devil's Advocate's performance analysis shows 25-55ms for 500 sections. Incremental updates with eventual consistency for structural changes is the pragmatic choice.

---

*This specification was synthesized from 6 input documents representing 5 distinct analytical perspectives. All decisions are final for Phase 1 implementation. Disputes are resolved; the rationale is recorded. Build this.*

*Round 3 Synthesis -- 2026-02-06*
