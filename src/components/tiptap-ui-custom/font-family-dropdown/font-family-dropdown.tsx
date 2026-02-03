/**
 * FontFamilyDropdown - Google Fonts Selection
 *
 * Top 30 Google fonts with their weight variants.
 * Dynamically shows current selection's font family.
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
import { Card, CardBody, CardGroupLabel, CardItemGroup } from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';

// Google Fonts - Top 30 with categories
export const GOOGLE_FONTS = {
  sansSerif: [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Source Sans 3', value: '"Source Sans 3", sans-serif' },
    { name: 'Nunito', value: 'Nunito, sans-serif' },
    { name: 'Raleway', value: 'Raleway, sans-serif' },
    { name: 'Work Sans', value: '"Work Sans", sans-serif' },
  ],
  serif: [
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Lora', value: 'Lora, serif' },
    { name: 'PT Serif', value: '"PT Serif", serif' },
    { name: 'Libre Baskerville', value: '"Libre Baskerville", serif' },
    { name: 'Crimson Text', value: '"Crimson Text", serif' },
    { name: 'Bitter', value: 'Bitter, serif' },
    { name: 'Source Serif 4', value: '"Source Serif 4", serif' },
    { name: 'Noto Serif', value: '"Noto Serif", serif' },
    { name: 'EB Garamond', value: '"EB Garamond", serif' },
  ],
  display: [
    { name: 'Oswald', value: 'Oswald, sans-serif' },
    { name: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
    { name: 'Anton', value: 'Anton, sans-serif' },
    { name: 'Abril Fatface', value: '"Abril Fatface", serif' },
    { name: 'Righteous', value: 'Righteous, sans-serif' },
  ],
  monospace: [
    { name: 'Fira Code', value: '"Fira Code", monospace' },
    { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
    { name: 'Source Code Pro', value: '"Source Code Pro", monospace' },
    { name: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
    { name: 'Roboto Mono', value: '"Roboto Mono", monospace' },
  ],
};

// All fonts flattened for lookup
const ALL_FONTS = [
  ...GOOGLE_FONTS.sansSerif,
  ...GOOGLE_FONTS.serif,
  ...GOOGLE_FONTS.display,
  ...GOOGLE_FONTS.monospace,
];

interface FontFamilyDropdownProps {
  editor: Editor;
}

export const FontFamilyDropdown = forwardRef<HTMLButtonElement, FontFamilyDropdownProps>(
  ({ editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentFont, setCurrentFont] = useState('Font');
    const [currentValue, setCurrentValue] = useState<string | null>(null);

    // Update current font when editor selection changes
    useEffect(() => {
      const updateFont = () => {
        const attrs = getTextStyleAtCursor(editor);
        const fontFamily = (attrs.fontFamily as string) || null;

        const match = ALL_FONTS.find((f) => f.value === fontFamily);
        console.log('[FontFamilyDropdown] fontFamily:', fontFamily, '| match:', match?.name || 'none');

        setCurrentValue(fontFamily);
        setCurrentFont(match?.name || 'Font');
      };

      updateFont();
      editor.on('selectionUpdate', updateFont);
      editor.on('transaction', updateFont);

      return () => {
        editor.off('selectionUpdate', updateFont);
        editor.off('transaction', updateFont);
      };
    }, [editor]);

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

              {/* Sans Serif */}
              <CardItemGroup>
                <CardGroupLabel>Sans Serif</CardGroupLabel>
                <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                  {GOOGLE_FONTS.sansSerif.map((font) => (
                    <DropdownMenuItem key={font.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={currentValue === font.value ? 'on' : 'off'}
                        onClick={() => handleFontSelect(font.value)}
                        style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
                      >
                        <span className="tiptap-button-text">{font.name}</span>
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Serif */}
              <CardItemGroup>
                <CardGroupLabel>Serif</CardGroupLabel>
                <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                  {GOOGLE_FONTS.serif.map((font) => (
                    <DropdownMenuItem key={font.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={currentValue === font.value ? 'on' : 'off'}
                        onClick={() => handleFontSelect(font.value)}
                        style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
                      >
                        <span className="tiptap-button-text">{font.name}</span>
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Display */}
              <CardItemGroup>
                <CardGroupLabel>Display</CardGroupLabel>
                <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                  {GOOGLE_FONTS.display.map((font) => (
                    <DropdownMenuItem key={font.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={currentValue === font.value ? 'on' : 'off'}
                        onClick={() => handleFontSelect(font.value)}
                        style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
                      >
                        <span className="tiptap-button-text">{font.name}</span>
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Monospace */}
              <CardItemGroup>
                <CardGroupLabel>Monospace</CardGroupLabel>
                <ButtonGroup orientation="vertical" style={{ paddingLeft: '12px' }}>
                  {GOOGLE_FONTS.monospace.map((font) => (
                    <DropdownMenuItem key={font.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={currentValue === font.value ? 'on' : 'off'}
                        onClick={() => handleFontSelect(font.value)}
                        style={{ width: '100%', justifyContent: 'flex-start', fontFamily: font.value, padding: '8px 12px' }}
                      >
                        <span className="tiptap-button-text">{font.name}</span>
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

FontFamilyDropdown.displayName = 'FontFamilyDropdown';

export default FontFamilyDropdown;
