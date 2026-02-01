import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * TableWidthLimit Extension
 * Prevents table columns from being resized beyond the editor container width.
 *
 * Uses MutationObserver during resize (detected by resize-cursor class) to cap
 * table width when it would overflow the container.
 *
 * TODO: Internal column resize behavior is erratic - needs polish pass later.
 * The current solution prevents overflow but column proportions can shift unexpectedly.
 */
export const TableWidthLimit = Extension.create({
  name: 'tableWidthLimit',

  addProseMirrorPlugins() {
    const editor = this.editor
    let observer: MutationObserver | null = null
    let isAdjusting = false

    return [
      new Plugin({
        key: new PluginKey('tableWidthLimit'),

        view: () => ({
          update: () => {
            if (observer) return

            const editorElement = editor.view.dom

            observer = new MutationObserver(() => {
              if (isAdjusting) return

              // Only cap during resize (TipTap adds resize-cursor class)
              if (!editorElement.classList.contains('resize-cursor')) {
                return
              }

              const containerWidth = editorElement.clientWidth
              const tables = editorElement.querySelectorAll('table')

              tables.forEach((table) => {
                const tableEl = table as HTMLElement
                const tableWidth = tableEl.offsetWidth

                if (tableWidth > containerWidth) {
                  isAdjusting = true
                  tableEl.style.setProperty('width', `${containerWidth}px`, 'important')
                  tableEl.style.setProperty('max-width', `${containerWidth}px`, 'important')
                  tableEl.classList.add('width-capped')
                  setTimeout(() => { isAdjusting = false }, 0)
                }
              })
            })

            // Clean up on mouseup: remove cap class and reset cursor
            const handleMouseUp = () => {
              const cappedTables = editorElement.querySelectorAll('table.width-capped')
              cappedTables.forEach((table) => {
                ;(table as HTMLElement).classList.remove('width-capped')
              })
              // Force remove resize cursor if still present
              editorElement.classList.remove('resize-cursor')
              document.body.style.cursor = ''
            }

            document.addEventListener('mouseup', handleMouseUp)

            observer.observe(editorElement, {
              attributes: true,
              attributeFilter: ['style', 'class'],
              subtree: true,
              childList: true,
            })
          },

          destroy: () => {
            if (observer) {
              observer.disconnect()
              observer = null
            }
          },
        }),

        filterTransaction: (transaction) => {
          if (!transaction.docChanged) return true

          const editorElement = editor.view.dom
          const containerWidth = editorElement.clientWidth
          const defaultCellWidth = 100

          let wouldOverflow = false

          transaction.doc.descendants((node) => {
            if (node.type.name === 'table' && !wouldOverflow) {
              let totalWidth = 0
              const firstRow = node.firstChild

              if (firstRow) {
                firstRow.forEach((cell) => {
                  const colwidth = cell.attrs.colwidth
                  if (colwidth && Array.isArray(colwidth)) {
                    colwidth.forEach((w: number) => {
                      totalWidth += w || defaultCellWidth
                    })
                  } else {
                    totalWidth += defaultCellWidth
                  }
                })

                if (totalWidth > containerWidth) {
                  wouldOverflow = true
                }
              }
            }
          })

          return !wouldOverflow
        },
      }),
    ]
  },
})
