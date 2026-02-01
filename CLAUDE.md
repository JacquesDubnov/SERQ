# SERQ Project Instructions

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
- **Styling:** CSS (no Tailwind)

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run tauri dev` | Start desktop app in dev mode |
| `npm run build` | Build frontend only (for type checking) |
| `npm run tauri build` | Build production desktop app |

## Project Structure

- `src/` - React frontend
- `src-tauri/` - Rust backend (Tauri)
- `src/extensions/` - TipTap extensions
- `src/components/` - React components
- `src/stores/` - Zustand stores
- `src/styles/` - CSS files

---

*Last updated: 2026-02-01*
