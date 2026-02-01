---
created: 2026-02-01T12:00
title: Add splash screen on app opening
area: ui
files: []
---

## Problem

App currently opens directly to editor without any loading screen or branding. Need a splash screen that displays during app initialization to:
- Show SERQ branding/logo
- Indicate app is loading
- Provide polished first impression

## Solution

Create splash screen component that:
- Shows during Tauri app initialization
- Displays SERQ logo (centered)
- Has subtle loading indicator
- Fades out smoothly when app is ready
- Consider Tauri's native splashscreen capability vs React-based solution
