/**
 * CaseControls Component
 * Dropdown for text case transformations
 */
import { useState, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import type { CaseType } from '../../extensions/TextCase';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

interface CaseControlsProps {
  editor: Editor;
  interfaceColors: InterfaceColors;
}

const CASE_OPTIONS: { value: CaseType; label: string }[] = [
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'titlecase', label: 'Title Case' },
  { value: 'sentencecase', label: 'Sentence case' },
];

export function CaseControls({ editor, interfaceColors }: CaseControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Save selection when opening dropdown
  const handleOpen = useCallback(() => {
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
    setIsOpen(true);
  }, [editor]);

  const handleCaseChange = useCallback((caseType: CaseType) => {
    console.log('[CaseControls] handleCaseChange:', caseType, 'savedSelection:', savedSelectionRef.current);

    // Case change requires text selection
    if (savedSelectionRef.current) {
      const { from, to } = savedSelectionRef.current;
      if (from !== to) {
        // Step 1: Restore focus and selection
        editor.chain().focus().setTextSelection({ from, to }).run();

        // Step 2: Apply the command (now sees updated selection)
        editor.commands.setTextCase(caseType);
      } else {
        console.log('[CaseControls] No text selected for case change');
      }
    }

    setIsOpen(false);
  }, [editor]);

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: `1px solid ${interfaceColors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    color: interfaceColors.textSecondary,
    fontSize: '12px',
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    color: interfaceColors.textPrimary,
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        onMouseDown={() => {
          // Save selection before button click steals focus
          const { from, to } = editor.state.selection;
          savedSelectionRef.current = { from, to };
        }}
        style={buttonStyle}
        title="Change Case (select text first)"
      >
        <span>Aa</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: interfaceColors.bg,
              border: `1px solid ${interfaceColors.border}`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '140px',
              overflow: 'hidden',
            }}
          >
            {CASE_OPTIONS.map(({ value, label }) => (
              <div
                key={value}
                style={menuItemStyle}
                onClick={() => handleCaseChange(value)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = interfaceColors.bgSurface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CaseControls;
