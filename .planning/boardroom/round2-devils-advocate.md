# SERQ Content Schema -- Devil's Advocate Stress Test

**Role:** Adversarial Architect / Devil's Advocate
**Date:** 2026-02-06
**Status:** Round 2 -- Stress Testing the Schema Architect's Round 1 Proposal
**Target:** `round1-schema-architect.md`

---

## Preamble

I want to be clear about something: this is a good proposal. The diagnosis is correct -- the missing abstraction between `doc` and `block` is the root cause of the pagination spaghetti. The section node is the right answer. But "right answer" and "right implementation" are different things, and right now there are fault lines in this spec that will crack open under real-world load. My job is to find every single one before a user does.

I have 28 attacks organized across 8 vectors. For each: the scenario, why it fails, severity, and a mitigation.

---

## 1. RECURSIVE DEPTH ATTACKS

### Attack 1.1: ColumnBlock Inside ColumnBlock via Paste

**Scenario:** User copies a columnBlock from Document A. In Document B, they place the cursor inside a column and paste. The clipboard HTML contains `<div data-column-block>...<div data-column>...<div data-column-block>...</div>...</div>...</div>` -- a columnBlock nested inside a columnBlock.

**Why it fails:** The proposal states in Section 5.3, constraint #2: "ColumnBlocks cannot nest. A column can contain blocks and containers EXCEPT columnBlock." But look at the actual Column extension in the codebase (`src/extensions/columns/column.ts`, line 23): `content: 'block+'`. The columnBlock node is `group: 'block'` (line 22 of `column-block.ts`). That means **the ProseMirror schema itself permits columnBlock inside column** -- the content expression `block+` matches `columnBlock` because columnBlock is in group `'block'`. The prevention is runtime-only, via the normalize plugin (`normalize-plugin.ts`). The proposal even acknowledges this: "Enforced by the normalize plugin (existing behavior, preserved)."

The problem: paste operations happen in a single transaction. The normalize plugin runs in `appendTransaction`, which fires AFTER the paste is committed. There is a window where the document is in an invalid state. If another plugin (e.g., the UUID plugin, the EdgeRegistry rebuild) reads the document during that window, it will encounter a nested columnBlock.

**Severity:** MANAGEABLE -- The normalize plugin already handles this, and `appendTransaction` fires before the next render. But the Schema Architect's proposal groups columnBlock in both `'block'` AND `'container'` (Section 10: `group: 'block container'`). This means the section's content expression `(block | container)+` will also match columnBlock, which is correct. But the column's content expression -- which in the proposal's grammar (Section 5.1) is `(block | container)+ // except columnBlock (no nesting)` -- has a comment-only exception. ProseMirror content expressions cannot express "all blocks except one specific block." The grammar says one thing; the schema says another.

**Mitigation:** Create a separate group for column-safe content. Instead of `column := (block | container)+`, define a `columnContent` group that explicitly excludes columnBlock. Or keep the normalize plugin but document that the grammar in Section 5.1 is aspirational, not enforceable at the schema level.

---

### Attack 1.2: Section Inside a Container via Direct PM Transaction

**Scenario:** A plugin or custom code dispatches a transaction that inserts a section node inside a blockquote. The grammar says `blockquote := (block | container)+` and section is NOT in the block or container group (Section 5.2: section has group `'section'`). ProseMirror should reject this at schema validation. But what if the transaction uses `ReplaceStep` directly, bypassing content validation?

**Why it fails:** ProseMirror's `ReplaceStep.apply()` checks `fitSlice`, but `tr.replaceWith()` calls `replace()` which constructs steps that are validated against the schema. Direct `Step` construction CAN bypass this. In practice, this attack fails because ProseMirror's step application validates content expressions. But it exposes a design question: should the normalize plugin also enforce "no sections except as children of doc"?

**Severity:** MANAGEABLE -- ProseMirror's built-in validation handles this. But the proposal should explicitly state that no `appendTransaction` guard is needed for this case, unlike the columnBlock nesting case.

**Mitigation:** Add INV-8: "Section nodes exist only as direct children of `doc`." Note that this is enforced by the schema, not by runtime code.

---

### Attack 1.3: Zero-Depth Atom -- Text Node With No Block Parent

**Scenario:** Through a sequence of undo operations, a text node ends up as a direct child of a section (no intervening paragraph). The section's content expression is `(block | container)+`, and text nodes are group `'inline'`. This should be schema-invalid.

**Why it fails:** It shouldn't happen via normal editing. But undo/redo with complex multi-step transactions can produce intermediate states. ProseMirror's history plugin stores inverted steps and replays them. If a step inversion produces a state where a section contains raw text, the schema check in `apply()` should catch it and the transaction fails. This is ProseMirror working correctly.

**Severity:** MANAGEABLE -- ProseMirror's schema validation prevents this. No action needed.

**Mitigation:** None required. The schema is the firewall.

---

## 2. SCALE ATTACKS

### Attack 2.1: Single Section With 10,000 Blocks

**Scenario:** User has a legacy document with no section breaks -- 10,000 paragraphs in one massive section (the migration wraps everything in a single section, per Section 9.2 step 3).

**Why it fails:** The proposal claims in Section 8.2 that "The block indicator plugin asks: 'What section is this block in? What page is that section on?'" This assumes sections map reasonably to pages. A single section with 10,000 blocks maps to ALL pages. The section-to-page mapping becomes useless: `sectionToPage` returns "pages 1-500" for the only section. Every interaction query that asks "which page?" must now scan within the section anyway.

The proposal's LayoutResult (Section 8.3) has `sectionPages: Map<string, number>` which stores "which page each section STARTS on." For a single section starting on page 1, this is trivially correct but useless. You still need `blockPages: Map<string, number>` for actual per-block page lookup. But building `blockPages` for 10,000 blocks requires walking all of them -- which is what the current pagination code does. The section abstraction provides zero benefit here.

**Severity:** SERIOUS -- This is the exact state every migrated document starts in. The first user experience with the new architecture will be "all my blocks in one section," which is the degenerate case where sections provide no structural benefit. The architecture's value proposition is contingent on users actually using sections, but nothing in the UX guides them to create sections.

**Mitigation:** The migration function should be smarter. Instead of wrapping ALL blocks in one section, use heuristics:
- Split at `heading` nodes with level 1 or 2 (these are natural section boundaries)
- Split at existing `pageBreakBefore` hints if any exist
- At minimum, split at every N blocks (e.g., 100) as a fallback

This gives migrated documents the section structure that makes the architecture worthwhile.

---

### Attack 2.2: 500 Sections With 10 Blocks Each -- Section Management Overhead

**Scenario:** A well-structured 500-page academic paper with 500 sections.

**Why it fails:** The proposal says the EdgeRegistry walks "the top two levels of the tree (sections and their direct children)" on every document change. For 500 sections with 10 blocks each, that is 5,500 nodes. The estimated time is "~5ms" (Section 11.3). But that estimate assumes 1 microsecond per iteration. In reality, each iteration involves:
- Reading node attributes (UUID lookup)
- Map insertion (`nodePositions`, `sectionMembership`)
- Array push (`sectionOrder`)
- Bookmark resolution

With V8's Map implementation and GC pressure from creating new Map instances on every rebuild, the real cost is closer to 5-10 microseconds per node, putting us at 25-55ms per document change. That is 2-3 frames dropped on every keystroke in a 500-section document.

**Severity:** SERIOUS -- The performance analysis in Section 11.3 is optimistic by 5-10x. The EdgeRegistry rebuild is O(total_blocks) on every transaction, which means every keystroke in a large document triggers a full rebuild.

**Mitigation:**
1. Don't rebuild the full registry on every transaction. Use ProseMirror's `Transaction.steps` to determine which sections were affected and do incremental updates.
2. Debounce the registry rebuild. Cross-references and numbering don't need to be updated on every keystroke -- they can be updated on idle (requestIdleCallback) or after a 100ms debounce.
3. Use a persistent data structure (immutable map with structural sharing) to avoid GC pressure from creating new Maps on every rebuild.

---

### Attack 2.3: Single Enormous Table (10,000 Rows) Inside a Section

**Scenario:** A data-heavy document has one section containing a table with 10,000 rows.

**Why it fails:** The proposal doesn't address tables at all. Tables are a Level 3 container in most ProseMirror schemas, but the proposal's container list (Section 3.4) is: `columnBlock | blockquote | bulletList | orderedList | callout`. No table. TipTap's paid TableNode is listed in the project's TipTap Teams subscription.

A 10,000-row table is a single container node inside a section. The layout engine needs to paginate within this table (break across pages while keeping header rows). This is a fundamentally different problem than paginating sections. The proposal's LayoutResult has no concept of "this single node spans pages 5 through 47."

**Severity:** SERIOUS -- Tables are a first-class content type in any writing app. The schema proposal ignores them entirely. This isn't a "Phase 3" concern -- it's a structural gap. If the section-based layout engine can't handle within-node page breaks, it can't handle tables, images, or any tall block.

**Mitigation:** Add a `Table` container node to the schema. More importantly, the LayoutResult needs a concept of "this block starts on page X and ends on page Y" -- not just "this block is on page X." The `blockPages` map should be `Map<string, { startPage: number, endPage: number }>`.

---

### Attack 2.4: EdgeRegistry Rebuild Frequency

**Scenario:** User is typing rapidly in the middle of a 200-section document. Each keystroke is a transaction. The EdgeRegistry rebuilds on every transaction.

**Why it fails:** The proposal states (Section 4.3): "This registry is rebuilt by a ProseMirror plugin on every document change." Even with the "only walks the top two levels" optimization, this is wasteful. When the user types a character in paragraph 47 of section 12, the section order hasn't changed, the bookmarks haven't changed, and the cross-references haven't changed. Only the `nodePositions` map has shifted (because positions after the edit are invalidated).

But ProseMirror already provides position mapping via `Transaction.mapping`. The registry doesn't need to recompute positions -- it needs to map existing positions through the transaction's mapping. A full rebuild is the wrong approach.

**Severity:** SERIOUS -- This is a performance cliff that scales linearly with document size and inversely with typing speed. For a 200-section document, the user will feel lag.

**Mitigation:** Replace "rebuild on every transaction" with "map positions through transaction mapping + rebuild only when structure changes (section added/removed/reordered)." ProseMirror's `Mapping` class does exactly this.

---

## 3. SECTION BOUNDARY ATTACKS

### Attack 3.1: Cursor Navigation Across Section Boundaries

**Scenario:** User presses the Down arrow key at the last line of Section 1. The cursor should move to the first line of Section 2.

**Why it fails:** The proposal sets `isolating: true` on the section node (Section 10, line 1278). ProseMirror's `isolating` flag means "cursor cannot cross the boundary of this node via arrow keys." This is by design for things like footnotes and captions -- you don't want the cursor to accidentally leave a caption by pressing Down. But for sections in a document? The user absolutely expects arrow keys to flow between sections. A document where you can't arrow from one section to the next is broken.

The proposal's justification: "A section is a structural boundary. Cursor navigation stops at section edges." This is wrong for the primary use case. Users think of sections as chapters -- they don't expect the cursor to get trapped inside a chapter. They expect to move fluidly through the document.

**Severity:** EXISTENTIAL -- If the user can't arrow-key from one section to the next, the editing experience is fundamentally broken. This alone will make SERQ feel hostile to use.

**Mitigation:** Set `isolating: false` on the section node. If you need isolation for specific operations (e.g., "don't auto-join sections"), use `defining: true` instead (which prevents content from being "lifted" out of the section, but allows cursor movement). Or write a custom keymap plugin that overrides the default arrow key behavior at section boundaries to cross to the adjacent section.

---

### Attack 3.2: Backspace at Start of Section -- Should It Merge?

**Scenario:** User places cursor at the very first position of Section 2 (before the first character of the first paragraph). Presses Backspace.

**Why it fails:** In a flat document (current schema), Backspace at the start of a paragraph joins it with the previous paragraph. With sections, Backspace at the start of a section has multiple possible meanings:
1. Merge this section into the previous section (move all blocks)
2. Delete the section boundary (join the two sections)
3. Merge the first paragraph of this section with the last paragraph of the previous section
4. Do nothing (section boundary is structural)

The proposal doesn't specify which behavior to implement. ProseMirror's default `joinBackward` command will attempt to join the current block with the previous sibling. But the "previous sibling" of the first block in Section 2 is the last block in Section 1 -- across an `isolating` boundary. ProseMirror will not join across isolating boundaries by default. So the user presses Backspace and nothing happens. Confusing.

**Severity:** SERIOUS -- Every user will hit this within their first 5 minutes of editing. An unresponsive Backspace is one of the most jarring UX failures in any text editor.

**Mitigation:** Write a custom keymap handler for Backspace that detects "cursor at start of section, section has a predecessor" and merges the first block of the current section with the last block of the previous section, then moves remaining blocks from the current section into the previous section. Delete the now-empty section. This is non-trivial but well-defined.

---

### Attack 3.3: Selection Spanning Multiple Sections

**Scenario:** User clicks in Section 1 and drags to Section 3, selecting text across three sections.

**Why it fails:** With `isolating: true`, ProseMirror's TextSelection cannot span across section boundaries. The user can select within a section but not across sections. This means:
- You can't select-all (Cmd+A selects within the current section only)
- You can't drag-select across sections
- You can't Shift+Click across sections

This is catastrophic for basic editing. Even if NodeSelection can select entire sections, text-level selection across sections is a core expectation.

**Severity:** EXISTENTIAL -- Cross-section text selection is a non-negotiable feature of any document editor. If users can't select text across section boundaries, SERQ is unusable for real writing.

**Mitigation:** Again, `isolating: false`. Or implement a custom `AllSelection`-like construct that understands sections. But the simplest fix is to not make sections isolating. The "structural boundary" benefit of `isolating` is not worth the UX cost.

---

### Attack 3.4: Section That Spans Multiple Pages

**Scenario:** Section 5 has 200 paragraphs. In paginated mode with A4 paper, this section spans pages 12 through 18.

**Why it fails:** The proposal says (Section 2.2): "In paginated mode, sections are the units that get distributed across pages (with page breaks happening between or within sections based on break rules)." But the LayoutResult (Section 8.3) defines `sectionPages: Map<string, number>` as "which page each section STARTS on." For Section 5, this returns page 12. But the blocks in Section 5 are on pages 12-18. What about them?

The proposal also has `blockPages: Map<string, number>` which gives per-block page assignments. So the data IS there. But the narrative in Section 8.2 ("The block indicator plugin asks: 'What section is this block in? What page is that section on?'") is misleading. The actual query is "What page is this BLOCK on?" which goes to `blockPages`, not `sectionPages`. The section-level indirection adds a lookup step that isn't needed.

**Severity:** MANAGEABLE -- The data model supports this (blockPages exists). But the proposal's narrative overstates how much sections simplify pagination. Sections simplify page BREAK decisions, not page MEMBERSHIP queries.

**Mitigation:** Revise the narrative in Section 8.2 to be honest: sections help with break point logic and structural organization, but per-block page membership is still computed at the block level. Don't claim more than the architecture delivers.

---

### Attack 3.5: Paste Content Into the Middle of a Section

**Scenario:** User pastes a large chunk of text (from external source, no sections) into the middle of Section 3.

**Why it fails:** ProseMirror's paste handling uses `transformPasted` and `clipboardTextSerializer`. When pasting into a section, the pasted content needs to be valid section content: `(block | container)+`. Plain text becomes paragraphs, which are blocks -- this works. But pasting rich HTML that includes headings, lists, and images all lands in the current section. If the user's intent was to paste multiple sections' worth of content, it all becomes one section.

This is fine for most cases, but consider: pasting a Markdown file that has `# Chapter 1` ... `# Chapter 2`. In the new schema, these should ideally become separate sections. But the paste handler has no concept of "headings imply section boundaries." All content goes into the current section.

**Severity:** MANAGEABLE -- This is an enhancement, not a bug. The paste works correctly (content goes into the section). The section splitting can be offered as a post-paste action.

**Mitigation:** Add a `transformPasted` hook that optionally splits pasted content at H1/H2 boundaries into separate sections. Make this a user preference, not a default.

---

## 4. PROSEMIRROR COMPATIBILITY ATTACKS

### Attack 4.1: Content Expression Ambiguity -- `(block | container)+`

**Scenario:** The section content expression is `(block | container)+`. The Schema Architect proposes (Section 10) that columnBlock should have `group: 'block container'` -- placing it in BOTH groups.

**Why it fails:** ProseMirror's content expression parser interprets `(block | container)+` as "one or more nodes from the union of group 'block' and group 'container'." If columnBlock is in both groups, it matches TWICE in the expression -- once as a block and once as a container. This doesn't cause a runtime error (the node still matches), but it creates ambiguity in ProseMirror's schema-checking internals. When PM checks "can I insert a columnBlock here?" it finds two matching groups. The `contentMatch` state machine may behave unpredictably.

More importantly: the proposal's own grammar (Section 5.1) separates block and container:
```
container := columnBlock | blockquote | bulletList | orderedList | callout
block     := paragraph | heading | codeBlock | image | horizontalRule
```

But then puts columnBlock in BOTH PM groups. The TypeScript union types (Section 3.6) keep them separate: `BlockNode` doesn't include `ColumnBlockNode`, and `ContainerNode` does. So the TypeScript types, the grammar, and the PM schema say three different things about columnBlock's identity.

**Severity:** SERIOUS -- This is a coherence problem. The spec contradicts itself across three representations (grammar, types, PM groups). Pick one truth and make the others match.

**Mitigation:** Don't put columnBlock in the `'block'` group. Containers are containers. Change the current codebase's `group: 'block'` (column-block.ts line 22) to `group: 'container'`. Update all content expressions that need to match both to use `(block | container)+`. This is a breaking change to the current schema and requires migration, but it aligns the three representations.

---

### Attack 4.2: ProseMirror's `joinBackward` and `joinForward` With Sections

**Scenario:** User presses Delete at the end of the last paragraph in Section 1. ProseMirror's `joinForward` command tries to join the current block with the next block.

**Why it fails:** The "next block" is the first block of Section 2, which is in a different parent node. ProseMirror's default `joinForward` does NOT join nodes across different parents. The section boundary acts as a wall. The user presses Delete and nothing happens. Same problem as Backspace (Attack 3.2) but on the other side.

**Severity:** SERIOUS -- Duplicate of Attack 3.2's impact. Both Backspace-at-start and Delete-at-end need custom handling.

**Mitigation:** Same as 3.2. Custom keymap handlers for both `joinBackward` (Backspace) and `joinForward` (Delete) at section boundaries.

---

### Attack 4.3: `lift` and `wrap` Commands With the Section Layer

**Scenario:** User selects a paragraph inside a blockquote inside a section and presses "Lift out of blockquote." ProseMirror's `lift` command moves the paragraph up one level in the hierarchy.

**Why it fails:** In the current flat schema: `doc > blockquote > paragraph`. Lifting moves paragraph to `doc > paragraph`. In the new schema: `doc > section > blockquote > paragraph`. Lifting moves paragraph to `doc > section > paragraph`. This is correct behavior. But what if the user tries to lift again? The paragraph is now a direct child of section. Lifting again would move it to `doc > paragraph` -- but `doc` only accepts sections. PM's schema validation blocks this lift. The user gets stuck.

The same issue affects `wrap`: if the user tries to "Unwrap from section" (a conceptual operation), there's no PM command for this because sections are a schema requirement.

**Severity:** MANAGEABLE -- ProseMirror handles this correctly (lift stops at the section boundary, which is the expected behavior). But the UX needs to clearly communicate "you can't lift beyond a section." The lift button/shortcut should be disabled when the block is a direct child of a section.

**Mitigation:** Add a `canLift` check in the UI that considers the section boundary. This is standard ProseMirror practice.

---

### Attack 4.4: `selectAll` (Cmd+A) Behavior

**Scenario:** User presses Cmd+A.

**Why it fails:** With `isolating: true` on sections, Cmd+A selects all content within the current section. Pressing Cmd+A again does... what? In many editors, double Cmd+A selects the entire document. ProseMirror's default behavior with isolating nodes is: first Cmd+A selects within the isolating boundary, second Cmd+A selects the entire document (AllSelection). So this might work. But `AllSelection` in ProseMirror selects the entire document as a single selection, which includes section boundaries. Copy-pasting an AllSelection produces... what? The section structure? Or just the content?

**Severity:** MANAGEABLE -- ProseMirror's AllSelection works, but the clipboard serialization needs to handle sections correctly (either include them in the pasted HTML or strip them).

**Mitigation:** Implement `clipboardSerializer` that includes section boundaries as `<section>` elements in the clipboard HTML, so paste preserves structure.

---

## 5. THE "pageBreakBefore" PARADOX

### Attack 5.1: pageBreakBefore Is Presentation in Content's Clothing

**Scenario:** The section has `attrs.pageBreakBefore: boolean` (Section 3.5, SectionNode interface). The author sets "Chapter 3 starts on a new page." They then switch to continuous scroll mode. The `pageBreakBefore` flag is still there, doing nothing. They switch to slide mode. What does `pageBreakBefore` mean for slides? Nothing -- each section is already a slide.

**Why it fails:** The proposal's own Principle 1.2 (Presentation Agnosticism) states: "The content schema describes what the content is and how it relates to other content. It does not describe how content is laid out on a page, screen, or slide." But `pageBreakBefore` is literally a layout directive. "Start on a new page" has no meaning in continuous mode, outline mode, or slide mode. It is purely a pagination instruction embedded in the content schema.

The proposal tries to hedge: "These are HINTS, not commands" (INV-7). But there's already `meta.breakHint` for exactly this purpose (Section 3.3, NodeMeta interface). Having BOTH `attrs.pageBreakBefore` and `meta.breakHint` means two systems that say the same thing. The proposal even acknowledges this: "Shorthand for meta.breakHint = 'before' (but more explicit)."

**Why have both?** If `breakHint` is the general system, and `pageBreakBefore` is a special case for sections, then `pageBreakBefore` is redundant. If `pageBreakBefore` is the "real" one and `breakHint` is the fallback, then the schema has two overlapping systems with unclear precedence.

**Severity:** SERIOUS -- This is a principled coherence problem. The Schema Architect established Presentation Agnosticism as a core principle and then immediately violated it. This isn't about pragmatism vs. purity -- it's about what happens when the two systems conflict. If `section.attrs.pageBreakBefore = false` but `section.meta.breakHint = 'before'`, which wins?

**Mitigation:** Remove `pageBreakBefore` from section attrs. Use `meta.breakHint = 'before'` exclusively. If the UX needs a "Start on new page" checkbox for sections, it reads and writes `meta.breakHint`. One system, one truth.

---

### Attack 5.2: breakHint = 'avoid' on a Section Larger Than a Page

**Scenario:** Section 7 has `meta.breakHint = 'avoid'` (don't break inside). Section 7 is 3 pages long.

**Why it fails:** INV-7 says "Break hints are advisory. The layout engine respects them when physically possible." A 3-page section that says "don't break me" physically cannot fit on one page. The layout engine must break it. Fine -- but WHERE does it break? The hint provides no fallback strategy. Does it break at the first block that overflows the page? Does it try to find "good" break points (between paragraphs, not inside a paragraph)? The proposal's layout engine is described as a pure function (Section 8.3) but its break-point algorithm is unspecified.

**Severity:** MANAGEABLE -- This is an implementation detail for the layout engine, not a schema problem. The schema correctly models "avoid" as a hint.

**Mitigation:** Specify the layout engine's break-point algorithm: prefer breaks between blocks, avoid breaks inside blocks, never break inside inline content. When `breakHint = 'avoid'` is physically impossible, fall back to the default break algorithm and log a warning.

---

## 6. THE MIGRATION ATTACK

### Attack 6.1: 500-Page Document Becomes One Giant Section

**Scenario:** User opens an existing SERQ document with 500 pages of content. The migration function (Section 9.2) wraps everything in one section.

**Why it fails:** This is the same as Attack 2.1 but from the migration angle. The proposal's migration function is:

```typescript
// Wrap all top-level blocks in a single section
const section = sectionType.create(
  { id: generateUUID() },
  doc.content
)
return schema.nodes.doc.create(null, [section])
```

This is technically correct but strategically disastrous. The entire point of sections is to provide structure. Migrating to "one section with everything in it" provides no structure. Every benefit listed in Section 3.5 (pagination, outline, styling, drag-and-drop, cross-references) is neutralized because there's only one section.

It gets worse: the user now has to MANUALLY create sections by splitting this mega-section. What's the UX for that? Select blocks, "Create section from selection"? The proposal doesn't specify section splitting or merging operations.

**Severity:** EXISTENTIAL -- If migration doesn't produce meaningful sections, the architecture's benefits are theoretical. Every existing SERQ user (which is currently Jacques, but will be real users at commercial launch in June 2026) will experience the new architecture as "same as before, but with an extra wrapper."

**Mitigation:** Implement intelligent migration:
1. Split at H1/H2 boundaries (these are natural section breaks)
2. If no headings, split at horizontal rules
3. If no horizontal rules, split at every ~50 blocks
4. Allow the user to review and adjust the auto-detected sections
5. Implement section split/merge commands for manual adjustment

---

### Attack 6.2: Transitional Schema `(section | block)+` Creates Two Classes of Documents

**Scenario:** The proposal suggests (Section 10, end): `content: '(section | block)+'` during the transition period. Some documents have sections, some have bare blocks, some have a mix.

**Why it fails:** This creates a combinatorial explosion of states:
- Old document: all bare blocks (no sections)
- New document: all sections
- Partially migrated: some sections, some bare blocks
- User-modified: user deleted all sections, back to bare blocks

The interaction layer must handle ALL of these states. The block indicator, drag-and-drop, pagination, outline view -- every feature needs codepaths for "is this block in a section or bare?" This is worse than not having sections at all, because now you have the complexity of sections PLUS backward compatibility with non-sections.

**Severity:** SERIOUS -- The transitional schema doubles the state space and the code paths. It's meant to ease migration but actually makes the codebase harder to maintain.

**Mitigation:** Don't use a transitional schema. Migrate ALL documents to `section+` on load. The migration function runs once, synchronously, before the editor initializes. Documents are always in the new schema after loading. No mixed states. Clean cut.

---

### Attack 6.3: Migration Failure Halfway Through

**Scenario:** The migration function encounters a node it can't handle (a plugin-created custom node type not in the schema). It throws an error after wrapping 200 of 500 blocks in sections.

**Why it fails:** If migration runs as part of `setContent()` and throws, the editor may be in an inconsistent state: some blocks wrapped in sections, some not, and the doc's content expression is `section+` which requires ALL children to be sections. The document is now schema-invalid and can't be opened.

**Severity:** SERIOUS -- Data loss. The user can't open their document.

**Mitigation:** Run migration in a try/catch. If it fails, fall back to the original document with a warning dialog: "This document uses an older format. Section features are disabled." Alternatively, make migration atomic: build the new doc tree entirely in memory, validate it, then replace the old doc only if the new one is valid.

---

## 7. PRESENTATION PARADOX ATTACKS

### Attack 7.1: Content That Changes Page Count With Font Size

**Scenario:** Document has 10 sections, each fitting neatly on one page at 12pt font. User changes font to 18pt. Content now overflows, and sections span multiple pages.

**Why it fails:** The LayoutResult is computed by the layout engine based on measured content heights. When font size changes, EVERY block height changes, and the entire LayoutResult must be recomputed. This is fine in theory, but the proposal's layout engine is described as running when "the document structure changes" (Section 11.4). A font size change is NOT a document structure change -- it's a style change. Does the layout engine re-run? The proposal doesn't say.

In the current codebase, font size is applied via CSS (textStyle mark or blockFontFamily attr). CSS changes don't trigger ProseMirror transactions. The layout engine, which listens to transactions, won't know the heights changed.

**Severity:** SERIOUS -- The layout engine needs to respond to CSS changes, not just document changes. This is a fundamentally different trigger mechanism.

**Mitigation:** The layout engine must also respond to:
- Window resize events
- Style changes (font size, line height, spacing)
- Image load events (async height changes)
- Any CSS change that affects block heights

Use a ResizeObserver on the editor content or individual sections to detect height changes independent of ProseMirror transactions.

---

### Attack 7.2: ColumnBlock Spanning a Page Break

**Scenario:** A 2-column layout (columnBlock) is placed near the bottom of a page. The left column has 3 short paragraphs (fits on the page). The right column has a tall image (overflows to the next page).

**Why it fails:** Columns must be side-by-side. If one column overflows the page, the columnBlock as a whole spans two pages. But the left column's content is entirely on page 1, while the right column's content spans pages 1-2. How does the layout engine render this? Options:
1. Break the columnBlock at the page boundary. Left column is cut short (empty space at bottom). Right column continues on the next page... but now it's no longer "side-by-side" with the left column. It's a single column on page 2.
2. Push the entire columnBlock to the next page (treat it as unbreakable). This leaves a large empty space at the bottom of the current page.
3. Attempt to split both columns at the page boundary and continue the layout on the next page, maintaining side-by-side structure.

Option 3 is what Word does. It's also extremely complex because it requires splitting a single ProseMirror node across two visual pages while maintaining the DOM structure.

**Severity:** SERIOUS -- The proposal doesn't address column layout across page breaks at all. This is a known hard problem (Word and InDesign handle it differently). The schema needs to at least acknowledge it.

**Mitigation:** For Phase 1, treat columnBlock as `breakHint: 'avoid'` by default. If a columnBlock is too tall for a page, break it -- but document the expected behavior. For Phase 2, implement column-aware page breaking (Option 3). This requires the layout engine to understand column heights independently.

---

### Attack 7.3: Image Width vs. Page Width

**Scenario:** User inserts an image with `attrs.width: 2000` pixels. The page is 595 CSS pixels wide (A4 at 72dpi).

**Why it fails:** The proposal says (Section 3.5, ImageNode): `width?: number | null` is a content attribute. The image "is" 2000px wide. But the page can't display 2000px. The presentation layer must scale the image down. Where does the scaling happen? The rendering layer. But the proposal's Principle 1.2 says the content schema doesn't know about layout. So the content says "2000px" and the presentation says "595px." If the user sets the image width to 2000px, saves, and reopens -- the content still says 2000px, but the image displays at 595px. Is the stored width the "intended" width or the "actual" width?

**Severity:** MANAGEABLE -- This is standard behavior (Word does the same thing: stored width can exceed page width, rendering clips/scales). But the distinction between "content width" and "display width" should be documented.

**Mitigation:** Document that `image.attrs.width` is the content width (the image's "preferred" display size). The rendering layer caps it at the available container width. No schema change needed.

---

## 8. REAL-WORLD SCENARIO ATTACKS

### Attack 8.1: Import a Word Document

**Scenario:** User imports a .docx file. Word documents have "sections" that mean something completely different: a Word section defines page layout (margins, orientation, headers/footers, column count). A Word section can change paper orientation mid-document. A SERQ section is a content grouping.

**Why it fails:** If the import maps Word sections to SERQ sections, the meaning is wrong. A Word document might have one "section" that switches from portrait to landscape for a single wide table, then back to portrait. Mapping this to three SERQ sections (portrait, landscape, portrait) creates structural breaks where the author intended none.

Conversely, Word's "headings" (Heading 1, Heading 2) are what SERQ sections should map to -- they define content structure, not page layout. But Word headings are just paragraph styles, not structural containers.

**Severity:** SERIOUS -- Word import is a critical feature for any writing app (SERQ's PRD will demand it). The schema's notion of "section" must be reconciled with Word's notion of "section."

**Mitigation:** Explicitly document that SERQ sections are NOT Word sections. Word import should:
1. Ignore Word section breaks (they're presentation, not content)
2. Create SERQ sections based on heading styles (Heading 1 = new section)
3. Map Word's page layout settings to SERQ's layout engine config, not to section attrs

---

### Attack 8.2: Copy From Google Docs

**Scenario:** User copies a chunk of formatted text from Google Docs and pastes into SERQ.

**Why it fails:** Google Docs clipboard HTML is a flat list of styled paragraphs. No sections. No structural hierarchy. ProseMirror's paste handler will parse the HTML into blocks and insert them into the current section. This works. But the Google Docs content might include headings that imply section structure.

More importantly: Google Docs wraps everything in `<b>` tags with inline styles. The `transformPasted` hook needs to clean this up. This isn't a section-specific problem, but the section layer adds a complication: does the pasted content go into the current section, or should it be split into new sections based on headings?

**Severity:** MANAGEABLE -- This is a paste-handling enhancement, not a schema bug. Paste into current section is the correct default.

**Mitigation:** Same as Attack 3.5: optional `transformPasted` hook that splits at headings.

---

### Attack 8.3: Undo a Section Merge From 50 Operations Ago

**Scenario:** User merges Section 2 into Section 1 (Backspace at start of Section 2). Then edits 50 more operations in the merged section. Then presses Cmd+Z 51 times to undo past the merge.

**Why it fails:** ProseMirror's history plugin stores inverted steps. Undoing the section merge re-creates the section boundary. But the 50 subsequent edits were made in the MERGED section (Section 1, which now contains Section 2's content). Undoing those edits after the section is re-split requires the history plugin to correctly partition the edits between the two sections. ProseMirror's step mapping handles this -- the positions are mapped through each step's inverse. But the section boundary reintroduction changes the position mapping in non-trivial ways.

The real question: after undoing the merge, does the history correctly reconstruct Section 2 with its UUID, level, numbering, and breakHint attributes? ProseMirror stores the deleted content in the inverted step, so yes -- the section node with all its attributes is restored.

**Severity:** MANAGEABLE -- ProseMirror's history handles this correctly because it stores inverted steps, not diffs. The section node is reconstructed exactly as it was.

**Mitigation:** Test this scenario thoroughly. No schema change needed.

---

### Attack 8.4: The User Who Never Wants Sections

**Scenario:** User writes a simple letter. 3 paragraphs. No headings. No structure. They don't want sections, don't know what sections are, and don't care.

**Why it fails:** The schema requires `doc > section+`. Even a 3-paragraph letter has a section wrapper. In the UI, this section might be invisible (no visual representation in continuous mode). But it's there in the DOM: `<section data-section-id="..."><p>...</p><p>...</p><p>...</p></section>`. If the user opens the HTML export, they see a `<section>` tag they didn't ask for. If they copy-paste to another app, the section wrapper might interfere.

More practically: every operation now involves an extra tree level. Drop targets have an extra depth. Position resolution has an extra hop. This is overhead with zero value for the user.

**Severity:** MANAGEABLE -- This is the cost of a consistent data model. A single section wrapping everything is a degenerate case that works correctly. The overhead is minimal (one extra node, one extra depth level).

**Mitigation:** Make sections invisible in the UI by default (no visual separator, no section handles). They appear only when the user explicitly creates section breaks or switches to outline view. The HTML export can optionally strip section wrappers for simple documents.

---

### Attack 8.5: UUID Collisions on Paste

**Scenario:** User copies Section 1 and pastes it below. Now there are two sections with identical UUIDs for every node (section, paragraphs, text runs).

**Why it fails:** INV-1 states: "Every node in the document tree has a unique UUID. No two nodes share an ID." The proposal's enforcement: "A ProseMirror plugin checks for duplicate IDs in `appendTransaction` and regenerates duplicates (can occur on paste)."

But this means: paste produces duplicate IDs -> one render frame with duplicates -> appendTransaction fires and regenerates IDs -> next frame has unique IDs. During that one frame, any code that reads the document by UUID (EdgeRegistry, cross-reference resolver, outline builder) will find two nodes for the same UUID.

Also: the `crossRef` mark on text in Section 1 points to `targetId: 'sec-002'`. After pasting, the cross-reference in the PASTED copy still points to `'sec-002'`, which is the ORIGINAL section. Should it point to the pasted copy instead? The current proposal doesn't address self-referential paste.

**Severity:** MANAGEABLE -- The duplicate ID window is one tick, and most consumers can tolerate it. Cross-reference updating on paste is an enhancement for Phase 3.

**Mitigation:** Run UUID deduplication in `transformPasted` (before the paste enters the document) rather than in `appendTransaction` (after). This eliminates the one-frame window. For cross-references, don't remap targetIds on paste -- the pasted copy's cross-references should point to the original targets, which is the correct semantic.

---

### Attack 8.6: Section Section Section -- Accidental Section Proliferation

**Scenario:** User presses Enter at the end of the document. In the current schema, this creates a new paragraph. In the new schema, what happens? If sections are `defining: true`, pressing Enter at the end of the last section creates a new paragraph within that section. Good. But what if the user uses the "Insert Section Break" command carelessly, creating 50 single-paragraph sections?

**Why it fails:** Section proliferation degrades the outline view (50 entries for 50 paragraphs), complicates section-level styling (50 sections to style individually), and creates noise. The architecture assumes sections are meaningful groupings, not one-per-paragraph.

**Severity:** MANAGEABLE -- This is a UX/education problem, not an architecture problem. The schema correctly allows single-paragraph sections.

**Mitigation:**
1. Make "Insert Section Break" a deliberate action (not a default behavior on Enter)
2. Show section count in the status bar (so users notice proliferation)
3. Offer "Merge sections" as a cleanup command
4. In outline view, visually de-emphasize single-paragraph sections

---

## 9. ADDITIONAL ATTACKS

### Attack 9.1: StyleParams Cascade Resolution at Render Time

**Scenario:** Document sets `fontFamily: 'Georgia'`. Section overrides to `fontFamily: 'Inter'`. Paragraph within section sets `fontFamily: null` (inherit). What font does the paragraph use?

**Why it fails:** INV-6 says: "A block with `styleParams.fontFamily = null` inherits from its section." So the paragraph uses 'Inter' from the section. Correct. But the cascade resolution is done by "the rendering layer" -- not the schema, not a plugin. This means every rendering component (paragraph view, heading view, code block view) must independently implement cascade resolution. That's duplication.

More importantly: what if there are THREE levels of override? Document: Georgia. Section: null (inherit from doc). ColumnBlock: Inter. Column: null (inherit from columnBlock). Paragraph in column: null (inherit from column). The cascade walks: paragraph -> column -> columnBlock -> section -> doc. But `column` doesn't have styleParams in the proposal (ColumnNode has `attrs: {}`). The cascade skips column and goes to columnBlock? Or to section? The hierarchy is paragraph -> column -> columnBlock -> section -> doc, but only some of those nodes HAVE styleParams.

**Severity:** SERIOUS -- The cascade resolution order is unspecified for containers that don't have styleParams. This will produce inconsistent rendering when blocks are inside columns vs. directly in a section.

**Mitigation:** Every node should participate in the cascade, even if its styleParams are empty (empty = all null = all inherited). Add styleParams to ColumnNode and other container nodes. Implement cascade resolution as a single utility function, not per-component.

---

### Attack 9.2: The `defining: true` Trap

**Scenario:** Section is `defining: true`. User selects all content within a section and deletes it. ProseMirror's behavior with `defining` nodes: when the content of a defining node is cleared, the node itself is preserved (with an empty paragraph auto-inserted).

**Why it fails:** This is actually correct behavior! Deleting all content within a section doesn't delete the section -- it leaves an empty section. This is good. BUT: the user might expect "delete all" to delete the section too. If they want to remove a section, they need a different operation ("Delete Section" command).

Combine with `isolating: true`: Cmd+A selects within section, Delete clears section but preserves it. User sees an empty section they can't easily remove. Pressing Backspace in the empty section should merge it with the previous section, but with `isolating: true`, it doesn't.

**Severity:** MANAGEABLE -- With `isolating: false` (as recommended in Attack 3.1), Backspace in an empty section merges with the previous section, effectively deleting the empty section. If `isolating` remains `true`, this becomes SERIOUS.

**Mitigation:** Implement "Delete empty section on Backspace" in the custom keymap handler.

---

## ARCHITECTURE KILLER LIST

The top 5 attacks that, if not addressed, will doom the architecture:

```
+------+-------+--------------------------------------------------------------+
| Rank | ID    | Attack                                                       |
+------+-------+--------------------------------------------------------------+
|  1   | 3.1   | isolating: true prevents cursor navigation across sections.  |
|      | 3.3   | Users cannot arrow-key or select across section boundaries.  |
|      |       | This makes the editor unusable for normal writing.           |
|      |       |                                                              |
|      |       | FIX: Set isolating: false. Write custom handlers for the     |
|      |       | specific operations that SHOULD respect section boundaries   |
|      |       | (lift, wrap, section-level drag).                            |
+------+-------+--------------------------------------------------------------+
|  2   | 6.1   | Migration wraps all content in a single section, making the  |
|      | 2.1   | section architecture worthless for every existing document.   |
|      |       | First user experience is the degenerate case.                |
|      |       |                                                              |
|      |       | FIX: Smart migration that splits at headings. Section        |
|      |       | split/merge commands for manual adjustment.                  |
+------+-------+--------------------------------------------------------------+
|  3   | 3.2   | Backspace at section start does nothing. Delete at section    |
|      | 4.2   | end does nothing. Two of the most common editing operations   |
|      |       | become unresponsive at section boundaries.                   |
|      |       |                                                              |
|      |       | FIX: Custom keymap handlers for joinBackward/joinForward     |
|      |       | that understand section merging.                             |
+------+-------+--------------------------------------------------------------+
|  4   | 2.2   | EdgeRegistry full rebuild on every transaction. Linear in     |
|      | 2.4   | document size. At 500 sections, 25-55ms per keystroke.       |
|      |       | Typing in large documents will visibly lag.                  |
|      |       |                                                              |
|      |       | FIX: Incremental updates via transaction mapping.            |
|      |       | Full rebuild only on structural changes.                     |
+------+-------+--------------------------------------------------------------+
|  5   | 5.1   | pageBreakBefore in attrs AND breakHint in meta. Two systems  |
|      | 4.1   | for the same concept. Combined with the block/container      |
|      |       | group confusion, the spec has internal contradictions that    |
|      |       | will produce bugs at every integration point.                |
|      |       |                                                              |
|      |       | FIX: One truth per concept. Remove pageBreakBefore, use      |
|      |       | breakHint only. Remove columnBlock from 'block' group.       |
+------+-------+--------------------------------------------------------------+
```

### Final Verdict

The architecture is sound. The section node is the right abstraction. But the devil is in the `isolating: true` flag, the naive migration, the duplicate break systems, and the EdgeRegistry performance assumptions. Fix those four things and this schema will hold up through production.

The biggest risk isn't any individual attack -- it's the compound effect of #1 and #3. If users can't navigate across sections AND can't delete section boundaries, sections become prisons, not paragraphs. The user will spend more time fighting the section structure than benefiting from it. That's the scenario that kills SERQ, not a performance regression.

---

*Stress-tested against SERQ codebase commit `de5322a` and Schema Architect Round 1 proposal dated 2026-02-06.*
