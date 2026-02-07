/**
 * Container Group Overrides
 *
 * Extends StarterKit's blockquote, bulletList, and orderedList to add
 * the 'container' group alongside their existing groups.
 *
 * This makes them valid children of section's '(block | container)+' content
 * while keeping them valid in existing 'block+' and 'block*' contexts
 * (like listItem content).
 *
 * These MUST be registered AFTER StarterKit so they override the base definitions.
 */

import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'

export const BlockquoteContainer = Blockquote.extend({
  group: 'block container',
})

export const BulletListContainer = BulletList.extend({
  group: 'block list container',
})

export const OrderedListContainer = OrderedList.extend({
  group: 'block list container',
})
