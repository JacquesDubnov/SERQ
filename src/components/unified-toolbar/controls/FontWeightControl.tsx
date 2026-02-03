/**
 * FontWeightControl - Unified font weight dropdown
 *
 * Uses useUnifiedFontWeight hook for context-aware styling.
 * Shows blue dot when displaying heading-level style.
 *
 * IMPORTANT: Weight options come from styleStore (dynamic, user-configurable).
 * Never hardcode weight lists here.
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

import { useUnifiedFontWeight } from '@/hooks/style-hooks';
import { useStyleStore } from '@/stores/styleStore';

interface FontWeightControlProps {
  editor: Editor;
}

export const FontWeightControl = forwardRef<HTMLButtonElement, FontWeightControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    // Get dynamic weight options from store
    const availableFontWeights = useStyleStore((state) => state.availableFontWeights);

    const {
      value,
      displayLabel,
      isHeadingLevel,
      setFontWeight,
      clearFontWeight,
    } = useUnifiedFontWeight(editor);

    const handleWeightSelect = useCallback((weight: number) => {
      setFontWeight(weight);
      setIsOpen(false);
    }, [setFontWeight]);

    const handleUnset = useCallback(() => {
      clearFontWeight();
      setIsOpen(false);
    }, [clearFontWeight]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Select font weight"
            tooltip="Font Weight"
            ref={ref}
            style={{ minWidth: '80px', position: 'relative' }}
          >
            <span className="tiptap-button-text" style={{ fontSize: '12px' }}>
              {displayLabel}
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
            width: '120px',
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

              {/* Weight options - from dynamic store */}
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {availableFontWeights.map((weight) => (
                    <DropdownMenuItem key={weight.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === weight.value ? 'on' : 'off'}
                        onClick={() => handleWeightSelect(weight.value)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                          fontWeight: weight.value,
                        }}
                      >
                        <span className="tiptap-button-text">{weight.label}</span>
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

FontWeightControl.displayName = 'FontWeightControl';
