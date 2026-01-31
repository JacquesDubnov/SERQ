import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react'
import type { SlashCommandItem } from './commands'
import '../../styles/slash-menu.css'

interface SlashMenuProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export interface SlashMenuRef {
  onKeyDown: (event: { event: KeyboardEvent }) => boolean
}

/**
 * Dropdown menu component for slash commands
 * Handles keyboard navigation and item selection
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    // Handle keyboard navigation
    const upHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
    }, [items.length])

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + 1) % items.length)
    }, [items.length])

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex)
    }, [selectItem, selectedIndex])

    // Expose keyboard handler to parent
    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="slash-menu">
          <div className="slash-menu-empty">No results</div>
        </div>
      )
    }

    return (
      <div className="slash-menu">
        {items.map((item, index) => (
          <button
            key={item.title}
            className={`slash-menu-item ${index === selectedIndex ? 'is-selected' : ''}`}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            type="button"
          >
            <span className="slash-menu-item-icon">{item.icon}</span>
            <div className="slash-menu-item-content">
              <span className="slash-menu-item-title">{item.title}</span>
              <span className="slash-menu-item-description">{item.description}</span>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

SlashMenu.displayName = 'SlashMenu'
