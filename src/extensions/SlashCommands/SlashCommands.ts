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

        // Filter items based on query - show all commands
        items: ({ query }: { query: string }) => {
          return filterSlashCommands(query)
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
              // Wrap command to ensure popup closes immediately when a command is selected
              const wrappedCommand = (item: SlashCommandItem) => {
                // Hide popup immediately before command executes
                popup?.[0]?.hide()
                props.command(item)
              }

              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: wrappedCommand,
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
              // Wrap command to ensure popup closes immediately
              const wrappedCommand = (item: SlashCommandItem) => {
                popup?.[0]?.hide()
                props.command(item)
              }

              component?.updateProps({
                items: props.items,
                command: wrappedCommand,
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
