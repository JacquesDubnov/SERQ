/**
 * FontSizeControl - Unified font size dropdown
 *
 * Uses useUnifiedFontSize hook for context-aware styling.
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

import { useUnifiedFontSize, FONT_SIZES } from '@/hooks/style-hooks';

interface FontSizeControlProps {
  editor: Editor;
}

export const FontSizeControl = forwardRef<HTMLButtonElement, FontSizeControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
      value,
      displayValue,
      isHeadingLevel,
      setFontSize,
      clearFontSize,
    } = useUnifiedFontSize(editor);

    const handleSizeSelect = useCallback((size: number) => {
      setFontSize(size);
      setIsOpen(false);
    }, [setFontSize]);

    const handleUnset = useCallback(() => {
      clearFontSize();
      setIsOpen(false);
    }, [clearFontSize]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Select font size"
            tooltip="Font Size"
            ref={ref}
            style={{ minWidth: '60px', position: 'relative' }}
          >
            <span className="tiptap-button-text" style={{ fontSize: '12px' }}>
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
            width: '100px',
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
                    onClick={handleUnset}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <span className="tiptap-button-text">Default</span>
                  </Button>
                </DropdownMenuItem>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Size options */}
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {FONT_SIZES.map((size) => (
                    <DropdownMenuItem key={size} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === size ? 'on' : 'off'}
                        onClick={() => handleSizeSelect(size)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                        }}
                      >
                        <span className="tiptap-button-text">{size}</span>
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

FontSizeControl.displayName = 'FontSizeControl';
