/**
 * PresetButton - Individual preset selection button
 */

interface PresetButtonProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
}

export function PresetButton({ name, isActive, onClick, isDark }: PresetButtonProps) {
  const bg = isDark ? '#27272a' : '#f5f5f5';
  const bgActive = isDark ? '#3f3f46' : '#e5e7eb';
  const bgHover = isDark ? '#3f3f46' : '#e5e7eb';
  const border = isDark ? '#3f3f46' : '#e5e7eb';
  const borderActive = isDark ? '#a78bfa' : '#8b5cf6';
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';

  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 12px',
        fontSize: '13px',
        border: `1px solid ${isActive ? borderActive : border}`,
        borderRadius: '6px',
        backgroundColor: isActive ? bgActive : bg,
        color: textPrimary,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 100ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = bgHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = bg;
        }
      }}
    >
      {name}
    </button>
  );
}
