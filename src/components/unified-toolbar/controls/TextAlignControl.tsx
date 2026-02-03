/**
 * TextAlignControl - Unified text alignment button group
 *
 * Uses useUnifiedTextAlign hook for context-aware styling.
 * Can be rendered as a dropdown or button group.
 */

import { forwardRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';

import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody, CardItemGroup } from '@/components/tiptap-ui-primitive/card';

import { useUnifiedTextAlign, ALIGNMENTS, type TextAlignment } from '@/hooks/style-hooks';

interface TextAlignControlProps {
  editor: Editor;
  /** Render as dropdown (default) or button group */
  variant?: 'dropdown' | 'buttons';
}

/**
 * Dropdown variant of text alignment control
 */
export const TextAlignDropdown = forwardRef<HTMLButtonElement, { editor: Editor }>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const { value, setAlignment, Icon } = useUnifiedTextAlign(editor);

    const handleAlignmentSelect = useCallback((alignment: TextAlignment) => {
      setAlignment(alignment);
      setIsOpen(false);
    }, [setAlignment]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Text alignment"
            tooltip="Text Alignment"
            ref={ref}
          >
            <Icon className="tiptap-button-icon" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          style={{
            width: '140px',
            padding: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Card style={{ overflow: 'hidden', width: '100%', borderRadius: '12px' }}>
            <CardBody
              style={{
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            >
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {ALIGNMENTS.map((alignment) => (
                    <DropdownMenuItem key={alignment.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === alignment.value ? 'on' : 'off'}
                        onClick={() => handleAlignmentSelect(alignment.value)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                        }}
                      >
                        <alignment.icon className="tiptap-button-icon" />
                        <span className="tiptap-button-text" style={{ marginLeft: '8px' }}>
                          {alignment.label}
                        </span>
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

TextAlignDropdown.displayName = 'TextAlignDropdown';

/**
 * Button group variant of text alignment control
 */
export const TextAlignButtonGroup = forwardRef<HTMLDivElement, { editor: Editor }>(
  ({ editor }, ref) => {
    const { value, setAlignment } = useUnifiedTextAlign(editor);

    return (
      <div ref={ref} style={{ display: 'flex', gap: '2px' }}>
        {ALIGNMENTS.map((alignment) => (
          <Button
            key={alignment.value}
            type="button"
            data-style="ghost"
            data-active-state={value === alignment.value ? 'on' : 'off'}
            onClick={() => setAlignment(alignment.value)}
            aria-label={alignment.label}
            tooltip={alignment.label}
          >
            <alignment.icon className="tiptap-button-icon" />
          </Button>
        ))}
      </div>
    );
  }
);

TextAlignButtonGroup.displayName = 'TextAlignButtonGroup';

/**
 * Combined text alignment control
 */
export const TextAlignControl = forwardRef<HTMLButtonElement, TextAlignControlProps>(
  ({ editor, variant = 'dropdown' }, ref) => {
    if (variant === 'buttons') {
      return <TextAlignButtonGroup editor={editor} ref={ref as React.Ref<HTMLDivElement>} />;
    }
    return <TextAlignDropdown editor={editor} ref={ref} />;
  }
);

TextAlignControl.displayName = 'TextAlignControl';
