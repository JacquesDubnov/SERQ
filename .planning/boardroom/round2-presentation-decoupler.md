# SERQ Content Schema -- Presentation Decoupler Audit

**Role:** Rendering & Layout Strategist (Presentation Decoupler)
**Date:** 2026-02-06
**Status:** Round 2 -- Adversarial Review of Schema Architect's Round 1 Proposal
**Reviewing:** `round1-schema-architect.md`

---

## Preamble: The One Law

The schema is supposed to be the **invariant** across all presentation modes. The Schema Architect states this clearly in Principle 1.2: "Layout is a function applied to the schema, not embedded in it."

Good. I agree with the principle. But the implementation violates it in at least six places. The Architect got the philosophy right and then let pragmatism smuggle presentation concerns back in through the attrs bag. That is exactly how every schema I have seen go wrong goes wrong -- not through ignorance, but through "well, it is convenient to put it here."

Convenience is the enemy. Let us audit everything.

---

## 1. FIELD-BY-FIELD AUDIT

### 1.1 SerqNodeBase (Section 3.1)

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `id` | CONTENT | Stable identity is mode-independent. A UUID is a UUID whether you are rendering to slides or to continuous scroll. |
| `type` | CONTENT | The discriminant. A paragraph is a paragraph in every mode. |
| `content` | CONTENT | Tree structure is structural, not presentational. |
| `marks` | CONTENT | Inline semantics (bold, italic, link) are content. They survive every mode change. |
| `attrs` | CONTENT (by intent) | Container for node-specific content attributes. But see below -- individual attrs within specific node types leak presentation. |
| `styleParams` | **AMBIGUOUS** | This is the big one. See dedicated analysis in Section 1.2. |
| `meta` | CONTENT (mostly) | Metadata is mode-independent. But `breakHint` inside meta is a Trojan horse. See Section 3. |

### 1.2 StyleParams (Section 3.2) -- Field-by-Field

The Architect claims these are "presentation hints, not layout directives" and that they "travel WITH the content." This framing is doing heavy lifting. Let me test each field against the Five-Mode Proof.

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `textAlign` | **AMBIGUOUS** | "center" is often a content-level intent ("this is a centered heading"). But in RTL vs. LTR modes, "left" and "right" swap meaning. In slideshow mode, all text might be centered. In outline mode, alignment is irrelevant. If I write a paragraph with `textAlign: 'justify'`, is that content or presentation? I argue it is **content intent** -- the author chose to justify -- but the renderer should be free to override it. It should be in the schema as an *advisory* value, same as breakHint. Verdict: **Keep, but document as advisory.** |
| `lineHeight` | **PRESENTATION** | Line height is a typographic rendering parameter. The same paragraph should render with different line heights in print (1.5) vs. screen (1.6) vs. slide (1.2). Storing it per-node in the schema means every mode change requires either (a) ignoring the stored value or (b) changing it. Both are bad. |
| `letterSpacing` | **PRESENTATION** | Same argument as lineHeight. This is a rendering parameter that varies by output medium. |
| `fontFamily` | **AMBIGUOUS** | If the author chose Georgia for a specific paragraph, that is closer to content intent ("this is a quote in a serif font"). But a slideshow renderer might override all fonts to match a slide theme. I lean toward keeping this as content intent, with the renderer having override authority. |
| `fontSize` | **PRESENTATION** | Font size is heavily mode-dependent. A heading that is 32px on screen might be 24pt in print, 48px on a slide, and 14px in outline view. Storing an absolute pixel value in the schema is a presentation leak. |
| `fontWeight` | **AMBIGUOUS** | Weight 700 (bold) is semantic. But weight 400 vs. 300? That is a rendering choice. Since bold already exists as a mark, fontWeight in styleParams is redundant for the semantic case and purely presentational for the nuanced case. |
| `color` | **AMBIGUOUS** | "This text is red" could be content intent (a warning) or presentation (matches the theme). In a dark mode render, red might become a lighter red. In print, it might become black. I lean toward content intent with renderer override authority, same as fontFamily. |
| `spacingBefore` | **PRESENTATION** | Spacing between blocks is a layout parameter. Different modes need different spacing. A paginated view needs tight spacing to fit more on a page. A continuous view needs generous spacing for readability. A slide needs none (each block is absolutely positioned). |
| `spacingAfter` | **PRESENTATION** | Same as spacingBefore. |
| `backgroundColor` | **AMBIGUOUS** | A callout with a yellow background -- is that content ("this is a warning") or presentation? The semantic variant is better handled by the callout's `variant` attr. For generic blocks, background color is presentation. |
| `borderStyle` | **PRESENTATION** | Borders are visual chrome. A blockquote is a blockquote regardless of its left border style. |
| `blockFontFamily` (ParagraphNode) | **AMBIGUOUS** | Same analysis as fontFamily. |
| `blockFontSize` (ParagraphNode) | **PRESENTATION** | Same analysis as fontSize. |
| `blockFontWeight` (ParagraphNode) | **PRESENTATION** | Same analysis as fontWeight for the non-semantic case. |
| `blockColor` (ParagraphNode) | **AMBIGUOUS** | Same analysis as color. |

**Summary of styleParams verdict:**

```
KEEP (content intent, advisory):  textAlign, fontFamily, color
REMOVE (presentation):            lineHeight, letterSpacing, fontSize,
                                  spacingBefore, spacingAfter, borderStyle,
                                  blockFontSize, blockFontWeight
AMBIGUOUS (needs policy):         fontWeight, backgroundColor,
                                  blockFontFamily, blockColor
```

The problem is not that these values exist somewhere. The problem is that they are embedded in every node instance in the content tree. The right place for them is a **style sheet** that is associated with the document but separate from the content tree. More on this in Section 5.

### 1.3 NodeMeta (Section 3.3)

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `createdAt` | CONTENT | Creation time is a fact about the content, not about how it is displayed. |
| `modifiedAt` | CONTENT | Same. |
| `tags` | CONTENT | Semantic tags are content metadata. |
| `bookmark` | CONTENT | A named anchor is content -- it is a thing the author created. |
| `breakHint` | **PRESENTATION** | See Section 3 (Trojan Horse #1). |
| `commentThreadIds` | CONTENT | Comments are about the content, not the presentation. |

### 1.4 DocNode (Section 3.5)

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `type: 'doc'` | CONTENT | |
| `attrs.lang` | CONTENT | Language is a property of the content. |
| `attrs.dir` | CONTENT | Writing direction is a property of the content (though it affects rendering, it is linguistically determined, not presentation-chosen). |
| `meta.title` | CONTENT | |
| `meta.author` | CONTENT | |
| `meta.summary` | CONTENT | |

DocNode is clean. No objections.

### 1.5 SectionNode (Section 3.5) -- THE MAIN BATTLEFIELD

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `type: 'section'` | CONTENT | A section is a structural grouping. |
| `attrs.level` | CONTENT | The hierarchical level of a section is content structure. |
| `attrs.numbering` | **AMBIGUOUS** | Is "decimal" numbering content or presentation? The *fact* that sections are numbered is arguably content (the author decided to number them). The *style* of numbering (decimal vs. roman vs. alpha) is closer to presentation -- a print style sheet might use roman for front matter and decimal for body. I lean toward CONTENT with reservation. |
| `attrs.pageBreakBefore` | **PRESENTATION** | See Section 3 (Trojan Horse #2). This is the worst offender. |
| `attrs.columns` | **PRESENTATION** | See Section 3 (Trojan Horse #3). |
| `attrs.columnWidths` | **PRESENTATION** | See Section 3 (Trojan Horse #3). |
| `attrs.columnGutter` | **PRESENTATION** | See Section 3 (Trojan Horse #3). |

### 1.6 ColumnBlockNode (Section 3.5)

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `type: 'columnBlock'` | CONTENT | The decision to put content side-by-side is structural. |
| `attrs.columns` | CONTENT | The number of columns is structural -- it defines how many content containers exist. |
| `attrs.columnWidths` | **AMBIGUOUS** | See Section 3 (Trojan Horse #4). The *ratios* between columns are content intent ("I want the left column wider"). But exact pixel widths or even fractional widths are presentation. |
| `attrs.gutter` | **PRESENTATION** | The gutter is a spacing parameter. Different modes need different gutters. A narrow mobile view, a wide desktop view, a printed page -- all different. |

### 1.7 Other Container Nodes

| Node | Field | Classification | Rationale |
|------|-------|---------------|-----------|
| ColumnNode | `attrs: {}` | CONTENT | Clean. No attrs. |
| BlockquoteNode | `attrs: {}` | CONTENT | Clean. |
| BulletListNode | `attrs: {}` | CONTENT | Clean. |
| OrderedListNode | `attrs.start` | CONTENT | Starting number is content (the author chose to start at 5). |
| ListItemNode | `attrs: {}` | CONTENT | Clean. |
| CalloutNode | `attrs.variant` | CONTENT | The semantic variant (info/warning/error) is content. How it renders visually is presentation. |

### 1.8 Block Nodes

| Node | Field | Classification | Rationale |
|------|-------|---------------|-----------|
| ParagraphNode | `attrs: {}` | CONTENT | Clean. |
| ParagraphNode | `styleParams.*` | See 1.2 | Covered above. |
| HeadingNode | `attrs.level` | CONTENT | Heading level is semantic. |
| HeadingNode | `styleParams.textAlign` | AMBIGUOUS | See 1.2. |
| CodeBlockNode | `attrs.language` | CONTENT | The programming language is content. |
| ImageNode | `attrs.src` | CONTENT | The image source is content. |
| ImageNode | `attrs.alt` | CONTENT | Alt text is content. |
| ImageNode | `attrs.title` | CONTENT | Title is content. |
| ImageNode | `attrs.width` | **AMBIGUOUS** | See below. |
| ImageNode | `attrs.height` | **AMBIGUOUS** | See below. |
| HorizontalRuleNode | `attrs: {}` | CONTENT | Clean. |

**Image dimensions note:** The *intrinsic* dimensions of an image (its actual pixel size) are content. The *display* dimensions (how big to render it) are presentation. If `width: 400` means "the image is 400px wide intrinsically," it is content. If it means "render this image at 400px wide," it is presentation. The Architect does not clarify. In the worked example (7.2), `width: 400, height: 300` look like display dimensions, not intrinsic dimensions. This is a presentation leak.

### 1.9 Inline Nodes and Marks

| Item | Field | Classification | Rationale |
|------|-------|---------------|-----------|
| TextRunNode | `attrs.text` | CONTENT | Text is text. |
| TextRunNode | `marks` | CONTENT | Inline semantics. |
| MentionNode | `attrs.id` | CONTENT | |
| MentionNode | `attrs.label` | CONTENT | |
| Mark: bold, italic, etc. | All | CONTENT | Semantic formatting. |
| Mark: textStyle | `attrs.*` | **AMBIGUOUS** | textStyle carries inline fontSize, fontFamily, color. Same analysis as styleParams -- inline presentation leak. |
| Mark: highlight | `attrs.color` | AMBIGUOUS | "This text is highlighted yellow" -- content intent or presentation? |
| Mark: comment | `attrs.threadId` | CONTENT | |
| Mark: suggestion | `attrs.*` | CONTENT | |
| Mark: crossRef | `attrs.targetId` | CONTENT | |
| Mark: crossRef | `attrs.targetType` | CONTENT | |
| Mark: crossRef | `attrs.displayFormat` | **AMBIGUOUS** | Is "render as number" vs. "render as title" a content choice or a presentation choice? A slide might always show titles. A print document might always show numbers. I lean toward presentation, but it is debatable. |

### 1.10 EdgeRegistry (Section 4.3)

| Field | Classification | Rationale |
|-------|---------------|-----------|
| `nodePositions` | Derived (not stored) | Correct -- this is a runtime index. |
| `sectionMembership` | Derived (not stored) | Correct. |
| `sectionOrder` | Derived (not stored) | Correct. |
| `bookmarks` | Derived (not stored) | Correct. |
| `crossRefTargets` | Derived (not stored) | Correct. |
| `crossRefTargets[x].pageNumber` | **PRESENTATION** | Page numbers are mode-dependent. In continuous mode there are no page numbers. In paginated mode they exist. This field should not be in the EdgeRegistry structure definition -- it should be in the LayoutResult. |

The EdgeRegistry is mostly clean because it is explicitly derived. But `pageNumber` in `crossRefTargets` is a presentation leak even in derived data.

---

## 2. THE FIVE-MODE PROOF

I will take the two non-trivial worked examples (7.2: Two-Column Layout, 7.3: Cross-Reference Section) and sketch how they render in all five modes.

### 2.1 Example 7.2: Two-Column Layout (Methodology Section)

The schema instance:

```
section (sec-002, level: 2, numbering: 'decimal', pageBreakBefore: false)
  columnBlock (columns: 2, columnWidths: [0.6, 0.4], gutter: 24)
    column
      paragraph ("Methodology overview text...")
      paragraph ("We employed a mixed-methods approach.")
    column
      image (methodology-diagram.png, 400x300)
      paragraph ("Figure 1: Methodology flow diagram", textAlign: center, fontSize: 12)
```

#### Mode 1: Continuous Flow (Web Page Style)

The columnBlock renders as two side-by-side containers. The 0.6/0.4 ratio is respected. The 24px gutter is applied. `pageBreakBefore: false` is irrelevant (no pages). The section is a `<section>` wrapper with no visible boundary.

**Schema problems exposed:** None in this mode. This is the "home" mode for the current schema.

#### Mode 2: Paginated (PDF Style)

The columnBlock renders side-by-side within a page. If the section falls near a page boundary, the layout engine must decide: does the columnBlock split across pages? The `pageBreakBefore: false` is respected (no forced break before this section). The 24px gutter is applied.

**Schema problems exposed:**
- `gutter: 24` is in pixels. But paginated mode works in points (pt) or millimeters. The schema has baked in a screen-specific unit.
- `columnWidths: [0.6, 0.4]` -- ratios are better than pixels, but what if the paginated view has different margins than the continuous view? The ratios still work (they are relative), but the gutter does not.
- The image `width: 400, height: 300` -- in a paginated view with narrow margins, 400px might overflow. The renderer must override. This suggests the value is presentation, not content.

#### Mode 3: Infinite Canvas (Miro Style)

Each section is a "card" or "frame" on the canvas. The columnBlock renders within the frame. But the frame has user-defined position and dimensions on the canvas.

**Schema problems exposed:**
- `gutter: 24` -- means nothing on a canvas where the frame might be 200px wide or 2000px wide.
- `columnWidths: [0.6, 0.4]` -- the ratios still work within the frame. OK.
- **Where does the canvas position of the frame come from?** It is NOT in the schema (good). But `section.attrs.columns` and `section.attrs.columnWidths` would be deeply confusing in canvas mode -- a section's column layout on a canvas is determined by the frame layout, not by section attrs.

#### Mode 4: Outline/Tree View (File Explorer Style)

The section renders as a collapsible node: "Methodology (Section 2)". The columnBlock, paragraphs, and image are listed as children. Column layout is irrelevant -- everything is a flat list.

**Schema problems exposed:**
- `columnWidths`, `gutter`, `columns` -- all completely irrelevant. They are noise in the schema for this mode.
- `pageBreakBefore` -- irrelevant. Noise.
- `fontSize: 12` on the figure caption -- irrelevant. The outline uses its own font sizes.

This is the critical test. In outline mode, EVERY presentation field is deadweight. The schema must not require the outline renderer to know about or skip these fields. It should not have to say "ignore columnWidths, ignore gutter, ignore fontSize." If it does, the schema is leaking.

#### Mode 5: Slideshow (PowerPoint Style)

Each section is a slide. The columnBlock renders as a two-column layout within the slide. But slide dimensions are fixed (e.g., 1920x1080).

**Schema problems exposed:**
- `gutter: 24` -- a slide might need `gutter: 60` at 1080p.
- `columnWidths: [0.6, 0.4]` -- ratios work.
- `pageBreakBefore: false` -- nonsensical in slideshow mode. Every section is already a new "slide." This field literally means nothing here.
- The image dimensions `400x300` -- completely wrong for a slide. The renderer must scale.
- `fontSize: 12` on the caption -- illegible on a slide. Must be overridden.

**FIVE-MODE VERDICT FOR EXAMPLE 7.2:**

Fields that REQUIRED renderer override in 3+ modes:
- `gutter` (pixel value -- meaningless in paginated/canvas/slide)
- `fontSize` in styleParams (wrong for outline/slide/paginated)
- `width`/`height` on image (wrong for paginated/canvas/slide)
- `pageBreakBefore` (meaningless in continuous/canvas/outline/slide)
- `spacingBefore`/`spacingAfter` if set (different per mode)

**Conclusion: The schema IS NOT mode-invariant.** These fields would need to be ignored or overridden in most modes, which means they are presentation, not content.

### 2.2 Example 7.3: Cross-Reference Section (Results)

The schema instance:

```
section (sec-003, level: 2, numbering: 'decimal', pageBreakBefore: true)
  heading (level: 2, "Results")
  paragraph ("Using the approach described in [crossRef -> sec-002], we obtained...")
  paragraph ("The primary outcome measure showed a 23% improvement.")
  paragraph ("As shown in [crossRef -> img-001], the flow clearly delineates each phase.")
```

#### Mode 1: Continuous Flow

Cross-references render as clickable links. `pageBreakBefore: true` is ignored (no pages). Section renders as a `<section>` with no visible break.

**Schema problems:** `pageBreakBefore: true` is stored but ignored. Benign but wasteful.

#### Mode 2: Paginated

`pageBreakBefore: true` is respected -- the Results section starts on a new page. Cross-references render with page numbers if `displayFormat: 'page'`. "Section 2" renders as the section number.

**Schema problems:**
- `displayFormat: 'number'` on the image cross-ref renders as "Figure 1." But figure numbering is mode-dependent -- in a slideshow, you might number figures per-slide. In an outline, figure numbers are meaningless.
- `displayFormat` should arguably be a renderer decision, not a content decision. The author's intent is "reference this figure." How that reference displays is presentation.

#### Mode 3: Infinite Canvas

Each section is a card. The cross-reference "See Section 2" renders as a link/arrow to the Methodology card on the canvas. `pageBreakBefore: true` is meaningless.

**Schema problems:** `pageBreakBefore` is noise. `displayFormat: 'number'` makes less sense when sections are spatial, not sequential.

#### Mode 4: Outline/Tree View

The section renders as "Results (Section 3)". Its children are listed. Cross-references render as simple links or are hidden. `pageBreakBefore` is irrelevant.

**Schema problems:** Same as above.

#### Mode 5: Slideshow

The section is a slide titled "Results." Cross-references render as slide links ("See Slide 2"). `pageBreakBefore` is meaningless -- every section is a new slide.

**Schema problems:** `pageBreakBefore: true` is a permanent wart on this node that means nothing in 4 of 5 modes. The cross-ref `displayFormat: 'number'` should be `'slide'` in this mode -- but the schema says `'number'`.

**FIVE-MODE VERDICT FOR EXAMPLE 7.3:**

Fields that are mode-specific or require override:
- `pageBreakBefore` (meaningful ONLY in paginated mode)
- `displayFormat` on crossRef marks (different display per mode)
- `numbering: 'decimal'` (numbering style could vary by mode/template)

**Conclusion: `pageBreakBefore` is a paginated-mode-specific instruction that does not belong in the content schema.** It fails the invariance test cleanly -- it is not ambiguous.

---

## 3. TROJAN HORSE AUDIT

These are presentation concepts that have infiltrated the content schema.

### Trojan Horse #1: `meta.breakHint`

**Location:** `NodeMeta` (Section 3.3)
**Quoted:**
```typescript
breakHint?: 'before' | 'after' | 'avoid' | null
```

**Why it is a problem:**

The Architect calls these "hints" and says they are "advisory." That framing makes them sound harmless. They are not.

`breakHint: 'before'` means "start a new page before this node." In continuous mode, there are no pages. In canvas mode, there are no pages. In outline mode, there are no pages. In slideshow mode, sections already start new slides.

This field is meaningful in exactly ONE mode: paginated. It is a pagination directive wearing a trench coat and pretending to be metadata.

The Architect's own Principle 1.2 says: "Layout is a function applied to the schema, not embedded in it." A break hint is a layout instruction. It belongs in a pagination config, not in the content tree.

**Counterargument:** "The author explicitly wants a page break here." Response: the author's intent is captured by the section structure. If the author wants a page break, they create a section boundary. The break is at the section, not the paragraph. If finer control is needed (break before this specific paragraph), that is a pagination-layer setting keyed to the node's UUID.

**Alternative:** Move to `PresentationConfig.pagination.breakRules`:
```typescript
interface PaginationConfig {
  breakRules: Map<string, 'before' | 'after' | 'avoid'>
  // key: node UUID, value: break behavior
}
```

### Trojan Horse #2: `SectionNode.attrs.pageBreakBefore`

**Location:** `SectionNode` (Section 3.5)
**Quoted:**
```typescript
pageBreakBefore?: boolean
```

**Why it is a problem:**

This is even worse than `breakHint` because it is not even hiding. The field is literally named `pageBreakBefore`. "Page" is a presentation concept. If this field passes review, we have failed.

The Architect even acknowledges the overlap: "Shorthand for meta.breakHint = 'before' (but more explicit)." So now we have TWO fields for the same pagination instruction, and both are in the content schema.

In the worked example (7.3), `pageBreakBefore: true` is set on the Results section. This means the serialized content tree permanently carries the instruction "start a new page." If the user opens the document in continuous mode, canvas mode, outline mode, or slideshow mode, this field is meaningless dead weight that the renderer must explicitly ignore.

**Alternative:** Same as Trojan Horse #1. Move to `PresentationConfig.pagination.sectionBreaks`:
```typescript
interface PaginationConfig {
  sectionBreaks: Map<string, { breakBefore: boolean }>
  // key: section UUID
}
```

### Trojan Horse #3: Section-Level Column Attrs

**Location:** `SectionNode` (Section 3.5)
**Quoted:**
```typescript
columns?: number | null
columnWidths?: number[] | null
columnGutter?: number | null
```

**Why it is a problem:**

The Architect says section-level columns are "deferred to Phase 3+," but they are already in the type definition. If they ship, every section carries optional layout instructions for a multi-column newspaper-style flow.

Multi-column flow is a presentation mode. The same content might be single-column on a phone screen, two-column on a desktop, and three-column in a printed newsletter. This is the textbook CSS multi-column use case -- and CSS deliberately puts multi-column in the *style sheet*, not in the *markup*.

If the author's intent is "this section's content should be in two columns," that is presentation intent that belongs in a style config, not in the content tree.

**Note:** This is different from `columnBlock`, which is a *structural* container -- the author explicitly placed content into specific column containers. Section-level columns are a *flow* directive, like CSS `column-count`. These are fundamentally different things and should not be conflated.

**Alternative:** Move to `PresentationConfig.sectionStyles`:
```typescript
interface SectionStyleConfig {
  [sectionId: string]: {
    columns?: number
    columnWidths?: number[]
    columnGutter?: number
  }
}
```

### Trojan Horse #4: `ColumnBlockNode.attrs.gutter`

**Location:** `ColumnBlockNode` (Section 3.5)
**Quoted:**
```typescript
gutter: number  // px
```

**Why it is a problem:**

24 pixels of gutter space. On a screen at 1x DPI. On a Retina screen, that is 12 "logical" pixels. On a printed page in points, 24px is approximately 18pt. On a slide at 1080p, 24px is barely visible.

This is a pixel value baked into the content tree. It is a presentation parameter.

The *structural* aspect of a columnBlock is: "these N containers exist side by side." The *ratios* between columns (`columnWidths: [0.6, 0.4]`) are arguably content intent. The *absolute spacing* between them is presentation.

**Alternative:** Keep `columns` and `columnWidths` in the schema. Move `gutter` to presentation config:
```typescript
interface PresentationConfig {
  columnDefaults: {
    gutter: number  // applied to all columnBlocks unless overridden
  }
  columnOverrides: Map<string, { gutter: number }>
  // key: columnBlock UUID
}
```

### Trojan Horse #5: `ImageNode.attrs.width` and `height`

**Location:** `ImageNode` (Section 3.5)
**Quoted:**
```typescript
width?: number | null
height?: number | null
```

**Why it is a problem:**

As discussed in Section 1.8, these are ambiguous. If they are *intrinsic* dimensions (the actual pixel dimensions of the image file), they are content metadata. If they are *display* dimensions (how big to render the image), they are presentation.

The worked example (7.2) uses `width: 400, height: 300` for an image inside a column that is 40% of the section width. On a 1200px wide view, the column is 480px, and the image is 400px -- it fits. On a 600px wide view, the column is 240px, and the 400px image overflows. On a printed A4 page, the column might be 70mm, and 400px is meaningless.

These are clearly display dimensions, not intrinsic dimensions.

**Alternative:** Store intrinsic dimensions and aspect ratio as content. Move display sizing to presentation config:
```typescript
// In the schema (content)
interface ImageNode {
  attrs: {
    src: string
    alt?: string
    title?: string
    intrinsicWidth?: number   // actual image file width
    intrinsicHeight?: number  // actual image file height
  }
}

// In presentation config
interface PresentationConfig {
  imageDisplaySizes: Map<string, {
    width?: number | string   // px, %, or 'auto'
    height?: number | string
    objectFit?: 'contain' | 'cover' | 'fill'
  }>
}
```

### Trojan Horse #6: `fontSize` in StyleParams and ParagraphNode

**Location:** `StyleParams` (Section 3.2) and `ParagraphNode` (Section 3.5)
**Quoted:**
```typescript
fontSize?: number | null       // px
blockFontSize?: string | null
```

**Why it is a problem:**

The Architect puts `fontSize: 12` on the figure caption in example 7.2. 12px. On a screen, that is small but legible. On a slide at 1080p, it is invisible. On a printed page, 12px is approximately 9pt, which is below the readability threshold for most readers.

Font size is not content intent. The author's intent is "this caption should be smaller than body text." That relative intent is what the schema should capture (if anything). An absolute pixel size is a rendering decision.

**Alternative:** If relative sizing is needed, use semantic size tokens:
```typescript
// In the schema (if we must)
interface StyleParams {
  textSizeRole?: 'body' | 'caption' | 'small' | 'large' | 'display' | null
}

// In presentation config
interface PresentationConfig {
  textSizeMap: {
    body: number      // px, pt, or rem depending on mode
    caption: number
    small: number
    large: number
    display: number
  }
}
```

---

## 4. RENDERER CONTRACT

### 4.1 What Queries Does a Renderer Make?

A renderer needs to answer these questions:

```
Q1: What is the document structure?
    -> Walk the tree: doc > section[] > (block | container)[] > ...

Q2: What is the content of node X?
    -> Read node.content, node.attrs, node.marks

Q3: What section does node X belong to?
    -> Walk up the tree (or use EdgeRegistry.sectionMembership)

Q4: What comes before/after node X?
    -> Sibling navigation in the tree

Q5: What is the resolved target of cross-reference Y?
    -> Look up EdgeRegistry.crossRefTargets[targetId]

Q6: What are the author's style intentions for node X?
    -> Read node.styleParams (with cascade resolution up the tree)

Q7: What are the mode-specific layout parameters?
    -> Read PresentationConfig (NOT the content schema)

Q8: Where should page breaks fall?
    -> Computed by layout engine from PresentationConfig.pagination + tree structure
```

### 4.2 The Renderer Interface

```typescript
/**
 * The contract between the content schema and any renderer.
 *
 * A renderer receives the content tree and a presentation config.
 * It produces mode-specific output without modifying the content tree.
 */
interface RendererInput {
  /** The content tree. READ-ONLY. The renderer never modifies this. */
  document: DocNode

  /** Derived structure data (section order, cross-refs, bookmarks). */
  edgeRegistry: EdgeRegistry

  /** Mode-specific presentation parameters. */
  presentationConfig: PresentationConfig
}

interface RendererOutput {
  /**
   * Mode-specific layout result.
   * The interaction layer consumes this for hit-testing, drag targets, etc.
   */
  layoutResult: LayoutResult

  /**
   * The rendered output (DOM, PDF pages, slide deck, etc.).
   * Opaque to the content layer.
   */
  renderedContent: unknown
}

/**
 * A renderer is a pure function from content + config to output.
 * Different modes are different renderer implementations.
 */
type Renderer = (input: RendererInput) => RendererOutput
```

### 4.3 What the Schema Returns

The schema returns **structural** and **semantic** information only:

```typescript
interface SchemaQueryAPI {
  /** Get the ordered list of sections */
  getSections(): SectionNode[]

  /** Get all blocks within a section */
  getBlocksInSection(sectionId: string): (BlockNode | ContainerNode)[]

  /** Get a node by UUID */
  getNodeById(id: string): SerqNode | null

  /** Get the parent of a node */
  getParent(id: string): SerqNode | null

  /** Get siblings (previous, next) */
  getSiblings(id: string): { prev: SerqNode | null; next: SerqNode | null }

  /** Resolve a cross-reference target */
  resolveRef(targetId: string): { node: SerqNode; path: string[] } | null

  /** Get the author's style intentions for a node (with cascade) */
  getResolvedStyleIntent(id: string): ResolvedStyleIntent
}
```

### 4.4 Where Presentation Parameters Live

Presentation parameters live in a `PresentationConfig` object that is:
- Stored alongside the document (in the `.serq` file, but in a separate section)
- Loaded into a Zustand store (not into ProseMirror attrs)
- Passed to the renderer as input
- Never mixed into the content tree

The content tree is the **single source of truth for content**. The presentation config is the **single source of truth for presentation**. They meet at the renderer boundary and nowhere else.

---

## 5. PRESENTATION CONFIG STRUCTURE

```typescript
/**
 * PresentationConfig -- the EXTERNAL companion to the content schema.
 *
 * This is NOT part of the ProseMirror document. It is stored separately
 * (in the .serq file as a sibling to the content tree, or in a Zustand store).
 *
 * Each presentation mode has its own config section. Only the active mode's
 * config is used by the renderer. Switching modes does NOT modify the content
 * tree -- it switches which config section is active.
 */
interface PresentationConfig {
  /** Which mode is currently active */
  activeMode: 'continuous' | 'paginated' | 'canvas' | 'outline' | 'slide'

  /** Mode-specific configurations */
  continuous: ContinuousConfig
  paginated: PaginatedConfig
  canvas: CanvasConfig
  outline: OutlineConfig
  slide: SlideConfig

  /** Shared style defaults (applied across all modes unless overridden) */
  styleDefaults: StyleDefaults

  /** Per-node style overrides (keyed by node UUID) */
  nodeStyleOverrides: Map<string, NodeStyleOverride>
}
```

### 5.1 Pagination Config

```typescript
interface PaginatedConfig {
  /** Page dimensions */
  pageSize: {
    width: number   // mm
    height: number  // mm
    preset?: 'A4' | 'Letter' | 'Legal' | 'A5' | 'custom'
  }

  /** Margins */
  margins: {
    top: number     // mm
    bottom: number  // mm
    left: number    // mm
    right: number   // mm
  }

  /** Header and footer configuration */
  header?: HeaderFooterConfig
  footer?: HeaderFooterConfig

  /**
   * Per-section break rules.
   * Key: section UUID. Value: break behavior.
   * If a section is not in this map, default behavior applies
   * (break where needed based on content overflow).
   */
  sectionBreaks: Record<string, {
    breakBefore?: boolean
    breakAfter?: boolean
    avoidBreakInside?: boolean
  }>

  /**
   * Per-node break rules (for finer control).
   * Key: node UUID. Value: break behavior.
   */
  nodeBreaks: Record<string, {
    breakBefore?: boolean
    breakAfter?: boolean
    avoidBreakInside?: boolean
  }>

  /** Column defaults for columnBlock rendering in paginated mode */
  columnGutter: number  // mm (not px!)

  /** Orphan/widow control */
  orphanLines: number   // minimum lines at bottom of page
  widowLines: number    // minimum lines at top of page
}
```

### 5.2 Canvas Config

```typescript
interface CanvasConfig {
  /** Canvas dimensions (or infinite) */
  bounds: { width: number; height: number } | 'infinite'

  /** Background color/pattern */
  background: string

  /** Grid snapping */
  grid: {
    enabled: boolean
    size: number   // px
    visible: boolean
  }

  /**
   * Per-section frame positions on the canvas.
   * Key: section UUID. Value: position and size.
   *
   * Sections not in this map are auto-laid-out.
   */
  sectionFrames: Record<string, {
    x: number
    y: number
    width: number
    height: number
    collapsed?: boolean
  }>

  /** Zoom level */
  zoom: number

  /** Viewport center (for restoring scroll position) */
  viewportCenter: { x: number; y: number }
}
```

### 5.3 Slide Config

```typescript
interface SlideConfig {
  /** Slide dimensions */
  slideSize: {
    width: number   // px at 1x
    height: number  // px at 1x
    preset?: '16:9' | '4:3' | '16:10' | 'custom'
  }

  /** Theme/template name */
  theme?: string

  /** Per-section (per-slide) layout */
  slideLayouts: Record<string, {
    layout: 'title' | 'content' | 'two-column' | 'blank' | 'custom'
    background?: string
    transition?: string
  }>

  /** Speaker notes (keyed by section UUID) */
  speakerNotes: Record<string, string>
}
```

### 5.4 Style Defaults

```typescript
/**
 * Shared style defaults that apply across modes unless a mode-specific
 * config overrides them.
 *
 * This is where the "presentation" side of styleParams should live.
 */
interface StyleDefaults {
  /** Typography defaults */
  typography: {
    bodyFontFamily: string
    bodyFontSize: number        // in mode-appropriate units
    bodyLineHeight: number      // unitless ratio
    bodyLetterSpacing: number
    headingFontFamily: string
    headingScale: number[]      // [h1, h2, h3, h4, h5, h6] as multipliers of bodyFontSize
    captionFontSize: number
    codeFontFamily: string
  }

  /** Spacing defaults */
  spacing: {
    blockSpacingBefore: number
    blockSpacingAfter: number
    sectionSpacingBefore: number
    sectionSpacingAfter: number
  }

  /** Color defaults */
  colors: {
    text: string
    background: string
    accent: string
    link: string
    codeBackground: string
  }

  /** Column defaults */
  columns: {
    gutter: number
  }
}
```

### 5.5 Interaction with the Content Schema

The presentation config interacts with the content schema through a well-defined boundary:

```
+---------------------+         +-------------------------+
|   CONTENT SCHEMA    |         |   PRESENTATION CONFIG   |
|                     |         |                         |
|  doc                |         |  activeMode             |
|    section[]        |<--------|  paginated.sectionBreaks|
|      block[]        |  (refs  |  canvas.sectionFrames   |
|        text[]       |  by     |  slide.slideLayouts     |
|                     |  UUID)  |  nodeStyleOverrides     |
|  styleIntents       |         |  styleDefaults          |
|  (advisory)         |         |  (authoritative)        |
+---------------------+         +-------------------------+
          |                               |
          |    +-------------------+      |
          +--->|     RENDERER      |<-----+
               |                   |
               |  content + config |
               |  = rendered output|
               +-------------------+
```

The presentation config references nodes in the content schema by UUID. It never duplicates content. It never modifies the content tree. The renderer combines both at render time.

**Key interaction rules:**

1. **The content schema is authoritative for WHAT exists.** The presentation config cannot create, delete, or reorder content.

2. **The presentation config is authoritative for HOW things look.** It can override any visual parameter.

3. **Author style intents in the content schema are defaults.** If the author sets `textAlign: 'center'` on a paragraph, and the presentation config does not override it, the paragraph renders centered. If the presentation config says "all paragraphs in this section are left-aligned," the config wins.

4. **The cascade is: presentation config > author style intent > style defaults.** This mirrors the CSS cascade (author vs. user-agent).

5. **Switching modes is free.** Change `activeMode` from `'continuous'` to `'paginated'`. The content tree is untouched. The renderer switches from reading `continuous` config to reading `paginated` config. No migration, no data transformation, no "save first."

---

## 6. SPECIFIC OBJECTIONS

### Objection 1: `pageBreakBefore` Is a Pagination Instruction in the Content Schema

**Quote from Section 3.5 (SectionNode):**
```typescript
pageBreakBefore?: boolean
```

**Quote from Section 3.3 (NodeMeta):**
```typescript
breakHint?: 'before' | 'after' | 'avoid' | null
```

The schema has TWO mechanisms for encoding page break instructions, and BOTH are in the content tree. This directly violates Principle 1.2. The Architect even acknowledges the redundancy: "Shorthand for meta.breakHint = 'before' (but more explicit)."

**Demand:** Remove both. Move to `PresentationConfig.paginated.sectionBreaks` and `PresentationConfig.paginated.nodeBreaks`.

### Objection 2: Section-Level Column Attrs Are a Layout Directive

**Quote from Section 3.5 (SectionNode):**
```typescript
columns?: number | null
columnWidths?: number[] | null
columnGutter?: number | null
```

The Architect says these are "deferred to Phase 3+" but defines them now. Their presence in the type definition means any code that deserializes a SectionNode must handle them. They are a multi-column *flow layout* directive -- the exact thing that CSS multi-column was created to handle in the style layer.

**Demand:** Remove from SectionNode. If section-level column flow is needed, put it in `PresentationConfig.sectionStyles[sectionId].columns`.

### Objection 3: `gutter` Is a Pixel Value in a Content Node

**Quote from Section 3.5 (ColumnBlockNode):**
```typescript
gutter: number  // px
```

Pixels are a screen-specific unit. The content tree should not contain screen-specific units. The Architect designed the schema to be presentation-agnostic (Principle 1.2), then put pixel values in the node attrs.

**Demand:** Remove `gutter` from ColumnBlockNode. Keep `columns` and `columnWidths` (structural). Gutter is a rendering parameter that belongs in the presentation config.

### Objection 4: `fontSize` as an Absolute Pixel Value in StyleParams

**Quote from Section 3.2 (StyleParams):**
```typescript
fontSize?: number | null  // px
```

**And in Example 7.2:**
```typescript
styleParams: { textAlign: 'center', fontSize: 12 }
```

12px on a screen, 9pt on paper, invisible on a slide. An absolute pixel value is not mode-agnostic.

**Demand:** If inline size customization is needed, use semantic tokens (caption, small, body, large, display) that the presentation config resolves to actual sizes per mode. Or, accept that per-node font size is a presentation concern and move it entirely to the presentation config.

### Objection 5: `spacingBefore` and `spacingAfter` in StyleParams

**Quote from Section 3.2:**
```typescript
spacingBefore?: number | null  // line-height units
spacingAfter?: number | null   // line-height units
```

Even in "line-height units," spacing between blocks is a rendering parameter. A paginated view packs blocks tighter to maximize page utilization. A continuous view spaces them generously for readability. A slide view might have no spacing at all.

**Demand:** Move to presentation config as default spacing values, with per-node overrides keyed by UUID.

### Objection 6: `displayFormat` in CrossRef Mark

**Quote from Section 4.2:**
```typescript
displayFormat: 'number' | 'title' | 'page' | 'full'
```

In paginated mode, `'page'` makes sense ("See page 42"). In continuous mode, there are no pages. In slideshow mode, it should say "See Slide 5." In outline mode, it might say "See Methodology."

`displayFormat` is mode-dependent. It should be a renderer decision, possibly influenced by a presentation config, not a content-level attribute.

**Demand:** Remove `displayFormat` from the crossRef mark. The renderer decides how to display cross-references based on the active mode and a presentation config setting. The content tree stores only `targetId` and `targetType`.

### Objection 7: `crossRefTargets[x].pageNumber` in EdgeRegistry

**Quote from Section 4.3:**
```typescript
crossRefTargets: Map<string, { uuid: string; label: string; pageNumber?: number }>
```

`pageNumber` in what the Architect calls a "derived data structure" that is "NOT serialized" and "NOT part of the content schema." But it is part of the EdgeRegistry type definition, which is described as a companion to the schema. If the EdgeRegistry contains `pageNumber`, then any code that consumes cross-ref data gets contaminated with pagination awareness.

**Demand:** Remove `pageNumber` from EdgeRegistry. It belongs in LayoutResult (which the Architect already defines in Section 8.3). The cross-ref resolver should query LayoutResult for page numbers, not store them in the edge data.

---

## 7. SUMMARY OF REQUIRED CHANGES

### Must Remove from Content Schema

| Field | Current Location | Move To |
|-------|-----------------|---------|
| `pageBreakBefore` | SectionNode.attrs | PresentationConfig.paginated.sectionBreaks |
| `breakHint` | NodeMeta | PresentationConfig.paginated.nodeBreaks |
| `columns` | SectionNode.attrs | PresentationConfig.sectionStyles |
| `columnWidths` | SectionNode.attrs | PresentationConfig.sectionStyles |
| `columnGutter` | SectionNode.attrs | PresentationConfig.sectionStyles |
| `gutter` | ColumnBlockNode.attrs | PresentationConfig.columnDefaults |
| `spacingBefore` | StyleParams | PresentationConfig.styleDefaults.spacing |
| `spacingAfter` | StyleParams | PresentationConfig.styleDefaults.spacing |
| `borderStyle` | StyleParams | PresentationConfig (per-node style) |
| `fontSize` (absolute) | StyleParams | PresentationConfig.styleDefaults.typography |
| `lineHeight` | StyleParams | PresentationConfig.styleDefaults.typography |
| `letterSpacing` | StyleParams | PresentationConfig.styleDefaults.typography |
| `displayFormat` | CrossRefMark.attrs | Renderer decision based on mode |
| `pageNumber` | EdgeRegistry.crossRefTargets | LayoutResult |

### May Keep in Content Schema (as Advisory Intents)

| Field | Rationale |
|-------|-----------|
| `textAlign` | Author intent ("I want this centered"). Renderer can override. |
| `fontFamily` | Author intent ("I want this in Georgia"). Renderer can override. |
| `color` | Author intent ("I want this text red"). Renderer can override. |
| `columnWidths` (ratios) in ColumnBlockNode | Structural intent ("left column is wider"). |

### Must Clarify

| Field | Issue |
|-------|-------|
| `ImageNode.width/height` | Rename to `intrinsicWidth/intrinsicHeight` or move display dimensions to presentation config. |
| `fontWeight` in StyleParams | If it duplicates the `bold` mark for semantic weight, remove it. If it allows fine-grained weight (300, 400, 500), it is presentation. |
| `backgroundColor` | Content intent for callouts (better captured by `variant`). Presentation for generic blocks. |
| `numbering` in SectionNode | The fact of numbering is content. The style might be mode-dependent. |

---

## 8. CLOSING STATEMENT

The Schema Architect produced a strong structural proposal. The section-level hierarchy is correct. The recursive viable-unit concept is sound. The ProseMirror compatibility strategy is practical. I have no objections to the tree structure itself.

But the proposal smuggles presentation into the content tree in at least seven places. The most egregious -- `pageBreakBefore` as a literal section attribute -- directly contradicts the document's own Principle 1.2. The name of the field contains the word "page." It cannot be more obvious.

The fix is clear: create a `PresentationConfig` that lives alongside the content tree, keyed to node UUIDs, and let renderers combine content + config at render time. The content tree stays clean. Switching between modes is a config swap, not a tree mutation. The Five-Mode Proof passes.

The schema should answer the question: "What did the author write?" It should not answer: "How did the author want it to look on an A4 page?"

---

*This analysis was written against `round1-schema-architect.md` dated 2026-02-06.*
