/**
 * DividerSettings - Inline divider configuration panel
 *
 * Shown when "Dividing line" is checked in the heading context menu.
 */

import { useCallback } from 'react';
import type { HeadingDividerConfig } from '@/stores/styleStore';

interface DividerSettingsProps {
  config: HeadingDividerConfig;
  onChange: (config: HeadingDividerConfig) => void;
}

const POSITION_OPTIONS = [
  { value: 'below', label: 'Below' },
  { value: 'above', label: 'Above' },
  { value: 'both', label: 'Both' },
] as const;

type DividerStyleOption = HeadingDividerConfig['style'] | 'double';

const STYLE_OPTIONS: Array<{ value: DividerStyleOption; label: string }> = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' }, // 'double' is handled specially - sets double flag
];

// Simplified style options - wavy/zigzag/gradient removed for now as they need more complex CSS

export function DividerSettings({ config, onChange }: DividerSettingsProps) {
  const updateConfig = useCallback(
    (updates: Partial<HeadingDividerConfig>) => {
      onChange({ ...config, ...updates });
    },
    [config, onChange]
  );

  const handlePositionChange = useCallback(
    (position: HeadingDividerConfig['position']) => {
      updateConfig({ position });
    },
    [updateConfig]
  );

  const handleDistanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && value >= 0 && value <= 5) {
        updateConfig({ distance: value });
      }
    },
    [updateConfig]
  );

  const handleThicknessChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && value >= 0.25 && value <= 10) {
        updateConfig({ thickness: value });
      }
    },
    [updateConfig]
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      updateConfig({ color: value || null });
    },
    [updateConfig]
  );

  const handleStyleChange = useCallback(
    (style: DividerStyleOption) => {
      // Handle double as a special case - it's both a style and a flag
      // Double border requires at least 3px thickness to render properly
      if (style === 'double') {
        const newThickness = Math.max(config.thickness, 3);
        updateConfig({ style: 'solid', double: true, thickness: newThickness });
      } else {
        updateConfig({ style: style as HeadingDividerConfig['style'], double: false });
      }
    },
    [config.thickness, updateConfig]
  );

  const currentStyleValue: DividerStyleOption = config.double ? 'double' : config.style;

  return (
    <div className="divider-settings" onClick={(e) => e.stopPropagation()}>
      {/* Position */}
      <div className="divider-setting-row">
        <label className="setting-label">Position</label>
        <div className="setting-options">
          {POSITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`option-button ${config.position === opt.value ? 'active' : ''}`}
              onClick={() => handlePositionChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="divider-setting-row">
        <label className="setting-label">Style</label>
        <div className="setting-options">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`option-button ${currentStyleValue === opt.value ? 'active' : ''}`}
              onClick={() => handleStyleChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div className="divider-setting-row">
        <label className="setting-label">Distance</label>
        <div className="setting-input-group">
          <input
            type="number"
            className="setting-input"
            value={config.distance}
            onChange={handleDistanceChange}
            min={0}
            max={5}
            step={0.1}
          />
          <span className="setting-unit">lines</span>
        </div>
      </div>

      {/* Thickness */}
      <div className="divider-setting-row">
        <label className="setting-label">Thickness</label>
        <div className="setting-input-group">
          <input
            type="number"
            className="setting-input"
            value={config.thickness}
            onChange={handleThicknessChange}
            min={0.25}
            max={10}
            step={0.25}
          />
          <span className="setting-unit">px</span>
        </div>
      </div>

      {/* Color */}
      <div className="divider-setting-row">
        <label className="setting-label">Color</label>
        <div className="setting-input-group color-group">
          <input
            type="color"
            className="color-picker"
            value={config.color || '#000000'}
            onChange={handleColorChange}
          />
        </div>
      </div>
    </div>
  );
}

export default DividerSettings;
