---
created: 2026-02-01T12:00
title: Multiple Image Import Gallery View
area: feature
files:
  - src/extensions/ResizableImage/ImageView.tsx
  - src/components/ImageGallery/ImageGallery.tsx
---

## Problem

User wants ability to import multiple images at once and view them in a gallery format within the document.

## Solution

- Add multi-select to image import dialog
- Create gallery component that displays images in grid layout
- Support drag-to-reorder within gallery
- Click image to expand/focus
- Consider lightbox mode for full-screen preview
