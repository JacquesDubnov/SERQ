---
created: 2026-02-01T14:30
title: Add image management panel
area: ui
files:
  - src/extensions/ResizableImage/
  - src/components/Editor/
---

## Problem

Currently images are embedded in the document with no way to:
- See all images in one place
- View their file sizes (important since base64 bloats document size)
- Get suggestions for compression or format conversion
- Manage/delete images without hunting through the document

A document with many large images becomes unwieldy - users need visibility into what's consuming space.

## Solution

Create an "Image Management" panel (similar to Version History or Comments panel) that:
- Lists all images in the document as thumbnails
- Shows file size for each (decoded from base64)
- Highlights large images with compression suggestions
- Offers one-click compression (reduce quality/dimensions)
- Offers format conversion (PNG → JPEG for photos)
- Click to navigate to image location in document
- Bulk actions (compress all, remove all)

TBD: Whether compression happens client-side (canvas API) or needs external tooling.
