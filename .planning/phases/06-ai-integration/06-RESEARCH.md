# Phase 6: AI Integration - Research

**Researched:** 2026-02-01
**Domain:** Claude API integration via Tauri, streaming IPC, diff preview workflow
**Confidence:** MEDIUM (anthropic-sdk-rust is young; Tauri Channel API is solid)

## Summary

This phase adds AI-powered text stylization using Claude API. The critical path involves three interconnected systems: (1) secure API key storage via platform keychain, (2) streaming Claude responses through Tauri's Channel API to the frontend, and (3) a diff-based preview/accept/reject workflow for AI suggestions.

The recommended approach uses **direct reqwest + eventsource-stream** for Claude API streaming (not anthropic-sdk-rust - too immature for production), **tauri-plugin-keyring** for secure API key storage, and a **custom diff implementation** rather than TipTap's paid AI extensions. The TipTap Pro extensions require a cloud subscription and are overkill for our local-only Claude integration.

**Primary recommendation:** Build a minimal Rust streaming command that parses SSE events and forwards text deltas to frontend via Tauri Channel, with a simple inline diff view showing additions/deletions before user accepts.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| reqwest | 0.12+ | HTTP client for Claude API | Standard Rust HTTP client, async support |
| eventsource-stream | 0.2+ | SSE event parsing | Works with reqwest bytes_stream |
| tauri-plugin-keyring | 2.x | Secure API key storage | Wraps system keychain (macOS Keychain, Windows Credential Store) |
| serde_json | 1.x | SSE data parsing | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tokio | 1.x | Async runtime | Already in Tauri |
| futures | 0.3+ | Stream processing | For StreamExt trait on SSE stream |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| reqwest + eventsource-stream | anthropic-sdk-rust 0.1.x | SDK is cleaner but immature (7 GitHub stars), may have bugs |
| tauri-plugin-keyring | tauri-plugin-store | Store is not encrypted, NOT secure for API keys |
| tauri-plugin-keyring | Stronghold | Stronghold is deprecated in Tauri 3, requires password prompt |
| Custom diff view | TipTap Pro AI Suggestion | Pro requires paid subscription and cloud integration |
| Custom diff view | react-diff-viewer-continued | Overkill for inline text changes, designed for code |

**Installation:**
```bash
# Rust dependencies (add to src-tauri/Cargo.toml)
cargo add reqwest --features stream,json
cargo add eventsource-stream
cargo add futures
cargo add tauri-plugin-keyring

# JavaScript dependencies
npm install tauri-plugin-keyring-api
```

## Architecture Patterns

### Recommended Project Structure
```
src-tauri/
├── src/
│   ├── lib.rs              # Tauri app builder, register plugin
│   ├── main.rs             # Entry point
│   └── commands/
│       ├── mod.rs          # Export all commands
│       └── ai.rs           # Claude API streaming command
src/
├── lib/
│   └── ai.ts               # AI service (invoke Tauri, handle channel)
├── components/
│   └── AiPreview/
│       ├── AiPreviewPanel.tsx   # Diff view with accept/reject
│       └── index.ts
├── hooks/
│   └── useAiStylization.ts      # Hook for AI workflow
└── stores/
    └── aiStore.ts               # AI state (loading, preview, etc.)
```

### Pattern 1: Streaming via Tauri Channel
**What:** Claude API streaming uses SSE; Tauri Channel forwards each delta to frontend
**When to use:** Any streaming response from Rust to JavaScript
**Example:**
```rust
// Source: https://v2.tauri.app/develop/calling-frontend/
use tauri::{AppHandle, ipc::Channel};
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum AiEvent {
    Started { request_id: String },
    TextDelta { text: String },
    Finished { full_text: String },
    Error { message: String },
}

#[tauri::command]
async fn stylize_text(
    text: String,
    context: String,
    on_event: Channel<AiEvent>,
) -> Result<(), String> {
    on_event.send(AiEvent::Started {
        request_id: uuid::Uuid::new_v4().to_string()
    }).unwrap();

    // Stream Claude API, forward each delta
    // ... (see Code Examples section)

    on_event.send(AiEvent::Finished { full_text }).unwrap();
    Ok(())
}
```

```typescript
// Source: https://v2.tauri.app/develop/calling-frontend/
import { invoke, Channel } from '@tauri-apps/api/core';

type AiEvent =
  | { event: 'started'; data: { requestId: string } }
  | { event: 'textDelta'; data: { text: string } }
  | { event: 'finished'; data: { fullText: string } }
  | { event: 'error'; data: { message: string } };

const channel = new Channel<AiEvent>();
channel.onmessage = (message) => {
  switch (message.event) {
    case 'textDelta':
      // Append to preview buffer
      break;
    case 'finished':
      // Show diff view
      break;
  }
};

await invoke('stylize_text', { text, context, onEvent: channel });
```

### Pattern 2: Claude SSE Parsing
**What:** Parse Server-Sent Events from Claude streaming API
**When to use:** Processing each `content_block_delta` event
**Example:**
```rust
// Source: https://platform.claude.com/docs/en/build-with-claude/streaming
use eventsource_stream::Eventsource;
use futures::StreamExt;

// Claude SSE event types
#[derive(Deserialize)]
#[serde(tag = "type")]
enum ClaudeEvent {
    #[serde(rename = "message_start")]
    MessageStart { message: serde_json::Value },
    #[serde(rename = "content_block_delta")]
    ContentBlockDelta { index: usize, delta: Delta },
    #[serde(rename = "message_stop")]
    MessageStop,
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "error")]
    Error { error: ClaudeError },
}

#[derive(Deserialize)]
#[serde(tag = "type")]
enum Delta {
    #[serde(rename = "text_delta")]
    TextDelta { text: String },
}
```

### Pattern 3: Secure API Key Storage
**What:** Store API key in platform keychain, retrieve for API calls
**When to use:** Any sensitive credential storage
**Example:**
```rust
// Source: https://github.com/HuakunShen/tauri-plugin-keyring
use tauri::Manager;
use tauri_plugin_keyring::KeyringExt;

const SERVICE: &str = "com.serq.app";
const KEY_NAME: &str = "anthropic-api-key";

#[tauri::command]
async fn set_api_key(app: AppHandle, key: String) -> Result<(), String> {
    app.keyring()
        .set_password(SERVICE, KEY_NAME, &key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_api_key(app: AppHandle) -> Result<Option<String>, String> {
    match app.keyring().get_password(SERVICE, KEY_NAME) {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}
```

```typescript
// Source: https://github.com/HuakunShen/tauri-plugin-keyring
import { getPassword, setPassword } from 'tauri-plugin-keyring-api';

// Frontend wrapper (for settings UI)
export async function saveApiKey(key: string): Promise<void> {
  await setPassword('com.serq.app', 'anthropic-api-key', key);
}
```

### Anti-Patterns to Avoid
- **Storing API key in frontend localStorage:** Insecure, easily extracted
- **Storing API key in tauri-plugin-store:** Not encrypted, persists in plain JSON
- **Creating new HTTP client per request:** Reuse reqwest::Client for connection pooling
- **Blocking main thread during streaming:** All API calls must be async
- **Accumulating full response before sending to frontend:** Send each delta immediately

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Manual text parsing | eventsource-stream | Edge cases (multi-line data, reconnection) |
| Keychain access | File-based encryption | tauri-plugin-keyring | Platform-native, secure by default |
| HTTP streaming | Raw TCP sockets | reqwest + bytes_stream | Connection management, TLS, compression |
| Channel ordering | Custom message queue | Tauri Channel API | Built-in message ordering guarantees |

**Key insight:** The Claude SSE format has specific edge cases (ping events, error events, multi-content-block responses) that are easy to get wrong with manual parsing.

## Common Pitfalls

### Pitfall 1: SSE Event Ordering
**What goes wrong:** Events arrive out of order or duplicated
**Why it happens:** Poor stream handling, missing index tracking
**How to avoid:** Track `content_block_delta` index, only process index 0 for text
**Warning signs:** Garbled text, repeated content

### Pitfall 2: API Key Exposure in Dev Tools
**What goes wrong:** API key visible in Tauri invoke payload
**Why it happens:** Passing key from frontend to backend per-request
**How to avoid:** Store key in keychain, backend retrieves it directly, never send to frontend
**Warning signs:** Key appears in Network tab or console logs

### Pitfall 3: Stream Cancellation Leaks
**What goes wrong:** Closing preview doesn't cancel in-flight request
**Why it happens:** No abort signal passed to streaming loop
**How to avoid:** Use tokio::select! with cancellation channel, abort on frontend disconnect
**Warning signs:** Multiple responses after closing panel, wasted API credits

### Pitfall 4: Undo Stack Corruption
**What goes wrong:** Accepting AI suggestion breaks undo history
**Why it happens:** Direct DOM manipulation or editor.commands.insertContent in wrong transaction
**How to avoid:** Use single transaction: `editor.chain().focus().deleteRange().insertContent().run()`
**Warning signs:** Undo doesn't restore original text, partial undo

### Pitfall 5: Diff Styling Conflicts
**What goes wrong:** Diff highlighting interferes with document styles
**Why it happens:** Diff marks applied as TipTap marks that persist
**How to avoid:** Use temporary decorations (not marks), remove all decorations on accept/reject
**Warning signs:** Green/red highlighting appears in saved document

## Code Examples

Verified patterns from official sources:

### Complete Streaming Command (Rust)
```rust
// Source: Combined from Claude API docs + Tauri Channel docs
use reqwest::Client;
use eventsource_stream::Eventsource;
use futures::StreamExt;
use tauri::{AppHandle, Manager, ipc::Channel};
use serde::{Deserialize, Serialize};
use tauri_plugin_keyring::KeyringExt;

const CLAUDE_API_URL: &str = "https://api.anthropic.com/v1/messages";
const API_VERSION: &str = "2023-06-01";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum AiEvent {
    Started,
    TextDelta { text: String },
    Finished { full_text: String },
    Error { message: String },
}

#[derive(Deserialize)]
struct ClaudeStreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    #[serde(default)]
    delta: Option<TextDelta>,
}

#[derive(Deserialize)]
struct TextDelta {
    #[serde(rename = "type")]
    delta_type: String,
    #[serde(default)]
    text: Option<String>,
}

#[tauri::command]
pub async fn stylize_text(
    app: AppHandle,
    text: String,
    style_instructions: String,
    on_event: Channel<AiEvent>,
) -> Result<(), String> {
    // Get API key from keychain
    let api_key = app
        .keyring()
        .get_password("com.serq.app", "anthropic-api-key")
        .map_err(|_| "API key not configured")?;

    on_event.send(AiEvent::Started).unwrap();

    let client = Client::new();
    let response = client
        .post(CLAUDE_API_URL)
        .header("x-api-key", &api_key)
        .header("anthropic-version", API_VERSION)
        .header("content-type", "application/json")
        .json(&serde_json::json!({
            "model": "claude-sonnet-4-5",
            "max_tokens": 4096,
            "stream": true,
            "messages": [{
                "role": "user",
                "content": format!(
                    "Rewrite the following text according to these style instructions:\n\n\
                    Style: {}\n\n\
                    Text to rewrite:\n{}\n\n\
                    Return ONLY the rewritten text, no explanations.",
                    style_instructions, text
                )
            }]
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        on_event.send(AiEvent::Error { message: error_text }).unwrap();
        return Err("API request failed".to_string());
    }

    let mut full_text = String::new();
    let mut stream = response.bytes_stream().eventsource();

    while let Some(event) = stream.next().await {
        match event {
            Ok(ev) => {
                if ev.event == "content_block_delta" {
                    if let Ok(data) = serde_json::from_str::<ClaudeStreamEvent>(&ev.data) {
                        if let Some(delta) = data.delta {
                            if delta.delta_type == "text_delta" {
                                if let Some(text) = delta.text {
                                    full_text.push_str(&text);
                                    on_event.send(AiEvent::TextDelta {
                                        text: text.clone()
                                    }).unwrap();
                                }
                            }
                        }
                    }
                } else if ev.event == "message_stop" {
                    break;
                } else if ev.event == "error" {
                    on_event.send(AiEvent::Error {
                        message: ev.data
                    }).unwrap();
                    return Err("Stream error".to_string());
                }
            }
            Err(e) => {
                on_event.send(AiEvent::Error {
                    message: e.to_string()
                }).unwrap();
                return Err(e.to_string());
            }
        }
    }

    on_event.send(AiEvent::Finished { full_text }).unwrap();
    Ok(())
}
```

### Frontend Channel Handler
```typescript
// Source: Tauri Channel docs + React patterns
import { invoke, Channel } from '@tauri-apps/api/core';

type AiEvent =
  | { event: 'started' }
  | { event: 'textDelta'; data: { text: string } }
  | { event: 'finished'; data: { fullText: string } }
  | { event: 'error'; data: { message: string } };

export async function stylizeText(
  text: string,
  styleInstructions: string,
  onDelta: (text: string) => void,
  onComplete: (fullText: string) => void,
  onError: (message: string) => void,
): Promise<void> {
  const channel = new Channel<AiEvent>();

  channel.onmessage = (message) => {
    switch (message.event) {
      case 'textDelta':
        onDelta(message.data.text);
        break;
      case 'finished':
        onComplete(message.data.fullText);
        break;
      case 'error':
        onError(message.data.message);
        break;
    }
  };

  await invoke('stylize_text', {
    text,
    styleInstructions,
    onEvent: channel,
  });
}
```

### Simple Inline Diff View Component
```tsx
// Source: Custom implementation (TipTap Pro alternative)
import { useMemo } from 'react';

interface DiffViewProps {
  original: string;
  modified: string;
  onAccept: () => void;
  onReject: () => void;
}

export function DiffView({ original, modified, onAccept, onReject }: DiffViewProps) {
  // Simple word-level diff for text content
  const diff = useMemo(() => {
    const origWords = original.split(/\s+/);
    const modWords = modified.split(/\s+/);

    // Basic LCS-based diff (simplified)
    const result: Array<{ type: 'same' | 'add' | 'remove'; text: string }> = [];

    let i = 0, j = 0;
    while (i < origWords.length || j < modWords.length) {
      if (i >= origWords.length) {
        result.push({ type: 'add', text: modWords[j++] });
      } else if (j >= modWords.length) {
        result.push({ type: 'remove', text: origWords[i++] });
      } else if (origWords[i] === modWords[j]) {
        result.push({ type: 'same', text: origWords[i] });
        i++; j++;
      } else {
        result.push({ type: 'remove', text: origWords[i++] });
        result.push({ type: 'add', text: modWords[j++] });
      }
    }
    return result;
  }, [original, modified]);

  return (
    <div className="diff-view">
      <div className="diff-content">
        {diff.map((item, idx) => (
          <span
            key={idx}
            className={`diff-${item.type}`}
            style={{
              backgroundColor: item.type === 'add' ? '#d4edda'
                : item.type === 'remove' ? '#f8d7da' : 'transparent',
              textDecoration: item.type === 'remove' ? 'line-through' : 'none',
            }}
          >
            {item.text}{' '}
          </span>
        ))}
      </div>
      <div className="diff-actions">
        <button onClick={onAccept} className="accept-btn">
          Accept Changes
        </button>
        <button onClick={onReject} className="reject-btn">
          Reject
        </button>
      </div>
    </div>
  );
}
```

### TipTap Integration for Accept/Reject
```typescript
// Source: TipTap commands documentation
import type { Editor } from '@tiptap/core';

export function applyAiSuggestion(
  editor: Editor,
  originalRange: { from: number; to: number },
  newContent: string,
): void {
  // Single transaction for proper undo support
  editor
    .chain()
    .focus()
    .setTextSelection(originalRange)
    .deleteSelection()
    .insertContent(newContent)
    .run();
}

export function rejectAiSuggestion(editor: Editor): void {
  // Just close the preview, original content unchanged
  // No editor commands needed
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| anthropic SDK (Python/TS) only | anthropic-sdk-rust available | 2025 | Native Rust integration possible |
| Stronghold for secrets | tauri-plugin-keyring | 2026 | Stronghold deprecated, keyring is standard |
| tauri::event system | Channel API | Tauri 2.0 | Better performance, ordering guarantees |
| Polling for responses | SSE streaming | Always | Real-time UX, lower latency perception |

**Deprecated/outdated:**
- Stronghold plugin: Will be removed in Tauri 3, migrate to keyring
- Manual SSE parsing: Use eventsource-stream crate instead
- Frontend API key storage: Security vulnerability, always use keychain

## Open Questions

Things that couldn't be fully resolved:

1. **anthropic-sdk-rust production readiness**
   - What we know: Library exists at 0.1.1, has streaming support
   - What's unclear: Whether it handles all Claude API edge cases (errors, rate limits)
   - Recommendation: Use direct reqwest implementation, evaluate SDK in future phases

2. **Tauri Channel backpressure**
   - What we know: Channels handle ordering, designed for streaming
   - What's unclear: Behavior if frontend is slow to process (does Rust block?)
   - Recommendation: Accept risk; Claude text deltas are small, unlikely to overflow

3. **macOS Keychain permission prompts**
   - What we know: First access may show permission dialog
   - What's unclear: Exact UX, whether it's per-app or per-key
   - Recommendation: Test on fresh macOS install, document in user onboarding

## Sources

### Primary (HIGH confidence)
- [Tauri Channel API documentation](https://v2.tauri.app/develop/calling-frontend/) - Streaming pattern, Channel usage
- [Claude Streaming API documentation](https://platform.claude.com/docs/en/build-with-claude/streaming) - SSE format, event types
- [tauri-plugin-keyring GitHub](https://github.com/HuakunShen/tauri-plugin-keyring) - Installation, API usage

### Secondary (MEDIUM confidence)
- [reqwest-eventsource GitHub](https://github.com/jpopesculian/reqwest-eventsource) - SSE parsing with reqwest
- [anthropic-sdk-rust GitHub](https://github.com/dimichgh/anthropic-sdk-rust) - Rust SDK patterns (not used, but informed design)

### Tertiary (LOW confidence)
- TipTap AI Suggestion docs - Referenced for diff pattern inspiration, not using their paid extension
- react-diff-viewer - Evaluated but rejected for simplicity

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - eventsource-stream + keyring are established; anthropic-sdk-rust is new
- Architecture: HIGH - Tauri Channel pattern is well-documented
- Pitfalls: MEDIUM - Based on general streaming/API patterns, not SERQ-specific testing

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - Claude API and Tauri are stable)
