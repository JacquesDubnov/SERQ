/**
 * MasterThemeSection - Special section for master themes with visual previews
 */

import { MasterTheme } from '../../lib/presets';

interface MasterThemeSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  themes: readonly MasterTheme[];
  currentTheme: string | null;
  onSelectTheme: (id: string | null) => void;
  isDark: boolean;
}

export function MasterThemeSection({
  isExpanded,
  onToggle,
  themes,
  currentTheme,
  onSelectTheme,
  isDark,
}: MasterThemeSectionProps) {
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';
  const textSecondary = isDark ? '#a1a1aa' : '#6b7280';
  const border = isDark ? '#3f3f46' : '#e5e7eb';
  const bgHover = isDark ? '#3f3f46' : '#f3f4f6';
  const bgCard = isDark ? '#27272a' : '#f5f5f5';
  const borderActive = isDark ? '#a78bfa' : '#8b5cf6';

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
        <span>Master Themes</span>
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
          maxHeight: isExpanded ? '800px' : '0',
          overflow: 'hidden',
          transition: 'max-height 200ms ease-out',
        }}
      >
        <div style={{ padding: '8px 16px' }}>
          {/* Clear theme option */}
          <button
            onClick={() => onSelectTheme(null)}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: '8px',
              fontSize: '13px',
              border: `1px solid ${currentTheme === null ? borderActive : border}`,
              borderRadius: '6px',
              backgroundColor: bgCard,
              color: textSecondary,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Custom (No Master Theme)
          </button>

          {/* Theme cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={currentTheme === theme.id}
                onClick={() => onSelectTheme(theme.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: MasterTheme;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
}

function ThemeCard({ theme, isActive, onClick, isDark }: ThemeCardProps) {
  const bgCard = isDark ? '#27272a' : '#f5f5f5';
  const border = isDark ? '#3f3f46' : '#e5e7eb';
  const borderActive = isDark ? '#a78bfa' : '#8b5cf6';
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';

  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px',
        border: `1px solid ${isActive ? borderActive : border}`,
        borderRadius: '8px',
        backgroundColor: bgCard,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 100ms ease',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>
        {theme.name}
      </div>
    </button>
  );
}
