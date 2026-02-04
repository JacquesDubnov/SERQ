/**
 * HeadingToggleButtons - Toggle buttons for P, H1, H2, H3
 *
 * Replaces the heading dropdown with direct toggle buttons.
 * Right-click on H1/H2/H3 buttons opens a context menu for style customization.
 */

import { forwardRef, useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';

import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import { HeadingContextMenu } from '@/components/tiptap-ui-custom/heading-context-menu';
import type { HeadingLevel } from '@/stores/styleStore';

// Shortcut keys for heading levels (matches TipTap defaults)
const HEADING_SHORTCUTS: Record<string, string> = {
  paragraph: 'ctrl+alt+0',
  1: 'ctrl+alt+1',
  2: 'ctrl+alt+2',
  3: 'ctrl+alt+3',
  4: 'ctrl+alt+4',
  5: 'ctrl+alt+5',
  6: 'ctrl+alt+6',
};

interface HeadingToggleButtonsProps {
  editor: Editor;
}

export const HeadingToggleButtons = forwardRef<HTMLDivElement, HeadingToggleButtonsProps>(
  ({ editor }, ref) => {
    const [activeLevel, setActiveLevel] = useState<HeadingLevel | 'paragraph'>('paragraph');

    // Update active state when selection changes
    useEffect(() => {
      const updateActiveLevel = () => {
        if (editor.isActive('heading', { level: 1 })) {
          setActiveLevel(1);
        } else if (editor.isActive('heading', { level: 2 })) {
          setActiveLevel(2);
        } else if (editor.isActive('heading', { level: 3 })) {
          setActiveLevel(3);
        } else {
          setActiveLevel('paragraph');
        }
      };

      updateActiveLevel();
      editor.on('selectionUpdate', updateActiveLevel);
      editor.on('transaction', updateActiveLevel);

      return () => {
        editor.off('selectionUpdate', updateActiveLevel);
        editor.off('transaction', updateActiveLevel);
      };
    }, [editor]);

    const handleParagraph = useCallback(() => {
      editor.chain().focus().setParagraph().run();
    }, [editor]);

    const handleHeading = useCallback(
      (level: HeadingLevel) => {
        editor.chain().focus().toggleHeading({ level }).run();
      },
      [editor]
    );

    const renderHeadingButton = (level: HeadingLevel) => (
      <HeadingContextMenu key={`h${level}-context`} level={level} editor={editor}>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={activeLevel === level ? 'on' : 'off'}
          onClick={() => handleHeading(level)}
          aria-label={`Heading ${level}`}
          tooltip={`Heading ${level}`}
          shortcutKeys={HEADING_SHORTCUTS[level]}
          style={{ padding: '4px 8px', minWidth: '28px', fontWeight: 600 }}
        >
          <span style={{ fontSize: '12px' }}>H{level}</span>
        </Button>
      </HeadingContextMenu>
    );

    return (
      <ButtonGroup ref={ref} orientation="horizontal" style={{ gap: '2px' }}>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={activeLevel === 'paragraph' ? 'on' : 'off'}
          onClick={handleParagraph}
          aria-label="Paragraph"
          tooltip="Paragraph"
          shortcutKeys={HEADING_SHORTCUTS.paragraph}
          style={{ padding: '4px 8px', minWidth: '28px', fontWeight: 500 }}
        >
          <span style={{ fontSize: '12px' }}>P</span>
        </Button>

        {renderHeadingButton(1)}
        {renderHeadingButton(2)}
        {renderHeadingButton(3)}
      </ButtonGroup>
    );
  }
);

HeadingToggleButtons.displayName = 'HeadingToggleButtons';

export default HeadingToggleButtons;
