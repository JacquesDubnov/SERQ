/**
 * UUID Plugin
 *
 * Ensures every node in the document has a unique `id` attribute.
 *
 * - appendTransaction: assigns UUIDs to any node missing one after doc changes
 * - transformPasted: deduplicates UUIDs before pasted content enters the document
 *
 * This is a TipTap Extension wrapper around a ProseMirror plugin.
 */

import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Slice, Fragment } from '@tiptap/pm/model'
import { generateUUID } from '@/lib/migration'

/** Node types that receive the `id` attribute. Shared between
 *  addGlobalAttributes and the appendTransaction guard. */
const UUID_NODE_TYPES = [
  'section',
  'paragraph',
  'heading',
  'codeBlock',
  'image',
  'horizontalRule',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'columnBlock',
  'column',
]

const UUID_NODE_SET = new Set(UUID_NODE_TYPES)

export const UUIDPlugin = Extension.create({
  name: 'uuidPlugin',

  // Add `id` attr to ALL node types that support attrs
  addGlobalAttributes() {
    return [
      {
        types: UUID_NODE_TYPES,
        attributes: {
          id: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('data-id'),
            renderHTML: (attrs) => {
              if (!attrs.id) return {}
              return { 'data-id': attrs.id }
            },
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged)
          if (!docChanged) return null

          const { tr, doc } = newState
          let hasChanges = false

          doc.descendants((node, pos) => {
            // Skip text nodes and node types that don't receive UUIDs
            if (node.isText) return false
            if (!UUID_NODE_SET.has(node.type.name)) return true

            if (!node.attrs.id) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                id: generateUUID(),
              })
              hasChanges = true
            }
            return true
          })

          return hasChanges ? tr : null
        },

        props: {
          transformPasted(slice) {
            const seen = new Set<string>()
            const fragment = dedupFragment(slice.content, seen)
            return new Slice(fragment, slice.openStart, slice.openEnd)
          },
        },
      }),
    ]
  },
})

/**
 * Recursively walk a Fragment and replace duplicate UUIDs with fresh ones.
 */
function dedupFragment(fragment: Fragment, seen: Set<string>): Fragment {
  const nodes: any[] = []

  fragment.forEach((node) => {
    if (node.isText) {
      nodes.push(node)
      return
    }

    let attrs = node.attrs
    if (attrs.id) {
      if (seen.has(attrs.id)) {
        attrs = { ...attrs, id: generateUUID() }
      } else {
        seen.add(attrs.id)
      }
    }

    const newContent = node.content.size > 0
      ? dedupFragment(node.content, seen)
      : node.content

    if (attrs !== node.attrs || newContent !== node.content) {
      nodes.push(node.type.create(attrs, newContent, node.marks))
    } else {
      nodes.push(node)
    }
  })

  return Fragment.from(nodes)
}
