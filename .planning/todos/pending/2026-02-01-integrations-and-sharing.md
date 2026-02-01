---
created: 2026-02-01T09:45
title: Add integrations and sharing settings
area: feature
files:
  - src/components/Settings/ (future)
---

## Problem

Users need to share their documents directly to publishing platforms and communication channels without manually copying/pasting or exporting. Currently, the only way to get content out is via export (HTML, Markdown, PDF).

Target integrations:
- **Publishing platforms**: Medium, Substack, WordPress, Ghost
- **Social media**: X (Twitter), LinkedIn, Facebook
- **Email**: Gmail, Outlook, generic SMTP
- **Other**: Notion, Google Docs, Dropbox Paper

This requires an integrations/settings panel where users can:
1. Connect accounts (OAuth flows)
2. Configure default sharing preferences
3. Manage connected services

## Solution

**Settings/Preferences Panel** (prerequisite):
- New settings modal or panel accessible from menu/command palette
- Sections: General, Integrations, Shortcuts, etc.

**Integrations Section:**
- List of available integrations with connect/disconnect buttons
- OAuth flow handling for each service
- Per-integration settings (e.g., default Medium publication, X thread mode)

**Share Action:**
- Command palette: "Share to..." with service picker
- Toolbar button or menu item
- Format conversion as needed (Markdown for Medium, truncated for X, etc.)

**Technical Considerations:**
- OAuth tokens stored securely (Tauri keychain or encrypted store)
- API rate limits and error handling
- Preview before posting
- Draft vs. publish options where supported
