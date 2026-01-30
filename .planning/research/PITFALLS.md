# Domain Pitfalls

**Project:** SERQ Document Editor
**Domain:** Desktop rich text editor (TipTap + Tauri + AI)
**Researched:** 2026-01-30

---

## Critical Pitfalls

Mistakes that cause rewrites, major delays, or make the 2-week timeline impossible.

---

### Pitfall 1: TipTap Memory Leaks with Editor Recreation

**What goes wrong:** Memory grows unbounded when switching documents or recreating editor instances. Each `setContent` call or editor instance creation leaks memory - the garbage collector never reclaims it.

**Why it happens:** TipTap's internal ProseMirror instances don't fully clean up on `editor.destroy()`. Node instances and internal state persist even after destruction.

**Consequences:** App becomes sluggish after opening 5-10 documents. Eventually crashes on memory-constrained machines. Users think your app is "slow."

**Prevention:**
- Create ONE editor instance at app startup, reuse it for all documents
- Use `editor.commands.setContent()` instead of recreating editors
- Never destroy/recreate - mutate content instead
- If you MUST recreate, force garbage collection pause and verify cleanup with DevTools Memory tab

**Detection:** Memory tab in DevTools shows steady growth after document switches. Heap snapshots show orphaned Editor instances.

**Phase:** Address in Phase 1 (Editor Foundation). Get the single-instance pattern right from day one.

**Confidence:** HIGH - [Multiple GitHub issues confirm this](https://github.com/ueberdosis/tiptap/issues/499)

---

### Pitfall 2: TipTap React Re-render Avalanche

**What goes wrong:** Parent components re-render on every keystroke, cursor move, or selection change. UI becomes laggy. State updates cascade through the component tree.

**Why it happens:** Default `useEditor` hook triggers React re-renders on every transaction. This is 60+ times per second during active typing.

**Consequences:** Toolbar flickers. Sidebar updates lag. CPU spikes during typing. The whole app feels unresponsive.

**Prevention:**
```javascript
const editor = useEditor({
  extensions,
  content,
  immediatelyRender: true,
  shouldRerenderOnTransaction: false, // Critical
})
```
- Isolate TipTap in its own component - don't let editor state bubble up
- Use `useEditorState` hook with selectors for reading state without rerenders
- Toolbar should subscribe to specific state (isBold, isItalic) not whole editor

**Detection:** React DevTools Profiler shows editor component re-rendering 60x/second. `console.count('editor render')` in component body.

**Phase:** Address in Phase 1 (Editor Foundation). This is foundational architecture.

**Confidence:** HIGH - [Official TipTap docs and v2.5 release notes](https://tiptap.dev/docs/guides/performance)

---

### Pitfall 3: Schema Validation Silent Failures

**What goes wrong:** Invalid content (from paste, import, or storage) silently corrupts the document. Content disappears. Users lose work with no error message.

**Why it happens:** TipTap doesn't validate content against schema by default. When pasted HTML contains tags not in your schema, they're silently dropped. When stored JSON doesn't match current extensions, it fails silently.

**Consequences:** Users paste from Word, half their content vanishes. Old documents won't open after extension changes. Support nightmare.

**Prevention:**
```javascript
const editor = useEditor({
  extensions,
  content,
  enableContentCheck: true,
  onContentError: ({ error }) => {
    console.error('Content validation failed:', error)
    // Show user-friendly error, offer recovery
  }
})
```
- Enable `enableContentCheck: true` from day one
- Implement `onContentError` handler with user feedback
- Test paste from Word, Google Docs, web pages early
- Version your document format for migration handling

**Detection:** Paste complex content from external sources. If anything disappears, you've hit this.

**Phase:** Address in Phase 1 (Editor Foundation). Non-negotiable for production.

**Confidence:** HIGH - [Official TipTap best practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips)

---

### Pitfall 4: Tauri Permission Scope Hell

**What goes wrong:** File operations fail silently or throw cryptic errors. Users can't open files outside app directories. "Access denied" with no clear cause.

**Why it happens:** Tauri 2.0 has granular permission scopes. By default, you can only access `AppConfig`, `AppData`, `AppLocalData`, `AppCache`, `AppLog`. User's Documents folder? Nope. Desktop? Nope.

**Consequences:** Users can't open their files. Save dialogs fail. The app appears broken even though the code is correct.

**Prevention:**
```json
// src-tauri/capabilities/default.json
{
  "permissions": [
    "fs:default",
    {
      "identifier": "fs:allow-read",
      "allow": [{ "path": "$HOME/**" }]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [{ "path": "$HOME/**" }]
    }
  ]
}
```
- Configure permissions BEFORE writing file code
- Test file operations in RELEASE build (dev mode is more permissive)
- Read the [Tauri FS plugin docs](https://v2.tauri.app/plugin/file-system/) completely
- Remember: deny rules take precedence over allow rules

**Detection:** File operations work in dev, fail in production build.

**Phase:** Address in Phase 1 (File Management). Test early with production builds.

**Confidence:** HIGH - [Official Tauri 2.0 documentation](https://v2.tauri.app/security/permissions/)

---

### Pitfall 5: Large Document Performance Cliff

**What goes wrong:** Editor becomes unusable beyond ~1500 nodes or ~200k words. Each keystroke takes 1+ seconds. Search/replace freezes the UI.

**Why it happens:** ProseMirror recomputes decorations and view updates synchronously. React re-renders compound the problem. DOM manipulation at scale hits browser limits.

**Consequences:** Power users who need the app most are the ones who can't use it. "Works fine in testing" becomes "unusable in production."

**Prevention:**
- Set realistic content limits in scope (SERQ is for "prose documents" not War and Peace)
- Implement virtualization for very long documents (show only visible viewport)
- Debounce expensive operations (search highlighting, word count)
- Use `requestAnimationFrame` for decoration updates
- Profile with 10x expected document size during development

**Detection:** Create a 2000-node document (lorem ipsum generator). Type. If it lags, you've hit this.

**Phase:** Monitor throughout, but critical test in Phase 2 (Features). Don't ship without load testing.

**Confidence:** HIGH - [Multiple TipTap GitHub issues](https://github.com/ueberdosis/tiptap/issues/4491)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or painful refactoring.

---

### Pitfall 6: Extension Priority Conflicts

**What goes wrong:** Keyboard shortcuts fire in wrong order. Custom nodes don't parse correctly. Built-in extensions override your customizations.

**Why it happens:** TipTap processes extensions by priority. Default is 100. Paragraph is 1000. If your custom paragraph-like node has default priority, the built-in Paragraph wins.

**Consequences:** Custom formatting doesn't work. Paste behavior is wrong. Debug sessions hunting for "why isn't my extension running?"

**Prevention:**
```javascript
const CustomBlock = Node.create({
  name: 'customBlock',
  priority: 150, // Higher than default, lower than Paragraph
  parseHTML() {
    return [{
      tag: 'div.custom',
      priority: 150, // Schema-level priority too!
    }]
  }
})
```
- Understand the priority system before writing extensions
- Set explicit priorities on all custom extensions
- Test by pasting HTML that matches your custom rules

**Detection:** Paste HTML that should trigger your custom extension. If it becomes a plain paragraph, priority is wrong.

**Phase:** Address when building custom extensions (Phase 2).

**Confidence:** HIGH - [TipTap GitHub issues on priority](https://github.com/ueberdosis/tiptap/issues/1547)

---

### Pitfall 7: React Context Unavailable in NodeViews

**What goes wrong:** Custom NodeView components can't access app state, theme, or other React Context values. They render incorrectly or crash.

**Why it happens:** ProseMirror renders synchronously. React renders asynchronously. The bridge creates DOM wrapper divs that break the React tree context chain.

**Consequences:** NodeViews can't use your design system. Theme doesn't apply. State management is broken inside custom nodes.

**Prevention:**
- Wrap `EditorContent` with all necessary providers at a high level
- Pass required context values as extension configuration
- Consider vanilla JS NodeViews for complex components (faster anyway)
- Accept the extra wrapper div - you can't eliminate it in React

**Detection:** Console errors about missing context. NodeViews rendering without theme styles.

**Phase:** Address when building custom NodeViews (Phase 2).

**Confidence:** HIGH - [Official TipTap FAQ](https://tiptap.dev/docs/guides/faq)

---

### Pitfall 8: Tauri IPC Serialization Bottleneck

**What goes wrong:** Large file operations are slow. Document saves/loads feel laggy. UI freezes during file operations.

**Why it happens:** Tauri's `invoke` serializes everything to JSON. Large documents serialize slowly. The round-trip blocks the main thread.

**Consequences:** Users wait 2-3 seconds to save a medium document. "Auto-save" becomes "auto-freeze."

**Prevention:**
```rust
// Use Response for large binary data
#[tauri::command]
async fn read_file(path: String) -> Result<tauri::ipc::Response, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(tauri::ipc::Response::new(bytes))
}
```
- Use `tauri::ipc::Response` for large payloads
- Make file commands async: `#[tauri::command(async)]`
- Consider streaming with Tauri channels for progress feedback
- Batch multiple small operations into single IPC calls

**Detection:** Time file operations with large documents. If save > 500ms, investigate.

**Phase:** Address in Phase 1 (File Management).

**Confidence:** HIGH - [Official Tauri IPC docs](https://v2.tauri.app/develop/calling-rust/)

---

### Pitfall 9: Nested HTML Structure Rejection

**What goes wrong:** Content from Word/Google Docs/web pastes incorrectly. Formatting is lost. Nested spans become plain text.

**Why it happens:** TipTap's schema enforces structure. Nested marks of same type are invalid. `<span><span>text</span></span>` violates ProseMirror rules.

**Consequences:** Users paste carefully formatted content, get plain text. "Your editor is broken" bug reports.

**Prevention:**
- Implement robust paste transformation
- Merge conflicting spans: `<span class="x" style="y">` instead of nesting
- Use `transformPastedHTML` to clean input before schema validation
- Test paste from Word, Google Docs, Notion, web pages

**Detection:** Copy formatted text from Word. Paste into editor. Compare what survives.

**Phase:** Address in Phase 2 (Features) when building paste handling.

**Confidence:** HIGH - [Official TipTap FAQ](https://tiptap.dev/docs/guides/faq)

---

### Pitfall 10: Undo/Redo History Corruption

**What goes wrong:** Undo produces unexpected results. Redo doesn't restore correctly. History "skips" steps or produces duplicates.

**Why it happens:** ProseMirror's history tracks inverted steps and position mappings. Custom commands that don't dispatch transactions correctly corrupt the history chain.

**Consequences:** Users lose trust in undo. "It used to be there, I can't get it back." Data loss through history corruption.

**Prevention:**
- Use ProseMirror's built-in history plugin (TipTap's default)
- All content changes must go through transactions
- Never mutate editor state directly
- Avoid custom undo implementations unless you understand the complexity
- Test undo/redo extensively with complex operations

**Detection:** Make 10 edits. Undo 5. Redo 3. Does state match expectations?

**Phase:** Monitor throughout. The default works - don't break it.

**Confidence:** HIGH - [ProseMirror history documentation](https://github.com/ProseMirror/prosemirror-history)

---

## Minor Pitfalls

Annoyances that are fixable but waste time if you don't know about them.

---

### Pitfall 11: Clipboard Newline Formatting

**What goes wrong:** Copying editor content to text fields adds extra blank lines between paragraphs.

**Why it happens:** TipTap's default clipboard serializer uses Markdown-style double newlines between paragraphs.

**Consequences:** Minor UX annoyance. Users need to clean up copied text.

**Prevention:**
```javascript
const editor = useEditor({
  extensions,
  editorProps: {
    clipboardTextSerializer: (slice) => {
      return slice.content.textBetween(0, slice.content.size, '\n')
    }
  }
})
```

**Phase:** Address in Phase 2 if users complain.

**Confidence:** HIGH - [Official TipTap FAQ](https://tiptap.dev/docs/guides/faq)

---

### Pitfall 12: Drag-and-Drop Library Conflicts

**What goes wrong:** Drag and drop stops working in the editor when using react-dnd or react-beautiful-dnd elsewhere in the app.

**Why it happens:** These libraries register global event listeners that intercept drag events before TipTap can handle them.

**Consequences:** Node dragging, image dragging broken.

**Prevention:**
- Isolate DnD libraries from editor DOM subtree
- Use DnD library's exclusion zones if available
- Consider TipTap's built-in drag handle instead of external DnD

**Phase:** Address if implementing drag features.

**Confidence:** HIGH - [Official TipTap FAQ](https://tiptap.dev/docs/guides/faq)

---

### Pitfall 13: SSR/Hydration Mismatches

**What goes wrong:** Console errors about hydration mismatches. Editor content flickers on load. "Text content does not match server-rendered HTML."

**Why it happens:** TipTap requires browser APIs. Server-side rendering produces different output than client.

**Consequences:** Console spam. Potential visual glitches.

**Prevention:**
```javascript
const editor = useEditor({
  extensions,
  content,
  immediatelyRender: false, // Critical for SSR
})
```
- Always set `immediatelyRender: false` if using any SSR (Next.js, Remix)
- For SERQ (Tauri desktop), this is less relevant but good to know

**Phase:** Only relevant if adding web version later.

**Confidence:** HIGH - [Official TipTap best practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips)

---

### Pitfall 14: Tauri Dev/Prod Behavior Differences

**What goes wrong:** Works perfectly in dev, fails in production. File paths wrong. Permissions denied. Assets missing.

**Why it happens:** Dev mode is more permissive. Production builds use different asset bundling. Platform-specific behaviors emerge.

**Consequences:** "It works on my machine" disasters at release time.

**Prevention:**
- Test production builds weekly during development
- Run `cargo tauri build` and test the actual app, not just dev server
- Document every "works in dev" assumption and verify in prod

**Detection:** Build for release. Test core flows. Any failure? Investigate now.

**Phase:** Continuous through all phases. Schedule regular release build testing.

**Confidence:** MEDIUM - General development best practice

---

## SERQ-Specific Phase Warnings

Based on the 2-week timeline and project scope:

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Editor Setup | Memory leaks, re-render avalanche | Single editor instance, shouldRerenderOnTransaction: false |
| File System | Permission scope, IPC performance | Configure capabilities first, async commands |
| Style Presets | Extension priority conflicts | Explicit priorities, test parse order |
| AI Integration | Streaming complexity | Use TipTap's streamContent API if possible |
| Time Machine | History corruption, complexity | Don't custom-implement. Use built-in history + snapshot approach |
| Large Docs | Performance cliff | Set scope limits, test with 10x expected size |

---

## Timeline-Specific Guidance

Given the 2-week timeline:

**Week 1 Non-Negotiables:**
1. Single editor instance pattern (Pitfall 1)
2. `shouldRerenderOnTransaction: false` (Pitfall 2)
3. Tauri permissions configured (Pitfall 4)
4. `enableContentCheck: true` (Pitfall 3)
5. Production build test on day 3

**Week 2 Watch Items:**
1. Test paste from external sources (Pitfall 9)
2. Load test with large documents (Pitfall 5)
3. Verify undo/redo after all feature work (Pitfall 10)
4. Final production build test before release

**What to Defer:**
- Custom drag-and-drop (use built-in)
- Complex NodeViews (use simpler marks)
- Virtualization for huge documents (set scope limits instead)

---

## Sources

**TipTap Official:**
- [TipTap FAQ](https://tiptap.dev/docs/guides/faq)
- [TipTap Performance Guide](https://tiptap.dev/docs/guides/performance)
- [TipTap v2.5 Release Notes](https://tiptap.dev/blog/release-notes/say-hello-to-tiptap-2-5-our-most-performant-editor-yet)

**TipTap Community:**
- [Memory Leak Issue #499](https://github.com/ueberdosis/tiptap/issues/499)
- [Memory Leak Issue #538](https://github.com/ueberdosis/tiptap/issues/538)
- [Large Document Performance #4491](https://github.com/ueberdosis/tiptap/issues/4491)
- [Extension Priority #1547](https://github.com/ueberdosis/tiptap/issues/1547)

**Tauri Official:**
- [Tauri Permissions](https://v2.tauri.app/security/permissions/)
- [Tauri File System Plugin](https://v2.tauri.app/plugin/file-system/)
- [Tauri IPC Documentation](https://v2.tauri.app/develop/calling-rust/)

**Best Practices:**
- [Liveblocks TipTap Best Practices](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips)
- [ProseMirror History](https://github.com/ProseMirror/prosemirror-history)

---

**Confidence Assessment:**
- Critical Pitfalls 1-5: HIGH (official docs + community confirmation)
- Moderate Pitfalls 6-10: HIGH (official docs + GitHub issues)
- Minor Pitfalls 11-14: HIGH (official docs)
- Timeline Guidance: MEDIUM (synthesized from research, not project-specific validation)
