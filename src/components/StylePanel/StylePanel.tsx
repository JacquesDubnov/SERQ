/**
 * Style Panel Component
 * Full-height overlay panel that shows presets for a specific category
 * Supports arrow key navigation
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import {
  TYPOGRAPHY_PRESETS,
  COLOR_PRESETS,
  CANVAS_PRESETS,
  LAYOUT_PRESETS,
  MASTER_THEMES,
} from '../../lib/presets'

export type StylePanelType = 'themes' | 'colors' | 'typography' | 'canvas' | 'layout'

interface InterfaceColors {
  bg: string
  bgSurface: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
}

interface StylePanelProps {
  panelType: StylePanelType | null
  onClose: () => void
  interfaceColors: InterfaceColors
}

interface PresetItem {
  id: string
  name: string
}

// Get presets for panel type
function getPresets(panelType: StylePanelType): { title: string; presets: PresetItem[] } {
  switch (panelType) {
    case 'themes':
      return {
        title: 'Master Themes',
        presets: MASTER_THEMES.map((t) => ({ id: t.id, name: t.name })),
      }
    case 'colors':
      return {
        title: 'Color Schemes',
        presets: COLOR_PRESETS.map((p) => ({ id: p.id, name: p.name })),
      }
    case 'typography':
      return {
        title: 'Typography',
        presets: TYPOGRAPHY_PRESETS.map((p) => ({ id: p.id, name: p.name })),
      }
    case 'canvas':
      return {
        title: 'Canvas Styles',
        presets: CANVAS_PRESETS.map((p) => ({ id: p.id, name: p.name })),
      }
    case 'layout':
      return {
        title: 'Layout',
        presets: LAYOUT_PRESETS.map((p) => ({ id: p.id, name: p.name })),
      }
  }
}

export function StylePanel({ panelType, onClose, interfaceColors }: StylePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1) // -1 = nothing selected yet
  const [hasInteracted, setHasInteracted] = useState(false)

  // Get store actions directly
  const setMasterTheme = useStyleStore((s) => s.setMasterTheme)
  const setColor = useStyleStore((s) => s.setColor)
  const setTypography = useStyleStore((s) => s.setTypography)
  const setCanvas = useStyleStore((s) => s.setCanvas)
  const setLayout = useStyleStore((s) => s.setLayout)
  const saveCustomStyle = useStyleStore((s) => s.saveCustomStyle)
  const customStyles = useStyleStore((s) => s.customStyles)

  // Get presets config
  const config = panelType ? getPresets(panelType) : null

  // Get the appropriate setter for this panel type
  const handleSelect = useCallback((presetId: string) => {
    console.debug('[StylePanel] handleSelect called:', panelType, presetId)
    setHasInteracted(true)

    switch (panelType) {
      case 'themes':
        console.debug('[StylePanel] Calling setMasterTheme')
        setMasterTheme(presetId)
        break
      case 'colors':
        console.debug('[StylePanel] Calling setColor with:', presetId)
        setColor(presetId)
        console.debug('[StylePanel] setColor completed')
        break
      case 'typography':
        console.debug('[StylePanel] Calling setTypography')
        setTypography(presetId)
        break
      case 'canvas':
        console.debug('[StylePanel] Calling setCanvas')
        setCanvas(presetId)
        break
      case 'layout':
        console.debug('[StylePanel] Calling setLayout')
        setLayout(presetId)
        break
    }
  }, [panelType, setMasterTheme, setColor, setTypography, setCanvas, setLayout])

  // Reset state when panel changes
  useEffect(() => {
    setSelectedIndex(-1)
    setHasInteracted(false)
  }, [panelType])

  // Keyboard navigation
  useEffect(() => {
    if (!panelType || !config) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          {
            const newIndex = selectedIndex < 0 ? 0 : Math.min(selectedIndex + 1, config.presets.length - 1)
            setSelectedIndex(newIndex)
            if (config.presets[newIndex]) {
              handleSelect(config.presets[newIndex].id)
            }
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          {
            const newIndex = selectedIndex < 0 ? config.presets.length - 1 : Math.max(selectedIndex - 1, 0)
            setSelectedIndex(newIndex)
            if (config.presets[newIndex]) {
              handleSelect(config.presets[newIndex].id)
            }
          }
          break
        case 'Enter':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [panelType, config, selectedIndex, onClose, handleSelect])

  // Click outside to close
  useEffect(() => {
    if (!panelType) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [panelType, onClose])

  // Handle save current style
  const handleSaveStyle = useCallback(() => {
    const name = window.prompt('Enter a name for this style:')
    if (name?.trim()) {
      saveCustomStyle(name.trim())
    }
  }, [saveCustomStyle])

  // Don't render anything when no panel is active
  if (!panelType || !config) return null

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 bottom-0 flex flex-col z-40"
      style={{
        width: '220px',
        backgroundColor: interfaceColors.bg,
        borderLeft: `1px solid ${interfaceColors.border}`,
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: '15px',
          backgroundColor: interfaceColors.bgSurface,
          borderBottom: `1px solid ${interfaceColors.border}`,
        }}
      >
        <h2 className="font-semibold text-sm" style={{ color: interfaceColors.textPrimary }}>
          {config.title}
        </h2>
        <span className="text-xs" style={{ color: interfaceColors.textMuted }}>
          ↑↓ Enter Esc
        </span>
      </div>

      {/* Scrollable preset list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '15px' }}>
        {config.presets.map((preset, index) => {
          // Only show as selected if user has interacted
          const isSelected = hasInteracted && selectedIndex === index

          return (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedIndex(index)
                handleSelect(preset.id)
              }}
              className="w-full text-xs text-left rounded truncate transition-colors mb-1"
              style={{
                padding: '8px 12px',
                backgroundColor: isSelected ? interfaceColors.bgSurface : 'transparent',
                color: isSelected ? interfaceColors.textPrimary : interfaceColors.textSecondary,
                border: isSelected
                  ? `1px solid ${interfaceColors.border}`
                  : '1px solid transparent',
              }}
              title={preset.name}
            >
              {preset.name}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div
        className="shrink-0"
        style={{
          padding: '15px',
          backgroundColor: interfaceColors.bgSurface,
          borderTop: `1px solid ${interfaceColors.border}`,
        }}
      >
        <button
          onClick={handleSaveStyle}
          className="w-full text-xs font-medium rounded transition-colors"
          style={{
            padding: '8px 12px',
            backgroundColor: interfaceColors.bg,
            border: `1px solid ${interfaceColors.border}`,
            color: interfaceColors.textPrimary,
          }}
        >
          Save Current Style
        </button>
        {customStyles.length > 0 && (
          <p className="text-xs text-center mt-2" style={{ color: interfaceColors.textMuted }}>
            {customStyles.length} saved
          </p>
        )}
      </div>
    </div>
  )
}

export default StylePanel
