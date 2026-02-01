/**
 * CalloutContextMenu Component
 * Right-click context menu for callout operations
 * Uses consistent UI with other context menus (tables, images)
 */

import { useEffect, useRef, useCallback } from 'react'
import { CALLOUT_COLORS } from '../../lib/calloutColors'

type BorderStyle = 'left' | 'right' | 'top' | 'bottom' | 'full' | 'none'

interface CalloutContextMenuProps {
  position: { x: number; y: number }
  currentColor: string
  currentIcon: string | null
  currentBorderStyle: BorderStyle
  isCollapsible: boolean
  onChangeColor: (color: string) => void
  onChangeIcon: (icon: string | null) => void
  onChangeBorderStyle: (style: BorderStyle) => void
  onToggleCollapsible: () => void
  onDelete: () => void
  onClose: () => void
}

// SVG Icons for consistent UI
const Icons = {
  // Border styles
  borderLeft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" strokeOpacity="0.3" />
      <line x1="2" y1="2" x2="2" y2="14" strokeWidth="2.5" />
    </svg>
  ),
  borderRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" strokeOpacity="0.3" />
      <line x1="14" y1="2" x2="14" y2="14" strokeWidth="2.5" />
    </svg>
  ),
  borderTop: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" strokeOpacity="0.3" />
      <line x1="2" y1="2" x2="14" y2="2" strokeWidth="2.5" />
    </svg>
  ),
  borderBottom: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" strokeOpacity="0.3" />
      <line x1="2" y1="14" x2="14" y2="14" strokeWidth="2.5" />
    </svg>
  ),
  borderFull: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="12" height="12" rx="1" />
    </svg>
  ),
  borderNone: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3">
      <rect x="2" y="2" width="12" height="12" rx="1" strokeDasharray="2 2" />
    </svg>
  ),
  // Callout icons (clean SVG versions)
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="4.5" r="1" />
      <rect x="7" y="6.5" width="2" height="5" rx="0.5" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1L15 14H1L8 1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8" cy="11" r="1" />
      <rect x="7" y="5" width="2" height="4" rx="0.5" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" />
      <path d="M5 8L7 10L11 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" />
      <path d="M5 5L11 11M11 5L5 11" strokeLinecap="round" />
    </svg>
  ),
  note: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <line x1="5" y1="5" x2="11" y2="5" />
      <line x1="5" y1="8" x2="11" y2="8" />
      <line x1="5" y1="11" x2="8" y2="11" />
    </svg>
  ),
  tip: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1a5 5 0 013 9v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2a5 5 0 013-9z" />
      <line x1="6" y1="14" x2="10" y2="14" />
    </svg>
  ),
  quote: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 4h4l-1 4h2v4H3V8l1-4zm6 0h4l-1 4h2v4H9V8l1-4z" />
    </svg>
  ),
  noIcon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4">
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  ),
  // Actions
  check: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8L6 11L13 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
    </svg>
  ),
}

const BORDER_STYLES: { id: BorderStyle; label: string; icon: React.ReactNode }[] = [
  { id: 'left', label: 'Left border', icon: Icons.borderLeft },
  { id: 'right', label: 'Right border', icon: Icons.borderRight },
  { id: 'top', label: 'Top border', icon: Icons.borderTop },
  { id: 'bottom', label: 'Bottom border', icon: Icons.borderBottom },
  { id: 'full', label: 'Full border', icon: Icons.borderFull },
  { id: 'none', label: 'No border', icon: Icons.borderNone },
]

const CALLOUT_ICON_OPTIONS: { id: string | null; label: string; icon: React.ReactNode }[] = [
  { id: null, label: 'No icon', icon: Icons.noIcon },
  { id: 'info', label: 'Info', icon: Icons.info },
  { id: 'warning', label: 'Warning', icon: Icons.warning },
  { id: 'success', label: 'Success', icon: Icons.success },
  { id: 'error', label: 'Error', icon: Icons.error },
  { id: 'note', label: 'Note', icon: Icons.note },
  { id: 'tip', label: 'Tip', icon: Icons.tip },
  { id: 'quote', label: 'Quote', icon: Icons.quote },
]

export function CalloutContextMenu({
  position,
  currentColor,
  currentIcon,
  currentBorderStyle,
  isCollapsible,
  onChangeColor,
  onChangeIcon,
  onChangeBorderStyle,
  onToggleCollapsible,
  onDelete,
  onClose,
}: CalloutContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    document.addEventListener('keydown', handleEscape)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = position.x
      let adjustedY = position.y

      if (position.x + rect.width > viewportWidth - 20) {
        adjustedX = viewportWidth - rect.width - 20
      }
      if (position.y + rect.height > viewportHeight - 20) {
        adjustedY = viewportHeight - rect.height - 20
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [position])

  const handleColorChange = useCallback(
    (colorId: string) => {
      onChangeColor(colorId)
    },
    [onChangeColor]
  )

  const handleIconChange = useCallback(
    (iconId: string | null) => {
      onChangeIcon(iconId)
    },
    [onChangeIcon]
  )

  const handleBorderStyleChange = useCallback(
    (style: BorderStyle) => {
      onChangeBorderStyle(style)
    },
    [onChangeBorderStyle]
  )

  const handleToggleCollapsible = useCallback(() => {
    onToggleCollapsible()
  }, [onToggleCollapsible])

  const handleDelete = useCallback(() => {
    onDelete()
    onClose()
  }, [onDelete, onClose])

  return (
    <div
      ref={menuRef}
      className="table-context-menu" // Use table context menu styles for consistency
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Color Selection */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Color</div>
        <div className="table-context-menu-colors">
          {CALLOUT_COLORS.map((c) => (
            <button
              key={c.id}
              className={`table-context-menu-color-btn ${currentColor === c.id ? 'active' : ''}`}
              title={c.name}
              onClick={() => handleColorChange(c.id)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                backgroundColor: c.bgLight,
                borderColor: currentColor === c.id ? 'var(--color-primary, #3b82f6)' : c.borderLight,
              }}
            />
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Icon</div>
        <div className="table-context-menu-colors" style={{ gap: '4px' }}>
          {CALLOUT_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.id || 'none'}
              className={`table-context-menu-color-btn ${currentIcon === opt.id ? 'active' : ''}`}
              title={opt.label}
              onClick={() => handleIconChange(opt.id)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                backgroundColor: 'transparent',
                border: currentIcon === opt.id ? '2px solid var(--color-primary, #3b82f6)' : '1px solid var(--color-border, #e5e7eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Border Style */}
      <div className="table-context-menu-section">
        <div className="table-context-menu-label">Border</div>
        <div className="table-context-menu-colors" style={{ gap: '4px' }}>
          {BORDER_STYLES.map((b) => (
            <button
              key={b.id}
              className={`table-context-menu-color-btn ${currentBorderStyle === b.id ? 'active' : ''}`}
              title={b.label}
              onClick={() => handleBorderStyleChange(b.id)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                backgroundColor: 'transparent',
                border: currentBorderStyle === b.id ? '2px solid var(--color-primary, #3b82f6)' : '1px solid var(--color-border, #e5e7eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Toggle */}
      <div className="table-context-menu-section">
        <button
          className="table-context-menu-item"
          onClick={handleToggleCollapsible}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="table-context-menu-item-icon" style={{ opacity: isCollapsible ? 1 : 0.3 }}>
            {Icons.check}
          </span>
          Collapsible
        </button>
      </div>

      {/* Delete */}
      <div className="table-context-menu-section">
        <button
          className="table-context-menu-item"
          onClick={handleDelete}
          onMouseDown={(e) => e.preventDefault()}
          style={{ color: '#dc2626' }}
        >
          <span className="table-context-menu-item-icon">
            {Icons.trash}
          </span>
          Delete callout
        </button>
      </div>
    </div>
  )
}

export default CalloutContextMenu
