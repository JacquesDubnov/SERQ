/**
 * LetterSpacingDropdown - Character Spacing Selection with custom input
 *
 * Common letter spacing values plus custom input support.
 * Values in pixels (px).
 */

import { forwardRef, useCallback, useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// Utils - letter-spacing can be block OR inline depending on selection
import { getTextStyleAtCursor, getBlockAttrsAtCursor } from '@/lib/editor-utils';

// Store - subscribe to headingCustomStyles changes
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

// Letter spacing values in pixels (fine increments for typography)
// 0 = font's natural spacing (default)
// Negative = tighter, Positive = wider
// Note: 1px is ~6% at 16px font, so we use decimals for fine control
export const LETTER_SPACINGS = [
  { name: '-1', value: '-1px', numeric: -1 },
  { name: '-0.5', value: '-0.5px', numeric: -0.5 },
  { name: '-0.3', value: '-0.3px', numeric: -0.3 },
  { name: '-0.2', value: '-0.2px', numeric: -0.2 },
  { name: '-0.1', value: '-0.1px', numeric: -0.1 },
  { name: '0', value: '0', numeric: 0 },
  { name: '0.1', value: '0.1px', numeric: 0.1 },
  { name: '0.2', value: '0.2px', numeric: 0.2 },
  { name: '0.3', value: '0.3px', numeric: 0.3 },
  { name: '0.5', value: '0.5px', numeric: 0.5 },
  { name: '1', value: '1px', numeric: 1 },
  { name: '2', value: '2px', numeric: 2 },
  { name: '5', value: '5px', numeric: 5 },
];

// Letter spacing icon - T with horizontal arrows below
const LetterSpacingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* T shape */}
    <line x1="6" y1="4" x2="18" y2="4" />
    <line x1="12" y1="4" x2="12" y2="14" />
    {/* Left-right arrows */}
    <line x1="4" y1="19" x2="20" y2="19" />
    <polyline points="7,16 4,19 7,22" />
    <polyline points="17,16 20,19 17,22" />
  </svg>
);

interface LetterSpacingDropdownProps {
  editor: Editor;
}

export const LetterSpacingDropdown = forwardRef<HTMLButtonElement, LetterSpacingDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSpacing, setCurrentSpacing] = useState(0); // Numeric value
    const [inputValue, setInputValue] = useState('0');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Subscribe to styleStore - re-render when heading styles change
    const headingCustomStyles = useStyleStore((state) => state.headingCustomStyles);

    // Parse letter spacing value to number (handles px or unitless)
    const parseSpacing = (value: string | undefined): number => {
      if (!value || value === 'normal' || value === '0') return 0;
      // Extract numeric value, strip 'px' if present
      const num = parseFloat(value.replace('px', ''));
      return isNaN(num) ? 0 : num;
    };

    // Update current spacing when editor selection changes OR heading styles change
    // Letter-spacing can be inline (when text selected) or block (when no selection)
    useEffect(() => {
      const updateSpacing = () => {
        const { empty } = editor.state.selection;

        let letterSpacing: string | undefined;

        if (empty) {
          // No selection - check block attribute
          const blockAttrs = getBlockAttrsAtCursor(editor);
          letterSpacing = blockAttrs.letterSpacing as string | undefined;
        } else {
          // Has selection - check inline mark
          const textAttrs = getTextStyleAtCursor(editor);
          letterSpacing = textAttrs.letterSpacing as string | undefined;
        }

        // Also check block as fallback if no inline mark
        if (!letterSpacing) {
          const blockAttrs = getBlockAttrsAtCursor(editor);
          letterSpacing = blockAttrs.letterSpacing as string | undefined;
        }

        const numericValue = parseSpacing(letterSpacing);
        setCurrentSpacing(numericValue);
        if (!isEditing) {
          setInputValue(String(numericValue));
        }
      };

      updateSpacing();
      editor.on('selectionUpdate', updateSpacing);
      editor.on('transaction', updateSpacing);

      return () => {
        editor.off('selectionUpdate', updateSpacing);
        editor.off('transaction', updateSpacing);
      };
    }, [editor, isEditing, headingCustomStyles]); // Re-run when headingCustomStyles changes

    const applySpacing = useCallback(
      (spacing: number) => {
        // Clamp between -5 and 20 px (reasonable typography range)
        const clampedSpacing = Math.min(20, Math.max(-5, spacing));
        const value = clampedSpacing === 0 ? '0' : `${clampedSpacing}px`;
        editor.chain().focus().setLetterSpacing(value).run();
      },
      [editor]
    );

    const handleSpacingSelect = useCallback(
      (spacingValue: string) => {
        editor.chain().focus().setLetterSpacing(spacingValue).run();
        setIsOpen(false);
      },
      [editor]
    );

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow numbers, decimal point, and negative sign
      const value = e.target.value.replace(/[^\d.\-]/g, '');
      setInputValue(value);
    }, []);

    const handleInputBlur = useCallback(() => {
      setIsEditing(false);
      const spacing = parseFloat(inputValue);
      if (!isNaN(spacing) && spacing >= -5 && spacing <= 20) {
        applySpacing(spacing);
      } else {
        setInputValue(String(currentSpacing));
      }
    }, [inputValue, currentSpacing, applySpacing]);

    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Always stop propagation to prevent toolbar/editor from catching keys
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (e.key === 'Enter') {
          e.preventDefault();
          const spacing = parseFloat(inputValue);
          if (!isNaN(spacing) && spacing >= -5 && spacing <= 20) {
            applySpacing(spacing);
          }
          setIsEditing(false);
          // Use setTimeout to ensure blur happens after React updates
          setTimeout(() => inputRef.current?.blur(), 0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setInputValue(String(currentSpacing));
          setIsEditing(false);
          setTimeout(() => inputRef.current?.blur(), 0);
        }
        // Other keys: don't preventDefault so typing works normally
      },
      [inputValue, currentSpacing, applySpacing]
    );

    const handleInputFocus = useCallback(() => {
      setIsEditing(true);
      inputRef.current?.select();
    }, []);

    // Reset to default (0 = font's natural spacing)
    const handleReset = useCallback(() => {
      editor.chain().focus().setLetterSpacing('0').run();
    }, [editor]);

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Icon = Reset button */}
        <Button
          type="button"
          data-style="ghost"
          onClick={handleReset}
          aria-label="Reset character spacing"
          tooltip="Reset to 0"
          ref={ref}
          style={{ padding: '4px 4px' }}
        >
          <LetterSpacingIcon />
        </Button>

        {/* Editable input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          style={{
            width: '32px',
            padding: '4px 2px',
            border: 'none',
            background: 'var(--color-toolbar-input-bg, transparent)',
            fontSize: '11px',
            textAlign: 'center',
            outline: 'none',
            cursor: 'text',
            color: 'var(--color-toolbar-input-text, inherit)',
          }}
          aria-label="Character spacing (px)"
        />

        {/* Dropdown trigger - only the chevron */}
        <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              data-style="ghost"
              role="button"
              tabIndex={-1}
              aria-label="Character spacing presets"
              style={{ padding: '4px 2px', minWidth: 'auto' }}
            >
              <ChevronDownIcon className="tiptap-button-dropdown-small" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
          <Card>
            <CardBody>
              <ButtonGroup orientation="vertical">
                {LETTER_SPACINGS.map((spacing) => (
                  <DropdownMenuItem key={spacing.value} asChild>
                    <Button
                      type="button"
                      data-style="ghost"
                      data-active-state={currentSpacing === spacing.numeric ? 'on' : 'off'}
                      onClick={() => handleSpacingSelect(spacing.value)}
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      <span className="tiptap-button-text">{spacing.name}</span>
                    </Button>
                  </DropdownMenuItem>
                ))}
              </ButtonGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

LetterSpacingDropdown.displayName = 'LetterSpacingDropdown';

export default LetterSpacingDropdown;
