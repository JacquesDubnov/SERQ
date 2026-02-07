/**
 * Section Migration
 *
 * Migrates a flat-block document (doc > block+) to section-based
 * structure (doc > section+ > (block | container)+).
 *
 * Smart splitting: breaks at H1/H2 headings.
 * Fallback: wraps everything in one section.
 *
 * Runs synchronously BEFORE editor initialization, on the JSON/PMNode
 * passed to setContent(). The editor never sees the old format.
 */

import { Node as PMNode, Schema, NodeType } from '@tiptap/pm/model'

export function migrateToSections(doc: PMNode, schema: Schema): PMNode {
  const sectionType = schema.nodes.section
  if (!sectionType) return doc

  // Already migrated?
  const firstChild = doc.content.firstChild
  if (firstChild?.type.name === 'section') return doc

  try {
    return smartMigrate(doc, schema, sectionType)
  } catch (e) {
    console.warn('[SERQ Migration] Smart migration failed, using fallback:', e)
    return fallbackMigrate(doc, schema, sectionType)
  }
}

function smartMigrate(
  doc: PMNode,
  schema: Schema,
  sectionType: NodeType,
): PMNode {
  const sections: PMNode[] = []
  let currentBlocks: PMNode[] = []

  doc.forEach((child) => {
    // Split at H1 and H2 headings
    if (child.type.name === 'heading' && (child.attrs.level as number) <= 2) {
      // Flush accumulated blocks as a section
      if (currentBlocks.length > 0) {
        sections.push(createSection(sectionType, currentBlocks))
        currentBlocks = []
      }
      // Start new section with this heading
      currentBlocks.push(child)
    } else {
      currentBlocks.push(child)
    }
  })

  // Flush remaining blocks
  if (currentBlocks.length > 0) {
    sections.push(createSection(sectionType, currentBlocks))
  }

  // Empty doc edge case
  if (sections.length === 0) {
    const paragraph = schema.nodes.paragraph.create()
    sections.push(sectionType.create({ sectionId: generateUUID() }, [paragraph]))
  }

  const newDoc = schema.nodes.doc.create(doc.attrs, sections)

  // Validate: node.check() throws on invalid structure (does NOT return boolean)
  try {
    newDoc.check()
  } catch (validationError) {
    throw new Error(
      `Migrated document failed schema validation: ${validationError}`
    )
  }

  return newDoc
}

function fallbackMigrate(
  doc: PMNode,
  schema: Schema,
  sectionType: NodeType,
): PMNode {
  const blocks: PMNode[] = []
  doc.forEach((child) => blocks.push(child))

  if (blocks.length === 0) {
    blocks.push(schema.nodes.paragraph.create())
  }

  const section = sectionType.create({ sectionId: generateUUID() }, blocks)
  return schema.nodes.doc.create(doc.attrs, [section])
}

function createSection(
  sectionType: NodeType,
  blocks: PMNode[],
): PMNode {
  const firstBlock = blocks[0]
  const level = firstBlock?.type.name === 'heading'
    ? (firstBlock.attrs.level as number)
    : null

  return sectionType.create(
    { sectionId: generateUUID(), level },
    blocks,
  )
}

/**
 * UUID generator. Uses crypto.randomUUID() when available.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
