/**
 * SpacingControls Component
 * Line spacing (paragraph) and character spacing (selection) controls
 */
import { useCallback, useRef } from 'react';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

interface SpacingControlsProps {
  editor: Editor;
  interfaceColors: InterfaceColors;
}

// Line height options (0.1 to 3)
const LINE_HEIGHT_OPTIONS = [
  '0.8', '0.9', '1', '1.15', '1.25', '1.5', '1.75', '2', '2.5', '3'
];

// Letter spacing options (expressed as em values)
const LETTER_SPACING_OPTIONS = [
  { value: '-0.1em', label: '0.1' },
  { value: '-0.05em', label: '0.5' },
  { value: 'normal', label: '1' },
  { value: '0.05em', label: '1.5' },
  { value: '0.1em', label: '2' },
  { value: '0.15em', label: '3' },
  { value: '0.2em', label: '4' },
  { value: '0.3em', label: '6' },
  { value: '0.5em', label: '8' },
  { value: '0.75em', label: '10' },
];

export function SpacingControls({ editor, interfaceColors }: SpacingControlsProps) {
  // Save selection before dropdown steals focus
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Get current spacing values
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const blockAttrs = ctx.editor.getAttributes('paragraph');
      const textAttrs = ctx.editor.getAttributes('textStyle');
      return {
        lineHeight: blockAttrs.lineHeight || null,
        letterSpacing: textAttrs.letterSpacing || null,
      };
    },
  });

  // Save selection when mouse enters the control
  const saveSelection = useCallback(() => {
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
  }, [editor]);

  const handleLineHeightChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('[SpacingControls] handleLineHeightChange:', value, 'savedSelection:', savedSelectionRef.current);

    // Step 1: Restore focus and selection
    if (savedSelectionRef.current) {
      const { from, to } = savedSelectionRef.current;
      editor.chain().focus().setTextSelection({ from, to }).run();
    } else {
      editor.commands.focus();
    }

    // Step 2: Apply the command (now sees updated selection)
    if (value === '') {
      editor.commands.unsetLineHeight();
    } else {
      editor.commands.setLineHeight(value);
    }
  }, [editor]);

  const handleLetterSpacingChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('[SpacingControls] handleLetterSpacingChange:', value, 'savedSelection:', savedSelectionRef.current);

    // Letter spacing requires text selection
    if (savedSelectionRef.current) {
      const { from, to } = savedSelectionRef.current;
      // Need actual text selected for letter spacing
      if (from !== to) {
        // Step 1: Restore focus and selection
        editor.chain().focus().setTextSelection({ from, to }).run();

        // Step 2: Apply the command (now sees updated selection)
        if (value === '' || value === 'normal') {
          editor.commands.unsetLetterSpacing();
        } else {
          editor.commands.setLetterSpacing(value);
        }
      } else {
        console.log('[SpacingControls] No text selected for letter spacing');
      }
    }
  }, [editor]);

  const dropdownStyle: React.CSSProperties = {
    backgroundColor: interfaceColors.bg,
    border: `1px solid ${interfaceColors.border}`,
    color: interfaceColors.textPrimary,
    borderRadius: '4px',
    padding: '4px 6px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '60px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: interfaceColors.textSecondary,
    marginBottom: '2px',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Line Spacing */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={labelStyle}>Line</span>
        <select
          value={state.lineHeight || '1'}
          onChange={handleLineHeightChange}
          onMouseDown={saveSelection}
          onFocus={saveSelection}
          style={dropdownStyle}
          title="Line Spacing (affects entire paragraph)"
        >
          <option value="1">1</option>
          {LINE_HEIGHT_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Character Spacing */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={labelStyle}>Char</span>
        <select
          value={state.letterSpacing || 'normal'}
          onChange={handleLetterSpacingChange}
          onMouseDown={saveSelection}
          onFocus={saveSelection}
          style={dropdownStyle}
          title="Character Spacing (affects selected text)"
        >
          {LETTER_SPACING_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SpacingControls;
