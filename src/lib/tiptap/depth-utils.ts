/**
 * Depth Utilities
 *
 * Dynamic depth resolution for SERQ's section-based document structure.
 *
 * Document structure: doc(0) > section(1) > block(2)
 * With containers:   doc(0) > section(1) > columnBlock(2) > column(3) > block(4)
 *
 * These utilities replace hardcoded `d === 1` assumptions throughout
 * the codebase. They find the correct depth by walking up the tree
 * and looking for structural boundaries (section, doc).
 */

import type { ResolvedPos } from '@tiptap/pm/model'

/** Node types that serve as structural containers above blocks */
const BLOCK_PARENTS = new Set(['section', 'doc'])

/**
 * Find the depth of the topmost "content block" at the given position.
 *
 * A "content block" is a direct child of a section (or doc, for backwards compat).
 * With sections: depth 2 (doc=0, section=1, block=2).
 * Without sections: depth 1 (doc=0, block=1).
 *
 * Returns the depth, not the position. Use $pos.before(depth) / $pos.node(depth)
 * to get position and node.
 */
export function findTopBlockDepth($pos: ResolvedPos): number {
  for (let d = $pos.depth; d >= 1; d--) {
    const parent = $pos.node(d - 1)
    if (BLOCK_PARENTS.has(parent.type.name)) {
      return d
    }
  }
  // Fallback: assume depth 1 (pre-migration or edge case)
  return Math.min(1, $pos.depth)
}

/**
 * Find the depth of the section containing the position.
 * Returns null if no section ancestor exists (pre-migration docs).
 */
export function findSectionDepth($pos: ResolvedPos): number | null {
  for (let d = $pos.depth; d >= 1; d--) {
    if ($pos.node(d).type.name === 'section') {
      return d
    }
  }
  return null
}
