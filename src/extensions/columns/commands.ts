/**
 * Column Block Commands
 *
 * TipTap commands for creating, modifying, and removing column layouts.
 * All commands use the standard TipTap command pattern with { tr, dispatch }.
 *
 * Column widths are stored on Column children (Column.attrs.width),
 * NOT on the ColumnBlock parent. Commands that change column count
 * distribute equal widths across all children.
 */

import { type Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columnBlock: {
      setColumns: (count: 2 | 3 | 4) => ReturnType
      unsetColumns: () => ReturnType
      addColumn: () => ReturnType
      removeColumn: (index: number) => ReturnType
      setColumnWidths: (widths: number[]) => ReturnType
    }
  }
}

/**
 * Find the nearest columnBlock ancestor from the current selection.
 * Walks up the depth tree dynamically -- no hardcoded depth assumptions.
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
 */
function equalWidths(count: number): number[] {
  const base = Math.floor((1 / count) * 10000) / 10000
  const widths = Array(count).fill(base)
  widths[count - 1] = +(1 - base * (count - 1)).toFixed(4)
  return widths
}

/**
 * Find the depth of the nearest block-accepting parent.
 * With sections: doc(0) > section(1) > block(2).
 * Without sections (migration): doc(0) > block(1).
 */
function findBlockDepthFromTransaction(tr: any): number {
  const $from = tr.selection.$from
  for (let d = $from.depth; d >= 1; d--) {
    const parent = $from.node(d - 1)
    // The parent that accepts blocks/containers is either 'section' or 'doc'
    if (parent.type.name === 'section' || parent.type.name === 'doc') {
      return d
    }
  }
  return 1 // fallback
}

export function addColumnCommands(/* _extension: any */) {
  return {
    setColumns:
      (count: 2 | 3 | 4) =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const schema = editor.state.schema

        const $from = tr.selection.$from

        // Don't allow creating columns inside existing columns
        for (let d = $from.depth; d >= 0; d--) {
          if ($from.node(d).type.name === 'columnBlock' || $from.node(d).type.name === 'column') {
            return false
          }
        }

        // Find the block the cursor is in (dynamically, not hardcoded d===1)
        const blockDepth = findBlockDepthFromTransaction(tr)
        const blockPos = $from.before(blockDepth)
        const blockNode = $from.node(blockDepth)

        // Build columns with width attrs
        const columns: PMNode[] = []
        const columnType = schema.nodes.column
        const paragraphType = schema.nodes.paragraph
        const widths = equalWidths(count)

        // First column gets the current block content (or an empty paragraph)
        if (blockNode && blockNode.content.size > 0) {
          columns.push(columnType.create({ width: widths[0] }, blockNode))
        } else {
          columns.push(columnType.create({ width: widths[0] }, paragraphType.create()))
        }

        // Remaining columns get empty paragraphs
        for (let i = 1; i < count; i++) {
          columns.push(columnType.create({ width: widths[i] }, paragraphType.create()))
        }

        const columnBlockNode = schema.nodes.columnBlock.create(
          { columns: count },
          columns,
        )

        if (!dispatch) return true

        tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, columnBlockNode)

        // Place cursor at the first valid text position inside the columnBlock
        try {
          const $start = tr.doc.resolve(blockPos + 1)
          const sel = TextSelection.findFrom($start, 1)
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
        const newCount = currentCount + 1
        const newWidths = equalWidths(newCount)

        // Create new column with its width
        const newColumn = schema.nodes.column.create(
          { width: newWidths[newCount - 1] },
          schema.nodes.paragraph.create(),
        )

        // Insert the new column at the end
        const insertPos = pos + node.nodeSize - 1
        tr.insert(insertPos, newColumn)

        // Update parent column count
        tr.setNodeMarkup(tr.mapping.map(pos), undefined, {
          ...node.attrs,
          columns: newCount,
        })

        // Update all existing columns to new equal widths
        const updatedBlock = tr.doc.nodeAt(tr.mapping.map(pos)) as PMNode | null
        if (updatedBlock) {
          const blockPos = tr.mapping.map(pos)
          updatedBlock.forEach((column: PMNode, offset: number, index: number) => {
            if (column.type.name === 'column') {
              const colPos = blockPos + 1 + offset
              const mappedPos = tr.mapping.map(colPos)
              const mappedCol = tr.doc.nodeAt(mappedPos) as PMNode | null
              if (mappedCol) {
                tr.setNodeMarkup(mappedPos, undefined, {
                  ...mappedCol.attrs,
                  width: newWidths[index],
                })
              }
            }
          })
        }

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
          return editor.commands.unsetColumns()
        }

        if (index < 0 || index >= currentCount) return false
        if (!dispatch) return true

        const tr = editor.state.tr

        // Find the column to remove
        let columnStart = pos + 1
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
        targetEnd -= 1

        const contentNodes: PMNode[] = []
        removedColumn.forEach((child) => {
          contentNodes.push(child)
        })

        const newCount = currentCount - 1
        const newWidths = equalWidths(newCount)

        if (index <= targetIndex) {
          tr.delete(columnStart, columnEnd)
          const adjustedTargetEnd = targetEnd - (columnEnd - columnStart) - 1
          if (contentNodes.length > 0) {
            tr.insert(adjustedTargetEnd, contentNodes)
          }
        } else {
          if (contentNodes.length > 0) {
            tr.insert(targetEnd, contentNodes)
          }
          const contentSize = contentNodes.reduce((sum, n) => sum + n.nodeSize, 0)
          tr.delete(columnStart + contentSize, columnEnd + contentSize)
        }

        // Update parent column count
        tr.setNodeMarkup(tr.mapping.map(pos), undefined, {
          ...node.attrs,
          columns: newCount,
        })

        // Update remaining column widths
        const updatedBlock = tr.doc.nodeAt(tr.mapping.map(pos)) as PMNode | null
        if (updatedBlock) {
          const blockPos = tr.mapping.map(pos)
          let childIdx = 0
          updatedBlock.forEach((column: PMNode, offset: number) => {
            if (column.type.name === 'column') {
              const colPos = blockPos + 1 + offset
              const mappedPos = tr.mapping.map(colPos)
              const mappedCol = tr.doc.nodeAt(mappedPos) as PMNode | null
              if (mappedCol) {
                tr.setNodeMarkup(mappedPos, undefined, {
                  ...mappedCol.attrs,
                  width: newWidths[childIdx],
                })
              }
              childIdx++
            }
          })
        }

        editor.view.dispatch(tr)
        return true
      },

    setColumnWidths:
      (widths: number[]) =>
      ({ tr, dispatch, editor }: { tr: any; dispatch: any; editor: Editor }) => {
        const result = findColumnBlock(editor)
        if (!result) return false

        const { pos, node } = result
        if (widths.length !== node.childCount) return false

        if (!dispatch) return true

        // Write widths to each column child using position mapping
        const childPositions: number[] = []
        node.forEach((_child, childOffset) => {
          childPositions.push(pos + 1 + childOffset)
        })

        for (let i = 0; i < childPositions.length; i++) {
          const mappedPos = tr.mapping.map(childPositions[i])
          const col = tr.doc.nodeAt(mappedPos)
          if (col && col.type.name === 'column') {
            tr.setNodeMarkup(mappedPos, undefined, {
              ...col.attrs,
              width: widths[i],
            })
          }
        }

        dispatch(tr)
        return true
      },
  }
}
