/**
 * SpacingControls - Unified paragraph spacing dropdowns
 *
 * Uses useUnifiedSpacingBefore/After hooks for context-aware styling.
 * Shows blue dot when displaying heading-level style.
 */

import { forwardRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';

import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';
import { ArrowUpIcon } from '@/components/tiptap-icons/arrow-up-icon';
import { ArrowDownIcon } from '@/components/tiptap-icons/arrow-down-icon';
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody, CardItemGroup } from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';

import {
  useUnifiedSpacingBefore,
  useUnifiedSpacingAfter,
  PARAGRAPH_SPACINGS,
} from '@/hooks/style-hooks';

interface SpacingBeforeControlProps {
  editor: Editor;
}

export const SpacingBeforeControl = forwardRef<HTMLButtonElement, SpacingBeforeControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
      value,
      displayValue,
      isHeadingLevel,
      setSpacingBefore,
      clearSpacingBefore,
    } = useUnifiedSpacingBefore(editor);

    const handleSpacingSelect = useCallback((spacing: number) => {
      setSpacingBefore(spacing);
      setIsOpen(false);
    }, [setSpacingBefore]);

    const handleClear = useCallback(() => {
      clearSpacingBefore();
      setIsOpen(false);
    }, [clearSpacingBefore]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Spacing before paragraph"
            tooltip="Spacing Before"
            ref={ref}
            style={{ minWidth: '60px', position: 'relative' }}
          >
            <ArrowUpIcon className="tiptap-button-icon" style={{ width: '12px', height: '12px' }} />
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
                maxHeight: '280px',
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

              {/* Spacing options */}
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {PARAGRAPH_SPACINGS.map((sp) => (
                    <DropdownMenuItem key={sp.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === sp.value ? 'on' : 'off'}
                        onClick={() => handleSpacingSelect(sp.value)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                        }}
                      >
                        <span className="tiptap-button-text">{sp.label} lines</span>
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

SpacingBeforeControl.displayName = 'SpacingBeforeControl';

interface SpacingAfterControlProps {
  editor: Editor;
}

export const SpacingAfterControl = forwardRef<HTMLButtonElement, SpacingAfterControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
      value,
      displayValue,
      isHeadingLevel,
      setSpacingAfter,
      clearSpacingAfter,
    } = useUnifiedSpacingAfter(editor);

    const handleSpacingSelect = useCallback((spacing: number) => {
      setSpacingAfter(spacing);
      setIsOpen(false);
    }, [setSpacingAfter]);

    const handleClear = useCallback(() => {
      clearSpacingAfter();
      setIsOpen(false);
    }, [clearSpacingAfter]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Spacing after paragraph"
            tooltip="Spacing After"
            ref={ref}
            style={{ minWidth: '60px', position: 'relative' }}
          >
            <ArrowDownIcon className="tiptap-button-icon" style={{ width: '12px', height: '12px' }} />
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
                maxHeight: '280px',
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

              {/* Spacing options */}
              <CardItemGroup>
                <ButtonGroup orientation="vertical">
                  {PARAGRAPH_SPACINGS.map((sp) => (
                    <DropdownMenuItem key={sp.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={value === sp.value ? 'on' : 'off'}
                        onClick={() => handleSpacingSelect(sp.value)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 12px',
                        }}
                      >
                        <span className="tiptap-button-text">{sp.label} lines</span>
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

SpacingAfterControl.displayName = 'SpacingAfterControl';

/**
 * Combined spacing controls component
 */
interface SpacingControlsProps {
  editor: Editor;
}

export const SpacingControls = forwardRef<HTMLDivElement, SpacingControlsProps>(
  ({ editor }, ref) => {
    return (
      <div ref={ref} style={{ display: 'flex', gap: '2px' }}>
        <SpacingBeforeControl editor={editor} />
        <SpacingAfterControl editor={editor} />
      </div>
    );
  }
);

SpacingControls.displayName = 'SpacingControls';
