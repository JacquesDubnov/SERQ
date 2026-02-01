/**
 * FontKeyboardShortcuts Extension
 * Keyboard shortcuts for cycling fonts, weights, and sizes on the current line
 *
 * Shortcuts:
 * - Cmd+Option+Up/Down: Cycle through font families
 * - Cmd+Option+Right/Left: Cycle through font weights
 * - Cmd+Ctrl+Up/Down: Increase/decrease font size
 */
import { Extension } from '@tiptap/core';
import { ALL_FONTS, FONT_SIZES, type FontConfig } from '../../lib/fonts';

export interface FontKeyboardShortcutsOptions {
  fonts?: FontConfig[];
}

/**
 * Select the entire current paragraph/block
 */
function selectCurrentBlock(editor: any): boolean {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  // Get the start and end of the current block
  const start = $from.start();
  const end = start + $from.parent.content.size;

  // Select the block
  editor.commands.setTextSelection({ from: start, to: end });
  return true;
}

/**
 * Get current font family
 */
function getCurrentFontFamily(editor: any): string | null {
  const attrs = editor.getAttributes('textStyle');
  return attrs.fontFamily || null;
}

/**
 * Get current font weight
 */
function getCurrentFontWeight(editor: any): number {
  const attrs = editor.getAttributes('textStyle');
  const weight = attrs.fontWeight;
  return weight ? parseInt(weight, 10) : 400;
}

/**
 * Get current font size
 */
function getCurrentFontSize(editor: any): number {
  const attrs = editor.getAttributes('textStyle');
  const size = attrs.fontSize;
  if (size) {
    const match = size.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 16;
  }
  return 16;
}

/**
 * Find font config by family string
 * More robust matching: check if font name is in family, or family is in font's family, or exact match
 */
function findFontByFamily(family: string | null, fonts: FontConfig[]): FontConfig | null {
  if (!family) return null;
  const normalizedFamily = family.toLowerCase().replace(/['"]/g, '');
  return fonts.find(f => {
    const normalizedFontFamily = f.family.toLowerCase().replace(/['"]/g, '');
    const normalizedName = f.name.toLowerCase();
    return (
      normalizedFamily.includes(normalizedName) ||
      normalizedFontFamily.includes(normalizedFamily.split(',')[0].trim()) ||
      normalizedFamily === normalizedFontFamily
    );
  }) || null;
}

/**
 * Find font index in array by comparing font family strings
 * EXACT matching only - no partial matches to avoid "Roboto Mono" matching "Roboto"
 */
function findFontIndex(family: string | null, fonts: FontConfig[]): number {
  if (!family) {
    console.log('[findFontIndex] No family provided, returning 0 (start of list)');
    return 0;
  }

  // Extract the first font name from the family string
  // e.g., "'Roboto Mono', monospace" -> "roboto mono"
  // e.g., "system-ui, -apple-system, ..." -> "system-ui"
  const normalized = family.toLowerCase().replace(/['"]/g, '').split(',')[0].trim();
  console.log('[findFontIndex] Looking for:', normalized, 'in', fonts.length, 'fonts');

  for (let i = 0; i < fonts.length; i++) {
    const fontName = fonts[i].name.toLowerCase();
    const fontFamily = fonts[i].family.toLowerCase().replace(/['"]/g, '').split(',')[0].trim();

    // EXACT match only - normalized must equal fontName or fontFamily
    if (normalized === fontName || normalized === fontFamily) {
      console.log('[findFontIndex] Found EXACT match at index', i, ':', fonts[i].name);
      return i;
    }
  }

  console.log('[findFontIndex] No exact match found, returning 0');
  return 0;
}

export const FontKeyboardShortcuts = Extension.create<FontKeyboardShortcutsOptions>({
  name: 'fontKeyboardShortcuts',

  addOptions() {
    return {
      fonts: ALL_FONTS,
    };
  },

  addKeyboardShortcuts() {
    const fonts = this.options.fonts || ALL_FONTS;

    return {
      // Cmd+Option+ArrowUp: Previous font family
      'Mod-Alt-ArrowUp': ({ editor }) => {
        console.log('[FontShortcuts] Mod-Alt-ArrowUp triggered');

        // Store original cursor position
        const originalPos = editor.state.selection.from;

        // Get current font before selecting
        const currentFamily = getCurrentFontFamily(editor);
        const currentIndex = findFontIndex(currentFamily, fonts);

        // Calculate previous font (wrap around)
        const prevIndex = currentIndex <= 0 ? fonts.length - 1 : currentIndex - 1;
        const newFont = fonts[prevIndex];

        console.log('[FontShortcuts] Current:', currentFamily, 'index:', currentIndex, '→ Changing to:', newFont.name, 'index:', prevIndex, '(total fonts:', fonts.length, ')');

        // Select block, apply font, restore cursor
        selectCurrentBlock(editor);
        editor.commands.setFontFamily(newFont.family);
        editor.commands.setTextSelection(originalPos);

        return true;
      },

      // Cmd+Option+ArrowDown: Next font family
      'Mod-Alt-ArrowDown': ({ editor }) => {
        console.log('[FontShortcuts] ====== Mod-Alt-ArrowDown triggered ======');
        console.log('[FontShortcuts] Total fonts in list:', fonts.length);
        console.log('[FontShortcuts] Font names:', fonts.map(f => f.name).join(', '));

        const originalPos = editor.state.selection.from;

        const currentFamily = getCurrentFontFamily(editor);
        console.log('[FontShortcuts] Current font family from editor:', currentFamily);

        const currentIndex = findFontIndex(currentFamily, fonts);
        console.log('[FontShortcuts] Current index:', currentIndex);

        // Calculate next font (wrap around)
        const nextIndex = currentIndex >= fonts.length - 1 ? 0 : currentIndex + 1;
        const newFont = fonts[nextIndex];

        console.log('[FontShortcuts] Next index:', nextIndex, '→ New font:', newFont.name, '(', newFont.family, ')');

        selectCurrentBlock(editor);
        editor.commands.setFontFamily(newFont.family);
        editor.commands.setTextSelection(originalPos);

        console.log('[FontShortcuts] ====== Done ======');
        return true;
      },

      // Cmd+Option+ArrowRight: Next font weight
      'Mod-Alt-ArrowRight': ({ editor }) => {
        console.log('[FontShortcuts] Mod-Alt-ArrowRight triggered');

        const originalPos = editor.state.selection.from;

        const currentFamily = getCurrentFontFamily(editor);
        const currentFont = findFontByFamily(currentFamily, fonts);
        const currentWeight = getCurrentFontWeight(editor);

        const availableWeights = currentFont?.weights || [
          { value: 400, label: 'Regular' },
          { value: 700, label: 'Bold' },
        ];

        const currentWeightIndex = availableWeights.findIndex(w => w.value === currentWeight);
        const nextIndex = currentWeightIndex >= availableWeights.length - 1 ? 0 : currentWeightIndex + 1;
        const newWeight = availableWeights[nextIndex];

        console.log('[FontShortcuts] Changing weight to:', newWeight.label);

        selectCurrentBlock(editor);
        editor.commands.setFontWeight(String(newWeight.value));
        editor.commands.setTextSelection(originalPos);

        return true;
      },

      // Cmd+Option+ArrowLeft: Previous font weight
      'Mod-Alt-ArrowLeft': ({ editor }) => {
        console.log('[FontShortcuts] Mod-Alt-ArrowLeft triggered');

        const originalPos = editor.state.selection.from;

        const currentFamily = getCurrentFontFamily(editor);
        const currentFont = findFontByFamily(currentFamily, fonts);
        const currentWeight = getCurrentFontWeight(editor);

        const availableWeights = currentFont?.weights || [
          { value: 400, label: 'Regular' },
          { value: 700, label: 'Bold' },
        ];

        const currentWeightIndex = availableWeights.findIndex(w => w.value === currentWeight);
        const prevIndex = currentWeightIndex <= 0 ? availableWeights.length - 1 : currentWeightIndex - 1;
        const newWeight = availableWeights[prevIndex];

        console.log('[FontShortcuts] Changing weight to:', newWeight.label);

        selectCurrentBlock(editor);
        editor.commands.setFontWeight(String(newWeight.value));
        editor.commands.setTextSelection(originalPos);

        return true;
      },

      // Cmd+Ctrl+ArrowUp: Increase font size
      'Mod-Control-ArrowUp': ({ editor }) => {
        console.log('[FontShortcuts] Mod-Control-ArrowUp triggered');

        const originalPos = editor.state.selection.from;
        const currentSize = getCurrentFontSize(editor);

        const currentIndex = FONT_SIZES.findIndex(s => s >= currentSize);
        const nextIndex = Math.min(
          currentIndex >= 0 ? currentIndex + 1 : 0,
          FONT_SIZES.length - 1
        );
        const newSize = FONT_SIZES[nextIndex];

        console.log('[FontShortcuts] Changing size to:', newSize);

        selectCurrentBlock(editor);
        editor.commands.setFontSize(`${newSize}px`);
        editor.commands.setTextSelection(originalPos);

        return true;
      },

      // Cmd+Ctrl+ArrowDown: Decrease font size
      'Mod-Control-ArrowDown': ({ editor }) => {
        console.log('[FontShortcuts] Mod-Control-ArrowDown triggered');

        const originalPos = editor.state.selection.from;
        const currentSize = getCurrentFontSize(editor);

        const currentIndex = FONT_SIZES.findIndex(s => s >= currentSize);
        const prevIndex = Math.max(
          (currentIndex > 0 ? currentIndex : 1) - 1,
          0
        );
        const newSize = FONT_SIZES[prevIndex];

        console.log('[FontShortcuts] Changing size to:', newSize);

        selectCurrentBlock(editor);
        editor.commands.setFontSize(`${newSize}px`);
        editor.commands.setTextSelection(originalPos);

        return true;
      },

      // Cmd+Shift+B: Bold entire line
      'Mod-Shift-b': ({ editor }) => {
        const originalPos = editor.state.selection.from;
        selectCurrentBlock(editor);
        editor.commands.toggleBold();
        editor.commands.setTextSelection(originalPos);
        return true;
      },

      // Cmd+Shift+I: Italic entire line
      'Mod-Shift-i': ({ editor }) => {
        const originalPos = editor.state.selection.from;
        selectCurrentBlock(editor);
        editor.commands.toggleItalic();
        editor.commands.setTextSelection(originalPos);
        return true;
      },

      // Cmd+Shift+U: Underline entire line
      'Mod-Shift-u': ({ editor }) => {
        const originalPos = editor.state.selection.from;
        selectCurrentBlock(editor);
        editor.commands.toggleUnderline();
        editor.commands.setTextSelection(originalPos);
        return true;
      },

      // Cmd+Shift+S: Strikethrough entire line
      'Mod-Shift-s': ({ editor }) => {
        const originalPos = editor.state.selection.from;
        selectCurrentBlock(editor);
        editor.commands.toggleStrike();
        editor.commands.setTextSelection(originalPos);
        return true;
      },
    };
  },
});

export default FontKeyboardShortcuts;
