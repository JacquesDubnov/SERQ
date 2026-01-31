/**
 * Export Menu Component
 * Dropdown menu for selecting export format
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import { exportToHTML, exportToMarkdown, exportToPDF } from '../../lib/export-handlers'
import { useEditorStore } from '../../stores/editorStore'

interface InterfaceColors {
  bg: string
  bgSurface: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
}

interface ExportMenuProps {
  editor: Editor | null
  interfaceColors: InterfaceColors
}

type ExportFormat = 'html' | 'markdown' | 'pdf'

interface ExportOption {
  id: ExportFormat
  name: string
  description: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'html', name: 'HTML', description: 'Self-contained HTML file with styles' },
  { id: 'markdown', name: 'Markdown', description: 'Plain text Markdown format' },
  { id: 'pdf', name: 'PDF', description: 'Print to PDF via system dialog' },
]

export function ExportMenu({ editor, interfaceColors }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const documentName = useEditorStore((state) => state.document.name)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!editor || isExporting) return

      setIsExporting(true)

      try {
        switch (format) {
          case 'html':
            await exportToHTML(editor, documentName)
            break
          case 'markdown':
            await exportToMarkdown(editor, documentName)
            break
          case 'pdf':
            exportToPDF(editor, documentName)
            break
        }
      } catch (err) {
        console.error('Export failed:', err)
        alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsExporting(false)
        setIsOpen(false)
      }
    },
    [editor, documentName, isExporting]
  )

  return (
    <div ref={menuRef} className="relative">
      {/* Export button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!editor || isExporting}
        className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
        style={{
          backgroundColor: interfaceColors.bgSurface,
          border: `1px solid ${interfaceColors.border}`,
          color: interfaceColors.textPrimary,
          opacity: !editor || isExporting ? 0.5 : 1,
          cursor: !editor || isExporting ? 'not-allowed' : 'pointer',
        }}
        title="Export document"
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 rounded-md shadow-lg z-50"
          style={{
            backgroundColor: interfaceColors.bg,
            border: `1px solid ${interfaceColors.border}`,
            minWidth: '200px',
          }}
        >
          {EXPORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleExport(option.id)}
              className="w-full text-left px-4 py-3 first:rounded-t-md last:rounded-b-md transition-colors hover:bg-opacity-50"
              style={{
                backgroundColor: 'transparent',
                color: interfaceColors.textPrimary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = interfaceColors.bgSurface
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div className="font-medium text-sm">{option.name}</div>
              <div className="text-xs mt-0.5" style={{ color: interfaceColors.textMuted }}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExportMenu
