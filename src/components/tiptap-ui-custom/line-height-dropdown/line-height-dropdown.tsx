/**
 * LineHeightDropdown - Line Height/Spacing Selection with custom input
 *
 * Common line spacing values plus custom input support.
 */

import { forwardRef, useCallback, useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// Utils - line-height is a block attribute, not a text mark
import { getBlockAttrsAtCursor } from '@/lib/editor-utils';

// TipTap UI Primitives
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card';

// Line height values - includes tight spacing down to 0.2
export const LINE_HEIGHTS = [
  { name: '0.2', value: '0.2' },
  { name: '0.4', value: '0.4' },
  { name: '0.6', value: '0.6' },
  { name: '0.8', value: '0.8' },
  { name: '1.0', value: '1' },
  { name: '1.15', value: '1.15' },
  { name: '1.25', value: '1.25' },
  { name: '1.5', value: '1.5' },
  { name: '1.75', value: '1.75' },
  { name: '2.0', value: '2' },
  { name: '2.5', value: '2.5' },
  { name: '3.0', value: '3' },
];

// Line height icon - vertical arrows with lines indicating spacing
const LineHeightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Text lines */}
    <line x1="11" y1="6" x2="21" y2="6" />
    <line x1="11" y1="12" x2="21" y2="12" />
    <line x1="11" y1="18" x2="21" y2="18" />
    {/* Vertical line with arrows */}
    <line x1="5" y1="4" x2="5" y2="20" />
    <polyline points="3,7 5,4 7,7" />
    <polyline points="3,17 5,20 7,17" />
  </svg>
);

interface LineHeightDropdownProps {
  editor: Editor;
}

export const LineHeightDropdown = forwardRef<HTMLButtonElement, LineHeightDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentHeight, setCurrentHeight] = useState(1.5);
    const [inputValue, setInputValue] = useState('1.5');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update current height when editor selection changes
    // Line-height is a BLOCK attribute (paragraph/heading), not a text mark
    useEffect(() => {
      const updateHeight = () => {
        const blockAttrs = getBlockAttrsAtCursor(editor);
        const lineHeight = blockAttrs.lineHeight as string | undefined;

        if (lineHeight) {
          const numericHeight = parseFloat(lineHeight);
          if (!isNaN(numericHeight)) {
            setCurrentHeight(numericHeight);
            if (!isEditing) {
              setInputValue(String(numericHeight));
            }
          }
        } else {
          setCurrentHeight(1.5);
          if (!isEditing) {
            setInputValue('1.5');
          }
        }
      };

      updateHeight();
      editor.on('selectionUpdate', updateHeight);
      editor.on('transaction', updateHeight);

      return () => {
        editor.off('selectionUpdate', updateHeight);
        editor.off('transaction', updateHeight);
      };
    }, [editor, isEditing]);

    const applyHeight = useCallback(
      (height: number) => {
        const clampedHeight = Math.min(10, Math.max(0.2, height));
        editor.chain().focus().setLineHeight(String(clampedHeight)).run();
      },
      [editor]
    );

    const handleHeightSelect = useCallback(
      (heightValue: string) => {
        editor.chain().focus().setLineHeight(heightValue).run();
        setIsOpen(false);
      },
      [editor]
    );

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow numbers and decimal point
      const value = e.target.value.replace(/[^\d.]/g, '');
      setInputValue(value);
    }, []);

    const handleInputBlur = useCallback(() => {
      setIsEditing(false);
      const height = parseFloat(inputValue);
      if (!isNaN(height) && height >= 0.2 && height <= 10) {
        applyHeight(height);
      } else {
        setInputValue(String(currentHeight));
      }
    }, [inputValue, currentHeight, applyHeight]);

    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Always stop propagation to prevent toolbar/editor from catching keys
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (e.key === 'Enter') {
          e.preventDefault();
          const height = parseFloat(inputValue);
          if (!isNaN(height) && height >= 0.2 && height <= 10) {
            applyHeight(height);
          }
          setIsEditing(false);
          // Use setTimeout to ensure blur happens after React updates
          setTimeout(() => inputRef.current?.blur(), 0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setInputValue(String(currentHeight));
          setIsEditing(false);
          setTimeout(() => inputRef.current?.blur(), 0);
        }
        // Other keys: don't preventDefault so typing works normally
      },
      [inputValue, currentHeight, applyHeight]
    );

    const handleInputFocus = useCallback(() => {
      setIsEditing(true);
      inputRef.current?.select();
    }, []);

    // Reset to default (1.5)
    const handleReset = useCallback(() => {
      editor.chain().focus().setLineHeight('1.5').run();
    }, [editor]);

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Icon = Reset button */}
        <Button
          type="button"
          data-style="ghost"
          onClick={handleReset}
          aria-label="Reset line spacing"
          tooltip="Reset to 1.5"
          ref={ref}
          style={{ padding: '4px 4px' }}
        >
          <LineHeightIcon />
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
          aria-label="Line spacing"
        />

        {/* Dropdown trigger - only the chevron */}
        <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              data-style="ghost"
              role="button"
              tabIndex={-1}
              aria-label="Line spacing presets"
              style={{ padding: '4px 2px', minWidth: 'auto' }}
            >
              <ChevronDownIcon className="tiptap-button-dropdown-small" />
            </Button>
          </DropdownMenuTrigger>

        <DropdownMenuContent align="start" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Card>
            <CardBody>
              <ButtonGroup orientation="vertical">
                {LINE_HEIGHTS.map((height) => (
                  <DropdownMenuItem key={height.value} asChild>
                    <Button
                      type="button"
                      data-style="ghost"
                      data-active-state={Math.abs(currentHeight - parseFloat(height.value)) < 0.01 ? 'on' : 'off'}
                      onClick={() => handleHeightSelect(height.value)}
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      <span className="tiptap-button-text">{height.name}</span>
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

LineHeightDropdown.displayName = 'LineHeightDropdown';

export default LineHeightDropdown;
