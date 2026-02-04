/**
 * Style Resolver - Cascading style resolution with caching
 *
 * Resolution order (lowest to highest priority):
 * 1. System defaults
 * 2. Project defaults for block type
 * 3. Project defaults for block
 * 4. Document defaults for block type
 * 5. Document defaults for block
 * 6. Page defaults (if any)
 * 7. Named style (if referenced)
 * 8. Block explicit overrides
 *
 * Performance targets:
 * - Cache hit: < 0.01ms
 * - Full resolution: < 0.5ms
 * - Batch invalidation (1000 blocks): < 5ms
 */

import type {
  BlockStyle,
  ResolvedBlockStyle,
  StyleOverrides,
  StyleDefinition,
  StyleContext,
  BlockMetadata,
  PageMetadata,
  DocumentMetadata,
  ProjectMetadata,
} from './types'
import { DEFAULT_BLOCK_STYLE } from './types'

// ============================================================================
// Cache Entry
// ============================================================================

interface CacheEntry {
  style: ResolvedBlockStyle
  cacheKey: string
}

// ============================================================================
// Style Resolver
// ============================================================================

export class StyleResolver {
  private cache = new Map<string, CacheEntry>()

  // Version counters for surgical cache invalidation
  private projectVersion = 0
  private documentVersions = new Map<string, number>()
  private pageVersions = new Map<string, number>()
  private blockVersions = new Map<string, number>()

  // Style registry for named styles
  private namedStyles = new Map<string, StyleDefinition>()

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Resolve full style for a block
   * Uses cache when possible, computes and caches on miss
   */
  resolveBlockStyle(
    block: BlockMetadata,
    page: PageMetadata | null,
    document: DocumentMetadata,
    project: ProjectMetadata | null
  ): ResolvedBlockStyle {
    const context = this.buildContext(block, page, document, project)
    const cacheKey = this.computeCacheKey(context)

    // Check cache
    const cached = this.cache.get(block.identity.id)
    if (cached && cached.cacheKey === cacheKey) {
      return cached.style
    }

    // Cache miss - compute
    const resolved = this.computeStyle(block, page, document, project)

    // Cache the result
    this.cache.set(block.identity.id, {
      style: resolved,
      cacheKey,
    })

    return resolved
  }

  /**
   * Register a named style
   */
  registerStyle(style: StyleDefinition): void {
    this.namedStyles.set(style.id, style)
    // Invalidate all blocks that might use this style
    this.invalidateStyleUsers(style.id)
  }

  /**
   * Update a named style
   */
  updateStyle(styleId: string, updates: Partial<StyleDefinition>): void {
    const existing = this.namedStyles.get(styleId)
    if (!existing) return

    this.namedStyles.set(styleId, { ...existing, ...updates })
    this.invalidateStyleUsers(styleId)
  }

  /**
   * Remove a named style
   */
  removeStyle(styleId: string): void {
    this.namedStyles.delete(styleId)
    this.invalidateStyleUsers(styleId)
  }

  /**
   * Get a named style by ID
   */
  getStyle(styleId: string): StyleDefinition | undefined {
    return this.namedStyles.get(styleId)
  }

  /**
   * Get all named styles
   */
  getAllStyles(): StyleDefinition[] {
    return Array.from(this.namedStyles.values())
  }

  // ============================================================================
  // Invalidation
  // ============================================================================

  /** Invalidate all caches (use sparingly) */
  invalidateAll(): void {
    this.cache.clear()
  }

  /** Invalidate project-level changes */
  invalidateProject(): void {
    this.projectVersion++
    // All caches are now stale
  }

  /** Invalidate document-level changes */
  invalidateDocument(documentId: string): void {
    const current = this.documentVersions.get(documentId) || 0
    this.documentVersions.set(documentId, current + 1)
  }

  /** Invalidate page-level changes */
  invalidatePage(pageId: string): void {
    const current = this.pageVersions.get(pageId) || 0
    this.pageVersions.set(pageId, current + 1)
  }

  /** Invalidate a specific block */
  invalidateBlock(blockId: string): void {
    const current = this.blockVersions.get(blockId) || 0
    this.blockVersions.set(blockId, current + 1)
    this.cache.delete(blockId)
  }

  /** Invalidate all blocks using a named style */
  private invalidateStyleUsers(_styleId: string): void {
    // For now, invalidate all. In production, track style->block mappings
    this.invalidateAll()
  }

  // ============================================================================
  // Internal: Cache Key Computation
  // ============================================================================

  private buildContext(
    block: BlockMetadata,
    page: PageMetadata | null,
    document: DocumentMetadata,
    project: ProjectMetadata | null
  ): StyleContext {
    return {
      projectId: project?.id || null,
      documentId: document.id,
      pageId: page?.id || null,
      blockId: block.identity.id,
      blockType: block.type,
      blockStyleVersion: this.blockVersions.get(block.identity.id) || 0,
    }
  }

  private computeCacheKey(ctx: StyleContext): string {
    // Fast hash using version counters - no deep comparison needed
    const projectVer = this.projectVersion
    const docVer = this.documentVersions.get(ctx.documentId) || 0
    const pageVer = ctx.pageId ? (this.pageVersions.get(ctx.pageId) || 0) : 0
    const blockVer = ctx.blockStyleVersion

    return `${projectVer}:${docVer}:${pageVer}:${blockVer}`
  }

  // ============================================================================
  // Internal: Style Computation
  // ============================================================================

  private computeStyle(
    block: BlockMetadata,
    page: PageMetadata | null,
    document: DocumentMetadata,
    project: ProjectMetadata | null
  ): ResolvedBlockStyle {
    // Start with system defaults
    let style: BlockStyle = { ...DEFAULT_BLOCK_STYLE }

    // Apply project defaults
    if (project) {
      style = this.mergeStyles(style, project.defaultStyles.block)

      // Apply project block-type defaults
      const typeDefaults = project.defaultStyles[block.type]
      if (typeDefaults && !this.isHeadingConfig(typeDefaults)) {
        style = this.mergeStyles(style, typeDefaults as StyleOverrides)
      }

      // Handle heading levels
      if (block.type === 'heading' && block.typeData.level) {
        const level = block.typeData.level as 1 | 2 | 3 | 4 | 5 | 6
        const headingDefaults = project.defaultStyles.heading?.[level]
        if (headingDefaults) {
          style = this.mergeStyles(style, headingDefaults)
        }
      }
    }

    // Apply document defaults
    style = this.mergeStyles(style, document.defaultStyles.block)

    // Apply document block-type defaults
    const docTypeDefaults = document.defaultStyles[block.type]
    if (docTypeDefaults && !this.isHeadingConfig(docTypeDefaults)) {
      style = this.mergeStyles(style, docTypeDefaults as StyleOverrides)
    }

    // Handle heading levels for document
    if (block.type === 'heading' && block.typeData.level) {
      const level = block.typeData.level as 1 | 2 | 3 | 4 | 5 | 6
      const headingDefaults = document.defaultStyles.heading?.[level]
      if (headingDefaults) {
        style = this.mergeStyles(style, headingDefaults)
      }
    }

    // Apply page defaults (if any)
    if (page?.defaultStyles) {
      style = this.mergeStyles(style, page.defaultStyles.block)
    }

    // Apply named style (if referenced)
    if (block.styleRef) {
      const namedStyle = this.resolveNamedStyle(block.styleRef)
      if (namedStyle) {
        style = this.mergeStyles(style, namedStyle)
      }
    }

    // Apply block explicit overrides (highest priority)
    style = this.mergeStyles(style, block.styleOverrides)

    return style as ResolvedBlockStyle
  }

  /**
   * Resolve a named style, following basedOn chain
   */
  private resolveNamedStyle(styleId: string): StyleOverrides | null {
    const style = this.namedStyles.get(styleId)
    if (!style) return null

    // If this style is based on another, resolve the chain
    if (style.basedOn) {
      const baseStyle = this.resolveNamedStyle(style.basedOn)
      if (baseStyle) {
        return this.mergeOverrides(baseStyle, style.properties)
      }
    }

    return style.properties
  }

  /**
   * Type guard for heading config
   */
  private isHeadingConfig(obj: unknown): obj is Record<number, StyleOverrides> {
    return typeof obj === 'object' && obj !== null && '1' in obj
  }

  /**
   * Merge base style with overrides
   */
  private mergeStyles(base: BlockStyle, overrides: StyleOverrides): BlockStyle {
    const result = { ...base }

    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined && value !== null) {
        if (key === 'textDecoration' && typeof value === 'object') {
          result.textDecoration = { ...result.textDecoration, ...value }
        } else {
          (result as Record<string, unknown>)[key] = value
        }
      }
    }

    return result
  }

  /**
   * Merge two style overrides
   */
  private mergeOverrides(base: StyleOverrides, top: StyleOverrides): StyleOverrides {
    const result: StyleOverrides = { ...base }

    for (const [key, value] of Object.entries(top)) {
      if (value !== undefined && value !== null) {
        if (key === 'textDecoration' && typeof value === 'object') {
          const baseDecor = result.textDecoration || {
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          }
          const topDecor = value as Partial<BlockStyle['textDecoration']>
          result.textDecoration = {
            bold: topDecor.bold ?? baseDecor.bold,
            italic: topDecor.italic ?? baseDecor.italic,
            underline: topDecor.underline ?? baseDecor.underline,
            strikethrough: topDecor.strikethrough ?? baseDecor.strikethrough,
          }
        } else {
          (result as Record<string, unknown>)[key] = value
        }
      }
    }

    return result
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const styleResolver = new StyleResolver()
