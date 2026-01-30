import { useRef, useState, useEffect, useCallback } from 'react';
import { EditorCore, EditorToolbar, EditorWrapper, type EditorCoreRef } from './components/Editor';
import { Canvas, type CanvasWidth } from './components/Layout';
import type { Editor, JSONContent } from '@tiptap/core';

function App() {
  const editorRef = useRef<EditorCoreRef>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<CanvasWidth>('normal');

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

  const handleUpdate = useCallback((content: JSONContent) => {
    // Content update handler - will be used for autosave in future phases
    console.debug('Editor content updated:', content);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Title and Width Selector */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">SERQ</h1>
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
