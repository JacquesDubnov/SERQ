# SERQ Project Instructions

---

## ⚠️ CONTEXT WINDOW MANAGEMENT - TOP PRIORITY

**This is the #1 rule across ALL coding projects. Non-negotiable.**

### Monitoring Protocol

Every ~5 minutes of active work, check context usage. When reaching or passing **60% context window usage**:

1. **STOP current work immediately**
2. **Create/update the handover file** at `.claude/SESSION-HANDOVER.md`
3. **Inform Jacques** that context is getting full and a fresh session is needed
4. **Do NOT rely on compaction** - compaction causes context rot and degraded output quality

### Handover File Requirements

The handover file MUST include:

1. **Project Overview** - What are we developing?
2. **Phase Structure** - All phases, stages, tasks
3. **Completion Status** - What's done, what remains
4. **Current Position** - Exact feature/task/phase we were working on
5. **Bugs & Challenges** - What we encountered
6. **What Worked** - Successful approaches
7. **What Didn't Work** - Failed approaches and WHY
8. **Next Steps** - Exactly what we planned to do next

### Fresh Context Rule

**Always start complex tasks with a fresh context window.** Context rot is real and destroys output quality. Better to reset early than produce degraded work.

---

## CRITICAL: TipTap Teams License - PAID

**Jacques has a TipTap Teams subscription ($149/month).**

### What You Have Access To

- **Full Pro Components**: DragContextMenu, SlashDropdownMenu, TableNode, all UI primitives
- **NPM Registry Access**: Already configured in `.npmrc`
- **TipTap CLI**: Can install components directly
- **Documentation Index**: https://template.tiptap.dev/

### TipTap CLI Usage

```bash
# Install a TipTap UI component
npx @tiptap/cli add <component-name>

# Example: Install slash command menu
npx @tiptap/cli add slash-command
```

### The Mandate

**MAXIMIZE native TipTap tools and components.**

Only build custom solutions when:
1. TipTap doesn't offer the functionality
2. The native component is fundamentally broken for our use case
3. Jacques explicitly approves custom development

**Default behavior: Search TipTap docs/templates FIRST before writing custom code.**

---

## CRITICAL: No Emojis for Icons

**Never use emojis as UI icons.** Use proper SVG icons or text symbols instead.

- Theme toggles: SVG sun/moon icons
- Buttons: Lucide, Heroicons, or TipTap icons
- Status indicators: Clean geometric shapes
- Any UI element: Professional icon libraries only

Emojis render inconsistently and look amateur. This applies to all UI components.

---

## CRITICAL: This is a Tauri Desktop App

**NEVER run `npm run dev` alone.** This is NOT a browser app.

**Always use:**
```bash
npm run tauri dev
```

This starts both the Vite frontend AND the Tauri Rust backend, launching the actual desktop application.

Testing in browser is useless - the app depends on Tauri APIs for:
- File system access
- Native dialogs
- Window management
- System theme detection

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Editor:** TipTap (ProseMirror)
- **Desktop:** Tauri 2.x (Rust backend)
- **State:** Zustand
- **Styling:** CSS (no Tailwind for editor, Tailwind for UI chrome)

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run tauri dev` | Start desktop app in dev mode |
| `npm run build` | Build frontend only (for type checking) |
| `npm run tauri build` | Build production desktop app |

## Project Structure

```
src/
├── components/
│   ├── Editor/           # EditorCore and related
│   └── tiptap-node/      # TipTap native UI components
├── extensions/           # TipTap extensions (mostly archived in Phase 0)
├── stores/               # Zustand stores
├── styles/               # CSS files
├── _archived/            # Custom code archived during rebuild
└── App.tsx               # Main app shell

src-tauri/                # Rust backend (Tauri)
.claude/                  # Claude session management
  └── SESSION-HANDOVER.md # Current session state
.planning/                # Project planning docs
```

## Key Reference Files

- **Rebuild Plan**: `.planning/TIPTAP-NATIVE-REBUILD-PLAN.md`
- **Session Handover**: `.claude/SESSION-HANDOVER.md`
- **PRD Foundation**: In Obsidian vault at `PROJECTS/SERQ/SERQ - PRD Foundation.xml`

---

*Last updated: 2026-02-02*
