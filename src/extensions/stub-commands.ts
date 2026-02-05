/**
 * Stub Commands Extension
 *
 * Provides stub implementations for commands referenced by TipTap UI components
 * that we haven't fully implemented yet (AI, TOC).
 */

import { Extension } from '@tiptap/core';

interface AiTextPromptOptions {
  stream?: boolean;
  format?: string;
  text?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    stubCommands: {
      aiTextPrompt: (options?: AiTextPromptOptions) => ReturnType;
      insertTocNode: () => ReturnType;
    };
  }
}

export const StubCommands = Extension.create({
  name: 'stubCommands',

  addCommands() {
    return {
      aiTextPrompt:
        (_options?: AiTextPromptOptions) =>
        ({ chain }) => {
          // Stub - AI not implemented yet
          return chain().run();
        },
      insertTocNode:
        () =>
        ({ chain }) => {
          // Stub - TOC not implemented yet
          return chain().run();
        },
    };
  },
});

export default StubCommands;
