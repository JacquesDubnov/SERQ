/**
 * LetterSpacingControl - Unified letter spacing dropdown
 *
 * Uses useUnifiedLetterSpacing hook for context-aware styling.
 * Shows blue dot when displaying heading-level style.
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
import { Separator } from '@/components/tiptap-ui-primitive/separator';

import { useUnifiedLetterSpacing, LETTER_SPACINGS } from '@/hooks/style-hooks';

interface LetterSpacingControlProps {
  editor: Editor;
}

export const LetterSpacingControl = forwardRef<HTMLButtonElement, LetterSpacingControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
      value,
      displayValue,
      isHeadingLevel,
      setLetterSpacing,
      clearLetterSpacing,
    } = useUnifiedLetterSpacing(editor);

    const handleLetterSpacingSelect = useCallback((spacing: number) => {
      setLetterSpacing(spacing);
      setIsOpen(false);
    }, [setLetterSpacing]);

    const handleClear = useCallback(() => {
      clearLetterSpacing();
      setIsOpen(false);
    }, [clearLetterSpacing]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Select letter spacing"
            tooltip="Letter Spacing"
            ref={ref}
            style={{ minWidth: '50px', position: 'relative' }}
          >
            <span className="tiptap-button-text" style={{ fontSize: '11px' }}>
              {displayValue}
            </span>
            {isHeadingLevel && (
              <span
                className="heading-level-indicator"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-accent, #3b82f6)',
                }}
                title="Applies to all headings of this level"
              />
            )}
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          style={{
            width: '90px',
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
                maxHeight: '300px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            >
              {/* Default/Reset option */}
              <CardItemGroup>
                <DropdownMenuItem asChild>
                  <Button
                    type="button"
                    data-style="ghost"
                    onClick={handleClear}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <span className="tiptap-button-text">Default</span>
                  </Button>
                </DropdownMenuItem>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Letter spacing options */}
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {LETTER_SPACINGS.map((ls) => (
                    <DropdownMenuItem key={ls.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === ls.value ? 'on' : 'off'}
                        onClick={() => handleLetterSpacingSelect(ls.value)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                        }}
                      >
                        <span className="tiptap-button-text">{ls.label}px</span>
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

LetterSpacingControl.displayName = 'LetterSpacingControl';
