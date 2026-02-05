/**
 * Named Style Loading
 *
 * Loads named styles from the SQLite database and registers
 * them with the style resolver on app startup.
 */

import { database } from '../database'
import { styleResolver } from '../style-system'

// ============================================================================
// Load Named Styles from Database
// ============================================================================

export async function loadNamedStyles(): Promise<void> {
  try {
    const styles = await database.select<{
      id: string
      name: string
      scope: string
      scope_id: string | null
      based_on: string | null
      applies_to: string
      definition: string
      category: string | null
      sort_order: number
      is_builtin: number
    }>('SELECT * FROM styles ORDER BY sort_order')

    for (const row of styles) {
      styleResolver.registerStyle({
        id: row.id,
        name: row.name,
        scope: row.scope as 'project' | 'document',
        basedOn: row.based_on,
        appliesTo: JSON.parse(row.applies_to || '["*"]'),
        properties: JSON.parse(row.definition || '{}'),
        category: row.category || 'Custom',
        sortOrder: row.sort_order,
        isBuiltIn: row.is_builtin === 1,
      })
    }

  } catch (error) {
    console.warn('[AppInit] Failed to load named styles:', error)
  }
}
