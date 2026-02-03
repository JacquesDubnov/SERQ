/**
 * SpacingBeforeDropdown - Paragraph/Heading Spacing Before
 *
 * Context-aware:
 * - On paragraph: sets global paragraph spacing (affects all paragraphs)
 * - On heading (H1-H6): sets per-heading spacing (overrides global for that heading type)
 */

import { forwardRef, useCallback, useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// Store
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

// Spacing values in line units
export const SPACING_BEFORE_VALUES = [
  { name: '0', value: 0 },
  { name: '0.5', value: 0.5 },
  { name: '1', value: 1 },
  { name: '1.5', value: 1.5 },
  { name: '2', value: 2 },
  { name: '2.5', value: 2.5 },
  { name: '3', value: 3 },
  { name: '4', value: 4 },
  { name: '5', value: 5 },
];

// Spacing before icon - arrow pointing up to line
const SpacingBeforeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="4" x2="20" y2="4" />
    <line x1="12" y1="20" x2="12" y2="8" />
    <polyline points="8,12 12,8 16,12" />
  </svg>
);

interface SpacingBeforeDropdownProps {
  editor: Editor;
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const SpacingBeforeDropdown = forwardRef<HTMLButtonElement, SpacingBeforeDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [headingLevel, setHeadingLevel] = useState<HeadingLevel | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
      paragraphSpacingBefore,
      headingSpacing,
      setParagraphSpacingBefore,
      setHeadingSpacingBefore,
    } = useStyleStore();

    // Detect if cursor is on a heading
    useEffect(() => {
      const updateHeadingLevel = () => {
        for (let level = 1; level <= 6; level++) {
          if (editor.isActive('heading', { level })) {
            setHeadingLevel(level as HeadingLevel);
            return;
          }
        }
        setHeadingLevel(null);
      };

      updateHeadingLevel();
      editor.on('selectionUpdate', updateHeadingLevel);
      editor.on('transaction', updateHeadingLevel);

      return () => {
        editor.off('selectionUpdate', updateHeadingLevel);
        editor.off('transaction', updateHeadingLevel);
      };
    }, [editor]);

    // Get current spacing value based on context
    const getCurrentSpacing = useCallback(() => {
      if (headingLevel) {
        const key = `h${headingLevel}` as keyof typeof headingSpacing;
        const headingValue = headingSpacing[key]?.before;
        return headingValue !== null ? headingValue : paragraphSpacingBefore;
      }
      return paragraphSpacingBefore;
    }, [headingLevel, headingSpacing, paragraphSpacingBefore]);

    const currentSpacing = getCurrentSpacing();
    const displayValue = isEditing ? inputValue : String(currentSpacing);

    // Tooltip shows context
    const tooltipText = headingLevel
      ? `H${headingLevel} Before (Reset)`
      : 'Before ¶ (Reset)';

    const handleSpacingSelect = useCallback(
      (spacingValue: number) => {
        if (headingLevel) {
          setHeadingSpacingBefore(headingLevel, spacingValue);
        } else {
          setParagraphSpacingBefore(spacingValue);
        }
        setIsOpen(false);
      },
      [headingLevel, setHeadingSpacingBefore, setParagraphSpacingBefore]
    );

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^\d.]/g, '');
      setInputValue(value);
    }, []);

    const handleInputBlur = useCallback(() => {
      setIsEditing(false);
      const spacing = parseFloat(inputValue);
      if (!isNaN(spacing) && spacing >= 0 && spacing <= 10) {
        if (headingLevel) {
          setHeadingSpacingBefore(headingLevel, spacing);
        } else {
          setParagraphSpacingBefore(spacing);
        }
      }
    }, [inputValue, headingLevel, setHeadingSpacingBefore, setParagraphSpacingBefore]);

    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (e.key === 'Enter') {
          e.preventDefault();
          const spacing = parseFloat(inputValue);
          if (!isNaN(spacing) && spacing >= 0 && spacing <= 10) {
            if (headingLevel) {
              setHeadingSpacingBefore(headingLevel, spacing);
            } else {
              setParagraphSpacingBefore(spacing);
            }
          }
          setIsEditing(false);
          setTimeout(() => inputRef.current?.blur(), 0);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditing(false);
          setTimeout(() => inputRef.current?.blur(), 0);
        }
      },
      [inputValue, headingLevel, setHeadingSpacingBefore, setParagraphSpacingBefore]
    );

    const handleInputFocus = useCallback(() => {
      setIsEditing(true);
      setInputValue(String(currentSpacing));
      inputRef.current?.select();
    }, [currentSpacing]);

    const handleReset = useCallback(() => {
      if (headingLevel) {
        // Reset heading to use global (by setting to global value, effectively)
        setHeadingSpacingBefore(headingLevel, paragraphSpacingBefore);
      } else {
        setParagraphSpacingBefore(0);
      }
    }, [headingLevel, paragraphSpacingBefore, setHeadingSpacingBefore, setParagraphSpacingBefore]);

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="button"
          data-style="ghost"
          onClick={handleReset}
          aria-label="Reset spacing before"
          tooltip={tooltipText}
          ref={ref}
          style={{ padding: '4px 4px' }}
        >
          <SpacingBeforeIcon />
        </Button>

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          style={{
            width: '28px',
            padding: '4px 2px',
            border: 'none',
            background: 'var(--color-toolbar-input-bg, transparent)',
            fontSize: '11px',
            textAlign: 'center',
            outline: 'none',
            cursor: 'text',
            color: 'var(--color-toolbar-input-text, inherit)',
          }}
          aria-label={headingLevel ? `H${headingLevel} spacing before` : 'Spacing before (lines)'}
        />

        <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              data-style="ghost"
              role="button"
              tabIndex={-1}
              aria-label="Spacing before presets"
              style={{ padding: '4px 2px', minWidth: 'auto' }}
            >
              <ChevronDownIcon className="tiptap-button-dropdown-small" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <Card>
              <CardBody>
                <ButtonGroup orientation="vertical">
                  {SPACING_BEFORE_VALUES.map((spacing) => (
                    <DropdownMenuItem key={spacing.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={Math.abs(currentSpacing - spacing.value) < 0.01 ? 'on' : 'off'}
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

SpacingBeforeDropdown.displayName = 'SpacingBeforeDropdown';

export default SpacingBeforeDropdown;
