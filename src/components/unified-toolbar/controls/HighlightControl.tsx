/**
 * HighlightControl - Unified highlight color dropdown
 *
 * Uses useUnifiedHighlight hook for context-aware styling.
 * Shows blue dot when displaying heading-level style.
 *
 * IMPORTANT: Color options come from styleStore (dynamic, user-configurable).
 * Never hardcode color lists here.
 */

import { forwardRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';

import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody, CardItemGroup } from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';

import { useUnifiedHighlight } from '@/hooks/style-hooks';
import { useStyleStore } from '@/stores/styleStore';

interface HighlightControlProps {
  editor: Editor;
}

export const HighlightControl = forwardRef<HTMLButtonElement, HighlightControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    // Get dynamic highlight color options from store
    const availableHighlightColors = useStyleStore((state) => state.availableHighlightColors);

    const {
      value,
      hasHighlight,
      isHeadingLevel,
      setHighlight,
      clearHighlight,
    } = useUnifiedHighlight(editor);

    const handleHighlightSelect = useCallback((colorValue: string) => {
      setHighlight(colorValue);
      setIsOpen(false);
    }, [setHighlight]);

    const handleClear = useCallback(() => {
      clearHighlight();
      setIsOpen(false);
    }, [clearHighlight]);

    // Determine what color to show on the button
    const displayColor = hasHighlight && value ? value : 'transparent';

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Highlight color"
            tooltip="Highlight"
            ref={ref}
            style={{ position: 'relative' }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: displayColor,
                borderRadius: '3px',
                padding: '2px',
              }}
            >
              <HighlighterIcon className="tiptap-button-icon" />
            </span>
            {isHeadingLevel && (
              <span
                className="heading-level-indicator"
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-accent, #3b82f6)',
                }}
                title="Applies to all headings of this level"
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          style={{
            width: '160px',
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
                maxHeight: '350px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            >
              {/* Clear option */}
              <CardItemGroup>
                <DropdownMenuItem asChild>
                  <Button
                    type="button"
                    data-style="ghost"
                    onClick={handleClear}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <span className="tiptap-button-text">No Highlight</span>
                  </Button>
                </DropdownMenuItem>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Color options - from dynamic store */}
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {availableHighlightColors.map((color) => (
                    <DropdownMenuItem key={color.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === color.value ? 'on' : 'off'}
                        onClick={() => handleHighlightSelect(color.value)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                        }}
                      >
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            backgroundColor: color.value,
                            marginRight: '8px',
                            border: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                          }}
                        />
                        <span className="tiptap-button-text">{color.label}</span>
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

HighlightControl.displayName = 'HighlightControl';
