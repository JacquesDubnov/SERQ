/**
 * ParagraphNumbers Extension
 * Adds widget decorations to display paragraph numbers before block content
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { getPresetById } from './presets'

export interface ParagraphNumbersOptions {
  getSettings: () => {
    enabled: boolean
    presetId: string | null
  }
}

export const paragraphNumbersPluginKey = new PluginKey('paragraphNumbers')

export const ParagraphNumbers = Extension.create<ParagraphNumbersOptions>({
  name: 'paragraphNumbers',

  addOptions() {
    return {
      getSettings: () => ({ enabled: false, presetId: null }),
    }
  },

  addProseMirrorPlugins() {
    const getSettings = this.options.getSettings

    return [
      new Plugin({
        key: paragraphNumbersPluginKey,

        props: {
          decorations(state) {
            const settings = getSettings()

            if (!settings.enabled || !settings.presetId) {
              return DecorationSet.empty
            }

            const preset = getPresetById(settings.presetId)
            if (!preset) return DecorationSet.empty

            const decorations: Decoration[] = []
            const { doc } = state

            // Track numbering state
            let sequentialIndex = 0
            // Track heading hierarchy for hierarchical/legal presets
            // headingCounters[level] = current count at that level
            const headingCounters: number[] = [0, 0, 0, 0, 0, 0]
            let lastHeadingLevel = 0

            doc.descendants((node, pos) => {
              // Skip non-block nodes
              if (!node.isBlock) return true

              // Skip container nodes (don't number these, but process children)
              const containerTypes = ['columnSection', 'column', 'doc', 'table', 'tableRow']
              if (containerTypes.includes(node.type.name)) {
                return true
              }

              // Handle numbered block types
              const isNumberable = [
                'paragraph',
                'heading',
                'blockquote',
                'codeBlock',
                'callout',
                'listItem',
              ].includes(node.type.name)

              if (!isNumberable) return true

              // Skip empty paragraphs
              if (node.type.name === 'paragraph' && node.textContent.trim() === '') {
                return true
              }

              sequentialIndex++

              // Calculate number based on preset category
              let numberText: string
              let displayLevel = 0

              if (preset.category === 'sequential') {
                numberText = preset.formatNumber(sequentialIndex)
              } else {
                // For hierarchical and legal presets, track heading structure
                if (node.type.name === 'heading') {
                  const level = node.attrs.level || 1

                  // Reset counters for deeper levels when going up
                  if (level <= lastHeadingLevel) {
                    for (let i = level; i < 6; i++) {
                      headingCounters[i] = 0
                    }
                  }

                  // Increment counter at this level
                  headingCounters[level - 1]++
                  lastHeadingLevel = level
                  displayLevel = level - 1

                  // Build parent numbers array
                  const parentNumbers = headingCounters.slice(0, level - 1).filter(n => n > 0)
                  const currentIndex = headingCounters[level - 1]

                  numberText = preset.formatNumber(currentIndex, displayLevel, parentNumbers)
                } else {
                  // Non-heading content gets numbered under current heading context
                  displayLevel = lastHeadingLevel
                  const parentNumbers = headingCounters.slice(0, lastHeadingLevel).filter(n => n > 0)
                  numberText = preset.formatNumber(sequentialIndex, displayLevel, parentNumbers)
                }
              }

              // Create widget decoration
              const widget = Decoration.widget(
                pos + 1, // Position at start of node content
                () => {
                  const span = document.createElement('span')
                  span.className = 'paragraph-number'
                  span.setAttribute('data-level', String(displayLevel))
                  span.textContent = numberText + ' '
                  span.contentEditable = 'false'
                  return span
                },
                { side: -1 } // Insert before content
              )

              decorations.push(widget)
              return true
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})

export default ParagraphNumbers
