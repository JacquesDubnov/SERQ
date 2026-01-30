# Feature Landscape: SERQ Document Editor

**Domain:** Document Editor (TipTap/ProseMirror)
**Researched:** 2026-01-30
**Overall Confidence:** HIGH (Context7 unavailable, but official TipTap docs extensively verified)

## Executive Summary

TipTap covers approximately 60-70% of SERQ's feature requirements out of the box. The remaining 30-40% breaks down into:
- **Third-party extensions exist:** ~10% (columns, search/replace)
- **Custom development required:** ~20% (callouts, universal iframes, tagging system, AI stylization, handwriting annotations)
- **TipTap Pro/paid required:** ~10% (comments, import/export)

The good news: TipTap's extension architecture makes custom development manageable. The bad news: some "simple-sounding" features (columns, callouts) require custom node development.

---

## Feature Coverage Matrix

### Legend
| Symbol | Meaning |
|--------|---------|
| **NATIVE** | TipTap open-source extension, just configure |
| **PRO** | TipTap paid extension required |
| **3RD-PARTY** | Community extension available |
| **CUSTOM** | Must build custom extension |
| **HYBRID** | Partial coverage, needs customization |

---

## 1. Text Blocks

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Paragraph | **NATIVE** | `@tiptap/extension-paragraph` (StarterKit) | None |
| H1-H6 Headings | **NATIVE** | `@tiptap/extension-heading` (StarterKit) | None |
| Blockquote | **NATIVE** | `@tiptap/extension-blockquote` (StarterKit) | None |
| Callout/Admonition | **CUSTOM** | Custom node with type attribute (info, warning, etc.) | Medium |
| Caption | **CUSTOM** | Custom node, or styled paragraph variant | Low |
| Code Block | **NATIVE** | `@tiptap/extension-code-block` or `code-block-lowlight` | None |
| Bullet List | **NATIVE** | `@tiptap/extension-bullet-list` (StarterKit) | None |
| Numbered List | **NATIVE** | `@tiptap/extension-ordered-list` (StarterKit) | None |
| Checklist/Tasks | **NATIVE** | `@tiptap/extension-task-list` + `task-item` | None |
| Toggle/Details | **NATIVE** | `@tiptap/extension-details` | None |

### Notes on Text Blocks

**Callout blocks require custom development.** TipTap provides a guide for creating "Admonition" blocks with markdown support, but no official extension exists. The pattern:
```typescript
Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  addAttributes() {
    return { type: { default: 'info' } } // info, warning, error, success
  }
})
```

**Caption** can be implemented as either a styled paragraph variant or a custom node depending on whether you need special behavior.

---

## 2. Layout Blocks

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Columns (2-5) | **3RD-PARTY** | `@tiptap-extend/columns` or custom | Medium |
| Divider/HR | **NATIVE** | `@tiptap/extension-horizontal-rule` | None |
| Spacer | **CUSTOM** | Custom node with height attribute | Low |

### Notes on Layout Blocks

**Columns are NOT official.** Options:
1. `@tiptap-extend/columns` - npm package, 27 dependents, last updated 2 years ago
2. `@gocapsule/column-extension` (topo-io) - CSS grid based
3. Community "Resizable Multi Columns" ProseMirror plugin
4. Build custom using CSS grid/flexbox

**Recommendation:** Start with `@tiptap-extend/columns`, evaluate if customization needed. The extension uses CSS grid with `grid-auto-columns: 1fr` for equal widths.

**Spacer** doesn't exist - simple custom node:
```typescript
Node.create({
  name: 'spacer',
  group: 'block',
  atom: true,
  addAttributes() {
    return { height: { default: '24px' } }
  }
})
```

---

## 3. Media Blocks

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Images | **NATIVE** | `@tiptap/extension-image` | None |
| YouTube embeds | **NATIVE** | `@tiptap/extension-youtube` | None |
| Vimeo embeds | **CUSTOM** | Custom node (similar to YouTube pattern) | Low |
| Loom embeds | **CUSTOM** | Custom node (similar to YouTube pattern) | Low |
| Universal iframe | **HYBRID** | Experimental extension exists, needs customization | Medium |
| Figma embeds | **CUSTOM** | Custom node wrapping iframe | Low |
| Miro embeds | **CUSTOM** | Custom node wrapping iframe | Low |
| CodeSandbox | **CUSTOM** | Custom node wrapping iframe | Low |

### Notes on Media Blocks

**Universal iframe is experimental.** TipTap has an [iframe extension example](https://tiptap.dev/docs/examples/experiments/iframe) in their experiments section, but it's not officially published. You need to copy the source and create your own extension.

**Pattern for embed nodes:**
```typescript
Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: '400px' },
      provider: { default: 'generic' } // youtube, vimeo, figma, etc.
    }
  },
  parseHTML() {
    return [{ tag: 'iframe[src]' }]
  }
})
```

**Third-party option:** `@docs.plus/extension-hypermultimedia` - handles various embed types.

---

## 4. Tables

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Basic tables | **NATIVE** | `@tiptap/extension-table` + TableKit | None |
| Cell selection | **NATIVE** | Built into table extension | None |
| Merge/split cells | **NATIVE** | `mergeCells`, `splitCell` commands | None |
| Header rows/cols | **NATIVE** | `toggleHeaderRow`, `toggleHeaderColumn` | None |
| Border control | **HYBRID** | CSS variables + custom attributes | Medium |
| Cell backgrounds | **NATIVE** | `setCellAttribute('backgroundColor', '#000')` | None |
| Cell alignment | **NATIVE** | Via CSS classes or attributes | Low |
| Zebra striping | **CUSTOM** | CSS + row indexing | Low |

### Notes on Tables

**TipTap's table support is solid.** The TableKit bundles everything: Table, TableRow, TableCell, TableHeader. Key CSS variables for theming:
- `--tt-table-border-color`
- `--tt-table-cell-padding`
- `--tt-table-selected-bg`
- `--tt-table-column-resize-handle-bg`

**Border control (full grid to borderless)** requires custom implementation:
1. Add border style attribute to table node
2. Apply CSS classes based on attribute
3. Build UI for selecting border style

**Cell rotation** (text direction) is not built-in - would need custom CSS transform handling.

---

## 5. Collaboration Features

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Self-comments | **PRO** | `@tiptap/extension-comments` (CommentsKit) | Paid |
| Comment threads | **PRO** | Part of Comments extension | Paid |
| Handwritten annotations | **CUSTOM** | Canvas overlay + custom node | High |

### Notes on Collaboration

**Comments require TipTap Pro subscription.** The Comments extension:
- Requires `TiptapCollabProvider` (cloud or on-prem)
- Published in TipTap's private npm registry
- Threads are a cloud/on-premises feature

**SERQ specifies "self-comments" (Cmd+Shift+M)** - single-user annotations. Options:
1. Pay for TipTap Comments (overkill for single-user)
2. Build lightweight custom comment system (marks with metadata)
3. Use third-party annotation extension (`tiptap-annotation-magic`)

**Handwritten annotation layer is not covered by TipTap.** This requires:
- Canvas/SVG overlay layer
- Drawing library (Fabric.js, Konva, or custom)
- Custom node to store annotation data
- Significant custom development

**Recommendation for comments:** Build lightweight custom system for MVP. Upgrade to TipTap Comments if multi-user collaboration added later.

---

## 6. Navigation

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Table of Contents | **NATIVE** | `@tiptap/extension-table-of-contents` | None |
| Outline panel | **HYBRID** | TOC extension + custom UI | Medium |
| Find & Replace | **3RD-PARTY** | `@sereneinserenade/tiptap-search-and-replace` | None |
| Go-to navigation | **CUSTOM** | Build on top of TOC data | Low |

### Notes on Navigation

**Table of Contents extension is excellent.** Features:
- Auto-updates as headings change
- Provides depth, content, unique ID for each heading
- Active state and scroll state tracking
- Framework-agnostic rendering

**Outline panel with drag-to-reorder** requires:
1. TOC extension for heading data
2. Custom UI with drag-drop (react-beautiful-dnd or dnd-kit)
3. Commands to reorder heading nodes in document

**Find & Replace:** The community extension `@sereneinserenade/tiptap-search-and-replace` is mature:
- 491+ npm dependents
- Regex support (configurable)
- Case sensitivity toggle
- CSS class for highlighting results

---

## 7. AI Integration

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| AI text stylization | **CUSTOM** | Claude API + custom commands | High |
| Context-aware formatting | **CUSTOM** | Document analysis + AI | High |
| Preview/accept/reject | **CUSTOM** | Diff view + commands | Medium |
| Autocomplete suggestions | **PRO** | TipTap AI extension (Start plan) | Paid |

### Notes on AI Integration

**TipTap has AI extensions, but they're paid and cloud-based.** SERQ uses user's own Claude API key, so we need custom implementation.

**AI text stylization workflow:**
1. User selects text or document section
2. Send to Claude API with style instruction
3. Receive styled response
4. Show diff/preview (custom UI)
5. Accept/reject applies or discards changes

**This is the "killer feature" per PROJECT.md** - requires significant custom development regardless of TipTap's AI offerings.

**Key implementation considerations:**
- Streaming response handling
- Diff visualization (inline vs side-by-side)
- Undo integration (treat AI change as single transaction)
- Rate limiting / API key management

---

## 8. Special Features

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Tagging system | **CUSTOM** | Custom mark/node + suggestion UI | High |
| Formatting rules | **CUSTOM** | InputRules + custom logic | Medium |
| Focus/distraction-free mode | **HYBRID** | Focus extension + custom UI | Medium |
| Typewriter mode | **CUSTOM** | ScrollIntoView + custom logic | Medium |
| Markdown source view | **NATIVE** | `@tiptap/extension-markdown` | Low |
| Split view (side-by-side) | **CUSTOM** | Dual editor instances | Medium |
| Command palette | **HYBRID** | Suggestion extension pattern | Medium |
| Slash commands | **HYBRID** | Experimental, copy from TipTap examples | Medium |

### Notes on Special Features

**Tagging system (words, blocks, sections)** is complex:
- Similar to Mention extension but for tags (#tag)
- Need tag storage, search, filter, navigation
- Cross-document tag management
- Consider using Mention extension as foundation

**Markdown bidirectional sync is now official.** TipTap released `@tiptap/extension-markdown`:
- CommonMark compliant
- `editor.getMarkdown()` to export
- `contentType: 'markdown'` for import
- Round-tripping supported
- Some limitations (comments, complex tables)

**Focus mode** combines:
- TipTap's Focus extension (tracks cursor position)
- Custom CSS to dim non-focused content
- UI panel hiding

**Typewriter mode** (keep cursor centered):
- Not built-in
- Use `scrollIntoView` command + `onUpdate` event
- Calculate viewport center, scroll accordingly

**Slash commands exist as experiment** - copy from TipTap docs, customize:
- Uses `@tiptap/suggestion` package
- Trigger on `/` character
- Build menu items and handlers

---

## 9. Text Formatting

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Bold | **NATIVE** | StarterKit | None |
| Italic | **NATIVE** | StarterKit | None |
| Underline | **NATIVE** | `@tiptap/extension-underline` | None |
| Strikethrough | **NATIVE** | StarterKit | None |
| Inline code | **NATIVE** | StarterKit | None |
| Highlight | **NATIVE** | `@tiptap/extension-highlight` | None |
| Text color | **NATIVE** | `@tiptap/extension-color` | None |
| Background color | **NATIVE** | `@tiptap/extension-background-color` | None |
| Font family | **NATIVE** | `@tiptap/extension-font-family` | None |
| Font size | **NATIVE** | `@tiptap/extension-font-size` | None |
| Line height | **NATIVE** | `@tiptap/extension-line-height` | None |
| Text alignment | **NATIVE** | `@tiptap/extension-text-align` | None |
| Links | **NATIVE** | `@tiptap/extension-link` | None |
| Subscript | **NATIVE** | `@tiptap/extension-subscript` | None |
| Superscript | **NATIVE** | `@tiptap/extension-superscript` | None |

### Notes on Text Formatting

**This is TipTap's sweet spot.** All standard formatting is covered. Just install and configure.

**Typography extension** auto-fixes common issues:
- Smart quotes
- Em dashes
- Ellipsis
- Etc.

---

## 10. File Operations

| SERQ Feature | TipTap Coverage | Extension/Approach | Complexity |
|--------------|-----------------|-------------------|------------|
| Import Word | **PRO** | TipTap Import extension (Start plan) | Paid |
| Import Markdown | **NATIVE** | `@tiptap/extension-markdown` | None |
| Import HTML | **NATIVE** | Built-in parsing | None |
| Export Word | **PRO** | TipTap Export extension (Start plan) | Paid |
| Export Markdown | **NATIVE** | `@tiptap/extension-markdown` | None |
| Export HTML | **NATIVE** | `editor.getHTML()` | None |
| Export PDF | **CUSTOM** | Browser print or PDF library | Medium |
| Export EPUB | **CUSTOM** | EPUB generation library | High |

### Notes on File Operations

**Word import/export requires TipTap Pro** (Start plan). Alternatives:
- Mammoth.js for DOCX import (client-side)
- docx npm package for DOCX export
- LibreOffice headless (server-side, but SERQ is local-first)

**PDF export** options:
- Browser's `window.print()` to PDF
- Puppeteer (requires Node backend)
- React-to-print + styled components

**EPUB** is non-trivial - consider deferring to P1.

---

## Custom Development Summary

### High Complexity (1-2 weeks each)

| Feature | Reason | Approach |
|---------|--------|----------|
| AI text stylization | Core killer feature, complex workflow | Claude API + diff UI + transaction handling |
| Tagging system | Full-featured: tag storage, search, filter | Custom mark + suggestion + management UI |
| Handwritten annotations | Canvas overlay, drawing tools | Fabric.js/Konva + custom node |

### Medium Complexity (2-4 days each)

| Feature | Reason | Approach |
|---------|--------|----------|
| Callout blocks | Custom node + styling | Follow TipTap admonition guide |
| Universal iframe embed | Security, validation | Extend experimental iframe |
| Table border control | Custom attributes + CSS | Add border style to table node |
| Comments (lightweight) | Single-user annotations | Custom mark with metadata |
| Outline drag-reorder | TOC + drag-drop | TOC extension + dnd library |
| Formatting rules engine | Pattern matching + auto-apply | InputRules + custom logic |
| Focus/typewriter mode | Cursor tracking + scroll | Focus ext + custom scroll logic |
| Slash commands | Menu + handlers | Copy TipTap experiment |
| Split markdown view | Dual editors | Two editor instances, sync |

### Low Complexity (< 1 day each)

| Feature | Reason | Approach |
|---------|--------|----------|
| Spacer block | Simple node | Custom atom node with height |
| Caption block | Styled paragraph variant | Custom node or class |
| Vimeo/Loom embeds | Pattern exists | Copy YouTube extension pattern |
| Go-to navigation | Build on TOC | Commands + UI |

---

## TipTap Pro Considerations

### What Requires Paid Plans

| Feature | Plan Required | Alternative |
|---------|--------------|-------------|
| Comments | Start ($0 with limits) | Build lightweight custom |
| AI autocomplete | Start | Use own Claude API |
| Word import/export | Start | Mammoth.js / docx package |
| Pages layout | Team | Not needed for SERQ |
| Snapshots | Team | Git-based versioning |

### Recommendation

**Don't pay for TipTap Pro for MVP.** Reasons:
1. SERQ is single-user, Pro collaboration features are overkill
2. AI features use user's Claude API key anyway
3. Word import/export can use open-source alternatives
4. Cloud documents not needed for local-first app

**Revisit Pro if:**
- Adding multi-user collaboration later
- Want official support/maintenance
- Need enterprise compliance (SOC 2)

---

## Third-Party Extensions Worth Using

| Extension | npm Package | Purpose | Confidence |
|-----------|-------------|---------|------------|
| Columns | `@tiptap-extend/columns` | Multi-column layout | MEDIUM |
| Search & Replace | `@sereneinserenade/tiptap-search-and-replace` | Find/replace with regex | HIGH |
| HyperMultimedia | `@docs.plus/extension-hypermultimedia` | Various embed types | MEDIUM |

---

## StarterKit Extensions (Pre-bundled)

For reference, `@tiptap/starter-kit` includes:
- Blockquote
- BulletList
- CodeBlock
- Document
- Dropcursor
- Gapcursor
- HardBreak
- Heading
- History (undo/redo)
- HorizontalRule
- Italic
- ListItem
- OrderedList
- Paragraph
- Strike
- Text
- Bold
- Code

**Don't re-install these separately** unless you need to configure them differently from defaults.

---

## Complexity Estimates for Custom Features

| Custom Feature | Dev Days | Dependencies |
|----------------|----------|--------------|
| Callout node | 1 | None |
| Spacer node | 0.5 | None |
| Universal iframe | 2 | URL validation |
| Vimeo/Loom embeds | 1 | None |
| Lightweight comments | 3 | None |
| Tagging system | 5 | Suggestion, storage |
| AI stylization | 7 | Claude API, diff library |
| Formatting rules | 3 | InputRules |
| Focus mode | 2 | Focus extension |
| Typewriter mode | 2 | ScrollIntoView |
| Slash commands | 2 | Suggestion |
| Split markdown view | 3 | Markdown extension |
| Outline drag-reorder | 3 | TOC, dnd library |
| Table border control | 2 | Table extension |
| Handwritten annotations | 10 | Canvas library |

**Total custom development estimate:** ~45 dev days for full feature set

---

## Sources

### Official TipTap Documentation (HIGH confidence)
- [Extensions Overview](https://tiptap.dev/docs/editor/extensions/overview)
- [Table Extension](https://tiptap.dev/docs/editor/extensions/nodes/table)
- [Table of Contents](https://tiptap.dev/docs/editor/extensions/functionality/table-of-contents)
- [Admonition Guide](https://tiptap.dev/docs/editor/markdown/guides/create-a-admonition-block)
- [Iframe Experiment](https://tiptap.dev/docs/examples/experiments/iframe)
- [Slash Commands Experiment](https://tiptap.dev/docs/examples/experiments/slash-commands)
- [Bidirectional Markdown](https://tiptap.dev/blog/release-notes/introducing-bidirectional-markdown-support-in-tiptap)
- [Comments Extension](https://tiptap.dev/docs/editor/extensions/functionality/comments)
- [Pricing](https://tiptap.dev/pricing)

### Third-Party Extensions (MEDIUM confidence)
- [tiptap-search-and-replace](https://github.com/sereneinserenade/tiptap-search-and-replace)
- [@tiptap-extend/columns](https://www.npmjs.com/package/@tiptap-extend/columns)
- [tiptap-annotation-magic](https://github.com/luccalb/tiptap-annotation-magic)

### Community Discussions (LOW confidence - patterns only)
- [Multi-column layout discussion](https://github.com/ueberdosis/tiptap/discussions/6317)
- [Typewriter scrolling discussion](https://github.com/ueberdosis/tiptap/discussions/2264)

---

*Last updated: 2026-01-30*
