/**
 * Column Block Normalization Plugin
 *
 * appendTransaction safety net that runs after every transaction to:
 * 1. Ensure every columnBlock has 2-4 column children
 * 2. Insert paragraph into empty columns
 * 3. Unwrap nested columnBlocks found inside columns
 * 4. Validate width fractions sum to ~1.0
 */

import { Plugin } from '@tiptap/pm/state'
import type { Node as PMNode } from '@tiptap/pm/model'

/**
 * Generate equal widths for N columns (same as in commands.ts).
 */
function equalWidths(count: number): number[] {
  const base = Math.floor((1 / count) * 10000) / 10000
  const widths = Array(count).fill(base)
  widths[count - 1] = +(1 - base * (count - 1)).toFixed(4)
  return widths
}

export function createNormalizePlugin() {
  return new Plugin({
    appendTransaction(transactions, _oldState, newState) {
      // Only run when doc changed
      const docChanged = transactions.some((tr) => tr.docChanged)
      if (!docChanged) return null

      const { schema, doc, tr } = newState
      const columnBlockType = schema.nodes.columnBlock
      const columnType = schema.nodes.column
      const paragraphType = schema.nodes.paragraph

      if (!columnBlockType || !columnType) return null

      let hasChanges = false

      doc.descendants((node, pos) => {
        if (node.type !== columnBlockType) return true

        // 1. Check for empty columns -- insert paragraph
        node.forEach((column, offset) => {
          if (column.type === columnType && column.childCount === 0) {
            const insertPos = pos + 1 + offset + 1 // Inside the column
            tr.insert(insertPos, paragraphType.create())
            hasChanges = true
          }
        })

        // 2. Unwrap nested columnBlocks inside columns
        node.forEach((column, columnOffset) => {
          if (column.type !== columnType) return

          column.forEach((child, childOffset) => {
            if (child.type === columnBlockType) {
              // Collect all content from the nested columnBlock's columns
              const contentNodes: PMNode[] = []
              child.forEach((nestedColumn) => {
                nestedColumn.forEach((content) => {
                  contentNodes.push(content)
                })
              })

              const nestedPos = pos + 1 + columnOffset + 1 + childOffset
              tr.replaceWith(
                nestedPos,
                nestedPos + child.nodeSize,
                contentNodes.length > 0 ? contentNodes : [paragraphType.create()],
              )
              hasChanges = true
            }
          })
        })

        // 3. Auto-unwrap if only 0-1 columns remain (invalid state)
        const columnCount = node.childCount
        const attrs = node.attrs

        if (columnCount <= 1) {
          // Unwrap: pull all content out of the columnBlock
          const contentNodes: PMNode[] = []
          node.forEach((column) => {
            if (column.type === columnType) {
              column.forEach((child) => contentNodes.push(child))
            } else {
              contentNodes.push(column)
            }
          })
          if (contentNodes.length === 0) {
            contentNodes.push(paragraphType.create())
          }
          tr.replaceWith(pos, pos + node.nodeSize, contentNodes)
          hasChanges = true
          return false // Don't process further -- node is gone
        }

        // 4. Sync column count attribute when it doesn't match
        if (attrs.columns !== columnCount && columnCount >= 2 && columnCount <= 4) {
          tr.setNodeMarkup(pos, undefined, {
            ...attrs,
            columns: columnCount,
            columnWidths: equalWidths(columnCount),
          })
          hasChanges = true
        }

        // 5. Validate widths sum to ~1.0
        if (attrs.columnWidths && Array.isArray(attrs.columnWidths)) {
          const sum = attrs.columnWidths.reduce((a: number, b: number) => a + b, 0)
          if (Math.abs(sum - 1.0) > 0.01 || attrs.columnWidths.length !== columnCount) {
            tr.setNodeMarkup(pos, undefined, {
              ...attrs,
              columnWidths: equalWidths(columnCount),
            })
            hasChanges = true
          }
        }

        // Don't descend into columnBlock children (columns can't contain columnBlocks after fix)
        return false
      })

      return hasChanges ? tr : null
    },
  })
}
