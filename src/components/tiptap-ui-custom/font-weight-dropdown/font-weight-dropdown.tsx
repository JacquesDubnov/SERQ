/**
 * FontWeightDropdown - Font Weight Selection
 *
 * Standard font weights from Thin to Black.
 * Dynamically shows current selection's weight.
 */

import { forwardRef, useCallback, useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// Utils
import { getTextStyleAtCursor } from '@/lib/editor-utils';

// TipTap UI Primitives
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';

// Font weights with CSS values
export const FONT_WEIGHTS = [
  { name: 'Thin', value: '100' },
  { name: 'Extra Light', value: '200' },
  { name: 'Light', value: '300' },
  { name: 'Normal', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' },
  { name: 'Black', value: '900' },
];

interface FontWeightDropdownProps {
  editor: Editor;
}

export const FontWeightDropdown = forwardRef<HTMLButtonElement, FontWeightDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentWeight, setCurrentWeight] = useState('Normal');

    // Update current weight when editor selection changes
    useEffect(() => {
      const updateWeight = () => {
        const attrs = getTextStyleAtCursor(editor);
        const fontWeight = attrs.fontWeight as string | undefined;

        // Find matching weight
        let match = FONT_WEIGHTS.find((w) => w.value === fontWeight);

        // If not found and we have a value, try parsing as number
        if (!match && fontWeight) {
          const numericWeight = parseInt(fontWeight, 10);
          match = FONT_WEIGHTS.find((w) => parseInt(w.value, 10) === numericWeight);
        }

        setCurrentWeight(match?.name || 'Normal');
      };

      updateWeight();
      editor.on('selectionUpdate', updateWeight);
      editor.on('transaction', updateWeight);

      return () => {
        editor.off('selectionUpdate', updateWeight);
        editor.off('transaction', updateWeight);
      };
    }, [editor]);

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
                {FONT_WEIGHTS.map((weight) => (
                  <DropdownMenuItem key={weight.value} asChild>
                    <Button
                      type="button"
                      data-style="ghost"
                      data-active-state={
                        editor.getAttributes('textStyle').fontWeight === weight.value ? 'on' : 'off'
                      }
                      onClick={() => handleWeightSelect(weight.value)}
                      style={{ width: '100%', justifyContent: 'flex-start', fontWeight: weight.value }}
                    >
                      <span className="tiptap-button-text">{weight.name}</span>
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
