/**
 * FontFamilyControl - Unified font family dropdown
 *
 * Uses useUnifiedFontFamily hook for context-aware styling.
 * Shows blue dot when displaying heading-level style.
 *
 * IMPORTANT: Font options come from styleStore (dynamic, user-configurable).
 * Never hardcode font lists here.
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
import { Card, CardBody, CardGroupLabel, CardItemGroup } from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';

import { useUnifiedFontFamily } from '@/hooks/style-hooks';
import { useStyleStore } from '@/stores/styleStore';

interface FontFamilyControlProps {
  editor: Editor;
}

export const FontFamilyControl = forwardRef<HTMLButtonElement, FontFamilyControlProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    // Get dynamic font categories from store
    const fontCategories = useStyleStore((state) => state.fontCategories);

    const {
      value,
      displayName,
      isHeadingLevel,
      setFontFamily,
      clearFontFamily,
    } = useUnifiedFontFamily(editor);

    const handleFontSelect = useCallback((fontValue: string) => {
      setFontFamily(fontValue);
      setIsOpen(false);
    }, [setFontFamily]);

    const handleUnset = useCallback(() => {
      clearFontFamily();
      setIsOpen(false);
    }, [clearFontFamily]);

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Select font family"
            tooltip="Font Family"
            ref={ref}
            style={{ minWidth: '100px', position: 'relative' }}
          >
            <span className="tiptap-button-text" style={{ fontSize: '12px' }}>
              {displayName}
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
            width: '200px',
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
                maxHeight: '400px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingTop: '12px',
                paddingBottom: '12px',
                paddingRight: '4px',
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

              {/* Sans Serif - from dynamic store */}
              {fontCategories.sansSerif.length > 0 && (
                <>
                  <CardItemGroup>
                    <CardGroupLabel>Sans Serif</CardGroupLabel>
                    <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                      {fontCategories.sansSerif.map((font) => (
                        <DropdownMenuItem key={font.value} asChild>
                          <Button
                            type="button"
                            data-style="ghost"
                            data-active-state={value === font.value ? 'on' : 'off'}
                            onClick={() => handleFontSelect(font.value)}
                            style={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              fontFamily: font.value,
                              padding: '8px 12px',
                            }}
                          >
                            <span className="tiptap-button-text">{font.label}</span>
                          </Button>
                        </DropdownMenuItem>
                      ))}
                    </ButtonGroup>
                  </CardItemGroup>
                  <Separator orientation="horizontal" />
                </>
              )}

              {/* Serif - from dynamic store */}
              {fontCategories.serif.length > 0 && (
                <>
                  <CardItemGroup>
                    <CardGroupLabel>Serif</CardGroupLabel>
                    <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                      {fontCategories.serif.map((font) => (
                        <DropdownMenuItem key={font.value} asChild>
                          <Button
                            type="button"
                            data-style="ghost"
                            data-active-state={value === font.value ? 'on' : 'off'}
                            onClick={() => handleFontSelect(font.value)}
                            style={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              fontFamily: font.value,
                              padding: '8px 12px',
                            }}
                          >
                            <span className="tiptap-button-text">{font.label}</span>
                          </Button>
                        </DropdownMenuItem>
                      ))}
                    </ButtonGroup>
                  </CardItemGroup>
                  <Separator orientation="horizontal" />
                </>
              )}

              {/* Display - from dynamic store */}
              {fontCategories.display.length > 0 && (
                <>
                  <CardItemGroup>
                    <CardGroupLabel>Display</CardGroupLabel>
                    <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                      {fontCategories.display.map((font) => (
                        <DropdownMenuItem key={font.value} asChild>
                          <Button
                            type="button"
                            data-style="ghost"
                            data-active-state={value === font.value ? 'on' : 'off'}
                            onClick={() => handleFontSelect(font.value)}
                            style={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              fontFamily: font.value,
                              padding: '8px 12px',
                            }}
                          >
                            <span className="tiptap-button-text">{font.label}</span>
                          </Button>
                        </DropdownMenuItem>
                      ))}
                    </ButtonGroup>
                  </CardItemGroup>
                  <Separator orientation="horizontal" />
                </>
              )}

              {/* Monospace - from dynamic store */}
              {fontCategories.monospace.length > 0 && (
                <CardItemGroup>
                  <CardGroupLabel>Monospace</CardGroupLabel>
                  <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                    {fontCategories.monospace.map((font) => (
                      <DropdownMenuItem key={font.value} asChild>
                        <Button
                          type="button"
                          data-style="ghost"
                          data-active-state={value === font.value ? 'on' : 'off'}
                          onClick={() => handleFontSelect(font.value)}
                          style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            fontFamily: font.value,
                            padding: '8px 12px',
                          }}
                        >
                          <span className="tiptap-button-text">{font.label}</span>
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </ButtonGroup>
                </CardItemGroup>
              )}
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

FontFamilyControl.displayName = 'FontFamilyControl';
