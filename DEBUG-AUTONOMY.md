# AUTONOMOUS DEBUGGING — MANDATORY PROTOCOL

You have a fully installed debug bridge in this project. You can debug the SERQ app WITHOUT asking the user anything. Read this entire file before doing any debugging work.

---

## THE RULE

**NEVER ask the user to:**
- Open the console
- Check the browser/webview inspector
- Copy-paste an error message
- "Tell me what you see"
- "Click X and let me know what happens"
- Look at any developer tools

**You have direct access to all console output, errors, and screenshots. Use them.**

If you catch yourself about to type "could you check..." or "what do you see when..." — STOP. Read the log file instead.

---

## HOW IT WORKS

Every `console.log`, `console.error`, `console.warn`, uncaught exception, and unhandled promise rejection from the SERQ webview is automatically written to:

```
~/.serq-debug.log
```

This file is on the user's filesystem. You can read it directly with `cat`, `tail`, or `grep`. No browser, no inspector, no user involvement.

---

## YOUR DEBUG WORKFLOW

### After making any frontend change:

```bash
# 1. Clear the log
> ~/.serq-debug.log

# 2. Wait for the app to hot-reload (Vite HMR)
sleep 3

# 3. Read what happened
cat ~/.serq-debug.log
```

### When hunting a specific bug:

```bash
# See only errors
grep -i "ERROR\|UNCAUGHT\|UNHANDLED" ~/.serq-debug.log

# Last 50 lines
tail -50 ~/.serq-debug.log

# Live watch (run in background while you test)
tail -f ~/.serq-debug.log
```

### When you need to see the UI:

```bash
# Capture a screenshot of the SERQ window
./scripts/screenshot.sh

# The image is saved to ~/.serq-screenshot.png
# You can read/analyze it directly
```

### Helper script (same thing, friendlier):

```bash
./scripts/read-log.sh          # Last 50 lines
./scripts/read-log.sh 100      # Last 100 lines
./scripts/read-log.sh errors   # Errors only
./scripts/read-log.sh clear    # Clear log
./scripts/read-log.sh watch    # Live tail
```

---

## LOG FORMAT

```
[2026-02-03T10:15:30.123Z] LOG: User clicked save button
[2026-02-03T10:15:30.456Z] ERROR: [UNCAUGHT] Cannot read property 'foo' of undefined
  at src/components/Editor.tsx:142:12
  TypeError: Cannot read property 'foo' of undefined
    at Editor.handleSave (Editor.tsx:142)
```

---

## WHAT IS CAPTURED

- All `console.log()`, `console.info()`, `console.warn()`, `console.error()`, `console.debug()`, `console.trace()` calls
- All uncaught JavaScript errors with file, line, column, and stack trace
- All unhandled promise rejections with reason and stack trace
- DOM snapshots when you call `window.__serqDumpDOM()` from the frontend code

## WHAT IS NOT CAPTURED

- Network requests (add logging in Rust-side HTTP handlers if needed)
- CSS computed styles (use screenshots)
- User interactions (add temporary `console.log()` calls to event handlers, rebuild, read the log)

---

## TESTING CLICK HANDLERS AND USER INTERACTIONS

When you need to know if a button click or user action works:

1. Add a `console.log('DEBUG: button X clicked', relevantData)` to the handler
2. Save the file (Vite will hot-reload)
3. Ask the user to click the thing (this is the ONE acceptable ask)
4. Read `~/.serq-debug.log` for the output
5. Remove the temporary log when done

This is the only scenario where you ask the user to do something physical — and even then, you read the result yourself.

---

## ARCHITECTURE REFERENCE

- **Frontend interceptor:** `src/lib/debug-bridge/console-interceptor.ts`
- **DOM snapshot tool:** `src/lib/debug-bridge/dom-snapshot.ts`
- **Rust log writer:** `src-tauri/src/commands/debug_bridge.rs`
- **Log file:** `~/.serq-debug.log` (auto-rotates at 5MB, keeps last 1MB)
- **Screenshot script:** `scripts/screenshot.sh` → `~/.serq-screenshot.png`
- **Log reader script:** `scripts/read-log.sh`
- **Disabled in production** (`import.meta.env.PROD` check)

---

## REMINDER

The user is not a programmer. Do not send him on debugging errands. That is your job. You have the tools. Use them.
