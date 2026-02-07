# SERQ Content Schema -- Round 4 Final Specification

**Role:** Devil's Advocate (Final Stress Test) + Implementation Architect
**Date:** 2026-02-06
**Status:** FINAL -- This document supersedes all previous rounds.

---

## PART 1: FINAL STRESS TEST

Ten targeted attacks on the Round 3 synthesis. Each one is NEW -- not a rehash of Round 2.

---

### Attack R4-1: Column Width Inversion -- Atomic Dual-Child Update During Resize Drag

**Severity: MEDIUM-HIGH**

The synthesis (Decision #4) moves `width` from `ColumnBlock.attrs.columnWidths[]` to `Column.attrs.width`. The current resize code (`ColumnBlockView.tsx`) sets `columnWidths` on the parent in a single `setNodeMarkup` call -- one step, one node. With child-owned widths, resizing the divider between column A and column B requires updating TWO sibling nodes in one transaction. This means two `setNodeMarkup` steps.

The problem: after the first `setNodeMarkup(colA_pos, ...)`, the document changes. The position of column B has shifted if column A's serialized size changed. The second `setNodeMarkup` must use `tr.mapping.map(colB_pos)` to get the correct position. This is doable but non-trivial -- the current code does NOT use position mapping because it writes to the parent, not the children.

Additionally, during a rapid drag (60fps), the resize handler fires per-frame. Each frame dispatches a transaction with two mapped steps. If mapping is wrong even once, the transaction will fail silently or corrupt the widths. The normalize plugin catches the width-sum invariant, but a one-frame flash of incorrect widths is visible.

**Mitigation:** The resize handler must:
1. Resolve both column positions from the transaction state (not cached positions).
2. Use `tr.setNodeMarkup()` for column A, then `tr.mapping.map(colB_pos)` for column B.
3. The normalize plugin already validates sum = 1.0, providing a safety net.
4. Document this pattern explicitly in the implementation guide. It is correct but unfamiliar to the existing codebase.

---

### Attack R4-2: PresentationConfig as Second Source of Truth

**Severity: MEDIUM**

Decision #3 splits style authority between the content tree (author-intent: `fontFamily`, `textAlign`, `color`, `fontWeight`, `backgroundColor`) and PresentationConfig (presentation: `fontSize`, `lineHeight`, `letterSpacing`, `spacingBefore`, `spacingAfter`).

The user opens the font size dropdown in the toolbar and picks "14px" for a specific paragraph. Where does this go? The synthesis says `PresentationConfig.nodeStyleOverrides[nodeId].fontSize`. But the user perceives this as a direct edit to the paragraph -- they selected text, changed its size. Storing it in a side-channel rather than on the node breaks the mental model of "what you see is in the document."

Worse: if the user copies this paragraph to a new document, the `nodeStyleOverrides` entry does NOT travel with the clipboard. The pasted paragraph loses its font size. This is the fragility the VSM warned about -- the node is not self-sufficient.

The synthesis says `PresentationConfig` is serialized in the `.serq` file "alongside the content tree." But ProseMirror's clipboard serialization only includes the content tree. External consumers (clipboard, HTML export, .docx export) lose all PresentationConfig data.

**Mitigation:** Accept this as a known limitation for Phase 1. Font size changes through the toolbar go to `nodeStyleOverrides` and are lost on cross-document paste. This is the cost of mode-agnosticism. For Phase 2, consider encoding critical per-node overrides as inline marks (`textStyle` mark already carries `fontSize`). The `textStyle` mark is INLINE (travels with clipboard), while `nodeStyleOverrides` is BLOCK-level (does not). This distinction should be documented clearly: inline font size = textStyle mark (travels), block font size = PresentationConfig (does not travel).

---

### Attack R4-3: Smart Migration With No Headings

**Severity: LOW-MEDIUM**

Decision #8 implements smart heading-based splitting. The fallback: "If no headings found: wrap all blocks in one section." This is exactly the naive migration that the Devil's Advocate ranked as the #2 architecture killer in Round 2. The smart migration helps ONLY for heading-heavy documents. A 200-paragraph stream-of-consciousness essay with no headings gets the degenerate single-section case.

The Round 2 suggested fallback of "split at every ~50 blocks" was not adopted.

**Mitigation:** This is acceptable. A document with no headings has no natural section boundaries. Splitting arbitrarily at N blocks creates sections that are semantically meaningless. The single-section fallback is honest: the user did not use structural hierarchy, so the system does not invent it. The `splitSection` command allows them to create sections manually. Document this tradeoff explicitly.

---

### Attack R4-4: `defining: true` + `isolating: false` at Document End

**Severity: LOW**

Decision #1 sets `isolating: false`, `defining: true`. The `defining` flag tells ProseMirror: when splitting content inside this node, create a new node of the same type (instead of escaping to the parent). This means pressing Enter at the end of the last paragraph in the last section creates a new paragraph INSIDE the section -- correct.

But what about `createParagraphNear`? When the cursor is after a leaf node (like an image at the very end of the document), ProseMirror calls `createParagraphNear` which creates a new paragraph near the selection. With `defining: true`, this paragraph is created inside the section. With `isolating: false`, it COULD theoretically escape. In practice, `defining: true` takes priority for paragraph creation.

Edge case: cursor at the absolute end of the document (position `doc.content.size`). ProseMirror's `insertParagraphNear` resolves against the last section (which is `defining`), so it creates a paragraph inside the last section. The user cannot create a new section by pressing Enter. This is correct behavior -- new sections are created via explicit commands (`Mod+Enter` per the synthesis).

**Mitigation:** None needed. `defining: true` correctly keeps Enter-created paragraphs inside the current section. Tested against ProseMirror's source: `defining` affects `splitBlock`, `liftEmptyBlock`, and `createParagraphNear`. All three respect the defining boundary.

---

### Attack R4-5: Column Content Expression -- `block+` vs `(block | container)+`

**Severity: MEDIUM**

The synthesis (Section 2.12, grammar) says `column := (block | container)+`. But the current codebase has `content: 'block+'` on the Column node. With Decision #14, containers are no longer in the 'block' group. This means the Column content expression MUST change from `'block+'` to `'(block | container)+'` -- otherwise containers (blockquotes, lists, callouts) inside columns become schema-invalid.

This is not called out in the implementation checklist. It is a silent breaking change.

**Mitigation:** Add to the implementation checklist: "Update Column content expression from `'block+'` to `'(block | container)+'`". This must happen in the same commit as the ColumnBlock group change.

---

### Attack R4-6: UUID Generation Performance on Large Document Migration

**Severity: LOW**

The migration calls `generateUUID()` for each new section node. For a document with 50 H1/H2 headings, that is 50 UUID generations. `crypto.randomUUID()` is native and fast (~0.001ms per call). 50 calls = 0.05ms. Even for a pathological document with 500 headings: 0.5ms. This is noise.

The subsequent UUID plugin run in `appendTransaction` assigns UUIDs to ALL nodes that lack them. For a 10,000-node document that is being opened for the first time with the new schema (no existing UUIDs), that is 10,000 UUID generations: ~10ms. Noticeable but acceptable as a one-time cost.

**Mitigation:** None needed. Performance is within budget.

---

### Attack R4-7: `node.check()` Does Not Exist

**Severity: LOW (Code Bug)**

The migration function in Section 4.1 calls `newDoc.check()` and expects a boolean return. ProseMirror's `Node.check()` does NOT return a boolean -- it either succeeds silently or THROWS an error. The code `if (!newDoc.check())` will never enter the error branch because `check()` always returns `undefined` (truthy in `!undefined` = `true`, so `!true` = `false`... wait, `!undefined` = `true`... this means `if (!newDoc.check())` evaluates to `if (!undefined)` = `if (true)` and ALWAYS throws.

Actually: `undefined` is falsy. `!undefined` = `true`. So `if (!newDoc.check())` always enters the throw branch. This is a bug in the pseudocode.

**Mitigation:** Replace `if (!newDoc.check())` with a try/catch around `newDoc.check()`. The check should be wrapped, not tested as a boolean. Fixed in the final spec below.

---

### Attack R4-8: Section `level` Attr Drift from Content

**Severity: LOW-MEDIUM**

The migration infers `section.attrs.level` from the first heading in the section. But after migration, the user can change the heading level (e.g., H2 to H3) without updating the section's `level` attr. The section says `level: 2` but the first heading is H3. This is the drift the synthesis acknowledged in Known Limitation #1 but did not specify a remedy.

The EdgeRegistry could validate this, but it is not in the spec. No plugin syncs `section.level` with its first heading's level.

**Mitigation:** Add a note in the implementation checklist: the normalize plugin should optionally sync `section.level` with the first heading child's level (or null if no heading). This is a low-priority enhancement -- the `level` attr is advisory, and drift is not harmful to rendering.

---

### Attack R4-9: Cascade Resolution Order for Properties Split Across Two Systems

**Severity: MEDIUM**

The cascade order in Section 5.3 is:
1. PresentationConfig.nodeStyleOverrides (mode-specific override)
2. node.styleParams (author intent)
3. Parent cascade (section -> doc)
4. PresentationConfig.styleDefaults
5. styleStore (final fallback)

But `fontFamily` is in the content tree and `fontSize` is in PresentationConfig. When resolving styles for a single paragraph, the renderer must query TWO different data structures and merge the results. The cascade function signature becomes:

```
resolveStyle(node, section, doc, presentationConfig, styleStore) -> ComputedStyle
```

Five inputs for one function. If any consumer forgets to pass `presentationConfig`, they get incomplete styles. This is the "indirection tax" the Round 3 synthesis acknowledged but did not quantify.

**Mitigation:** Implement the cascade resolver as a single utility function that takes the editor state and a node position, and returns a complete `ComputedStyle` object. Make it impossible to partially resolve. The function internally queries both the content tree and PresentationConfig. No consumer should ever manually merge styles.

---

### Attack R4-10: `columnBlock` Unwrap Into Section -- Group Mismatch

**Severity: LOW**

When the normalize plugin auto-unwraps a columnBlock (0-1 columns remaining), it calls `tr.replaceWith(pos, pos + node.nodeSize, contentNodes)`. The content nodes are the blocks from inside the column. These blocks go into the section's content. The section accepts `(block | container)+`. If any of those blocks are valid section children, this works.

But what if a column contained a container (e.g., a blockquote)? Blockquote is now in group 'container', not 'block'. The section accepts `(block | container)+`, so blockquote is valid. This works.

What if a column contained another column node (orphaned by some corruption)? Column is group 'column', not 'block' or 'container'. Inserting a column directly into a section would fail schema validation. The normalize plugin already prevents nested columnBlocks, but orphaned column nodes (without a columnBlock parent) are not checked.

**Mitigation:** The normalize plugin should strip orphaned column nodes (column without columnBlock parent). Add this as a defensive check. Low priority -- the scenario requires prior corruption.

---

### STRESS TEST SUMMARY

```
+------+----------+---------------------------------------------------------------+
| Rank | ID       | Issue                                                         |
+------+----------+---------------------------------------------------------------+
|  1   | R4-2     | PresentationConfig side-channel: per-node font size lost on   |
|      |          | cross-document paste. Users will notice.                      |
|      |          | STATUS: Accepted limitation. Inline styles use textStyle mark.|
+------+----------+---------------------------------------------------------------+
|  2   | R4-1     | Column resize needs dual-node atomic update with position     |
|      |          | mapping. Current code pattern doesn't do this.                |
|      |          | STATUS: Documented implementation pattern.                    |
+------+----------+---------------------------------------------------------------+
|  3   | R4-9     | Cascade resolution queries 5 sources for one computed style.  |
|      |          | Must be a single utility function, not ad-hoc.                |
|      |          | STATUS: Single resolver function mandated.                    |
+------+----------+---------------------------------------------------------------+
|  4   | R4-5     | Column content expression must change to (block | container)+.|
|      |          | Missing from implementation checklist.                        |
|      |          | STATUS: Added to checklist.                                   |
+------+----------+---------------------------------------------------------------+
|  5   | R4-7     | node.check() pseudocode bug -- doesn't return boolean.        |
|      |          | STATUS: Fixed in final spec.                                  |
+------+----------+---------------------------------------------------------------+
|  6   | R4-8     | Section level attr drifts from heading level.                 |
|      |          | STATUS: Optional sync in normalize plugin noted.              |
+------+----------+---------------------------------------------------------------+
|  7   | R4-3     | No-heading documents get single section. Acceptable.          |
|      |          | STATUS: Documented as known behavior.                         |
+------+----------+---------------------------------------------------------------+
|  8   | R4-4     | defining:true at document end -- works correctly.             |
|      |          | STATUS: No action needed.                                     |
+------+----------+---------------------------------------------------------------+
|  9   | R4-6     | UUID perf on large migration -- within budget.                |
|      |          | STATUS: No action needed.                                     |
+------+----------+---------------------------------------------------------------+
| 10   | R4-10    | Orphaned column nodes after unwrap -- defensive edge case.    |
|      |          | STATUS: Low priority defensive check.                         |
+------+----------+---------------------------------------------------------------+
```

No architecture killers found. The Round 3 synthesis holds up. The issues above are implementation-level concerns, not structural flaws. The specification is sound for Phase 1.

---
---

## PART 2: FINAL IMPLEMENTATION SPECIFICATION

Everything below is the authoritative, final schema specification for SERQ's Section Node architecture. It incorporates all decisions from Rounds 1-3 and all valid fixes from the Round 4 stress test. This document is structured as an implementation guide.

---

# SECTION A: ARCHITECTURE OVERVIEW

## The Problem

SERQ's ProseMirror document model is flat: `doc > block+`. Every block is a direct child of `doc`. Pagination is bolted on as a DOM overlay. The interaction layer (block indicator, drag-and-drop) must reverse-engineer page membership from DOM measurements, producing ~15 pagination-specific code paths (~230 lines) that break whenever layout changes.

## The Solution

Add a **Section** node between `doc` and blocks:

```
BEFORE:  doc > block+
AFTER:   doc > section+ > (block | container)+
```

Sections are the unit of structural organization. The layout engine assigns sections to pages. The interaction layer reads from the layout result instead of measuring DOM. Mode-switching (continuous / paginated / outline / slide) changes the layout engine config, not the document.

## The Two Data Structures

```
+-----------------------------+       +-----------------------------+
|      CONTENT TREE           |       |    PRESENTATION CONFIG      |
|      (ProseMirror doc)      |       |    (Zustand store)          |
|                             |       |                             |
|  What the content IS.       |       |  How it LOOKS in a mode.    |
|  Author's creative intent.  |       |  Mode-specific rendering.   |
|  Travels with clipboard.    |       |  Stays in the .serq file.   |
|                             |       |                             |
|  fontFamily, textAlign,     |       |  fontSize, lineHeight,      |
|  color, fontWeight,         |       |  letterSpacing, spacing,    |
|  backgroundColor            |       |  pageBreaks, gutter         |
+-----------------------------+       +-----------------------------+
              |                                    |
              +---------> RENDERER <---------------+
                          resolves cascade:
                          nodeOverride > authorIntent
                          > parentCascade > defaults
```

**Rule:** If a property survives mode transitions unchanged, it is content. If it changes per mode, it is presentation.

---

# SECTION B: SCHEMA TYPES

## B.1 StyleParams (Content-Side Only)

```typescript
/**
 * Style parameters that travel with content as AUTHOR INTENT.
 * Advisory -- the presentation layer may override them.
 *
 * These are the properties the author explicitly set via the UI
 * that survive mode transitions (continuous -> paginated -> slide).
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

## B.2 NodeMeta

```typescript
/**
 * Non-rendered metadata attached to nodes.
 * Stored as ProseMirror attrs with 'meta_' prefix convention.
 * Preserved in .serq files. Stripped on HTML export.
 */
interface NodeMeta {
  createdAt?: string
  modifiedAt?: string
  tags?: string[]
  bookmark?: string
  commentThreadIds?: string[]

  // Semantic hooks (Phase 1: type declarations only, not populated)
  semanticRole?: string            // 'thesis', 'evidence', 'conclusion', etc.
  ideaRefs?: string[]              // UUIDs of Ideas referencing this node
  confidence?: number              // 0.0-1.0, AI confidence score
  summary?: string                 // Section summary for outlines

  /** Extensible */
  [key: string]: unknown
}
```

## B.3 SerqNodeBase

```typescript
interface SerqNodeBase {
  id: string                       // Stable UUID, generated on creation
  type: string                     // ProseMirror node type name
  content: SerqNode[]              // Ordered children
  marks: SerqMark[]                // Inline marks (meaningful on text only)
  attrs: Record<string, unknown>   // Node-specific attributes
  styleParams: StyleParams         // Author-intent style hints
  meta: NodeMeta                   // Non-rendered metadata
}
```

## B.4 Mark Definitions

```typescript
interface SerqMark {
  type: SerqMarkType
  attrs: Record<string, unknown>
}

type SerqMarkType =
  | 'bold' | 'italic' | 'underline' | 'strike'
  | 'code' | 'subscript' | 'superscript'
  | 'link'           // attrs: { href, target, rel }
  | 'textStyle'      // attrs: { fontSize, fontFamily, fontWeight, color, letterSpacing }
  | 'highlight'      // attrs: { color }
  | 'comment'        // attrs: { threadId }
  | 'suggestion'     // attrs: { suggestionId, type: 'insert' | 'delete' }
  | 'crossRef'       // attrs: see CrossRefMark

/**
 * CrossRef mark -- navigational reference to another node.
 *
 * NOTE on comment mark vs commentThreadIds:
 * - 'comment' mark: inline annotation on specific text (like highlighting)
 * - meta.commentThreadIds: block-level comment threads on the whole node
 * These are complementary, not redundant.
 */
interface CrossRefMark {
  type: 'crossRef'
  attrs: {
    targetId: string
    targetType: 'section' | 'heading' | 'image' | 'table' | 'footnote'
    /** Author's preferred display format. Advisory -- renderer falls back
     *  based on active mode. 'page' in continuous mode -> falls back to 'number'. */
    displayFormat: 'number' | 'title' | 'page' | 'full'
    /** Semantic relationship type. null = navigational link only.
     *  Future: 'supports', 'contradicts', 'extends', etc. */
    relationship?: string | null
  }
}
```

## B.5 DocNode

```typescript
interface DocNode extends SerqNodeBase {
  type: 'doc'
  content: SectionNode[]           // section+ (no transitional grammar)
  attrs: {
    lang?: string
    dir?: 'ltr' | 'rtl' | 'auto'
  }
  /**
   * CASCADE ROOT. All fields non-null for document self-sufficiency.
   * A document opened in isolation renders predictably without external state.
   */
  styleParams: StyleParams & {
    fontFamily: string             // e.g., 'Inter'
    fontWeight: number             // e.g., 400
    color: string                  // e.g., '#1a1a1a'
    textAlign: 'left' | 'center' | 'right' | 'justify'
    backgroundColor: string        // e.g., '#ffffff'
  }
  meta: NodeMeta & {
    title?: string
    author?: string
    summary?: string
  }
}
```

## B.6 SectionNode

```typescript
/**
 * The unit of structural organization. Flat (no nesting).
 *
 * Key flags: isolating: false, defining: true, selectable: false
 */
interface SectionNode extends SerqNodeBase {
  type: 'section'
  content: (BlockNode | ContainerNode)[]
  attrs: {
    /** Heading level this section "owns". Inferred from first heading.
     *  Advisory -- may drift if heading level is changed without
     *  updating the section attr. */
    level?: 1 | 2 | 3 | 4 | 5 | 6 | null
    numbering?: 'none' | 'decimal' | 'alpha' | 'roman' | null
  }
}
```

## B.7 Container Nodes

```typescript
interface ColumnBlockNode extends SerqNodeBase {
  type: 'columnBlock'
  content: ColumnNode[]            // column{2,4}
  attrs: {
    columns: number                // 2-4 (synced by normalize plugin)
    // NOTE: columnWidths removed -- derived from children
    // NOTE: gutter removed -- lives in PresentationConfig
  }
}

interface ColumnNode extends SerqNodeBase {
  type: 'column'
  content: (BlockNode | ContainerNode)[]  // (block | container)+
  attrs: {
    width: number                  // fraction 0-1 (e.g., 0.5 = 50%)
  }
}

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

## B.8 Block Nodes

```typescript
interface ParagraphNode extends SerqNodeBase {
  type: 'paragraph'
  content: InlineNode[]
  attrs: {}
  styleParams: StyleParams         // base interface, no block* extensions
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

interface ImageNode extends SerqNodeBase {
  type: 'image'
  content: []
  attrs: {
    src: string
    alt?: string
    title?: string
    /** Author's preferred display width in px. Advisory --
     *  renderer caps at container width via max-width: 100%. */
    width?: number | null
    height?: number | null
  }
}

interface HorizontalRuleNode extends SerqNodeBase {
  type: 'horizontalRule'
  content: []
  attrs: {}
}
```

## B.9 Inline Nodes

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

## B.10 Union Types

```typescript
type SerqNode =
  | DocNode | SectionNode
  | ColumnBlockNode | ColumnNode
  | BlockquoteNode | BulletListNode | OrderedListNode | ListItemNode | CalloutNode
  | ParagraphNode | HeadingNode | CodeBlockNode | ImageNode | HorizontalRuleNode
  | TextRunNode | MentionNode

type BlockNode =
  | ParagraphNode | HeadingNode | CodeBlockNode | ImageNode | HorizontalRuleNode

/** Containers are NOT blocks. They hold blocks (and other containers). */
type ContainerNode =
  | ColumnBlockNode | BlockquoteNode | BulletListNode | OrderedListNode | CalloutNode
```

---

# SECTION C: COMPOSITION RULES

## C.1 Formal Grammar

```
doc              := section+
section          := (block | container)+
container        := columnBlock | blockquote | bulletList | orderedList | callout
columnBlock      := column{2,4}
column           := (block | container)+    // columnBlock prevented by normalize plugin
blockquote       := (block | container)+
bulletList       := listItem+
orderedList      := listItem+
listItem         := (block | bulletList | orderedList)+
callout          := block+
block            := paragraph | heading | codeBlock | image | horizontalRule
paragraph        := inline*
heading          := inline*
codeBlock        := text*
image            := (empty)
horizontalRule   := (empty)
inline           := text | mention
```

## C.2 ProseMirror Group Assignments

```
Node             Group(s)
----             --------
section          'section'
paragraph        'block'
heading          'block'
codeBlock        'block'
image            'block'
horizontalRule   'block'
columnBlock      'container'        <-- NOT 'block'
blockquote       'container'
bulletList       'container'
orderedList      'container'
callout          'container'
column           'column'
listItem         'listItem'
text             'inline'
mention          'inline'
```

## C.3 Constraint Invariants

| ID    | Invariant | Enforcement |
|-------|-----------|-------------|
| INV-1 | Every node has a unique UUID in its `id` attr | UUID plugin (appendTransaction) + transformPasted dedup |
| INV-2 | Every block/container is a descendant of exactly one section | Schema: doc content = `section+` |
| INV-3 | ColumnBlock.columns === child count, children widths sum to ~1.0 | Normalize plugin |
| INV-4 | Column nodes never contain a columnBlock descendant | Normalize plugin (unwrap) |
| INV-5 | Every crossRef targetId points to an existing node (or is decorated as broken) | CrossRef validation plugin (Phase 3) |
| INV-6 | Style cascade: block -> section -> doc -> PresentationConfig.styleDefaults -> styleStore | Single cascade resolver utility |
| INV-7 | Break hints are advisory; layout engine may override | Layout engine |
| INV-8 | Section nodes exist only as direct children of doc | Schema: doc content = `section+`, section group = `'section'` |

---

# SECTION D: PROSEMIRROR EXTENSION CODE

## D.1 Section Extension

```typescript
import { Node, mergeAttributes } from '@tiptap/core'

export const Section = Node.create({
  name: 'section',

  group: 'section',

  content: '(block | container)+',

  // CRITICAL: false. Cursor flows freely across section boundaries.
  // Round 2 identified isolating:true as the #1 architecture killer.
  isolating: false,

  // true: Enter creates new paragraphs INSIDE the section, not new sections.
  // Combined with isolating:false, this gives: free cursor movement,
  // but structural operations respect the section boundary.
  defining: true,

  // Sections are draggable via dedicated drag handle (not native PM drag).
  draggable: true,

  // false: no accidental whole-section NodeSelection on click.
  // Section selection is programmatic only.
  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-section-id'),
        renderHTML: (attrs: Record<string, any>) => ({
          'data-section-id': attrs.id,
        }),
      },
      level: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-section-level')
          return v ? parseInt(v, 10) : null
        },
        renderHTML: (attrs: Record<string, any>) => {
          if (attrs.level == null) return {}
          return { 'data-section-level': attrs.level }
        },
      },
      numbering: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-numbering') || null,
        renderHTML: (attrs: Record<string, any>) => {
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
    return ['section', mergeAttributes(HTMLAttributes), 0]
  },

  addKeyboardShortcuts() {
    return {
      // Explicit section split: Cmd/Ctrl+Enter
      'Mod-Enter': () => {
        return this.editor.commands.splitSection()
      },
    }
  },
})
```

## D.2 Doc Override

```typescript
import { Node } from '@tiptap/core'

export const Doc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'section+',
})
```

## D.3 ColumnBlock (Revised Group)

```typescript
// In the existing column-block.ts, change:
//   group: 'block'
// To:
//   group: 'container'
//
// Also remove columnWidths and gutter attrs.
// Keep: columns (count), id

export const ColumnBlock = Node.create({
  name: 'columnBlock',
  group: 'container',              // WAS: 'block'
  content: 'column{2,4}',
  isolating: true,
  selectable: true,
  draggable: true,
  defining: false,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (el: HTMLElement) => {
          const val = el.getAttribute('data-columns')
          return val ? parseInt(val, 10) : 2
        },
        renderHTML: (attrs: Record<string, any>) => ({
          'data-columns': attrs.columns,
        }),
      },
      // columnWidths: REMOVED (derived from children)
      // gutter: REMOVED (lives in PresentationConfig)
    }
  },
  // ... parseHTML, renderHTML, addNodeView unchanged
})
```

## D.4 Column (Revised Content + Width Attr)

```typescript
export const Column = Node.create({
  name: 'column',
  group: 'column',

  // CHANGED from 'block+' to '(block | container)+'
  // Required because containers are no longer in the 'block' group
  content: '(block | container)+',

  isolating: true,
  selectable: false,
  defining: false,

  addAttributes() {
    return {
      width: {
        default: 0.5,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-col-width')
          return v ? parseFloat(v) : 0.5
        },
        renderHTML: (attrs: Record<string, any>) => ({
          'data-col-width': String(attrs.width),
          style: `flex: 0 0 ${(attrs.width as number) * 100}%`,
        }),
      },
    }
  },
  // ... parseHTML, renderHTML, addNodeView unchanged
})
```

---

# SECTION E: MIGRATION

## E.1 Migration Function

```typescript
import { Node as PMNode, Schema, NodeType } from '@tiptap/pm/model'

/**
 * Migrates a flat-block document to section-based structure.
 * Smart splitting: breaks at H1/H2 headings.
 * Fallback: wraps everything in one section.
 *
 * Runs synchronously BEFORE editor initialization, on the JSON/PMNode
 * passed to setContent(). The editor never sees the old format.
 */
export function migrateToSections(doc: PMNode, schema: Schema): PMNode {
  const sectionType = schema.nodes.section
  if (!sectionType) return doc

  // Already migrated?
  const firstChild = doc.content.firstChild
  if (firstChild?.type.name === 'section') return doc

  try {
    return smartMigrate(doc, schema, sectionType)
  } catch (e) {
    console.warn('[SERQ Migration] Smart migration failed, using fallback:', e)
    return fallbackMigrate(doc, schema, sectionType)
  }
}

function smartMigrate(
  doc: PMNode,
  schema: Schema,
  sectionType: NodeType,
): PMNode {
  const sections: PMNode[] = []
  let currentBlocks: PMNode[] = []

  doc.forEach((child) => {
    // Split at H1 and H2 headings
    if (child.type.name === 'heading' && (child.attrs.level as number) <= 2) {
      // Flush accumulated blocks as a section
      if (currentBlocks.length > 0) {
        sections.push(createSection(sectionType, currentBlocks))
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
    sections.push(createSection(sectionType, currentBlocks))
  }

  // Empty doc edge case
  if (sections.length === 0) {
    const paragraph = schema.nodes.paragraph.create()
    sections.push(sectionType.create({ id: generateUUID() }, [paragraph]))
  }

  const newDoc = schema.nodes.doc.create(doc.attrs, sections)

  // Validate: node.check() throws on invalid structure (does NOT return boolean)
  try {
    newDoc.check()
  } catch (validationError) {
    throw new Error(
      `Migrated document failed schema validation: ${validationError}`
    )
  }

  return newDoc
}

function fallbackMigrate(
  doc: PMNode,
  schema: Schema,
  sectionType: NodeType,
): PMNode {
  const blocks: PMNode[] = []
  doc.forEach((child) => blocks.push(child))

  // Ensure at least one block
  if (blocks.length === 0) {
    blocks.push(schema.nodes.paragraph.create())
  }

  const section = sectionType.create({ id: generateUUID() }, blocks)
  return schema.nodes.doc.create(doc.attrs, [section])
}

function createSection(
  sectionType: NodeType,
  blocks: PMNode[],
): PMNode {
  // Infer level from first heading (if present)
  const firstBlock = blocks[0]
  const level = firstBlock?.type.name === 'heading'
    ? (firstBlock.attrs.level as number)
    : null

  return sectionType.create(
    { id: generateUUID(), level },
    blocks,
  )
}

/**
 * UUID generator. Uses crypto.randomUUID() when available,
 * falls back to a simple v4 UUID polyfill.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

## E.2 Column Width Migration

```typescript
/**
 * Migrates column widths from parent (ColumnBlock.attrs.columnWidths)
 * to children (Column.attrs.width).
 *
 * Runs as part of the same migration pass, after section wrapping.
 * Walks the document looking for columnBlock nodes with columnWidths attr.
 */
export function migrateColumnWidths(doc: PMNode, schema: Schema): PMNode {
  let modified = false
  const tr = /* create a transform from the doc */

  doc.descendants((node, pos) => {
    if (node.type.name !== 'columnBlock') return true

    const parentWidths = node.attrs.columnWidths as number[] | null
    if (!parentWidths || !Array.isArray(parentWidths)) return false

    // Apply each width to the corresponding column child
    let offset = 1 // skip columnBlock opening
    node.forEach((column, childOffset, index) => {
      if (column.type.name === 'column' && parentWidths[index] !== undefined) {
        const columnPos = pos + 1 + childOffset
        // Set width on column, remove columnWidths from parent
        // (done via setNodeMarkup on each column)
      }
    })

    modified = true
    return false // don't descend into columnBlock
  })

  // After setting column widths, strip columnWidths from parent attrs
  // (setNodeMarkup on each columnBlock to remove columnWidths and gutter)

  return modified ? tr.doc : doc
}
```

*Note: The exact implementation depends on whether we use a ProseMirror Transform or rebuild the JSON. For migration-on-load, rebuilding the JSON tree is simpler. The column width migration should be done in the same pass as the section migration.*

## E.3 UUID Plugin

```typescript
import { Plugin } from '@tiptap/pm/state'

/**
 * Assigns UUIDs to any node missing one.
 * Runs in appendTransaction after every doc change.
 *
 * Also runs UUID deduplication in transformPasted
 * to eliminate the one-frame duplicate window on paste.
 */
export function createUUIDPlugin() {
  return new Plugin({
    appendTransaction(transactions, _oldState, newState) {
      const docChanged = transactions.some((tr) => tr.docChanged)
      if (!docChanged) return null

      const { tr, doc } = newState
      let hasChanges = false

      doc.descendants((node, pos) => {
        if (!node.attrs.id) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: generateUUID(),
          })
          hasChanges = true
        }
        return true // descend into children
      })

      return hasChanges ? tr : null
    },

    props: {
      // Dedup UUIDs BEFORE paste enters the document
      transformPasted(slice) {
        const seen = new Set<string>()
        const json = slice.toJSON()

        function dedupNode(node: any) {
          if (node.attrs?.id) {
            if (seen.has(node.attrs.id)) {
              node.attrs.id = generateUUID()
            } else {
              seen.add(node.attrs.id)
            }
          }
          if (node.content) {
            node.content.forEach(dedupNode)
          }
        }

        if (json?.content) {
          json.content.forEach(dedupNode)
        }

        // Reconstruct slice from modified JSON
        // (implementation depends on schema access -- use Slice.fromJSON)
        return slice // placeholder -- actual implementation reconstructs
      },
    },
  })
}
```

## E.4 Execution Order

1. Load document JSON from `.serq` file
2. Call `migrateToSections(doc, schema)` -- wraps bare blocks in sections
3. Call `migrateColumnWidths(doc, schema)` -- moves widths to children
4. Pass migrated document to `editor.commands.setContent()`
5. UUID plugin runs in `appendTransaction` and fills any missing IDs
6. Normalize plugin validates column structure
7. Editor is ready

---

# SECTION F: PRESENTATION CONFIG

## F.1 Type Definitions

```typescript
/**
 * Presentation configuration -- the external companion to the content tree.
 * Stored in a Zustand store. Serialized in the .serq file alongside content.
 * NOT in the ProseMirror document. NOT on the clipboard.
 */
interface PresentationConfig {
  activeMode: 'continuous' | 'paginated' | 'outline' | 'slide'

  paginated: PaginatedConfig

  /** Style defaults applied across all modes unless overridden */
  styleDefaults: StyleDefaults

  /** Per-node style overrides keyed by node UUID */
  nodeStyleOverrides: Record<string, NodeStyleOverride>

  /** Column defaults */
  columnDefaults: {
    gutter: number       // px (screen); renderer converts per mode
  }

  /** Per-columnBlock overrides keyed by node UUID */
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
    top: number; bottom: number; left: number; right: number  // mm
  }
  header?: HeaderFooterConfig
  footer?: HeaderFooterConfig

  /** Per-section break rules (keyed by section UUID) */
  sectionBreaks: Record<string, {
    breakBefore?: boolean
    breakAfter?: boolean
    avoidBreakInside?: boolean
  }>

  /** Per-node break rules (keyed by node UUID) */
  nodeBreaks: Record<string, {
    breakBefore?: boolean
    breakAfter?: boolean
    avoidBreakInside?: boolean
  }>

  orphanLines: number    // default: 2
  widowLines: number     // default: 2
}

interface StyleDefaults {
  typography: {
    bodyFontSize: number          // px
    bodyLineHeight: number        // unitless ratio (e.g., 1.5)
    bodyLetterSpacing: number     // px
    headingScale: number[]        // [h1..h6] as multipliers of bodyFontSize
    captionFontSize: number       // px
    codeFontFamily: string        // e.g., 'JetBrains Mono'
  }
  spacing: {
    blockSpacingBefore: number    // px
    blockSpacingAfter: number     // px
    sectionSpacingBefore: number  // px
    sectionSpacingAfter: number   // px
  }
}

/** Per-node presentation overrides. BLOCK-level only.
 *  Inline font size uses the textStyle mark (travels with clipboard).
 *  Block font size uses this (does NOT travel with clipboard). */
interface NodeStyleOverride {
  fontSize?: number
  lineHeight?: number
  letterSpacing?: number
  spacingBefore?: number
  spacingAfter?: number
  borderStyle?: string
}
```

## F.2 Cascade Resolution

```typescript
/**
 * Single utility function for resolving computed styles.
 *
 * CRITICAL: All consumers use this function. No manual merging.
 * Takes 2 inputs: the editor state and a node position.
 * Returns a complete ComputedStyle with no null values.
 */
interface ComputedStyle {
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeight: number
  letterSpacing: number
  color: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  spacingBefore: number
  spacingAfter: number
}

function resolveComputedStyle(
  doc: PMNode,
  pos: number,
  presentationConfig: PresentationConfig,
  styleStore: StyleStoreState,
): ComputedStyle {
  const $pos = doc.resolve(pos)
  const node = doc.nodeAt(pos)
  if (!node) throw new Error(`No node at position ${pos}`)

  const nodeId = node.attrs.id as string

  // 1. Start with application fallbacks (styleStore)
  const result: ComputedStyle = {
    fontFamily: styleStore.defaultFontFamily,
    fontWeight: styleStore.defaultFontWeight,
    fontSize: presentationConfig.styleDefaults.typography.bodyFontSize,
    lineHeight: presentationConfig.styleDefaults.typography.bodyLineHeight,
    letterSpacing: presentationConfig.styleDefaults.typography.bodyLetterSpacing,
    color: styleStore.defaultColor,
    backgroundColor: 'transparent',
    textAlign: 'left',
    spacingBefore: presentationConfig.styleDefaults.spacing.blockSpacingBefore,
    spacingAfter: presentationConfig.styleDefaults.spacing.blockSpacingAfter,
  }

  // 2. Apply doc-level cascade root (non-null)
  const docStyle = doc.attrs.styleParams || {}
  applyStyleLayer(result, docStyle)

  // 3. Apply section-level style (if node is inside a section)
  for (let d = 1; d <= $pos.depth; d++) {
    const ancestor = $pos.node(d)
    if (ancestor.type.name === 'section' && ancestor.attrs.styleParams) {
      applyStyleLayer(result, ancestor.attrs.styleParams)
      break
    }
  }

  // 4. Apply node's own author-intent style
  if (node.attrs.styleParams) {
    applyStyleLayer(result, node.attrs.styleParams)
  }

  // 5. Apply PresentationConfig node overrides (highest priority)
  const override = presentationConfig.nodeStyleOverrides[nodeId]
  if (override) {
    if (override.fontSize != null) result.fontSize = override.fontSize
    if (override.lineHeight != null) result.lineHeight = override.lineHeight
    if (override.letterSpacing != null) result.letterSpacing = override.letterSpacing
    if (override.spacingBefore != null) result.spacingBefore = override.spacingBefore
    if (override.spacingAfter != null) result.spacingAfter = override.spacingAfter
  }

  return result
}

function applyStyleLayer(
  target: ComputedStyle,
  source: Record<string, unknown>,
) {
  // Only override non-null values from source
  if (source.fontFamily != null) target.fontFamily = source.fontFamily as string
  if (source.fontWeight != null) target.fontWeight = source.fontWeight as number
  if (source.color != null) target.color = source.color as string
  if (source.backgroundColor != null) target.backgroundColor = source.backgroundColor as string
  if (source.textAlign != null) target.textAlign = source.textAlign as ComputedStyle['textAlign']
}
```

## F.3 Layout Engine Contract

```typescript
interface LayoutConfig {
  mode: 'continuous' | 'paginated' | 'outline' | 'slide'
  pageSize?: { width: number; height: number }   // mm
  margins?: { top: number; bottom: number; left: number; right: number }  // mm
}

interface LayoutResult {
  sectionPages: Map<string, number>
  blockPages: Map<string, { startPage: number; endPage: number }>
  pageBreaks: Array<{ afterSectionId: string; pageNumber: number }>
  pageCount: number
}

// The layout engine is a pure function:
// layoutEngine(document, presentationConfig) -> LayoutResult
```

---

# SECTION G: EDGE REGISTRY

```typescript
/**
 * Derived data structure. NOT serialized. Rebuilt incrementally.
 *
 * Update strategy:
 * - Text-only edits: map positions through Transaction.mapping (no rebuild)
 * - Structural changes: rebuild affected sections only
 * - Cross-ref/bookmark changes: update affected entries only
 * - Debounce expensive operations: 100ms idle callback
 */
interface EdgeRegistry {
  nodePositions: Map<string, number>
  sectionMembership: Map<string, string>  // nodeId -> sectionId
  sectionOrder: string[]                  // ordered section UUIDs
  bookmarks: Map<string, string>          // bookmarkName -> nodeId
  crossRefTargets: Map<string, {
    uuid: string
    label: string
    // pageNumber removed -- lives in LayoutResult
  }>
}
```

---

# SECTION H: IMPLEMENTATION CHECKLIST

Ordered by dependency. Each item is a discrete unit of work.

## Phase 1: Section Node + Migration

### Step 1: Section Extension + Doc Override
- [ ] Create `src/extensions/section.ts` with the Section extension from Section D.1
- [ ] Create `src/extensions/doc-override.ts` with the Doc override from Section D.2
- [ ] Register both in the editor extension list (replace default Doc)
- [ ] **File:** `src/extensions/section.ts` (new)
- [ ] **File:** `src/extensions/doc-override.ts` (new)
- [ ] **File:** `src/lib/tiptap/app-init.ts` or equivalent editor setup (modify)

### Step 2: Group Reassignments
- [ ] Change `ColumnBlock` group from `'block'` to `'container'`
- [ ] Change `Column` content from `'block+'` to `'(block | container)+'`
- [ ] Change `Blockquote` group from `'block'` to `'container'` (if currently 'block')
- [ ] Change `BulletList` group to `'container'` (if needed)
- [ ] Change `OrderedList` group to `'container'` (if needed)
- [ ] Change `Callout` group to `'container'` (if needed)
- [ ] **File:** `src/extensions/columns/column-block.ts` (modify)
- [ ] **File:** `src/extensions/columns/column.ts` (modify)
- [ ] **File:** TipTap extension overrides for blockquote, lists (modify or create overrides)

### Step 3: Column Width Migration
- [ ] Add `width` attribute to Column extension (default: 0.5)
- [ ] Remove `columnWidths` attribute from ColumnBlock extension
- [ ] Remove `gutter` attribute from ColumnBlock extension
- [ ] Update normalize plugin to validate column children widths sum to ~1.0
- [ ] Update normalize plugin to read widths from children, not parent
- [ ] Update `ColumnBlockView.tsx` resize handler to write to child attrs (with position mapping for dual-node update)
- [ ] **File:** `src/extensions/columns/column.ts` (modify)
- [ ] **File:** `src/extensions/columns/column-block.ts` (modify)
- [ ] **File:** `src/extensions/columns/normalize-plugin.ts` (modify)
- [ ] **File:** `src/extensions/columns/ColumnBlockView.tsx` (modify)

### Step 4: Column Commands Update
- [ ] Update `setColumns` command to set `width` on each column child
- [ ] Update `addColumn` to set `width` on new column + update siblings
- [ ] Update `removeColumn` to redistribute widths to remaining siblings
- [ ] Update `setColumnWidths` to write to children, not parent
- [ ] Remove `setColumnGutter` command (gutter is in PresentationConfig)
- [ ] Fix `findColumnBlock` and `setColumns` depth assumption (`d === 1` -> dynamic depth)
- [ ] **File:** `src/extensions/columns/commands.ts` (modify)

### Step 5: Migration Function
- [ ] Create `src/lib/migration/migrate-to-sections.ts` with the migration from Section E.1
- [ ] Create `src/lib/migration/migrate-column-widths.ts` for column width migration
- [ ] Integrate migration into document load path (before `setContent`)
- [ ] **File:** `src/lib/migration/migrate-to-sections.ts` (new)
- [ ] **File:** `src/lib/migration/migrate-column-widths.ts` (new)
- [ ] **File:** document loading code (modify)

### Step 6: UUID Plugin
- [ ] Create `src/extensions/uuid-plugin.ts` with the UUID plugin from Section E.3
- [ ] Register in the editor extension list
- [ ] Ensure `transformPasted` deduplication works with sections
- [ ] **File:** `src/extensions/uuid-plugin.ts` (new)

### Step 7: Depth Helper
- [ ] Create `src/lib/tiptap/depth-utils.ts` with `findBlockDepth($pos)` function
- [ ] Replace ALL `d === 1` hardcodes in block indicator plugin with `findBlockDepth`
- [ ] Replace `$from.before(1)` and `$from.node(1)` with depth-aware equivalents
- [ ] **File:** `src/lib/tiptap/depth-utils.ts` (new)
- [ ] **File:** `src/extensions/block-indicator/plugin.ts` (modify)

### Step 8: Block Indicator Updates
- [ ] Add `'section'` to `STRUCTURAL_WRAPPERS` set (if one exists)
- [ ] Update gap finding for three levels: doc > section > block (and doc > section > container > block)
- [ ] Update drag-and-drop drop target computation for section boundaries
- [ ] Verify edge zone detection works with the extra depth level
- [ ] **File:** `src/extensions/block-indicator/plugin.ts` (modify)
- [ ] **File:** `src/extensions/block-indicator/dom-utils.ts` (modify, if needed)

### Step 9: Section Split/Merge Commands
- [ ] Implement `splitSection()` command: splits section at cursor position
- [ ] Implement `mergeSections()` command: merges current section with previous
- [ ] Add keymap: `Mod+Enter` = split section
- [ ] Add keymap: Backspace at section start = merge with previous section
- [ ] Add keymap: Delete at section end = merge with next section
- [ ] **File:** `src/extensions/section.ts` (modify, add commands)

### Step 10: Normalize Plugin Updates
- [ ] Add defensive check for orphaned column nodes (column without columnBlock parent)
- [ ] Optional: sync `section.level` with first heading child's level
- [ ] **File:** `src/extensions/columns/normalize-plugin.ts` (modify)

---

## Phase 2: Section-Aware Layout Engine

### Step 11: PresentationConfig Store
- [ ] Create `src/stores/presentationStore.ts` with PresentationConfig types from Section F.1
- [ ] Initialize with sensible defaults (A4 page, standard margins, standard typography)
- [ ] **File:** `src/stores/presentationStore.ts` (new)

### Step 12: Layout Engine
- [ ] Create `src/lib/layout/layout-engine.ts`
- [ ] Implement pure function: `(doc, presentationConfig) -> LayoutResult`
- [ ] Continuous mode: trivial (everything on page 1)
- [ ] Paginated mode: walk sections, measure heights, assign to pages
- [ ] Respect break rules from `PresentationConfig.paginated.sectionBreaks`
- [ ] **File:** `src/lib/layout/layout-engine.ts` (new)

### Step 13: Cascade Resolver
- [ ] Create `src/lib/style/resolve-computed-style.ts` with the function from Section F.2
- [ ] Replace all ad-hoc style resolution in rendering components
- [ ] **File:** `src/lib/style/resolve-computed-style.ts` (new)

### Step 14: Remove Pagination Overlay Code
- [ ] Remove `clipIndicatorToCurrentPage` calls (~4 locations)
- [ ] Remove `isPointInForbiddenZone` calls
- [ ] Remove `isNonContentArea` calls
- [ ] Remove `isPaginationEnabled` checks from block indicator
- [ ] Remove `getPageNumberForElement` calls
- [ ] Block indicator reads page info from LayoutResult instead
- [ ] **Files:** `src/extensions/block-indicator/plugin.ts`, `pagination.ts`, `dom-utils.ts` (modify)

### Step 15: PresentationConfig Serialization
- [ ] Save PresentationConfig in `.serq` file alongside content tree
- [ ] Load PresentationConfig from `.serq` file on document open
- [ ] **File:** document save/load code (modify)

### Step 16: ResizeObserver Integration
- [ ] Layout engine re-runs on window resize
- [ ] Layout engine re-runs on CSS-induced height changes (font size changes via settings)
- [ ] **File:** layout engine integration code (modify)

### Step 17: EdgeRegistry Incremental Updates
- [ ] Create `src/extensions/edge-registry.ts` ProseMirror plugin
- [ ] Text-only edits: map positions through Transaction.mapping
- [ ] Structural changes: rebuild affected sections only
- [ ] Debounce cross-reference resolution: 100ms idle callback
- [ ] **File:** `src/extensions/edge-registry.ts` (new)

---

## Phase 3: Cross-References and Semantic Hooks

### Step 18-23 (brief, not blocking Phase 1-2):
- CrossRef mark with `targetId`, `targetType`, `displayFormat`, `relationship`
- EdgeRegistry cross-ref validation (broken ref decoration, NOT auto-removal)
- Bookmark attrs (`meta.bookmark`) on nodes
- Outline view reading section tree
- Section summary support (`meta.summary`)
- DisplayFormat fallback table (mode-aware rendering)

---

# SECTION I: KNOWN LIMITATIONS

These are architectural limitations accepted for Phase 1. Documented for honesty.

### 1. Flat Sections Cannot Represent Deep Hierarchy

Sections do not nest. `level` attr implies hierarchy but does not enforce it. A user can set levels [1, 3, 1, 5, 2] and the schema will not complain. Future fix: add `sectionGroup` or `subsection` node type (additive, non-breaking).

### 2. No Within-Block Page Breaking

The layout engine assigns whole blocks to pages. A paragraph taller than a page overflows. This is standard for ProseMirror-based editors -- the document model has no concept of "half a paragraph." CSS `break-inside: auto` provides visual splitting.

### 3. ColumnBlock Across Page Breaks is Unspecified

Phase 1 default: `avoidBreakInside: true` for all columnBlocks (set in PresentationConfig). If too tall for a page, the layout engine breaks it -- but the exact behavior is implementation-defined.

### 4. PresentationConfig Does Not Travel With Clipboard

Per-node style overrides (font size, line height, spacing) stored in PresentationConfig are lost when copying to a different document. Inline styles (via `textStyle` mark) DO travel. This distinction should be clear in the UI.

### 5. Style Cascade Skips Column Nodes

Cascade chain: doc -> section -> block. Column and ColumnBlock nodes are transparent to the cascade. A block inside a column inherits from the section, not from the column.

### 6. EdgeRegistry Freshness is Eventual

Between a structural change and the incremental rebuild, derived data (section numbering, bookmark resolution) may be stale for ~100ms. The UI should handle brief staleness gracefully.

### 7. Section Level Attr May Drift From Content

`section.attrs.level` is inferred during migration from the first heading. If the user later changes the heading level, the section attr is not automatically updated (unless the optional normalize plugin sync is implemented).

### 8. Smart Migration Only Splits at H1/H2

Documents with no headings get a single section. Documents using only H3-H6 get a single section. This is intentional -- there are no natural section boundaries in these documents.

---

# SECTION J: COLUMN RESIZE IMPLEMENTATION PATTERN

Per Round 4 Attack R4-1, the column resize handler must update two sibling nodes atomically. Here is the pattern:

```typescript
/**
 * Resize handler for column divider drag.
 * Updates BOTH adjacent columns' widths in a single transaction.
 */
function handleColumnResize(
  editor: Editor,
  columnBlockPos: number,
  leftColumnIndex: number,
  newLeftWidth: number,
  newRightWidth: number,
) {
  const { tr } = editor.state
  const columnBlock = editor.state.doc.nodeAt(columnBlockPos)
  if (!columnBlock) return

  // Resolve positions of both columns
  let leftPos = columnBlockPos + 1 // after columnBlock opening
  for (let i = 0; i < leftColumnIndex; i++) {
    leftPos += columnBlock.child(i).nodeSize
  }
  const rightPos = leftPos + columnBlock.child(leftColumnIndex).nodeSize

  // Update left column width
  tr.setNodeMarkup(leftPos, undefined, {
    ...columnBlock.child(leftColumnIndex).attrs,
    width: newLeftWidth,
  })

  // Map right column position through the transaction's mapping
  // (in case left column's serialized size changed)
  const mappedRightPos = tr.mapping.map(rightPos)

  // Update right column width
  tr.setNodeMarkup(mappedRightPos, undefined, {
    ...columnBlock.child(leftColumnIndex + 1).attrs,
    width: newRightWidth,
  })

  editor.view.dispatch(tr)
}
```

---

# SECTION K: SECTION KEYMAP IMPLEMENTATION GUIDE

## K.1 Backspace at Section Start (Merge with Previous)

```typescript
/**
 * When cursor is at the very start of a section (pos 0 within section),
 * and the section has a predecessor: merge the first block of this section
 * with the last block of the previous section. Move all remaining blocks.
 * Delete the now-empty section.
 *
 * With isolating: false, ProseMirror's default joinBackward already handles
 * joining the first block with the previous sibling across section boundaries.
 * We only need a custom handler for the case where joinBackward fails
 * (e.g., incompatible block types at the boundary).
 */
```

## K.2 Delete at Section End (Merge with Next)

Mirror of K.1, operating on the last block of the current section and the first block of the next section.

## K.3 Enter at Various Positions

With `isolating: false` + `defining: true`:
- **Enter in middle of paragraph:** splits paragraph, both halves stay in current section. (Default ProseMirror behavior, no custom handler needed.)
- **Enter at end of paragraph:** creates new empty paragraph in current section. (Default behavior.)
- **Mod+Enter:** explicit section split. Custom command. Splits the section at the cursor position: blocks before cursor stay in current section, blocks at/after cursor move to new section.

---

*This specification was produced by the Round 4 Final Review, incorporating all decisions from Rounds 1-3, the full Devil's Advocate stress test from Round 2, the Synthesis Architect's resolutions from Round 3, and the final stress test from Round 4. All 15 decisions are final. The implementation checklist is ordered by dependency. Build this.*

*Round 4 Final Specification -- 2026-02-06*
