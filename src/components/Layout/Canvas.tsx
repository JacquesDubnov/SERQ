/**
 * Canvas - Responsive writing surface
 *
 * Uses CSS custom properties for theming so presets actually work.
 * Continuous flow, no pagination.
 */

import { ReactNode } from 'react';

export type CanvasWidth = 'narrow' | 'normal' | 'wide' | 'full';

interface CanvasProps {
  children: ReactNode;
  width?: CanvasWidth;
}

// Width values in pixels
const widthValues: Record<CanvasWidth, string> = {
  narrow: '600px',
  normal: '720px',
  wide: '900px',
  full: '100%',
};

export function Canvas({ children, width = 'normal' }: CanvasProps) {
  const maxWidth = widthValues[width];

  return (
    <div
      className="canvas-container"
      data-canvas-width={width}
      style={{
        width: '100%',
        maxWidth,
        margin: '0 auto',
        // Use CSS variables so presets actually affect the canvas
        backgroundColor: 'var(--canvas-bg-color, var(--color-bg-canvas, #ffffff))',
        backgroundImage: 'var(--canvas-bg-image, none)',
        backgroundSize: 'var(--canvas-bg-size, auto)',
        backgroundPosition: 'var(--canvas-bg-position, center)',
        backgroundRepeat: 'var(--canvas-bg-repeat, no-repeat)',
        borderRadius: width === 'full' ? '0' : 'var(--canvas-border-radius, 12px)',
        boxShadow: width === 'full' ? 'none' : 'var(--canvas-shadow, var(--tt-shadow-canvas))',
        // Account for two-row toolbar (5rem = 80px) + page margins
        minHeight: 'calc(100vh - 220px)',
        padding: '74px',
        // Text color from theme
        color: 'var(--color-text-primary, #1a1a1a)',
      }}
    >
      {children}
    </div>
  );
}
