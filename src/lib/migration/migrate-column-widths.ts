/**
 * Column Width Migration
 *
 * Migrates column widths from parent (ColumnBlock.attrs.columnWidths)
 * to children (Column.attrs.width).
 *
 * Also strips the deprecated `gutter` attr from ColumnBlock.
 *
 * Runs as part of the document migration pass, after section wrapping.
 * Operates on the ProseMirror JSON representation for simplicity.
 */

export interface DocJSON {
  type: string
  attrs?: Record<string, unknown>
  content?: DocJSON[]
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  text?: string
}

/**
 * Walk the JSON tree and migrate column widths from parent to children.
 * Returns a new JSON tree (does not mutate the input).
 */
export function migrateColumnWidthsJSON(doc: DocJSON): DocJSON {
  return walkAndMigrate(doc)
}

function walkAndMigrate(node: DocJSON): DocJSON {
  if (!node.content) return node

  const newContent = node.content.map((child) => {
    if (child.type === 'columnBlock') {
      return migrateColumnBlock(child)
    }
    return walkAndMigrate(child)
  })

  return { ...node, content: newContent }
}

function migrateColumnBlock(node: DocJSON): DocJSON {
  const attrs = node.attrs || {}
  const columnWidths = attrs.columnWidths as number[] | null | undefined
  const children = node.content || []

  // Build new children with width attrs
  const newChildren = children.map((child, index) => {
    if (child.type !== 'column') return walkAndMigrate(child)

    const childAttrs = child.attrs || {}
    let width = childAttrs.width as number | undefined

    // If child doesn't have a width yet, try to get it from parent
    if (width == null || width === 0.5) {
      if (columnWidths && Array.isArray(columnWidths) && columnWidths[index] != null) {
        width = columnWidths[index]
      } else {
        width = 1 / children.length
      }
    }

    return {
      ...walkAndMigrate(child),
      attrs: { ...childAttrs, width },
    }
  })

  // Strip columnWidths and gutter from parent, keep columns
  const { columnWidths: _cw, gutter: _g, ...cleanAttrs } = attrs

  return {
    ...node,
    attrs: cleanAttrs,
    content: newChildren,
  }
}
