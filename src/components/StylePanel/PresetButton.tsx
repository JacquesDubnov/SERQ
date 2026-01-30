/**
 * Preset Button Component
 * Individual clickable preset in the style panel
 */

interface PresetButtonProps {
  name: string
  isActive: boolean
  isCustom?: boolean
  onClick: () => void
}

export function PresetButton({
  name,
  isActive,
  isCustom = false,
  onClick,
}: PresetButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 py-2 text-sm rounded-md border transition-all text-left w-full
        ${
          isActive
            ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        }
      `}
    >
      <span className="block truncate">{name}</span>
      {isCustom && (
        <span
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-400"
          title="Custom preset"
        />
      )}
    </button>
  )
}

export default PresetButton
