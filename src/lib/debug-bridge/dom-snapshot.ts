/**
 * SERQ DOM State Dumper
 * 
 * Captures a snapshot of the current DOM state and writes it to the debug log.
 * Claude Code can trigger this via a Tauri command to understand the current UI
 * without needing to visually inspect the app.
 * 
 * What it captures:
 * - Active element and focus state
 * - All visible error/warning indicators
 * - Editor content structure (headings, paragraphs, lists, etc.)
 * - Open modals/dialogs/popovers
 * - Current page/scroll position
 * - CSS computed styles on key elements
 */

import { debugLog } from './index';

interface DOMSnapshot {
  activeElement: string;
  title: string;
  bodyClasses: string;
  editorContent: {
    nodeCount: number;
    structure: string[];
    textLength: number;
  } | null;
  visibleDialogs: string[];
  visibleErrors: string[];
  scrollPosition: { x: number; y: number };
  viewportSize: { width: number; height: number };
  customState: Record<string, unknown>;
}

/** Describe an element concisely */
function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = el.className && typeof el.className === 'string'
    ? `.${el.className.split(' ').filter(Boolean).join('.')}`
    : '';
  return `${tag}${id}${classes}`;
}

/** Capture the current editor content structure */
function captureEditorStructure(): DOMSnapshot['editorContent'] {
  const editor = document.querySelector('.tiptap.ProseMirror');
  if (!editor) return null;

  const nodes: string[] = [];
  let textLength = 0;

  editor.childNodes.forEach((node) => {
    if (node instanceof Element) {
      const tag = node.tagName.toLowerCase();
      const text = node.textContent || '';
      textLength += text.length;
      
      // Summarize content
      const preview = text.length > 60 ? text.substring(0, 60) + '...' : text;
      nodes.push(`<${tag}> ${preview}`);
    }
  });

  return {
    nodeCount: nodes.length,
    structure: nodes.slice(0, 50), // Cap at 50 nodes to avoid huge dumps
    textLength,
  };
}

/** Take a full DOM snapshot */
export function captureDOMSnapshot(extraState?: Record<string, unknown>): DOMSnapshot {
  const snapshot: DOMSnapshot = {
    activeElement: document.activeElement ? describeElement(document.activeElement) : 'none',
    title: document.title,
    bodyClasses: document.documentElement.className,
    editorContent: captureEditorStructure(),
    visibleDialogs: [],
    visibleErrors: [],
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY,
    },
    viewportSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    customState: extraState || {},
  };

  // Find visible dialogs/modals
  document.querySelectorAll('[role="dialog"], [role="alertdialog"], [data-state="open"]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      snapshot.visibleDialogs.push(describeElement(el));
    }
  });

  // Find visible error indicators
  document.querySelectorAll('[class*="error"], [class*="Error"], [data-error], [aria-invalid="true"]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      snapshot.visibleErrors.push(`${describeElement(el)}: ${el.textContent?.substring(0, 100)}`);
    }
  });

  return snapshot;
}

/** Dump the current DOM state to the debug log */
export function dumpDOMState(label?: string): void {
  const snapshot = captureDOMSnapshot();
  debugLog('info', `[DOM-DUMP${label ? ': ' + label : ''}]`, snapshot);
}

// Expose globally so Claude Code can trigger it from the Rust side or JS console
if (typeof window !== 'undefined') {
  (window as any).__serqDumpDOM = dumpDOMState;
  (window as any).__serqSnapshot = captureDOMSnapshot;
}
