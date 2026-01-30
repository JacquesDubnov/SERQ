import { useRef, useState, useEffect, useCallback } from 'react';
import { EditorCore, EditorToolbar, type EditorCoreRef } from './components/Editor';
import type { Editor, JSONContent } from '@tiptap/core';

function App() {
  const editorRef = useRef<EditorCoreRef>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">SERQ</h1>
      </header>

      {/* Toolbar */}
      {editor && <EditorToolbar editor={editor} />}

      {/* Editor Area */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          <EditorCore
            ref={editorRef}
            placeholder="Start writing..."
            onUpdate={handleUpdate}
            className="h-full"
          />
        </div>
      </main>
    </div>
  );
}

export default App;
