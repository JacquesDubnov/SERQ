# SERQ Content Schema Specification

**Role:** Schema Architect
**Date:** 2026-02-06
**Status:** Round 1 -- Formal Specification

---

## 0. Diagnosis: Why the Current Architecture Breaks

Before prescribing, the diagnosis.

The root problem is not "pagination is hard." The root problem is that SERQ has **no explicit content hierarchy between the document and the block**. The ProseMirror schema today is:

```
doc
  block+   (paragraph | heading | columnBlock | bulletList | ...)
```

That is a flat list of blocks inside a single document node. Pagination is then bolted on as a visual DOM transformation (the Pages extension creates `<div class="page">` wrappers around chunks of this flat list). Because there is no structural notion of "section," "page break," or "flow region" in the data model, the presentation layer must maintain its own parallel coordinate system: `clipIndicatorToCurrentPage`, `isPointInForbiddenZone`, `getPageNumberForElement`. Every interaction system (drag, hover, selection) must then ask: "Am I in paginated mode? If so, which page am I on? Where are the forbidden zones?"

This is the textbook symptom of a missing abstraction. The fix is not "make the pagination code better." The fix is to add the missing level of hierarchy so that pagination becomes a natural consequence of the data model rather than an overlay on top of it.

---

## 1. Design Principles

### 1.1 The Recursive Self-Similarity Principle

Every node at every level of the hierarchy is a **viable unit**: it has identity, type, ordered content, style parameters, and metadata. A paragraph is a viable unit. A section is a viable unit. A document is a viable unit. The operations that work on a paragraph (move, copy, style, reference) also work on a section and on a document. The API is the same shape at every level.

### 1.2 The Presentation Agnosticism Principle

The content schema describes **what** the content is and **how it relates to other content**. It does not describe how content is laid out on a page, screen, or slide. Layout is a function applied to the schema, not embedded in it. The same document renders in:
- Continuous flow (scrolling)
- Paginated view (A4, Letter, etc.)
- Outline view (collapsed hierarchy)
- Slide view (one section per slide)
- Print view

No schema change required between modes. The schema is the invariant.

### 1.3 The ProseMirror Compatibility Principle

ProseMirror is a tree with ordered children. Its schema system uses content expressions (formal grammars) to specify what can go where. Marks are applied to inline content. Attributes are key-value pairs on nodes. This is the substrate we build on -- we do not fight it.

Graph-like relationships (cross-references, semantic links) are overlaid via marks, attributes, or a separate edge registry. They are not structural children.

### 1.4 The Single Source of Truth Principle

There is exactly one document tree. There are no shadow trees, no parallel DOM structures, no mode-specific data paths. The interaction layer reads from one tree and writes to one tree. Period.

---

## 2. Core Node Type Hierarchy

### 2.1 The Seven Levels

```
Level 0: Atom         -- character, inline object (image inline, emoji, mention)
Level 1: TextRun      -- contiguous characters sharing the same marks (ProseMirror text node)
Level 2: Block        -- paragraph, heading, codeBlock, image, horizontalRule
Level 3: Container    -- columnBlock, blockquote, listItem, callout
Level 4: Section      -- titled grouping of blocks (NEW)
Level 5: Document     -- the root (existing `doc` node)
Level 6: Composition  -- multi-document collection (FUTURE, not in Phase 1)
```

Levels 0-1 are ProseMirror's existing inline content model. Levels 2-3 are the existing block model. **Level 4 is the missing level** that solves the pagination problem.

### 2.2 The Section Node

The section is the critical addition. A section is a named, styled grouping of blocks that acts as the **unit of flow** for layout engines. In continuous mode, sections flow one after another. In paginated mode, sections are the units that get distributed across pages (with page breaks happening between or within sections based on break rules). In outline mode, sections are the collapsible nodes. In slide mode, each section is a slide.

```
doc
  section*
    (block | container)+
```

This is the minimal change that eliminates the need for mode-specific interaction code.

---

## 3. TypeScript Interface Definitions

### 3.1 Base Node Interface

Every node at every level conforms to this shape:

```typescript
/**
 * SerqNodeBase -- the recursive viable unit.
 *
 * Every field is justified:
 * - id: Stable identity across sessions. ProseMirror positions change on every
 *   edit; UUIDs do not. Required for cross-references, collaboration, and
 *   version diffing.
 * - type: Discriminant for the union type. Maps 1:1 to ProseMirror node name.
 * - content: Ordered children (tree structure). Matches ProseMirror Fragment.
 * - marks: Inline style/semantic annotations. Only relevant for text nodes but
 *   defined here for uniformity.
 * - attrs: Node-specific key-value attributes. Maps 1:1 to ProseMirror attrs.
 * - styleParams: Presentation-layer style hints. NOT layout instructions --
 *   these are things like "this paragraph has textAlign: center" or "this
 *   heading uses fontFamily: Georgia". They travel WITH the content.
 * - meta: Non-content metadata (creation time, last modified, tags, etc.).
 *   Not rendered. Not part of the document's visible content.
 */
interface SerqNodeBase {
  /** Stable UUID. Generated on creation, preserved through edits. */
  id: string

  /** ProseMirror node type name. Discriminant for the union. */
  type: string

  /**
   * Ordered child nodes. Empty array for leaf nodes.
   * ProseMirror enforces content expressions (the grammar) -- this is the
   * TypeScript representation of Fragment.
   */
  content: SerqNode[]

  /**
   * Inline marks (bold, italic, link, textStyle, etc.).
   * Only meaningful on text runs. Empty array for block/container nodes.
   */
  marks: SerqMark[]

  /**
   * Node-specific attributes. These are the ProseMirror attrs.
   * Examples: heading.level, columnBlock.columns, image.src
   */
  attrs: Record<string, unknown>

  /**
   * Style parameters that travel with the content.
   * These are presentation hints, not layout directives.
   * Examples: textAlign, lineHeight, blockFontFamily, letterSpacing
   *
   * Key distinction from attrs: attrs define WHAT the node IS (a heading of
   * level 2). styleParams define HOW it LOOKS (centered, with 1.8 line height).
   * A heading is always a heading regardless of styleParams. But its visual
   * rendering changes.
   */
  styleParams: StyleParams

  /**
   * Non-rendered metadata. For tooling, versioning, and semantic enrichment.
   * Not serialized to the visible document. Stored as ProseMirror attrs with
   * a `meta_` prefix to distinguish from content attrs.
   */
  meta: NodeMeta
}
```

### 3.2 Style Parameters

```typescript
/**
 * Style parameters that travel with content.
 *
 * These are NOT CSS properties -- they are abstract style intentions that
 * the rendering layer interprets. The same styleParams render differently
 * in a print stylesheet vs. a screen stylesheet.
 *
 * All fields are nullable. Null means "inherit from parent or use default."
 * This enables the cascading pattern: a section can set fontFamily, and all
 * blocks within inherit it unless they override.
 */
interface StyleParams {
  // Typography
  textAlign?: 'left' | 'center' | 'right' | 'justify' | null
  lineHeight?: number | null          // unitless ratio (1.5 = 150%)
  letterSpacing?: number | null       // px
  fontFamily?: string | null          // CSS font stack
  fontSize?: number | null            // px
  fontWeight?: number | null          // 100-900
  color?: string | null               // CSS color value

  // Spacing (relative to surrounding blocks -- not absolute positioning)
  spacingBefore?: number | null       // line-height units
  spacingAfter?: number | null        // line-height units

  // Visual
  backgroundColor?: string | null
  borderStyle?: string | null         // for callouts, blockquotes

  // Extensible: new style params can be added without schema migration
  [key: string]: unknown
}
```

### 3.3 Node Metadata

```typescript
/**
 * Non-rendered metadata attached to nodes.
 *
 * Stored as ProseMirror attrs with `meta_` prefix.
 * Not serialized to HTML output (stripped on export).
 * Preserved in .serq file format.
 */
interface NodeMeta {
  /** ISO timestamp of creation. Set once, never changed. */
  createdAt?: string

  /** ISO timestamp of last modification. Updated on every edit. */
  modifiedAt?: string

  /**
   * Semantic tags for filtering, search, and AI processing.
   * Examples: ['abstract', 'methodology', 'conclusion']
   * Free-form strings. No controlled vocabulary enforced at schema level.
   */
  tags?: string[]

  /**
   * Named bookmarks/anchors for cross-referencing.
   * A section with bookmark 'methods' can be referenced as #methods.
   */
  bookmark?: string

  /**
   * Break hint for paginated rendering.
   * 'before': force page break before this node.
   * 'after': force page break after this node.
   * 'avoid': avoid breaking inside this node.
   * null: default (break where needed).
   *
   * These are HINTS, not commands. The layout engine respects them
   * within physical constraints.
   */
  breakHint?: 'before' | 'after' | 'avoid' | null

  /** Comments/annotations thread IDs attached to this node. */
  commentThreadIds?: string[]

  /** Extensible metadata. */
  [key: string]: unknown
}
```

### 3.4 Mark Definitions

```typescript
/**
 * Inline marks -- applied to text runs within blocks.
 *
 * ProseMirror marks are unordered sets on text nodes. They represent
 * inline formatting and semantic annotations.
 */
interface SerqMark {
  type: SerqMarkType
  attrs: Record<string, unknown>
}

type SerqMarkType =
  // Semantic marks (meaning)
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'subscript'
  | 'superscript'
  | 'link'           // attrs: { href, target, rel }

  // Style marks (appearance)
  | 'textStyle'      // attrs: { fontSize, fontFamily, fontWeight, color, letterSpacing }
  | 'highlight'      // attrs: { color }

  // Semantic annotation marks (non-visual)
  | 'comment'        // attrs: { threadId }
  | 'suggestion'     // attrs: { suggestionId, type: 'insert' | 'delete' }
  | 'crossRef'       // attrs: { targetId, targetType }
```

### 3.5 Concrete Node Types

#### Level 5: Document

```typescript
interface DocNode extends SerqNodeBase {
  type: 'doc'
  content: SectionNode[]  // In new schema: sections only
  attrs: {
    /** Document-level language for RTL/LTR and spellcheck */
    lang?: string
    /** Document-level writing direction */
    dir?: 'ltr' | 'rtl' | 'auto'
  }
  meta: NodeMeta & {
    /** Document title (may differ from filename) */
    title?: string
    /** Author */
    author?: string
    /** Abstract/summary for outline views */
    summary?: string
  }
}
```

#### Level 4: Section (NEW)

```typescript
/**
 * Section -- the unit of structural organization.
 *
 * Justification for existence:
 * 1. Pagination: sections are the natural break points. Page breaks happen
 *    between sections (or within sections if they overflow). The layout
 *    engine does not need to scan a flat block list and guess where pages
 *    should end.
 * 2. Outline: sections are the collapsible units. An outline view shows
 *    the section tree.
 * 3. Styling: a section can have its own style params (different font for
 *    the appendix, different column layout for the bibliography).
 * 4. Drag-and-drop: dragging a section moves all its blocks atomically.
 *    No more mode-specific code for "which blocks belong together."
 * 5. Cross-references: "See Section 3" targets a section node, not a
 *    position that shifts on every edit.
 *
 * Content: one or more blocks/containers. Sections cannot nest (flat within
 * doc). This is deliberate -- deep nesting adds complexity with marginal
 * benefit. If true nesting is needed later, a `subsection` type can be
 * added inside section without changing the doc-level grammar.
 */
interface SectionNode extends SerqNodeBase {
  type: 'section'
  content: (BlockNode | ContainerNode)[]
  attrs: {
    /**
     * Optional heading level that this section "owns."
     * When present, the first heading in the section is considered the
     * section title. This enables outline generation without parsing content.
     * null means untitled section (e.g., document preamble).
     */
    level?: 1 | 2 | 3 | 4 | 5 | 6 | null

    /**
     * Section numbering style. null = inherit from document settings.
     * 'none': no number. 'decimal': 1, 2, 3. 'alpha': A, B, C.
     */
    numbering?: 'none' | 'decimal' | 'alpha' | 'roman' | null

    /**
     * Whether this section starts a new page in paginated mode.
     * Shorthand for meta.breakHint = 'before' (but more explicit).
     */
    pageBreakBefore?: boolean

    /**
     * Column layout for content within this section.
     * null = single column (default). This replaces the need for
     * columnBlock at the section level (though columnBlock still
     * exists for inline column layouts within a section).
     */
    columns?: number | null
    columnWidths?: number[] | null
    columnGutter?: number | null
  }
}
```

#### Level 3: Container Nodes

```typescript
/**
 * Container nodes hold other blocks. They add structure but not content.
 */

interface ColumnBlockNode extends SerqNodeBase {
  type: 'columnBlock'
  content: ColumnNode[]  // 2-4 columns
  attrs: {
    columns: number            // 2-4
    columnWidths: number[]     // fractions summing to 1.0
    gutter: number             // px
  }
}

interface ColumnNode extends SerqNodeBase {
  type: 'column'
  content: BlockNode[]  // block+
  attrs: {}             // no column-specific attrs (width comes from parent)
}

interface BlockquoteNode extends SerqNodeBase {
  type: 'blockquote'
  content: BlockNode[]  // block+
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
  attrs: {
    start: number  // starting number
  }
}

interface ListItemNode extends SerqNodeBase {
  type: 'listItem'
  content: (BlockNode | BulletListNode | OrderedListNode)[]  // block+ for nested lists
  attrs: {}
}

/**
 * Callout -- a styled container with semantic meaning.
 * (Future node type, listed for completeness.)
 */
interface CalloutNode extends SerqNodeBase {
  type: 'callout'
  content: BlockNode[]
  attrs: {
    variant: 'info' | 'warning' | 'error' | 'success' | 'note'
  }
}
```

#### Level 2: Block Nodes

```typescript
interface ParagraphNode extends SerqNodeBase {
  type: 'paragraph'
  content: InlineNode[]  // inline*
  attrs: {}
  styleParams: StyleParams & {
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null
    lineHeight?: number | null
    letterSpacing?: number | null
    // Block typography (from BlockTypography extension)
    blockFontFamily?: string | null
    blockFontSize?: string | null
    blockFontWeight?: string | null
    blockColor?: string | null
  }
}

interface HeadingNode extends SerqNodeBase {
  type: 'heading'
  content: InlineNode[]  // inline*
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6
  }
  styleParams: StyleParams & {
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null
  }
}

interface CodeBlockNode extends SerqNodeBase {
  type: 'codeBlock'
  content: TextRunNode[]  // text*
  attrs: {
    language?: string | null
  }
}

interface ImageNode extends SerqNodeBase {
  type: 'image'
  content: []  // leaf node
  attrs: {
    src: string
    alt?: string
    title?: string
    width?: number | null
    height?: number | null
  }
}

interface HorizontalRuleNode extends SerqNodeBase {
  type: 'horizontalRule'
  content: []  // leaf node
  attrs: {}
}
```

#### Levels 0-1: Inline Content

```typescript
/**
 * Text run -- contiguous characters with the same mark set.
 * This is ProseMirror's native text node.
 */
interface TextRunNode extends SerqNodeBase {
  type: 'text'
  content: []  // text nodes are leaves in ProseMirror
  attrs: {
    /** The actual text content. In ProseMirror this is node.text, not an attr. */
    text: string
  }
  marks: SerqMark[]
}

/**
 * Inline nodes -- non-text inline content.
 * ProseMirror models these as inline nodes with `inline: true, group: 'inline'`.
 */
interface MentionNode extends SerqNodeBase {
  type: 'mention'
  content: []
  attrs: {
    id: string
    label: string
  }
}

type InlineNode = TextRunNode | MentionNode
// Future: InlineImage, Emoji, InlineMath, etc.
```

### 3.6 Union Type

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

type ContainerNode =
  | ColumnBlockNode
  | BlockquoteNode
  | BulletListNode
  | OrderedListNode
  | CalloutNode
```

---

## 4. Relationship and Edge Types

ProseMirror's tree structure handles containment natively. For graph-like relationships, we use two mechanisms:

### 4.1 Containment (Structural, Tree)

Implicit in the `content` field. The tree structure.

```
doc > section > paragraph > text
doc > section > columnBlock > column > paragraph > text
doc > section > blockquote > paragraph > text
```

Parent-child relationships are the only structural relationship in ProseMirror. They are total: every node except `doc` has exactly one parent. They are ordered: children have a defined sequence.

### 4.2 Cross-References (Semantic, Graph-like)

Implemented as marks on inline content:

```typescript
/**
 * CrossRef mark -- a hyperlink-like reference to another node in the document.
 *
 * Rendered as a clickable reference (e.g., "See Section 3" or "Figure 2.1").
 * The targetId is a node UUID, not a position. This survives edits.
 *
 * Implementation: stored as a mark attribute. Resolved at render time by
 * looking up the targetId in a Map<string, {pos: number, node: SerqNode}>
 * maintained by a ProseMirror plugin.
 */
interface CrossRefMark {
  type: 'crossRef'
  attrs: {
    targetId: string          // UUID of the target node
    targetType: 'section' | 'heading' | 'image' | 'table' | 'footnote'
    displayFormat: 'number' | 'title' | 'page' | 'full'  // how to render
  }
}
```

### 4.3 Dependency Edges (External Registry)

Some relationships do not fit in the ProseMirror tree. These are stored in a separate Zustand store (not in the document):

```typescript
/**
 * Edge registry -- maintained outside the ProseMirror document.
 *
 * Used for:
 * - Table of contents generation (section ordering)
 * - Figure/table numbering (image/table ordering within sections)
 * - Footnote back-references
 * - Comment thread association
 *
 * This is a derived data structure, recomputed when the document changes.
 * It is NOT serialized. It is NOT part of the content schema.
 */
interface EdgeRegistry {
  /** Map from node UUID to its resolved position in the document */
  nodePositions: Map<string, number>

  /** Map from node UUID to its parent section UUID */
  sectionMembership: Map<string, string>

  /** Ordered list of section UUIDs (for numbering) */
  sectionOrder: string[]

  /** Map from bookmark name to node UUID */
  bookmarks: Map<string, string>

  /** Resolved cross-reference targets */
  crossRefTargets: Map<string, { uuid: string; label: string; pageNumber?: number }>
}
```

This registry is rebuilt by a ProseMirror plugin on every document change (similar to how the existing normalize plugin works). It is cheap because it only walks the top two levels of the tree (sections and their direct children).

---

## 5. Composition Rules (Formal Grammar)

### 5.1 ProseMirror Content Expressions

These are the content expressions that define the schema grammar. They map directly to ProseMirror's `content` field in node specs.

```
doc           := section+
section       := (block | container)+
container     := columnBlock | blockquote | bulletList | orderedList | callout
columnBlock   := column{2,4}
column        := (block | container)+       // except columnBlock (no nesting)
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

### 5.2 ProseMirror Group Assignments

```
Node            Groups
----            ------
section         'section'
paragraph       'block'
heading         'block'
codeBlock       'block'
image           'block'
horizontalRule  'block'
columnBlock     'container'  (also in group 'sectionContent')
blockquote      'container'  (also in group 'sectionContent')
bulletList      'container'  (also in group 'sectionContent')
orderedList     'container'  (also in group 'sectionContent')
callout         'container'  (also in group 'sectionContent')
column          'column'
listItem        'listItem'
text            'inline'
mention         'inline'
```

The `sectionContent` group is the union used in section's content expression: `(block | sectionContent)+` which ProseMirror interprets as any node in the 'block' or 'sectionContent' group.

### 5.3 Key Grammar Constraints

1. **Sections cannot nest.** `doc` contains only sections. Sections contain blocks and containers. If hierarchical sections are needed in the future, add a `subsection` node inside sections rather than allowing recursive section nesting.

2. **ColumnBlocks cannot nest.** A column can contain blocks and containers EXCEPT columnBlock. Enforced by the normalize plugin (existing behavior, preserved).

3. **Lists can nest.** A listItem can contain bulletList or orderedList, enabling nested lists.

4. **Sections cannot be empty.** The content expression `(block | container)+` requires at least one child. ProseMirror auto-inserts a paragraph when a section would become empty.

5. **The document cannot be empty.** `section+` requires at least one section. The default document is `doc > section > paragraph`.

---

## 6. Constraint Invariants

These invariants must hold at ALL times. The normalize plugin and schema validation enforce them.

### INV-1: Unique Node IDs

Every node in the document tree has a unique UUID in its `id` attr. No two nodes share an ID. IDs are generated on node creation and preserved through cut/copy/paste/undo/redo.

**Enforcement:** A ProseMirror plugin checks for duplicate IDs in `appendTransaction` and regenerates duplicates (can occur on paste).

### INV-2: Section Containment

Every block and container node is a descendant of exactly one section. There are no "orphan" blocks floating directly under `doc`.

**Enforcement:** The ProseMirror schema's content expression for `doc` is `section+`. Any attempt to insert a block directly into `doc` fails schema validation. Paste/drop operations wrap blocks in a section if needed.

### INV-3: Column Count Consistency

A `columnBlock` node's `columns` attr always equals its actual child count. The `columnWidths` array always has length equal to `columns`. The widths always sum to approximately 1.0 (within 0.01 tolerance).

**Enforcement:** Existing normalize plugin (preserved from current implementation).

### INV-4: No Nested ColumnBlocks

A `column` node never contains a `columnBlock` as a descendant.

**Enforcement:** Existing normalize plugin (unwraps nested columnBlocks).

### INV-5: Valid Cross-References

Every `crossRef` mark's `targetId` points to a node that exists in the document. If the target is deleted, the cross-reference mark is removed or marked as broken.

**Enforcement:** A ProseMirror plugin validates cross-references on document change and removes or decorates broken references.

### INV-6: Style Cascade

Style parameters cascade from parent to child. A block with `styleParams.fontFamily = null` inherits from its section. A section with `styleParams.fontFamily = null` inherits from the document-level style (managed by styleStore). Explicit values override inherited values.

**Enforcement:** The rendering layer resolves the cascade. The schema stores only explicit values (null means "inherit").

### INV-7: Break Hints are Hints

`meta.breakHint` values are advisory. The layout engine respects them when physically possible but may override them (e.g., a `breakHint: 'avoid'` on a block taller than a page must still break).

**Enforcement:** Layout engine, not schema validation.

---

## 7. Worked Examples

### 7.1 Simple Paragraph with Bold and Italic

A paragraph containing: "The **quick** brown *fox* jumps."

```typescript
const example1: SectionNode = {
  id: 'sec-001',
  type: 'section',
  content: [{
    id: 'para-001',
    type: 'paragraph',
    content: [
      {
        id: 'txt-001',
        type: 'text',
        content: [],
        marks: [],
        attrs: { text: 'The ' },
        styleParams: {},
        meta: {},
      },
      {
        id: 'txt-002',
        type: 'text',
        content: [],
        marks: [{ type: 'bold', attrs: {} }],
        attrs: { text: 'quick' },
        styleParams: {},
        meta: {},
      },
      {
        id: 'txt-003',
        type: 'text',
        content: [],
        marks: [],
        attrs: { text: ' brown ' },
        styleParams: {},
        meta: {},
      },
      {
        id: 'txt-004',
        type: 'text',
        content: [],
        marks: [{ type: 'italic', attrs: {} }],
        attrs: { text: 'fox' },
        styleParams: {},
        meta: {},
      },
      {
        id: 'txt-005',
        type: 'text',
        content: [],
        marks: [],
        attrs: { text: ' jumps.' },
        styleParams: {},
        meta: {},
      },
    ],
    marks: [],
    attrs: {},
    styleParams: {
      textAlign: null,      // inherit from section/document default
      lineHeight: null,     // inherit
    },
    meta: {},
  }],
  marks: [],
  attrs: { level: null, numbering: null, pageBreakBefore: false },
  styleParams: {},
  meta: {},
}
```

**ProseMirror JSON equivalent:**

```json
{
  "type": "section",
  "attrs": { "id": "sec-001" },
  "content": [{
    "type": "paragraph",
    "attrs": { "id": "para-001" },
    "content": [
      { "type": "text", "text": "The " },
      { "type": "text", "text": "quick", "marks": [{ "type": "bold" }] },
      { "type": "text", "text": " brown " },
      { "type": "text", "text": "fox", "marks": [{ "type": "italic" }] },
      { "type": "text", "text": " jumps." }
    ]
  }]
}
```

### 7.2 Two-Column Layout with Paragraphs and an Image

A section containing a column layout: left column has two paragraphs, right column has an image with a caption.

```typescript
const example2: SectionNode = {
  id: 'sec-002',
  type: 'section',
  content: [{
    id: 'colblock-001',
    type: 'columnBlock',
    content: [
      // Left column
      {
        id: 'col-001',
        type: 'column',
        content: [
          {
            id: 'para-010',
            type: 'paragraph',
            content: [{
              id: 'txt-010',
              type: 'text',
              content: [],
              marks: [],
              attrs: { text: 'Methodology overview text goes here.' },
              styleParams: {},
              meta: {},
            }],
            marks: [],
            attrs: {},
            styleParams: {},
            meta: {},
          },
          {
            id: 'para-011',
            type: 'paragraph',
            content: [{
              id: 'txt-011',
              type: 'text',
              content: [],
              marks: [],
              attrs: { text: 'We employed a mixed-methods approach.' },
              styleParams: {},
              meta: {},
            }],
            marks: [],
            attrs: {},
            styleParams: {},
            meta: {},
          },
        ],
        marks: [],
        attrs: {},
        styleParams: {},
        meta: {},
      },
      // Right column
      {
        id: 'col-002',
        type: 'column',
        content: [
          {
            id: 'img-001',
            type: 'image',
            content: [],
            marks: [],
            attrs: {
              src: '/assets/methodology-diagram.png',
              alt: 'Methodology flow diagram',
              width: 400,
              height: 300,
            },
            styleParams: {},
            meta: {
              bookmark: 'fig-methodology',
              tags: ['figure', 'methodology'],
            },
          },
          {
            id: 'para-012',
            type: 'paragraph',
            content: [{
              id: 'txt-012',
              type: 'text',
              content: [],
              marks: [{ type: 'italic', attrs: {} }],
              attrs: { text: 'Figure 1: Methodology flow diagram' },
              styleParams: {},
              meta: {},
            }],
            marks: [],
            attrs: {},
            styleParams: { textAlign: 'center', fontSize: 12 },
            meta: {},
          },
        ],
        marks: [],
        attrs: {},
        styleParams: {},
        meta: {},
      },
    ],
    marks: [],
    attrs: {
      columns: 2,
      columnWidths: [0.6, 0.4],
      gutter: 24,
    },
    styleParams: {},
    meta: {},
  }],
  marks: [],
  attrs: { level: 2, numbering: 'decimal', pageBreakBefore: false },
  styleParams: {},
  meta: { bookmark: 'methodology' },
}
```

### 7.3 Section with Headings, Paragraphs, and Cross-Reference

A "Results" section that cross-references the "Methodology" section from Example 7.2.

```typescript
const example3: SectionNode = {
  id: 'sec-003',
  type: 'section',
  content: [
    // Section heading
    {
      id: 'h-001',
      type: 'heading',
      content: [{
        id: 'txt-020',
        type: 'text',
        content: [],
        marks: [],
        attrs: { text: 'Results' },
        styleParams: {},
        meta: {},
      }],
      marks: [],
      attrs: { level: 2 },
      styleParams: {},
      meta: {},
    },
    // Body paragraph with cross-reference
    {
      id: 'para-020',
      type: 'paragraph',
      content: [
        {
          id: 'txt-021',
          type: 'text',
          content: [],
          marks: [],
          attrs: { text: 'Using the approach described in ' },
          styleParams: {},
          meta: {},
        },
        {
          id: 'txt-022',
          type: 'text',
          content: [],
          marks: [{
            type: 'crossRef',
            attrs: {
              targetId: 'sec-002',               // UUID of the Methodology section
              targetType: 'section',
              displayFormat: 'title',             // renders as "Methodology"
            },
          }],
          attrs: { text: 'Section 2' },           // fallback display text
          styleParams: {},
          meta: {},
        },
        {
          id: 'txt-023',
          type: 'text',
          content: [],
          marks: [],
          attrs: { text: ', we obtained the following results.' },
          styleParams: {},
          meta: {},
        },
      ],
      marks: [],
      attrs: {},
      styleParams: {},
      meta: {},
    },
    // Results paragraph
    {
      id: 'para-021',
      type: 'paragraph',
      content: [{
        id: 'txt-024',
        type: 'text',
        content: [],
        marks: [],
        attrs: { text: 'The primary outcome measure showed a 23% improvement.' },
        styleParams: {},
        meta: {},
      }],
      marks: [],
      attrs: {},
      styleParams: {},
      meta: {},
    },
    // Reference to figure in methodology section
    {
      id: 'para-022',
      type: 'paragraph',
      content: [
        {
          id: 'txt-025',
          type: 'text',
          content: [],
          marks: [],
          attrs: { text: 'As shown in ' },
          styleParams: {},
          meta: {},
        },
        {
          id: 'txt-026',
          type: 'text',
          content: [],
          marks: [{
            type: 'crossRef',
            attrs: {
              targetId: 'img-001',                // UUID of the methodology diagram
              targetType: 'image',
              displayFormat: 'number',             // renders as "Figure 1"
            },
          }],
          attrs: { text: 'Figure 1' },
          styleParams: {},
          meta: {},
        },
        {
          id: 'txt-026b',
          type: 'text',
          content: [],
          marks: [],
          attrs: { text: ', the flow clearly delineates each phase.' },
          styleParams: {},
          meta: {},
        },
      ],
      marks: [],
      attrs: {},
      styleParams: {},
      meta: {},
    },
  ],
  marks: [],
  attrs: { level: 2, numbering: 'decimal', pageBreakBefore: true },
  styleParams: {},
  meta: { bookmark: 'results' },
}
```

**Key observations about this example:**
- The cross-reference to `sec-002` uses a stable UUID, not a position. If the Methodology section moves, the reference still resolves.
- `pageBreakBefore: true` tells the layout engine to start this section on a new page in paginated mode. In continuous mode, it is ignored.
- The image cross-reference targets `img-001` by UUID. The display text "Figure 1" is a fallback; the render layer resolves the actual number dynamically.

---

## 8. How This Schema Solves the Pagination Problem

### 8.1 The Current Problem (Detailed)

Today, the block indicator plugin (~1400 lines) contains at least 15 pagination-specific code paths:

| Code Path | Location | What It Does |
|-----------|----------|--------------|
| `clipIndicatorToCurrentPage` | plugin.ts ~298, ~174, ~517, ~966 | Clips block rect to page boundaries |
| `isPointInForbiddenZone` | plugin.ts ~901 | Hides indicator in page gaps |
| `isNonContentArea` | plugin.ts ~284, ~375, ~502, ~957, ~1101 | Skips headers/footers |
| `isPaginationEnabled` | plugin.ts ~166, ~289, ~348, ~496, ~961, ~1113 | Mode check |
| `getPageNumberForElement` | plugin.ts ~364, ~529 | Associates blocks with pages |
| `pageNumber` tracking | types.ts ~52 | Per-block page number in selection state |
| Page-aware gap finding | plugin.ts ~385-388 | Different gap behavior across page boundaries |

Every one of these exists because the data model has no concept of "where does one page's content end and another's begin." The pagination DOM layer knows, but the interaction layer has to reverse-engineer it from DOM measurements.

### 8.2 How the Section Node Eliminates This

With sections as the unit of structural organization:

1. **Page assignment becomes a derived property.** The layout engine assigns sections (and their blocks) to pages. It stores this assignment in the EdgeRegistry: `sectionToPage: Map<string, number>`. The interaction layer looks up page assignment by section UUID, not by measuring DOM rects against forbidden zones.

2. **`clipIndicatorToCurrentPage` disappears.** The block indicator plugin asks: "What section is this block in? What page is that section on?" If the block is on page 3 and the mouse is on page 2, don't show the indicator. Simple membership test, no coordinate geometry.

3. **`isPointInForbiddenZone` disappears.** Page gaps are between sections. The interaction layer knows section boundaries from the tree structure. It does not need to scan the DOM for `.tiptap-pagination-gap` elements.

4. **Drag-and-drop becomes mode-agnostic.** When dragging a block, the drop targets are:
   - Before/after any block within the same section
   - At the beginning/end of any section
   - Between sections (reorders sections)

   These drop targets are computed from the tree structure, not from DOM coordinates. The same logic works in continuous mode, paginated mode, and outline mode.

5. **The `paginationEnabled` check disappears from the interaction layer.** The interaction layer does not know or care whether pagination is enabled. It works with sections, blocks, and drop positions. The visual rendering layer decides whether to draw page boundaries, headers, footers. The interaction layer is presentation-agnostic.

### 8.3 The Layout Engine Contract

The layout engine is a pure function:

```
layoutEngine(document: DocNode, config: LayoutConfig) -> LayoutResult
```

Where:

```typescript
interface LayoutConfig {
  mode: 'continuous' | 'paginated' | 'outline' | 'slide'
  pageSize?: { width: number; height: number }
  margins?: { top: number; bottom: number; left: number; right: number }
}

interface LayoutResult {
  /** Which page each section starts on (1-indexed) */
  sectionPages: Map<string, number>

  /** For each block UUID, its page number */
  blockPages: Map<string, number>

  /** Page break positions (between which sections) */
  pageBreaks: Array<{ afterSectionId: string; pageNumber: number }>

  /**
   * Total page count.
   * In continuous mode: always 1 (everything is on "page 1").
   * In paginated mode: computed from content + page size.
   */
  pageCount: number
}
```

In continuous mode, `layoutEngine` returns a trivial result: all sections on page 1, no page breaks, page count 1. In paginated mode, it computes real pagination. The interaction layer consumes the LayoutResult without knowing which mode produced it.

---

## 9. Migration Path

### 9.1 What Changes

| Aspect | Current | New | Migration Effort |
|--------|---------|-----|------------------|
| doc content | `block+` | `section+` | Medium |
| Section node | Does not exist | New node type | New extension |
| Block groups | `'block'` | `'block'` (unchanged) | None |
| Container groups | `'block'` for columnBlock | `'container'` + `'block'` | Small rename |
| Node IDs | None | UUID in `id` attr | New plugin |
| styleParams | Mixed into attrs | Separated conceptually (still attrs in PM) | Naming convention |
| Pagination | DOM overlay | Section-aware layout engine | Significant |
| Block indicator | Pagination-specific code paths | Section-aware, mode-agnostic | Significant refactor |
| Column extension | Unchanged structurally | Unchanged structurally | None |
| Marks | Unchanged | Unchanged + `crossRef` addition | Additive |

### 9.2 Phase 1: Add Section Node (Non-Breaking)

This is the critical first step. It can be done without breaking existing functionality:

1. **Create the `section` extension.** Define the node with `group: 'section'`, `content: '(block | container)+'`, `isolating: true`, `defining: true`.

2. **Change `doc` content expression** from `block+` to `section+`.

3. **Add migration logic** in a ProseMirror plugin that, on document load, wraps any bare top-level blocks in a section. This is a one-time transformation on `setContent()`.

```typescript
// Migration: wrap bare blocks in sections
function migrateToSections(doc: PMNode, schema: Schema): PMNode {
  const sectionType = schema.nodes.section
  if (!sectionType) return doc

  // If doc already has sections, no migration needed
  if (doc.content.firstChild?.type.name === 'section') return doc

  // Wrap all top-level blocks in a single section
  const section = sectionType.create(
    { id: generateUUID() },
    doc.content
  )
  return schema.nodes.doc.create(null, [section])
}
```

4. **Update the block indicator plugin** to be section-aware. Phase 1 keeps the pagination code paths but adds section-level drag targets. The pagination-specific code is removed in Phase 2.

5. **Add UUID generation.** A plugin assigns UUIDs to any node missing one. This runs on every document load and paste operation.

### 9.3 Phase 2: Section-Aware Layout Engine

1. Replace the Pages extension's DOM manipulation with a section-based layout engine.
2. Remove all `clipIndicatorToCurrentPage`, `isPointInForbiddenZone`, `isPaginationEnabled` calls from the block indicator plugin.
3. The block indicator reads from LayoutResult instead of measuring DOM.

### 9.4 Phase 3: Cross-References and Metadata

1. Add the `crossRef` mark.
2. Add the EdgeRegistry plugin.
3. Add bookmark attrs to nodes.
4. Implement outline view (reads section tree).

### 9.5 Backward Compatibility

Existing `.serq.html` files contain flat block lists without sections. The migration function (Phase 1, step 3) handles this transparently. Old files open in the new schema with all blocks wrapped in a single section. No data loss. No user action required.

---

## 10. ProseMirror Schema Definition (Concrete)

This is what the actual ProseMirror schema spec looks like:

```typescript
import { Node } from '@tiptap/core'

export const Section = Node.create({
  name: 'section',

  group: 'section',

  content: '(block | container)+',

  // A section is a structural boundary. Cursor navigation stops at section
  // edges; operations within a section don't affect siblings.
  isolating: true,

  // A section "defines" the context for its content. When you press Enter
  // at the end of a section, a new section is NOT created (unlike how
  // pressing Enter in a paragraph creates a new paragraph).
  defining: true,

  // Sections are draggable as units
  draggable: true,

  // Sections are selectable (for section-level operations)
  selectable: true,

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
      pageBreakBefore: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-page-break-before') === 'true',
        renderHTML: (attrs) => {
          if (!attrs.pageBreakBefore) return {}
          return { 'data-page-break-before': 'true' }
        },
      },
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
})
```

**Update to doc node:**

```typescript
// In the editor setup, override the doc content expression:
const Doc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'section+',
})
```

**Group assignments for containers:**

```typescript
// columnBlock -- add to both 'block' and 'container' groups
// so existing section content expression ('(block | container)+') matches
export const ColumnBlock = Node.create({
  name: 'columnBlock',
  group: 'block container',  // In both groups
  content: 'column{2,4}',
  // ... rest unchanged
})
```

Actually, the simpler approach that requires zero changes to existing block nodes: keep the doc content as `(section | block)+` during transition, then tighten to `section+` after migration.

```typescript
// Transition period: doc accepts both sections and bare blocks
const DocTransitional = Node.create({
  name: 'doc',
  topNode: true,
  content: '(section | block)+',
})
```

This means old documents load without migration. The normalize plugin wraps bare blocks in sections over time. New documents always use sections.

---

## 11. Performance Analysis

### 11.1 Section Overhead

Adding a section layer adds one node per section to the document tree. For a 500-page document with ~50 sections, that is 50 additional nodes. ProseMirror handles millions of nodes; 50 is noise.

### 11.2 UUID Storage

Each node gets a UUID attr (36 characters). For a 500-page document with ~5000 blocks, that is ~180KB of UUIDs. Negligible.

### 11.3 EdgeRegistry Rebuild

The EdgeRegistry walks sections and their direct children on every document change. For 50 sections with 100 blocks each (5000 total), this is 5000 iterations. At ~1 microsecond per iteration, that is ~5ms. Well under the 16ms frame budget.

### 11.4 Layout Engine

The layout engine runs when:
- Pagination is toggled on/off
- The page size changes
- The document structure changes (section added/removed)
- A block's height changes (content edit)

For continuous mode, it is trivially fast (all content on page 1). For paginated mode, it walks sections and measures heights. With measured heights cached per section, this is O(sections) = O(50) for a 500-page document. Sub-millisecond.

### 11.5 Migration Cost

The migration function (wrapping bare blocks in sections) runs once per document load. It is O(blocks) = O(5000) for a large document. With ProseMirror's efficient node creation, this is ~10ms. Imperceptible.

---

## 12. Open Questions and Tradeoffs

### 12.1 Should Sections Nest?

**Current decision: No.**

Flat sections are simpler to implement, reason about, and interact with. The outline view is one level deep. Drag-and-drop targets are unambiguous.

The counterargument: academic papers have chapters > sections > subsections. A flat list requires users to use heading levels to imply hierarchy.

**Resolution:** Heading levels already imply hierarchy. The section's `level` attr captures this. A future `subsection` node can be added inside sections without changing the doc-level grammar. This is an additive change, not a breaking one.

### 12.2 Should `id` Be Required on All Nodes or Only Structural Ones?

**Current decision: All nodes.**

UUIDs on every node enable fine-grained cross-referencing, commenting, and diffing. The storage cost is negligible (see 11.2).

The counterargument: text runs change constantly. Assigning UUIDs to text nodes that are split and merged on every keystroke creates ID churn.

**Resolution:** Text nodes get UUIDs, but cross-references should target block-level or section-level nodes, not text runs. Text node UUIDs are useful for comment anchoring and collaborative editing, where you need to track "this specific word" across edits.

### 12.3 Should styleParams Be Separate from attrs or Merged?

**Current decision: Conceptually separate, physically merged.**

In ProseMirror, there is only `attrs`. The TypeScript interface separates `styleParams` from `attrs` for conceptual clarity, but in the actual ProseMirror schema, they are all stored as attributes with naming conventions:
- Content attrs: `level`, `src`, `columns` (what the node IS)
- Style attrs: `textAlign`, `lineHeight`, `blockFontFamily` (how it LOOKS)
- Meta attrs: `meta_createdAt`, `meta_bookmark` (non-rendered metadata)

No runtime separation. No performance cost. Just naming discipline.

### 12.4 The columnBlock Inside Section vs. Section-Level Columns

The schema supports BOTH:
- `section.attrs.columns` -- the section itself renders in multi-column layout
- `columnBlock` inside a section -- an inline column layout within a section

These serve different purposes. Section-level columns are like a newspaper layout (all content flows through columns). ColumnBlock is an explicit side-by-side arrangement of specific content.

For Phase 1, section-level columns are deferred. ColumnBlock is the only column mechanism. Section-level columns are Phase 3+.

---

## 13. Summary of Deliverables

| Deliverable | Section | Status |
|-------------|---------|--------|
| Core Node Type Definitions | 3.1 - 3.6 | Complete |
| Relationship/Edge Types | 4.1 - 4.3 | Complete |
| Composition Rules (Grammar) | 5.1 - 5.3 | Complete |
| Constraint Invariants | 6 (INV-1 through INV-7) | Complete |
| Worked Example: Simple paragraph | 7.1 | Complete |
| Worked Example: Two-column layout | 7.2 | Complete |
| Worked Example: Cross-reference | 7.3 | Complete |
| Pagination Solution Analysis | 8.1 - 8.3 | Complete |
| Migration Path | 9.1 - 9.5 | Complete |
| ProseMirror Schema Definition | 10 | Complete |
| Performance Analysis | 11.1 - 11.5 | Complete |
| Open Tradeoffs | 12.1 - 12.4 | Complete |

---

*This specification was written against SERQ codebase commit `de5322a` on branch `main`. All file references are to the actual codebase as of 2026-02-06.*
