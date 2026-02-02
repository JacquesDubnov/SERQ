# Phase 8: Document Output & Pagination - Research

**Researched:** 2026-02-02
**Domain:** Document export formats, print pagination, PDF optimization, Markdown editing
**Confidence:** MEDIUM (docx.js verified via Context7, PDF optimization patterns from multiple sources, TipTap markdown from official docs, pagination CSS patterns from MDN)

## Summary

Phase 8 addresses four distinct but related capabilities: (1) paginated document preview for print-ready output, (2) Word .docx export, (3) PDF file size optimization (current 80MB exports are unacceptable), and (4) Markdown source view mode.

The current PDF export uses html2canvas + jsPDF which creates massive files because it captures the entire document as PNG images at 2x scale. The fix is straightforward: use JPEG instead of PNG with compression. For Word export, the `docx` npm package is the standard programmatic approach - SERQ already has mammoth.js for import, and docx.js uses the same JSON-to-document philosophy.

Pagination requires CSS paged media with the `@page` rule and `break-inside`/`break-before` properties. The question is whether to use CSS-only print preview or a JavaScript polyfill like paged.js for in-editor pagination display. CSS-only is simpler but only works when printing; paged.js shows page boundaries during editing.

Markdown source mode is the most complex feature. TipTap has an official markdown extension (added in v3.7.0) with `getMarkdown()` and `setMarkdown()` methods, but the source view itself needs a code editor component like CodeMirror for syntax highlighting.

**Primary recommendation:** Start with PDF optimization (easiest, highest impact), then Word export (standalone feature), then Markdown mode (medium complexity), then pagination (most UI complexity).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| docx | 9.5.x | Word .docx generation | 365+ projects use it, declarative API, browser + Node support, excellent docs |
| @tiptap/extension-markdown | 3.18.x | Markdown parsing/serialization | Official TipTap extension, already released in current TipTap version |
| @uiw/react-codemirror | 4.x | Markdown source editor | Most popular React CodeMirror wrapper, TypeScript support |
| @codemirror/lang-markdown | 6.x | Markdown syntax highlighting | Official CodeMirror language package |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pagedjs | 0.5.x | CSS paged media polyfill | If in-editor pagination preview is desired (not just print) |

### Already Installed

| Library | Already In | Purpose |
|---------|------------|---------|
| jsPDF | 4.0.0 | PDF generation - already installed |
| html2canvas | 1.4.1 | DOM to canvas - already installed |
| JSZip | - | Already used for EPUB export |
| mammoth | 1.11.0 | Word import (docx pairs well with this) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| docx | docxtemplater | Better for templates, worse for programmatic generation from JSON |
| @uiw/react-codemirror | Monaco | Monaco is heavier (VS Code engine), CodeMirror is lighter |
| pagedjs | CSS @page only | CSS-only is simpler but no live pagination preview |

**Installation:**
```bash
npm install docx @tiptap/extension-markdown @uiw/react-codemirror @codemirror/lang-markdown
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── export-handlers.ts        # Extend with exportToWord()
│   ├── docx-converter.ts         # NEW: TipTap JSON to docx.js conversion
│   └── markdown-converter.ts     # Existing jsonToMarkdown, add reverse
├── components/
│   ├── Editor/
│   │   ├── EditorCore.tsx        # Extend for view mode toggle
│   │   └── MarkdownEditor.tsx    # NEW: CodeMirror-based Markdown source view
│   └── Layout/
│       └── Canvas.tsx            # Extend for pagination mode CSS
├── extensions/
│   └── Markdown/                 # NEW: Configure @tiptap/extension-markdown
│       └── index.ts
└── stores/
    └── editorStore.ts            # Add viewMode: 'rendered' | 'source' | 'split'
```

### Pattern 1: PDF Optimization via JPEG Compression

**What:** Replace PNG output with JPEG and add compression flag
**When to use:** Always for PDF export - reduces file size 10-30x
**Example:**
```typescript
// Source: jsPDF documentation, GitHub issues
// BEFORE: 80MB PDF
const canvas = await html2canvas(container, { scale: 2 })
const imgData = canvas.toDataURL('image/png')
pdf.addImage(imgData, 'PNG', ...)

// AFTER: ~3MB PDF
const canvas = await html2canvas(container, { scale: 2 })
const imgData = canvas.toDataURL('image/jpeg', 0.7) // 70% quality JPEG
pdf.addImage(imgData, 'JPEG', x, y, w, h, undefined, 'FAST')
```

### Pattern 2: TipTap JSON to docx.js Conversion

**What:** Convert TipTap document structure to Word document
**When to use:** Word export
**Example:**
```typescript
// Source: docx.js documentation
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell } from 'docx'

function tiptapToDocx(json: TipTapNode): Document {
  const children = json.content?.map(convertNode) ?? []

  return new Document({
    sections: [{ properties: {}, children }]
  })
}

function convertNode(node: TipTapNode): Paragraph | Table {
  switch (node.type) {
    case 'heading':
      return new Paragraph({
        heading: `Heading${node.attrs?.level}` as HeadingLevel,
        children: convertInline(node.content)
      })
    case 'paragraph':
      return new Paragraph({ children: convertInline(node.content) })
    case 'bulletList':
      return node.content?.map(li => new Paragraph({
        bullet: { level: 0 },
        children: convertInline(li.content?.[0]?.content)
      })) ?? []
    // ... more cases
  }
}

function convertInline(content?: TipTapNode[]): TextRun[] {
  return content?.map(n => {
    const marks = n.marks ?? []
    return new TextRun({
      text: n.text ?? '',
      bold: marks.some(m => m.type === 'bold'),
      italics: marks.some(m => m.type === 'italic'),
      underline: marks.some(m => m.type === 'underline') ? {} : undefined,
    })
  }) ?? []
}
```

### Pattern 3: View Mode Toggle with Markdown Sync

**What:** Toggle between rendered TipTap and raw Markdown source
**When to use:** Markdown source mode feature
**Example:**
```typescript
// Source: TipTap Markdown extension docs
import { Markdown } from '@tiptap/extension-markdown'

// In editor setup
const editor = useEditor({
  extensions: [
    StarterKit,
    Markdown.configure({
      html: false,  // Don't allow raw HTML
      tightLists: true,
    }),
  ],
})

// Get markdown content
const markdown = editor.getMarkdown()

// Set content from markdown
editor.commands.setContent(markdown, { contentType: 'markdown' })

// Or via MarkdownManager for JSON operations
const json = editor.markdown.parse('# Hello')
const md = editor.markdown.serialize(json)
```

### Pattern 4: Pagination CSS with @page

**What:** CSS paged media for print-ready documents
**When to use:** Pagination mode
**Example:**
```css
/* Source: MDN CSS paged media */
@page {
  size: A4;  /* or Letter, Legal */
  margin: 2.5cm;
}

@page :first {
  margin-top: 3cm;  /* Extra space for first page */
}

@media print {
  .canvas {
    width: 21cm;  /* A4 width */
  }

  h1, h2, h3 {
    break-after: avoid;  /* Don't break right after headings */
  }

  table, figure {
    break-inside: avoid;  /* Keep tables/figures together */
  }

  .page-break {
    break-before: page;
    page-break-before: always;  /* Legacy fallback */
  }
}
```

### Anti-Patterns to Avoid

- **PNG for PDF images:** PNG creates massive files. Always use JPEG with compression.
- **Full-page canvas rendering:** Current approach. Better to render sections and paginate.
- **Synchronous conversion:** TipTap to docx should be async to not block UI.
- **Direct markdown storage:** Store TipTap JSON as source of truth, convert to/from markdown on demand.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word .docx generation | Custom OOXML creation | docx npm package | OOXML is complex, docx handles all the XML boilerplate |
| Markdown parsing | Regex-based parser | TipTap Markdown extension | Edge cases in Markdown are numerous, official extension handles them |
| Syntax highlighting | Manual regex coloring | CodeMirror | Proper lexer/parser, handles incremental updates efficiently |
| Page break detection | Manual math | CSS break-* properties | Browser handles this correctly |
| EPUB/Word ZIP structure | Manual file assembly | JSZip (already used) | Zip format has many edge cases |

**Key insight:** Document formats have years of edge cases baked in. Libraries like docx.js and TipTap markdown extension represent hundreds of hours of bug fixes you'd otherwise discover yourself.

## Common Pitfalls

### Pitfall 1: PDF Image Scaling Without Compression

**What goes wrong:** PDF files are 80MB+ for simple text documents
**Why it happens:** html2canvas outputs PNG at 2x scale (retina), PNG is lossless
**How to avoid:** Use JPEG with quality 0.7-0.8 and 'FAST' compression in jsPDF
**Warning signs:** Export takes >5 seconds, file size exceeds 5MB for text-only doc

### Pitfall 2: Markdown Round-Trip Loss

**What goes wrong:** Converting TipTap -> Markdown -> TipTap loses styling
**Why it happens:** Markdown doesn't support custom fonts, colors, or many TipTap features
**How to avoid:** Warn users before converting rich documents; store original JSON alongside
**Warning signs:** User has custom fonts/colors and switches to Markdown view

### Pitfall 3: Pagination Breaking Tables

**What goes wrong:** Page breaks in the middle of table rows
**Why it happens:** CSS break-inside doesn't work inside flexbox/grid containers
**How to avoid:** Use `display: block` on table containers, add `break-inside: avoid` on rows
**Warning signs:** Tables split awkwardly in print preview

### Pitfall 4: View Mode Sync Race Conditions

**What goes wrong:** Content appears to "jump" when switching between rendered/source
**Why it happens:** Both editors try to update simultaneously without coordination
**How to avoid:** Single source of truth (TipTap JSON), convert on view switch only
**Warning signs:** Duplicate content, content loss, infinite update loops

### Pitfall 5: docx Images from Base64

**What goes wrong:** Images don't appear in Word document
**Why it happens:** docx.js needs specific image format, base64 needs conversion
**How to avoid:** Extract base64 to Uint8Array, use ImageRun with proper dimensions
**Warning signs:** Word opens but images are missing or broken

## Code Examples

### PDF Export with Optimization

```typescript
// Source: Verified from jsPDF docs and GitHub issues
export async function exportToPDF(editor: Editor, documentName: string): Promise<boolean> {
  const container = createRenderContainer(editor.getHTML())
  document.body.appendChild(container)

  await new Promise(r => setTimeout(r, 100)) // Let styles apply

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  document.body.removeChild(container)

  // KEY OPTIMIZATION: JPEG instead of PNG, with compression
  const imgData = canvas.toDataURL('image/jpeg', 0.75)  // 75% quality

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)

  // Use FAST compression
  pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth,
    (canvas.height / canvas.width) * contentWidth, undefined, 'FAST')

  // ... pagination logic for multi-page ...

  const pdfOutput = pdf.output('arraybuffer')
  // Save via Tauri dialog
}
```

### Word Export Function

```typescript
// Source: docx.js documentation
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'

export async function exportToWord(editor: Editor, documentName: string): Promise<boolean> {
  const json = editor.getJSON()
  const doc = convertTipTapToDocx(json)

  const buffer = await Packer.toBuffer(doc)

  const defaultName = documentName.replace(/\.(serq\.html|html)$/i, '') + '.docx'
  const filePath = await save({
    defaultPath: defaultName,
    filters: [{ name: 'Word Document', extensions: ['docx'] }],
  })

  if (filePath) {
    await writeFile(filePath, new Uint8Array(buffer))
    return true
  }
  return false
}

function convertTipTapToDocx(json: TipTapNode): Document {
  const children = (json.content ?? []).flatMap(convertNodeToDocx)
  return new Document({
    sections: [{ properties: {}, children }]
  })
}
```

### Markdown View Mode Store

```typescript
// Source: Pattern based on TipTap markdown extension usage
interface EditorState {
  viewMode: 'rendered' | 'source' | 'split'
  setViewMode: (mode: 'rendered' | 'source' | 'split') => void
  markdownSource: string  // Synced when switching modes
  setMarkdownSource: (md: string) => void
}

// In store
viewMode: 'rendered',
setViewMode: (mode) => {
  set({ viewMode: mode })
},
markdownSource: '',
setMarkdownSource: (md) => {
  set({ markdownSource: md })
},
```

### Pagination Mode CSS

```css
/* Source: MDN CSS paged media */
.canvas[data-pagination="true"] {
  /* Visual page boundaries in editor */
  background: repeating-linear-gradient(
    to bottom,
    white 0,
    white calc(29.7cm - 2mm),  /* A4 height minus gap */
    #e5e7eb calc(29.7cm - 2mm),
    #e5e7eb 29.7cm
  );
}

@media print {
  @page {
    size: A4;
    margin: 2.5cm;
  }

  @page :first {
    margin-top: 3cm;
  }

  .canvas {
    width: 21cm;
    max-width: 21cm;
    margin: 0;
    padding: 0;
    box-shadow: none;
    background: white;
  }

  /* Prevent orphans/widows */
  p {
    orphans: 3;
    widows: 3;
  }

  h1, h2, h3, h4, h5, h6 {
    break-after: avoid;
    page-break-after: avoid;
  }

  table, figure, blockquote, .callout {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PNG for PDF export | JPEG with compression | Always best practice | 10-30x file size reduction |
| Browser print dialog | jsPDF + smart pagination | Current implementation | Better control, but needs optimization |
| Custom markdown parser | TipTap Markdown extension | TipTap 3.7.0 (2024) | Official support, edge cases handled |
| CSS @page alone | paged.js polyfill option | paged.js mature 2023+ | In-editor page preview possible |

**Deprecated/outdated:**
- **@tiptap/markdown (unofficial)**: Replaced by official @tiptap/extension-markdown in v3.7.0
- **jsPDF PNG approach**: Should always use JPEG with compression for smaller files
- **Browser print-to-PDF**: Still works but jsPDF gives more control over pagination

## Open Questions

1. **Pagination: CSS-only vs paged.js?**
   - What we know: CSS @page works for print, paged.js adds in-editor preview
   - What's unclear: Is in-editor page boundary display worth the complexity?
   - Recommendation: Start with CSS-only for print; add paged.js if users request live preview

2. **Markdown view: Replace editor or split pane?**
   - What we know: TipTap can convert to/from markdown; CodeMirror can edit markdown
   - What's unclear: Should switching completely replace the editor, or show side-by-side?
   - Recommendation: Start with toggle (one or the other), add split view as enhancement

3. **Image handling in Word export?**
   - What we know: SERQ embeds images as base64; docx.js needs Uint8Array
   - What's unclear: How to handle very large images without memory issues
   - Recommendation: Resize images during export if over 1MB, warn user about large images

## Sources

### Primary (HIGH confidence)
- `/websites/docx_js` (Context7) - docx.js API, Document/Paragraph/TextRun patterns
- `/websites/tiptap_dev` (Context7) - TipTap Markdown extension getMarkdown/setMarkdown
- https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage - Official TipTap markdown docs
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_paged_media - CSS @page and pagination

### Secondary (MEDIUM confidence)
- https://github.com/parallax/jsPDF/issues/1967 - jsPDF file size optimization with JPEG
- https://docx.js.org/ - docx.js official documentation
- https://github.com/pagedjs/pagedjs - Paged.js CSS polyfill

### Tertiary (LOW confidence)
- WebSearch results for "best JavaScript library generate Word docx files 2026"
- WebSearch results for "jsPDF JPEG compression reduce file size"

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - docx.js and TipTap markdown verified via Context7, widely used
- Architecture: MEDIUM - Patterns are established but need adaptation to SERQ specifics
- Pitfalls: HIGH - Well-documented in GitHub issues and multiple sources
- PDF optimization: HIGH - Multiple sources confirm JPEG + FAST reduces size dramatically

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable domain, mature libraries)
