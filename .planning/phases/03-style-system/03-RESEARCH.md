# Phase 3: Style System - Research

**Researched:** 2026-01-30
**Domain:** CSS Custom Properties Theming + TipTap Styling + macOS Theme Detection
**Confidence:** HIGH

## Summary

This phase implements a document styling system using CSS custom properties (CSS variables) as the foundation. The existing codebase already uses CSS variables for canvas widths (Phase 1), establishing the pattern. The approach: define all typography, color, and canvas properties as CSS variables in `:root`, then swap entire preset sets by updating these variables at runtime.

The format painter feature will leverage TipTap's existing mark/attribute system. TipTap provides `isActive()` and `getAttributes()` for detecting formatting, plus `setMark()` and `toggleMark()` commands for applying it. ProseMirror's `storedMarks` mechanism handles cursor-position formatting state.

For dark/light mode, Tauri 2.0's `getCurrentWindow().theme()` and `onThemeChanged()` APIs provide macOS system theme detection with real-time change notifications. Each color scheme will have both light and dark variants, with CSS selectors toggling between them.

**Primary recommendation:** Build everything on CSS custom properties. Presets are JSON objects that map to CSS variable values. Store current style in document metadata (already structured in SerqMetadata). Use Tauri's window API for system theme, not CSS media queries (enables override capability).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Custom Properties | Native | All styling tokens | Zero-dependency, instant updates, already in use |
| TipTap TextStyle | 3.18.0 | Inline mark foundation | Required for font family, size, color marks |
| Tauri Window API | 2.x | System theme detection | Native API, event-driven, override-capable |
| Zustand | 5.0.10 | Style state management | Already in project, simple API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tauri-apps/plugin-store | 2.4.2 | Persist user defaults | Already used for preferences |
| react-hotkeys-hook | 5.2.3 | Style panel + painter shortcuts | Already in project |
| TipTap FontFamily | 3.18.0 | Font family mark | If typography presets include font changes |
| TipTap Color | 3.18.0 | Text color mark | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS variables | CSS-in-JS (styled-components) | CSS variables are faster, already established in codebase |
| Zustand | React Context | Zustand already in place, simpler API for cross-component state |
| Custom theme detection | CSS prefers-color-scheme | Media query cannot be overridden by user preference |

**Installation:**
```bash
# Already installed, no new packages needed
# If font family support required later:
npm install @tiptap/extension-font-family
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── styles/
│   ├── editor.css           # Existing editor styles
│   ├── presets/
│   │   ├── typography.css   # CSS variable definitions for 23 presets
│   │   ├── colors.css       # CSS variable definitions for 25 schemes (light+dark)
│   │   └── canvas.css       # Canvas background options
│   └── themes.css           # Base :root variables + theme switching logic
├── stores/
│   ├── editorStore.ts       # Existing
│   └── styleStore.ts        # NEW: Current style state + format painter state
├── lib/
│   ├── serqFormat.ts        # Existing - modify to include style in metadata
│   ├── presets.ts           # NEW: Preset definitions as TypeScript objects
│   └── themeDetection.ts    # NEW: Tauri theme API wrapper
├── hooks/
│   ├── useSystemTheme.ts    # NEW: Hook for theme detection + override
│   └── useFormatPainter.ts  # NEW: Format painter logic
└── components/
    └── StylePanel/
        ├── StylePanel.tsx       # Main slide-in panel
        ├── PresetSection.tsx    # Accordion section component
        ├── PresetButton.tsx     # Individual preset item
        └── FormatPainter.tsx    # Toolbar button + state
```

### Pattern 1: CSS Variable Preset System
**What:** Define all style tokens as CSS custom properties, swap preset by updating properties
**When to use:** Any time you need instant, reversible style changes
**Example:**
```css
/* Source: established CSS pattern */
:root {
  /* Typography preset variables */
  --font-body: Georgia, serif;
  --font-heading: -apple-system, sans-serif;
  --font-size-base: 16px;
  --line-height-body: 1.6;

  /* Color scheme variables */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #4b5563;
  --color-bg-canvas: #ffffff;
  --color-accent: #2563eb;

  /* Canvas variables */
  --canvas-bg: var(--color-bg-canvas);
  --canvas-bg-image: none;
}

/* Apply preset by updating CSS variables via JavaScript */
/* document.documentElement.style.setProperty('--font-body', 'Inter, sans-serif') */
```

### Pattern 2: Preset Definition Objects
**What:** TypeScript objects defining all variable values for a preset
**When to use:** Maintaining preset data, applying presets programmatically
**Example:**
```typescript
// Source: recommended pattern for this project
interface TypographyPreset {
  id: string
  name: string
  variables: {
    '--font-body': string
    '--font-heading': string
    '--font-size-base': string
    '--line-height-body': string
    // ... all typography variables
  }
}

const PRESETS: TypographyPreset[] = [
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    variables: {
      '--font-body': 'Georgia, "Times New Roman", serif',
      '--font-heading': 'Georgia, serif',
      '--font-size-base': '18px',
      '--line-height-body': '1.75',
    }
  },
  // ... 22 more presets
]

function applyPreset(preset: TypographyPreset) {
  Object.entries(preset.variables).forEach(([prop, value]) => {
    document.documentElement.style.setProperty(prop, value)
  })
}
```

### Pattern 3: Theme Detection Hook
**What:** React hook wrapping Tauri's theme API with override support
**When to use:** Anywhere theme-aware rendering is needed
**Example:**
```typescript
// Source: Tauri 2.0 documentation pattern
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const [userOverride, setUserOverride] = useState<ThemeMode>('system')

  useEffect(() => {
    const window = getCurrentWindow()

    // Get initial theme
    window.theme().then(theme => {
      if (theme) setSystemTheme(theme)
    })

    // Listen for changes
    const unlisten = window.onThemeChanged(({ payload }) => {
      setSystemTheme(payload)
    })

    return () => { unlisten.then(fn => fn()) }
  }, [])

  const effectiveTheme = userOverride === 'system' ? systemTheme : userOverride

  return { effectiveTheme, systemTheme, userOverride, setUserOverride }
}
```

### Pattern 4: Format Painter State Machine
**What:** Toggle/hold mode state management for format painter
**When to use:** Format painter implementation
**Example:**
```typescript
// Source: pattern derived from Word/Google Docs behavior
interface FormatPainterState {
  active: boolean
  mode: 'toggle' | 'hold'
  storedFormat: StoredFormat | null
}

interface StoredFormat {
  marks: Array<{ type: string; attrs: Record<string, unknown> }>
  nodeAttrs: Record<string, unknown> // alignment, etc.
}

// In Zustand store
const useStyleStore = create<StyleStore>((set, get) => ({
  formatPainter: { active: false, mode: 'toggle', storedFormat: null },

  captureFormat: (editor: Editor) => {
    const { from } = editor.state.selection
    const $from = editor.state.doc.resolve(from)

    // Get marks at cursor
    const marks = editor.state.storedMarks || $from.marks()
    const storedFormat = {
      marks: marks.map(m => ({ type: m.type.name, attrs: m.attrs })),
      nodeAttrs: { textAlign: editor.getAttributes('paragraph').textAlign }
    }

    set({ formatPainter: { ...get().formatPainter, storedFormat, active: true } })
  },

  applyFormat: (editor: Editor) => {
    const { storedFormat, mode } = get().formatPainter
    if (!storedFormat) return

    // Apply each stored mark
    storedFormat.marks.forEach(mark => {
      editor.chain().focus().setMark(mark.type, mark.attrs).run()
    })

    // Apply node attributes
    if (storedFormat.nodeAttrs.textAlign) {
      editor.chain().focus().setTextAlign(storedFormat.nodeAttrs.textAlign).run()
    }

    // In toggle mode, stay active; in hold mode, deactivate handled by key release
    if (mode === 'toggle') {
      // Stay active for next click
    }
  },

  deactivate: () => set({ formatPainter: { active: false, mode: 'toggle', storedFormat: null } })
}))
```

### Anti-Patterns to Avoid
- **Inline style attributes on content:** Use CSS variables on container, not inline styles on paragraphs. Inline styles break preset switching and bloat document size.
- **Separate preview pane:** Per context, the document IS the preview. Don't build a separate preview component.
- **CSS-in-JS for presets:** Runtime-generated CSS is slower than CSS variable swapping. Keep presets as plain CSS variable mappings.
- **Global theme state in localStorage:** Per-document styles go in the document file. Only user defaults go in preferences store.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mark detection at cursor | Custom DOM inspection | `editor.state.storedMarks` or `$from.marks()` | ProseMirror handles complex edge cases (empty selection, mark boundaries) |
| Theme change detection | CSS media query polling | Tauri `onThemeChanged()` event | Event-driven, no polling overhead |
| Accordion animation | Manual height calculation | CSS `max-height` transition + `overflow: hidden` | Browser-native, GPU-accelerated |
| Gradient backgrounds | Canvas/WebGL rendering | CSS `linear-gradient`, `radial-gradient` | Native CSS, performant, widely supported |

**Key insight:** This phase is mostly CSS and state management. The heavy lifting (editor, file I/O, theme detection) is already handled by existing libraries. Don't over-engineer.

## Common Pitfalls

### Pitfall 1: CSS Variable Inheritance Conflicts
**What goes wrong:** CSS variables don't cascade as expected when components use Shadow DOM or isolated styling
**Why it happens:** CSS variables are inherited, but scoped styles can break the chain
**How to avoid:** Always define variables on `:root`, apply via `var()` in scoped styles. Never redefine the same variable name at component level.
**Warning signs:** Presets work in some components but not others

### Pitfall 2: Theme Flash on Load
**What goes wrong:** Light theme flashes before dark theme applies on app start
**Why it happens:** Async Tauri API call completes after first render
**How to avoid:**
1. Set initial theme from Tauri config (synchronous)
2. OR use CSS `prefers-color-scheme` as immediate fallback, then override when API resolves
3. Hide content until theme is determined (brief loading state)
**Warning signs:** Brief flash of wrong colors on app launch

### Pitfall 3: Format Painter Mark Leakage
**What goes wrong:** Applied formatting bleeds into adjacent text when typing
**Why it happens:** ProseMirror's mark inheritance model - marks are "sticky" at boundaries
**How to avoid:** After applying format, explicitly clear `storedMarks` to prevent continuation. Use `setMark` with precise range, not `toggleMark`.
**Warning signs:** Typing after format paste continues with pasted formatting

### Pitfall 4: Preset Metadata Not Saving
**What goes wrong:** Document opens without applied style, falls back to default
**Why it happens:** Style state not synced to file metadata before save
**How to avoid:** Style changes must call `markDirty()` AND update metadata in `serqFormat.ts` serialization. Treat style like content.
**Warning signs:** Reopened documents lose their styling

### Pitfall 5: Color Scheme Dark Mode Mismatch
**What goes wrong:** Color scheme's light colors show in dark mode or vice versa
**Why it happens:** Color variables not scoped to theme state
**How to avoid:** Define BOTH light and dark variants for each color scheme. Use CSS selector strategy:
```css
:root { --scheme-bg: #ffffff; --scheme-text: #1a1a1a; }
:root[data-theme="dark"] { --scheme-bg: #1a1a1a; --scheme-text: #f5f5f5; }
```
**Warning signs:** Dark mode toggle doesn't affect all colors

## Code Examples

Verified patterns from official sources and established practices:

### Getting Marks from Selection (for Format Painter)
```typescript
// Source: TipTap + ProseMirror documentation pattern
function captureCurrentFormat(editor: Editor): StoredFormat {
  const { state } = editor
  const { from } = state.selection
  const $from = state.doc.resolve(from)

  // storedMarks takes precedence (set by toggleMark with empty selection)
  // Otherwise, use marks at the cursor position
  const marks = state.storedMarks ?? $from.marks()

  return {
    marks: marks.map(mark => ({
      type: mark.type.name,
      attrs: { ...mark.attrs }
    })),
    // Also capture paragraph-level formatting
    textAlign: editor.getAttributes('paragraph').textAlign || 'left'
  }
}
```

### Applying CSS Variable Preset
```typescript
// Source: native CSS API
function applyTypographyPreset(presetId: string, presets: TypographyPreset[]) {
  const preset = presets.find(p => p.id === presetId)
  if (!preset) return

  const root = document.documentElement

  // Clear any previous inline variables first (optional, for clean state)
  Object.keys(preset.variables).forEach(prop => {
    root.style.removeProperty(prop)
  })

  // Apply new preset
  Object.entries(preset.variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value)
  })
}
```

### Tauri Theme Detection with Override
```typescript
// Source: Tauri 2.0 documentation
import { getCurrentWindow } from '@tauri-apps/api/window'

async function initThemeListener(
  onThemeChange: (theme: 'light' | 'dark') => void
): Promise<() => void> {
  const appWindow = getCurrentWindow()

  // Get initial theme
  const initialTheme = await appWindow.theme()
  if (initialTheme) onThemeChange(initialTheme)

  // Subscribe to changes
  const unlisten = await appWindow.onThemeChanged(({ payload }) => {
    onThemeChange(payload)
  })

  return unlisten
}

// To override (lock to specific theme):
async function setThemeOverride(theme: 'light' | 'dark' | null) {
  const appWindow = getCurrentWindow()
  await appWindow.setTheme(theme) // null = follow system
}
```

### Slide-In Panel Animation
```css
/* Source: standard CSS transition pattern */
.style-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 320px;
  background: var(--panel-bg);
  transform: translateX(100%);
  transition: transform 200ms ease-out;
  z-index: 50;
}

.style-panel.open {
  transform: translateX(0);
}

/* Content area adjusts to make room */
.main-content {
  transition: margin-right 200ms ease-out;
}

.main-content.panel-open {
  margin-right: 320px;
}
```

### Accordion Section Component Pattern
```tsx
// Source: accessibility + CSS transition pattern
interface AccordionSectionProps {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="accordion-section">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="accordion-header"
      >
        {title}
        <span className={`chevron ${isOpen ? 'rotate-180' : ''}`}>^</span>
      </button>
      <div
        className="accordion-content"
        style={{ maxHeight: isOpen ? '1000px' : '0' }}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  )
}
```

```css
.accordion-content {
  overflow: hidden;
  transition: max-height 200ms ease-out;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS class swapping | CSS custom properties | ~2020 | Instant updates, no class list management |
| Theme via JS object | CSS variables + data attributes | ~2021 | SSR-friendly, no FOUC |
| Polling prefers-color-scheme | Tauri theme events | Tauri 2.0 | Event-driven, supports override |
| localStorage for all state | Zustand + persist middleware | Zustand 4+ | Type-safe, middleware composable |

**Deprecated/outdated:**
- `appWindow` import path: Tauri 2.0 uses `getCurrentWindow()` from `@tauri-apps/api/window`, not the old `appWindow` import
- ThemeProvider context pattern: For RSC compatibility and performance, CSS variables are preferred over React context for theming

## Open Questions

Things that couldn't be fully resolved:

1. **Exact list of 23 typography presets**
   - What we know: Phase requires 23 presets, each defines font family, sizes, line heights
   - What's unclear: The specific preset names/definitions (Classic Serif, Modern Sans, etc.)
   - Recommendation: Create a presets definition document during planning. Start with 5-6 core presets, expand to 23.

2. **Color scheme visual parity between light/dark**
   - What we know: Each of 25 schemes has light AND dark variants
   - What's unclear: Whether dark variants should be auto-generated or hand-crafted
   - Recommendation: Hand-craft at least the primary 5-6 schemes. Others can use algorithmic inversion as starting point.

3. **Custom cursor for format painter**
   - What we know: Context requires "custom paintbrush cursor when active"
   - What's unclear: Whether to use CSS `cursor: url()` or a React cursor-follower component
   - Recommendation: Use CSS `cursor: url(paintbrush.svg) 0 16, copy` for simplicity. Falls back gracefully.

4. **Panel width exact value**
   - What we know: Context says "fixed width, pushes content"
   - What's unclear: Exact pixel width
   - Recommendation: 320px is standard sidebar width. Adjust during implementation if needed.

## Sources

### Primary (HIGH confidence)
- [TipTap Editor Docs - Style Editor](https://tiptap.dev/docs/editor/getting-started/style-editor) - CSS styling patterns
- [TipTap Editor Docs - Nodes and Marks Commands](https://tiptap.dev/docs/editor/api/commands/nodes-and-marks) - setMark, toggleMark API
- [TipTap Editor Docs - Editor Class](https://tiptap.dev/docs/editor/api/editor) - isActive, getAttributes methods
- [Tauri 2.0 Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/) - theme(), setTheme(), onThemeChanged()
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - localStorage persistence pattern
- [ProseMirror Guide](https://prosemirror.net/docs/guide/) - Mark schema, storedMarks concept

### Secondary (MEDIUM confidence)
- [TipTap TextStyle Extension](https://tiptap.dev/docs/editor/extensions/marks/text-style) - Inline styling foundation
- [TipTap FontFamily Extension](https://tiptap.dev/docs/editor/extensions/functionality/fontfamily) - Font family marks
- [Tauri Window Customization Guide](https://v2.tauri.app/learn/window-customization/) - Theme configuration
- [Syncfusion Format Painter Docs](https://ej2.syncfusion.com/documentation/rich-text-editor/format-painter) - Format painter UX patterns

### Tertiary (LOW confidence)
- CSS accordion animation patterns from various CodePen examples
- React accordion libraries (react-accordion) for API inspiration
- Medium articles on CSS variables theming (patterns align with official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project or verified via official docs
- Architecture: HIGH - Patterns established in Phase 1/2, extending with same approach
- Pitfalls: MEDIUM - Based on common issues documented in forums, not project-specific testing

**Research date:** 2026-01-30
**Valid until:** 60 days (stable CSS/Tauri/TipTap ecosystem)
