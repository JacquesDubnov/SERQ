/**
 * FontWeightDropdown - Dynamic Font Weight Selection
 *
 * Weights are loaded from styleStore - fully configurable by user.
 * No hardcoded weight lists. Everything is dynamic.
 */

import { forwardRef, useCallback, useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// Utils
import { getTextStyleAtCursor } from '@/lib/editor-utils';

// Store - dynamic weight configuration + heading style reactivity
import { useStyleStore } from '@/stores/styleStore';

// TipTap UI Primitives
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';

interface FontWeightDropdownProps {
  editor: Editor;
}

export const FontWeightDropdown = forwardRef<HTMLButtonElement, FontWeightDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentWeight, setCurrentWeight] = useState('Regular');

    // Subscribe to styleStore - dynamic weight configuration + heading style reactivity
    const headingCustomStyles = useStyleStore((state) => state.headingCustomStyles);
    const availableFontWeights = useStyleStore((state) => state.availableFontWeights);

    // Update current weight when editor selection changes OR heading styles/weights change
    useEffect(() => {
      const updateWeight = () => {
        const attrs = getTextStyleAtCursor(editor);
        const fontWeight = attrs.fontWeight as string | undefined;

        // Find matching weight in dynamic list from store
        let match = availableFontWeights.find((w) => String(w.value) === fontWeight);

        // If not found and we have a value, try parsing as number
        if (!match && fontWeight) {
          const numericWeight = parseInt(fontWeight, 10);
          match = availableFontWeights.find((w) => w.value === numericWeight);
        }

        setCurrentWeight(match?.label || 'Regular');
      };

      updateWeight();
      editor.on('selectionUpdate', updateWeight);
      editor.on('transaction', updateWeight);

      return () => {
        editor.off('selectionUpdate', updateWeight);
        editor.off('transaction', updateWeight);
      };
    }, [editor, headingCustomStyles, availableFontWeights]); // Re-run when weights or headingCustomStyles changes

    const handleWeightSelect = useCallback(
      (weightValue: string) => {
        editor.chain().focus().setFontWeight(weightValue).run();
        setIsOpen(false);
      },
      [editor]
    );

    const handleUnset = useCallback(() => {
      editor.chain().focus().unsetFontWeight().run();
      setIsOpen(false);
    }, [editor]);

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
            style={{ minWidth: '80px' }}
          >
            <span className="tiptap-button-text" style={{ fontSize: '12px' }}>
              {currentWeight}
            </span>
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Card>
            <CardBody>
              <ButtonGroup orientation="vertical">
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
                {/* Dynamic weights from store */}
                {availableFontWeights.map((weight) => (
                  <DropdownMenuItem key={weight.value} asChild>
                    <Button
                      type="button"
                      data-style="ghost"
                      data-active-state={
                        editor.getAttributes('textStyle').fontWeight === String(weight.value) ? 'on' : 'off'
                      }
                      onClick={() => handleWeightSelect(String(weight.value))}
                      style={{ width: '100%', justifyContent: 'flex-start', fontWeight: weight.value }}
                    >
                      <span className="tiptap-button-text">{weight.label}</span>
                    </Button>
                  </DropdownMenuItem>
                ))}
              </ButtonGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

FontWeightDropdown.displayName = 'FontWeightDropdown';

export default FontWeightDropdown;
