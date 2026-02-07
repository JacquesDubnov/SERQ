/**
 * SERQ Document Migration
 *
 * Entry point for all document migrations. Run before editor initialization.
 *
 * Migration order:
 * 1. Column width migration (JSON-level, before ProseMirror parsing)
 * 2. Section migration (ProseMirror-level, wraps blocks in sections)
 */

export { migrateToSections, generateUUID } from './migrate-to-sections'
export { migrateColumnWidthsJSON } from './migrate-column-widths'
export type { DocJSON } from './migrate-column-widths'
