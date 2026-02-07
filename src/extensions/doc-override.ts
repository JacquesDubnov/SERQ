/**
 * Doc Override
 *
 * Replaces TipTap's default Document node to enforce section-based structure:
 *   doc > section+ > (block | container)+
 *
 * StarterKit's Document uses content: 'block+'. This override changes it
 * to 'section+' so that every block must live inside a section.
 */

import { Node } from '@tiptap/core'

export const DocOverride = Node.create({
  name: 'doc',
  topNode: true,
  content: 'section+',
})
