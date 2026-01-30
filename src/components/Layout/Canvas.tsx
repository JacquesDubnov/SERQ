import { ReactNode } from 'react'

export type CanvasWidth = 'narrow' | 'normal' | 'wide' | 'full'

interface CanvasProps {
  children: ReactNode
  width?: CanvasWidth
  className?: string
}

const widthClasses: Record<CanvasWidth, string> = {
  narrow: 'max-w-xl',    // 576px
  normal: 'max-w-3xl',   // 768px
  wide: 'max-w-5xl',     // 1024px
  full: 'max-w-none',
}

export function Canvas({ children, width = 'normal', className = '' }: CanvasProps) {
  return (
    <div className={`canvas-container min-h-screen bg-white ${className}`} data-canvas-width={width}>
      <div className={`canvas-content mx-auto px-8 py-12 ${widthClasses[width]}`}>
        {children}
      </div>
    </div>
  )
}
