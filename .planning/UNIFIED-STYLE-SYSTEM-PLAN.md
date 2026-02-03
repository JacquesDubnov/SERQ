# SERQ Unified Style System Architecture

**Branch:** `feature/unified-style-system`
**Created:** 2026-02-03

---

## Executive Summary

Replace the current dual-system architecture (TipTap marks + CSS variables) with a unified style system that:

1. **Single source of truth** - All styles flow through `styleStore`
2. **Scope-aware** - Handles document-level styles (headings) AND inline styles (paragraphs)
3. **Surface-agnostic** - Same operations work from toolbar, context menu, keyboard shortcuts, slash commands
4. **Future-proof** - Designed for multi-document/multi-project scenarios

---

## Current Architecture (The Problem)

```
┌─────────────────────────────────────────────────────────────┐
│                     CURRENT SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Toolbar Controls ──────► TipTap Marks (editor.state)       │
│       │                        │                            │
│       │                        ▼                            │
│       │               Inline styles on text nodes           │
│       │                                                     │
│  Heading Context ──────► styleStore (CSS variables)         │
│  Menu                          │                            │
│                                ▼                            │
│                        Document-level heading styles        │
│                                                             │
│  PROBLEM: Two separate systems, toolbar doesn't reflect     │
│           heading styles, duct-taped together               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED STYLE SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CONTROL SURFACES (UI)                   │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │ Toolbar │ │ Context  │ │ Keyboard │ │  Slash  │ │   │
│  │  │         │ │  Menu    │ │ Shortcuts│ │Commands │ │   │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │   │
│  └───────┼───────────┼────────────┼────────────┼──────┘   │
│          │           │            │            │           │
│          ▼           ▼            ▼            ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           UNIFIED STYLE HOOKS                        │   │
│  │  useUnifiedFontFamily, useUnifiedFontSize,          │   │
│  │  useUnifiedFontWeight, useUnifiedColor, etc.        │   │
│  │                                                      │   │
│  │  READ:  isHeading? → styleStore : editor.state      │   │
│  │  WRITE: isHeading? → styleStore : editor.chain()    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              STYLE OPERATIONS LAYER                  │   │
│  │                                                      │   │
│  │  StyleContext: { scope, blockType, level, editor }  │   │
│  │                                                      │   │
│  │  readStyle(ctx, property) → value                   │   │
│  │  writeStyle(ctx, property, value)                   │   │
│  │  canModifyStyle(ctx, property) → boolean            │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│          ┌──────────────┼──────────────┐                   │
│          ▼              ▼              ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  styleStore  │ │ TipTap Editor│ │   CSS Vars   │       │
│  │ (Zustand)    │ │ (marks/attrs)│ │ (document)   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Style Context

Every style operation needs to know WHERE it's operating:

```typescript
interface StyleContext {
  editor: Editor;
  scope: 'inline' | 'block' | 'document';
  blockType: 'paragraph' | 'heading' | 'blockquote' | 'codeBlock' | 'listItem';
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  selection: { from: number; to: number };
}

// Helper to create context from current selection
function getStyleContext(editor: Editor): StyleContext {
  const { $from } = editor.state.selection;
  const node = $from.parent;

  return {
    editor,
    scope: node.type.name === 'heading' ? 'block' : 'inline',
    blockType: node.type.name as StyleContext['blockType'],
    headingLevel: node.type.name === 'heading' ? node.attrs.level : undefined,
    selection: { from: editor.state.selection.from, to: editor.state.selection.to },
  };
}
```

### 2. Style Properties

Enumerate all styleable properties:

```typescript
type StyleProperty =
  // Typography
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight'
  // Marks
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  // Colors
  | 'textColor'
  | 'backgroundColor'
  | 'highlightColor'
  // Block
  | 'textAlign'
  | 'spacingBefore'
  | 'spacingAfter';

interface StyleValue {
  property: StyleProperty;
  value: string | number | boolean | null;
  source: 'mark' | 'nodeAttr' | 'cssVar' | 'default';
}
```

### 3. Style Operations

Pure functions that route to the correct system:

```typescript
// READ: Get current value of a style property
function readStyle(ctx: StyleContext, property: StyleProperty): StyleValue {
  // For headings with custom styles, read from styleStore
  if (ctx.blockType === 'heading' && ctx.headingLevel) {
    const customStyle = styleStore.getHeadingCustomStyle(ctx.headingLevel);
    if (customStyle && hasProperty(customStyle, property)) {
      return {
        property,
        value: customStyle[property],
        source: 'cssVar',
      };
    }
  }

  // For inline content, read from editor marks/attrs
  return readFromEditor(ctx.editor, property);
}

// WRITE: Set a style property value
function writeStyle(ctx: StyleContext, property: StyleProperty, value: any): void {
  if (ctx.blockType === 'heading' && ctx.headingLevel) {
    // Update heading-level style (affects all headings of this level)
    updateHeadingStyle(ctx.headingLevel, property, value);
  } else {
    // Apply inline mark/attribute
    applyInlineStyle(ctx.editor, property, value);
  }
}
```

---

## Implementation Layers

### Layer 1: Style Operations (`src/lib/style-operations/`)

```
src/lib/style-operations/
├── index.ts              # Public API
├── types.ts              # StyleContext, StyleProperty, StyleValue
├── context.ts            # getStyleContext()
├── read.ts               # readStyle(), readFromEditor(), readFromStore()
├── write.ts              # writeStyle(), applyInlineStyle(), updateHeadingStyle()
└── utils.ts              # Property mapping, value conversion
```

### Layer 2: Unified Hooks (`src/hooks/style-hooks/`)

Each hook wraps the style operations for a specific property:

```
src/hooks/style-hooks/
├── index.ts
├── useUnifiedStyle.ts         # Base hook that all others use
├── useUnifiedFontFamily.ts
├── useUnifiedFontSize.ts
├── useUnifiedFontWeight.ts
├── useUnifiedColor.ts
├── useUnifiedHighlight.ts
├── useUnifiedMark.ts          # bold, italic, underline, strike, code
├── useUnifiedTextAlign.ts
├── useUnifiedSpacing.ts
└── useUnifiedLineHeight.ts
```

Example hook implementation:

```typescript
// useUnifiedFontFamily.ts
export function useUnifiedFontFamily(editor: Editor | null) {
  const [currentValue, setCurrentValue] = useState<string | null>(null);
  const [source, setSource] = useState<'mark' | 'cssVar' | 'default'>('default');

  useEffect(() => {
    if (!editor) return;

    const updateValue = () => {
      const ctx = getStyleContext(editor);
      const result = readStyle(ctx, 'fontFamily');
      setCurrentValue(result.value as string);
      setSource(result.source);
    };

    updateValue();
    editor.on('selectionUpdate', updateValue);
    editor.on('transaction', updateValue);

    return () => {
      editor.off('selectionUpdate', updateValue);
      editor.off('transaction', updateValue);
    };
  }, [editor]);

  const setValue = useCallback((value: string) => {
    if (!editor) return;
    const ctx = getStyleContext(editor);
    writeStyle(ctx, 'fontFamily', value);
  }, [editor]);

  const unsetValue = useCallback(() => {
    if (!editor) return;
    const ctx = getStyleContext(editor);
    writeStyle(ctx, 'fontFamily', null);
  }, [editor]);

  return {
    value: currentValue,
    source,
    isHeading: source === 'cssVar',
    setValue,
    unsetValue,
  };
}
```

### Layer 3: UI Components (`src/components/unified-toolbar/`)

Toolbar components that use the unified hooks:

```
src/components/unified-toolbar/
├── index.ts
├── UnifiedToolbar.tsx              # Main toolbar container
├── UnifiedToolbarRow.tsx           # Row wrapper
├── controls/
│   ├── FontFamilyControl.tsx       # Font family dropdown
│   ├── FontSizeControl.tsx         # Font size dropdown
│   ├── FontWeightControl.tsx       # Font weight dropdown
│   ├── MarkToggle.tsx              # Bold/Italic/Underline/Strike/Code
│   ├── ColorControl.tsx            # Text color picker
│   ├── HighlightControl.tsx        # Highlight color picker
│   ├── TextAlignControl.tsx        # Alignment buttons
│   ├── SpacingControl.tsx          # Line height, letter spacing
│   ├── HeadingControl.tsx          # H1-H6 toggles
│   ├── ListControl.tsx             # Bullet/Ordered/Task list
│   ├── BlockquoteControl.tsx       # Quote toggle
│   ├── LinkControl.tsx             # Link popover
│   ├── UndoRedoControl.tsx         # History buttons
│   └── ClearFormattingControl.tsx  # Clear all formatting
└── styles/
    └── unified-toolbar.scss
```

---

## Key Design Decisions

### 1. Heading Styles are Document-Level

When you're in a heading and change its font family, it affects ALL headings of that level in the document. This is intentional and matches user expectations for "heading styles."

If user wants inline variation within a heading, they can:
- Select specific text and apply inline marks (which still work)
- The heading-level style is the "default" for that heading type

### 2. Visual Indicator for Scope

The toolbar should indicate when a style applies to "all H1s" vs "just this selection":

```
┌──────────────────────────────────────────────────┐
│  Font: Merriweather [●]  │  Size: 36 [●]  │ ...  │
└──────────────────────────────────────────────────┘
                        ▲
                        │
                    Blue dot indicates
                    "heading-level style"
```

### 3. Undo/Redo Integration

All style changes must be undoable:
- Inline marks: Already handled by TipTap
- Heading styles: Store state changes wrapped in editor transaction callbacks

```typescript
function updateHeadingStyle(level: HeadingLevel, property: StyleProperty, value: any) {
  // Wrap in a single "transaction" for undo purposes
  const oldStyle = styleStore.getHeadingCustomStyle(level);

  // Apply the change
  styleStore.assignStyleToHeading(level, { ...oldStyle, [property]: value });

  // Register with editor's undo stack
  // (This requires custom extension or appendTransaction)
}
```

### 4. Multiple Control Surfaces

The same unified hooks work everywhere:

```tsx
// In Toolbar
function ToolbarFontFamily({ editor }) {
  const { value, setValue } = useUnifiedFontFamily(editor);
  return <FontFamilyDropdown value={value} onChange={setValue} />;
}

// In Context Menu
function ContextMenuFontFamily({ editor }) {
  const { value, setValue } = useUnifiedFontFamily(editor);
  return <FontFamilySelector value={value} onSelect={setValue} />;
}

// In Keyboard Shortcut Handler
function handleFontShortcut(editor, fontFamily) {
  const ctx = getStyleContext(editor);
  writeStyle(ctx, 'fontFamily', fontFamily);
}
```

---

## Migration Plan

### Phase 1: Foundation (Non-Breaking)
1. Create `src/lib/style-operations/` with types and core functions
2. Create base `useUnifiedStyle` hook
3. Write tests for context detection and routing logic

### Phase 2: Parallel Implementation
1. Create `src/components/unified-toolbar/` alongside existing toolbar
2. Implement controls one by one, starting with simplest (UndoRedo)
3. Each control uses unified hooks internally

### Phase 3: Integration
1. Add toggle in App.tsx to switch between old/new toolbar (for testing)
2. Test all scenarios:
   - Paragraph formatting
   - Heading formatting
   - Mixed selection
   - Undo/redo
   - Document save/load

### Phase 4: Replacement
1. Replace EditorToolbar import with UnifiedToolbar
2. Archive old toolbar components to `_archived/`
3. Remove feature toggle

### Phase 5: Extended Surfaces
1. Integrate unified hooks into existing HeadingContextMenu
2. Add keyboard shortcut handlers using writeStyle()
3. Prepare for future slash command integration

---

## File Inventory: What Gets Replaced

### Replaced (moved to _archived/)
- `src/components/Editor/EditorToolbar.tsx`
- `src/components/tiptap-ui-custom/font-family-dropdown/`
- `src/components/tiptap-ui-custom/font-size-dropdown/`
- `src/components/tiptap-ui-custom/font-weight-dropdown/`
- `src/components/tiptap-ui-custom/line-height-dropdown/`
- `src/components/tiptap-ui-custom/letter-spacing-dropdown/`
- `src/components/tiptap-ui-custom/paragraph-spacing-dropdown/`

### Kept/Enhanced
- `src/components/tiptap-ui-custom/heading-toggle-buttons/` (enhanced with unified hooks)
- `src/components/tiptap-ui-custom/heading-context-menu/` (enhanced with unified hooks)
- `src/components/tiptap-ui-custom/clear-formatting-buttons/` (enhanced)
- `src/stores/styleStore.ts` (enhanced with granular update methods)

### Kept As-Is (TipTap primitives)
- `src/components/tiptap-ui-primitive/*` (Button, Dropdown, Popover, etc.)
- `src/components/tiptap-ui/undo-redo-button/` (simple, no style logic)
- `src/components/tiptap-ui/link-popover/` (not style-related)
- `src/components/tiptap-ui/color-text-popover/` (can be reused with unified hooks)

---

## Success Criteria

1. **Toolbar reflects heading styles** - When cursor is in H1 with custom style, toolbar shows that style
2. **Single mental model** - No "marks vs CSS variables" confusion
3. **All controls work everywhere** - Same behavior in toolbar, context menu, etc.
4. **Undo works** - All style changes are undoable
5. **No regressions** - Paragraph/inline formatting works exactly as before
6. **Performance** - No noticeable lag on selection changes

---

## Future Extensions

### Multi-Document Scope
```typescript
interface StyleContext {
  // ...existing fields...
  documentId?: string;
  projectId?: string;
}

// Project-level heading styles
styleStore.setProjectHeadingStyle(projectId, level, style);
```

### Style Templates
```typescript
interface StyleTemplate {
  id: string;
  name: string;
  headingStyles: Record<HeadingLevel, HeadingCustomStyle>;
  paragraphDefaults: ParagraphStyle;
}

styleStore.applyTemplate(templateId);
```

### Slash Commands
```typescript
// /font Merriweather
// /size 18
// /color #ff0000
registerSlashCommand('font', (editor, args) => {
  const ctx = getStyleContext(editor);
  writeStyle(ctx, 'fontFamily', args[0]);
});
```

---

## Appendix: Current Toolbar Inventory

### Row 1: Primary Controls
| Component | Current Source | Unified Hook |
|-----------|---------------|--------------|
| UndoRedoButton | TipTap native | Keep as-is |
| FontFamilyDropdown | Custom + editor marks | useUnifiedFontFamily |
| FontSizeDropdown | Custom + editor marks | useUnifiedFontSize |
| FontWeightDropdown | Custom + editor marks | useUnifiedFontWeight |
| MarkButton (bold) | TipTap useMark | useUnifiedMark |
| MarkButton (italic) | TipTap useMark | useUnifiedMark |
| MarkButton (underline) | TipTap useMark | useUnifiedMark |
| MarkButton (strike) | TipTap useMark | useUnifiedMark |
| MarkButton (code) | TipTap useMark | useUnifiedMark |
| ColorTextPopover | TipTap native | useUnifiedColor |
| LinkPopover | TipTap native | Keep as-is (not style) |
| ClearFormattingButton | Custom | useUnifiedClear |
| ClearSpacingButton | Custom | useUnifiedClear |

### Row 2: Block Controls
| Component | Current Source | Unified Hook |
|-----------|---------------|--------------|
| HeadingToggleButtons | Custom | Keep, enhance context menu |
| ListDropdownMenu | TipTap native | Keep as-is (block type) |
| BlockquoteButton | TipTap native | Keep as-is (block type) |
| TextAlignButton x4 | TipTap native | useUnifiedTextAlign |
| LineHeightDropdown | Custom + editor marks | useUnifiedLineHeight |
| LetterSpacingDropdown | Custom + editor marks | useUnifiedLetterSpacing |
| SpacingBeforeDropdown | Custom + styleStore | useUnifiedSpacing |
| SpacingAfterDropdown | Custom + styleStore | useUnifiedSpacing |

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
