/**
 * ProseMirror Zoom Patch
 *
 * CURRENT STATE: CSS zoom approach. No prototype overrides needed.
 * CSS zoom operates at the rendering level -- the browser handles coordinate
 * APIs transparently. No posAtCoords/coordsAtPos patching required.
 *
 * The only export we keep is the CSS zoom detection function and a no-op
 * installZoomPatch for backward compatibility.
 */

export function installZoomPatch(): void {
  // No-op. CSS zoom doesn't need prototype overrides.
  // Keeping this function so EditorCore.tsx doesn't need changes.
}

export function createZoomPlugin() {
  // No-op plugin. CSS zoom handles coordinates natively.
  // Returning null -- the Extension wrapper in EditorCore handles this.
  return null
}

export function uninstallZoomPatch(): void {
  // No-op
}

/**
 * Runtime detection: does WebKit's CSS zoom coordinate fix work?
 * Tests whether getBoundingClientRect returns zoomed values (correct)
 * or un-zoomed values (bugged).
 */
export function isCSSZoomCoordinateFixed(): boolean {
  const div = document.createElement('div')
  div.style.cssText = 'zoom: 2; width: 100px; position: absolute; visibility: hidden;'
  document.body.appendChild(div)
  const rect = div.getBoundingClientRect()
  const fixed = rect.width === 200
  document.body.removeChild(div)
  return fixed
}
