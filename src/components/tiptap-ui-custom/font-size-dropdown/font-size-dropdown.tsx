/**
 * FontSizeDropdown - Font Size Selection with +/- buttons and custom input
 *
 * Supports preset sizes plus custom input (4-999px range).
 * +/- buttons increment/decrement by 1.
 */

import { forwardRef, useCallback, useState, useEffect, useRef } from 'react';
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

// Common preset font sizes
export const FONT_SIZES = [
  { name: '8', value: '8px' },
  { name: '9', value: '9px' },
  { name: '10', value: '10px' },
  { name: '11', value: '11px' },
  { name: '12', value: '12px' },
  { name: '14', value: '14px' },
  { name: '16', value: '16px' },
  { name: '18', value: '18px' },
  { name: '20', value: '20px' },
  { name: '24', value: '24px' },
  { name: '28', value: '28px' },
  { name: '32', value: '32px' },
  { name: '36', value: '36px' },
  { name: '48', value: '48px' },
  { name: '64', value: '64px' },
  { name: '72', value: '72px' },
  { name: '96', value: '96px' },
  { name: '128', value: '128px' },
  { name: '144', value: '144px' },
  { name: '200', value: '200px' },
];

const MIN_SIZE = 4;
const MAX_SIZE = 999;

// Simple +/- icons
const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface FontSizeDropdownProps {
  editor: Editor;
}

export const FontSizeDropdown = forwardRef<HTMLButtonElement, FontSizeDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSize, setCurrentSize] = useState(16); // Numeric size
    const [inputValue, setInputValue] = useState('16');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update current size when editor selection changes
    useEffect(() => {
      const updateSize = () => {
        const attrs = getTextStyleAtCursor(editor);
        const fontSize = attrs.fontSize as string | undefined;

        if (fontSize) {
          const numericSize = parseInt(fontSize, 10);
          if (!isNaN(numericSize)) {
            setCurrentSize(numericSize);
            if (!isEditing) {
              setInputValue(String(numericSize));
            }
          }
        } else {
          // Default to 16px
          setCurrentSize(16);
          if (!isEditing) {
            setInputValue('16');
          }
        }
      };

      updateSize();
      editor.on('selectionUpdate', updateSize);
      editor.on('transaction', updateSize);

      return () => {
        editor.off('selectionUpdate', updateSize);
        editor.off('transaction', updateSize);
      };
    }, [editor, isEditing]);

    const applySize = useCallback(
      (size: number) => {
        const clampedSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, size));
        editor.chain().focus().setFontSize(`${clampedSize}px`).run();
      },
      [editor]
    );

    const handleSizeSelect = useCallback(
      (sizeValue: string) => {
        editor.chain().focus().setFontSize(sizeValue).run();
        setIsOpen(false);
      },
      [editor]
    );

    const handleIncrease = useCallback(() => {
      const newSize = Math.min(currentSize + 1, MAX_SIZE);
      applySize(newSize);
    }, [currentSize, applySize]);

    const handleDecrease = useCallback(() => {
      const newSize = Math.max(currentSize - 1, MIN_SIZE);
      applySize(newSize);
    }, [currentSize, applySize]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only numbers
      const value = e.target.value.replace(/\D/g, '');
      setInputValue(value);
    }, []);

    const handleInputBlur = useCallback(() => {
      setIsEditing(false);
      const size = parseInt(inputValue, 10);
      if (!isNaN(size) && size >= MIN_SIZE && size <= MAX_SIZE) {
        applySize(size);
      } else {
        // Reset to current size
        setInputValue(String(currentSize));
      }
    }, [inputValue, currentSize, applySize]);

    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Always stop propagation to prevent toolbar/editor from catching keys
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (e.key === 'Enter') {
          e.preventDefault();
          const size = parseInt(inputValue, 10);
          if (!isNaN(size) && size >= MIN_SIZE && size <= MAX_SIZE) {
            applySize(size);
          }
          setIsEditing(false);
          // Use setTimeout to ensure blur happens after React updates
          setTimeout(() => inputRef.current?.blur(), 0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setInputValue(String(currentSize));
          setIsEditing(false);
          setTimeout(() => inputRef.current?.blur(), 0);
        }
        // Other keys: don't preventDefault so typing works normally
      },
      [inputValue, currentSize, applySize]
    );

    const handleInputFocus = useCallback(() => {
      setIsEditing(true);
      inputRef.current?.select();
    }, []);

    return (
      <ButtonGroup orientation="horizontal" style={{ gap: '2px' }}>
        {/* Decrease button */}
        <Button
          type="button"
          data-style="ghost"
          onClick={handleDecrease}
          disabled={currentSize <= MIN_SIZE}
          aria-label="Decrease font size"
          tooltip="Decrease Size"
          style={{ padding: '4px 6px' }}
        >
          <MinusIcon />
        </Button>

        {/* Editable input field - separate from dropdown */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          style={{
            width: '36px',
            padding: '4px 4px',
            border: 'none',
            background: 'var(--color-toolbar-input-bg, transparent)',
            fontSize: '12px',
            textAlign: 'center',
            outline: 'none',
            cursor: 'text',
            color: 'var(--color-toolbar-input-text, inherit)',
          }}
          aria-label="Font size"
        />

        {/* Dropdown trigger - only the chevron */}
        <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              data-style="ghost"
              role="button"
              tabIndex={-1}
              aria-label="Select font size"
              tooltip="Font Size Presets"
              ref={ref}
              style={{ padding: '4px 2px', minWidth: 'auto' }}
            >
              <ChevronDownIcon className="tiptap-button-dropdown-small" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <Card>
              <CardBody>
                <ButtonGroup orientation="vertical">
                  {FONT_SIZES.map((size) => (
                    <DropdownMenuItem key={size.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={currentSize === parseInt(size.name, 10) ? 'on' : 'off'}
                        onClick={() => handleSizeSelect(size.value)}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                      >
                        <span className="tiptap-button-text">{size.name}</span>
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardBody>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Increase button */}
        <Button
          type="button"
          data-style="ghost"
          onClick={handleIncrease}
          disabled={currentSize >= MAX_SIZE}
          aria-label="Increase font size"
          tooltip="Increase Size"
          style={{ padding: '4px 6px' }}
        >
          <PlusIcon />
        </Button>
      </ButtonGroup>
    );
  }
);

FontSizeDropdown.displayName = 'FontSizeDropdown';

export default FontSizeDropdown;
