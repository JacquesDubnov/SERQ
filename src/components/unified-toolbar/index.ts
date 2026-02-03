/**
 * Unified Toolbar
 *
 * A complete toolbar system using the unified style hooks.
 * Provides context-aware styling for both headings and paragraphs.
 *
 * Usage:
 * ```tsx
 * import { UnifiedToolbar } from '@/components/unified-toolbar';
 *
 * function MyEditor() {
 *   const editor = useEditor(...);
 *   return (
 *     <div>
 *       <UnifiedToolbar editor={editor} />
 *       <EditorContent editor={editor} />
 *     </div>
 *   );
 * }
 * ```
 *
 * Individual controls can also be imported:
 * ```tsx
 * import {
 *   FontFamilyControl,
 *   BoldToggle,
 *   TextColorControl,
 * } from '@/components/unified-toolbar/controls';
 * ```
 */

// Main toolbar component
export { UnifiedToolbar, default } from './UnifiedToolbar';

// Re-export all controls for individual use
export * from './controls';
