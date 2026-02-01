import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { NodeView, ViewMutationRecord, EditorView } from '@tiptap/pm/view'

/**
 * ColumnSectionView - Plain ProseMirror NodeView (NOT React)
 *
 * Dividers are visible when:
 * - Hovering over the column section
 * - Cursor is active inside any column (via selection tracking)
 *
 * Border lines (when showBorders=true) are ALWAYS visible.
 *
 * Dragging behavior:
 * - Normal drag: resize columns
 * - Option+drag: increase gutter size (all dividers)
 */
export class ColumnSectionView implements NodeView {
  node: ProseMirrorNode
  view: EditorView
  getPos: () => number | undefined
  dom: HTMLDivElement
  contentDOM: HTMLDivElement
  handlesContainer: HTMLDivElement
  resizing: number | null = null
  resizingGutter: boolean = false
  startX: number = 0
  startWidths: number[] = []
  startGap: number = 0
  startContainerWidth: number = 0
  startGridWidth: number = 0
  startContentOffsetLeft: number = 0
  startPaddingLeft: number = 0
  localWidths: number[] = []
  localGap: number = 24
  handles: HTMLDivElement[] = []
  borderLines: HTMLDivElement[] = []
  isHovered: boolean = false
  hasSelectionWithin: boolean = false
  contextMenu: HTMLDivElement | null = null
  selectionCheckInterval: number | null = null

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos

    // Initialize local state
    const { columnCount, columnWidths, gap } = node.attrs
    // Validate columnWidths - must be an array with correct length, otherwise use equal widths
    this.localWidths = (Array.isArray(columnWidths) && columnWidths.length === columnCount)
      ? columnWidths
      : Array(columnCount).fill(1)
    this.localGap = parseFloat(gap) || 24

    // Create outer wrapper (dom)
    this.dom = document.createElement('div')
    this.dom.className = 'column-section-wrapper'
    this.dom.style.cssText = 'position: relative; margin: 1rem 0;'

    // Create inner grid container (contentDOM)
    this.contentDOM = document.createElement('div')
    this.contentDOM.setAttribute('data-column-section', '')
    this.updateClasses()
    this.updateGridStyles()
    this.dom.appendChild(this.contentDOM)

    // Create handles container - overlays the content, but pointer-events: none
    // except for the actual handle elements
    this.handlesContainer = document.createElement('div')
    this.handlesContainer.className = 'column-handles-container'
    this.handlesContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10;
    `
    this.dom.appendChild(this.handlesContainer)

    // Create resize handles and border lines
    this.createHandles()

    // Defer initial position update until after DOM is rendered
    // At construction time, getBoundingClientRect() returns zeros
    requestAnimationFrame(() => {
      this.updateAllHandleStyles()
    })

    // Event listeners
    this.dom.addEventListener('mouseenter', this.handleMouseEnter)
    this.dom.addEventListener('mouseleave', this.handleMouseLeave)
    this.dom.addEventListener('contextmenu', this.handleContextMenu)

    // Track selection state via polling (ProseMirror doesn't fire DOM focus events)
    this.selectionCheckInterval = window.setInterval(() => {
      this.checkSelectionWithin()
    }, 100)

    // Initial check
    this.checkSelectionWithin()
  }

  private checkSelectionWithin(): void {
    const pos = this.getPos()
    if (pos === undefined) return

    const { selection } = this.view.state
    const nodeEnd = pos + this.node.nodeSize

    // Check if selection is within this node
    const isWithin = selection.from >= pos && selection.to <= nodeEnd

    if (isWithin !== this.hasSelectionWithin) {
      this.hasSelectionWithin = isWithin
      this.updateHandleVisibility()
    }
  }

  private updateClasses(): void {
    const classes = ['column-section']
    if (this.node.attrs.showBorders) {
      classes.push('column-section-bordered')
    }
    this.contentDOM.className = classes.join(' ')
  }

  private updateGridStyles(): void {
    const gridTemplate = this.localWidths.map((w: number) => `minmax(80px, ${w}fr)`).join(' ')

    this.contentDOM.style.display = 'grid'
    this.contentDOM.style.gridTemplateColumns = gridTemplate
    this.contentDOM.style.gap = `${this.localGap}px`
  }

  private createHandles(): void {
    // Clear existing handles and border lines
    this.handles.forEach(h => h.remove())
    this.borderLines.forEach(b => b.remove())
    this.handles = []
    this.borderLines = []

    const { columnCount } = this.node.attrs

    for (let i = 0; i < columnCount - 1; i++) {
      // Create border line (always visible when showBorders is true)
      const borderLine = this.createBorderLine(i)
      this.handlesContainer.appendChild(borderLine)
      this.borderLines.push(borderLine)

      // Create resize handle (visible on hover/focus)
      const handle = this.createHandle(i)
      this.handlesContainer.appendChild(handle)
      this.handles.push(handle)
    }

    // Update border visibility
    this.updateBorderVisibility()
  }

  private createBorderLine(index: number): HTMLDivElement {
    const line = document.createElement('div')
    line.className = 'column-border-line'
    line.setAttribute('data-border-index', String(index))

    this.updateBorderLineStyle(line, index)

    return line
  }

  private updateBorderLineStyle(line: HTMLDivElement, index: number): void {
    const percent = this.calculateHandlePercent(index)

    line.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${percent}%;
      width: 1px;
      background-color: #d1d5db;
      pointer-events: none;
      opacity: ${this.node.attrs.showBorders ? '1' : '0'};
      transition: opacity 0.15s ease;
      transform: translateX(-50%);
    `
  }

  private createHandle(index: number): HTMLDivElement {
    const handle = document.createElement('div')
    handle.className = 'column-layout-handle'
    handle.setAttribute('data-handle-index', String(index))
    handle.setAttribute('contenteditable', 'false')

    this.updateHandleStyle(handle, index)

    // Mouse events - pointer-events: auto on the handle itself
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      this.handleResizeStart(index, e)
    })

    return handle
  }

  private calculateHandlePercent(index: number): number {
    // Use pure mathematical calculation based on fr ratios
    const totalFr = this.localWidths.reduce((sum, w) => sum + w, 0)
    if (totalFr === 0) return 50

    // The gap is AFTER column[index], so position is based on
    // sum of widths up to and including column[index]
    const frBefore = this.localWidths.slice(0, index + 1).reduce((sum, w) => sum + w, 0)
    return (frBefore / totalFr) * 100
  }

  private updateHandleStyle(handle: HTMLDivElement, index: number): void {
    const handleWidth = this.localGap
    const percent = this.calculateHandlePercent(index)

    handle.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      width: ${handleWidth}px;
      left: ${percent}%;
      cursor: col-resize;
      opacity: 0;
      transition: opacity 0.15s ease;
      background-color: #f3f4f6;
      border-radius: 2px;
      pointer-events: auto;
      user-select: none;
      transform: translateX(-50%);
    `
  }

  private updateAllHandleStyles(): void {
    this.handles.forEach((handle, idx) => {
      this.updateHandleStyle(handle, idx)
      if (this.shouldShowHandles()) {
        handle.style.opacity = '1'
      }
    })
    this.borderLines.forEach((line, idx) => {
      this.updateBorderLineStyle(line, idx)
    })
  }

  private updateBorderVisibility(): void {
    const showBorders = this.node.attrs.showBorders
    this.borderLines.forEach(line => {
      line.style.opacity = showBorders ? '1' : '0'
    })
  }

  private shouldShowHandles(): boolean {
    return this.isHovered || this.hasSelectionWithin || this.resizing !== null
  }

  private showHandles(): void {
    this.handles.forEach(h => {
      h.style.opacity = '1'
    })
  }

  private hideHandles(): void {
    if (this.resizing === null) {
      this.handles.forEach(h => {
        h.style.opacity = '0'
      })
    }
  }

  private updateHandleVisibility(): void {
    if (this.shouldShowHandles()) {
      this.showHandles()
    } else {
      this.hideHandles()
    }
  }

  private handleMouseEnter = (): void => {
    this.isHovered = true
    this.updateHandleVisibility()
  }

  private handleMouseLeave = (): void => {
    this.isHovered = false
    this.updateHandleVisibility()
  }

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    // Clear any text selection
    window.getSelection()?.removeAllRanges()

    // Close existing context menu
    this.closeContextMenu()

    // Create context menu
    this.showContextMenu(e.clientX, e.clientY)
  }

  private showContextMenu(x: number, y: number): void {
    const menu = document.createElement('div')
    menu.className = 'column-context-menu'
    menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 4px 0;
      min-width: 180px;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
    `

    const { columnCount, showBorders } = this.node.attrs

    // Column count section
    const columnLabel = document.createElement('div')
    columnLabel.style.cssText = 'padding: 6px 12px; color: #6b7280; font-size: 11px; text-transform: uppercase;'
    columnLabel.textContent = 'Columns'
    menu.appendChild(columnLabel)

    const columnOptions = [2, 3, 4, 5, 6]
    columnOptions.forEach(count => {
      const item = this.createMenuItem(
        `${count} Columns`,
        count === columnCount,
        () => this.setColumnCount(count)
      )
      menu.appendChild(item)
    })

    // Divider
    const divider = document.createElement('div')
    divider.style.cssText = 'height: 1px; background: #e5e7eb; margin: 4px 0;'
    menu.appendChild(divider)

    // Toggle borders
    const bordersItem = this.createMenuItem(
      showBorders ? '✓ Show Borders' : 'Show Borders',
      false,
      () => this.toggleBorders()
    )
    menu.appendChild(bordersItem)

    // Delete columns
    const deleteItem = this.createMenuItem(
      'Remove Columns',
      false,
      () => this.removeColumns(),
      true
    )
    menu.appendChild(deleteItem)

    document.body.appendChild(menu)
    this.contextMenu = menu

    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 8}px`
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 8}px`
    }

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('mousedown', this.handleClickOutsideMenu)
      document.addEventListener('keydown', this.handleEscapeKey)
    }, 10)
  }

  private createMenuItem(label: string, isActive: boolean, onClick: () => void, isDanger: boolean = false): HTMLDivElement {
    const item = document.createElement('div')
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      color: ${isDanger ? '#dc2626' : '#1f2937'};
      background: ${isActive ? '#f3f4f6' : 'transparent'};
    `
    item.textContent = label

    item.addEventListener('mouseenter', () => {
      item.style.background = '#f3f4f6'
    })
    item.addEventListener('mouseleave', () => {
      item.style.background = isActive ? '#f3f4f6' : 'transparent'
    })
    item.addEventListener('click', () => {
      onClick()
      this.closeContextMenu()
    })

    return item
  }

  private handleClickOutsideMenu = (e: MouseEvent): void => {
    if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
      this.closeContextMenu()
    }
  }

  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.closeContextMenu()
    }
  }

  private closeContextMenu(): void {
    if (this.contextMenu) {
      this.contextMenu.remove()
      this.contextMenu = null
      document.removeEventListener('mousedown', this.handleClickOutsideMenu)
      document.removeEventListener('keydown', this.handleEscapeKey)
    }
  }

  private setColumnCount(count: number): void {
    const pos = this.getPos()
    if (pos === undefined) return

    const node = this.node
    const currentCount = node.attrs.columnCount
    if (count === currentCount) return

    // Extract content from existing columns
    const existingContent: any[][] = []
    node.forEach((column) => {
      const content: any[] = []
      column.forEach((child) => {
        content.push(child.toJSON())
      })
      existingContent.push(content)
    })

    // Create new columns
    const newColumns = []
    for (let i = 0; i < count; i++) {
      const columnContent = existingContent[i] || [{ type: 'paragraph' }]
      newColumns.push({
        type: 'column',
        content: columnContent.length > 0 ? columnContent : [{ type: 'paragraph' }],
      })
    }

    // Merge extra content if reducing
    if (count < currentCount) {
      const lastColumnContent = [...newColumns[count - 1].content]
      for (let i = count; i < existingContent.length; i++) {
        lastColumnContent.push(...existingContent[i])
      }
      newColumns[count - 1].content = lastColumnContent
    }

    const newNode = this.view.state.schema.nodeFromJSON({
      type: 'columnSection',
      attrs: {
        ...node.attrs,
        columnCount: count,
        columnWidths: Array(count).fill(1),
      },
      content: newColumns,
    })

    const tr = this.view.state.tr.replaceWith(pos, pos + node.nodeSize, newNode)
    this.view.dispatch(tr)
  }

  private toggleBorders(): void {
    const pos = this.getPos()
    if (pos === undefined) return

    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      showBorders: !this.node.attrs.showBorders,
    })
    this.view.dispatch(tr)
  }

  private removeColumns(): void {
    const pos = this.getPos()
    if (pos === undefined) return

    // Extract all content
    const content: any[] = []
    this.node.forEach((column) => {
      column.forEach((child) => {
        content.push(child)
      })
    })

    // Replace with paragraphs
    const tr = this.view.state.tr
    tr.delete(pos, pos + this.node.nodeSize)
    content.forEach((node, i) => {
      tr.insert(pos + i, node)
    })
    this.view.dispatch(tr)
  }

  private handleResizeStart = (index: number, e: MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    // Capture container dimensions at drag start for consistent calculations
    const domRect = this.dom.getBoundingClientRect()
    const contentRect = this.contentDOM.getBoundingClientRect()
    const computedStyle = getComputedStyle(this.contentDOM)
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0

    this.startContainerWidth = domRect.width
    this.startGridWidth = contentRect.width - paddingLeft * 2  // Grid content area (minus padding on both sides)
    this.startContentOffsetLeft = contentRect.left - domRect.left + paddingLeft  // Offset to where columns actually start
    this.startPaddingLeft = paddingLeft

    this.resizing = index
    this.resizingGutter = e.altKey
    this.startX = e.clientX
    this.startWidths = [...this.localWidths]
    this.startGap = this.localGap

    // Highlight active handle and ensure it's visible
    const handle = this.handles[index]
    if (handle) {
      handle.style.backgroundColor = this.resizingGutter ? '#93c5fd' : '#d1d5db'
      handle.style.opacity = '1'
      handle.style.transition = 'none' // Disable transition during drag
    }

    // Add cursor style to body during drag
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', this.handleResizeMove)
    document.addEventListener('mouseup', this.handleResizeEnd)
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Alt' && this.resizing !== null && !this.resizingGutter) {
      this.resizingGutter = true
      const handle = this.handles[this.resizing]
      if (handle) {
        handle.style.backgroundColor = '#93c5fd'
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Alt' && this.resizing !== null && this.resizingGutter) {
      this.resizingGutter = false
      const handle = this.handles[this.resizing]
      if (handle) {
        handle.style.backgroundColor = '#d1d5db'
      }
    }
  }

  private handleResizeMove = (e: MouseEvent): void => {
    if (this.resizing === null) return

    const deltaX = e.clientX - this.startX

    if (this.resizingGutter) {
      // Option+drag: adjust gutter size
      const newGap = Math.max(8, Math.min(100, this.startGap + deltaX * 0.5))
      this.localGap = newGap
      this.updateGridStyles()
      // Update handle width
      this.handles.forEach(h => {
        h.style.width = `${this.localGap}px`
      })
    } else {
      // Normal drag: resize columns
      // Use dimensions captured at drag start for consistent calculations
      const wrapperWidth = this.startContainerWidth
      const gridWidth = this.startGridWidth
      const contentOffsetLeft = this.startContentOffsetLeft

      if (gridWidth === 0) return

      const columnCount = this.node.attrs.columnCount
      const totalGapWidth = this.localGap * (columnCount - 1)
      const availableWidth = gridWidth - totalGapWidth

      const totalFr = this.startWidths.reduce((sum, w) => sum + w, 0)
      const pixelsPerFr = availableWidth / totalFr
      const deltaFr = deltaX / pixelsPerFr

      const minFr = 0.2

      let newLeftFr = this.startWidths[this.resizing] + deltaFr
      let newRightFr = this.startWidths[this.resizing + 1] - deltaFr

      if (newLeftFr < minFr) {
        newRightFr += (newLeftFr - minFr)
        newLeftFr = minFr
      }
      if (newRightFr < minFr) {
        newLeftFr += (newRightFr - minFr)
        newRightFr = minFr
      }

      newLeftFr = Math.max(minFr, newLeftFr)
      newRightFr = Math.max(minFr, newRightFr)

      this.localWidths = [...this.startWidths]
      this.localWidths[this.resizing] = newLeftFr
      this.localWidths[this.resizing + 1] = newRightFr

      // Update grid
      this.updateGridStyles()

      // Calculate handle position MATHEMATICALLY based on new widths
      // Don't rely on DOM measurement during drag - we know what the widths are
      const newAvailableWidth = gridWidth - totalGapWidth
      const newTotalFr = this.localWidths.reduce((sum, w) => sum + w, 0)

      let positionInGrid = 0
      for (let i = 0; i <= this.resizing; i++) {
        const columnFr = this.localWidths[i]
        const columnWidth = newAvailableWidth * (columnFr / newTotalFr)
        positionInGrid += columnWidth
        if (i < this.resizing) {
          positionInGrid += this.localGap
        }
      }
      positionInGrid += this.localGap / 2

      const positionInWrapper = contentOffsetLeft + positionInGrid
      const newPercent = (positionInWrapper / wrapperWidth) * 100

      const handle = this.handles[this.resizing]
      const borderLine = this.borderLines[this.resizing]

      if (handle) {
        handle.style.left = `${newPercent}%`
      }
      if (borderLine) {
        borderLine.style.left = `${newPercent}%`
      }
    }
  }

  private handleResizeEnd = (): void => {
    const resizingIndex = this.resizing

    if (resizingIndex !== null) {
      // Reset handle style
      const handle = this.handles[resizingIndex]
      if (handle) {
        handle.style.backgroundColor = '#f3f4f6'
        handle.style.transition = ''
      }

      // Commit changes to ProseMirror
      const pos = this.getPos()
      if (pos !== undefined) {
        const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
          ...this.node.attrs,
          columnWidths: [...this.localWidths],
          gap: `${this.localGap}px`,
        })
        this.view.dispatch(tr)
      }

      this.resizing = null
      this.resizingGutter = false
    }

    // Reset body cursor
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    document.removeEventListener('mousemove', this.handleResizeMove)
    document.removeEventListener('mouseup', this.handleResizeEnd)
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)

    this.updateHandleVisibility()
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) {
      return false
    }

    this.node = node

    const { columnCount, columnWidths, gap } = node.attrs
    if (this.resizing === null) {
      // Validate columnWidths - must be an array with correct length
      this.localWidths = (Array.isArray(columnWidths) && columnWidths.length === columnCount)
        ? columnWidths
        : Array(columnCount).fill(1)
      this.localGap = parseFloat(gap) || 24

      this.updateClasses()
      this.updateGridStyles()
      this.updateBorderVisibility()

      if (this.handles.length !== columnCount - 1) {
        this.createHandles()
        if (this.shouldShowHandles()) {
          this.showHandles()
        }
      } else {
        // Defer position update to after render
        requestAnimationFrame(() => {
          if (this.resizing === null) { // Double-check not resizing
            this.updateAllHandleStyles()
          }
        })
      }
    }

    return true
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    const target = mutation.target as Node

    // Ignore mutations to handles container and its children
    if (this.handlesContainer.contains(target)) {
      return true
    }

    for (const handle of this.handles) {
      if (handle.contains(target)) {
        return true
      }
    }

    // Ignore attribute/style mutations on our managed elements
    if (mutation.type === 'attributes') {
      if (target === this.dom || target === this.contentDOM) {
        return true
      }
    }

    // Ignore childList mutations on contentDOM (ProseMirror manages children)
    // but we need to let ProseMirror handle actual content changes
    if (target === this.contentDOM && mutation.type === 'childList') {
      // Only ignore if it's not a real content change
      // (ProseMirror will handle column additions/removals through update())
      return false
    }

    return false
  }

  destroy(): void {
    this.closeContextMenu()
    if (this.selectionCheckInterval !== null) {
      window.clearInterval(this.selectionCheckInterval)
      this.selectionCheckInterval = null
    }
    this.dom.removeEventListener('mouseenter', this.handleMouseEnter)
    this.dom.removeEventListener('mouseleave', this.handleMouseLeave)
    this.dom.removeEventListener('contextmenu', this.handleContextMenu)
    document.removeEventListener('mousemove', this.handleResizeMove)
    document.removeEventListener('mouseup', this.handleResizeEnd)
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
  }
}
