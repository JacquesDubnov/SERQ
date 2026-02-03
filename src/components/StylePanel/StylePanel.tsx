/**
 * StylePanel - Slide-in panel for style presets
 *
 * Slides in from right, pushes content. Contains accordion sections
 * for Master Themes, Typography, Colors, Canvas, and Layout presets.
 */

import { useState } from 'react';
import { useStyleStore } from '../../stores/styleStore';
import {
  TYPOGRAPHY_PRESETS,
  COLOR_PRESETS,
  CANVAS_PRESETS,
  LAYOUT_PRESETS,
  MASTER_THEMES,
} from '../../lib/presets';
import { PresetSection } from './PresetSection';
import { PresetButton } from './PresetButton';
import { MasterThemeSection } from './MasterThemeSection';

interface StylePanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function StylePanel({ isOpen, onClose, isDark }: StylePanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('typography');

  const {
    currentTypography,
    currentColor,
    currentCanvas,
    currentLayout,
    currentMasterTheme,
    setTypography,
    setColor,
    setCanvas,
    setLayout,
    setMasterTheme,
    resetToDefaults,
  } = useStyleStore();

  const handleToggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Theme colors
  const bg = isDark ? '#1f1f23' : '#ffffff';
  const border = isDark ? '#3f3f46' : '#e5e7eb';
  const textPrimary = isDark ? '#f5f5f5' : '#1a1a1a';
  const textSecondary = isDark ? '#a1a1aa' : '#6b7280';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '320px',
        backgroundColor: bg,
        borderLeft: `1px solid ${border}`,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease-out',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 600, color: textPrimary }}>Styles</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={resetToDefaults}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: `1px solid ${border}`,
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: textSecondary,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: textSecondary,
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* Master Themes Section */}
        <MasterThemeSection
          isExpanded={expandedSection === 'master'}
          onToggle={() => handleToggleSection('master')}
          themes={MASTER_THEMES}
          currentTheme={currentMasterTheme}
          onSelectTheme={(id) => id && setMasterTheme(id)}
          isDark={isDark}
        />

        {/* Typography Section */}
        <PresetSection
          title="Typography"
          isExpanded={expandedSection === 'typography'}
          onToggle={() => handleToggleSection('typography')}
          isDark={isDark}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '8px 16px' }}>
            {TYPOGRAPHY_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                name={preset.name}
                isActive={currentTypography === preset.id}
                onClick={() => setTypography(preset.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </PresetSection>

        {/* Colors Section */}
        <PresetSection
          title="Colors"
          isExpanded={expandedSection === 'colors'}
          onToggle={() => handleToggleSection('colors')}
          isDark={isDark}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '8px 16px' }}>
            {COLOR_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                name={preset.name}
                isActive={currentColor === preset.id}
                onClick={() => setColor(preset.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </PresetSection>

        {/* Canvas Section */}
        <PresetSection
          title="Canvas"
          isExpanded={expandedSection === 'canvas'}
          onToggle={() => handleToggleSection('canvas')}
          isDark={isDark}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '8px 16px' }}>
            {CANVAS_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                name={preset.name}
                isActive={currentCanvas === preset.id}
                onClick={() => setCanvas(preset.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </PresetSection>

        {/* Layout Section */}
        <PresetSection
          title="Layout"
          isExpanded={expandedSection === 'layout'}
          onToggle={() => handleToggleSection('layout')}
          isDark={isDark}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '8px 16px' }}>
            {LAYOUT_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                name={preset.name}
                isActive={currentLayout === preset.id}
                onClick={() => setLayout(preset.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </PresetSection>
      </div>
    </div>
  );
}
