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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          onClose();
        }
        return;
      }

      // Up/Down arrow navigation for version list
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        if (versions.length === 0) return;

        const currentIndex = selectedVersion
          ? versions.findIndex(v => v.id === selectedVersion.id)
          : -1;

        let newIndex: number;
        if (e.key === 'ArrowUp') {
          newIndex = currentIndex <= 0 ? versions.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= versions.length - 1 ? 0 : currentIndex + 1;
        }

        selectVersion(versions[newIndex].id);
      }

      // Enter to restore
      if (e.key === 'Enter' && selectedVersion && !showConfirmModal) {
        setShowConfirmModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, versions, selectedVersion, selectVersion, showConfirmModal]);

  // Handle restore click - show confirmation modal
  const handleRestoreClick = useCallback(() => {
    if (!selectedVersion) return;
    setShowConfirmModal(true);
  }, [selectedVersion]);

  // Confirm restore
  const handleConfirmRestore = useCallback(async () => {
    if (!editor || !selectedVersion || isRestoring) return;

    setIsRestoring(true);
    try {
      const success = await restoreVersion(editor);
      if (success) {
        setShowConfirmModal(false);
        onClose();
      } else {
        alert('Failed to restore version. Please try again.');
      }
    } finally {
      setIsRestoring(false);
    }
  }, [editor, selectedVersion, isRestoring, restoreVersion, onClose]);

  // Format timestamp
  const formatTimestamp = (timestamp: number): { relative: string; absolute: string } => {
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let relative: string;
    if (minutes < 1) relative = 'Just now';
    else if (minutes < 60) relative = `${minutes}m ago`;
    else if (hours < 24) relative = `${hours}h ago`;
    else if (days < 7) relative = `${days}d ago`;
    else relative = date.toLocaleDateString();

    const absolute = date.toLocaleString();

    return { relative, absolute };
  };

  // Calculate version number (newest = highest number)
  const getVersionNumber = (index: number): number => {
    return versions.length - index;
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
            className="px-4 py-4 shrink-0"
            style={{ borderBottom: `1px solid ${interfaceColors.border}` }}
          >
            <h2
              className="text-base font-semibold"
              style={{ color: interfaceColors.textPrimary }}
            >
              Version History
            </h2>
            <p className="text-xs mt-1" style={{ color: interfaceColors.textMuted }}>
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* Version list - scrollable */}
          <div className="flex-1 overflow-y-auto">
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
                  Save your document (Cmd+S) to create versions.
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {versions.map((version, index) => (
                  <VersionCard
                    key={version.id}
                    version={version}
                    versionNumber={getVersionNumber(index)}
                    isSelected={selectedVersion?.id === version.id}
                    onSelect={() => selectVersion(version.id)}
                    formatTimestamp={formatTimestamp}
                    interfaceColors={interfaceColors}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - preview (no overflow, fixed height) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview header with restore button */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: `1px solid ${interfaceColors.border}` }}
          >
            <div>
              <h3 className="font-medium" style={{ color: interfaceColors.textPrimary }}>
                Preview
              </h3>
              {selectedVersion && (
                <p className="text-xs mt-1" style={{ color: interfaceColors.textMuted }}>
                  {selectedVersion.word_count.toLocaleString()} words
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {selectedVersion && (
                <button
                  onClick={handleRestoreClick}
                  disabled={isRestoring}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={{
                    backgroundColor: '#0066cc',
                    color: '#ffffff',
                    opacity: isRestoring ? 0.5 : 1,
                    cursor: isRestoring ? 'not-allowed' : 'pointer',
                  }}
                >
                  Restore This Version
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

          {/* Preview content - fixed height, internal scroll only */}
          <VersionPreview
            version={selectedVersion}
            interfaceColors={interfaceColors}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedVersion && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="rounded-lg shadow-xl p-6 max-w-md mx-4"
            style={{ backgroundColor: interfaceColors.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: interfaceColors.textPrimary }}
            >
              Restore Version?
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: interfaceColors.textSecondary }}
            >
              This will restore your document to the version from{' '}
              <strong>{new Date(selectedVersion.timestamp).toLocaleString()}</strong>.
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: interfaceColors.textMuted }}
            >
              Your current work will be saved as a checkpoint before restoring.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm rounded transition-colors"
                style={{
                  backgroundColor: interfaceColors.bgSurface,
                  border: `1px solid ${interfaceColors.border}`,
                  color: interfaceColors.textPrimary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium rounded transition-colors"
                style={{
                  backgroundColor: '#0066cc',
                  color: '#ffffff',
                  opacity: isRestoring ? 0.5 : 1,
                }}
              >
                {isRestoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Version card component
 */
interface VersionCardProps {
  version: Version;
  versionNumber: number;
  isSelected: boolean;
  onSelect: () => void;
  formatTimestamp: (timestamp: number) => { relative: string; absolute: string };
  interfaceColors: InterfaceColors;
}

function VersionCard({
  version,
  versionNumber,
  isSelected,
  onSelect,
  formatTimestamp,
  interfaceColors,
}: VersionCardProps) {
  const { relative, absolute } = formatTimestamp(version.timestamp);

  // Determine tag type and color
  const getTagInfo = (): { label: string; bgColor: string; textColor: string } => {
    if (version.is_checkpoint) {
      if (version.checkpoint_name?.toLowerCase().includes('restore')) {
        return { label: 'Restored', bgColor: '#3b82f620', textColor: '#3b82f6' };
      }
      return { label: 'Checkpoint', bgColor: '#3b82f620', textColor: '#3b82f6' };
    }
    return { label: 'Version', bgColor: '#22c55e20', textColor: '#22c55e' };
  };

  const tagInfo = getTagInfo();

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-lg transition-all"
      style={{
        backgroundColor: isSelected ? interfaceColors.bg : 'transparent',
        border: isSelected
          ? `2px solid #0066cc`
          : `1px solid ${interfaceColors.border}`,
      }}
    >
      {/* Top row: Timestamp (bold, large) + Tag */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-bold"
          style={{ color: interfaceColors.textPrimary }}
          title={absolute}
        >
          {relative}
        </span>
        <span
          className="px-2 py-0.5 text-[10px] font-medium rounded"
          style={{
            backgroundColor: tagInfo.bgColor,
            color: tagInfo.textColor,
          }}
        >
          {tagInfo.label}
        </span>
      </div>

      {/* Checkpoint name if exists */}
      {version.is_checkpoint && version.checkpoint_name && (
        <p
          className="text-xs mb-2 truncate"
          style={{ color: interfaceColors.textSecondary }}
        >
          {version.checkpoint_name}
        </p>
      )}

      {/* Bottom row: Version number + Word count */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs"
          style={{ color: interfaceColors.textMuted }}
        >
          v{versionNumber}
        </span>
        <span
          className="text-xs"
          style={{ color: interfaceColors.textMuted }}
        >
          {version.word_count.toLocaleString()} words
        </span>
      </div>
    </button>
  );
}

export default VersionHistoryPanel;
