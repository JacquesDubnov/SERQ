/**
 * Block Indicator - State Management
 *
 * Module-level mutable state, HMR persistence, subscriptions, and public API.
 * The `store` object holds all mutable state so the plugin can read/write it
 * via standard property access.
 */

import type { BlockIndicatorState, HMRState } from './types'

// Default state
const defaultState: BlockIndicatorState = {
  visible: false,
  top: 0,
  height: 0,
  blockLeft: 0,
  blockWidth: 0,
  commandHeld: false,
  isLongPressing: false,
  isDragging: false,
  dropIndicatorTop: null,
  sourceOverlay: null,
  isAnimating: false,
  indicatorTransition: null,
  dropAnimation: 'none',
  selectedBlocks: [],
  lastSelectedPos: null,
  paginationEnabled: false,
  horizontalDropSide: null,
  horizontalDropBlockPos: null,
  horizontalDropRect: null,
  horizontalDropColumnIndex: null,
  horizontalDropGapX: null,
}

// Get persisted state from HMR or use defaults
const hmrData = (import.meta.hot?.data as HMRState | undefined)

/**
 * Mutable state container.
 * Exported as an object so plugin.ts can read/write properties directly.
 */
export const store = {
  currentState: hmrData?.currentState ?? { ...defaultState } as BlockIndicatorState,
  listeners: hmrData?.listeners ?? [] as ((state: BlockIndicatorState) => void)[],
  selectedBlockPositions: hmrData?.selectedBlockPositions ?? new Set<number>(),
  lastSelectedPos: hmrData?.lastSelectedPos ?? null as number | null,
  commandHeld: hmrData?.commandHeld ?? false,
  indicatorEnabled: hmrData?.indicatorEnabled ?? true,
  enabledListeners: hmrData?.enabledListeners ?? [] as ((enabled: boolean) => void)[],
  lastMouseY: 0,
  selectionListeners: [] as ((positions: Set<number>) => void)[],
  // FLIP animation tracking
  preDropPositions: new Map<number, DOMRect>(),
  dropTargetIndex: 0,
  movedBlockPos: null as number | null,
}

// Preserve state on HMR
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    const data = import.meta.hot!.data as HMRState
    data.currentState = store.currentState
    data.listeners = store.listeners
    data.selectedBlockPositions = store.selectedBlockPositions
    data.lastSelectedPos = store.lastSelectedPos
    data.commandHeld = store.commandHeld
    data.indicatorEnabled = store.indicatorEnabled
    data.enabledListeners = store.enabledListeners
  })
}

// --- Notification helpers ---

export function notifyListeners() {
  store.listeners.forEach((fn) => fn({ ...store.currentState }))
}

export function notifySelectionListeners() {
  const positions = new Set(store.selectedBlockPositions)
  store.selectionListeners.forEach((fn) => fn(positions))
}

// --- Public API ---

/**
 * Enable or disable the block indicator feature.
 * When disabled, no event handlers run and indicator is hidden.
 */
export function setBlockIndicatorEnabled(enabled: boolean) {
  if (store.indicatorEnabled === enabled) return
  store.indicatorEnabled = enabled

  // If disabling, hide indicator and clear selections
  if (!enabled) {
    store.currentState = {
      ...store.currentState,
      visible: false,
      selectedBlocks: [],
      lastSelectedPos: null,
    }
    store.selectedBlockPositions.clear()
    store.lastSelectedPos = null
    notifyListeners()
  }

  // Notify enabled state listeners
  store.enabledListeners.forEach((fn) => fn(enabled))
}

/**
 * Check if block indicator is enabled
 */
export function isBlockIndicatorEnabled(): boolean {
  return store.indicatorEnabled
}

/**
 * Get the set of selected block positions.
 * Returns a copy to prevent external modification.
 */
export function getSelectedBlockPositions(): Set<number> {
  return new Set(store.selectedBlockPositions)
}

/**
 * Check if any blocks are currently selected
 */
export function hasSelectedBlocks(): boolean {
  return store.selectedBlockPositions.size > 0
}

/**
 * Get count of selected blocks
 */
export function getSelectedBlockCount(): number {
  return store.selectedBlockPositions.size
}

/**
 * Subscribe to block selection changes.
 * Callback receives the set of selected positions whenever selection changes.
 */
export function subscribeToBlockSelection(
  callback: (positions: Set<number>) => void
): () => void {
  store.selectionListeners.push(callback)
  callback(new Set(store.selectedBlockPositions))
  return () => {
    store.selectionListeners = store.selectionListeners.filter((fn) => fn !== callback)
  }
}

/**
 * Subscribe to enabled state changes
 */
export function subscribeToBlockIndicatorEnabled(
  callback: (enabled: boolean) => void
): () => void {
  store.enabledListeners.push(callback)
  callback(store.indicatorEnabled)
  return () => {
    store.enabledListeners = store.enabledListeners.filter((fn) => fn !== callback)
  }
}

/**
 * Subscribe to block indicator state changes.
 * The React component uses this to re-render when the indicator moves.
 */
export function subscribeToBlockIndicator(
  callback: (state: BlockIndicatorState) => void
): () => void {
  store.listeners.push(callback)
  callback({ ...store.currentState })
  return () => {
    store.listeners = store.listeners.filter((fn) => fn !== callback)
  }
}

// --- Drop info ---

export function getPreDropPositions() {
  return store.preDropPositions
}

export function getDropInfo() {
  return { dropTargetIndex: store.dropTargetIndex, movedBlockPos: store.movedBlockPos }
}

export function clearDropInfo() {
  store.preDropPositions.clear()
  store.movedBlockPos = null
}

// --- Selection helpers ---

/**
 * Clear all block selections and notify listeners.
 */
export function clearSelections() {
  store.selectedBlockPositions.clear()
  store.lastSelectedPos = null
  store.currentState = {
    ...store.currentState,
    selectedBlocks: [],
    lastSelectedPos: null,
  }
  notifyListeners()
  notifySelectionListeners()
}

/**
 * Called by React component when animation completes.
 */
export function finishAnimation() {
  store.currentState = {
    ...store.currentState,
    isAnimating: false,
    indicatorTransition: null,
  }
  clearDropInfo()
  notifyListeners()
}

/**
 * Get a fresh copy of the default state (for resetState in plugin).
 */
export function getDefaultState(): BlockIndicatorState {
  return { ...defaultState }
}
