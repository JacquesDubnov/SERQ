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

**After every code change, restart the app so Jacques can test.** Don't wait for him to ask. Kill existing processes and relaunch:
```bash
pkill -f "tauri" 2>/dev/null; pkill -f "cargo" 2>/dev/null; sleep 1 && npm run tauri dev 2>&1 &
```

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

## Debug Bridge (Autonomous Debugging)

SERQ has a built-in debug bridge that pipes ALL webview console output and errors to `~/.serq-debug.log`. This means you do NOT need to ask the user to open Safari Inspector, check the console, or copy-paste errors. You can read the logs yourself.

### Reading Logs

```bash
# Last 50 lines (default)
./scripts/read-log.sh

# Last N lines
./scripts/read-log.sh 100

# Errors only
./scripts/read-log.sh errors

# Clear log before a test
./scripts/read-log.sh clear

# Or read directly
cat ~/.serq-debug.log
tail -n 50 ~/.serq-debug.log
```

### Taking Screenshots

```bash
# Capture SERQ window to default location
./scripts/screenshot.sh

# View it
open ~/.serq-screenshot.png
```

### What Gets Logged

- All `console.log/info/warn/error/debug/trace` calls
- Uncaught exceptions with stack traces and source locations
- Unhandled promise rejections
- DOM snapshots when triggered via `window.__serqDumpDOM()`

### Debug Workflow

Instead of asking the user to check things:
1. Clear the log: `./scripts/read-log.sh clear`
2. Tell the user to reproduce the issue (or trigger it if you can)
3. Read the log: `cat ~/.serq-debug.log`
4. If visual inspection needed: `./scripts/screenshot.sh` then analyze the image

### Architecture

- Frontend: `src/lib/debug-bridge/` - console interceptor + DOM snapshot
- Backend: `src-tauri/src/commands/debug_bridge.rs` - writes to `~/.serq-debug.log`
- Scripts: `scripts/screenshot.sh`, `scripts/read-log.sh`
- Auto-rotates at 5MB (keeps last 1MB)
- Disabled in production builds (`import.meta.env.PROD`)

---

## ⚠️ CRITICAL: No Hardcoded Lists - Everything is Dynamic

**NEVER hardcode lists of options in components.** This is a fundamental architectural principle.

### The Rule

All configurable options MUST come from a central store (`styleStore.ts`), NOT be defined as constants in components:

- **Font families** - User-configurable, stored in styleStore
- **Font weights** - User-configurable, stored in styleStore
- **Color palettes** - User-configurable, stored in styleStore
- **Default values** - Configurable per block type, stored in styleStore
- **Any dropdown options** - Dynamic, from store

### Why This Matters

Users will:
- Add custom fonts
- Remove fonts they don't use
- Reorder options by preference
- Create custom color palettes
- Modify default styles

If options are hardcoded in components, these customizations are impossible.

### Implementation Pattern

```tsx
// ❌ WRONG - Hardcoded in component
const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
];

// ✅ RIGHT - Read from store
const { availableFonts } = useStyleStore();
```

### Files That Need This Pattern

All dropdown/selector components must read options from styleStore:
- Font family selectors
- Font weight selectors
- Color pickers
- Line height options
- Letter spacing presets
- Any configurable list

---

## ⚠️ Claude Code Version Pinning (Mac CPU Bug)

**Claude Code is currently pinned to v2.1.25.** Auto-updates are disabled.

### The Problem

Claude Code versions 2.1.26+ (including 2.1.32) cause a known bug on macOS where the CLI process spikes to 99-100% CPU and freezes the system. This is tracked across multiple GitHub issues (anthropics/claude-code #5771, #22041, #11122, #22275, #18532, #22968). As of February 2026, this is NOT resolved.

### Current Setup

- **Installed version:** 2.1.25 (native install at `~/.local/bin/claude`)
- **Auto-updates disabled:** `autoUpdates: false` in settings + `DISABLE_AUTOUPDATER=1` in `~/.zshrc`
- **Model:** Opus 4.6 via `--model claude-opus-4-6` or `ANTHROPIC_MODEL=claude-opus-4-6` (the `/model` menu in 2.1.25 only shows 4.5 labels, but the model string works server-side)
- **Old npm-global installation removed** (was at `/usr/local/bin/claude`, caused permission conflicts)

### When to Update

**DO NOT update Claude Code until the macOS CPU bug is confirmed fixed.** Monitor these sources:
- https://github.com/anthropics/claude-code/issues/22275
- https://github.com/anthropics/claude-code/issues/22968
- Claude Code changelog

When the fix is confirmed, re-enable updates:
```bash
claude config set --global autoUpdates true
# Remove DISABLE_AUTOUPDATER=1 from ~/.zshrc
```

### If CPU Spike Happens Again

1. `pkill -f claude` or `kill -9 <PID>` (check Activity Monitor)
2. Clear session cache: `rm -rf ~/.claude/projects/*/`
3. Clear conversations: `rm -rf ~/.claude/conversations/`
4. Restart: `claude`

---

## Jacques's Project Portfolio

Context for all Claude sessions - these are the projects Jacques is actively working on. Understanding the full portfolio helps with cross-project decisions, time management awareness, and avoiding conflicts.

### Active Development

| Project | Description | Team | ETA |
|---------|-------------|------|-----|
| **SERQ** | Next-gen writing/document desktop app (this project) | Jacques + Claude Code | Commercial launch June 2026 |
| **OBLIQ** | Full-stack product | Full dev team + Jacques + Claude Code | Commercial V1.0 June 2026 |
| **BERLIN** | Full-stack product | Full dev team + Jacques + Claude Code | Commercial V1.0 June 2026 |
| **ALIN** | Tasha's project | Jacques + Claude Code | Commercial BETA April 2026, full deployment May 2026 |
| **ALIN Book** | Tasha's book on HRT (English, Russian, Hebrew) | Jacques + Claude Code | Publishing April 2026 |

### Parked (Awaiting Financing)

| Project | Description | Current Status |
|---------|-------------|----------------|
| **Talk2Mi** | Product in demo phase | Jacques developing demo with Claude only |
| **CAIZER** | Product in demo phase | Jacques developing demo with Claude only |
| **LiquidFlow** | UI/UX system primarily associated with CAIZER | Jacques developing demo with Claude only |

### Key Notes

- Jacques is the common thread across ALL projects, so his time is the bottleneck
- June 2026 is a critical month with three commercial launches (SERQ, OBLIQ, BERLIN)
- April-May 2026 is critical for ALIN and the ALIN Book
- Claude Code is Jacques's primary development partner on SERQ, ALIN, and ALIN Book
- The parked projects are demo-only until financing is secured

---

*Last updated: 2026-02-06*
