/**
 * PresetSection - Accordion section for preset category
 */

import { ReactNode } from 'react';

interface PresetSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  isDark: boolean;
}

export function PresetSection({
  title,
  isExpanded,
  onToggle,
  children,
  isDark,
}: PresetSectionProps) {
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';
  const textSecondary = isDark ? '#a1a1aa' : '#6b7280';
  const border = isDark ? '#3f3f46' : '#e5e7eb';
  const bgHover = isDark ? '#3f3f46' : '#f3f4f6';

  return (
    <div style={{ borderBottom: `1px solid ${border}` }}>
      {/* Section header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          color: textPrimary,
          fontSize: '14px',
          fontWeight: 500,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bgHover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>{title}</span>
        <span
          style={{
            color: textSecondary,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        >
          ▼
        </span>
      </button>

      {/* Section content */}
      <div
        style={{
          maxHeight: isExpanded ? '500px' : '0',
          overflow: 'hidden',
          transition: 'max-height 200ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
