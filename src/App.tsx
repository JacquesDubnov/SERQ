import { useRef, useState, useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { EditorCore, EditorToolbar, EditorWrapper, SelectionContextMenu, type EditorCoreRef } from './components/Editor';
import { Canvas, type CanvasWidth } from './components/Layout';
import { StylePanel, type StylePanelType } from './components/StylePanel';
import { CommandPalette } from './components/CommandPalette';
import { OutlinePanel } from './components/DocumentOutline';
import { VersionHistoryPanel } from './components/VersionHistory';
import { CommentPanel, CommentTooltip } from './components/Comments';
import { StatusBar } from './components/StatusBar';
import { ExportMenu } from './components/ExportMenu';
import { useEditorStore, useStyleStore } from './stores';
import { useKeyboardShortcuts, useAutoSave, useSystemTheme, useFocusMode } from './hooks';
import { useTauriFileDrop } from './hooks/useTauriFileDrop';
import { getStyleDefaults } from './lib/preferencesStore';
import type { Editor, JSONContent } from '@tiptap/core';

/**
 * Format a Date object as a relative time string
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return date.toLocaleDateString()
}

// Panel button component
function PanelButton({
  label,
  isActive,
  onClick,
  colors,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  colors: { textPrimary: string; textSecondary: string; bgSurface: string };
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-xs rounded transition-colors"
      style={{
        backgroundColor: isActive ? colors.bgSurface : 'transparent',
        color: isActive ? colors.textPrimary : colors.textSecondary,
      }}
    >
      {label}
    </button>
  );
}

function App() {
  const editorRef = useRef<EditorCoreRef>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activePanel, setActivePanel] = useState<StylePanelType | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [outlinePanelOpen, setOutlinePanelOpen] = useState(false);
  const [isVersionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [typewriterEnabled, setTypewriterEnabled] = useState(false);

  // Zustand store for document state
  const document = useEditorStore((state) => state.document);
  const canvasWidth = useEditorStore((state) => state.canvasWidth);
  const setCanvasWidth = useEditorStore((state) => state.setCanvasWidth);
  const markDirty = useEditorStore((state) => state.markDirty);
  const showSaveGlow = useEditorStore((state) => state.showSaveGlow);

  // Focus mode state
  const { isFocusMode } = useFocusMode();

  // System theme detection - this responds to styleStore.themeMode
  const { effectiveTheme } = useSystemTheme();

  // Theme toggle - affects EVERYTHING (interface + canvas)
  const handleToggleTheme = useCallback(() => {
    const styleStore = useStyleStore.getState();
    const currentMode = styleStore.themeMode;

    let newMode: 'light' | 'dark' | 'system';
    if (currentMode === 'system') {
      newMode = effectiveTheme === 'dark' ? 'light' : 'dark';
    } else {
      newMode = currentMode === 'dark' ? 'light' : 'dark';
    }

    styleStore.setThemeMode(newMode);
  }, [effectiveTheme]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(editorRef);
  useAutoSave(editorRef, true);

  // Handle Tauri file drops for images
  useTauriFileDrop(editor);

  // Keyboard shortcut for style panel (Cmd+Shift+Y toggles themes panel)
  useHotkeys(
    'mod+shift+y',
    (e) => {
      e.preventDefault();
      setActivePanel((prev) => (prev === 'themes' ? null : 'themes'));
    },
    { enableOnContentEditable: true }
  );

  // Get the store action for storing selection
  const setStoredSelection = useEditorStore((state) => state.setStoredSelection);

  // Keyboard shortcut for command palette (Cmd+P)
  useHotkeys(
    'mod+p',
    (e) => {
      e.preventDefault();
      // Store current selection before opening palette (for commands like Add Comment)
      if (editor && !commandPaletteOpen) {
        const { from, to } = editor.state.selection;
        setStoredSelection({ from, to });
        console.log('[App] Stored selection before opening palette:', { from, to });
      }
      setCommandPaletteOpen((prev) => !prev);
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  // Keyboard shortcut for document outline (Cmd+Shift+O)
  useHotkeys(
    'mod+shift+o',
    (e) => {
      e.preventDefault();
      setOutlinePanelOpen((prev) => !prev);
    },
    { enableOnContentEditable: true }
  );


  // Toggle panel helper
  const togglePanel = useCallback((panel: StylePanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

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

        styleStore.setTypography(defaults.defaultTypography);
        styleStore.setColor(defaults.defaultColor);
        styleStore.setCanvas(defaults.defaultCanvas);
        styleStore.setLayout(defaults.defaultLayout);

        if (defaults.themeMode) {
          styleStore.setThemeMode(defaults.themeMode);
        }

        useEditorStore.getState().markSaved();
      } catch (error) {
        console.debug('[App] Could not load style defaults, using built-in defaults', error);
        const styleStore = useStyleStore.getState();
        styleStore.applyAllPresets();

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        window.document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
      }
    };

    initStyles();
  }, []);

  // Update window title based on document state
  useEffect(() => {
    const dirtyIndicator = document.isDirty ? '• ' : '';
    const displayName = document.path ? document.name : `${document.name} - UNSAVED`;
    window.document.title = `${dirtyIndicator}${displayName} - SERQ`;
  }, [document.name, document.isDirty, document.path]);

  const handleUpdate = useCallback((content: JSONContent) => {
    markDirty();
    console.debug('Editor content updated:', content);
  }, [markDirty]);

  // Toggle typewriter mode
  const handleToggleTypewriter = useCallback(() => {
    if (editor) {
      editor.commands.toggleTypewriterMode();
      setTypewriterEnabled((prev) => !prev);
    }
  }, [editor]);

  // Interface colors based on light/dark mode (affects EVERYTHING)
  const interfaceBg = effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff';
  const interfaceBgSurface = effectiveTheme === 'dark' ? '#262626' : '#f5f5f5';
  const interfaceBorder = effectiveTheme === 'dark' ? '#3f3f46' : '#e5e7eb';
  const interfaceTextPrimary = effectiveTheme === 'dark' ? '#f5f5f5' : '#1a1a1a';
  const interfaceTextSecondary = effectiveTheme === 'dark' ? '#a1a1aa' : '#6b7280';
  const interfaceTextMuted = effectiveTheme === 'dark' ? '#71717a' : '#9ca3af';

  const interfaceColors = {
    bg: interfaceBg,
    bgSurface: interfaceBgSurface,
    border: interfaceBorder,
    textPrimary: interfaceTextPrimary,
    textSecondary: interfaceTextSecondary,
    textMuted: interfaceTextMuted,
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: interfaceBgSurface,
        minWidth: '400px',  // 320px canvas + 40px margins on each side
        minHeight: '700px',
      }}
    >
      {/* Fixed Header + Toolbar - SOLID BACKGROUND, content scrolls under */}
      <header
        className="fixed top-0 left-0 right-0 z-30"
        style={{
          backgroundColor: interfaceBg,
          borderBottom: `1px solid ${interfaceBorder}`,
        }}
      >
        {/* Top bar with proper padding */}
        <div className="py-3 flex items-center justify-between" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold" style={{ color: interfaceTextPrimary }}>SERQ</span>
            <div className="h-4 w-px" style={{ backgroundColor: interfaceBorder }} />
            {/* Outline toggle button */}
            <button
              onClick={() => setOutlinePanelOpen((prev) => !prev)}
              title="Document Outline (Cmd+Shift+O)"
              className="p-1.5 rounded transition-colors"
              style={{
                backgroundColor: outlinePanelOpen ? interfaceBgSurface : 'transparent',
                color: outlinePanelOpen ? interfaceTextPrimary : interfaceTextSecondary,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <div className="h-4 w-px" style={{ backgroundColor: interfaceBorder }} />
            <div className="flex items-center gap-2">
              {document.isDirty && (
                <span className="text-orange-500 text-lg" title="Unsaved changes">•</span>
              )}
              <span className="text-sm" style={{ color: interfaceTextSecondary }}>
                {document.path ? document.name : `${document.name} - UNSAVED`}
              </span>
              {document.lastSaved && !document.isDirty && (
                <span className="text-xs" style={{ color: interfaceTextMuted }}>
                  Saved {formatRelativeTime(document.lastSaved)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle - show moon in light mode (to switch to dark), sun in dark mode (to switch to light) */}
            <button
              onClick={handleToggleTheme}
              title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
              className="p-2 rounded transition-colors"
              style={{ color: interfaceTextSecondary }}
            >
              {effectiveTheme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            <div className="h-4 w-px" style={{ backgroundColor: interfaceBorder }} />

            {/* Style panel buttons */}
            <PanelButton label="Themes" isActive={activePanel === 'themes'} onClick={() => togglePanel('themes')} colors={interfaceColors} />
            <PanelButton label="Colors" isActive={activePanel === 'colors'} onClick={() => togglePanel('colors')} colors={interfaceColors} />
            <PanelButton label="Typography" isActive={activePanel === 'typography'} onClick={() => togglePanel('typography')} colors={interfaceColors} />
            <PanelButton label="Canvas" isActive={activePanel === 'canvas'} onClick={() => togglePanel('canvas')} colors={interfaceColors} />
            <PanelButton label="Layout" isActive={activePanel === 'layout'} onClick={() => togglePanel('layout')} colors={interfaceColors} />

            <div className="h-4 w-px" style={{ backgroundColor: interfaceBorder }} />

            {/* Canvas width selector */}
            <label htmlFor="canvas-width" className="text-sm" style={{ color: interfaceTextSecondary }}>
              Width:
            </label>
            <select
              id="canvas-width"
              value={canvasWidth}
              onChange={(e) => setCanvasWidth(e.target.value as CanvasWidth)}
              className="text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: interfaceBg,
                border: `1px solid ${interfaceBorder}`,
                color: interfaceTextPrimary,
              }}
            >
              <option value="narrow">Narrow</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
              <option value="full">Full</option>
            </select>

            <div className="h-4 w-px" style={{ backgroundColor: interfaceBorder }} />

            {/* Export Menu */}
            <ExportMenu editor={editor} interfaceColors={interfaceColors} />
          </div>
        </div>

        {/* Toolbar with padding */}
        {editor && (
          <EditorToolbar
            editor={editor}
            interfaceColors={interfaceColors}
          />
        )}
      </header>

      {/* Main content - pushed down by header height, padded at bottom for status bar */}
      <main
        className="flex-1 overflow-auto"
        style={{ marginTop: '52px', paddingBottom: '36px' }} // Clear header + status bar
      >
        <Canvas width={canvasWidth} viewportColor={interfaceBgSurface}>
          <EditorWrapper editor={editor}>
            <EditorCore
              ref={editorRef}
              placeholder="Start writing..."
              onUpdate={handleUpdate}
            />
          </EditorWrapper>
        </Canvas>
      </main>

      {/* Style Panel - full viewport height, overlays content */}
      <StylePanel
        panelType={activePanel}
        onClose={() => setActivePanel(null)}
        interfaceColors={interfaceColors}
      />

      {/* Command Palette */}
      <CommandPalette
        editor={editor}
        isOpen={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onShowOutline={() => setOutlinePanelOpen(true)}
        onShowVersionHistory={() => setVersionHistoryOpen(true)}
      />

      {/* Document Outline Panel */}
      <OutlinePanel
        isOpen={outlinePanelOpen}
        onClose={() => setOutlinePanelOpen(false)}
        editor={editor}
        interfaceColors={interfaceColors}
      />

      {/* Version History Panel */}
      <VersionHistoryPanel
        isOpen={isVersionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        editor={editor}
        interfaceColors={interfaceColors}
      />

      {/* Comment Panel */}
      <CommentPanel
        editor={editor}
        interfaceColors={interfaceColors}
      />

      {/* Comment Tooltip (hover over highlighted comments) */}
      <CommentTooltip
        editor={editor}
        interfaceColors={interfaceColors}
      />

      {/* Selection Context Menu (right-click on selected text) */}
      <SelectionContextMenu
        editor={editor}
        interfaceColors={interfaceColors}
      />

      {/* Status Bar (hidden in focus mode) - fixed at bottom */}
      {!isFocusMode && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <StatusBar
            editor={editor}
            interfaceColors={interfaceColors}
            typewriterEnabled={typewriterEnabled}
            onToggleTypewriter={handleToggleTypewriter}
          />
        </div>
      )}

      {/* Save Glow Effect - blue neon border glow on save */}
      {showSaveGlow && (
        <div
          className="save-glow-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: 'inset 0 0 30px 8px rgba(59, 130, 246, 0.6), inset 0 0 60px 15px rgba(59, 130, 246, 0.3)',
            animation: 'saveGlow 0.6s ease-out forwards',
          }}
        />
      )}

      {/* Save glow keyframes - injected once */}
      <style>{`
        @keyframes saveGlow {
          0% {
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
