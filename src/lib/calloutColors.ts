/**
 * Callout color definitions for light and dark modes
 * 8 colors that work with document themes
 */

export interface CalloutColor {
  id: string
  name: string
  bgLight: string
  bgDark: string
  borderLight: string
  borderDark: string
}

export const CALLOUT_COLORS: CalloutColor[] = [
  {
    id: 'blue',
    name: 'Blue',
    bgLight: '#dbeafe',
    bgDark: '#1e3a5f',
    borderLight: '#3b82f6',
    borderDark: '#60a5fa',
  },
  {
    id: 'green',
    name: 'Green',
    bgLight: '#dcfce7',
    bgDark: '#14532d',
    borderLight: '#22c55e',
    borderDark: '#4ade80',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    bgLight: '#fef9c3',
    bgDark: '#422006',
    borderLight: '#eab308',
    borderDark: '#facc15',
  },
  {
    id: 'orange',
    name: 'Orange',
    bgLight: '#ffedd5',
    bgDark: '#431407',
    borderLight: '#f97316',
    borderDark: '#fb923c',
  },
  {
    id: 'red',
    name: 'Red',
    bgLight: '#fee2e2',
    bgDark: '#450a0a',
    borderLight: '#ef4444',
    borderDark: '#f87171',
  },
  {
    id: 'purple',
    name: 'Purple',
    bgLight: '#f3e8ff',
    bgDark: '#3b0764',
    borderLight: '#a855f7',
    borderDark: '#c084fc',
  },
  {
    id: 'pink',
    name: 'Pink',
    bgLight: '#fce7f3',
    bgDark: '#500724',
    borderLight: '#ec4899',
    borderDark: '#f472b6',
  },
  {
    id: 'gray',
    name: 'Gray',
    bgLight: '#f3f4f6',
    bgDark: '#1f2937',
    borderLight: '#6b7280',
    borderDark: '#9ca3af',
  },
]

/**
 * Callout icon presets (text-based icons for quick selection)
 * Using Unicode symbols and text rather than emojis
 */
export const CALLOUT_ICONS = [
  { id: 'info', icon: 'i', label: 'Info' },
  { id: 'tip', icon: '!', label: 'Tip' },
  { id: 'warning', icon: '⚠', label: 'Warning' },
  { id: 'danger', icon: '⊘', label: 'Danger' },
  { id: 'note', icon: '✎', label: 'Note' },
  { id: 'question', icon: '?', label: 'Question' },
  { id: 'check', icon: '✓', label: 'Check' },
  { id: 'star', icon: '★', label: 'Star' },
]

/**
 * Get a callout color by ID
 */
export function getCalloutColor(colorId: string): CalloutColor | undefined {
  return CALLOUT_COLORS.find((c) => c.id === colorId)
}
