import { useRef, useState, useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { EditorCore, EditorToolbar, EditorWrapper, type EditorCoreRef } from './components/Editor';
import { Canvas, type CanvasWidth } from './components/Layout';
import { StylePanel } from './components/StylePanel';
import { useEditorStore, useStyleStore } from './stores';
import { useKeyboardShortcuts, useAutoSave, useSystemTheme } from './hooks';
import { getStyleDefaults } from './lib/preferencesStore';
import type { Editor, JSONContent } from '@tiptap/core';

/**
 * Format a Date object as a relative time string
 * e.g., "just now", "5m ago", "2h ago"
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return date.toLocaleDateString()
}

function App() {
  const editorRef = useRef<EditorCoreRef>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);

  // Zustand store for document state
  const document = useEditorStore((state) => state.document);
  const canvasWidth = useEditorStore((state) => state.canvasWidth);
  const setCanvasWidth = useEditorStore((state) => state.setCanvasWidth);
  const markDirty = useEditorStore((state) => state.markDirty);

  // System theme detection and toggle
  const { effectiveTheme, toggleTheme } = useSystemTheme();

  // Initialize keyboard shortcuts (Cmd+S, Cmd+Shift+S, Cmd+O, Cmd+N)
  useKeyboardShortcuts(editorRef);

  // Initialize auto-save (30-second debounce for existing files)
  useAutoSave(editorRef, true);

  // Keyboard shortcut for style panel (Cmd+Shift+Y)
  useHotkeys(
    'mod+shift+y',
    (e) => {
      e.preventDefault();
      setIsStylePanelOpen((prev) => !prev);
    },
    { enableOnContentEditable: true }
  );

  // Get editor instance after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const editorInstance = editorRef.current?.getEditor();
      if (editorInstance) {
        setEditor(editorInstance);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Initialize styles on app mount
  useEffect(() => {
    const initStyles = async () => {
      try {
        const defaults = await getStyleDefaults();
        const styleStore = useStyleStore.getState();

        // Apply user's default style presets
        styleStore.setTypography(defaults.defaultTypography);
        styleStore.setColor(defaults.defaultColor);
        styleStore.setCanvas(defaults.defaultCanvas);
        styleStore.setLayout(defaults.defaultLayout);

        // Mark document as clean after initial style application
        // (style setters mark dirty, but this is initial load, not user change)
        useEditorStore.getState().markSaved();
      } catch (error) {
        console.debug('[App] Could not load style defaults, using built-in defaults', error);
        // Apply built-in defaults if preferences store not available
        const styleStore = useStyleStore.getState();
        styleStore.applyAllPresets();
      }
    };

    initStyles();
  }, []);

  // Update window title based on document state
  useEffect(() => {
    const dirtyIndicator = document.isDirty ? '• ' : '';
    window.document.title = `${dirtyIndicator}${document.name} - SERQ`;
  }, [document.name, document.isDirty]);

  const handleUpdate = useCallback((content: JSONContent) => {
    // Mark document as dirty when content changes
    markDirty();
    console.debug('Editor content updated:', content);
  }, [markDirty]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Document Title, Theme Toggle, and Style Panel Toggle */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-gray-900">SERQ</span>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            {document.isDirty && (
              <span className="text-orange-500 text-lg" title="Unsaved changes">•</span>
            )}
            <span className="text-sm text-gray-600">{document.name}</span>
            {document.lastSaved && !document.isDirty && (
              <span className="text-xs text-gray-400">
                Saved {formatRelativeTime(document.lastSaved)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Toggle theme (currently ${effectiveTheme})`}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            {effectiveTheme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Style panel toggle */}
          <button
            onClick={() => setIsStylePanelOpen(!isStylePanelOpen)}
            title="Styles (Cmd+Shift+Y)"
            className={`p-2 rounded transition-colors ${
              isStylePanelOpen
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>

          <div className="h-4 w-px bg-gray-300 mx-1" />

          {/* Canvas width selector */}
          <label htmlFor="canvas-width" className="text-sm text-gray-600">
            Width:
          </label>
          <select
            id="canvas-width"
            value={canvasWidth}
            onChange={(e) => setCanvasWidth(e.target.value as CanvasWidth)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="narrow">Narrow</option>
            <option value="normal">Normal</option>
            <option value="wide">Wide</option>
            <option value="full">Full</option>
          </select>
        </div>
      </header>

      {/* Toolbar */}
      {editor && <EditorToolbar editor={editor} />}

      {/* Canvas with Click-Anywhere Editor - shifts when panel open */}
      <main className={`flex-1 overflow-auto transition-all duration-200 ${isStylePanelOpen ? 'mr-80' : ''}`}>
        <Canvas width={canvasWidth}>
          <EditorWrapper editor={editor}>
            <EditorCore
              ref={editorRef}
              placeholder="Start writing..."
              onUpdate={handleUpdate}
            />
          </EditorWrapper>
        </Canvas>
      </main>

      {/* Style Panel */}
      <StylePanel
        isOpen={isStylePanelOpen}
        onClose={() => setIsStylePanelOpen(false)}
      />
    </div>
  );
}

export default App;
