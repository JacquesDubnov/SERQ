/**
 * Core Types for SERQ Style System
 *
 * 5-level cascade: PROJECT → DOCUMENT → PAGE → BLOCK → CHARACTER
 * Each level can override its parent. Character marks have highest priority.
 */

// ============================================================================
// Block Identity
// ============================================================================

export interface BlockIdentity {
  /** Primary instance ID - unique within entire system */
  id: string

  /** Document this block belongs to */
  documentId: string

  /** Origin tracking (for copy/paste lineage) */
  origin: {
    blockId: string
    documentId: string
    copiedAt: string // ISO 8601
  } | null

  /** Linking system (macro blocks) */
  linking: {
    mode: 'none' | 'source' | 'target'
    sourceRef: {
      blockId: string
      documentId: string
    } | null
    targetRefs: Array<{
      blockId: string
      documentId: string
    }>
    syncMode: 'one-way' | 'bidirectional'
    syncContent: boolean
    syncStyle: boolean
  }

  /** Reference URI for jump links: serq://document/{docId}/block/{blockId} */
  uri: string
}

// ============================================================================
// Style Properties
// ============================================================================

export interface BlockStyle {
  // Typography
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  color: string

  // Layout
  textAlign: 'left' | 'center' | 'right' | 'justify'
  indent: number
  spacingBefore: string
  spacingAfter: string

  // Visual
  backgroundColor: string | null
  borderStyle: BorderConfig | null
  padding: PaddingConfig | null

  // Decoration
  textDecoration: {
    bold: boolean
    italic: boolean
    underline: boolean
    strikethrough: boolean
  }
}

export interface BorderConfig {
  width: string
  style: 'solid' | 'dashed' | 'dotted' | 'double'
  color: string
  radius: string
}

export interface PaddingConfig {
  top: string
  right: string
  bottom: string
  left: string
}

/** Resolved style with all cascade levels applied */
export type ResolvedBlockStyle = Required<BlockStyle>

/** Partial style for overrides at any level */
export type StyleOverrides = Partial<BlockStyle>

// ============================================================================
// Named Styles
// ============================================================================

export interface StyleDefinition {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Inherit from another style */
  basedOn: string | null

  /** Block types this style can apply to */
  appliesTo: string[] // ['paragraph'] or ['heading'] or ['*']

  /** Style properties */
  properties: StyleOverrides

  /** Scope */
  scope: 'project' | 'document'

  /** Built-in vs custom */
  isBuiltIn: boolean

  /** Display grouping */
  category: 'Headings' | 'Body' | 'Lists' | 'Custom' | string

  /** Sort order within category */
  sortOrder: number
}

// ============================================================================
// Block Metadata
// ============================================================================

export interface BlockMetadata {
  /** Identity (required for all blocks) */
  identity: BlockIdentity

  /** Block type discriminator */
  type: string

  /** Type-specific data */
  typeData: Record<string, unknown>

  /** Reference to named style */
  styleRef: string | null

  /** Explicit style overrides */
  styleOverrides: StyleOverrides

  /** Computed/resolved style (runtime only) */
  _resolvedStyle?: ResolvedBlockStyle

  /** Flags */
  isLocked: boolean
  isHidden: boolean

  /** Timestamps */
  createdAt: string
  modifiedAt: string

  /** Extensible custom data */
  customData: Record<string, unknown>
}

// ============================================================================
// Page, Document, Project Metadata
// ============================================================================

export interface PageMetadata {
  id: string
  pageNumber: number

  size: {
    width: number
    height: number
    preset: 'A4' | 'Letter' | 'Legal' | 'Custom'
  }

  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }

  orientation: 'portrait' | 'landscape'
  columns: number
  columnGap: string
  mode: 'continuous' | 'paginated'

  header: HeaderFooterConfig | null
  footer: HeaderFooterConfig | null

  defaultStyles: {
    block: StyleOverrides
  } | null

  backgroundColor: string | null
}

export interface HeaderFooterConfig {
  enabled: boolean
  content: string
  height: string
  showOnFirstPage: boolean
}

export interface DocumentMetadata {
  id: string
  title: string

  createdAt: string
  modifiedAt: string
  version: number

  projectId: string | null

  pageMode: 'continuous' | 'paginated'
  pages: PageMetadata[]
  defaultPageConfig: Omit<PageMetadata, 'id' | 'pageNumber'>

  defaultStyles: {
    block: BlockStyle
    paragraph: StyleOverrides
    heading: {
      1: StyleOverrides
      2: StyleOverrides
      3: StyleOverrides
      4: StyleOverrides
      5: StyleOverrides
      6: StyleOverrides
    }
    [blockType: string]: StyleOverrides | BlockStyle | Record<number, StyleOverrides>
  }

  localStyles: StyleDefinition[]
  localColors: ColorDefinition[]
  localFonts: FontDefinition[]
}

export interface ProjectMetadata {
  id: string
  name: string
  description: string

  createdAt: string
  modifiedAt: string

  documents: Array<{
    id: string
    path: string
    title: string
    order: number
  }>

  defaultStyles: {
    block: BlockStyle
    paragraph: StyleOverrides
    heading: {
      1: StyleOverrides
      2: StyleOverrides
      3: StyleOverrides
      4: StyleOverrides
      5: StyleOverrides
      6: StyleOverrides
    }
    [blockType: string]: StyleOverrides | BlockStyle | Record<number, StyleOverrides>
  }

  sharedStyles: StyleDefinition[]
  sharedColors: ColorDefinition[]
  sharedFonts: FontDefinition[]

  brandKit: {
    logos: LogoDefinition[]
    primaryColor: string
    secondaryColor: string
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface ColorDefinition {
  id: string
  name: string
  value: string // hex or hsl
  category: string
}

export interface FontDefinition {
  id: string
  name: string
  family: string
  weights: number[]
  source: 'system' | 'google' | 'custom'
  url?: string
}

export interface LogoDefinition {
  id: string
  name: string
  variant: 'primary' | 'secondary' | 'monochrome'
  format: 'svg' | 'png'
  path: string
}

// ============================================================================
// Version Control
// ============================================================================

export interface DocumentVersion {
  versionId: string
  documentId: string
  versionNumber: number

  savedAt: string
  autoSave: boolean

  content: {
    full?: unknown // ProseMirror JSON
    delta?: {
      baseVersion: string
      operations: unknown[] // ProseMirror steps
    }
  }

  metadata: DocumentMetadata
  contentSize: number
  compressedSize: number

  savedBy: string | null
  deviceId: string
  sessionId: string

  canRestore: boolean
  restoreNotes: string | null
  label: string | null
}

// ============================================================================
// Style Resolution Context
// ============================================================================

export interface StyleContext {
  projectId: string | null
  documentId: string
  pageId: string | null
  blockId: string
  blockType: string
  blockStyleVersion: number
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_BLOCK_STYLE: BlockStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '1.6',
  letterSpacing: '0',
  color: 'var(--color-text)',
  textAlign: 'left',
  indent: 0,
  spacingBefore: '0',
  spacingAfter: '0.5em',
  backgroundColor: null,
  borderStyle: null,
  padding: null,
  textDecoration: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  },
}
