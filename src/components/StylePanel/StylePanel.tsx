/**
 * Style Panel Component
 * Slide-in panel from right side with accordion sections for presets
 */

import { useState, useEffect, useCallback } from 'react'
import { useStyleStore } from '../../stores/styleStore'
import {
  TYPOGRAPHY_PRESETS,
  COLOR_PRESETS,
  CANVAS_PRESETS,
  LAYOUT_PRESETS,
} from '../../lib/presets'
import { PresetSection } from './PresetSection'
import { MasterThemeSection } from './MasterThemeSection'

interface StylePanelProps {
  isOpen: boolean
  onClose: () => void
}

type AccordionSection =
  | 'masterThemes'
  | 'typography'
  | 'colors'
  | 'canvas'
  | 'layout'
  | null

export function StylePanel({ isOpen, onClose }: StylePanelProps) {
  // Only typography expanded by default
  const [expandedSection, setExpandedSection] =
    useState<AccordionSection>('typography')

  const {
    currentTypography,
    currentColor,
    currentCanvas,
    currentLayout,
    currentMasterTheme,
    recentTypography,
    recentColors,
    recentCanvas,
    recentLayout,
    recentMasterThemes,
    customStyles,
    setTypography,
    setColor,
    setCanvas,
    setLayout,
    setMasterTheme,
    resetToDefaults,
    saveCustomStyle,
  } = useStyleStore()

  // Toggle section - only one open at a time
  const toggleSection = useCallback((section: AccordionSection) => {
    setExpandedSection((current) => (current === section ? null : section))
  }, [])

  // Keyboard shortcut to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle save current style
  const handleSaveStyle = useCallback(() => {
    const name = window.prompt('Enter a name for this style:')
    if (name?.trim()) {
      saveCustomStyle(name.trim())
    }
  }, [saveCustomStyle])

  return (
    <>
      {/* Panel */}
      <div
        className={`
          fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg
          transform transition-transform duration-200 ease-out z-40
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={
          {
            '--panel-width': '320px',
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Styles</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title="Reset to defaults"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title="Close (Esc)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100%-120px)] overflow-y-auto">
          {/* Master Themes Section (STYLE-04) */}
          <MasterThemeSection
            isExpanded={expandedSection === 'masterThemes'}
            onToggle={() => toggleSection('masterThemes')}
            currentMasterTheme={currentMasterTheme}
            recentMasterThemes={recentMasterThemes}
            onSelectTheme={setMasterTheme}
          />

          {/* Typography Section */}
          <PresetSection
            title="Typography"
            isExpanded={expandedSection === 'typography'}
            onToggle={() => toggleSection('typography')}
            presets={TYPOGRAPHY_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
            currentPresetId={currentTypography}
            recentPresetIds={recentTypography}
            onSelectPreset={setTypography}
          />

          {/* Colors Section */}
          <PresetSection
            title="Colors"
            isExpanded={expandedSection === 'colors'}
            onToggle={() => toggleSection('colors')}
            presets={COLOR_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
            currentPresetId={currentColor}
            recentPresetIds={recentColors}
            onSelectPreset={setColor}
          />

          {/* Canvas Section */}
          <PresetSection
            title="Canvas"
            isExpanded={expandedSection === 'canvas'}
            onToggle={() => toggleSection('canvas')}
            presets={CANVAS_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
            currentPresetId={currentCanvas}
            recentPresetIds={recentCanvas}
            onSelectPreset={setCanvas}
          />

          {/* Layout Section (STYLE-03) */}
          <PresetSection
            title="Layout"
            isExpanded={expandedSection === 'layout'}
            onToggle={() => toggleSection('layout')}
            presets={LAYOUT_PRESETS.map((p) => ({ id: p.id, name: p.name }))}
            currentPresetId={currentLayout}
            recentPresetIds={recentLayout}
            onSelectPreset={setLayout}
          />
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={handleSaveStyle}
            className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Save Current Style
          </button>
          {customStyles.length > 0 && (
            <p className="text-xs text-center text-gray-500">
              {customStyles.length} custom style{customStyles.length !== 1 ? 's' : ''} saved
            </p>
          )}
        </div>
      </div>

      {/* Overlay (for mobile/tablet) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}

export default StylePanel
