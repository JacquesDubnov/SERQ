/**
 * FontFamilyDropdown - Dynamic Font Selection
 *
 * Fonts are loaded from styleStore - fully configurable by user.
 * No hardcoded font lists. Everything is dynamic.
 */

import { forwardRef, useCallback, useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// Utils
import { getTextStyleAtCursor } from '@/lib/editor-utils';

// Store - dynamic font configuration + heading style reactivity
import { useStyleStore } from '@/stores/styleStore';

// TipTap UI Primitives
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody, CardGroupLabel, CardItemGroup } from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';

interface FontFamilyDropdownProps {
  editor: Editor;
}

export const FontFamilyDropdown = forwardRef<HTMLButtonElement, FontFamilyDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentFont, setCurrentFont] = useState('Font');
    const [currentValue, setCurrentValue] = useState<string | null>(null);

    // Subscribe to styleStore - dynamic font configuration + heading style reactivity
    const headingCustomStyles = useStyleStore((state) => state.headingCustomStyles);
    const fontCategories = useStyleStore((state) => state.fontCategories);
    const availableFonts = useStyleStore((state) => state.availableFonts);

    // Update current font when editor selection changes OR heading styles change
    useEffect(() => {
      const updateFont = () => {
        const attrs = getTextStyleAtCursor(editor);
        const fontFamily = (attrs.fontFamily as string) || null;

        // Find match in dynamic font list from store
        const match = availableFonts.find((f) => f.value === fontFamily);
        setCurrentValue(fontFamily);
        setCurrentFont(match?.label || 'Font');
      };

      updateFont();
      editor.on('selectionUpdate', updateFont);
      editor.on('transaction', updateFont);

      return () => {
        editor.off('selectionUpdate', updateFont);
        editor.off('transaction', updateFont);
      };
    }, [editor, headingCustomStyles, availableFonts]); // Re-run when fonts or headingCustomStyles changes

    const handleFontSelect = useCallback(
      (fontValue: string) => {
        editor.chain().focus().setFontFamily(fontValue).run();
        setIsOpen(false);
      },
      [editor]
    );

    const handleUnset = useCallback(() => {
      editor.chain().focus().unsetFontFamily().run();
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
            aria-label="Select font family"
            tooltip="Font Family"
            ref={ref}
            style={{ minWidth: '100px' }}
          >
            <span className="tiptap-button-text" style={{ fontSize: '12px' }}>
              {currentFont}
            </span>
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" style={{ width: '200px', padding: 0, background: 'transparent', border: 'none', boxShadow: 'none', borderRadius: '12px', overflow: 'hidden' }}>
          <Card style={{ overflow: 'hidden', width: '100%', borderRadius: '12px' }}>
            <CardBody style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden', paddingTop: '12px', paddingBottom: '12px', paddingRight: '4px' }}>
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
                            data-active-state={currentValue === font.value ? 'on' : 'off'}
                            onClick={() => handleFontSelect(font.value)}
                            style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
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
                            data-active-state={currentValue === font.value ? 'on' : 'off'}
                            onClick={() => handleFontSelect(font.value)}
                            style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
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
                            data-active-state={currentValue === font.value ? 'on' : 'off'}
                            onClick={() => handleFontSelect(font.value)}
                            style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
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
                          data-active-state={currentValue === font.value ? 'on' : 'off'}
                          onClick={() => handleFontSelect(font.value)}
                          style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
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

FontFamilyDropdown.displayName = 'FontFamilyDropdown';

export default FontFamilyDropdown;
