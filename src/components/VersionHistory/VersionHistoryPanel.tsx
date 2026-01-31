/**
 * Version History Panel
 * Full-screen modal showing version timeline with preview and restore
 */
import { useEffect, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useVersionHistory } from '../../hooks/useVersionHistory';
import { VersionPreview } from './VersionPreview';
import type { Version } from '../../lib/version-storage';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  interfaceColors: InterfaceColors;
}

export function VersionHistoryPanel({
  isOpen,
  onClose,
  editor,
  interfaceColors,
}: VersionHistoryPanelProps) {
  const {
    versions,
    selectedVersion,
    isLoading,
    loadVersions,
    selectVersion,
    restoreVersion,
    clearSelection,
  } = useVersionHistory();

  const [isRestoring, setIsRestoring] = useState(false);

  // Load versions when panel opens
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    } else {
      clearSelection();
    }
  }, [isOpen, loadVersions, clearSelection]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle restore
  const handleRestore = useCallback(async () => {
    if (!editor || !selectedVersion || isRestoring) return;

    const confirmed = window.confirm(
      `Restore document to version from ${new Date(selectedVersion.timestamp).toLocaleString()}?\n\nYour current work will be saved as a checkpoint before restore.`
    );

    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const success = await restoreVersion(editor);
      if (success) {
        onClose();
      } else {
        alert('Failed to restore version. Please try again.');
      }
    } finally {
      setIsRestoring(false);
    }
  }, [editor, selectedVersion, isRestoring, restoreVersion, onClose]);

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex-1 flex m-8 rounded-lg overflow-hidden shadow-2xl"
        style={{ backgroundColor: interfaceColors.bg }}
      >
        {/* Left sidebar - version list */}
        <div
          className="w-72 flex flex-col shrink-0"
          style={{
            backgroundColor: interfaceColors.bgSurface,
            borderRight: `1px solid ${interfaceColors.border}`,
          }}
        >
          {/* Header */}
          <div
            className="p-4 shrink-0"
            style={{ borderBottom: `1px solid ${interfaceColors.border}` }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: interfaceColors.textPrimary }}
            >
              Version History
            </h2>
            <p className="text-xs mt-1" style={{ color: interfaceColors.textMuted }}>
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* Version list */}
          <div className="flex-1 overflow-y-auto version-history-list">
            {isLoading && versions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm" style={{ color: interfaceColors.textMuted }}>
                  Loading versions...
                </p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm" style={{ color: interfaceColors.textMuted }}>
                  No versions saved yet.
                </p>
                <p className="text-xs mt-2" style={{ color: interfaceColors.textMuted }}>
                  Versions are created automatically every 30 seconds and when you save.
                </p>
              </div>
            ) : (
              <div className="py-2">
                {versions.map((version) => (
                  <VersionListItem
                    key={version.id}
                    version={version}
                    isSelected={selectedVersion?.id === version.id}
                    onSelect={() => selectVersion(version.id)}
                    formatRelativeTime={formatRelativeTime}
                    interfaceColors={interfaceColors}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview header with restore button */}
          <div
            className="flex items-center justify-between p-4 shrink-0"
            style={{ borderBottom: `1px solid ${interfaceColors.border}` }}
          >
            <h3 className="font-medium" style={{ color: interfaceColors.textPrimary }}>
              Preview
            </h3>
            <div className="flex items-center gap-3">
              {selectedVersion && (
                <button
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={{
                    backgroundColor: '#0066cc',
                    color: '#ffffff',
                    opacity: isRestoring ? 0.5 : 1,
                    cursor: isRestoring ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isRestoring ? 'Restoring...' : 'Restore This Version'}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded transition-colors"
                style={{
                  backgroundColor: interfaceColors.bgSurface,
                  border: `1px solid ${interfaceColors.border}`,
                  color: interfaceColors.textPrimary,
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Preview content */}
          <VersionPreview
            version={selectedVersion}
            interfaceColors={interfaceColors}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Version list item
 */
interface VersionListItemProps {
  version: Version;
  isSelected: boolean;
  onSelect: () => void;
  formatRelativeTime: (timestamp: number) => string;
  interfaceColors: InterfaceColors;
}

function VersionListItem({
  version,
  isSelected,
  onSelect,
  formatRelativeTime,
  interfaceColors,
}: VersionListItemProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 transition-colors"
      style={{
        backgroundColor: isSelected ? interfaceColors.bg : 'transparent',
        borderLeft: isSelected ? `3px solid #0066cc` : '3px solid transparent',
      }}
    >
      <div className="flex items-center gap-2">
        {version.is_checkpoint && (
          <span
            className="px-1.5 py-0.5 text-[10px] font-medium rounded"
            style={{
              backgroundColor: '#0066cc20',
              color: '#0066cc',
            }}
          >
            Checkpoint
          </span>
        )}
        <span
          className="text-xs"
          style={{
            color: isSelected
              ? interfaceColors.textPrimary
              : interfaceColors.textMuted,
          }}
        >
          {formatRelativeTime(version.timestamp)}
        </span>
      </div>

      {version.is_checkpoint && version.checkpoint_name ? (
        <p
          className="text-sm font-medium mt-1 truncate"
          style={{ color: interfaceColors.textPrimary }}
        >
          {version.checkpoint_name}
        </p>
      ) : (
        <p
          className="text-sm mt-1"
          style={{ color: interfaceColors.textSecondary }}
        >
          Auto-save
        </p>
      )}

      <p
        className="text-xs mt-1"
        style={{ color: interfaceColors.textMuted }}
      >
        {version.word_count.toLocaleString()} words
      </p>
    </button>
  );
}

export default VersionHistoryPanel;
