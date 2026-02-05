/**
 * SERQ App - Phase 3: Style System Integration
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { EditorCore, EditorWrapper, type EditorCoreRef } from './components/Editor';
import { UnifiedToolbar } from './components/unified-toolbar';
import { Canvas } from './components/Layout';
import { StylePanel } from './components/StylePanel';
// TODO: Re-enable Format Painter in final polish phase
// import { FormatPainterButton } from './components/FormatPainter';
import { useEditorStore } from './stores/editorStore';
import { useStyleStore } from './stores/styleStore';
import { useKeyboardShortcuts, useAutoSave, useSystemTheme } from './hooks';
import { PaginationModeSelector } from './components/tiptap-ui-custom/pagination-mode-selector';
import { useAppInit, setCurrentEditor } from './lib/app-init';
import { CommandPalette } from './components/CommandPalette';
import type { Editor } from '@tiptap/core';

import './index.css';

/**
 * Format a date as relative time (e.g., "just now", "2m ago", "1h ago")
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

// Clean SVG icons (NO EMOJIS EVER)
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const StylesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);


function App() {
  const editorRef = useRef<EditorCoreRef>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // App initialization (database, commands, styles)
  const { loading: appLoading, error: appError } = useAppInit();

  // Command palette shortcut (Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Preserve content across pagination mode changes
  const contentRef = useRef<string>('<p></p>');
  const [editorKey, setEditorKey] = useState(0);

  // System theme detection with Tauri integration
  const { effectiveTheme, toggleTheme: toggleSystemTheme } = useSystemTheme();

  // Keep command registry updated with current editor
  useEffect(() => {
    setCurrentEditor(editor);
    return () => setCurrentEditor(null);
  }, [editor]);

  // Sync style store with system theme
  const { setEffectiveTheme, applyAllPresets } = useStyleStore();

  useEffect(() => {
    setEffectiveTheme(effectiveTheme);
  }, [effectiveTheme, setEffectiveTheme]);

  // Apply all presets on initial mount
  useEffect(() => {
    applyAllPresets();
  }, [applyAllPresets]);

  // Computed dark mode flag
  const isDark = effectiveTheme === 'dark';

  // Zustand store - must be declared before any effects that reference its values
  const {
    document: docMeta,
    canvasWidth,
    zoom,
    pagination,
    markDirty,
    setCanvasWidth,
    setZoom,
    togglePagination,
    setPageSize,
  } = useEditorStore();

  // Force editor recreation when theme changes in pagination mode (for gap color)
  const prevThemeRef = useRef(isDark);
  useEffect(() => {
    if (prevThemeRef.current !== isDark && pagination.enabled) {
      // Theme changed while in pagination mode - need to recreate editor for new gap color
      if (editorRef.current) {
        contentRef.current = editorRef.current.getHTML();
      }
      setEditorKey((k) => k + 1);
    }
    prevThemeRef.current = isDark;
  }, [isDark, pagination.enabled]);

  // Add .dark class to document for TipTap components
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Track viewport width for zoom constraints
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (mainContentRef.current) {
        setViewportWidth(mainContentRef.current.clientWidth);
      } else {
        setViewportWidth(window.innerWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isStylePanelOpen]);

  // Calculate max zoom that won't cause horizontal scroll
  const canvasWidthPx: Record<typeof canvasWidth, number> = {
    narrow: 600,
    normal: 720,
    wide: 900,
    full: viewportWidth - 40, // Account for padding
  };
  const currentCanvasWidth = canvasWidthPx[canvasWidth];

  // Register keyboard shortcuts for file operations
  useKeyboardShortcuts(editorRef);

  // Enable auto-save (30-second debounce, only for saved documents)
  useAutoSave(editorRef);

  // Get editor instance after mount (poll until ready, re-run when editorKey changes)
  useEffect(() => {
    let cancelled = false;

    const checkForEditor = () => {
      if (cancelled) return;

      const editorInstance = editorRef.current?.getEditor();
      if (editorInstance && editorInstance.isEditable) {
        setEditor(editorInstance);
      } else {
        // Poll every 50ms until editor is ready
        setTimeout(checkForEditor, 50);
      }
    };

    // Start checking after a brief delay
    setTimeout(checkForEditor, 50);

    return () => {
      cancelled = true;
    };
  }, [editorKey]);

  // Update window title to reflect document state
  useEffect(() => {
    const dirtyIndicator = docMeta.isDirty ? '• ' : '';
    window.document.title = `${dirtyIndicator}${docMeta.name} - SERQ`;
  }, [docMeta.name, docMeta.isDirty]);

  const handleUpdate = useCallback(() => {
    markDirty();
  }, [markDirty]);

  const handleToggleStylePanel = useCallback(() => {
    setIsStylePanelOpen((prev) => !prev);
  }, []);

  // Handle pagination toggle - preserve content across editor recreation
  const handleTogglePagination = useCallback(() => {
    // Save current content before toggling
    if (editorRef.current) {
      contentRef.current = editorRef.current.getHTML();
    }
    togglePagination();
    // Force editor recreation with new extensions
    setEditorKey((k) => k + 1);
  }, [togglePagination]);

  // Handle page size change - preserve content
  const handlePageSizeChange = useCallback((size: Parameters<typeof setPageSize>[0]) => {
    if (editorRef.current) {
      contentRef.current = editorRef.current.getHTML();
    }
    setPageSize(size);
    setEditorKey((k) => k + 1);
  }, [setPageSize]);

  // Theme colors
  const bg = isDark ? '#1a1a1a' : '#ffffff';
  const bgSurface = isDark ? '#262626' : '#f5f5f5';
  const border = isDark ? '#3f3f46' : '#e5e7eb';
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';
  const textSecondary = isDark ? '#a1a1aa' : '#6b7280';
  const textDirty = isDark ? '#fb923c' : '#f97316';

  // Show loading state during app initialization
  if (appLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgSurface,
        color: textSecondary,
        fontSize: '14px',
      }}>
        Initializing...
      </div>
    );
  }

  // Show error state if initialization failed
  if (appError) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgSurface,
        color: '#ef4444',
        fontSize: '14px',
        gap: '8px',
      }}>
        <span>Failed to initialize</span>
        <span style={{ color: textSecondary, fontSize: '12px' }}>{appError.message}</span>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: bgSurface, overflow: 'hidden' }}>
      {/* Header with document title */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: isStylePanelOpen ? '320px' : 0,
          zIndex: 30,
          backgroundColor: bg,
          borderBottom: `1px solid ${border}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'right 200ms ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: textPrimary }}>SERQ</span>
        </div>

        {/* Document title - centered */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <span style={{ fontSize: '14px', color: textSecondary }}>
            {docMeta.isDirty && <span style={{ color: textDirty, marginRight: '4px' }}>•</span>}
            {docMeta.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Format painter button - TODO: Fix and re-enable in final polish phase */}
          {/* {editor && <FormatPainterButton editor={editor} isDark={isDark} />} */}

          {/* Pagination mode selector */}
          <PaginationModeSelector
            paginationEnabled={pagination.enabled}
            pageSize={pagination.pageSize}
            onTogglePagination={handleTogglePagination}
            onPageSizeChange={handlePageSizeChange}
          />

          {/* Canvas width selector (disabled in pagination mode) */}
          <select
            value={canvasWidth}
            onChange={(e) => setCanvasWidth(e.target.value as typeof canvasWidth)}
            disabled={pagination.enabled}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: `1px solid ${border}`,
              backgroundColor: bg,
              color: pagination.enabled ? (isDark ? '#52525b' : '#d1d5db') : textSecondary,
              cursor: pagination.enabled ? 'not-allowed' : 'pointer',
              opacity: pagination.enabled ? 0.5 : 1,
            }}
          >
            <option value="narrow">Narrow</option>
            <option value="normal">Normal</option>
            <option value="wide">Wide</option>
            <option value="full">Full</option>
          </select>

          {/* Styles panel toggle */}
          <button
            onClick={handleToggleStylePanel}
            title="Style presets"
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: isStylePanelOpen ? `2px solid ${isDark ? '#a78bfa' : '#8b5cf6'}` : 'none',
              backgroundColor: isStylePanelOpen ? (isDark ? '#3f3f46' : '#e5e7eb') : 'transparent',
              color: textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StylesIcon />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleSystemTheme}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* Toolbar - fixed below header */}
      {editor && (
        <div
          style={{
            position: 'fixed',
            top: '53px',
            left: 0,
            right: isStylePanelOpen ? '320px' : 0,
            zIndex: 20,
            transition: 'right 200ms ease-out',
            backgroundColor: bg, // Solid background so content clips behind
          }}
        >
          <UnifiedToolbar editor={editor} />
        </div>
      )}

      {/* Main content area - ONLY scrollable region */}
      <main
        ref={mainContentRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: isStylePanelOpen ? '320px' : 0,
          bottom: '40px', // Leave room for footer
          paddingTop: editor ? '210px' : '110px', // Push content below header/toolbar + 75px gap
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '40px',
          display: 'flex',
          justifyContent: 'center',
          transition: 'right 200ms ease-out',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1, // Below toolbar (20) and header (30) - content clips under them
        }}
      >
        {pagination.enabled ? (
          /* Paginated mode - TipTap Pages extension handles layout */
          <div style={{ width: `${100 * (zoom / 100)}%`, maxWidth: '100%' }}>
            <div
              data-zoom-wrapper
              style={{
                width: '100%',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
            >
              <EditorWrapper editor={editor} zoom={zoom}>
                <EditorCore
                  key={`editor-${editorKey}`}
                  ref={editorRef}
                  initialContent={contentRef.current}
                  placeholder="Start writing..."
                  onUpdate={handleUpdate}
                  paginationEnabled={pagination.enabled}
                  pageSize={pagination.pageSize}
                  isDark={isDark}
                />
              </EditorWrapper>
            </div>
          </div>
        ) : (
          /* Continuous mode - use Canvas wrapper */
          <div
            style={{
              width: canvasWidth === 'full' ? '100%' : `${currentCanvasWidth * (zoom / 100)}px`,
              maxWidth: '100%',
            }}
          >
            <div
              data-zoom-wrapper
              style={{
                width: canvasWidth === 'full' ? '100%' : `${currentCanvasWidth}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
              }}
            >
              <Canvas width={canvasWidth}>
                <EditorWrapper editor={editor} zoom={zoom}>
                  <EditorCore
                    key={`editor-${editorKey}`}
                    ref={editorRef}
                    initialContent={contentRef.current}
                    placeholder="Start writing..."
                    onUpdate={handleUpdate}
                    paginationEnabled={false}
                    pageSize={pagination.pageSize}
                    isDark={isDark}
                  />
                </EditorWrapper>
              </Canvas>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: isStylePanelOpen ? '320px' : 0,
          zIndex: 20, // Above main content (z-index: 1)
          backgroundColor: bg,
          borderTop: `1px solid ${border}`,
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: textSecondary,
          transition: 'right 200ms ease-out',
        }}
      >
        <span>{editor?.storage.characterCount?.characters?.() ?? 0} characters</span>

        {/* Zoom slider - double-click to reset to 100% */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: textSecondary }}>{zoom}%</span>
          <input
            type="range"
            className="zoom-slider"
            min={20}
            max={200}
            value={Math.min(zoom, 200)}
            onChange={(e) => setZoom(Number(e.target.value))}
            onDoubleClick={() => setZoom(100)}
            title={`Zoom: ${zoom}% (double-click to reset)`}
          />
          <span style={{ fontSize: '11px', color: textSecondary }}>200%</span>
        </div>

        <span>
          {docMeta.isDirty
            ? 'Unsaved changes'
            : docMeta.lastSaved
              ? `Saved ${formatRelativeTime(docMeta.lastSaved)}`
              : 'No changes'}
        </span>
      </footer>

      {/* Style Panel - slides in from right */}
      <StylePanel
        isOpen={isStylePanelOpen}
        onClose={() => setIsStylePanelOpen(false)}
        isDark={isDark}
      />

      {/* Command Palette - Cmd+P */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}

export default App;
