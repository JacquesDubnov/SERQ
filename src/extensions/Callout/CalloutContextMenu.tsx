/**
 * CalloutContextMenu Component
 * Right-click context menu for callout operations
 */

import { useEffect, useRef, useCallback } from 'react'
import { CALLOUT_COLORS, CALLOUT_ICONS } from '../../lib/calloutColors'

type BorderStyle = 'left' | 'right' | 'top' | 'bottom' | 'full' | 'none'
type FloatOption = 'none' | 'left' | 'right' | 'center-wrap'

const BORDER_STYLES: { id: BorderStyle; label: string; icon: string }[] = [
  { id: 'left', label: 'Left border', icon: '⊏' },
  { id: 'right', label: 'Right border', icon: '⊐' },
  { id: 'top', label: 'Top border', icon: '⊓' },
  { id: 'bottom', label: 'Bottom border', icon: '⊔' },
  { id: 'full', label: 'Full border', icon: '▢' },
  { id: 'none', label: 'No border', icon: '○' },
]

const FLOAT_OPTIONS: { id: FloatOption; label: string; icon: string }[] = [
  { id: 'none', label: 'No float', icon: '▣' },
  { id: 'left', label: 'Float left', icon: '◧' },
  { id: 'right', label: 'Float right', icon: '◨' },
  { id: 'center-wrap', label: 'Center (text below)', icon: '◫' },
]

interface CalloutContextMenuProps {
  position: { x: number; y: number }
  currentColor: string
  currentIcon: string | null
  currentBorderStyle: BorderStyle
  currentFloat?: FloatOption
  isCollapsible: boolean
  onChangeColor: (color: string) => void
  onChangeIcon: (icon: string | null) => void
  onChangeBorderStyle: (style: BorderStyle) => void
  onChangeFloat?: (float: FloatOption) => void
  onToggleCollapsible: () => void
  onDelete: () => void
  onClose: () => void
}

export function CalloutContextMenu({
  position,
  currentColor,
  currentIcon,
  currentBorderStyle,
  currentFloat = 'none',
  isCollapsible,
  onChangeColor,
  onChangeIcon,
  onChangeBorderStyle,
  onChangeFloat,
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

    // Delay to prevent immediate close from the right-click
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
      onClose()
    },
    [onChangeColor, onClose]
  )

  const handleIconChange = useCallback(
    (icon: string | null) => {
      onChangeIcon(icon)
      onClose()
    },
    [onChangeIcon, onClose]
  )

  const handleBorderStyleChange = useCallback(
    (style: BorderStyle) => {
      onChangeBorderStyle(style)
      onClose()
    },
    [onChangeBorderStyle, onClose]
  )

  const handleFloatChange = useCallback(
    (float: FloatOption) => {
      if (onChangeFloat) {
        onChangeFloat(float)
      }
      onClose()
    },
    [onChangeFloat, onClose]
  )

  const handleToggleCollapsible = useCallback(() => {
    onToggleCollapsible()
    onClose()
  }, [onToggleCollapsible, onClose])

  const handleDelete = useCallback(() => {
    onDelete()
    onClose()
  }, [onDelete, onClose])

  return (
    <div
      ref={menuRef}
      className="callout-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Color Selection */}
      <div className="callout-context-menu-section">
        <div className="callout-context-menu-label">Color</div>
        <div className="callout-context-menu-colors">
          {CALLOUT_COLORS.map((c) => (
            <button
              key={c.id}
              className={`callout-context-menu-color-btn ${currentColor === c.id ? 'active' : ''}`}
              title={c.name}
              onClick={() => handleColorChange(c.id)}
              style={{
                backgroundColor: c.bgLight,
                borderColor: c.borderLight,
              }}
            />
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="callout-context-menu-section">
        <div className="callout-context-menu-label">Icon</div>
        <div className="callout-context-menu-icons">
          <button
            className={`callout-context-menu-icon-btn ${!currentIcon ? 'active' : ''}`}
            title="No icon"
            onClick={() => handleIconChange(null)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
              <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="2" />
              <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          {CALLOUT_ICONS.map((i) => (
            <button
              key={i.id}
              className={`callout-context-menu-icon-btn ${currentIcon === i.icon ? 'active' : ''}`}
              title={i.label}
              onClick={() => handleIconChange(i.icon)}
            >
              {i.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Border Style */}
      <div className="callout-context-menu-section">
        <div className="callout-context-menu-label">Border</div>
        <div className="callout-context-menu-icons">
          {BORDER_STYLES.map((b) => (
            <button
              key={b.id}
              className={`callout-context-menu-icon-btn ${currentBorderStyle === b.id ? 'active' : ''}`}
              title={b.label}
              onClick={() => handleBorderStyleChange(b.id)}
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Float / Text Wrap */}
      {onChangeFloat && (
        <div className="callout-context-menu-section">
          <div className="callout-context-menu-label">Text Wrap</div>
          <div className="callout-context-menu-icons">
            {FLOAT_OPTIONS.map((f) => (
              <button
                key={f.id}
                className={`callout-context-menu-icon-btn ${currentFloat === f.id ? 'active' : ''}`}
                title={f.label}
                onClick={() => handleFloatChange(f.id)}
              >
                {f.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Toggle */}
      <div className="callout-context-menu-section">
        <button className="callout-context-menu-item" onClick={handleToggleCollapsible}>
          <span className="callout-context-menu-item-icon">
            {isCollapsible ? '✓' : ' '}
          </span>
          Collapsible
        </button>
      </div>

      {/* Delete */}
      <div className="callout-context-menu-section">
        <button
          className="callout-context-menu-item"
          onClick={handleDelete}
          style={{ color: '#dc2626' }}
        >
          <span className="callout-context-menu-item-icon">X</span>
          Delete callout
        </button>
      </div>
    </div>
  )
}

export default CalloutContextMenu
