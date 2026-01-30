/**
 * Preset Section Component
 * Accordion section containing preset buttons for a category
 */

import { useState, useMemo } from 'react'
import { PresetButton } from './PresetButton'

interface Preset {
  id: string
  name: string
}

interface PresetSectionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  presets: Preset[]
  currentPresetId: string
  recentPresetIds: string[]
  onSelectPreset: (presetId: string) => void
  customPresets?: Preset[]
}

export function PresetSection({
  title,
  isExpanded,
  onToggle,
  presets,
  currentPresetId,
  recentPresetIds,
  onSelectPreset,
  customPresets = [],
}: PresetSectionProps) {
  const [filterText, setFilterText] = useState('')

  // Filter presets by name
  const filteredPresets = useMemo(() => {
    if (!filterText.trim()) return presets
    const lower = filterText.toLowerCase()
    return presets.filter((p) => p.name.toLowerCase().includes(lower))
  }, [presets, filterText])

  // Get recent presets (those that exist in the preset list)
  const recentPresets = useMemo(() => {
    return recentPresetIds
      .map((id) => presets.find((p) => p.id === id) || customPresets.find((p) => p.id === id))
      .filter((p): p is Preset => p !== undefined)
      .slice(0, 5)
  }, [recentPresetIds, presets, customPresets])

  return (
    <div className="border-b border-gray-200">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Accordion Content */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Filter Input */}
          <input
            type="text"
            placeholder="Filter presets..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Recently Used */}
          {recentPresets.length > 0 && !filterText && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Recently Used
              </p>
              <div className="grid grid-cols-2 gap-2">
                {recentPresets.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    name={preset.name}
                    isActive={preset.id === currentPresetId}
                    isCustom={customPresets.some((c) => c.id === preset.id)}
                    onClick={() => onSelectPreset(preset.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Presets */}
          {customPresets.length > 0 && !filterText && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Custom
              </p>
              <div className="grid grid-cols-2 gap-2">
                {customPresets.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    name={preset.name}
                    isActive={preset.id === currentPresetId}
                    isCustom
                    onClick={() => onSelectPreset(preset.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Presets */}
          <div>
            {(recentPresets.length > 0 || customPresets.length > 0) && !filterText && (
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                All Presets
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
              {filteredPresets.map((preset) => (
                <PresetButton
                  key={preset.id}
                  name={preset.name}
                  isActive={preset.id === currentPresetId}
                  onClick={() => onSelectPreset(preset.id)}
                />
              ))}
            </div>
            {filteredPresets.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No presets match "{filterText}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PresetSection
