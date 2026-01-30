# SERQ Design Reference

## Design Inspiration

SERQ's interface takes inspiration from two gold-standard minimalist writing apps:
- **iA Writer** by Information Architects AG
- **Minimal | Writing + Notes** by Timeless LLC

---

## iA Writer Design Principles

### Core Philosophy: "Radical Simplicity"
The main feature of iA Writer is *not having many features*. Every element must justify its existence.

### Typography as UI
- 95% of content is written language - text IS the interface
- Three custom typefaces: Mono, Duo, and Quattro (elegant monospaced fonts)
- Typography is not decoration - it's the primary UX consideration
- Correct leading, word/letter spacing, active whitespace management

### Interface Patterns
| Element | Approach |
|---------|----------|
| Focus Mode | Highlight current sentence/paragraph, fade surroundings |
| Chrome | Remove buttons, popups, title bars during writing |
| Syntax Highlighting | Color parts of speech (adjectives, nouns, verbs) |
| Style Check | Flag clichés, fillers, redundancy (on-device, privacy-first) |
| Dark Mode | Full support, optimized for extended writing |

### Key Principles
1. **Write first, style later** - Plain text editing separated from preview
2. **Markdown-native** - Portable, universal formatting
3. **No decorative elements** - Every pixel serves function
4. **Typewriter experience** - Centered on active writing position

---

## Minimal App Design Principles

### Core Philosophy: "Meditation-Inspired"
Designed to foster focus, open-mindedness, and non-attachment. Features stay out of the way until needed.

### Visual Language
- Draws from meditation, architecture, and nature
- Extensive use of whitespace to reduce cognitive load
- One element in focus at a time
- "Love the beauty of a blank page"

### Typography & Formatting
- Markdown-style formatting during composition
- Simple, elegant typography for high readability
- Clear visual hierarchy through headers
- Support for: headers, lists, bold, italic, underline, blockquotes, pull quotes

### Interface Patterns
| Element | Approach |
|---------|----------|
| Note Lifetime | Auto-archive inactive notes (flagship feature) |
| Customization | Fonts, themes, accent colors, formatting keyboard |
| Publishing | 3-tap publish to beautifully-formatted websites |
| Collaboration | Real-time editing without conflict |
| Whitespace | Generous - "abundant empty space allows creative expression" |

### Key Principles
1. **Simple is powerful** - Subtractive design
2. **One thing in focus** - Single-element attention
3. **Everything customizable** - But defaults are perfect
4. **No cognitive load** - Interface disappears during writing

---

## SERQ Design Guidelines (Derived)

### Typography
- [ ] Custom monospace font (Phase 3 - Style System)
- [ ] Generous line-height (1.6-1.8)
- [ ] Optimal character width (65-75 chars per line)
- [ ] Clear heading hierarchy (distinct size jumps)

### Interface
- [ ] **Focus Mode** - Highlight current block, fade rest (Phase 5)
- [ ] **Minimal chrome** - Hide toolbar during typing (Phase 5)
- [ ] **Generous whitespace** - Canvas padding, breathing room
- [ ] **Single focus** - One panel, one document at a time

### Interactions
- [ ] Markdown shortcuts for inline formatting
- [ ] Click-anywhere cursor placement (Phase 1)
- [ ] Typewriter scrolling option (keep cursor centered)
- [ ] Keyboard-first navigation

### Color Philosophy
- Restrained palette - content is king
- High contrast text for readability
- Subtle accent colors (customizable)
- Dark mode as first-class citizen

### Anti-Patterns (What NOT to do)
- Cluttered toolbars with rarely-used buttons
- Aggressive styling that distracts from content
- Feature bloat - every addition must justify itself
- Decoration without function

---

## Sources

- [iA Writer](https://ia.net/writer)
- [iA Typography Philosophy](https://ia.net/topics/the-web-is-all-about-typography-period)
- [Minimal App](https://minimal.app/)
- [Minimal Design Blog](https://blog.minimal.app/about/)

---
*Created: 2026-01-30*
*Status: Reference document for Phase 3 (Style System) and Phase 5 (Polish)*
