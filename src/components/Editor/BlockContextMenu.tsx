/**
 * BlockContextMenu - Context menu for block elements (images, callouts)
 * Provides float options for text wrapping
 */
import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type FloatOption = 'none' | 'left' | 'right' | 'center-wrap'

interface BlockContextMenuProps {
  position: { x: number; y: number }
  currentFloat: FloatOption
  onChangeFloat: (float: FloatOption) => void
  onInsertClearBreak?: () => void
  onClose: () => void
}

const FLOAT_OPTIONS: { value: FloatOption; label: string; icon: ReactNode }[] = [
  {
    value: 'none',
    label: 'No Float',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <line x1="7" y1="10" x2="17" y2="10" opacity="0.5" />
        <line x1="7" y1="14" x2="17" y2="14" opacity="0.5" />
      </svg>
    ),
  },
  {
    value: 'left',
    label: 'Float Left',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="8" height="8" rx="1" />
        <line x1="14" y1="5" x2="21" y2="5" />
        <line x1="14" y1="8" x2="21" y2="8" />
        <line x1="14" y1="11" x2="21" y2="11" />
        <line x1="3" y1="16" x2="21" y2="16" opacity="0.5" />
        <line x1="3" y1="19" x2="21" y2="19" opacity="0.5" />
      </svg>
    ),
  },
  {
    value: 'right',
    label: 'Float Right',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="13" y="4" width="8" height="8" rx="1" />
        <line x1="3" y1="5" x2="10" y2="5" />
        <line x1="3" y1="8" x2="10" y2="8" />
        <line x1="3" y1="11" x2="10" y2="11" />
        <line x1="3" y1="16" x2="21" y2="16" opacity="0.5" />
        <line x1="3" y1="19" x2="21" y2="19" opacity="0.5" />
      </svg>
    ),
  },
  {
    value: 'center-wrap',
    label: 'Center (Text Below)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="3" width="10" height="8" rx="1" />
        <line x1="3" y1="15" x2="21" y2="15" opacity="0.5" />
        <line x1="3" y1="18" x2="21" y2="18" opacity="0.5" />
        <line x1="3" y1="21" x2="21" y2="21" opacity="0.5" />
      </svg>
    ),
  },
]

export function BlockContextMenu({
  position,
  currentFloat,
  onChangeFloat,
  onInsertClearBreak,
  onClose,
}: BlockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay to prevent immediate close from the triggering click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedPosition = useCallback(() => {
    const menuWidth = 200
    const menuHeight = 280 // Approximate height
    const padding = 8

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding
    }
    if (x < padding) {
      x = padding
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding
    }
    if (y < padding) {
      y = padding
    }

    return { x, y }
  }, [position])

  const { x, y } = adjustedPosition()

  const handleFloatChange = (float: FloatOption) => {
    onChangeFloat(float)
    onClose()
  }

  const handleClearBreak = () => {
    if (onInsertClearBreak) {
      onInsertClearBreak()
    }
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="block-context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000,
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-color, #e5e7eb)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        padding: '0.5rem',
        minWidth: '180px',
      }}
    >
      {/* Section: Float Options */}
      <div className="block-context-menu-section">
        <div
          className="block-context-menu-label"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary, #6b7280)',
            padding: '0.25rem 0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Text Wrap
        </div>
        {FLOAT_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`block-context-menu-item ${currentFloat === option.value ? 'active' : ''}`}
            onClick={() => handleFloatChange(option.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.875rem',
              textAlign: 'left',
              background: currentFloat === option.value ? 'var(--bg-hover, #f3f4f6)' : 'none',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary, #1f2937)',
            }}
            onMouseEnter={(e) => {
              if (currentFloat !== option.value) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentFloat !== option.value) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <span style={{ opacity: currentFloat === option.value ? 1 : 0.7 }}>{option.icon}</span>
            <span>{option.label}</span>
            {currentFloat === option.value && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginLeft: 'auto' }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--border-color, #e5e7eb)',
          margin: '0.5rem 0',
        }}
      />

      {/* Section: Clear Break */}
      {onInsertClearBreak && (
        <div className="block-context-menu-section">
          <button
            className="block-context-menu-item"
            onClick={handleClearBreak}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.875rem',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary, #1f2937)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <polyline points="8 8 3 12 8 16" />
              <polyline points="16 8 21 12 16 16" />
            </svg>
            <span>Insert Clear Break</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default BlockContextMenu
