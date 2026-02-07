# SERQ Content Schema -- Viable Systems Analysis

**Role:** Viable Systems Theorist (Cybernetics & Systems Theory Advisor)
**Date:** 2026-02-06
**Status:** Round 2 -- Viability Audit of Schema Architect's Round 1 Proposal
**Analyzing:** `round1-schema-architect.md`

---

## Preamble: The Lens

Stafford Beer's Viable System Model (VSM) asks one question of every system at every level of recursion: **can this unit survive on its own?** Not thrive -- survive. A viable system maintains its identity, regulates its internal state, and adapts to environmental perturbation without requiring a higher authority to intervene on every transaction. If a cell needs the organ to tell it how to metabolize, the organism is already dying.

The Schema Architect's proposal is a content ontology. I am treating each hierarchical level as a viable system-in-focus, and testing whether it meets the five necessary and sufficient conditions for viability. I am also testing whether the relationships between levels preserve autonomy or create pathological dependency.

---

## 1. RECURSIVE VIABILITY TEST

For each level, I test four properties:
- **Self-description:** Can it describe itself without reference to its parent?
- **Portability:** Can it maintain internal consistency when moved to a different context?
- **Self-sufficiency:** Does it contain enough metadata to be rendered in isolation?
- **Homeostasis:** Can it adapt when its children change?

### Level 0-1: Atom / TextRun

```
Self-description:   PARTIALLY VIABLE
Portability:        VIABLE
Self-sufficiency:   NOT VIABLE
Homeostasis:        N/A (leaf nodes)
```

**Reasoning:**

A `TextRunNode` knows what it is: it has `type: 'text'`, `attrs.text: string`, and `marks: SerqMark[]`. It can describe its own content and formatting. Good.

Portability is solid. A text run with `marks: [{ type: 'bold' }]` and `attrs: { text: 'quick' }` means the same thing regardless of whether it sits inside a paragraph, a heading, or a code block. The marks travel with it. The text travels with it. Moving a text run to a different parent does not change what it IS.

But self-sufficiency fails. A text run with `styleParams: {}` (all null) cannot be rendered in isolation because **it has no type-level default styles and the cascade resolution depends on its ancestors**. The proposal in Section 3.2 says: "Null means inherit from parent or use default." But the text run itself has no knowledge of what "default" means. The rendering layer resolves the cascade -- the node does not carry a resolved snapshot.

This is the correct design for an embedded node (you do not want 50,000 text runs each carrying `fontFamily: 'Inter'`). But it means a text run is not self-sufficient. It is a component, not a system. This is fine -- Beer himself noted that the atom of a recursive system does not need to be viable. Amino acids are not viable. Proteins are not viable. The cell is the first viable unit.

**Verdict: ACCEPTABLE.** Text runs are components, not systems. No viability expected at this level.

---

### Level 2: Block (Paragraph, Heading, CodeBlock, Image, HorizontalRule)

```
Self-description:   VIABLE
Portability:        PARTIALLY VIABLE
Self-sufficiency:   PARTIALLY VIABLE
Homeostasis:        VIABLE
```

**Reasoning:**

Self-description is clean. A `ParagraphNode` with `type: 'paragraph'`, `content: InlineNode[]`, and `styleParams: { textAlign: 'center', lineHeight: 1.8 }` fully describes what it is and how it prefers to look. A `HeadingNode` with `attrs: { level: 2 }` knows it is a second-level heading. The `id` field gives stable identity. The `meta` field gives temporal context. A block can answer the question "what are you?" without consulting anyone.

Portability is where the first crack appears. Consider a `ParagraphNode` with `styleParams.fontFamily = null`. Inside Section A (which has `styleParams.fontFamily = 'Georgia'`), this paragraph renders in Georgia. Move it to Section B (which has `styleParams.fontFamily = 'Courier'`), and it now renders in Courier. The paragraph's IDENTITY is preserved (same content, same marks), but its PRESENTATION changes based on context.

This is a design choice, not a bug -- the cascade is intentional. But it means portability is only partial. The paragraph's meaning is portable; its appearance is not. If you copy a paragraph from one document into another, it will look different if the target document has different section/document defaults.

Self-sufficiency is the same issue. A block with all-null styleParams cannot render itself without knowing its ancestors' styles. A block with ALL styleParams explicitly set IS self-sufficient. The schema allows both states, which is correct, but the common case (most params null, relying on cascade) is not self-sufficient.

Homeostasis is viable. When a text run inside a paragraph changes (user edits text), the paragraph's identity, type, marks, styleParams, and meta are all unaffected. The paragraph absorbs child mutations without structural change. ProseMirror's content expressions enforce that children remain valid (only inline nodes allowed). If an invalid child is inserted, the schema rejects it. This is homeostatic regulation.

**Verdict: PARTIALLY VIABLE.** The cascade dependency on parent context weakens portability and self-sufficiency. The block is viable as a structural unit but not as a presentational unit in isolation.

---

### Level 3: Container (ColumnBlock, Blockquote, BulletList, OrderedList, Callout)

```
Self-description:   VIABLE
Portability:        PARTIALLY VIABLE
Self-sufficiency:   PARTIALLY VIABLE
Homeostasis:        VIABLE (with one critical exception)
```

**Reasoning:**

Self-description is strong. A `ColumnBlockNode` with `attrs: { columns: 2, columnWidths: [0.6, 0.4], gutter: 24 }` completely describes its layout intention. A `BulletListNode` knows it is an unordered list. These nodes are self-aware.

Portability: same cascade issue as blocks. Additionally, `ColumnNode` has a specific fragility: its `attrs: {}` is empty, and the column's WIDTH comes entirely from the parent `ColumnBlockNode.attrs.columnWidths`. A column moved to a different parent has no idea how wide it should be. This is a viability failure: the column is **structurally dependent on its parent for a rendering-critical parameter**.

This matters. Imagine dragging a column out of a 3-column layout into a 2-column layout. The column's width information does not travel with it. The receiving ColumnBlock must recalculate widths. This is currently handled by the normalize plugin, but from a systems-theory perspective, the column is not a viable unit -- it is an appendage of its parent.

Homeostasis: Containers regulate their children through ProseMirror content expressions. A blockquote that loses all its children gets a paragraph auto-inserted (content expression `block+` requires at least one). This is active homeostasis. Lists that gain or lose items remain valid lists.

**The critical exception is ColumnBlock.** INV-3 (Column Count Consistency) requires that `columns` attr equals actual child count and `columnWidths` sums to 1.0. When a column is added or removed, the ColumnBlock must update THREE interdependent attributes (`columns`, `columnWidths`, `columnGutter` layout). This is maintained by the normalize plugin -- an EXTERNAL regulator. The ColumnBlock does not regulate itself; it depends on a plugin to maintain its invariants. This is a System 3 intervention from outside, not internal homeostasis.

**Verdict: PARTIALLY VIABLE.** Containers are structurally sound but the ColumnBlock/Column relationship violates viability principles. The Column is not viable without its parent. The ColumnBlock is not homeostatic without external regulation.

---

### Level 4: Section

```
Self-description:   VIABLE
Portability:        VIABLE
Self-sufficiency:   PARTIALLY VIABLE
Homeostasis:        VIABLE
```

**Reasoning:**

Self-description is excellent. A `SectionNode` with `attrs: { level: 2, numbering: 'decimal', pageBreakBefore: true }`, `styleParams`, and `meta: { bookmark: 'methodology' }` fully describes its structural role, its presentation preferences, and its semantic identity. It knows what it is.

Portability is strong -- stronger than blocks. A section moved from one document to another carries its content, its styling hints, its break preferences, its bookmark, and its heading level. It does not depend on sibling sections for its identity. The numbering might change (section numbering is positional), but the section's CONTENT and STRUCTURE are fully portable. This is the right level of recursion for the first truly portable unit.

Self-sufficiency: almost there. A section with explicit styleParams on all its blocks can render in isolation. A section with cascade-dependent blocks cannot. Additionally, the section's `attrs.numbering` is a display hint that requires knowledge of sibling sections to resolve (you cannot compute "Section 3" without knowing about Sections 1 and 2). So a section in isolation can render its content but not its number. This is a minor gap.

There is a larger self-sufficiency concern: **the section has no knowledge of the document-level defaults it inherits from**. If `StyleParams` cascade from doc -> section -> block, and the section has `styleParams.fontFamily = null`, it depends on the document's fontFamily. A section extracted and placed into a different document will inherit THAT document's fontFamily. The section's rendered appearance is document-dependent.

Homeostasis is solid. When blocks within a section are added, removed, or reordered, the section's own identity and attributes are unaffected. ProseMirror's content expression `(block | container)+` ensures at least one child always exists. The section absorbs content mutations without structural damage.

**Verdict: VIABLE.** The section is the first fully viable structural unit in the hierarchy. Minor self-sufficiency gaps from cascade inheritance are acceptable because the section carries enough information to be meaningful in isolation, even if its exact visual rendering is context-dependent.

---

### Level 5: Document

```
Self-description:   VIABLE
Portability:        VIABLE
Self-sufficiency:   VIABLE
Homeostasis:        VIABLE
```

**Reasoning:**

A `DocNode` is the top of the cascade. It has `attrs: { lang, dir }`, `meta: { title, author, summary }`, and `styleParams` that serve as the cascade root. It depends on nothing above it. It describes itself completely. It can be rendered in isolation (it IS the isolation context). When its children (sections) change, the document's identity persists.

The document satisfies all five VSM subsystems (mapped in Section 2 below).

**Verdict: VIABLE.** Full viability. This is the organism.

---

### Summary Table

```
+------------------+------------------+--------------+-----------------+--------------+----------+
| Level            | Self-description | Portability  | Self-sufficiency | Homeostasis  | Verdict  |
+------------------+------------------+--------------+-----------------+--------------+----------+
| 0-1: Atom/Text   | Partial          | Viable       | Not viable       | N/A          | COMPONENT|
| 2:   Block        | Viable           | Partial      | Partial          | Viable       | PARTIAL  |
| 3:   Container    | Viable           | Partial      | Partial          | Viable*      | PARTIAL  |
| 4:   Section      | Viable           | Viable       | Partial          | Viable       | VIABLE   |
| 5:   Document     | Viable           | Viable       | Viable           | Viable       | VIABLE   |
+------------------+------------------+--------------+-----------------+--------------+----------+

* ColumnBlock homeostasis depends on external normalize plugin
```

The first fully viable level is the SECTION. This is the correct answer. Beer would call this the "recursion base" -- the smallest unit that exhibits all five subsystems. Everything below is a component; everything at and above is a system.

---

## 2. FIVE SUBSYSTEMS MAPPING

### Level 2: Block (Paragraph as exemplar)

```
System 1 (Operations):    Holds and displays inline content. Processes text runs.
                          A paragraph's "operation" is being a renderable text container.

System 2 (Coordination):  Sibling coordination is ABSENT at block level.
                          Blocks do not coordinate with each other. They are ordered
                          by their parent and rendered sequentially. There is no
                          block-to-block protocol.
                          DIAGNOSIS: Anti-oscillation is handled by the parent
                          (section/container), not by the blocks themselves.

System 3 (Control):       The parent (section or container) controls the block through:
                          - Content expression grammar (what children are allowed)
                          - Cascade resolution (inherited styles)
                          - Ordering (position in content array)
                          The block has NO upward reporting channel to its parent.
                          This is pure top-down control. Problematic if the parent
                          needs to know about block-level state changes.

System 4 (Intelligence):  ABSENT. A block does not sense its environment.
                          It does not know if it is the first block in a section,
                          the only block, or one of 500. It does not adapt its
                          behavior based on context.
                          DIAGNOSIS: This is acceptable for a component. Blocks
                          should not need environmental awareness.

System 5 (Policy):        The block's invariant rules:
                          - Must contain valid inline content (enforced by schema)
                          - Must have a unique ID (enforced by plugin)
                          - Must have a valid type (enforced by TypeScript union)
                          These are externally imposed, not self-regulated.
```

**Assessment:** Blocks are System 1 operational units. They do work. They do not coordinate, control, sense, or self-govern. This is the correct design for a component within a viable system.

---

### Level 4: Section

```
System 1 (Operations):    Contains and organizes blocks/containers.
                          A section's "operation" is grouping related content into
                          a coherent structural unit. It is the unit of outline,
                          the unit of page flow, the unit of drag-and-drop.

System 2 (Coordination):  Sibling coordination exists through:
                          - Numbering: sections coordinate with siblings to produce
                            sequential numbers (Section 1, 2, 3). This requires
                            a coordination mechanism.
                          - Break hints: pageBreakBefore on section N affects where
                            section N-1 ends visually.
                          DIAGNOSIS: The EdgeRegistry (Section 4.3) provides the
                          coordination data. sectionOrder: string[] is the System 2
                          channel. This is DERIVED data, not structural -- it is
                          recomputed on every doc change. This is correct. System 2
                          should be lightweight and responsive, not heavy and static.

System 3 (Control):       The document controls sections through:
                          - Content expression (section+ means at least one)
                          - Style cascade (doc-level defaults flow to sections)
                          - Ordering (position in doc.content)
                          The document also performs AUDIT via the EdgeRegistry:
                          sectionMembership, sectionOrder, and crossRefTargets
                          are all System 3* (audit) functions.

System 4 (Intelligence):  PARTIALLY PRESENT. The section senses its environment
                          through:
                          - breakHint metadata (awareness of layout context)
                          - level attr (awareness of hierarchical position)
                          - bookmark attr (awareness of cross-reference role)
                          But the section does NOT sense:
                          - Its own rendered height (layout-dependent)
                          - Whether its content fits on a page (layout-dependent)
                          - Whether its cross-references are valid (EdgeRegistry-dependent)
                          DIAGNOSIS: The section is environmentally aware in the
                          structural domain but blind in the layout domain. This is
                          the correct separation -- layout awareness belongs to the
                          layout engine, not the content schema.

System 5 (Policy):        The section's invariant rules:
                          - Must contain at least one block/container (content expr)
                          - Must have a unique ID
                          - Cannot nest inside another section
                          - Must maintain valid children types
                          These are a mix of self-enforced (via schema) and
                          externally audited (via normalize plugin) invariants.
```

**Assessment:** Sections exhibit all five subsystems, though System 4 is partial. This is the first level that COORDINATES with siblings, SENSES its environment, and SELF-REGULATES. The section is viable.

---

### Level 5: Document

```
System 1 (Operations):    Holds sections. Is the root container.
                          The document's "operation" is being the complete,
                          self-contained content artifact.

System 2 (Coordination):  The document coordinates its children (sections) through:
                          - The EdgeRegistry (derived section ordering)
                          - Style cascade (document-level defaults)
                          - The layout engine (page assignment)
                          All three are System 2 anti-oscillation mechanisms.

System 3 (Control):       The document controls sections through:
                          - Content expression (section+)
                          - Schema validation (appendTransaction hooks)
                          - Normalize plugins (INV-1 through INV-7)
                          System 3* (audit): The EdgeRegistry's crossRefTargets
                          and bookmarks maps are audit channels that report on
                          the state of the document without modifying it.

System 4 (Intelligence):  The document senses its environment through:
                          - LayoutConfig (page size, margins, mode)
                          - External signals (pagination toggle, zoom level)
                          - User intent (break hints, section ordering)
                          The layout engine IS System 4: it takes environmental
                          input (page size, mode) and produces adaptive output
                          (page assignments, break positions).

System 5 (Policy):        The document's invariant rules:
                          - At least one section (content expr)
                          - All node IDs unique (INV-1)
                          - All sections contain valid content (INV-2)
                          - All cross-references valid (INV-5)
                          - Style cascade coherent (INV-6)
                          These are the CONSTITUTIONAL rules of the document.
                          They are enforced by the schema and plugin system.
```

**Assessment:** Full viability. The document is the top-level viable system. All five subsystems are present and well-defined.

---

## 3. VARIETY ANALYSIS (Ashby's Law)

Ashby's Law of Requisite Variety states: **a controller must have at least as many states as the system being controlled.** If the content can be in more states than the schema can represent, the schema attenuates variety (loses expressiveness). If the schema has more parameters than the content needs, it amplifies variety (adds noise).

### Level 0-1: Atom / TextRun

**Content variety:** A text run can have any UTF-8 string content, combined with any subset of 12 mark types, each with their own attribute space. The combinatorial variety is effectively infinite.

**Schema variety:** `attrs.text: string` (infinite), `marks: SerqMark[]` (power set of 12 types with attributes). The schema matches the content variety. `styleParams` on text runs are empty (all null) -- this is correct because inline styling is handled by marks (`textStyle`), not by styleParams.

**Assessment: MATCHED.** No attenuation, no amplification.

### Level 2: Block

**Content variety:** A paragraph can contain any sequence of inline nodes. Its presentation can vary across: textAlign (4 values), lineHeight (continuous), letterSpacing (continuous), fontFamily (string), fontSize (continuous), fontWeight (9 values), color (24-bit), spacingBefore/After (continuous), backgroundColor (24-bit), and the extensible `[key: string]: unknown` catch-all.

**Schema variety:** The `StyleParams` interface covers all of the above. The catch-all index signature `[key: string]: unknown` ensures the schema can represent ANY future style parameter without migration.

**However**, there is a specific case of VARIETY ATTENUATION in the `ParagraphNode` definition (Section 3.5). The paragraph's styleParams include `blockFontFamily`, `blockFontSize`, `blockFontWeight`, `blockColor` -- these are DUPLICATES of the base StyleParams fields (`fontFamily`, `fontSize`, `fontWeight`, `color`). The proposal introduces two naming conventions for the same concept:

```typescript
styleParams: StyleParams & {
    blockFontFamily?: string | null    // <-- duplicate of fontFamily?
    blockFontSize?: string | null      // <-- duplicate of fontSize?
    blockFontWeight?: string | null    // <-- duplicate of fontWeight?
    blockColor?: string | null         // <-- duplicate of color?
}
```

This creates ambiguity: which takes precedence, `fontFamily` or `blockFontFamily`? The schema has MORE parameters than needed (variety amplification) AND ambiguous resolution rules (variety noise).

**Assessment: AMPLIFIED with noise.** The `block*` prefix duplicates need resolution or elimination. (See Section 6, Challenge #1.)

### Level 3: Container

**Content variety:** A ColumnBlock can have 2-4 columns, each with any number of blocks, with widths summing to 1.0 and a gutter value. The variety space is: `columns in {2,3,4}` x `columnWidths in R^n where sum=1` x `gutter in R+` x `children: BlockNode[]^n`.

**Schema variety:** `attrs.columns: number`, `attrs.columnWidths: number[]`, `attrs.gutter: number`, `content: ColumnNode[]`. This matches.

But there is a hidden variety gap: **the Column node has no `width` attribute.** Its width is derived from the parent's `columnWidths` array by INDEX position. This means the schema cannot represent "this column should be 40% wide" at the column level. The variety exists in the system (columns have widths) but the schema attenuates it by placing the information one level up.

**Assessment: ATTENUATED at Column level.** Width is a column property represented on the parent. (See Section 6, Challenge #2.)

### Level 4: Section

**Content variety:** A section can have: a heading level (7 values including null), numbering style (5 values including null), a page break flag (boolean), optional column layout (columns, widths, gutter), any combination of blocks/containers as children, style overrides, and metadata.

**Schema variety:** All of the above are represented in `SectionNode.attrs`. The extensible StyleParams and NodeMeta cover additional states.

One variety gap: **section nesting is prohibited.** The proposal states sections are flat within doc. But document content genuinely has hierarchical sections: Part I > Chapter 1 > Section 1.1 > Subsection 1.1.1. The schema attenuates this variety by flattening it. The `level` attr partially compensates (it records the intended nesting depth), but structurally, all sections are siblings.

The proposal acknowledges this (Section 12.1) and offers a future `subsection` type. But from a variety analysis: **the current schema cannot represent the nesting variety that exists in real documents.** It forces heading-level-implied hierarchy instead of structural hierarchy.

**Assessment: ATTENUATED for hierarchical documents.** Flat sections lose nesting variety. The `level` attr is a metadata workaround, not a structural solution.

### Level 5: Document

**Content variety:** A document can have any number of sections with any content, any language/direction, and any metadata.

**Schema variety:** `DocNode` covers all of this.

**Assessment: MATCHED.** No variety gaps at document level.

### Variety Summary

```
+-----------+--------------------+---------------------------------------------------+
| Level     | Variety Status     | Gap                                               |
+-----------+--------------------+---------------------------------------------------+
| TextRun   | Matched            | None                                              |
| Block     | Amplified (noise)  | block* prefix duplicates in ParagraphNode          |
| Container | Attenuated         | Column width not represented at Column level       |
| Section   | Attenuated         | No structural nesting (flat sections)              |
| Document  | Matched            | None                                               |
+-----------+--------------------+---------------------------------------------------+
```

---

## 4. FRAGILITY DETECTION

I now probe the schema with four perturbation types.

### Perturbation 1: Node Moved to a Different Parent

**Scenario A: Paragraph moved from Section A to Section B.**
- Content and marks: PRESERVED. No change.
- Style cascade: BROKEN. The paragraph's inherited styles change because it now inherits from Section B's styleParams instead of Section A's. If both sections have identical styleParams, no visible change. If they differ, the paragraph looks different.
- Identity: PRESERVED. UUID is stable.
- Cross-references TO this paragraph: PRESERVED. UUID-based targeting survives moves.
- Cross-references FROM this paragraph: PRESERVED. The crossRef marks travel with it.
- **Fragility rating: LOW.** Cascade change is by design, not by accident.

**Scenario B: Column moved from ColumnBlock A (3-col) to ColumnBlock B (2-col).**
- Content: PRESERVED.
- Width: **LOST.** The column's width is determined by parent's `columnWidths[index]`. Moving the column changes its index position and its parent's width array. Neither the column nor the receiving parent knows what width the column "should" be.
- **Fragility rating: HIGH.** The column is structurally incomplete without parent context.

**Scenario C: Block moved from inside a column to top-level section.**
- Content: PRESERVED.
- Structural position: Changes from `section > columnBlock > column > block` to `section > block`. The block loses its column context. The source column might become empty, triggering the normalize plugin's cleanup logic (documented in SESSION-HANDOVER.md: `cleanupSourceColumn`).
- **Fragility rating: MEDIUM.** The cleanup is handled but requires external regulation.

### Perturbation 2: Node Rendered in a Different Presentation Mode

**Scenario: Same document rendered in continuous, paginated, slide, and outline modes.**

The schema proposal claims this is the core value proposition (Section 1.2: Presentation Agnosticism). Let me test it.

- `pageBreakBefore: true` on a section:
  - Continuous mode: ignored (by design). No fragility.
  - Paginated mode: respected. Forces a page break.
  - Slide mode: "one section per slide" makes this redundant. No fragility.
  - Outline mode: irrelevant. No fragility.
  - **Assessment: CLEAN.** The hint is properly advisory.

- `meta.breakHint: 'avoid'` on a large block:
  - Paginated mode: the layout engine tries to keep it on one page. If the block is taller than a page, the hint is overridden (INV-7).
  - **Assessment: CLEAN.** The override safety valve prevents impossible states.

- Section columns (`attrs.columns: 2`):
  - Slide mode: a 2-column section rendered as a slide. Does this work? The proposal does not address column layout in slide mode. A section with `columns: 2` in slide mode would either: (a) render with two columns on the slide, or (b) ignore the column setting. Neither is specified.
  - **Fragility rating: MEDIUM.** Unspecified behavior in mode transitions.

- ColumnBlock inside a section in outline mode:
  - Outline mode shows section tree collapsed. When expanded, should it show the column layout or linearize the content? Unspecified.
  - **Fragility rating: LOW.** Outline mode is a future feature; the schema does not preclude either approach.

### Perturbation 3: Children Reordered

**Scenario A: Blocks within a section reordered.**
- No block depends on its sibling position. No numbering is block-level (unlike sections). Reordering is safe.
- Cross-references: UUID-based, so reordering does not break them.
- **Fragility rating: NONE.** Clean.

**Scenario B: Sections within a document reordered.**
- Section numbering changes (Section 1 becomes Section 3). The EdgeRegistry recomputes `sectionOrder`.
- Cross-references that use `displayFormat: 'number'` will show updated numbers. The `targetId` UUID is stable, so the link does not break -- only the displayed label changes.
- `pageBreakBefore` on sections: still respected, but the page layout changes because content flows differently.
- **Fragility rating: LOW.** All changes are derived and recomputed, not structural.

**Scenario C: Columns within a ColumnBlock reordered.**
- Column widths are stored as `columnWidths: [0.6, 0.4]` on the parent. Swapping columns 1 and 2 would make the formerly-60%-wide column render at 40% because widths are positional, not associated with specific columns.
- **Fragility rating: HIGH.** Column width is index-coupled, not identity-coupled. Reordering columns changes their widths. (See Section 6, Challenge #2.)

### Perturbation 4: Node Duplicated or Referenced from Multiple Places

**Scenario A: Section duplicated (copy-paste).**
- UUID duplication: INV-1 requires unique IDs. The paste handler must regenerate UUIDs. The proposal addresses this (Section 6, INV-1: "IDs are generated on node creation and preserved through cut/copy/paste/undo/redo" with "A ProseMirror plugin checks for duplicate IDs in `appendTransaction` and regenerates duplicates").
- Cross-references to the ORIGINAL section: still valid (original UUID preserved).
- Cross-references IN the duplicate: the duplicated crossRef marks point to the original targets, which is correct.
- Cross-references FROM ELSEWHERE to the duplicate: impossible until the duplicate gets its new UUID and something creates a reference to it.
- **Fragility rating: LOW.** UUID regeneration handles this.

**Scenario B: Block referenced from two places (transclusion).**
- The proposal does NOT support transclusion. Every node has exactly one parent (ProseMirror tree constraint). A block cannot exist in two places simultaneously.
- The `crossRef` mark references a node but does not INCLUDE it. There is no "embed by reference" mechanism.
- **Fragility rating: N/A.** Not supported, and the proposal is honest about this (tree-only structure). This is a variety attenuation -- the system cannot represent content that exists in multiple locations -- but it is a deliberate simplification.

### Fragility Summary

```
+--------------------------------------------+----------+-------------------------------------------+
| Perturbation                               | Rating   | Root Cause                                |
+--------------------------------------------+----------+-------------------------------------------+
| Block moved between sections               | LOW      | Cascade change is by design               |
| Column moved between ColumnBlocks          | HIGH     | Width stored on parent, not column        |
| Block moved out of column                  | MEDIUM   | External cleanup required                 |
| Section columns in slide mode              | MEDIUM   | Unspecified cross-mode behavior            |
| Block reordering within section            | NONE     | No positional dependencies                |
| Section reordering within document         | LOW      | Derived data recomputed                   |
| Column reordering within ColumnBlock       | HIGH     | Width is index-coupled, not id-coupled    |
| Node duplication (paste)                   | LOW      | UUID regeneration handles it              |
| Multi-location reference (transclusion)    | N/A      | Not supported (deliberate)                |
+--------------------------------------------+----------+-------------------------------------------+
```

The two HIGH-fragility items both involve the Column node. This is the most fragile unit in the schema.

---

## 5. PRINCIPLES DOCUMENT

The following principles are derived from the Viable System Model and the analysis above. They are non-negotiable architectural constraints for the final schema.

### Principle 1: THE RECURSION BASE IS THE SECTION

The section is the smallest viable unit. Every architectural decision must preserve section-level viability. A section must be extractable, movable, serializable, and renderable without reference to its siblings or parent. Operations that break section self-sufficiency are architectural regressions.

### Principle 2: COMPONENTS BELOW, SYSTEMS ABOVE

Nodes below the section (blocks, text runs) are components. They are not expected to be viable in isolation. They exist to serve the section. Nodes at and above the section (section, document, future composition) are systems. They must exhibit all five VSM subsystems: operations, coordination, control, intelligence, and policy.

### Principle 3: NO DEPENDENT IDENTITY

A node's identity (what it IS) must never depend on its parent. A paragraph is a paragraph regardless of whether it sits in a section, a column, or a blockquote. A column's width, however, is currently parent-dependent -- this must be resolved. Every node must carry enough information to answer "what am I?" without traversing upward.

### Principle 4: CASCADES ARE EXPLICIT

The style cascade (doc -> section -> block) is a legitimate coordination mechanism, but it must be EXPLICITLY SPECIFIED as such. The schema must document: (a) which fields cascade, (b) in what order, and (c) what the root defaults are when no ancestor provides a value. Implicit cascades are hidden dependencies. Hidden dependencies are system death.

### Principle 5: EXTERNAL REGULATORS MUST BE DOCUMENTED AS SYSTEM 3

The normalize plugin, the EdgeRegistry, the layout engine, and the UUID dedup plugin are all System 3 (control) mechanisms that maintain invariants from outside the nodes themselves. Each must be treated as an ARCHITECTURAL COMPONENT, not an implementation detail. If the normalize plugin fails to run, the ColumnBlock becomes inconsistent. That dependency must be explicit in the schema spec.

### Principle 6: COORDINATION IS DERIVED, NEVER STORED

Section numbering, cross-reference labels, page assignments, and figure numbers are all derived data. They must never be stored in the content tree. They are recomputed by System 2 (EdgeRegistry, layout engine) on every document change. Storing derived data creates synchronization obligations that violate the single-source-of-truth principle.

### Principle 7: ADVISORY HINTS, NEVER COMMANDS

Layout-related metadata (breakHint, pageBreakBefore, columns) must always be advisory. The layout engine respects them when physically possible and overrides them when not. No content-level metadata should be able to create an impossible layout state. INV-7 enshrines this correctly.

### Principle 8: PORTABILITY OVER BEAUTY

When forced to choose between a node looking identical in its new context vs. maintaining its structural integrity, always choose structural integrity. A paragraph that inherits different fonts after being moved is acceptable. A paragraph that loses content or breaks its invariants after being moved is not.

### Principle 9: VARIETY CHANNELS MUST BE UNAMBIGUOUS

Every property of a node must have exactly ONE authoritative source. If `fontFamily` exists in both `styleParams.fontFamily` and `styleParams.blockFontFamily`, the schema has two channels for the same variety. This creates ambiguity, which creates bugs. One property, one name, one resolution path.

### Principle 10: THE SCHEMA IS THE CONTRACT

The schema specification is not aspirational -- it is contractual. Every plugin, every layout engine, every interaction handler, and every serializer operates against this contract. If the contract says sections cannot nest, NOTHING in the system should assume they might. If the contract says IDs are unique, NOTHING should handle the case where they are not (except the enforcement mechanism itself).

---

## 6. SPECIFIC CHALLENGES

### Challenge #1: The `block*` Prefix Duplication in ParagraphNode

**The problem:**

```typescript
interface ParagraphNode extends SerqNodeBase {
  styleParams: StyleParams & {
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null
    lineHeight?: number | null
    letterSpacing?: number | null
    blockFontFamily?: string | null     // <--- DUPLICATES StyleParams.fontFamily
    blockFontSize?: string | null       // <--- DUPLICATES StyleParams.fontSize
    blockFontWeight?: string | null     // <--- DUPLICATES StyleParams.fontWeight
    blockColor?: string | null          // <--- DUPLICATES StyleParams.color
  }
}
```

The base `StyleParams` interface already defines `fontFamily`, `fontSize`, `fontWeight`, and `color`. The `ParagraphNode` adds `blockFontFamily`, `blockFontSize`, `blockFontWeight`, and `blockColor`. This creates two channels for the same variety.

**Why this violates VSM:** System 5 (Policy) requires unambiguous invariant rules. If a paragraph has `styleParams.fontFamily = 'Georgia'` AND `styleParams.blockFontFamily = 'Courier'`, which wins? The schema does not specify resolution order. This is a policy vacuum.

**What I suspect happened:** The Schema Architect preserved existing TipTap extension naming (`BlockTypography` extension uses `blockFontFamily`, etc.) alongside the new abstract `StyleParams` fields. This is a merge conflict between the old naming convention and the new ontology.

**Recommendation:** Eliminate the `block*` prefix fields. Use the base `StyleParams` fields exclusively. If the `BlockTypography` extension needs different attribute names, the ProseMirror attribute mapping layer handles the translation. The conceptual model should have ONE name per concept.

---

### Challenge #2: Column Width is Parent-Dependent

**The problem:**

```typescript
interface ColumnNode extends SerqNodeBase {
  type: 'column'
  content: BlockNode[]
  attrs: {}             // <--- EMPTY. No width information.
}
```

A column does not know its own width. Its width is determined by the parent ColumnBlock's `columnWidths[index]`, where `index` is the column's position among siblings. This means:

1. A column extracted from its parent loses width information.
2. Reordering columns changes their widths (index-coupled, not id-coupled).
3. The column cannot describe itself without reference to its parent.

**Why this violates VSM:** Principle 3 (No Dependent Identity). The column's rendering-critical property (width) is not part of its own state. This is like a cell that does not know its own membrane permeability -- it depends on the organ to tell it.

**Recommendation:** Add `width: number` (as a fraction 0-1) to `ColumnNode.attrs`. The parent ColumnBlock's `columnWidths` becomes a DERIVED array computed from children's widths, not a source of truth. This inverts the dependency: columns own their widths; the parent aggregates them. The normalize plugin validates that the sum equals 1.0 and adjusts if needed.

This change makes columns portable. A column dragged to a new ColumnBlock carries its width with it. The receiving ColumnBlock's normalize plugin adjusts all widths to fit.

---

### Challenge #3: The EdgeRegistry is a Single Point of Failure

**The problem:**

The `EdgeRegistry` (Section 4.3) is a derived data structure maintained by a single ProseMirror plugin. It provides:
- Node position mapping
- Section membership
- Section ordering
- Bookmark resolution
- Cross-reference resolution

If this plugin fails to run (e.g., it throws an error, or a transaction bypasses `appendTransaction`), the entire cross-reference system, section numbering, and page assignment system become stale.

**Why this violates VSM:** System 2 (Coordination) and System 3* (Audit) are bundled into a single mechanism with no redundancy. In a viable system, the coordination channel should be robust to partial failure. If the EdgeRegistry fails, there is no fallback.

**Recommendation:** The EdgeRegistry should be split into independent, narrowly-scoped plugins:
1. **NodePositionPlugin:** maintains UUID -> position mapping.
2. **SectionOrderPlugin:** maintains section ordering.
3. **CrossRefPlugin:** validates and resolves cross-references.
4. **BookmarkPlugin:** maintains bookmark -> UUID mapping.

Each is a separate System 2 channel. If one fails, the others continue functioning. A broken cross-reference does not prevent section numbering from working.

---

### Challenge #4: Section Nesting is a Deferred Variety Problem

**The problem:**

The proposal prohibits section nesting (Section 12.1): "Flat sections are simpler to implement, reason about, and interact with."

The proposed escape hatch is: "If true nesting is needed later, a `subsection` type can be added inside section without changing the doc-level grammar."

**Why this is a systems risk:** Ashby's Law says you cannot regulate a system with more variety than your controller has. Academic papers, legal documents, technical manuals, and books all have deep hierarchical structure. A flat section list cannot REPRESENT this variety. The `level` attr is a metadata workaround that RECORDS the intended depth without ENFORCING it.

Consider: a user creates sections with `level: [1, 2, 2, 3, 3, 2, 1, 2]`. The schema cannot enforce that a level-3 section follows a level-2 section. There is no structural constraint preventing `level: [1, 3, 1, 5, 2]`. The `level` attr is a LABEL, not a STRUCTURAL RELATIONSHIP.

**However:** I partially agree with the Schema Architect's decision to defer nesting. Recursive section nesting introduces significant complexity in:
- Drag-and-drop (which nesting level are you targeting?)
- Outline manipulation (indent/outdent)
- Schema validation (content expressions for recursive types)
- Migration (existing flat documents)

**Recommendation:** Accept flat sections for Phase 1, but the schema spec must explicitly state that `level` attrs are NOT structurally enforced and MAY be inconsistent. The EdgeRegistry should include a `sectionHierarchy` computed property that VALIDATES level consistency and reports violations. This makes the unstructured nature visible rather than hiding it.

Additionally, the future `subsection` escape hatch should be prototyped NOW (at the type level, not implementation) to verify it does not require a breaking schema change when introduced.

---

### Challenge #5: The Style Cascade Has No Defined Root

**The problem:**

INV-6 (Style Cascade) states: "A section with `styleParams.fontFamily = null` inherits from the document-level style (managed by styleStore)."

The cascade chain is: `doc.styleParams -> section.styleParams -> block.styleParams`. But the `DocNode` itself can have `styleParams.fontFamily = null`. What then?

The proposal says the fallback is "managed by styleStore" -- a Zustand store OUTSIDE the document tree. This means the cascade's root is NOT in the content schema. It is in application state.

**Why this violates VSM:** Principle 4 (Cascades Are Explicit) requires the cascade to have a fully specified resolution path WITHIN the schema contract. If the root of the cascade is an external store, then the document is not self-sufficient. A document opened in a different application (or even the same application with different styleStore state) would render differently because the cascade root is external.

**Recommendation:** The `DocNode` must define explicit root defaults for ALL cascadable properties. These become the "constitutional" styles of the document. The styleStore can OVERRIDE these defaults in the application layer, but the document itself must contain a complete cascade root. This means `DocNode.styleParams` should have sensible non-null defaults (e.g., `fontFamily: 'Inter'`, `fontSize: 16`, `lineHeight: 1.5`).

The schema spec should distinguish between:
- **Document defaults** (stored in DocNode.styleParams, serialized with the document)
- **Application defaults** (stored in styleStore, NOT serialized, used only when DocNode.styleParams is null)

This gives the document self-sufficiency while allowing the application to provide a final fallback.

---

### Challenge #6: The LayoutResult is Outside the VSM Boundary

**The problem:**

The layout engine (Section 8.3) produces a `LayoutResult` that maps sections and blocks to pages. This result is consumed by the interaction layer. But the `LayoutResult` is not part of the content schema. It is not stored. It is not serialized. It exists only as a runtime derivative.

This is correct for presentation agnosticism. But it creates a temporal fragility: between a document change and the next layout computation, the LayoutResult is STALE. Any interaction that reads the stale LayoutResult will make decisions based on outdated page assignments.

**Why this matters:** In a viable system, System 4 (Intelligence) must have timely environmental data. If the layout engine runs asynchronously or is debounced, there is a window where System 4 is blind.

**Recommendation:** The schema spec should define the FRESHNESS CONTRACT for LayoutResult. Options:
1. **Synchronous:** LayoutResult is recomputed on every transaction (within appendTransaction). Guarantees freshness. May be expensive for large documents.
2. **Eventual:** LayoutResult is recomputed asynchronously after transactions. Interaction layer must handle staleness (e.g., by showing previous layout until the new one is ready).
3. **Hybrid:** Synchronous for simple changes (text edits), asynchronous for structural changes (section add/remove).

The choice affects the viability of the interaction layer. Without a freshness contract, the interaction layer's behavior during the stale window is undefined.

---

## 7. FINAL ASSESSMENT

The Schema Architect's proposal is **structurally sound**. The section-as-missing-level diagnosis is correct. The recursive self-similarity principle is correct. The presentation agnosticism principle is correct. The ProseMirror compatibility principle is correct.

The viability analysis reveals **six specific weaknesses**, none of which are fatal:

1. `block*` prefix duplication (variety noise -- easy fix)
2. Column width parent-dependency (structural fragility -- moderate fix)
3. EdgeRegistry single point of failure (resilience gap -- design-level fix)
4. Flat sections lose nesting variety (deliberate tradeoff -- acceptable with constraints)
5. Cascade root is external to the document (self-sufficiency gap -- moderate fix)
6. LayoutResult freshness is unspecified (temporal fragility -- spec-level fix)

The schema's viable recursion structure is:

```
DOCUMENT (fully viable)
  |
  +-- SECTION (first viable unit - the recursion base)
        |
        +-- CONTAINER / BLOCK (components, not systems)
              |
              +-- TEXT RUN (atoms)
```

This is a healthy recursive structure. Two viable levels (document, section), two component levels (block, text), and a clear boundary between systems and components.

**The proposal passes the viability test with conditions.** The six challenges above must be addressed before the schema is finalized.

---

*This analysis was conducted against `round1-schema-architect.md` using Stafford Beer's Viable System Model, W. Ross Ashby's Law of Requisite Variety, and first-principles systems engineering. All references to the proposal cite specific section numbers and type definitions from the original document.*
