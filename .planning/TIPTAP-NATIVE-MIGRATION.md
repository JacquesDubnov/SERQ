# TipTap Native UI Migration Plan

**Status:** READY FOR IMPLEMENTATION
**License:** TipTap Teams ($149/month) - PAID
**Reference:** https://template.tiptap.dev/preview/templates/notion-like/

---

## Executive Summary

Replace ALL custom UI components with TipTap's native UI Components library.
Keep only custom extensions where TipTap doesn't provide functionality.

**EXCLUDE:** Collaboration, Comments (require TipTap Cloud)
**INCLUDE:** Everything else

---

## Phase 1: Setup & Configuration

### 1.1 TypeScript Path Aliases

**tsconfig.json** - Add to compilerOptions:
```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

**tsconfig.app.json** - Same changes

### 1.2 Vite Configuration

**vite.config.ts** - Add path alias:
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 1.3 Install Dependencies

```bash
npm install -D @types/node sass
```

---

## Phase 2: Install TipTap UI Components

### 2.1 Core Components (via CLI)

```bash
# Drag & Block Operations
npx @tiptap/cli@latest add drag-context-menu

# Slash Commands
npx @tiptap/cli@latest add slash-dropdown-menu
npx @tiptap/cli@latest add slash-command-trigger-button

# Text Formatting
npx @tiptap/cli@latest add heading-dropdown-menu
npx @tiptap/cli@latest add list-dropdown-menu
npx @tiptap/cli@latest add mark-button
npx @tiptap/cli@latest add text-align-button
npx @tiptap/cli@latest add color-text-popover
npx @tiptap/cli@latest add color-highlight-popover

# Content Operations
npx @tiptap/cli@latest add link-popover
npx @tiptap/cli@latest add image-upload-button
npx @tiptap/cli@latest add undo-redo-button

# Tables
npx @tiptap/cli@latest add table-node

# Document Outline / Minimap (right side chapter navigation)
npx @tiptap/cli@latest add table-of-contents-node

# Node Components
npx @tiptap/cli@latest add code-block-node
npx @tiptap/cli@latest add image-node
npx @tiptap/cli@latest add list-node
npx @tiptap/cli@latest add heading-node
npx @tiptap/cli@latest add paragraph-node
npx @tiptap/cli@latest add blockquote-node

# Primitives (foundation)
npx @tiptap/cli@latest add toolbar
npx @tiptap/cli@latest add popover
npx @tiptap/cli@latest add dropdown-menu
npx @tiptap/cli@latest add button
npx @tiptap/cli@latest add tooltip
```

### 2.2 Required Extensions

Ensure these TipTap extensions are installed:
```bash
npm install @tiptap/extension-drag-handle @tiptap/extension-drag-handle-react
npm install @tiptap/extension-unique-id
```

---

## Phase 3: Delete Custom Implementations

### 3.1 Files to DELETE

```
src/components/Editor/SimpleDragHandle.tsx     # Replace with DragContextMenu
src/components/Editor/DragHandle.tsx           # Replace with DragContextMenu
src/extensions/SlashCommands/                  # Replace with SlashDropdownMenu
src/extensions/SlashCommands.ts                # Replace with SlashDropdownMenu
src/components/Editor/TablePicker.tsx          # Replace with TableNode
src/extensions/CustomTableCell.ts              # Use native if possible
src/extensions/TableWidthLimit.ts              # Evaluate if needed
src/extensions/TableKeyboardNavigation.ts      # Evaluate if needed
```

### 3.2 Files to MODIFY

```
src/components/Editor/EditorCore.tsx           # Remove custom components, add native
src/components/Editor/EditorToolbarNew.tsx     # Replace with TipTap toolbar components
src/styles/editor.css                          # Add TipTap UI styles
src/styles/tables.css                          # May be replaced by TableNode styles
src/styles/slash-menu.css                      # DELETE (native handles this)
```

---

## Phase 4: Integration

### 4.1 EditorCore.tsx Changes

**Remove imports:**
- SimpleDragHandle
- SlashCommands extension
- Custom table components

**Add imports:**
- DragContextMenu from TipTap UI
- Native extensions with UiState

**Add UiState extension:**
```typescript
import { UiState } from '@tiptap/extension-ui-state'

// In extensions array:
UiState,
```

### 4.2 Custom Slash Commands

To add custom commands to TipTap's SlashDropdownMenu:

```typescript
// The SlashDropdownMenu accepts a 'commands' prop
// Add custom commands alongside defaults

const customCommands = [
  {
    name: 'callout',
    label: 'Callout',
    icon: AlertIcon,
    command: ({ editor }) => {
      editor.chain().focus().insertCallout().run()
    },
  },
  // ... more custom commands
]
```

### 4.3 Document Outline / Minimap

TipTap's **TableOfContentsNode** provides:
- Visual minimap on the right side (horizontal lines representing headings)
- Hover popup showing full chapter/heading titles
- Click to navigate to that section
- Hierarchical display (H1, H2, H3 indentation)
- Active state showing current position in document

This replaces our current outline panel with the sleek minimap UI from the template.

### 4.4 Table Features

TipTap's TableNode includes:
- Move row up/down
- Insert row above/below
- Sort row A-Z / Z-A
- Color picker
- Alignment
- Clear row contents
- Duplicate row
- Delete row

All via native context menu - no custom code needed.

---

## Phase 5: Styling & Dark Mode

### 5.1 CRITICAL: Dark Mode Fix

Current state: Toolbar is broken in dark mode (light background, wrong colors).

TipTap UI Components include proper dark mode support. We need to:
1. Use their CSS variable system
2. Map our theme tokens to TipTap's tokens
3. Ensure ALL components respect `[data-theme="dark"]`

### 5.2 TipTap UI Styles

The CLI automatically adds SCSS imports. Ensure:
- SCSS is installed and configured (`npm install -D sass`)
- CSS variables match our theme
- Dark mode toggle propagates to TipTap components

### 5.3 Theme Integration

TipTap UI Components use CSS variables. Map to our existing variables:
```css
:root {
  /* Light mode */
  --tiptap-color-text: var(--color-text);
  --tiptap-color-text-secondary: var(--color-text-secondary);
  --tiptap-color-background: var(--color-bg);
  --tiptap-color-background-hover: var(--color-bg-hover);
  --tiptap-color-border: var(--color-border);
  --tiptap-color-accent: var(--color-accent);
}

[data-theme="dark"] {
  /* Dark mode - TipTap components will inherit */
  --tiptap-color-text: var(--color-text);
  --tiptap-color-background: var(--color-bg);
  /* etc - all dark mode values */
}
```

### 5.4 Full UI Replacement

Replace ALL our custom UI with TipTap native:
- Toolbar buttons → TipTap Button primitives
- Dropdowns → TipTap Dropdown Menu
- Popovers → TipTap Popover
- Icons → TipTap's icon set (Lucide)
- All context menus → TipTap native

**Goal: 1:1 match with template.tiptap.dev appearance**

---

## What We KEEP Custom

| Component | Reason |
|-----------|--------|
| Callout extension | TipTap doesn't have callouts |
| Column/ColumnSection | TipTap doesn't have columns |
| ResizableImage | Evaluate vs Image Node Pro |
| LineNumbers | TipTap doesn't have this |
| TypewriterMode | TipTap doesn't have this |
| MarkdownEditor | Our source view feature |

---

## What We EXCLUDE (Cloud-Dependent)

| Component | Reason |
|-----------|--------|
| Comments | Requires TipTap Cloud |
| Collaboration | Requires TipTap Cloud |
| Version History (cloud) | Requires TipTap Cloud |

**AI Features:** TO INVESTIGATE - may only need API key, not cloud. Consider later.

---

## Implementation Order

1. **Setup** - Path aliases, Vite config, SCSS
2. **Install primitives** - Button, Toolbar, Popover, etc.
3. **Install DragContextMenu** - Replace SimpleDragHandle
4. **Install SlashDropdownMenu** - Replace custom slash commands
5. **Install TableNode** - Replace table UI
6. **Install formatting components** - Heading, List, Color, etc.
7. **Delete old files** - Remove all replaced custom code
8. **Add custom commands** - Integrate Callout, etc. into slash menu
9. **Style integration** - Match our theme
10. **Test everything** - Full regression test

---

## Success Criteria

- [ ] Drag handle works with context menu (like template.tiptap.dev)
- [ ] Slash commands work with filtering
- [ ] Tables have full context menu (move, sort, color, etc.)
- [ ] Document outline minimap on right side with hover popup
- [ ] **Dark mode works perfectly** - all UI adapts correctly
- [ ] **Light mode works perfectly** - consistent with TipTap template
- [ ] All icons match TipTap's Lucide icon set
- [ ] All popovers/dropdowns use TipTap native components
- [ ] No conflicts between components
- [ ] Custom Callout available in slash menu
- [ ] **1:1 visual match with template.tiptap.dev**
- [ ] No custom code where TipTap provides native

---

*Plan created: 2026-02-02*
