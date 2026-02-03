/**
 * Style Operations - Context Detection
 *
 * Determines the current style context from editor selection.
 */

import type { Editor } from '@tiptap/core';
import type { StyleContext, BlockType, HeadingLevel, StyleScope } from './types';

/**
 * Map TipTap node names to our BlockType
 */
function getBlockType(nodeName: string): BlockType {
  switch (nodeName) {
    case 'heading':
      return 'heading';
    case 'blockquote':
      return 'blockquote';
    case 'codeBlock':
      return 'codeBlock';
    case 'listItem':
      return 'listItem';
    case 'taskItem':
      return 'taskItem';
    case 'paragraph':
    default:
      return 'paragraph';
  }
}

/**
 * Determine the style scope based on block type
 *
 * - Headings: 'block' scope (styles apply to all headings of this level)
 * - Everything else: 'inline' scope (styles apply to selection only)
 */
function getStyleScope(blockType: BlockType): StyleScope {
  if (blockType === 'heading') {
    return 'block';
  }
  return 'inline';
}

/**
 * Get the current style context from editor selection
 *
 * This is the core function that determines WHERE style operations apply.
 */
export function getStyleContext(editor: Editor): StyleContext {
  const { state } = editor;
  const { selection } = state;
  const { $from, from, to, empty } = selection;

  // Get the parent block node
  const node = $from.parent;
  const blockType = getBlockType(node.type.name);
  const scope = getStyleScope(blockType);

  // Extract heading level if applicable
  const headingLevel = blockType === 'heading'
    ? (node.attrs.level as HeadingLevel)
    : undefined;

  console.log('[getStyleContext]', {
    nodeName: node.type.name,
    blockType,
    headingLevel,
    scope,
    from,
    to,
  });

  return {
    editor,
    scope,
    blockType,
    headingLevel,
    selection: {
      from,
      to,
      isEmpty: empty,
    },
  };
}

/**
 * Check if the current context is a heading
 */
export function isHeadingContext(ctx: StyleContext): ctx is StyleContext & { headingLevel: HeadingLevel } {
  return ctx.blockType === 'heading' && ctx.headingLevel !== undefined;
}

/**
 * Check if the current context supports heading-level styling
 *
 * Heading-level styling means the style applies to ALL headings of this level,
 * not just the current selection.
 */
export function supportsHeadingLevelStyling(ctx: StyleContext): boolean {
  return isHeadingContext(ctx);
}

/**
 * Get heading level from context, or null if not a heading
 */
export function getHeadingLevel(ctx: StyleContext): HeadingLevel | null {
  return ctx.headingLevel ?? null;
}

/**
 * Check if current selection is inside a code block
 * (many formatting operations are disabled in code blocks)
 */
export function isInCodeBlock(ctx: StyleContext): boolean {
  return ctx.blockType === 'codeBlock';
}

/**
 * Check if current selection spans multiple blocks
 */
export function isMultiBlockSelection(editor: Editor): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from, $to } = selection;

  return $from.parent !== $to.parent;
}

/**
 * Get all heading levels in the current selection
 * (useful when selection spans multiple headings)
 */
export function getHeadingLevelsInSelection(editor: Editor): HeadingLevel[] {
  const { state } = editor;
  const { selection } = state;
  const { from, to } = selection;

  const levels = new Set<HeadingLevel>();

  state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === 'heading' && node.attrs.level) {
      levels.add(node.attrs.level as HeadingLevel);
    }
  });

  return Array.from(levels).sort();
}

/**
 * Create a context string for debugging
 */
export function contextToString(ctx: StyleContext): string {
  const parts = [
    `scope=${ctx.scope}`,
    `block=${ctx.blockType}`,
  ];

  if (ctx.headingLevel) {
    parts.push(`level=H${ctx.headingLevel}`);
  }

  parts.push(`sel=${ctx.selection.from}-${ctx.selection.to}`);

  if (ctx.selection.isEmpty) {
    parts.push('(cursor)');
  }

  return `[StyleContext: ${parts.join(', ')}]`;
}
