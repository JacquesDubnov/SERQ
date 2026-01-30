/**
 * Master Theme Section Component
 * Shows 33 predefined theme combinations (STYLE-04)
 */

import { useState, useMemo } from 'react'
import { MASTER_THEMES, type MasterTheme } from '../../lib/presets'

interface MasterThemeSectionProps {
  isExpanded: boolean
  onToggle: () => void
  currentMasterTheme: string | null
  recentMasterThemes: string[]
  onSelectTheme: (themeId: string) => void
}

// Group themes by category for better organization
const THEME_CATEGORIES = [
  { id: 'writing', name: 'Writing Modes', themes: ['novelist', 'journalist', 'academic', 'screenwriter', 'blogger', 'legal-professional', 'technical-writer', 'creative-writer', 'essayist', 'minimalist'] },
  { id: 'dark', name: 'Dark Modes', themes: ['night-owl', 'deep-focus', 'dark-novelist', 'midnight-coder', 'noir', 'purple-haze', 'ocean-night', 'forest-night'] },
  { id: 'nature', name: 'Nature Inspired', themes: ['sunrise', 'ocean-breeze', 'forest-morning', 'autumn-leaves', 'spring-bloom', 'desert-sand'] },
  { id: 'professional', name: 'Professional', themes: ['corporate', 'presentation', 'manuscript', 'letter'] },
  { id: 'creative', name: 'Creative', themes: ['vintage', 'romantic', 'dreamy', 'bold-statement', 'serq-default'] },
]

interface ThemeCardProps {
  theme: MasterTheme
  isActive: boolean
  onClick: () => void
}

function ThemeCard({ theme, isActive, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg border-2 text-left transition-all
        ${
          isActive
            ? 'border-blue-500 bg-blue-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <p className={`font-medium text-sm ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
        {theme.name}
      </p>
      <p className="text-xs text-gray-500 mt-1 truncate">
        {theme.typography} + {theme.colors}
      </p>
    </button>
  )
}

export function MasterThemeSection({
  isExpanded,
  onToggle,
  currentMasterTheme,
  recentMasterThemes,
  onSelectTheme,
}: MasterThemeSectionProps) {
  const [filterText, setFilterText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get theme objects from IDs
  const getTheme = (id: string): MasterTheme | undefined =>
    MASTER_THEMES.find((t) => t.id === id)

  // Filter themes
  const filteredThemes = useMemo(() => {
    let themes = MASTER_THEMES

    // Filter by category
    if (selectedCategory) {
      const category = THEME_CATEGORIES.find((c) => c.id === selectedCategory)
      if (category) {
        themes = themes.filter((t) => category.themes.includes(t.id))
      }
    }

    // Filter by text
    if (filterText.trim()) {
      const lower = filterText.toLowerCase()
      themes = themes.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.typography.toLowerCase().includes(lower) ||
          t.colors.toLowerCase().includes(lower)
      )
    }

    return themes
  }, [filterText, selectedCategory])

  // Recent themes
  const recentThemes = useMemo(() => {
    return recentMasterThemes
      .map((id) => getTheme(id))
      .filter((t): t is MasterTheme => t !== undefined)
      .slice(0, 3)
  }, [recentMasterThemes])

  return (
    <div className="border-b border-gray-200">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <span className="font-medium text-gray-900">Master Themes</span>
          {currentMasterTheme && (
            <span className="ml-2 text-sm text-blue-600">
              ({getTheme(currentMasterTheme)?.name || 'Custom'})
            </span>
          )}
          {!currentMasterTheme && (
            <span className="ml-2 text-sm text-gray-400">(Custom mix)</span>
          )}
        </div>
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
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Filter Input */}
          <input
            type="text"
            placeholder="Search themes..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {THEME_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Recently Used */}
          {recentThemes.length > 0 && !filterText && !selectedCategory && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Recently Used
              </p>
              <div className="grid grid-cols-1 gap-2">
                {recentThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={theme.id === currentMasterTheme}
                    onClick={() => onSelectTheme(theme.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Theme Grid */}
          <div>
            {(recentThemes.length > 0 && !filterText && !selectedCategory) && (
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                All Themes
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={theme.id === currentMasterTheme}
                  onClick={() => onSelectTheme(theme.id)}
                />
              ))}
            </div>
            {filteredThemes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No themes match your search
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterThemeSection
