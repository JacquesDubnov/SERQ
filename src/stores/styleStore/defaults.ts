/**
 * Style Store - Default Configurable Options
 *
 * Default font categories, weights, and colors.
 * Users can modify these via settings.
 */

import type { FontCategories, FontOption, FontWeightOption, ColorOption } from './types';

export const DEFAULT_FONT_CATEGORIES: FontCategories = {
  sansSerif: [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: '"Open Sans", sans-serif', label: 'Open Sans' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: '"Source Sans 3", sans-serif', label: 'Source Sans 3' },
    { value: 'Nunito, sans-serif', label: 'Nunito' },
    { value: 'Raleway, sans-serif', label: 'Raleway' },
    { value: '"Work Sans", sans-serif', label: 'Work Sans' },
  ],
  serif: [
    { value: '"Playfair Display", serif', label: 'Playfair Display' },
    { value: 'Merriweather, serif', label: 'Merriweather' },
    { value: 'Lora, serif', label: 'Lora' },
    { value: '"PT Serif", serif', label: 'PT Serif' },
    { value: '"Libre Baskerville", serif', label: 'Libre Baskerville' },
    { value: '"Crimson Text", serif', label: 'Crimson Text' },
    { value: 'Bitter, serif', label: 'Bitter' },
    { value: '"Source Serif 4", serif', label: 'Source Serif 4' },
    { value: '"Noto Serif", serif', label: 'Noto Serif' },
    { value: '"EB Garamond", serif', label: 'EB Garamond' },
  ],
  display: [
    { value: 'Oswald, sans-serif', label: 'Oswald' },
    { value: '"Bebas Neue", sans-serif', label: 'Bebas Neue' },
    { value: 'Anton, sans-serif', label: 'Anton' },
    { value: '"Abril Fatface", serif', label: 'Abril Fatface' },
    { value: 'Righteous, sans-serif', label: 'Righteous' },
  ],
  monospace: [
    { value: '"Fira Code", monospace', label: 'Fira Code' },
    { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
    { value: '"Source Code Pro", monospace', label: 'Source Code Pro' },
    { value: '"IBM Plex Mono", monospace', label: 'IBM Plex Mono' },
    { value: '"Roboto Mono", monospace', label: 'Roboto Mono' },
  ],
};

export const DEFAULT_FONT_WEIGHTS: FontWeightOption[] = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extralight' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extrabold' },
  { value: 900, label: 'Black' },
];

export const DEFAULT_TEXT_COLORS: ColorOption[] = [
  { value: 'var(--tt-color-text-red)', label: 'Red' },
  { value: 'var(--tt-color-text-orange)', label: 'Orange' },
  { value: 'var(--tt-color-text-yellow)', label: 'Yellow' },
  { value: 'var(--tt-color-text-green)', label: 'Green' },
  { value: 'var(--tt-color-text-blue)', label: 'Blue' },
  { value: 'var(--tt-color-text-purple)', label: 'Purple' },
  { value: 'var(--tt-color-text-pink)', label: 'Pink' },
  { value: 'var(--tt-color-text-gray)', label: 'Gray' },
];

export const DEFAULT_HIGHLIGHT_COLORS: ColorOption[] = [
  { value: 'var(--tt-color-highlight-red)', label: 'Red' },
  { value: 'var(--tt-color-highlight-orange)', label: 'Orange' },
  { value: 'var(--tt-color-highlight-yellow)', label: 'Yellow' },
  { value: 'var(--tt-color-highlight-green)', label: 'Green' },
  { value: 'var(--tt-color-highlight-blue)', label: 'Blue' },
  { value: 'var(--tt-color-highlight-purple)', label: 'Purple' },
  { value: 'var(--tt-color-highlight-pink)', label: 'Pink' },
  { value: 'var(--tt-color-highlight-gray)', label: 'Gray' },
];

/**
 * Flatten font categories into a single array for flat dropdowns.
 */
export function flattenFontCategories(cats: FontCategories): FontOption[] {
  return [...cats.sansSerif, ...cats.serif, ...cats.display, ...cats.monospace];
}
