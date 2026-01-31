import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import { SlashMenu, type SlashMenuRef } from './SlashMenu'
import { filterSlashCommands, type SlashCommandItem } from './commands'

/**
 * Slash Commands Extension
 *
 * Enables typing "/" in the editor to open a command menu
 * for quickly inserting blocks like headings, lists, tables, etc.
 */
export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Parameters<typeof Suggestion>[0]['editor']
          range: { from: number; to: number }
          props: SlashCommandItem
        }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,

        // Filter items based on query
        items: ({ query }: { query: string }) => {
          return filterSlashCommands(query).slice(0, 10)
        },

        // Render the dropdown menu
        render: () => {
          let component: ReactRenderer<SlashMenuRef> | null = null
          let popup: Instance[] | null = null

          return {
            onStart: (props: {
              editor: Parameters<typeof Suggestion>[0]['editor']
              clientRect: (() => DOMRect | null) | null
              items: SlashCommandItem[]
              command: (item: SlashCommandItem) => void
            }) => {
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: props.command,
                },
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                animation: 'fade',
                duration: [150, 100],
              })
            },

            onUpdate: (props: {
              items: SlashCommandItem[]
              command: (item: SlashCommandItem) => void
              clientRect: (() => DOMRect | null) | null
            }) => {
              component?.updateProps({
                items: props.items,
                command: props.command,
              })

              if (!props.clientRect) {
                return
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              })
            },

            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide()
                return true
              }

              return component?.ref?.onKeyDown(props) ?? false
            },

            onExit: () => {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
      }),
    ]
  },
})
