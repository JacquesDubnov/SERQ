/**
 * Column Block Commands
 *
 * TipTap commands for creating, modifying, and removing column layouts.
 * All commands use the standard TipTap command pattern with { tr, dispatch }.
 */

import { type Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnBlock: {
      /**
       * Create a columnBlock at the current cursor position.
       * Wraps the current block content into the first column.
       */
      setColumns: (count: 2 | 3 | 4) => ReturnType
      /**
       * Unwrap a columnBlock, concatenating all column content back to doc flow.
       */
      unsetColumns: () => ReturnType
      /**
       * Add a column to the current columnBlock (max 4).
       */
      addColumn: () => ReturnType
      /**
       * Remove a column by index (min 2). Content moves to adjacent column.
       */
      removeColumn: (index: number) => ReturnType
      /**
       * Set column width fractions directly.
       */
      setColumnWidths: (widths: number[]) => ReturnType
      /**
       * Set gutter width in pixels.
       */
      setColumnGutter: (gutter: number) => ReturnType
    }
  }
}

/**
 * Find the nearest columnBlock ancestor from the current selection.
 * Returns { pos, node, depth } or null if not inside a columnBlock.
 */
function findColumnBlock(editor: Editor): { pos: number; node: PMNode; depth: number } | null {
  const { selection } = editor.state
  const { $from } = selection

  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d)
    if (node.type.name === 'columnBlock') {
      return { pos: $from.before(d), node, depth: d }
    }
  }

  return null
}

/**
 * Generate equal width fractions for N columns.
 * e.g. 3 columns -> [0.3333, 0.3333, 0.3334] (sums to 1.0)
 */
function equalWidths(count: number): number[] {
  const base = Math.floor((1 / count) * 10000) / 10000
  const widths = Array(count).fill(base)
  // Fix rounding: last column gets the remainder
  widths[count - 1] = +(1 - base * (count - 1)).toFixed(4)
  return widths
}

export function addColumnCommands(/* _extension: any */) {
  return {
    setColumns:
      (count: 2 | 3 | 4) =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const schema = editor.state.schema

        // Read position from the transaction (not editor.state) since
        // the slash menu may have already modified the doc in this tr
        const $from = tr.selection.$from

        // Don't allow creating columns inside existing columns
        for (let d = $from.depth; d >= 0; d--) {
          if ($from.node(d).type.name === 'columnBlock' || $from.node(d).type.name === 'column') {
            return false
          }
        }

        // Find the top-level block the cursor is in (depth 1 = direct child of doc)
        let blockPos: number | null = null
        let blockNode: PMNode | null = null
        for (let d = $from.depth; d >= 1; d--) {
          if (d === 1) {
            blockPos = $from.before(d)
            blockNode = $from.node(d)
            break
          }
        }

        // Build the column content
        const columns: PMNode[] = []
        const columnType = schema.nodes.column
        const paragraphType = schema.nodes.paragraph

        // First column gets the current block content (or an empty paragraph)
        if (blockNode && blockNode.content.size > 0) {
          columns.push(columnType.create(null, blockNode))
        } else {
          columns.push(columnType.create(null, paragraphType.create()))
        }

        // Remaining columns get empty paragraphs
        for (let i = 1; i < count; i++) {
          columns.push(columnType.create(null, paragraphType.create()))
        }

        const columnBlockNode = schema.nodes.columnBlock.create(
          {
            columns: count,
            columnWidths: equalWidths(count),
            gutter: 24,
          },
          columns,
        )

        if (!dispatch) return true // Can-run check

        if (blockPos !== null && blockNode) {
          tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, columnBlockNode)
        } else {
          tr.replaceSelectionWith(columnBlockNode)
        }

        // Place cursor at the first valid text position inside the columnBlock
        // (first paragraph of first column). Use findFrom to search forward
        // rather than hardcoding offsets that break across NodeView wrappers.
        try {
          const insertPos = blockPos !== null ? blockPos : tr.selection.from
          const $start = tr.doc.resolve(insertPos + 1) // Just inside columnBlock
          const sel = TextSelection.findFrom($start, 1) // Search forward
          if (sel) tr.setSelection(sel)
        } catch {
          // Let ProseMirror auto-resolve if position math fails
        }

        dispatch(tr)
        return true
      },

    unsetColumns:
      () =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const result = findColumnBlock(editor)
        if (!result) return false

        const { pos, node } = result

        // Collect all content from all columns
        const contentNodes: PMNode[] = []
        node.forEach((column) => {
          column.forEach((child) => {
            contentNodes.push(child)
          })
        })

        if (!dispatch) return true

        tr.replaceWith(pos, pos + node.nodeSize, contentNodes)
        dispatch(tr)
        return true
      },

    addColumn:
      () =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const result = findColumnBlock(editor)
        if (!result) return false

        const { pos, node } = result
        const currentCount = node.childCount
        if (currentCount >= 4) return false

        if (!dispatch) return true

        const schema = editor.state.schema
        const newColumn = schema.nodes.column.create(null, schema.nodes.paragraph.create())

        const newCount = currentCount + 1
        const newWidths = equalWidths(newCount)

        // Insert the new column at the end of the columnBlock
        const insertPos = pos + node.nodeSize - 1 // Before closing tag
        tr.insert(insertPos, newColumn)
          .setNodeMarkup(pos, undefined, {
            ...node.attrs,
            columns: newCount,
            columnWidths: newWidths,
          })

        dispatch(tr)
        return true
      },

    removeColumn:
      (index: number) =>
      ({ dispatch, editor }: { dispatch: any; editor: Editor }) => {
        const result = findColumnBlock(editor)
        if (!result) return false

        const { pos, node } = result
        const currentCount = node.childCount
        if (currentCount <= 2) {
          // At minimum columns -- unwrap instead
          return editor.commands.unsetColumns()
        }

        if (index < 0 || index >= currentCount) return false
        if (!dispatch) return true

        const tr = editor.state.tr

        // Find the column to remove and its position
        let columnStart = pos + 1 // After columnBlock opening
        for (let i = 0; i < index; i++) {
          columnStart += node.child(i).nodeSize
        }
        const columnEnd = columnStart + node.child(index).nodeSize

        // Move content from removed column to the adjacent column
        const removedColumn = node.child(index)
        const targetIndex = index > 0 ? index - 1 : 1
        let targetEnd = pos + 1
        for (let i = 0; i <= targetIndex; i++) {
          targetEnd += node.child(i).nodeSize
        }
        targetEnd -= 1 // Before target column's closing tag

        // Collect content from the removed column
        const contentNodes: PMNode[] = []
        removedColumn.forEach((child) => {
          contentNodes.push(child)
        })

        const newCount = currentCount - 1
        const newWidths = equalWidths(newCount)

        // First insert content into target, then delete the column
        // Order matters: insert first (higher pos), then delete (lower pos changes)
        if (index <= targetIndex) {
          // Removing before target -- adjust positions after delete
          tr.delete(columnStart, columnEnd)
          // Position shifted after delete
          const adjustedTargetEnd = targetEnd - (columnEnd - columnStart) - 1
          if (contentNodes.length > 0) {
            tr.insert(adjustedTargetEnd, contentNodes)
          }
        } else {
          // Removing after target -- insert first
          if (contentNodes.length > 0) {
            tr.insert(targetEnd, contentNodes)
          }
          // Position shifted after insert
          const contentSize = contentNodes.reduce((sum, n) => sum + n.nodeSize, 0)
          tr.delete(columnStart + contentSize, columnEnd + contentSize)
        }

        // Update attributes
        tr.setNodeMarkup(tr.mapping.map(pos), undefined, {
          ...node.attrs,
          columns: newCount,
          columnWidths: newWidths,
        })

        editor.view.dispatch(tr)
        return true
      },

    setColumnWidths:
      (widths: number[]) =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const result = findColumnBlock(editor)
        if (!result) return false

        if (!dispatch) return true

        const { pos, node } = result
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          columnWidths: widths,
        })

        dispatch(tr)
        return true
      },

    setColumnGutter:
      (gutter: number) =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const result = findColumnBlock(editor)
        if (!result) return false

        if (!dispatch) return true

        const { pos, node } = result
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          gutter,
        })

        dispatch(tr)
        return true
      },
  }
}
