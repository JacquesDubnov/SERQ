# SERQ Session Handover

**Date:** 2026-02-04
**Branch:** `feature/unified-style-system`
**Last Commit:** `d4b9f23` - feat: architecture v4.0 and block selection infrastructure

---

## Project Overview

SERQ is "The Last Editor You'll Ever Need" - a Tauri-based desktop rich text editor:
- **Frontend:** React + TypeScript + TipTap (ProseMirror)
- **Desktop:** Tauri 2.x (Rust backend)
- **State:** Zustand
- **License:** TipTap Teams ($149/mo) - use native components first

---

## Architecture v4.0 (CRITICAL)

**Master Reference:** `.claude/STYLING-HIERARCHY-ARCHITECTURE.md`

### 5-Level Style Cascade
```
PROJECT (root defaults)
  └── DOCUMENT (per-doc overrides)
       └── PAGE (section styles)
            └── BLOCK (paragraph/heading level)
                 └── CHARACTER (inline marks)
```

### Data Layer
- **SQLite** with `tauri-plugin-sql` for native performance
- **Flat block storage** with ID references (not nested trees)
- **Fractional indexing** for ordering
- **Event sourcing** for version control (snapshots + operations)

### Export Formats
PDF, Word, Apple Pages, Google Docs, Markdown, RTF, TXT, HTML, EPUB, .shtml (our schema-based HTML)

### AI Integration
- Agent Supervisor orchestrating specialized agents
- Voice pipeline: VAD → Transcription → Intent Router
- Research Agent, Data Validation Agent, Literary Agent
- All through hooks/APIs (infrastructure only - not implementing yet)

---

## What's Complete

### Architecture Documentation
- Comprehensive v4.0 architecture document
- SQLite schema design
- Platform deployment considerations
- Schema versioning with Migration Registry

### Block Indicator System
- Hover tracking with animated vertical line
- Frame mode (Command held) shows border
- Hide on typing, reappear on mouse move
- Toggle enable/disable button in toolbar

### Block Drag-and-Drop
- Long-press (400ms) activates drag
- Source text fades via overlay
- Two-stage drop animation

### Multi-Block Selection (Partial)
- Code exists but needs plan implementation
- Plan at `~/.claude/plans/adaptive-giggling-whisper.md`

---

## What Remains

### Immediate: Block Selection Plan
From `adaptive-giggling-whisper.md`:
1. Replace Shift with Command for frame mode (may be done)
2. Add selection state tracking
3. Command+click toggle selection
4. Command+Shift+click range selection
5. Click without modifiers = deselect all
6. Render multiple selection indicators
7. Handle position updates on doc change

### Phase 2: Infrastructure
- SQLite database setup
- Style stores (project, document, page, block, character)
- Style resolution with caching
- Command Registry pattern

### Phase 3+: Features (Infrastructure Only)
- Block styling toolbar
- Export/Import system hooks
- AI integration hooks
- Voice pipeline hooks

---

## Key Files

| File | Purpose |
|------|---------|
| `.claude/STYLING-HIERARCHY-ARCHITECTURE.md` | Master architecture v4.0 |
| `src/extensions/block-indicator.ts` | Block hover/selection extension |
| `src/components/BlockIndicator/` | Visual indicator components |
| `src/components/unified-toolbar/` | Main toolbar |
| `src/hooks/use-block-selection.ts` | React hook for selection |
| `~/.claude/plans/adaptive-giggling-whisper.md` | Block selection plan |

---

## Commands

```bash
npm run tauri dev          # ALWAYS use this - desktop app
npm run build              # TypeScript check
./scripts/read-log.sh      # Read debug log
./scripts/screenshot.sh    # Capture window
```

---

## Notes

- **API was unstable** - Work in small atomic commits
- **No emojis** - SVG icons only
- **Debug bridge** - Console → `~/.serq-debug.log`
- **TipTap first** - Check docs before custom code

---

*Updated: 2026-02-04*
