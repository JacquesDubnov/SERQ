/**
 * HeadingContextMenu - Right-click context menu for heading buttons
 *
 * Provides:
 * - Assign current style to heading
 * - Customize style (inline typography panel)
 * - Reset heading style
 * - Dividing line toggle with inline settings
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { cn } from '@/lib/tiptap-utils';
import { useStyleStore, type HeadingLevel, type HeadingDividerConfig, type HeadingCustomStyle } from '@/stores/styleStore';
import { captureComputedStyle } from './style-capture';
import { DividerSettings } from './divider-settings';
import { HeadingStyleSettings } from './heading-style-settings';

import '@/components/tiptap-ui-primitive/dropdown-menu/dropdown-menu.scss';
import './heading-context-menu.scss';

interface HeadingContextMenuProps {
  level: HeadingLevel;
  editor: Editor;
  children: React.ReactNode;
}

/**
 * Check if heading has any customization (non-null values or divider enabled)
 */
function hasCustomization(style: HeadingCustomStyle | null): boolean {
  if (!style) return false;
  return (
    style.fontFamily !== null ||
    style.fontSize !== null ||
    style.fontWeight !== null ||
    style.letterSpacing !== null ||
    style.lineHeight !== null ||
    style.bold ||
    style.italic ||
    style.underline ||
    style.strikethrough ||
    style.textColor !== null ||
    style.backgroundColor !== null ||
    style.divider?.enabled === true
  );
}

export function HeadingContextMenu({ level, editor, children }: HeadingContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showCustomize, setShowCustomize] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const {
    headingCustomStyles,
    assignStyleToHeading,
    resetHeadingStyle,
    setHeadingDivider,
    clearHeadingDivider,
  } = useStyleStore();

  const currentStyle = headingCustomStyles[`h${level}` as keyof typeof headingCustomStyles];
  const hasDivider = currentStyle?.divider?.enabled ?? false;
  const hasAnyCustomization = hasCustomization(currentStyle);

  // Auto-expand customize panel when menu opens if there's existing customization
  useEffect(() => {
    if (open && hasAnyCustomization) {
      setShowCustomize(true);
    } else if (!open) {
      setShowCustomize(false);
    }
  }, [open, hasAnyCustomization]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setOpen(true);
  }, []);

  const handleAssignStyle = useCallback(() => {
    const capturedStyle = captureComputedStyle(editor);
    // Preserve existing divider config if present
    if (currentStyle?.divider) {
      capturedStyle.divider = currentStyle.divider;
    }

    // Clear inline marks from ALL headings of this level
    // This ensures CSS variables take effect (inline styles override CSS)
    const { doc, tr } = editor.state;
    let modified = false;

    doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.level === level) {
        // Clear marks from all text in this heading
        node.descendants((child, childPos) => {
          if (child.isText && child.marks.length > 0) {
            const from = pos + 1 + childPos;
            const to = from + child.nodeSize;
            // Remove all marks from this text
            child.marks.forEach((mark) => {
              tr.removeMark(from, to, mark.type);
            });
            modified = true;
          }
        });
      }
    });

    // Apply the transaction if we made changes
    if (modified) {
      editor.view.dispatch(tr);
    }

    // Now assign the style (applies CSS variables)
    assignStyleToHeading(level, capturedStyle);
    setOpen(false);
  }, [editor, level, currentStyle, assignStyleToHeading]);

  const handleResetStyle = useCallback(() => {
    resetHeadingStyle(level);
    setOpen(false);
  }, [level, resetHeadingStyle]);

  const handleDividerToggle = useCallback(() => {
    if (hasDivider) {
      clearHeadingDivider(level);
    } else {
      // Enable with default settings
      const defaultConfig: HeadingDividerConfig = {
        enabled: true,
        position: 'below',
        distance: 0.5,
        color: null,
        thickness: 1,
        double: false,
        style: 'solid',
      };
      setHeadingDivider(level, defaultConfig);
    }
  }, [level, hasDivider, setHeadingDivider, clearHeadingDivider]);

  const handleDividerChange = useCallback(
    (config: HeadingDividerConfig) => {
      setHeadingDivider(level, config);
    },
    [level, setHeadingDivider]
  );

  const handleCustomizeToggle = useCallback(() => {
    setShowCustomize((prev) => !prev);
  }, []);

  const handleCustomStyleChange = useCallback(
    (style: HeadingCustomStyle) => {
      assignStyleToHeading(level, style);
    },
    [level, assignStyleToHeading]
  );

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <div ref={triggerRef} onContextMenu={handleContextMenu}>
        {children}
      </div>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={cn('tiptap-dropdown-menu', 'heading-context-menu')}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
          }}
          sideOffset={0}
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="heading-context-menu-card">
            <div className="heading-context-menu-header">
              H{level} Style Options
            </div>

            <div className="heading-context-menu-body">
              {/* Assign Style */}
              <DropdownMenuPrimitive.Item
                className="heading-context-menu-item"
                onSelect={handleAssignStyle}
              >
                <span className="item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v18M3 12h18" />
                  </svg>
                </span>
                <span>Assign current style</span>
              </DropdownMenuPrimitive.Item>

              {/* Customize Style */}
              <DropdownMenuPrimitive.Item
                className="heading-context-menu-item expandable-item"
                onSelect={(e) => {
                  e.preventDefault(); // Keep menu open
                  handleCustomizeToggle();
                }}
              >
                <span className="item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </span>
                <span>Customize style</span>
                <span className={cn('expand-indicator', showCustomize && 'expanded')}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </DropdownMenuPrimitive.Item>

              {/* Customize Style Settings (inline expansion, no buttons) */}
              {showCustomize && (
                <HeadingStyleSettings
                  level={level}
                  currentStyle={currentStyle}
                  onChange={handleCustomStyleChange}
                />
              )}

              {/* Reset Style */}
              <DropdownMenuPrimitive.Item
                className="heading-context-menu-item"
                onSelect={handleResetStyle}
                disabled={!currentStyle}
              >
                <span className="item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </span>
                <span>Reset to default</span>
              </DropdownMenuPrimitive.Item>

              <div className="heading-context-menu-separator" />

              {/* Dividing Line Toggle */}
              <DropdownMenuPrimitive.Item
                className="heading-context-menu-item checkbox-item"
                onSelect={(e) => {
                  e.preventDefault(); // Keep menu open when toggling
                  handleDividerToggle();
                }}
              >
                <span className={cn('checkbox-indicator', hasDivider && 'checked')}>
                  {hasDivider && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span>Dividing line</span>
              </DropdownMenuPrimitive.Item>

              {/* Divider Settings (inline expansion) */}
              {hasDivider && currentStyle?.divider && (
                <DividerSettings
                  config={currentStyle.divider}
                  onChange={handleDividerChange}
                />
              )}

              {/* Save/Cancel buttons at the very bottom - only show if any panel is expanded */}
              {(showCustomize || hasDivider) && (
                <div className="style-setting-actions">
                  <button
                    type="button"
                    className="action-button cancel-button"
                    onClick={() => {
                      setShowCustomize(false);
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="action-button save-button"
                    onClick={() => setOpen(false)}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export default HeadingContextMenu;
