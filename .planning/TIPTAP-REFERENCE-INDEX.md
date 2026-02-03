# TipTap Reference Index

**Created:** 2026-02-02
**Purpose:** Quick reference for all TipTap documentation, examples, and components

---

## Examples Index

### Basics (`/docs/examples/basics/`)

| Example | Key Learnings |
|---------|---------------|
| **default-text-editor** | Barebones editor with comprehensive extensions, headless approach |
| **formatting** | Bold, italic, etc. with toolbar patterns |
| **images** | Image upload, drag-drop, resize |
| **long-texts** | 200,000+ word performance demo |
| **markdown-shortcuts** | Built-in markdown shortcuts (##, **, etc.) |
| **minimal-setup** | Paragraphs and text only - simplest config |
| **tables** | Table extension with all operations |
| **tasks** | TaskList extension for checkboxes |
| **text-direction** | RTL support via `textDirection: 'auto'` option |

### Advanced (`/docs/examples/advanced/`)

| Example | Key Learnings |
|---------|---------------|
| **clever-editor** | Color highlighting, emoji replacement, typography replacement |
| **collaborative-editing** | Y.js integration for real-time collab (SKIP - cloud required) |
| **drawing** | Canvas drawing via custom NodeView |
| **forced-content-structure** | Custom documents that extend default schema |
| **interactive-react-and-vue-views** | NodeViewRenderer for interactive React components |
| **react-performance** | `shouldRerenderOnTransaction`, `useEditorState` hook |
| **menus** | Bubble menu & floating menu implementation |
| **mentions** | @mentions using Suggestion plugin |
| **syntax-highlighting** | CodeBlockLowlight extension |

### Experiments (`/docs/examples/experiments/`)

| Example | Status | Notes |
|---------|--------|-------|
| **ai-agent** | DEPRECATED | Use AI Toolkit instead |
| **collaborative-fields** | Experimental | Multiple editors, one Y.js doc |
| **figure** | Experimental | Image with caption |
| **generic-figure** | Experimental | Base for extending figure nodes |
| **iframe** | Experimental | Embed iframes |
| **linting** | Experimental | Content validation (use AI Suggestion instead) |
| **slash-commands** | Experimental | Uses @tiptap/suggestion - NOT PUBLISHED |

---

## Extensions Reference

### Nodes
- Audio, Blockquote, BulletList, CodeBlock, CodeBlockLowlight
- Details, DetailsContent, DetailsSummary (FREE - open sourced)
- Document, Emoji (FREE), HardBreak, Heading, HorizontalRule
- Image, ListItem, Mathematics (FREE), Mention, OrderedList
- Paragraph, Table, TableCell, TableHeader, TableRow
- TaskList, TaskItem, Text, Twitch, Youtube

### Marks
- Bold, Code, Highlight, Italic, Link, Strike
- Subscript, Superscript, TextStyle, Underline

### Functionality
- **DragHandle** (FREE - open sourced)
- **DragHandleReact** (FREE)
- BubbleMenu, FloatingMenu
- CharacterCount, FileHandler (FREE), Focus, GapCursor
- InvisibleCharacters (FREE), Placeholder, Selection
- TableOfContents (FREE), TrailingNode, UniqueID (FREE)
- Typography, Dropcursor

### Kits (Bundles)
- **StarterKit** - Essential extensions bundle
- **TableKit** - Table + Row + Cell + Header
- **ListKit** - BulletList + OrderedList + TaskList
- **TextStyleKit** - TextStyle + Color + FontFamily + etc.

---

## UI Components Reference

### Installation
```bash
npx @tiptap/cli@latest add <component-name>
```

### Critical Components for SERQ

| Component | Install Command | What It Does |
|-----------|-----------------|--------------|
| **drag-context-menu** | `add drag-context-menu` | Drag handle + block context menu |
| **slash-dropdown-menu** | `add slash-dropdown-menu` | Slash commands popup |
| **table-node** | `add table-node` | Table with full context menus |
| **table-of-contents-node** | `add toc-node` | Document minimap + navigation |
| **heading-dropdown-menu** | `add heading-dropdown-menu` | H1-H6 selector |
| **list-dropdown-menu** | `add list-dropdown-menu` | List type selector |
| **color-text-popover** | `add color-text-popover` | Text color picker |
| **color-highlight-popover** | `add color-highlight-popover` | Highlight color picker |
| **link-popover** | `add link-popover` | Link editing UI |
| **image-upload-button** | `add image-upload-button` | Image upload |
| **toolbar** | `add toolbar` | Toolbar primitive |

### Node Components
- blockquote-node, code-block-node, heading-node
- horizontal-rule-node, image-node, image-node-pro
- image-upload-node, list-node, paragraph-node
- table-node, table-of-contents-node

### Primitives
- Avatar, Badge, Button, Card, Combobox
- DropdownMenu, Input, Label, Menu, Popover
- Separator, Spacer, TextareaAutosize, Toolbar, Tooltip

---

## Key Configuration Patterns

### DragContextMenu
```jsx
<DragContextMenu
  editor={editor}
  withSlashCommandTrigger={true}  // Show + button for slash menu
  mobileBreakpoint={768}
/>
```

Required extensions: StarterKit, UiState
Optional: TextStyle + Color, Highlight, NodeBackground

### SlashDropdownMenu - Adding Custom Commands
```jsx
<SlashDropdownMenu
  editor={editor}
  config={{
    enabledItems: ['text', 'heading_1', 'bullet_list'],
    customItems: [
      {
        title: 'Callout',
        subtext: 'Insert a callout block',
        aliases: ['callout', 'alert'],
        onSelect: ({ editor }) => {
          editor.chain().focus().insertCallout().run()
        },
      },
    ],
  }}
/>
```

### TableNode Features
- Move row up/down
- Insert row above/below
- Sort row A-Z / Z-A
- Color picker for cells
- Alignment (left, center, right + top, middle, bottom)
- Clear row contents
- Duplicate row
- Delete row

### Table of Contents Node
Two modes:
1. **Inline TOC** - Embedded block in document
2. **Floating Sidebar** - Minimap on side with progress rail

---

## React Performance Optimization

```typescript
// In editor config
shouldRerenderOnTransaction: false,

// To access state without re-render
const { active } = useEditorState({
  editor,
  selector: (ctx) => ({
    active: ctx.editor.isActive('bold'),
  }),
})
```

---

## Dark Mode Support

TipTap UI Components use CSS variables. Set theme via:
```css
[data-theme="dark"] {
  --tiptap-color-text: #ffffff;
  --tiptap-color-background: #1a1a1a;
  /* etc */
}
```

---

## What Requires TipTap Cloud (SKIP THESE)

- Collaboration / CollaborationCaret
- Comments
- Cloud Version History
- AI Generation (cloud-based)
- Export/Import (cloud-based)
- Pages

---

## Quick Reference URLs

- Examples: https://tiptap.dev/docs/examples
- Extensions: https://tiptap.dev/docs/editor/extensions
- UI Components: https://tiptap.dev/docs/ui-components
- Template Demo: https://template.tiptap.dev/preview/templates/notion-like/
- GitHub: https://github.com/ueberdosis/tiptap

---

*This index survives between sessions. Reference when implementing TipTap features.*
