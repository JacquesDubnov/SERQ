import { useRef, useState, useEffect, useCallback } from 'react';
import { EditorCore, EditorToolbar, EditorWrapper, type EditorCoreRef } from './components/Editor';
import { Canvas, type CanvasWidth } from './components/Layout';
import { useEditorStore } from './stores';
import type { Editor, JSONContent } from '@tiptap/core';

function App() {
  const editorRef = useRef<EditorCoreRef>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Zustand store for document state
  const document = useEditorStore((state) => state.document);
  const canvasWidth = useEditorStore((state) => state.canvasWidth);
  const setCanvasWidth = useEditorStore((state) => state.setCanvasWidth);
  const markDirty = useEditorStore((state) => state.markDirty);

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
      {/* Header with Document Title and Width Selector */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-gray-900">SERQ</span>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center">
            {document.isDirty && (
              <span className="text-orange-500 text-lg mr-1.5" title="Unsaved changes">•</span>
            )}
            <span className="text-sm text-gray-600">{document.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Canvas with Click-Anywhere Editor */}
      <main className="flex-1 overflow-auto">
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
    </div>
  );
}

export default App;
