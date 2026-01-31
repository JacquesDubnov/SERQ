# Phase 4: Extended Features - Research

**Researched:** 2026-01-31
**Domain:** TipTap advanced extensions, custom nodes, command interfaces, image handling
**Confidence:** HIGH (official docs verified via WebFetch)

## Summary

Phase 4 adds six major feature areas to SERQ: tables, callouts, images, command palette, slash commands, and document outline. The research confirms TipTap 3.x provides official extensions for most features, with some requiring custom implementation or third-party libraries.

Tables use `@tiptap/extension-table` with TableKit for advanced features. Callouts require a custom node extension using `Node.create()` with `ReactNodeViewRenderer`. Images leverage the official Image extension with third-party resize libraries. Command palette uses `cmdk` (the library powering Linear, Raycast, and shadcn/ui). Slash commands use TipTap's `@tiptap/suggestion` package. Document outline uses the official `@tiptap/extension-table-of-contents`.

**Primary recommendation:** Use official TipTap extensions where available, supplement with cmdk for command palette, and build custom Callout node with React node views.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/extension-table | 3.18.x | Table structure | Official TipTap, includes merge/split/resize |
| @tiptap/extension-table-row | 3.18.x | Table rows | Required by Table extension |
| @tiptap/extension-table-cell | 3.18.x | Table cells | Required by Table extension |
| @tiptap/extension-table-header | 3.18.x | Header cells | Required by Table extension |
| @tiptap/extension-image | 3.18.x | Base image support | Official, supports base64, inline/block |
| @tiptap/extension-table-of-contents | 3.18.x | Document outline | Official, anchors, scroll tracking, active state |
| @tiptap/suggestion | 3.18.x | Slash commands foundation | Official utility for suggestion-based UIs |
| cmdk | 1.x | Command palette | Powers Linear, Raycast, shadcn; fast fuzzy search |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tiptap-extension-resize-image | latest | Image resize handles | If official resize insufficient |
| react-advanced-cropper | latest | Non-destructive cropping | For image editor mode crop tool |
| @imgly/background-removal | latest | Background removal | For image editor mode (browser-based, no API) |
| fabric | 6.x | Image annotations | For drawing, shapes, text on images |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cmdk | react-cmdk | Pre-styled but less flexible, cmdk is more battle-tested |
| fabric.js | Pintura | Pintura is commercial but more complete; Fabric.js is free |
| react-advanced-cropper | react-image-crop | react-image-crop is lighter but less customizable |

**Installation:**
```bash
# Tables
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header

# Image
npm install @tiptap/extension-image tiptap-extension-resize-image

# Document outline
npm install @tiptap/extension-table-of-contents

# Command palette
npm install cmdk

# Slash commands (already a dependency of TipTap)
npm install @tiptap/suggestion

# Image editor mode
npm install react-advanced-cropper @imgly/background-removal fabric
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── extensions/              # Custom TipTap extensions
│   ├── Callout/
│   │   ├── Callout.ts       # Node extension definition
│   │   ├── CalloutView.tsx  # React node view component
│   │   └── index.ts
│   ├── SlashCommands/
│   │   ├── SlashCommands.ts # Extension using @tiptap/suggestion
│   │   ├── commands.ts      # Command definitions
│   │   └── SlashMenu.tsx    # Dropdown UI component
│   └── ImageEditor/
│       ├── ImageEditor.tsx  # Modal image editor
│       └── useImageEditor.ts
├── components/
│   ├── CommandPalette/
│   │   ├── CommandPalette.tsx  # cmdk-based palette
│   │   ├── useCommandPalette.ts
│   │   └── commands.ts         # All available commands
│   ├── DocumentOutline/
│   │   ├── OutlinePanel.tsx    # Sidebar outline display
│   │   └── useOutline.ts
│   └── ImageEditor/
│       └── ImageEditorModal.tsx
└── hooks/
    └── useCommandPalette.ts    # Cmd+K handler
```

### Pattern 1: Custom Block Node with React View (Callout)
**What:** Create a custom node that renders as a React component with editable content inside
**When to use:** For any block-level element that needs custom UI or interactivity (callouts, embeds, custom blocks)
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CalloutView } from './CalloutView'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',  // Allows any block content inside

  addAttributes() {
    return {
      color: { default: 'blue' },  // Color-based, not semantic
      icon: { default: null },
      collapsed: { default: false },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-callout': '' }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})
```

```tsx
// CalloutView.tsx
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

export function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const { color, icon, collapsed } = node.attrs

  return (
    <NodeViewWrapper
      className="callout"
      data-color={color}
      style={{ '--callout-bg': `var(--color-${color}-100)` }}
    >
      {icon && <span className="callout-icon" contentEditable={false}>{icon}</span>}
      <NodeViewContent className="callout-content" />
      {collapsed !== undefined && (
        <button
          contentEditable={false}
          onClick={() => updateAttributes({ collapsed: !collapsed })}
        />
      )}
    </NodeViewWrapper>
  )
}
```

### Pattern 2: Slash Commands with Suggestion
**What:** Trigger dropdown menu when user types `/`
**When to use:** For inline command insertion
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/api/utilities/suggestion
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { SlashMenu } from './SlashMenu'

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => {
          return commands.filter(cmd =>
            cmd.title.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10)
        },
        render: () => {
          let component: ReactRenderer
          let popup: Instance

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, { props, editor: props.editor })
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate: (props) => { component.updateProps(props) },
            onKeyDown: (props) => { return component.ref?.onKeyDown?.(props) },
            onExit: () => { popup.destroy(); component.destroy() },
          }
        },
      }),
    ]
  },
})
```

### Pattern 3: Command Palette with cmdk
**What:** Modal command palette triggered by Cmd+K
**When to use:** Global command interface
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/command
import { Command } from 'cmdk'
import { useEffect, useState } from 'react'

export function CommandPalette({ editor }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'p') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => editor.chain().focus().toggleBold().run()}>
            Bold
            <span className="shortcut">Cmd+B</span>
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Insert">
          <Command.Item onSelect={() => editor.chain().focus().insertTable().run()}>
            Table
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
```

### Pattern 4: Table with Full Configuration
**What:** Configure TipTap tables with all required extensions
**When to use:** Adding table support
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/extensions/nodes/table
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

const editor = new Editor({
  extensions: [
    // ... other extensions
    Table.configure({
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      lastColumnResizable: true,
      allowTableNodeSelection: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
})

// Commands available:
// editor.chain().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run()
// editor.chain().addColumnAfter().run()
// editor.chain().deleteColumn().run()
// editor.chain().mergeCells().run()
// editor.chain().splitCell().run()
// editor.chain().toggleHeaderRow().run()
```

### Pattern 5: Document Outline with Table of Contents
**What:** Extract headings and enable navigation
**When to use:** Side panel outline
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/extensions/functionality/table-of-contents
import TableOfContents, { getHierarchicalIndexes } from '@tiptap/extension-table-of-contents'

const [anchors, setAnchors] = useState([])

TableOfContents.configure({
  anchorTypes: ['heading'],
  getIndex: getHierarchicalIndexes,
  onUpdate: (anchors) => {
    setAnchors(anchors)
  },
})

// Anchor data structure:
// {
//   id: 'unique-id',
//   textContent: 'Heading Text',
//   level: 2,              // h2
//   isActive: boolean,     // cursor inside this section
//   isScrolledOver: boolean,
//   pos: number,           // document position
// }

// Navigation:
const scrollToHeading = (anchor) => {
  anchor.dom.scrollIntoView({ behavior: 'smooth' })
  editor.commands.setTextSelection(anchor.pos)
}
```

### Anti-Patterns to Avoid

- **Hand-rolling table cell selection:** Use ProseMirror's CellSelection, don't implement custom selection logic
- **Storing crops as modified images:** Keep original image, store crop coordinates as percentage-based metadata
- **Synchronous image loading:** Always lazy-load images, especially for large documents
- **Global event listeners without cleanup:** Always return cleanup function in useEffect
- **Recreating suggestion from scratch:** Use @tiptap/suggestion, it handles edge cases

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table cell selection | Custom selection tracking | ProseMirror CellSelection | Complex edge cases with merged cells |
| Command palette fuzzy search | Custom filtering | cmdk's built-in | Uses command-score library, handles ranking |
| Image resize handles | Manual drag logic | tiptap-extension-resize-image | Handles aspect ratio, bounds, touch events |
| Background removal | Server-side processing | @imgly/background-removal | Runs entirely in browser, no API costs |
| Table column resize | Custom colgroup manipulation | TipTap Table resizable: true | columnResizing plugin handles proportions |
| Suggestion popup positioning | Manual clientRect calculations | @tiptap/suggestion | Tracks cursor position, handles scroll |

**Key insight:** The TipTap ecosystem has solved most table/suggestion complexity. Image editing is the one area requiring custom integration with external libraries.

## Common Pitfalls

### Pitfall 1: Missing Table Extension Dependencies
**What goes wrong:** Table renders but no resize, merge commands fail silently
**Why it happens:** Table requires TableRow, TableCell, TableHeader all installed
**How to avoid:** Install ALL four table extensions together
**Warning signs:** `Cannot read property 'type' of undefined` in console

### Pitfall 2: Node View Content Not Editable
**What goes wrong:** Callout renders but can't type inside it
**Why it happens:** Missing `<NodeViewContent />` or wrong `content` schema
**How to avoid:** Always include NodeViewContent, set `content: 'block+'` in schema
**Warning signs:** Cursor doesn't enter the block, can only select as unit

### Pitfall 3: Suggestion Menu Position Jumps
**What goes wrong:** Dropdown menu appears in wrong position or jumps around
**Why it happens:** `clientRect` callback not memoized, or DOM layout shifts
**How to avoid:** Use tippy.js positioning, debounce updates
**Warning signs:** Menu flickers, appears at top-left of viewport

### Pitfall 4: Image Base64 Performance
**What goes wrong:** Editor becomes sluggish with large images
**Why it happens:** Base64 images are ~33% larger than binary, all in memory
**How to avoid:** Lazy load images, warn on large files (>2MB), offer resize option
**Warning signs:** Document save takes seconds, scrolling stutters

### Pitfall 5: Command Palette Focus Trap
**What goes wrong:** User can't escape palette, editor focus lost
**Why it happens:** Modal not properly managing focus, missing Escape handler
**How to avoid:** Use cmdk's Dialog which handles focus management
**Warning signs:** Tab key doesn't cycle, Escape does nothing

### Pitfall 6: Table Column Resize with Custom NodeView
**What goes wrong:** Resize handles don't appear, column widths don't save
**Why it happens:** Custom nodeView missing `<colgroup>` tag
**How to avoid:** Don't override table nodeView, or ensure colgroup is rendered
**Warning signs:** CSS resize cursor doesn't appear on hover

## Code Examples

### Table Context Menu for Border Controls
```typescript
// Context menu for table cell operations
const TableContextMenu = ({ editor }) => {
  const toggleBorders = (side: 'all' | 'frame' | 'vertical' | 'horizontal') => {
    // TipTap doesn't have built-in border toggle
    // Use setCellAttribute with custom border attributes
    editor.chain()
      .focus()
      .setCellAttribute('borderStyle', side)
      .run()
  }

  return (
    <ContextMenu>
      <ContextMenuItem onClick={() => toggleBorders('all')}>
        All Borders
      </ContextMenuItem>
      <ContextMenuItem onClick={() => toggleBorders('frame')}>
        Frame Only
      </ContextMenuItem>
      {/* ... */}
    </ContextMenu>
  )
}
```

### Image with All Insertion Methods
```typescript
// Drag/drop, paste, file picker, slash command
import Image from '@tiptap/extension-image'

Image.configure({
  allowBase64: true,
  inline: false,  // Block by default, toggle per image
  HTMLAttributes: {
    class: 'serq-image',
  },
})

// Handle paste
editor.on('paste', (event) => {
  const items = event.clipboardData?.items
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      const reader = new FileReader()
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result }).run()
      }
      reader.readAsDataURL(file)
    }
  }
})

// Handle drop
editor.on('drop', (event) => {
  const files = event.dataTransfer?.files
  // Similar pattern...
})
```

### Non-Destructive Image Cropping
```typescript
// Store crop as metadata, apply visually with CSS clip-path
interface ImageMeta {
  originalSrc: string  // Full image always preserved
  crop: {
    x: number      // 0-100 percentage
    y: number
    width: number
    height: number
  } | null
  rotation: number   // degrees
  effects: {
    brightness: number
    contrast: number
    saturation: number
  }
}

// CSS application
const getCropStyle = (crop: ImageMeta['crop']) => {
  if (!crop) return {}
  return {
    clipPath: `inset(${crop.y}% ${100 - crop.x - crop.width}% ${100 - crop.y - crop.height}% ${crop.x}%)`,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom table implementation | @tiptap/extension-table | TipTap 2.x | Use official, don't hand-roll |
| Server-side image processing | @imgly/background-removal | 2023 | Browser-based, no API costs |
| Custom suggestion logic | @tiptap/suggestion | TipTap 2.x | Standard utility, handles edge cases |
| React state for outline | TableOfContents onUpdate | TipTap 3.x | Extension manages state, hooks receive |

**Deprecated/outdated:**
- AI Suggestion, AI Changes, AI Assistant: Deprecated in 2026, replaced by AI Toolkit (TipTap pro feature)
- Manual heading extraction: Use TableOfContents extension instead

## Open Questions

1. **Proportional Column Resize Behavior**
   - What we know: TipTap supports `resizable: true`, columns resize individually
   - What's unclear: Whether proportional resize (neighbors adjust) is built-in or requires custom implementation
   - Recommendation: Test with TipTap Table first, implement custom columnResizing plugin if needed

2. **Image Editor Modal Architecture**
   - What we know: Fabric.js for annotations, react-advanced-cropper for cropping, @imgly for background removal
   - What's unclear: How to compose these into a unified modal with single undo stack
   - Recommendation: Build modular - each tool as separate component, shared canvas state

3. **Table Row/Column Drag Reorder**
   - What we know: TipTap UI Components now include drag-and-drop reorder
   - What's unclear: Whether this is available in free tier or requires paid subscription
   - Recommendation: Check TipTap UI Components licensing; fallback to custom implementation using moveTableRow

## Sources

### Primary (HIGH confidence)
- [TipTap Table Extension](https://tiptap.dev/docs/editor/extensions/nodes/table) - Commands, configuration
- [TipTap Image Extension](https://tiptap.dev/docs/editor/extensions/nodes/image) - Base64, resize config
- [TipTap Suggestion Utility](https://tiptap.dev/docs/editor/api/utilities/suggestion) - Slash commands API
- [TipTap Table of Contents](https://tiptap.dev/docs/editor/extensions/functionality/table-of-contents) - Outline API
- [TipTap React Node Views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react) - Custom components
- [TipTap Node API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node) - Creating extensions
- [shadcn/ui Command](https://ui.shadcn.com/docs/components/command) - cmdk integration patterns

### Secondary (MEDIUM confidence)
- [TipTap Table Node UI Components](https://tiptap.dev/docs/ui-components/node-components/table-node) - Drag reorder, styling
- [TipTap Slash Dropdown Menu](https://tiptap.dev/docs/ui-components/components/slash-dropdown-menu) - Pre-built component
- [react-advanced-cropper](https://advanced-cropper.github.io/react-advanced-cropper/) - Cropping library
- [@imgly/background-removal](https://github.com/imgly/background-removal-js) - Browser BG removal

### Tertiary (LOW confidence)
- [tiptap-extension-resize-image](https://www.npmjs.com/package/tiptap-extension-resize-image) - Third-party, needs testing
- ProseMirror forum discussions on column reorder - Community solutions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core extensions verified via official TipTap docs
- Architecture patterns: HIGH - Patterns verified from official React node view docs
- Pitfalls: MEDIUM - Some based on GitHub issues, not all personally verified
- Image editor integration: LOW - Multiple libraries need integration testing

**Research date:** 2026-01-31
**Valid until:** 60 days (TipTap is stable, major version 3.x)
