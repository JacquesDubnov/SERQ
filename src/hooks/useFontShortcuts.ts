/**
 * useFontShortcuts Hook
 * Keyboard shortcuts for cycling fonts, weights, and sizes on the current line
 *
 * Shortcuts:
 * - Cmd+Option+Up/Down: Cycle through font families
 * - Cmd+Option+Left/Right: Cycle through font weights
 * - Cmd+Option+./,  : Increase/decrease font size
 */
import { useHotkeys } from 'react-hotkeys-hook';
import type { Editor } from '@tiptap/core';
import { ALL_FONTS, FONT_SIZES, type FontConfig } from '../lib/fonts';

/**
 * Select the entire current paragraph/block and apply a style
 */
function applyToCurrentBlock(
  editor: Editor,
  applyFn: () => void
): void {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  // Store original cursor position
  const originalPos = selection.from;

  // Get the start and end of the current block
  const start = $from.start();
  const end = start + $from.parent.content.size;

  // Only proceed if there's actual content
  if (end <= start) return;

  // Select the block, apply style, restore cursor
  editor.commands.setTextSelection({ from: start, to: end });
  applyFn();
  editor.commands.setTextSelection(originalPos);
}

/**
 * Get current font family from editor
 */
function getCurrentFontFamily(editor: Editor): string | null {
  const attrs = editor.getAttributes('textStyle');
  return attrs.fontFamily || null;
}

/**
 * Get current font weight from editor
 */
function getCurrentFontWeight(editor: Editor): number {
  const attrs = editor.getAttributes('textStyle');
  const weight = attrs.fontWeight;
  return weight ? parseInt(weight, 10) : 400;
}

/**
 * Get current font size from editor
 */
function getCurrentFontSize(editor: Editor): number {
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
 */
function findFontByFamily(family: string | null): FontConfig | null {
  if (!family) return null;
  return ALL_FONTS.find(f =>
    family.includes(f.name) || f.family === family
  ) || null;
}

/**
 * Hook for font-related keyboard shortcuts
 */
export function useFontShortcuts(editor: Editor | null) {
  // Cmd+Option+Up: Previous font family
  useHotkeys(
    'mod+alt+up',
    (e) => {
      e.preventDefault();
      if (!editor) return;
      console.log('[FontShortcuts] mod+alt+up triggered');

      const currentFamily = getCurrentFontFamily(editor);
      const currentIndex = currentFamily
        ? ALL_FONTS.findIndex(f => currentFamily.includes(f.name) || f.family === currentFamily)
        : -1;

      const prevIndex = currentIndex <= 0 ? ALL_FONTS.length - 1 : currentIndex - 1;
      const newFont = ALL_FONTS[prevIndex];

      console.log('[FontShortcuts] Changing font to:', newFont.name);

      applyToCurrentBlock(editor, () => {
        editor.commands.setFontFamily(newFont.family);
      });
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  // Cmd+Option+Down: Next font family
  useHotkeys(
    'mod+alt+down',
    (e) => {
      e.preventDefault();
      if (!editor) return;
      console.log('[FontShortcuts] mod+alt+down triggered');

      const currentFamily = getCurrentFontFamily(editor);
      const currentIndex = currentFamily
        ? ALL_FONTS.findIndex(f => currentFamily.includes(f.name) || f.family === currentFamily)
        : -1;

      const nextIndex = currentIndex >= ALL_FONTS.length - 1 ? 0 : currentIndex + 1;
      const newFont = ALL_FONTS[nextIndex];

      console.log('[FontShortcuts] Changing font to:', newFont.name);

      applyToCurrentBlock(editor, () => {
        editor.commands.setFontFamily(newFont.family);
      });
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  // Cmd+Option+Left: Previous font weight (thinner)
  useHotkeys(
    'mod+alt+left',
    (e) => {
      e.preventDefault();
      if (!editor) return;
      console.log('[FontShortcuts] mod+alt+left triggered');

      const currentFamily = getCurrentFontFamily(editor);
      const currentFont = findFontByFamily(currentFamily);
      const currentWeight = getCurrentFontWeight(editor);

      const availableWeights = currentFont?.weights || [
        { value: 400, label: 'Regular' },
        { value: 700, label: 'Bold' },
      ];

      const currentWeightIndex = availableWeights.findIndex(w => w.value === currentWeight);
      const prevIndex = currentWeightIndex <= 0 ? availableWeights.length - 1 : currentWeightIndex - 1;
      const newWeight = availableWeights[prevIndex];

      console.log('[FontShortcuts] Changing weight to:', newWeight.label);

      applyToCurrentBlock(editor, () => {
        editor.commands.setFontWeight(String(newWeight.value));
      });
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  // Cmd+Option+Right: Next font weight (bolder)
  useHotkeys(
    'mod+alt+right',
    (e) => {
      e.preventDefault();
      if (!editor) return;
      console.log('[FontShortcuts] mod+alt+right triggered');

      const currentFamily = getCurrentFontFamily(editor);
      const currentFont = findFontByFamily(currentFamily);
      const currentWeight = getCurrentFontWeight(editor);

      const availableWeights = currentFont?.weights || [
        { value: 400, label: 'Regular' },
        { value: 700, label: 'Bold' },
      ];

      const currentWeightIndex = availableWeights.findIndex(w => w.value === currentWeight);
      const nextIndex = currentWeightIndex >= availableWeights.length - 1 ? 0 : currentWeightIndex + 1;
      const newWeight = availableWeights[nextIndex];

      console.log('[FontShortcuts] Changing weight to:', newWeight.label);

      applyToCurrentBlock(editor, () => {
        editor.commands.setFontWeight(String(newWeight.value));
      });
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  // Cmd+Option+. : Increase font size
  useHotkeys(
    'mod+alt+period',
    (e) => {
      e.preventDefault();
      if (!editor) return;
      console.log('[FontShortcuts] mod+alt+. triggered');

      const currentSize = getCurrentFontSize(editor);
      const currentIndex = FONT_SIZES.findIndex(s => s >= currentSize);
      const nextIndex = Math.min(
        currentIndex >= 0 ? currentIndex + 1 : 0,
        FONT_SIZES.length - 1
      );
      const newSize = FONT_SIZES[nextIndex];

      console.log('[FontShortcuts] Changing size to:', newSize);

      applyToCurrentBlock(editor, () => {
        editor.commands.setFontSize(`${newSize}px`);
      });
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  // Cmd+Option+, : Decrease font size
  useHotkeys(
    'mod+alt+comma',
    (e) => {
      e.preventDefault();
      if (!editor) return;
      console.log('[FontShortcuts] mod+alt+, triggered');

      const currentSize = getCurrentFontSize(editor);
      const currentIndex = FONT_SIZES.findIndex(s => s >= currentSize);
      const prevIndex = Math.max(
        (currentIndex > 0 ? currentIndex : 1) - 1,
        0
      );
      const newSize = FONT_SIZES[prevIndex];

      console.log('[FontShortcuts] Changing size to:', newSize);

      applyToCurrentBlock(editor, () => {
        editor.commands.setFontSize(`${newSize}px`);
      });
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );
}
