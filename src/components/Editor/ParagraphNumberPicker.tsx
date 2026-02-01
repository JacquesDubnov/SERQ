/**
 * Paragraph Number Preset Picker
 * Grid of preset options with live preview
 */
import { useState, useEffect, useRef } from 'react'
import { PARAGRAPH_NUMBER_PRESETS, type NumberingPreset } from '../../extensions/ParagraphNumbers'
import { useEditorStore } from '../../stores/editorStore'

interface ParagraphNumberPickerProps {
  onClose: () => void
  position: { x: number; y: number }
}

export function ParagraphNumberPicker({ onClose, position }: ParagraphNumberPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('sequential')
  const currentPresetId = useEditorStore((s) => s.paragraphNumbers.presetId)
  const setParagraphNumbers = useEditorStore((s) => s.setParagraphNumbers)
  const menuRef = useRef<HTMLDivElement>(null)

  const categories = [
    { id: 'sequential', name: 'Sequential' },
    { id: 'hierarchical', name: 'Hierarchical' },
    { id: 'legal', name: 'Legal' },
  ]

  const filteredPresets = PARAGRAPH_NUMBER_PRESETS.filter(
    (p) => p.category === selectedCategory
  )

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

    // Delay to prevent immediate close
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

  // Adjust position to keep in viewport
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

  const handleSelectPreset = (preset: NumberingPreset) => {
    setParagraphNumbers({ enabled: true, presetId: preset.id })
    onClose()
  }

  const handleDisable = () => {
    setParagraphNumbers({ enabled: false, presetId: null })
    onClose()
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        backgroundColor: 'var(--color-bg-surface, #ffffff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        padding: 12,
        zIndex: 1001,
        width: 320,
        maxHeight: 400,
        overflow: 'auto',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: 'var(--color-text-primary, #1f2937)',
            fontSize: 14,
          }}
        >
          Paragraph Numbering
        </span>
        <button
          onClick={handleDisable}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid var(--color-border, #d1d5db)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary, #6b7280)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Disable
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 13,
              cursor: 'pointer',
              backgroundColor:
                selectedCategory === cat.id
                  ? 'var(--color-accent, #2563eb)'
                  : 'var(--color-bg-hover, #f3f4f6)',
              color:
                selectedCategory === cat.id
                  ? 'white'
                  : 'var(--color-text-primary, #1f2937)',
              border: 'none',
              fontWeight: 500,
            }}
            onClick={() => setSelectedCategory(cat.id)}
            onMouseDown={(e) => e.preventDefault()}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div>
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            style={{
              padding: 12,
              borderRadius: 6,
              border: `1px solid ${
                currentPresetId === preset.id
                  ? 'var(--color-accent, #3b82f6)'
                  : 'var(--color-border, #e5e7eb)'
              }`,
              backgroundColor:
                currentPresetId === preset.id
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'var(--color-bg-hover, #f9fafb)',
              cursor: 'pointer',
              marginBottom: 8,
            }}
            onClick={() => handleSelectPreset(preset)}
            onMouseEnter={(e) => {
              if (currentPresetId !== preset.id) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover, #f3f4f6)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentPresetId !== preset.id) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-surface, #f9fafb)'
              }
            }}
          >
            <div
              style={{
                fontWeight: 500,
                color: 'var(--color-text-primary, #1f2937)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              {preset.name}
              {currentPresetId === preset.id && (
                <span style={{ color: 'var(--color-accent, #2563eb)' }}>
                  Active
                </span>
              )}
            </div>
            <pre
              style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--color-text-secondary, #6b7280)',
                fontFamily: 'var(--font-mono, monospace)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
              }}
            >
              {preset.preview}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ParagraphNumberPicker
