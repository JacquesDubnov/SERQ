import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react'
import type { SlashCommandItem, SlashCommandGroup } from './commands'
import { slashCommandGroupLabels, getGroupedSlashCommands } from './commands'
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
 * Displays commands grouped by category with shortcuts
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)
    const selectedRef = useRef<HTMLButtonElement>(null)

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    // Scroll selected item into view
    useEffect(() => {
      if (selectedRef.current) {
        selectedRef.current.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }, [selectedIndex])

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
        <div className="slash-menu" ref={menuRef}>
          <div className="slash-menu-empty">No results</div>
        </div>
      )
    }

    // Group items for display when showing all commands (no filter)
    const showGrouped = items.length > 10

    if (showGrouped) {
      // Get grouped commands that match the filtered items
      const groupedAll = getGroupedSlashCommands()
      const itemSet = new Set(items.map((i) => i.title))

      // Filter each group to only show items that are in the filtered set
      const grouped: Partial<Record<SlashCommandGroup, SlashCommandItem[]>> = {}
      for (const [group, cmds] of Object.entries(groupedAll)) {
        const filtered = cmds.filter((c) => itemSet.has(c.title))
        if (filtered.length > 0) {
          grouped[group as SlashCommandGroup] = filtered
        }
      }

      // Build flat list for indexing
      const flatList: SlashCommandItem[] = []
      for (const group of Object.keys(grouped) as SlashCommandGroup[]) {
        flatList.push(...(grouped[group] || []))
      }

      // Find which group/item the selected index corresponds to
      let currentFlatIndex = 0

      return (
        <div className="slash-menu slash-menu-grouped" ref={menuRef}>
          {(Object.keys(grouped) as SlashCommandGroup[]).map((group) => {
            const groupItems = grouped[group] || []
            const startIndex = currentFlatIndex
            currentFlatIndex += groupItems.length

            return (
              <div key={group} className="slash-menu-group">
                <div className="slash-menu-group-label">
                  {slashCommandGroupLabels[group]}
                </div>
                {groupItems.map((item, i) => {
                  const flatIndex = startIndex + i
                  const isSelected = flatIndex === selectedIndex

                  return (
                    <button
                      key={item.title}
                      ref={isSelected ? selectedRef : null}
                      className={`slash-menu-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => selectItem(flatIndex)}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      type="button"
                    >
                      <span className="slash-menu-item-icon">{item.icon}</span>
                      <div className="slash-menu-item-content">
                        <span className="slash-menu-item-title">{item.title}</span>
                        <span className="slash-menu-item-description">{item.description}</span>
                      </div>
                      {item.shortcut && (
                        <span className="slash-menu-item-shortcut">{item.shortcut}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )
    }

    // Simple flat list for filtered results
    return (
      <div className="slash-menu" ref={menuRef}>
        {items.map((item, index) => (
          <button
            key={item.title}
            ref={index === selectedIndex ? selectedRef : null}
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
            {item.shortcut && (
              <span className="slash-menu-item-shortcut">{item.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    )
  }
)

SlashMenu.displayName = 'SlashMenu'
