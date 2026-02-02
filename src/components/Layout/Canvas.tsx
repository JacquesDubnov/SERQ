import { ReactNode, useEffect } from 'react'
import type { PageSize } from '../../stores/editorStore'

export type CanvasWidth = 'narrow' | 'normal' | 'wide' | 'full'

interface CanvasProps {
  children: ReactNode
  width?: CanvasWidth
  className?: string
  viewportColor: string  // Interface color for viewport background
  paginationEnabled?: boolean
  pageSize?: PageSize
}

const widthClasses: Record<CanvasWidth, string> = {
  narrow: 'max-w-xl',    // 576px
  normal: 'max-w-3xl',   // 768px
  wide: 'max-w-5xl',     // 1024px
  full: 'max-w-none',
}

export function Canvas({
  children,
  width = 'normal',
  className = '',
  viewportColor,
  paginationEnabled = false,
  pageSize = 'a4',
}: CanvasProps) {
  // Update body data-page-size attribute for print CSS @page rules
  useEffect(() => {
    if (paginationEnabled) {
      document.body.setAttribute('data-page-size', pageSize)
    } else {
      document.body.removeAttribute('data-page-size')
    }
    return () => {
      document.body.removeAttribute('data-page-size')
    }
  }, [paginationEnabled, pageSize])

  return (
    // Viewport background - uses INTERFACE color (not document preset)
    // Flexbox ensures canvas is always centered
    <div
      className={`canvas-viewport min-h-screen flex justify-center ${className}`}
      style={{
        backgroundColor: viewportColor,
        padding: '40px', // 40px margin on all sides
      }}
      data-canvas-width={width}
    >
      {/* Page container - the "paper" uses DOCUMENT CSS variables */}
      {/* Min-width 320px = smallest mobile screen (iPhone SE) */}
      <div
        className={`canvas-page ${paginationEnabled ? '' : widthClasses[width]}`}
        style={{ width: '100%', minWidth: '320px' }}
        data-pagination={paginationEnabled ? 'true' : undefined}
        data-page-size={paginationEnabled ? pageSize : undefined}
      >
        <div
          className="canvas-content px-12 py-10"
          style={{
            backgroundColor: 'var(--canvas-bg-color, #ffffff)',
            backgroundImage: 'var(--canvas-bg-image, none)',
            backgroundSize: 'var(--canvas-bg-size, auto)',
            backgroundPosition: 'var(--canvas-bg-position, center)',
            backgroundRepeat: 'var(--canvas-bg-repeat, no-repeat)',
            borderRadius: paginationEnabled ? '0' : '10px',
            boxShadow: paginationEnabled
              ? 'none'
              : '0 4px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
            minHeight: 'calc(100vh - 200px)', // Account for header + 40px top/bottom margins
          }}
          data-pagination={paginationEnabled ? 'true' : undefined}
          data-page-size={paginationEnabled ? pageSize : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
