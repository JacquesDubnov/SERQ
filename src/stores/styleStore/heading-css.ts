/**
 * Style Store - Heading CSS Variable Helpers
 *
 * Functions that apply/clear CSS custom properties for heading custom styles.
 * These are pure DOM manipulation functions with no store dependency.
 */

import type { HeadingLevel, HeadingCustomStyle } from './types';

/**
 * Apply CSS variables for a heading custom style
 */
export function applyHeadingCustomStyleCSS(level: HeadingLevel, style: HeadingCustomStyle) {
  const root = document.documentElement;
  const prefix = `--h${level}`;

  // Typography
  if (style.fontFamily !== null) {
    root.style.setProperty(`${prefix}-font-family`, style.fontFamily);
  } else {
    root.style.removeProperty(`${prefix}-font-family`);
  }

  if (style.fontSize !== null) {
    root.style.setProperty(`${prefix}-font-size`, `${style.fontSize}px`);
  } else {
    root.style.removeProperty(`${prefix}-font-size`);
  }

  // Font weight - use explicit value, or 700 if bold is set without explicit weight
  if (style.fontWeight !== null) {
    root.style.setProperty(`${prefix}-font-weight`, String(style.fontWeight));
  } else if (style.bold) {
    // Only use 700 for bold if no explicit weight was set
    root.style.setProperty(`${prefix}-font-weight`, '700');
  } else {
    root.style.removeProperty(`${prefix}-font-weight`);
  }

  if (style.letterSpacing !== null) {
    root.style.setProperty(`${prefix}-letter-spacing`, `${style.letterSpacing}px`);
  } else {
    root.style.removeProperty(`${prefix}-letter-spacing`);
  }

  if (style.lineHeight !== null) {
    root.style.setProperty(`${prefix}-line-height`, String(style.lineHeight));
  } else {
    root.style.removeProperty(`${prefix}-line-height`);
  }

  // Text color
  if (style.textColor !== null) {
    root.style.setProperty(`${prefix}-color`, style.textColor);
  } else {
    root.style.removeProperty(`${prefix}-color`);
  }

  // Italic
  if (style.italic) {
    root.style.setProperty(`${prefix}-font-style`, 'italic');
  } else {
    root.style.removeProperty(`${prefix}-font-style`);
  }

  // Text decoration (underline, strikethrough)
  const decorations: string[] = [];
  if (style.underline) decorations.push('underline');
  if (style.strikethrough) decorations.push('line-through');
  if (decorations.length > 0) {
    root.style.setProperty(`${prefix}-text-decoration`, decorations.join(' '));
  } else {
    root.style.removeProperty(`${prefix}-text-decoration`);
  }

  // Background color
  if (style.backgroundColor !== null) {
    root.style.setProperty(`${prefix}-background-color`, style.backgroundColor);
  } else {
    root.style.removeProperty(`${prefix}-background-color`);
  }

  // Divider
  if (style.divider?.enabled) {
    const div = style.divider;
    root.style.setProperty(`${prefix}-divider-enabled`, '1');
    root.style.setProperty(`${prefix}-divider-position`, div.position);
    root.style.setProperty(`${prefix}-divider-distance`, `${div.distance}em`);
    root.style.setProperty(`${prefix}-divider-color`, div.color || 'currentColor');
    root.style.setProperty(`${prefix}-divider-thickness`, `${div.thickness}px`);
    root.style.setProperty(`${prefix}-divider-double`, div.double ? '1' : '0');
    root.style.setProperty(`${prefix}-divider-style`, div.double ? 'double' : div.style);

    // Set display properties for ::before and ::after based on position
    const showBefore = div.position === 'above' || div.position === 'both';
    const showAfter = div.position === 'below' || div.position === 'both';
    root.style.setProperty(`${prefix}-divider-show-before`, showBefore ? 'block' : 'none');
    root.style.setProperty(`${prefix}-divider-show-after`, showAfter ? 'block' : 'none');
  } else {
    clearHeadingDividerCSS(level);
  }
}

/**
 * Clear all CSS variables for a heading custom style
 */
export function clearHeadingCustomStyleCSS(level: HeadingLevel) {
  const root = document.documentElement;
  const prefix = `--h${level}`;

  // Typography
  root.style.removeProperty(`${prefix}-font-family`);
  root.style.removeProperty(`${prefix}-font-size`);
  root.style.removeProperty(`${prefix}-font-weight`);
  root.style.removeProperty(`${prefix}-letter-spacing`);
  root.style.removeProperty(`${prefix}-line-height`);
  root.style.removeProperty(`${prefix}-color`);
  root.style.removeProperty(`${prefix}-font-style`);
  root.style.removeProperty(`${prefix}-text-decoration`);
  root.style.removeProperty(`${prefix}-background-color`);

  // Divider
  clearHeadingDividerCSS(level);
}

/**
 * Clear divider CSS variables for a heading level
 */
export function clearHeadingDividerCSS(level: HeadingLevel) {
  const root = document.documentElement;
  const prefix = `--h${level}`;

  root.style.removeProperty(`${prefix}-divider-enabled`);
  root.style.removeProperty(`${prefix}-divider-position`);
  root.style.removeProperty(`${prefix}-divider-distance`);
  root.style.removeProperty(`${prefix}-divider-color`);
  root.style.removeProperty(`${prefix}-divider-thickness`);
  root.style.removeProperty(`${prefix}-divider-double`);
  root.style.removeProperty(`${prefix}-divider-style`);
  root.style.removeProperty(`${prefix}-divider-show-before`);
  root.style.removeProperty(`${prefix}-divider-show-after`);
}
