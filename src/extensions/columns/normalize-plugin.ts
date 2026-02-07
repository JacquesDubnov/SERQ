/**
 * Column Block Normalization Plugin
 *
 * appendTransaction safety net that runs after every transaction to:
 * 1. Delete empty columns (e.g., after drag-extracting content)
 * 2. Unwrap nested columnBlocks found inside columns
 * 3. Auto-unwrap columnBlocks with 0-1 columns remaining
 * 4. Sync column count attribute with actual child count
 * 5. Validate child column widths sum to ~1.0
 *
 * Column widths are now stored on Column children (Column.attrs.width),
 * NOT on the ColumnBlock parent. The normalize plugin reads/writes widths
 * on the children directly.
 *
 * Multi-pass: ProseMirror re-runs appendTransaction when the doc changes,
 * so deleting an empty column (rule 1) cascades into auto-unwrap (rule 3)
 * on the next pass if only one column remains.
 */

import { Plugin } from '@tiptap/pm/state'
import type { Node as PMNode } from '@tiptap/pm/model'

/**
 * Generate equal widths for N columns.
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

      if (!columnBlockType || !columnType) return null

      const paragraphType = schema.nodes.paragraph
      let hasChanges = false

      doc.descendants((node, pos) => {
        if (node.type !== columnBlockType) return true

        // 1. Delete empty columns (e.g., after dragging content out).
        const emptyColumns: { from: number; to: number }[] = []
        node.forEach((column, offset) => {
          if (column.type === columnType && column.childCount === 0) {
            const colPos = pos + 1 + offset
            emptyColumns.push({ from: colPos, to: colPos + column.nodeSize })
          }
        })
        // Only delete if at least one non-empty column would remain
        const nonEmptyCount = node.childCount - emptyColumns.length
        if (emptyColumns.length > 0 && nonEmptyCount >= 1) {
          for (let i = emptyColumns.length - 1; i >= 0; i--) {
            tr.delete(emptyColumns[i].from, emptyColumns[i].to)
          }
          hasChanges = true
          return false
        }

        // 2. Unwrap nested columnBlocks inside columns
        node.forEach((column, columnOffset) => {
          if (column.type !== columnType) return

          column.forEach((child, childOffset) => {
            if (child.type === columnBlockType) {
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
          return false
        }

        // 4. Sync column count attribute when it doesn't match
        if (attrs.columns !== columnCount && columnCount >= 2 && columnCount <= 4) {
          tr.setNodeMarkup(pos, undefined, {
            ...attrs,
            columns: columnCount,
          })
          hasChanges = true
        }

        // 5. Validate child column widths sum to ~1.0
        const childWidths: number[] = []
        node.forEach((column) => {
          if (column.type === columnType) {
            childWidths.push((column.attrs.width as number) || 0)
          }
        })

        const sum = childWidths.reduce((a, b) => a + b, 0)
        if (childWidths.length !== columnCount || Math.abs(sum - 1.0) > 0.01) {
          // Reset all column children to equal widths
          const newWidths = equalWidths(columnCount)
          let childIndex = 0
          node.forEach((column, offset) => {
            if (column.type === columnType) {
              const colPos = pos + 1 + offset
              const mappedPos = tr.mapping.map(colPos)
              const mappedCol = tr.doc.nodeAt(mappedPos)
              if (mappedCol && mappedCol.type === columnType) {
                tr.setNodeMarkup(mappedPos, undefined, {
                  ...mappedCol.attrs,
                  width: newWidths[childIndex],
                })
              }
              childIndex++
            }
          })
          hasChanges = true
        }

        // Don't descend into columnBlock children
        return false
      })

      // 6. Strip orphaned column nodes (column without columnBlock parent).
      //    These can appear from corruption or paste operations.
      doc.descendants((node, pos) => {
        if (node.type !== columnType) return true
        // Check parent: valid column must be inside a columnBlock
        const $pos = doc.resolve(pos)
        const parent = $pos.parent
        if (parent.type !== columnBlockType) {
          // Orphaned column -- unwrap its content
          const contentNodes: PMNode[] = []
          node.forEach((child) => contentNodes.push(child))
          if (contentNodes.length === 0) {
            contentNodes.push(paragraphType.create())
          }
          const mappedPos = tr.mapping.map(pos)
          const mappedNode = tr.doc.nodeAt(mappedPos)
          if (mappedNode && mappedNode.type === columnType) {
            tr.replaceWith(mappedPos, mappedPos + mappedNode.nodeSize, contentNodes)
            hasChanges = true
          }
        }
        return false // don't descend into column
      })

      // 7. Sync section.level with first heading child (optional, advisory).
      //    Only writes when the mapped node's level actually differs,
      //    preventing unnecessary transaction cycles.
      const sectionType = schema.nodes.section
      if (sectionType) {
        doc.descendants((node, pos) => {
          if (node.type !== sectionType) return true

          const firstChild = node.firstChild
          let expectedLevel: number | null = null

          if (firstChild && firstChild.type.name === 'heading') {
            expectedLevel = firstChild.attrs.level as number
          }

          // Check against the MAPPED node (post-earlier-fixes), not the original
          const mappedPos = tr.mapping.map(pos)
          const mappedNode = tr.doc.nodeAt(mappedPos)
          if (mappedNode && mappedNode.type === sectionType) {
            const mappedLevel = mappedNode.attrs.level as number | null
            if (mappedLevel !== expectedLevel) {
              tr.setNodeMarkup(mappedPos, undefined, {
                ...mappedNode.attrs,
                level: expectedLevel,
              })
              hasChanges = true
            }
          }

          return false // don't descend into section for this check
        })
      }

      return hasChanges ? tr : null
    },
  })
}
