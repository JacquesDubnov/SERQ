import { useCallback } from 'react'
import type { RefObject } from 'react'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, readFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { useEditorStore } from '../stores/editorStore'
import { useStyleStore } from '../stores/styleStore'
import {
  serializeSerqDocument,
  parseSerqDocument,
  type SerqMetadata,
} from '../lib/serqFormat'
import { addRecentFile } from '../lib/recentFiles'
import { getWorkingFolder, updateWorkingFolderFromFile } from '../lib/workingFolder'
import { getStyleDefaults } from '../lib/preferencesStore'
import { saveVersion } from '../lib/version-storage'
import type { EditorCoreRef } from '../components/Editor/EditorCore'
import mammoth from 'mammoth'
import JSZip from 'jszip'

/**
 * File filter for native dialogs - accepts all supported formats
 */
const FILE_FILTERS = [
  { name: 'All Supported', extensions: ['serq.html', 'html', 'docx', 'md', 'markdown', 'txt', 'epub'] },
  { name: 'SERQ Documents', extensions: ['serq.html'] },
  { name: 'HTML Files', extensions: ['html'] },
  { name: 'Word Documents', extensions: ['docx'] },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'Text Files', extensions: ['txt'] },
  { name: 'EPUB', extensions: ['epub'] },
]

/**
 * File filter for save dialogs - only SERQ format
 */
const SAVE_FILE_FILTERS = [
  { name: 'SERQ Documents', extensions: ['serq.html'] },
  { name: 'HTML Files', extensions: ['html'] },
]

/**
 * Extract document name from file path
 */
function extractFileName(path: string): string {
  const fileName = path.split('/').pop() ?? ''
  // Remove known extensions
  return fileName
    .replace('.serq.html', '')
    .replace('.html', '')
    .replace('.docx', '')
    .replace('.md', '')
    .replace('.markdown', '')
    .replace('.txt', '')
    .replace('.epub', '') || 'Untitled'
}

/**
 * Get file extension (lowercase)
 */
function getFileExtension(path: string): string {
  // Handle .serq.html special case
  if (path.endsWith('.serq.html')) {
    return 'serq.html'
  }
  const match = path.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

/**
 * Simple Markdown to HTML converter
 */
function markdownToHTML(markdown: string): string {
  let html = markdown

  // Escape HTML entities first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '\n')

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr />')
  html = html.replace(/^\*\*\*+$/gm, '<hr />')

  // Lists
  html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>(\n<li>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>')

  // Paragraphs
  const lines = html.split('\n\n')
  html = lines
    .map((line) => {
      line = line.trim()
      if (!line) return ''
      if (
        line.startsWith('<h') ||
        line.startsWith('<p') ||
        line.startsWith('<ul') ||
        line.startsWith('<ol') ||
        line.startsWith('<blockquote') ||
        line.startsWith('<pre') ||
        line.startsWith('<hr')
      ) {
        return line
      }
      return `<p>${line.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')

  return html
}

/**
 * Convert plain text to HTML paragraphs
 */
function textToHTML(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const paragraphs = escaped.split(/\n\n+/)
  return paragraphs
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * Result type for openFile operation
 */
export interface OpenFileResult {
  html: string
  metadata: Partial<SerqMetadata>
  path: string
  name: string
}

/**
 * Hook providing file operations for the SERQ document editor
 *
 * Handles:
 * - Opening .serq.html files via native macOS dialog
 * - Saving documents to disk (Cmd+S)
 * - Save As to new location (Cmd+Shift+S)
 * - Creating new empty documents (Cmd+N)
 * - Loading and saving style metadata
 */
export function useFileOperations(editorRef: RefObject<EditorCoreRef | null>) {
  const setDocument = useEditorStore((state) => state.setDocument)
  const markSaved = useEditorStore((state) => state.markSaved)
  const triggerSaveGlow = useEditorStore((state) => state.triggerSaveGlow)
  const clearDocument = useEditorStore((state) => state.clearDocument)
  const document = useEditorStore((state) => state.document)

  /**
   * Open any supported file via native file dialog
   * Automatically detects format by extension and handles accordingly
   * Returns the parsed content and metadata, or null if cancelled
   */
  const openFile = useCallback(async (): Promise<OpenFileResult | null> => {
    // Get default path from working folder preference
    const defaultPath = await getWorkingFolder()

    // Show native file picker with all supported formats
    const selected = await open({
      multiple: false,
      filters: FILE_FILTERS,
      defaultPath,
    })

    // User cancelled
    if (!selected) {
      return null
    }

    const ext = getFileExtension(selected)
    const name = extractFileName(selected)
    const styleStore = useStyleStore.getState()

    try {
      let html: string
      let metadata: Partial<SerqMetadata> = {}

      switch (ext) {
        case 'serq.html':
        case 'html': {
          // Native SERQ/HTML format
          const content = await readTextFile(selected)
          const parsed = parseSerqDocument(content)
          html = parsed.html
          metadata = parsed.metadata

          // Load document styles (or apply defaults if none)
          if (metadata.presets) {
            styleStore.loadFromDocument({
              typography: metadata.presets.typography ?? 'serq-default',
              colors: metadata.presets.colors ?? 'default',
              canvas: metadata.presets.canvas ?? 'white',
              layout: metadata.presets.layout ?? 'default',
              masterTheme: metadata.presets.masterTheme ?? null,
              themeMode: metadata.presets.themeMode ?? 'system',
            })
          } else {
            await applyDefaultStyles(styleStore)
          }

          // For native format, save with original path
          editorRef.current?.setContent(html)
          setDocument(selected, name)
          markSaved()
          break
        }

        case 'docx': {
          // Word document
          const fileData = await readFile(selected)
          const result = await mammoth.convertToHtml(
            { arrayBuffer: fileData.buffer },
            {
              styleMap: [
                "p[style-name='Heading 1'] => h1",
                "p[style-name='Heading 2'] => h2",
                "p[style-name='Heading 3'] => h3",
                "p[style-name='Title'] => h1",
                "p[style-name='Subtitle'] => h2",
                'b => strong',
                'i => em',
                'u => u',
              ],
            }
          )
          html = result.value
          await applyDefaultStyles(styleStore)
          editorRef.current?.setContent(html)
          // Imported files don't have a save path (need Save As)
          setDocument(null, `${name}`)
          useEditorStore.getState().markDirty()
          break
        }

        case 'md':
        case 'markdown': {
          // Markdown file
          const content = await readTextFile(selected)
          html = markdownToHTML(content)
          await applyDefaultStyles(styleStore)
          editorRef.current?.setContent(html)
          setDocument(null, `${name}`)
          useEditorStore.getState().markDirty()
          break
        }

        case 'txt': {
          // Plain text file
          const content = await readTextFile(selected)
          html = textToHTML(content)
          await applyDefaultStyles(styleStore)
          editorRef.current?.setContent(html)
          setDocument(null, `${name}`)
          useEditorStore.getState().markDirty()
          break
        }

        case 'epub': {
          // EPUB file
          const fileData = await readFile(selected)
          const zip = await JSZip.loadAsync(fileData)

          // Parse container.xml
          const containerXml = await zip.file('META-INF/container.xml')?.async('text')
          if (!containerXml) throw new Error('Invalid EPUB: Missing container.xml')

          const rootfileMatch = containerXml.match(/full-path="([^"]+)"/)
          if (!rootfileMatch) throw new Error('Invalid EPUB: Cannot find rootfile path')

          const opfPath = rootfileMatch[1]
          const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
          const opfContent = await zip.file(opfPath)?.async('text')
          if (!opfContent) throw new Error('Invalid EPUB: Cannot read OPF file')

          // Extract title
          const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)
          const epubTitle = titleMatch ? titleMatch[1] : name

          // Get spine items
          const spineMatches = opfContent.matchAll(/<itemref[^>]+idref="([^"]+)"/g)
          const spineIds = [...spineMatches].map(m => m[1])

          // Build manifest mapping
          const manifestItems: Map<string, string> = new Map()
          const manifestMatches = opfContent.matchAll(/<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g)
          for (const match of manifestMatches) {
            manifestItems.set(match[1], match[2])
          }
          const manifestMatches2 = opfContent.matchAll(/<item[^>]+href="([^"]+)"[^>]+id="([^"]+)"/g)
          for (const match of manifestMatches2) {
            manifestItems.set(match[2], match[1])
          }

          // Read content
          const contentParts: string[] = []
          for (const spineId of spineIds) {
            const href = manifestItems.get(spineId)
            if (!href || href.includes('nav') || href.includes('toc')) continue
            const contentPath = opfDir + href
            const xhtmlContent = await zip.file(contentPath)?.async('text')
            if (!xhtmlContent) continue
            const bodyMatch = xhtmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            if (bodyMatch) contentParts.push(bodyMatch[1])
          }

          if (contentParts.length === 0) throw new Error('No readable content in EPUB')
          html = contentParts.join('\n<hr />\n')

          await applyDefaultStyles(styleStore)
          editorRef.current?.setContent(html)
          setDocument(null, `${epubTitle}`)
          useEditorStore.getState().markDirty()
          break
        }

        default:
          throw new Error(`Unsupported file format: .${ext}`)
      }

      // Add to recent files and update working folder
      await addRecentFile(selected, name)
      await updateWorkingFolderFromFile(selected)

      return {
        html,
        metadata,
        path: selected,
        name,
      }
    } catch (err) {
      console.error('[FileOps] Failed to open file:', err)
      alert(`Failed to open file: ${err instanceof Error ? err.message : 'Unknown error'}`)
      return null
    }
  }, [editorRef, setDocument, markSaved])

  /**
   * Helper to apply default styles
   */
  async function applyDefaultStyles(styleStore: ReturnType<typeof useStyleStore.getState>): Promise<void> {
    try {
      const defaults = await getStyleDefaults()
      styleStore.setTypography(defaults.defaultTypography)
      styleStore.setColor(defaults.defaultColor)
      styleStore.setCanvas(defaults.defaultCanvas)
      styleStore.setLayout(defaults.defaultLayout)
    } catch {
      styleStore.applyAllPresets()
    }
  }

  /**
   * Save current document to disk
   * If document has no path (new/untitled), delegates to saveFileAs
   */
  const saveFile = useCallback(async (): Promise<string | null> => {
    // New document without path - use Save As
    if (!document.path) {
      return saveFileAs()
    }

    // Get current HTML from editor
    const html = editorRef.current?.getHTML() ?? ''

    // Get current style metadata for persistence
    const styleMetadata = useStyleStore.getState().getStyleMetadata()

    // Serialize to .serq.html format with style metadata
    const fileContent = serializeSerqDocument(
      html,
      {
        name: document.name,
        path: document.path,
      },
      styleMetadata
    )

    // Write to disk
    await writeTextFile(document.path, fileContent)

    // Save version snapshot immediately on explicit save
    try {
      console.log('[FileOps] Attempting to save version snapshot...')
      const editorJSON = editorRef.current?.getEditor()?.getJSON()
      if (editorJSON) {
        const editor = editorRef.current?.getEditor()
        const wordCount = editor?.storage.characterCount?.words?.() ?? 0
        const charCount = editor?.storage.characterCount?.characters?.() ?? 0
        const versionId = await saveVersion(document.path, editorJSON, wordCount, charCount, false)
        console.log('[FileOps] Version snapshot saved with ID:', versionId, 'for:', document.path)
      } else {
        console.warn('[FileOps] No editor JSON available for version snapshot')
      }
    } catch (versionErr) {
      console.error('[FileOps] Failed to save version snapshot:', versionErr)
      // Show visible error for debugging
      console.error('[FileOps] Error details:', JSON.stringify(versionErr, Object.getOwnPropertyNames(versionErr)))
    }

    // Update store and trigger visual feedback
    markSaved()
    triggerSaveGlow()

    return document.path
  }, [document.path, document.name, editorRef, markSaved, triggerSaveGlow])

  /**
   * Save document to a new location via native file dialog
   * Returns the new file path, or null if cancelled
   */
  const saveFileAs = useCallback(async (): Promise<string | null> => {
    // Get default path from working folder preference
    const workingFolder = await getWorkingFolder()

    // Show native save dialog (only SERQ/HTML formats for saving)
    const filePath = await save({
      filters: SAVE_FILE_FILTERS,
      defaultPath: `${workingFolder}/${document.name}.serq.html`,
    })

    // User cancelled
    if (!filePath) {
      return null
    }

    // Get current HTML from editor
    const html = editorRef.current?.getHTML() ?? ''

    // Extract name from chosen path
    const name = extractFileName(filePath)

    // Get current style metadata for persistence
    const styleMetadata = useStyleStore.getState().getStyleMetadata()

    // Serialize to .serq.html format with style metadata
    const fileContent = serializeSerqDocument(
      html,
      {
        name,
        path: filePath,
      },
      styleMetadata
    )

    // Write to disk
    await writeTextFile(filePath, fileContent)

    // Save version snapshot immediately on explicit save
    try {
      const editorJSON = editorRef.current?.getEditor()?.getJSON()
      if (editorJSON) {
        const editor = editorRef.current?.getEditor()
        const wordCount = editor?.storage.characterCount?.words?.() ?? 0
        const charCount = editor?.storage.characterCount?.characters?.() ?? 0
        await saveVersion(filePath, editorJSON, wordCount, charCount, false)
        console.log('[FileOps] Version snapshot saved for:', filePath)
      }
    } catch (versionErr) {
      console.error('[FileOps] Failed to save version snapshot:', versionErr)
    }

    // Update store with new path/name
    console.log('[FileOps] SaveAs complete, setting document path:', filePath)
    setDocument(filePath, name)
    markSaved()
    triggerSaveGlow()

    // Add to recent files and update working folder
    console.log('[FileOps] Adding to recent files...')
    await addRecentFile(filePath, name)
    console.log('[FileOps] Updating working folder...')
    await updateWorkingFolderFromFile(filePath)
    console.log('[FileOps] SaveAs finished successfully')

    return filePath
  }, [document.name, editorRef, setDocument, markSaved, triggerSaveGlow])

  /**
   * Create a new empty document
   * Clears editor content and resets document state to Untitled
   * Applies user's default style preferences
   *
   * Note: v1 does not prompt about unsaved changes - user responsible for saving
   */
  const newFile = useCallback(async (): Promise<void> => {
    // Clear editor content
    editorRef.current?.setContent('')

    // Reset document state
    clearDocument()

    // Apply user's default style preferences for new document
    const styleStore = useStyleStore.getState()
    try {
      const defaults = await getStyleDefaults()
      styleStore.setTypography(defaults.defaultTypography)
      styleStore.setColor(defaults.defaultColor)
      styleStore.setCanvas(defaults.defaultCanvas)
      styleStore.setLayout(defaults.defaultLayout)
    } catch {
      // If preferences unavailable, apply built-in defaults
      styleStore.applyAllPresets()
    }

    // Mark document as clean after applying defaults
    // (style setters mark dirty, but this is new doc, not user change)
    useEditorStore.getState().markSaved()

    // Focus editor for immediate typing
    editorRef.current?.focus()
  }, [editorRef, clearDocument])

  return {
    openFile,
    saveFile,
    saveFileAs,
    newFile,
  }
}
