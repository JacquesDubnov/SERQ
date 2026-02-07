/**
 * Section Node Extension
 *
 * The unit of structural organization in SERQ's document model.
 * Sections sit between doc and blocks: doc > section+ > (block | container)+
 *
 * Key flags:
 * - isolating: false -- cursor flows freely across section boundaries
 * - defining: false -- Enter creates paragraphs inside, not new sections
 * - selectable: false -- no accidental whole-section NodeSelection on click
 * - draggable: true -- sections can be reordered via dedicated drag handle
 *
 * Keyboard overrides:
 * - Enter: skips createParagraphNear and liftEmptyBlock (both corrupt sections)
 * - Backspace: handles section boundary joins correctly
 * - Mod+Enter: explicit section split
 */

import { Node, mergeAttributes } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import { canJoin } from '@tiptap/pm/transform'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { generateUUID } from '@/lib/migration'
import { SectionView } from './section-view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    section: {
      splitSection: () => ReturnType
      mergeSectionWithPrevious: () => ReturnType
      mergeSectionWithNext: () => ReturnType
    }
  }
}

export const Section = Node.create({
  name: 'section',

  group: 'section',

  content: '(block | container)+',

  // CRITICAL: false. Cursor flows freely across section boundaries.
  // Round 2 identified isolating:true as the #1 architecture killer.
  isolating: false,

  // false: Enter creates new paragraphs (not new sections).
  // With defining:true, splitBlock would create new section nodes on Enter.
  // We want sections to be transparent to normal editing -- only
  // explicit commands (Mod+Enter) create new sections.
  defining: false,

  // Sections are draggable via dedicated drag handle (not native PM drag).
  draggable: true,

  // false: no accidental whole-section NodeSelection on click.
  // Section selection is programmatic only.
  selectable: false,

  addAttributes() {
    return {
      // Named 'sectionId' to avoid collision with UUID plugin's global 'id' attr
      sectionId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-section-id'),
        renderHTML: (attrs) => ({
          'data-section-id': attrs.sectionId,
        }),
      },
      level: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-section-level')
          return v ? parseInt(v, 10) : null
        },
        renderHTML: (attrs) => {
          if (attrs.level == null) return {}
          return { 'data-section-level': attrs.level }
        },
      },
      numbering: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-numbering') || null,
        renderHTML: (attrs) => {
          if (!attrs.numbering) return {}
          return { 'data-numbering': attrs.numbering }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionView)
  },

  parseHTML() {
    return [{ tag: 'section[data-section-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['section', mergeAttributes(HTMLAttributes), 0]
  },

  addKeyboardShortcuts() {
    return {
      // Explicit section split: Cmd/Ctrl+Enter
      'Mod-Enter': () => {
        return this.editor.commands.splitSection()
      },

      // Override Enter to prevent createParagraphNear and liftEmptyBlock
      // from corrupting the section structure.
      //
      // Default TipTap chain: newlineInCode -> createParagraphNear ->
      //   liftEmptyBlock -> splitBlock
      //
      // createParagraphNear: inserts a block BEFORE the cursor in certain
      //   selection states, causing backward jumps.
      // liftEmptyBlock: on empty paragraphs in the middle of a section,
      //   calls tr.split() which SPLITS THE SECTION. On empty paragraphs
      //   at the end, tries to lift the paragraph out of the section.
      //
      // Our chain: newlineInCode -> splitBlock (skip the two problematic ones)
      'Enter': () => {
        return this.editor.commands.first(({ commands }) => [
          () => commands.newlineInCode(),
          () => commands.splitBlock(),
        ])
      },

      // Override Backspace to handle section boundaries correctly.
      //
      // Default joinBackward at a section boundary joins the two sections
      // (invisible to user) but does NOT join the adjacent text blocks,
      // requiring two presses. At the first section, it tries to lift
      // the block out of the section, which fails and corrupts cursor state.
      //
      // Our handler: at section boundaries, join sections AND join the
      // adjacent blocks in one operation. Otherwise, fall through to default.
      'Backspace': () => {
        const { state } = this.editor
        const { selection } = state

        // Non-empty selection: let default handle
        if (!selection.empty) return false

        const { $from } = selection

        // Not at start of textblock: let default handle (normal char delete)
        if ($from.parentOffset !== 0) return false

        // Find section ancestor
        let sectionDepth: number | null = null
        for (let d = $from.depth; d >= 1; d--) {
          if ($from.node(d).type.name === 'section') {
            sectionDepth = d
            break
          }
        }

        // Not in a section: let default handle
        if (sectionDepth === null) return false

        // Check if cursor is at the start of the first block in this section
        const blockIndex = $from.index(sectionDepth)
        if (blockIndex !== 0) return false // Not first block, default joinBackward is fine

        // At start of first block in a section.

        // If the block isn't a paragraph (e.g. heading), convert to paragraph first
        if ($from.parent.type.name !== 'paragraph') {
          return this.editor.commands.clearNodes()
        }

        // Check if there's a previous section to join with
        const sectionPos = $from.before(sectionDepth)
        const $secStart = state.doc.resolve(sectionPos)
        const secIndex = $secStart.index(sectionDepth - 1)

        if (secIndex === 0) {
          // First section in doc -- nothing before us. Block the event
          // to prevent default handler from trying to lift.
          return true
        }

        // Join sections AND join adjacent blocks in one transaction.
        // Step 1: tr.join(sectionPos) merges section B into section A.
        // Step 2: try to join the now-adjacent blocks at the former boundary.
        const { tr } = state

        if (!canJoin(state.doc, sectionPos)) return false

        tr.join(sectionPos)

        // After section join, the cursor is at the start of the block that was
        // the first block of section B. The previous block (last of section A)
        // is now adjacent. Try to join them.
        const mappedPos = tr.mapping.map($from.pos)
        try {
          const $mapped = tr.doc.resolve(mappedPos)
          // Find the block boundary
          if ($mapped.parentOffset === 0 && $mapped.depth >= 2) {
            const blockPos = $mapped.before($mapped.depth)
            const $block = tr.doc.resolve(blockPos)
            const idx = $block.index($block.depth - 1)
            if (idx > 0 && canJoin(tr.doc, blockPos)) {
              tr.join(blockPos)
            }
          }
        } catch {
          // Position mapping edge case -- section join alone is still valid
        }

        this.editor.view.dispatch(tr.scrollIntoView())
        return true
      },
    }
  },

  addCommands() {
    return {
      /**
       * Split the current section at the cursor position.
       * Blocks before the cursor stay in the current section.
       * Blocks at/after the cursor move to a new section.
       */
      splitSection:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection

          // Find the section containing the cursor
          let sectionDepth: number | null = null
          for (let d = $from.depth; d >= 1; d--) {
            if ($from.node(d).type.name === 'section') {
              sectionDepth = d
              break
            }
          }
          if (sectionDepth === null) return false

          const sectionNode = $from.node(sectionDepth)
          const sectionPos = $from.before(sectionDepth)

          // Find which block-level child the cursor is in
          // (direct child of section, not nested deeper)
          let blockDepth = sectionDepth + 1
          // Walk down to find the first direct child depth of section
          for (let d = $from.depth; d > sectionDepth; d--) {
            if ($from.node(d - 1).type.name === 'section') {
              blockDepth = d
              break
            }
          }

          const blockIndex = $from.index(sectionDepth)

          // If cursor is at the very start of the section, nothing to split
          if (blockIndex === 0 && $from.parentOffset === 0) return false

          if (!dispatch) return true

          // Collect blocks for the new (second) section
          const newSectionBlocks: PMNode[] = []
          const sectionType = state.schema.nodes.section

          const cursorAtBlockStart = $from.parentOffset === 0
            && $from.depth === blockDepth

          const splitIndex = cursorAtBlockStart ? blockIndex : blockIndex + 1

          // If split would leave the new section empty, don't split
          if (splitIndex >= sectionNode.childCount) return false

          for (let i = splitIndex; i < sectionNode.childCount; i++) {
            newSectionBlocks.push(sectionNode.child(i))
          }

          if (newSectionBlocks.length === 0) return false

          // Infer level for new section from first block
          const firstNewBlock = newSectionBlocks[0]
          const newLevel = firstNewBlock.type.name === 'heading'
            ? (firstNewBlock.attrs.level as number)
            : null

          const newSection = sectionType.create(
            { sectionId: generateUUID(), level: newLevel },
            newSectionBlocks,
          )

          // Delete the moved blocks from the current section, then insert new section after
          const deleteFrom = sectionPos + 1 // inside section
          let offset = 0
          for (let i = 0; i < splitIndex; i++) {
            offset += sectionNode.child(i).nodeSize
          }
          const deleteStart = deleteFrom + offset
          const deleteEnd = sectionPos + sectionNode.nodeSize - 1 // before section close

          // Delete the blocks that are moving to the new section
          tr.delete(deleteStart, deleteEnd)

          // Insert the new section after the current one
          const insertPos = tr.mapping.map(sectionPos + sectionNode.nodeSize)
          tr.insert(insertPos, newSection)

          // Place cursor at the start of the new section
          try {
            const $newStart = tr.doc.resolve(insertPos + 1)
            const sel = TextSelection.findFrom($newStart, 1)
            if (sel) tr.setSelection(sel)
          } catch {
            // Let PM auto-resolve
          }

          dispatch(tr)
          return true
        },

      /**
       * Merge the current section with the previous one.
       * All blocks from the current section move to the end of the previous section.
       */
      mergeSectionWithPrevious:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection

          let sectionDepth: number | null = null
          for (let d = $from.depth; d >= 1; d--) {
            if ($from.node(d).type.name === 'section') {
              sectionDepth = d
              break
            }
          }
          if (sectionDepth === null) return false

          const sectionPos = $from.before(sectionDepth)
          const sectionNode = $from.node(sectionDepth)

          // Check if there's a previous section
          const $sectionStart = state.doc.resolve(sectionPos)
          const sectionIndex = $sectionStart.index(sectionDepth - 1)
          if (sectionIndex === 0) return false // first section, nothing to merge with

          if (!dispatch) return true

          // Get previous section
          const parentNode = $sectionStart.node(sectionDepth - 1)
          const prevSection = parentNode.child(sectionIndex - 1)
          let prevSectionPos = sectionPos
          // Walk back to find previous section position
          prevSectionPos = sectionPos - prevSection.nodeSize

          // Collect all blocks from the current section
          const blocks: PMNode[] = []
          sectionNode.forEach((child) => blocks.push(child))

          // Insert blocks at the end of the previous section
          const prevSectionEnd = prevSectionPos + prevSection.nodeSize - 1

          // Delete the current section
          tr.delete(sectionPos, sectionPos + sectionNode.nodeSize)

          // Insert blocks into previous section (position may have shifted)
          const mappedPrevEnd = tr.mapping.map(prevSectionEnd)
          tr.insert(mappedPrevEnd, blocks)

          dispatch(tr)
          return true
        },

      /**
       * Merge the current section with the next one.
       * All blocks from the next section move to the end of the current section.
       */
      mergeSectionWithNext:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection

          let sectionDepth: number | null = null
          for (let d = $from.depth; d >= 1; d--) {
            if ($from.node(d).type.name === 'section') {
              sectionDepth = d
              break
            }
          }
          if (sectionDepth === null) return false

          const sectionPos = $from.before(sectionDepth)
          const sectionNode = $from.node(sectionDepth)

          // Check if there's a next section
          const $sectionStart = state.doc.resolve(sectionPos)
          const parentNode = $sectionStart.node(sectionDepth - 1)
          const sectionIndex = $sectionStart.index(sectionDepth - 1)
          if (sectionIndex >= parentNode.childCount - 1) return false

          if (!dispatch) return true

          const nextSectionPos = sectionPos + sectionNode.nodeSize
          const nextSection = parentNode.child(sectionIndex + 1)

          // Collect all blocks from the next section
          const blocks: PMNode[] = []
          nextSection.forEach((child) => blocks.push(child))

          // Delete the next section
          tr.delete(nextSectionPos, nextSectionPos + nextSection.nodeSize)

          // Insert blocks at the end of the current section
          const currentSectionEnd = sectionPos + sectionNode.nodeSize - 1
          const mappedEnd = tr.mapping.map(currentSectionEnd)
          tr.insert(mappedEnd, blocks)

          dispatch(tr)
          return true
        },
    }
  },
})
